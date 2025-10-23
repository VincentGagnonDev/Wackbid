module contracts::auction {
    use sui::object::{UID, ID};
    use sui::tx_context::TxContext;
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::option::{Self, Option};
    use std::string::{Self, String};
    use contracts::auction_house::{Self, AuctionHouse};

    // Error codes
    const EAuctionNotExpired: u64 = 1;
    const EAuctionExpired: u64 = 2;
    const EBidTooLow: u64 = 3;
    const EWrongKioskOwner: u64 = 1001;
    const EWrongCreatorKiosk: u64 = 1002;
    
    #[test_only]
    public fun test_eauction_not_expired(): u64 { EAuctionNotExpired }
    
    #[test_only]
    public fun test_eauction_expired(): u64 { EAuctionExpired }
    
    #[test_only]
    public fun test_ebid_too_low(): u64 { EBidTooLow }

    public struct Auction<phantom T: store + key, phantom CoinType> has key, store {
        id: UID,
        item_id: ID,
        creator: address,
        creator_kiosk_id: ID,  // Store creator's kiosk ID for no-bid returns
        highest_bidder: Option<address>,
        highest_bid: Balance<CoinType>,
        expiry_time: u64,
        is_active: bool,
        title: std::string::String,  // Custom title for the auction
    }

    // Events
    public struct AuctionCreated has copy, drop {
        auction_id: ID,
        item_id: ID,
        creator: address,
        expiry_time: u64,
        title: std::string::String,
    }

    public struct BidPlaced has copy, drop {
        auction_id: ID,
        bidder: address,
        bid_amount: u64,
        previous_bidder: Option<address>,
    }

    public struct AuctionFinalized has copy, drop {
        auction_id: ID,
        winner: Option<address>,
        final_bid: u64,
        creator_received: u64,
        fee_collected: u64,
    }

    // Create new auction (internal function)
    public fun create_auction<T: store + key, CoinType>(
        auction_house: &AuctionHouse,
        shared_kiosk: &mut sui::kiosk::Kiosk,
        creator_kiosk_id: ID,
        item: T,
        expiry_time: u64,
        title: String,
        _clock: &Clock,
        ctx: &mut TxContext
    ): Auction<T, CoinType> {
        let item_id = sui::object::id(&item);
        
        // Deposit item into kiosk
        auction_house::deposit_item(auction_house, shared_kiosk, item);
        
        let auction_id = sui::object::new(ctx);
        let auction_id_copy = sui::object::uid_to_inner(&auction_id);
        
        event::emit(AuctionCreated {
            auction_id: auction_id_copy,
            item_id,
            creator: sui::tx_context::sender(ctx),
            expiry_time,
            title,
        });

        Auction {
            id: auction_id,
            item_id,
            creator: sui::tx_context::sender(ctx),
            creator_kiosk_id,
            highest_bidder: std::option::none(),
            highest_bid: balance::zero<CoinType>(),
            expiry_time,
            is_active: true,
            title,
        }
    }

    // Entry function: Create auction from user's kiosk (unlocked NFT)
    public entry fun create_auction_from_kiosk<T: store + key, CoinType>(
        auction_house: &AuctionHouse,
        user_kiosk: &mut sui::kiosk::Kiosk,
        user_kiosk_cap: sui::kiosk::KioskOwnerCap,  // Take by value
        platform_kiosk: &mut sui::kiosk::Kiosk,
        nft_id: ID,
        expiry_time: u64,
        title: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Store the creator's kiosk ID before taking the NFT
        let creator_kiosk_id = sui::object::id(user_kiosk);
        
        // Take NFT from user's kiosk
        let nft = sui::kiosk::take<T>(user_kiosk, &user_kiosk_cap, nft_id);
        
        // Create auction and share it
        let auction = create_auction<T, CoinType>(
            auction_house,
            platform_kiosk,
            creator_kiosk_id,
            nft,
            expiry_time,
            string::utf8(title),
            clock,
            ctx
        );
        
        transfer::public_share_object(auction);
        
        // Return the kiosk cap to the sender
        transfer::public_transfer(user_kiosk_cap, sui::tx_context::sender(ctx));
    }

    // Create auction with locked item (internal function)
    public fun create_auction_with_lock<T: store + key, CoinType>(
        auction_house: &AuctionHouse,
        shared_kiosk: &mut sui::kiosk::Kiosk,
        creator_kiosk_id: ID,
        policy: &sui::transfer_policy::TransferPolicy<T>,
        item: T,
        expiry_time: u64,
        title: String,
        _clock: &Clock,
        ctx: &mut TxContext
    ): Auction<T, CoinType> {
        let item_id = sui::object::id(&item);
        
        // Deposit locked item into kiosk
        auction_house::deposit_item_with_lock(auction_house, shared_kiosk, policy, item);
        
        let auction_id = sui::object::new(ctx);
        let auction_id_copy = sui::object::uid_to_inner(&auction_id);
        
        event::emit(AuctionCreated {
            auction_id: auction_id_copy,
            item_id,
            creator: sui::tx_context::sender(ctx),
            expiry_time,
            title,
        });

        Auction {
            id: auction_id,
            item_id,
            creator: sui::tx_context::sender(ctx),
            creator_kiosk_id,
            highest_bidder: option::none(),
            highest_bid: balance::zero<CoinType>(),
            expiry_time,
            is_active: true,
            title,
        }
    }

    // Entry function: Create auction from user's kiosk (locked NFT)
    public entry fun create_auction_from_kiosk_with_lock<T: store + key, CoinType>(
        auction_house: &AuctionHouse,
        user_kiosk: &mut sui::kiosk::Kiosk,
        user_kiosk_cap: sui::kiosk::KioskOwnerCap,  // Take by value
        platform_kiosk: &mut sui::kiosk::Kiosk,
        policy: &sui::transfer_policy::TransferPolicy<T>,
        nft_id: ID,
        expiry_time: u64,
        title: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Store the creator's kiosk ID before taking the NFT
        let creator_kiosk_id = sui::object::id(user_kiosk);
        
        // List the locked NFT for 0 SUI
        sui::kiosk::list<T>(user_kiosk, &user_kiosk_cap, nft_id, 0);
        
        // Purchase it with 0 SUI to extract it
        let zero_coin = coin::zero<sui::sui::SUI>(ctx);
        let (nft, transfer_request) = sui::kiosk::purchase<T>(user_kiosk, nft_id, zero_coin);
        
        // Confirm the transfer request
        sui::transfer_policy::confirm_request(policy, transfer_request);
        
        // Create auction and share it
        let auction = create_auction_with_lock<T, CoinType>(
            auction_house,
            platform_kiosk,
            creator_kiosk_id,
            policy,
            nft,
            expiry_time,
            string::utf8(title),
            clock,
            ctx
        );
        
        transfer::public_share_object(auction);
        
        // Return the kiosk cap to the sender
        transfer::public_transfer(user_kiosk_cap, sui::tx_context::sender(ctx));
    }

    // Place bid
    public fun place_bid<T: store + key, CoinType>(
        auction: &mut Auction<T, CoinType>,
        bid: Coin<CoinType>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Check auction is still active
        assert!(auction.is_active, EAuctionExpired);
        assert!(clock::timestamp_ms(clock) < auction.expiry_time, EAuctionExpired);
        
        let bid_amount = coin::value(&bid);
        let current_bid = balance::value(&auction.highest_bid);
        
        // Ensure new bid is higher
        assert!(bid_amount > current_bid, EBidTooLow);
        
        let bidder = sui::tx_context::sender(ctx);
        let previous_bidder = auction.highest_bidder;
        
        // Refund previous highest bidder immediately
        if (option::is_some(&previous_bidder)) {
            let refund = coin::from_balance(
                balance::withdraw_all(&mut auction.highest_bid),
                ctx
            );
            transfer::public_transfer(refund, *option::borrow(&previous_bidder));
        };
        
        // Store new bid
        balance::join(&mut auction.highest_bid, coin::into_balance(bid));
        auction.highest_bidder = option::some(bidder);
        
        event::emit(BidPlaced {
            auction_id: sui::object::uid_to_inner(&auction.id),
            bidder,
            bid_amount,
            previous_bidder,
        });
    }

    // DEPRECATED: This function transfers NFTs to wallets instead of kiosks
    // Use finalize_to_kiosk or finalize_to_wallet instead
    // Kept for backward compatibility only
    public fun finalize_auction<T: store + key, CoinType>(
        auction_house: &mut AuctionHouse,
        shared_kiosk: &mut sui::kiosk::Kiosk,
        auction: Auction<T, CoinType>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        finalize_to_wallet(auction_house, shared_kiosk, auction, clock, ctx)
    }

    // DEPRECATED: This function transfers NFTs to wallets instead of kiosks
    // Use finalize_to_kiosk_with_lock or finalize_to_wallet_with_lock instead
    // Kept for backward compatibility only
    public fun finalize_auction_with_lock<T: store + key, CoinType>(
        auction_house: &mut AuctionHouse,
        shared_kiosk: &mut sui::kiosk::Kiosk,
        auction: Auction<T, CoinType>,
        policy: &sui::transfer_policy::TransferPolicy<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        finalize_to_wallet_with_lock(auction_house, shared_kiosk, auction, policy, clock, ctx)
    }

    // Finalize auction and create a new kiosk for the winner (if they won)
    // For no-bid auctions, returns NFT to creator's wallet
    // Can be called by ANYONE after expiry
    public entry fun finalize_and_create_kiosk<T: store + key, CoinType>(
        auction_house: &mut AuctionHouse,
        platform_kiosk: &mut sui::kiosk::Kiosk,
        auction: Auction<T, CoinType>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Check auction has expired
        assert!(clock::timestamp_ms(clock) >= auction.expiry_time, EAuctionNotExpired);
        
        let Auction {
            id,
            item_id,
            creator,
            creator_kiosk_id: _,
            highest_bidder,
            highest_bid,
            expiry_time: _,
            is_active: _,
            title: _,
        } = auction;
        
        let auction_id = sui::object::uid_to_inner(&id);
        let total_bid = balance::value(&highest_bid);
        
        if (std::option::is_some(&highest_bidder)) {
            // Auction had bids - create new kiosk for winner and transfer NFT
            let winner = *std::option::borrow(&highest_bidder);
            
            // Convert balance to coin for fee extraction
            let mut payment = coin::from_balance(highest_bid, ctx);
            
            // Extract fee
            auction_house::get_fee_from_payment(auction_house, &mut payment, ctx);
            
            let creator_amount = coin::value(&payment);
            
            // Send payment to creator
            transfer::public_transfer(payment, creator);
            
            // Create new kiosk for winner
            let (mut winner_kiosk, winner_kiosk_cap) = sui::kiosk::new(ctx);
            
            // Withdraw NFT from platform kiosk and place in winner's new kiosk
            let nft = auction_house::withdraw_item<T>(auction_house, platform_kiosk, item_id);
            sui::kiosk::place(&mut winner_kiosk, &winner_kiosk_cap, nft);
            
            // Share the kiosk and transfer cap to winner
            transfer::public_share_object(winner_kiosk);
            transfer::public_transfer(winner_kiosk_cap, winner);
            
            event::emit(AuctionFinalized {
                auction_id,
                winner: option::some(winner),
                final_bid: total_bid,
                creator_received: creator_amount,
                fee_collected: total_bid - creator_amount,
            });
        } else {
            // No bids - return NFT to creator's wallet
            balance::destroy_zero(highest_bid);
            
            let nft = auction_house::withdraw_item<T>(auction_house, platform_kiosk, item_id);
            transfer::public_transfer(nft, creator);
            
            event::emit(AuctionFinalized {
                auction_id,
                winner: option::none(),
                final_bid: 0,
                creator_received: 0,
                fee_collected: 0,
            });
        };
        
        sui::object::delete(id);
    }

    // Finalize auction and create a new kiosk for the winner (with locked NFT)
    // For no-bid auctions, returns NFT to creator's wallet
    // Can be called by ANYONE after expiry
    public entry fun finalize_and_create_kiosk_with_lock<T: store + key, CoinType>(
        auction_house: &mut AuctionHouse,
        platform_kiosk: &mut sui::kiosk::Kiosk,
        auction: Auction<T, CoinType>,
        policy: &sui::transfer_policy::TransferPolicy<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Check auction has expired
        assert!(clock::timestamp_ms(clock) >= auction.expiry_time, EAuctionNotExpired);
        
        let Auction {
            id,
            item_id,
            creator,
            creator_kiosk_id: _,
            highest_bidder,
            highest_bid,
            expiry_time: _,
            is_active: _,
            title: _,
        } = auction;
        
        let auction_id = sui::object::uid_to_inner(&id);
        let total_bid = balance::value(&highest_bid);
        
        if (std::option::is_some(&highest_bidder)) {
            // Auction had bids - create new kiosk for winner and transfer locked NFT
            let winner = *std::option::borrow(&highest_bidder);
            
            // Convert balance to coin for fee extraction
            let mut payment = coin::from_balance(highest_bid, ctx);
            
            // Extract fee
            auction_house::get_fee_from_payment(auction_house, &mut payment, ctx);
            
            let creator_amount = coin::value(&payment);
            
            // Send payment to creator
            transfer::public_transfer(payment, creator);
            
            // Create new kiosk for winner
            let (mut winner_kiosk, winner_kiosk_cap) = sui::kiosk::new(ctx);
            
            // Withdraw locked NFT from platform kiosk
            let (nft, request) = auction_house::withdraw_item_with_lock<T>(
                auction_house, 
                platform_kiosk, 
                item_id, 
                ctx
            );
            
            // Confirm transfer request
            sui::transfer_policy::confirm_request(policy, request);
            
            // Lock in winner's new kiosk
            sui::kiosk::lock(&mut winner_kiosk, &winner_kiosk_cap, policy, nft);
            
            // Share the kiosk and transfer cap to winner
            transfer::public_share_object(winner_kiosk);
            transfer::public_transfer(winner_kiosk_cap, winner);
            
            event::emit(AuctionFinalized {
                auction_id,
                winner: option::some(winner),
                final_bid: total_bid,
                creator_received: creator_amount,
                fee_collected: total_bid - creator_amount,
            });
        } else {
            // No bids - return locked NFT to creator's wallet
            balance::destroy_zero(highest_bid);
            
            let (nft, request) = auction_house::withdraw_item_with_lock<T>(
                auction_house, 
                platform_kiosk, 
                item_id, 
                ctx
            );
            
            sui::transfer_policy::confirm_request(policy, request);
            transfer::public_transfer(nft, creator);
            
            event::emit(AuctionFinalized {
                auction_id,
                winner: option::none(),
                final_bid: 0,
                creator_received: 0,
                fee_collected: 0,
            });
        };
        
        sui::object::delete(id);
    }

    // Finalize auction and place NFT in winner's kiosk
    // Can be called by ANYONE, but requires winner to provide their kiosk
    // Winner must sign the transaction with their kiosk cap
    // For no-bid auctions, requires creator's kiosk and kiosk cap
    public entry fun finalize_to_kiosk<T: store + key, CoinType>(
        auction_house: &mut AuctionHouse,
        platform_kiosk: &mut sui::kiosk::Kiosk,
        auction: Auction<T, CoinType>,
        recipient_kiosk: &mut sui::kiosk::Kiosk,
        recipient_kiosk_cap: &sui::kiosk::KioskOwnerCap,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Check auction has expired
        assert!(clock::timestamp_ms(clock) >= auction.expiry_time, EAuctionNotExpired);
        
        let Auction {
            id,
            item_id,
            creator,
            creator_kiosk_id,
            highest_bidder,
            highest_bid,
            expiry_time: _,
            is_active: _,
            title: _,
        } = auction;
        
        let auction_id = sui::object::uid_to_inner(&id);
        let total_bid = balance::value(&highest_bid);
        
        if (std::option::is_some(&highest_bidder)) {
            // Auction had bids - process payment and transfer to winner's kiosk
            let winner = *std::option::borrow(&highest_bidder);
            
            // Verify the transaction sender has access to the winner's kiosk cap
            assert!(sui::kiosk::owner(recipient_kiosk) == winner, 1001); // EWrongKioskOwner
            
            // Convert balance to coin for fee extraction
            let mut payment = coin::from_balance(highest_bid, ctx);
            
            // Extract fee
            auction_house::get_fee_from_payment(auction_house, &mut payment, ctx);
            
            let creator_amount = coin::value(&payment);
            
            // Send payment to creator
            transfer::public_transfer(payment, creator);
            
            // Withdraw NFT from platform kiosk and place in winner's kiosk
            let nft = auction_house::withdraw_item<T>(auction_house, platform_kiosk, item_id);
            sui::kiosk::place(recipient_kiosk, recipient_kiosk_cap, nft);
            
            event::emit(AuctionFinalized {
                auction_id,
                winner: option::some(winner),
                final_bid: total_bid,
                creator_received: creator_amount,
                fee_collected: total_bid - creator_amount,
            });
        } else {
            // No bids - return NFT to creator's kiosk
            balance::destroy_zero(highest_bid);
            
            // Verify the recipient kiosk is the creator's original kiosk
            assert!(sui::object::id(recipient_kiosk) == creator_kiosk_id, 1002); // EWrongCreatorKiosk
            assert!(sui::kiosk::owner(recipient_kiosk) == creator, 1001); // EWrongKioskOwner
            
            let nft = auction_house::withdraw_item<T>(auction_house, platform_kiosk, item_id);
            sui::kiosk::place(recipient_kiosk, recipient_kiosk_cap, nft);
            
            event::emit(AuctionFinalized {
                auction_id,
                winner: option::none(),
                final_bid: 0,
                creator_received: 0,
                fee_collected: 0,
            });
        };
        
        sui::object::delete(id);
    }
    
    // Finalize auction - NFT goes to winner's wallet (non-kiosk version)
    // Can be called by ANYONE after expiry
    // NOTE: NFT transferred to wallet may need to be placed in a kiosk for future trading
    public entry fun finalize_to_wallet<T: store + key, CoinType>(
        auction_house: &mut AuctionHouse,
        platform_kiosk: &mut sui::kiosk::Kiosk,
        auction: Auction<T, CoinType>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Check auction has expired
        assert!(clock::timestamp_ms(clock) >= auction.expiry_time, EAuctionNotExpired);
        
        let Auction {
            id,
            item_id,
            creator,
            creator_kiosk_id: _,
            highest_bidder,
            highest_bid,
            expiry_time: _,
            is_active: _,
            title: _,
        } = auction;
        
        let auction_id = sui::object::uid_to_inner(&id);
        let total_bid = balance::value(&highest_bid);
        
        if (std::option::is_some(&highest_bidder)) {
            // Auction had bids - process payment and transfer
            let winner = *std::option::borrow(&highest_bidder);
            
            // Convert balance to coin for fee extraction
            let mut payment = coin::from_balance(highest_bid, ctx);
            
            // Extract fee (modifies payment coin in place)
            auction_house::get_fee_from_payment(auction_house, &mut payment, ctx);
            
            let creator_amount = coin::value(&payment);
            
            // Send remaining payment to creator
            transfer::public_transfer(payment, creator);
            
            // Transfer NFT to winner's wallet
            let nft = auction_house::withdraw_item<T>(auction_house, platform_kiosk, item_id);
            transfer::public_transfer(nft, winner);
            
            event::emit(AuctionFinalized {
                auction_id,
                winner: option::some(winner),
                final_bid: total_bid,
                creator_received: creator_amount,
                fee_collected: total_bid - creator_amount,
            });
        } else {
            // No bids - return NFT to creator's wallet
            balance::destroy_zero(highest_bid);
            let nft = auction_house::withdraw_item<T>(auction_house, platform_kiosk, item_id);
            transfer::public_transfer(nft, creator);
            
            event::emit(AuctionFinalized {
                auction_id,
                winner: option::none(),
                final_bid: 0,
                creator_received: 0,
                fee_collected: 0,
            });
        };
        
        sui::object::delete(id);
    }

    // Finalize auction with locked NFT - NFT goes to winner's wallet (non-kiosk version)
    // Can be called by ANYONE after expiry
    // NOTE: Locked NFTs may have restrictions when transferred to wallets
    public entry fun finalize_to_wallet_with_lock<T: store + key, CoinType>(
        auction_house: &mut AuctionHouse,
        platform_kiosk: &mut sui::kiosk::Kiosk,
        auction: Auction<T, CoinType>,
        policy: &sui::transfer_policy::TransferPolicy<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Check auction has expired
        assert!(clock::timestamp_ms(clock) >= auction.expiry_time, EAuctionNotExpired);
        
        let Auction {
            id,
            item_id,
            creator,
            creator_kiosk_id: _,
            highest_bidder,
            highest_bid,
            expiry_time: _,
            is_active: _,
            title: _,
        } = auction;
        
        let auction_id = sui::object::uid_to_inner(&id);
        let total_bid = balance::value(&highest_bid);
        
        if (std::option::is_some(&highest_bidder)) {
            // Auction had bids - process payment and transfer
            let winner = *std::option::borrow(&highest_bidder);
            
            // Convert balance to coin for fee extraction
            let mut payment = coin::from_balance(highest_bid, ctx);
            
            // Extract fee
            auction_house::get_fee_from_payment(auction_house, &mut payment, ctx);
            
            let creator_amount = coin::value(&payment);
            
            // Send payment to creator
            transfer::public_transfer(payment, creator);
            
            // Transfer locked NFT to winner's wallet
            let (nft, request) = auction_house::withdraw_item_with_lock<T>(
                auction_house, 
                platform_kiosk, 
                item_id, 
                ctx
            );
            
            // Confirm transfer request with policy
            sui::transfer_policy::confirm_request(policy, request);
            transfer::public_transfer(nft, winner);
            
            event::emit(AuctionFinalized {
                auction_id,
                winner: option::some(winner),
                final_bid: total_bid,
                creator_received: creator_amount,
                fee_collected: total_bid - creator_amount,
            });
        } else {
            // No bids - return NFT to creator's wallet
            balance::destroy_zero(highest_bid);
            let (nft, request) = auction_house::withdraw_item_with_lock<T>(
                auction_house, 
                platform_kiosk, 
                item_id, 
                ctx
            );
            
            sui::transfer_policy::confirm_request(policy, request);
            transfer::public_transfer(nft, creator);
            
            event::emit(AuctionFinalized {
                auction_id,
                winner: option::none(),
                final_bid: 0,
                creator_received: 0,
                fee_collected: 0,
            });
        };
        
        sui::object::delete(id);
    }

    // Finalize auction with locked NFT and place in winner's kiosk
    // For no-bid auctions, requires creator's kiosk and kiosk cap
    public entry fun finalize_to_kiosk_with_lock<T: store + key, CoinType>(
        auction_house: &mut AuctionHouse,
        platform_kiosk: &mut sui::kiosk::Kiosk,
        auction: Auction<T, CoinType>,
        recipient_kiosk: &mut sui::kiosk::Kiosk,
        recipient_kiosk_cap: &sui::kiosk::KioskOwnerCap,
        policy: &sui::transfer_policy::TransferPolicy<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Check auction has expired
        assert!(clock::timestamp_ms(clock) >= auction.expiry_time, EAuctionNotExpired);
        
        let Auction {
            id,
            item_id,
            creator,
            creator_kiosk_id,
            highest_bidder,
            highest_bid,
            expiry_time: _,
            is_active: _,
            title: _,
        } = auction;
        
        let auction_id = sui::object::uid_to_inner(&id);
        let total_bid = balance::value(&highest_bid);
        
        if (std::option::is_some(&highest_bidder)) {
            // Auction had bids - process payment and transfer to winner's kiosk
            let winner = *std::option::borrow(&highest_bidder);
            
            // Verify the kiosk cap matches the winner
            assert!(sui::kiosk::owner(recipient_kiosk) == winner, 1001); // EWrongKioskOwner
            
            // Convert balance to coin for fee extraction
            let mut payment = coin::from_balance(highest_bid, ctx);
            
            // Extract fee
            auction_house::get_fee_from_payment(auction_house, &mut payment, ctx);
            
            let creator_amount = coin::value(&payment);
            
            // Send payment to creator
            transfer::public_transfer(payment, creator);
            
            // Withdraw locked NFT and place in winner's kiosk
            let (nft, request) = auction_house::withdraw_item_with_lock<T>(
                auction_house, 
                platform_kiosk, 
                item_id, 
                ctx
            );
            
            // Confirm transfer request
            sui::transfer_policy::confirm_request(policy, request);
            
            // Lock in winner's kiosk
            sui::kiosk::lock(recipient_kiosk, recipient_kiosk_cap, policy, nft);
            
            event::emit(AuctionFinalized {
                auction_id,
                winner: option::some(winner),
                final_bid: total_bid,
                creator_received: creator_amount,
                fee_collected: total_bid - creator_amount,
            });
        } else {
            // No bids - return locked NFT to creator's kiosk
            balance::destroy_zero(highest_bid);
            
            // Verify the recipient kiosk is the creator's original kiosk
            assert!(sui::object::id(recipient_kiosk) == creator_kiosk_id, 1002); // EWrongCreatorKiosk
            assert!(sui::kiosk::owner(recipient_kiosk) == creator, 1001); // EWrongKioskOwner
            
            let (nft, request) = auction_house::withdraw_item_with_lock<T>(
                auction_house, 
                platform_kiosk, 
                item_id, 
                ctx
            );
            
            sui::transfer_policy::confirm_request(policy, request);
            
            // Lock in creator's original kiosk
            sui::kiosk::lock(recipient_kiosk, recipient_kiosk_cap, policy, nft);
            
            event::emit(AuctionFinalized {
                auction_id,
                winner: option::none(),
                final_bid: 0,
                creator_received: 0,
                fee_collected: 0,
            });
        };
        
        sui::object::delete(id);
    }

    // View functions
    public fun get_highest_bid<T: store + key, CoinType>(auction: &Auction<T, CoinType>): u64 {
        balance::value(&auction.highest_bid)
    }

    public fun get_highest_bidder<T: store + key, CoinType>(auction: &Auction<T, CoinType>): Option<address> {
        auction.highest_bidder
    }

    public fun get_creator<T: store + key, CoinType>(auction: &Auction<T, CoinType>): address {
        auction.creator
    }

    public fun get_expiry_time<T: store + key, CoinType>(auction: &Auction<T, CoinType>): u64 {
        auction.expiry_time
    }

    public fun is_active<T: store + key, CoinType>(auction: &Auction<T, CoinType>): bool {
        auction.is_active
    }

    public fun get_item_id<T: store + key, CoinType>(auction: &Auction<T, CoinType>): ID {
        auction.item_id
    }
}
