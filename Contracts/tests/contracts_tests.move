#[test_only]
module contracts::auction_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::kiosk::Kiosk;
    use contracts::auction_house::{Self, AuctionHouse, AdminCap};
    use contracts::auction::{Self, Auction};

    // Test NFT struct
    public struct TestNFT has key, store {
        id: sui::object::UID,
        name: vector<u8>,
    }

    // Test addresses
    const ADMIN: address = @0xAD;
    const CREATOR: address = @0xC1;
    const BIDDER1: address = @0xB1;
    const BIDDER2: address = @0xB2;
    const BIDDER3: address = @0xB3;

    // Helper: Create test NFT
    fun create_test_nft(scenario: &mut Scenario, name: vector<u8>): TestNFT {
        TestNFT {
            id: sui::object::new(ts::ctx(scenario)),
            name,
        }
    }

    // Helper: Setup auction house and kiosk
    fun setup_auction_house(scenario: &mut Scenario) {
        ts::next_tx(scenario, ADMIN);
        {
            auction_house::init_for_testing(ts::ctx(scenario));
        };
        
        // Create and share clock
        ts::next_tx(scenario, ADMIN);
        {
            let clock = clock::create_for_testing(ts::ctx(scenario));
            clock::share_for_testing(clock);
        };
    }

    // Helper: Get shared objects
    fun take_shared<T: key>(scenario: &mut Scenario): T {
        ts::take_shared<T>(scenario)
    }

    #[test]
    fun test_auction_house_initialization() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize auction house
        setup_auction_house(&mut scenario);
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            // Verify auction house and kiosk were created
            let auction_house = take_shared<AuctionHouse>(&mut scenario);
            let kiosk = take_shared<Kiosk>(&mut scenario);
            
            // Verify admin cap was transferred to ADMIN
            assert!(ts::has_most_recent_for_address<AdminCap>(ADMIN), 0);
            
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_change_fee_percentage() {
        let mut scenario = ts::begin(ADMIN);
        setup_auction_house(&mut scenario);
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut auction_house = take_shared<AuctionHouse>(&mut scenario);
            
            // Change fee to 5% (500 basis points)
            auction_house::change_fee_percentage(&admin_cap, &mut auction_house, 500);
            
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(auction_house);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 1)]  // EInvalidFeePercentage
    fun test_change_fee_percentage_exceeds_maximum() {
        let mut scenario = ts::begin(ADMIN);
        setup_auction_house(&mut scenario);
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut auction_house = take_shared<AuctionHouse>(&mut scenario);
            
            // Try to set fee > 100% (should fail)
            auction_house::change_fee_percentage(&admin_cap, &mut auction_house, 10001);
            
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(auction_house);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_create_auction_and_place_bid() {
        let mut scenario = ts::begin(ADMIN);
        setup_auction_house(&mut scenario);
        
        // Creator creates auction
        ts::next_tx(&mut scenario, CREATOR);
        {
            let auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            
            let nft = create_test_nft(&mut scenario, b"Test NFT #1");
            let expiry_time = 1000000; // 1000 seconds
            
            let auction = auction::create_auction<TestNFT, SUI>(
                &auction_house,
                &mut kiosk,
                nft,
                expiry_time,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            sui::transfer::public_transfer(auction, CREATOR);
            
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(clock);
        };
        
        // Bidder 1 places first bid
        ts::next_tx(&mut scenario, BIDDER1);
        {
            let mut auction = ts::take_from_address<Auction<TestNFT, SUI>>(&scenario, CREATOR);
            let clock = take_shared<Clock>(&mut scenario);
            
            let bid = coin::mint_for_testing<SUI>(100_000_000, ts::ctx(&mut scenario)); // 100 SUI
            
            auction::place_bid(&mut auction, bid, &clock, ts::ctx(&mut scenario));
            
            // Verify bid was placed
            assert!(auction::get_highest_bid(&auction) == 100_000_000, 0);
            assert!(std::option::is_some(&auction::get_highest_bidder(&auction)), 1);
            
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(clock);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_outbid_with_instant_refund() {
        let mut scenario = ts::begin(ADMIN);
        setup_auction_house(&mut scenario);
        
        // Creator creates auction
        ts::next_tx(&mut scenario, CREATOR);
        {
            let auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            
            let nft = create_test_nft(&mut scenario, b"Test NFT #2");
            let expiry_time = 1000000;
            
            let auction = auction::create_auction<TestNFT, SUI>(
                &auction_house,
                &mut kiosk,
                nft,
                expiry_time,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            sui::transfer::public_transfer(auction, CREATOR);
            
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(clock);
        };
        
        // Bidder 1 places first bid (100 SUI)
        ts::next_tx(&mut scenario, BIDDER1);
        {
            let mut auction = ts::take_from_address<Auction<TestNFT, SUI>>(&scenario, CREATOR);
            let clock = take_shared<Clock>(&mut scenario);
            
            let bid = coin::mint_for_testing<SUI>(100_000_000, ts::ctx(&mut scenario));
            auction::place_bid(&mut auction, bid, &clock, ts::ctx(&mut scenario));
            
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(clock);
        };
        
        // Bidder 2 outbids with 150 SUI - Bidder 1 should get instant refund
        ts::next_tx(&mut scenario, BIDDER2);
        {
            let mut auction = ts::take_from_address<Auction<TestNFT, SUI>>(&scenario, CREATOR);
            let clock = take_shared<Clock>(&mut scenario);
            
            let bid = coin::mint_for_testing<SUI>(150_000_000, ts::ctx(&mut scenario));
            auction::place_bid(&mut auction, bid, &clock, ts::ctx(&mut scenario));
            
            // Verify new highest bid
            assert!(auction::get_highest_bid(&auction) == 150_000_000, 0);
            
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(clock);
        };
        
        // Verify Bidder 1 received refund
        ts::next_tx(&mut scenario, BIDDER1);
        {
            assert!(ts::has_most_recent_for_address<Coin<SUI>>(BIDDER1), 0);
            let refund = ts::take_from_address<Coin<SUI>>(&scenario, BIDDER1);
            assert!(coin::value(&refund) == 100_000_000, 1); // Got full 100 SUI back
            ts::return_to_address(BIDDER1, refund);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_multiple_outbids_with_refunds() {
        let mut scenario = ts::begin(ADMIN);
        setup_auction_house(&mut scenario);
        
        // Creator creates auction
        ts::next_tx(&mut scenario, CREATOR);
        {
            let auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            
            let nft = create_test_nft(&mut scenario, b"Test NFT #3");
            let expiry_time = 1000000;
            
            let auction = auction::create_auction<TestNFT, SUI>(
                &auction_house,
                &mut kiosk,
                nft,
                expiry_time,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            sui::transfer::public_transfer(auction, CREATOR);
            
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(clock);
        };
        
        // Bidder 1: 100 SUI
        ts::next_tx(&mut scenario, BIDDER1);
        {
            let mut auction = ts::take_from_address<Auction<TestNFT, SUI>>(&scenario, CREATOR);
            let clock = take_shared<Clock>(&mut scenario);
            let bid = coin::mint_for_testing<SUI>(100_000_000, ts::ctx(&mut scenario));
            auction::place_bid(&mut auction, bid, &clock, ts::ctx(&mut scenario));
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(clock);
        };
        
        // Bidder 2: 200 SUI (Bidder 1 gets refunded)
        ts::next_tx(&mut scenario, BIDDER2);
        {
            let mut auction = ts::take_from_address<Auction<TestNFT, SUI>>(&scenario, CREATOR);
            let clock = take_shared<Clock>(&mut scenario);
            let bid = coin::mint_for_testing<SUI>(200_000_000, ts::ctx(&mut scenario));
            auction::place_bid(&mut auction, bid, &clock, ts::ctx(&mut scenario));
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(clock);
        };
        
        // Bidder 3: 300 SUI (Bidder 2 gets refunded)
        ts::next_tx(&mut scenario, BIDDER3);
        {
            let mut auction = ts::take_from_address<Auction<TestNFT, SUI>>(&scenario, CREATOR);
            let clock = take_shared<Clock>(&mut scenario);
            let bid = coin::mint_for_testing<SUI>(300_000_000, ts::ctx(&mut scenario));
            auction::place_bid(&mut auction, bid, &clock, ts::ctx(&mut scenario));
            
            // Verify final bid
            assert!(auction::get_highest_bid(&auction) == 300_000_000, 0);
            
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(clock);
        };
        
        // Verify refunds
        ts::next_tx(&mut scenario, BIDDER1);
        {
            let refund = ts::take_from_address<Coin<SUI>>(&scenario, BIDDER1);
            assert!(coin::value(&refund) == 100_000_000, 1);
            ts::return_to_address(BIDDER1, refund);
        };
        
        ts::next_tx(&mut scenario, BIDDER2);
        {
            let refund = ts::take_from_address<Coin<SUI>>(&scenario, BIDDER2);
            assert!(coin::value(&refund) == 200_000_000, 2);
            ts::return_to_address(BIDDER2, refund);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_finalize_auction_with_fee_deduction() {
        let mut scenario = ts::begin(ADMIN);
        setup_auction_house(&mut scenario);
        
        // Set fee to 5% (500 basis points)
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut auction_house = take_shared<AuctionHouse>(&mut scenario);
            
            auction_house::change_fee_percentage(&admin_cap, &mut auction_house, 500);
            
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(auction_house);
        };
        
        // Creator creates auction
        ts::next_tx(&mut scenario, CREATOR);
        {
            let auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            
            let nft = create_test_nft(&mut scenario, b"Test NFT #4");
            let expiry_time = 1000000;
            
            let auction = auction::create_auction<TestNFT, SUI>(
                &auction_house,
                &mut kiosk,
                nft,
                expiry_time,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            sui::transfer::public_transfer(auction, CREATOR);
            
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(clock);
        };
        
        // Bidder places bid of 100 SUI
        ts::next_tx(&mut scenario, BIDDER1);
        {
            let mut auction = ts::take_from_address<Auction<TestNFT, SUI>>(&scenario, CREATOR);
            let clock = take_shared<Clock>(&mut scenario);
            
            let bid = coin::mint_for_testing<SUI>(100_000_000, ts::ctx(&mut scenario));
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
        
        // Finalize auction
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            let auction = ts::take_from_address<Auction<TestNFT, SUI>>(&scenario, CREATOR);
            
            auction::finalize_auction(
                &mut auction_house,
                &mut kiosk,
                auction,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(clock);
        };
        
        // Verify creator received payment minus 5% fee
        ts::next_tx(&mut scenario, CREATOR);
        {
            let payment = ts::take_from_address<Coin<SUI>>(&scenario, CREATOR);
            // 100 SUI - 5% = 95 SUI
            assert!(coin::value(&payment) == 95_000_000, 0);
            ts::return_to_address(CREATOR, payment);
        };
        
        // Verify winner received NFT
        ts::next_tx(&mut scenario, BIDDER1);
        {
            assert!(ts::has_most_recent_for_address<TestNFT>(BIDDER1), 1);
            let nft = ts::take_from_address<TestNFT>(&scenario, BIDDER1);
            ts::return_to_address(BIDDER1, nft);
        };
        
        // Verify admin can withdraw fees
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut auction_house = take_shared<AuctionHouse>(&mut scenario);
            
            let fees = auction_house::withdraw_fee<SUI>(&admin_cap, &mut auction_house, ts::ctx(&mut scenario));
            // 5% of 100 SUI = 5 SUI
            assert!(coin::value(&fees) == 5_000_000, 2);
            
            sui::transfer::public_transfer(fees, ADMIN);
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(auction_house);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_finalize_auction_no_bids() {
        let mut scenario = ts::begin(ADMIN);
        setup_auction_house(&mut scenario);
        
        // Creator creates auction
        ts::next_tx(&mut scenario, CREATOR);
        {
            let auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            
            let nft = create_test_nft(&mut scenario, b"Test NFT #5");
            let expiry_time = 1000000;
            
            let auction = auction::create_auction<TestNFT, SUI>(
                &auction_house,
                &mut kiosk,
                nft,
                expiry_time,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            sui::transfer::public_transfer(auction, CREATOR);
            
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(clock);
        };
        
        // Advance time past expiry
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut clock = take_shared<Clock>(&mut scenario);
            clock::increment_for_testing(&mut clock, 1000001);
            ts::return_shared(clock);
        };
        
        // Finalize auction without any bids
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            let auction = ts::take_from_address<Auction<TestNFT, SUI>>(&scenario, CREATOR);
            
            auction::finalize_auction(
                &mut auction_house,
                &mut kiosk,
                auction,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(clock);
        };
        
        // Verify NFT was returned to creator
        ts::next_tx(&mut scenario, CREATOR);
        {
            assert!(ts::has_most_recent_for_address<TestNFT>(CREATOR), 0);
            let nft = ts::take_from_address<TestNFT>(&scenario, CREATOR);
            ts::return_to_address(CREATOR, nft);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 3)]  // EBidTooLow
    fun test_bid_must_be_higher_than_current() {
        let mut scenario = ts::begin(ADMIN);
        setup_auction_house(&mut scenario);
        
        // Create auction
        ts::next_tx(&mut scenario, CREATOR);
        {
            let auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            
            let nft = create_test_nft(&mut scenario, b"Test NFT #6");
            let auction = auction::create_auction<TestNFT, SUI>(
                &auction_house,
                &mut kiosk,
                nft,
                1000000,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(clock);
        };
        
        // First bid: 100 SUI
        ts::next_tx(&mut scenario, BIDDER1);
        {
            let mut auction = ts::take_from_address<Auction<TestNFT, SUI>>(&scenario, CREATOR);
            let clock = take_shared<Clock>(&mut scenario);
            let bid = coin::mint_for_testing<SUI>(100_000_000, ts::ctx(&mut scenario));
            auction::place_bid(&mut auction, bid, &clock, ts::ctx(&mut scenario));
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(clock);
        };
        
        // Try to bid same amount (should fail)
        ts::next_tx(&mut scenario, BIDDER2);
        {
            let mut auction = ts::take_from_address<Auction<TestNFT, SUI>>(&scenario, CREATOR);
            let clock = take_shared<Clock>(&mut scenario);
            let bid = coin::mint_for_testing<SUI>(100_000_000, ts::ctx(&mut scenario));
            auction::place_bid(&mut auction, bid, &clock, ts::ctx(&mut scenario));
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(clock);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 2)]  // EAuctionExpired
    fun test_cannot_bid_on_expired_auction() {
        let mut scenario = ts::begin(ADMIN);
        setup_auction_house(&mut scenario);
        
        // Create auction
        ts::next_tx(&mut scenario, CREATOR);
        {
            let auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            
            let nft = create_test_nft(&mut scenario, b"Test NFT #7");
            let auction = auction::create_auction<TestNFT, SUI>(
                &auction_house,
                &mut kiosk,
                nft,
                1000000,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(clock);
        };
        
        // Advance time past expiry
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut clock = take_shared<Clock>(&mut scenario);
            clock::increment_for_testing(&mut clock, 1000001);
            ts::return_shared(clock);
        };
        
        // Try to bid after expiry (should fail)
        ts::next_tx(&mut scenario, BIDDER1);
        {
            let mut auction = ts::take_from_address<Auction<TestNFT, SUI>>(&scenario, CREATOR);
            let clock = take_shared<Clock>(&mut scenario);
            let bid = coin::mint_for_testing<SUI>(100_000_000, ts::ctx(&mut scenario));
            auction::place_bid(&mut auction, bid, &clock, ts::ctx(&mut scenario));
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(clock);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 1)]  // EAuctionNotExpired
    fun test_cannot_finalize_before_expiry() {
        let mut scenario = ts::begin(ADMIN);
        setup_auction_house(&mut scenario);
        
        // Create auction
        ts::next_tx(&mut scenario, CREATOR);
        {
            let auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            
            let nft = create_test_nft(&mut scenario, b"Test NFT #8");
            let auction = auction::create_auction<TestNFT, SUI>(
                &auction_house,
                &mut kiosk,
                nft,
                1000000,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(clock);
        };
        
        // Try to finalize before expiry (should fail)
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            let auction = ts::take_from_address<Auction<TestNFT, SUI>>(&scenario, CREATOR);
            
            auction::finalize_auction(
                &mut auction_house,
                &mut kiosk,
                auction,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(clock);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_view_functions() {
        let mut scenario = ts::begin(ADMIN);
        setup_auction_house(&mut scenario);
        
        // Create auction
        ts::next_tx(&mut scenario, CREATOR);
        {
            let auction_house = take_shared<AuctionHouse>(&mut scenario);
            let mut kiosk = take_shared<Kiosk>(&mut scenario);
            let clock = take_shared<Clock>(&mut scenario);
            
            let nft = create_test_nft(&mut scenario, b"Test NFT #9");
            let expiry_time = 1000000;
            
            let auction = auction::create_auction<TestNFT, SUI>(
                &auction_house,
                &mut kiosk,
                nft,
                expiry_time,
                &clock,
                ts::ctx(&mut scenario)
            );
            
            // Test view functions
            assert!(auction::get_creator(&auction) == CREATOR, 0);
            assert!(auction::get_expiry_time(&auction) == expiry_time, 1);
            assert!(auction::is_active(&auction) == true, 2);
            assert!(auction::get_highest_bid(&auction) == 0, 3);
            assert!(std::option::is_none(&auction::get_highest_bidder(&auction)), 4);
            
            sui::transfer::public_transfer(auction, CREATOR);
            ts::return_shared(auction_house);
            ts::return_shared(kiosk);
            ts::return_shared(clock);
        };
        
        ts::end(scenario);
    }
}

