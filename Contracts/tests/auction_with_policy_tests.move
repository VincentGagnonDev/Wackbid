#[test_only]
module contracts::auction_with_policy_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::kiosk::Kiosk;
    use sui::transfer_policy::{Self as tp, TransferPolicy};
    use sui::package;
    use contracts::auction_house::{Self, AuctionHouse, AdminCap};
    use contracts::auction::{Self, Auction};

    // Test NFT with Transfer Policy
    public struct PolicyNFT has key, store {
        id: sui::object::UID,
        name: vector<u8>,
        rarity: u8,
    }

    // One-Time-Witness for creating Transfer Policy
    public struct AUCTION_WITH_POLICY_TESTS has drop {}

    // Test addresses
    const ADMIN: address = @0xAD;
    const CREATOR: address = @0xC1;
    const BIDDER1: address = @0xB1;
    const BIDDER2: address = @0xB2;
    const BIDDER3: address = @0xB3;

    // Helper: Create NFT
    fun create_policy_nft(scenario: &mut Scenario, name: vector<u8>, rarity: u8): PolicyNFT {
        PolicyNFT {
            id: sui::object::new(ts::ctx(scenario)),
            name,
            rarity,
        }
    }

    // Helper: Setup auction house and clock
    fun setup_auction_house(scenario: &mut Scenario) {
        ts::next_tx(scenario, ADMIN);
        {
            auction_house::init_for_testing(ts::ctx(scenario));
        };
        
        ts::next_tx(scenario, ADMIN);
        {
            let clock = clock::create_for_testing(ts::ctx(scenario));
            clock::share_for_testing(clock);
        };
    }

    // Helper: Create transfer policy
    fun create_transfer_policy(scenario: &mut Scenario, publisher: address) {
        ts::next_tx(scenario, publisher);
        {
            // Create a publisher object for the PolicyNFT type
            let otw = AUCTION_WITH_POLICY_TESTS {};
            let publisher_obj = package::test_claim(otw, ts::ctx(scenario));
            
            // Create transfer policy
            let (policy, policy_cap) = tp::new<PolicyNFT>(
                &publisher_obj,
                ts::ctx(scenario)
            );
            
            // Share the policy and transfer cap to publisher
            sui::transfer::public_share_object(policy);
            sui::transfer::public_transfer(policy_cap, publisher);
            sui::transfer::public_transfer(publisher_obj, publisher);
        };
    }

    // Helper: Get shared objects
    fun take_shared<T: key>(scenario: &mut Scenario): T {
        ts::take_shared<T>(scenario)
    }

    #[test]
    fun test_create_auction_with_locked_nft() {
        let mut scenario = ts::begin(ADMIN);
        setup_auction_house(&mut scenario);
        create_transfer_policy(&mut scenario, CREATOR);
        
        // Creator creates auction with locked NFT
        ts::next_tx(&mut scenario, CREATOR);
        {
            let auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let policy = take_shared<TransferPolicy<PolicyNFT>>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            
            let nft = create_policy_nft(&mut scenario, b"Rare NFT #1", 5);
            let expiry_time = 1000000;
            
            let auction = auction::create_auction_with_lock<PolicyNFT, SUI>(
                &auction_house,
                &mut kiosk,
                &policy,
                nft,
                expiry_time,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            // Verify auction was created
            assert!(auction::is_active(&auction), 0);
            assert!(auction::get_creator(&auction) == CREATOR, 1);
            
            sui::transfer::public_transfer(auction, CREATOR);
            
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(policy);
            ts::return_shared(clock);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_finalize_auction_with_locked_nft_and_winner() {
        let mut scenario = ts::begin(ADMIN);
        setup_auction_house(&mut scenario);
        create_transfer_policy(&mut scenario, CREATOR);
        
        // Set 5% fee
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut auction_house = take_shared<AuctionHouse>(&mut scenario);
            auction_house::change_fee_percentage(&admin_cap, &mut auction_house, 500);
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(auction_house);
        };
        
        // Creator creates auction with locked NFT
        ts::next_tx(&mut scenario, CREATOR);
        {
            let auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let policy = take_shared<TransferPolicy<PolicyNFT>>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            
            let nft = create_policy_nft(&mut scenario, b"Legendary NFT", 10);
            let expiry_time = 1000000;
            
            let auction = auction::create_auction_with_lock<PolicyNFT, SUI>(
                &auction_house,
                &mut kiosk,
                &policy,
                nft,
                expiry_time,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            sui::transfer::public_transfer(auction, CREATOR);
            
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(policy);
            ts::return_shared(clock);
        };
        
        // Bidder 1 places bid
        ts::next_tx(&mut scenario, BIDDER1);
        {
            let mut auction = ts::take_from_address<Auction<PolicyNFT, SUI>>(&scenario, CREATOR);
            let clock = take_shared<Clock>(&mut scenario);
            
            let bid = coin::mint_for_testing<SUI>(200_000_000, ts::ctx(&mut scenario)); // 200 SUI
            auction::place_bid(&mut auction, bid, &clock, ts::ctx(&mut scenario));
            
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(clock);
        };
        
        // Advance time past expiry
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut clock = take_shared<Clock>(&mut scenario);
            clock::increment_for_testing(&mut clock, 1000001);
            ts::return_shared(clock);
        };
        
        // Finalize auction with locked NFT
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let policy = take_shared<TransferPolicy<PolicyNFT>>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            let auction = ts::take_from_address<Auction<PolicyNFT, SUI>>(&scenario, CREATOR);
            
            auction::finalize_auction_with_lock(
                &mut auction_house,
                &mut kiosk,
                auction,
                &policy,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(policy);
            ts::return_shared(clock);
        };
        
        // Verify creator received payment (200 SUI - 5% = 190 SUI)
        ts::next_tx(&mut scenario, CREATOR);
        {
            let payment = ts::take_from_address<Coin<SUI>>(&scenario, CREATOR);
            assert!(coin::value(&payment) == 190_000_000, 0);
            ts::return_to_address(CREATOR, payment);
        };
        
        // Verify winner received the NFT
        ts::next_tx(&mut scenario, BIDDER1);
        {
            assert!(ts::has_most_recent_for_address<PolicyNFT>(BIDDER1), 1);
            let nft = ts::take_from_address<PolicyNFT>(&scenario, BIDDER1);
            assert!(nft.rarity == 10, 2);
            ts::return_to_address(BIDDER1, nft);
        };
        
        // Verify platform collected 5% fee
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut auction_house = take_shared<AuctionHouse>(&mut scenario);
            
            let fees = auction_house::withdraw_fee<SUI>(&admin_cap, &mut auction_house, ts::ctx(&mut scenario));
            assert!(coin::value(&fees) == 10_000_000, 3); // 5% of 200 = 10 SUI
            
            sui::transfer::public_transfer(fees, ADMIN);
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(auction_house);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_finalize_locked_auction_no_bids_returns_to_creator() {
        let mut scenario = ts::begin(ADMIN);
        setup_auction_house(&mut scenario);
        create_transfer_policy(&mut scenario, CREATOR);
        
        // Creator creates auction with locked NFT
        ts::next_tx(&mut scenario, CREATOR);
        {
            let auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let policy = take_shared<TransferPolicy<PolicyNFT>>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            
            let nft = create_policy_nft(&mut scenario, b"Unsold NFT", 3);
            let expiry_time = 1000000;
            
            let auction = auction::create_auction_with_lock<PolicyNFT, SUI>(
                &auction_house,
                &mut kiosk,
                &policy,
                nft,
                expiry_time,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            sui::transfer::public_transfer(auction, CREATOR);
            
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(policy);
            ts::return_shared(clock);
        };
        
        // Advance time past expiry (no bids placed)
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut clock = take_shared<Clock>(&mut scenario);
            clock::increment_for_testing(&mut clock, 1000001);
            ts::return_shared(clock);
        };
        
        // Finalize auction without bids
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let policy = take_shared<TransferPolicy<PolicyNFT>>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            let auction = ts::take_from_address<Auction<PolicyNFT, SUI>>(&scenario, CREATOR);
            
            auction::finalize_auction_with_lock(
                &mut auction_house,
                &mut kiosk,
                auction,
                &policy,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(policy);
            ts::return_shared(clock);
        };
        
        // Verify NFT was returned to creator
        ts::next_tx(&mut scenario, CREATOR);
        {
            assert!(ts::has_most_recent_for_address<PolicyNFT>(CREATOR), 0);
            let nft = ts::take_from_address<PolicyNFT>(&scenario, CREATOR);
            assert!(nft.name == b"Unsold NFT", 1);
            ts::return_to_address(CREATOR, nft);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_multiple_bids_on_locked_nft_auction() {
        let mut scenario = ts::begin(ADMIN);
        setup_auction_house(&mut scenario);
        create_transfer_policy(&mut scenario, CREATOR);
        
        // Create auction
        ts::next_tx(&mut scenario, CREATOR);
        {
            let auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let policy = take_shared<TransferPolicy<PolicyNFT>>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            
            let nft = create_policy_nft(&mut scenario, b"Hot NFT", 8);
            let auction = auction::create_auction_with_lock<PolicyNFT, SUI>(
                &auction_house,
                &mut kiosk,
                &policy,
                nft,
                1000000,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(policy);
            ts::return_shared(clock);
        };
        
        // Bidder 1: 100 SUI
        ts::next_tx(&mut scenario, BIDDER1);
        {
            let mut auction = ts::take_from_address<Auction<PolicyNFT, SUI>>(&scenario, CREATOR);
            let clock = take_shared<Clock>(&mut scenario);
            let bid = coin::mint_for_testing<SUI>(100_000_000, ts::ctx(&mut scenario));
            auction::place_bid(&mut auction, bid, &clock, ts::ctx(&mut scenario));
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(clock);
        };
        
        // Bidder 2: 250 SUI (outbids Bidder 1)
        ts::next_tx(&mut scenario, BIDDER2);
        {
            let mut auction = ts::take_from_address<Auction<PolicyNFT, SUI>>(&scenario, CREATOR);
            let clock = take_shared<Clock>(&mut scenario);
            let bid = coin::mint_for_testing<SUI>(250_000_000, ts::ctx(&mut scenario));
            auction::place_bid(&mut auction, bid, &clock, ts::ctx(&mut scenario));
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(clock);
        };
        
        // Bidder 3: 500 SUI (outbids Bidder 2)
        ts::next_tx(&mut scenario, BIDDER3);
        {
            let mut auction = ts::take_from_address<Auction<PolicyNFT, SUI>>(&scenario, CREATOR);
            let clock = take_shared<Clock>(&mut scenario);
            let bid = coin::mint_for_testing<SUI>(500_000_000, ts::ctx(&mut scenario));
            auction::place_bid(&mut auction, bid, &clock, ts::ctx(&mut scenario));
            
            // Verify final bid
            assert!(auction::get_highest_bid(&auction) == 500_000_000, 0);
            
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(clock);
        };
        
        // Verify Bidder 1 got refunded
        ts::next_tx(&mut scenario, BIDDER1);
        {
            let refund = ts::take_from_address<Coin<SUI>>(&scenario, BIDDER1);
            assert!(coin::value(&refund) == 100_000_000, 1);
            ts::return_to_address(BIDDER1, refund);
        };
        
        // Verify Bidder 2 got refunded
        ts::next_tx(&mut scenario, BIDDER2);
        {
            let refund = ts::take_from_address<Coin<SUI>>(&scenario, BIDDER2);
            assert!(coin::value(&refund) == 250_000_000, 2);
            ts::return_to_address(BIDDER2, refund);
        };
        
        // Advance time and finalize
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut clock = take_shared<Clock>(&mut scenario);
            clock::increment_for_testing(&mut clock, 1000001);
            ts::return_shared(clock);
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let policy = take_shared<TransferPolicy<PolicyNFT>>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            let auction = ts::take_from_address<Auction<PolicyNFT, SUI>>(&scenario, CREATOR);
            
            auction::finalize_auction_with_lock(
                &mut auction_house,
                &mut kiosk,
                auction,
                &policy,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(policy);
            ts::return_shared(clock);
        };
        
        // Verify Bidder 3 (winner) received the NFT
        ts::next_tx(&mut scenario, BIDDER3);
        {
            assert!(ts::has_most_recent_for_address<PolicyNFT>(BIDDER3), 3);
            let nft = ts::take_from_address<PolicyNFT>(&scenario, BIDDER3);
            assert!(nft.rarity == 8, 4);
            ts::return_to_address(BIDDER3, nft);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_mixed_auctions_locked_and_unlocked() {
        let mut scenario = ts::begin(ADMIN);
        setup_auction_house(&mut scenario);
        create_transfer_policy(&mut scenario, CREATOR);
        
        // Create locked auction
        ts::next_tx(&mut scenario, CREATOR);
        {
            let auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let policy = take_shared<TransferPolicy<PolicyNFT>>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            
            let nft = create_policy_nft(&mut scenario, b"Locked NFT", 7);
            let auction = auction::create_auction_with_lock<PolicyNFT, SUI>(
                &auction_house,
                &mut kiosk,
                &policy,
                nft,
                1000000,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(policy);
            ts::return_shared(clock);
        };
        
        // Bid on locked auction
        ts::next_tx(&mut scenario, BIDDER1);
        {
            let mut auction = ts::take_from_address<Auction<PolicyNFT, SUI>>(&scenario, CREATOR);
            let clock = take_shared<Clock>(&mut scenario);
            let bid = coin::mint_for_testing<SUI>(300_000_000, ts::ctx(&mut scenario));
            auction::place_bid(&mut auction, bid, &clock, ts::ctx(&mut scenario));
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(clock);
        };
        
        // Finalize locked auction
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut clock = take_shared<Clock>(&mut scenario);
            clock::increment_for_testing(&mut clock, 1000001);
            ts::return_shared(clock);
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let policy = take_shared<TransferPolicy<PolicyNFT>>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            let auction = ts::take_from_address<Auction<PolicyNFT, SUI>>(&scenario, CREATOR);
            
            auction::finalize_auction_with_lock(
                &mut auction_house,
                &mut kiosk,
                auction,
                &policy,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(policy);
            ts::return_shared(clock);
        };
        
        // Verify winner got the locked NFT
        ts::next_tx(&mut scenario, BIDDER1);
        {
            assert!(ts::has_most_recent_for_address<PolicyNFT>(BIDDER1), 0);
            let nft = ts::take_from_address<PolicyNFT>(&scenario, BIDDER1);
            assert!(nft.name == b"Locked NFT", 1);
            ts::return_to_address(BIDDER1, nft);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_create_user_kiosk_helper() {
        let mut scenario = ts::begin(CREATOR);
        
        // User creates their own kiosk
        ts::next_tx(&mut scenario, CREATOR);
        {
            auction_house::create_user_kiosk_and_transfer(ts::ctx(&mut scenario));
        };
        
        // Verify kiosk and cap were created
        ts::next_tx(&mut scenario, CREATOR);
        {
            let kiosk = take_shared<Kiosk>(&mut scenario);
            assert!(ts::has_most_recent_for_address<sui::kiosk::KioskOwnerCap>(CREATOR), 0);
            ts::return_shared(kiosk);
        };
        
        ts::end(scenario);
    }
}
