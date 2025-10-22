module contracts::auction_house {
    use sui::object::{UID, ID};
    use sui::tx_context::TxContext;
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::bag::{Self, Bag};
    use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
    use sui::transfer_policy::{TransferPolicy, TransferRequest};
    use std::type_name::{Self, TypeName};

    // Error codes
    const EInvalidFeePercentage: u64 = 1;
    
    #[test_only]
    public fun test_einvalid_fee_percentage(): u64 { EInvalidFeePercentage }

    public struct AdminCap has store, key {
        id: UID,
    }
    
    public struct AuctionHouse has store, key {
        id: UID,
        fee_percentage: u64,
        fee_balance: Bag,
        kiosk_owner_cap: KioskOwnerCap,
    }
    
    fun init(ctx: &mut TxContext) {
        let (kiosk, kiosk_owner_cap) = kiosk::new(ctx);
        let auction_house = AuctionHouse {
            id: sui::object::new(ctx), 
            fee_percentage: 0, 
            fee_balance: bag::new(ctx), 
            kiosk_owner_cap,
        };
        let admin_cap = AdminCap { id: sui::object::new(ctx) };
        transfer::public_share_object(auction_house);
        transfer::public_share_object(kiosk);
        transfer::public_transfer(admin_cap, sui::tx_context::sender(ctx));
    }
    
    public fun change_fee_percentage(
        _admin: &AdminCap, 
        auction_house: &mut AuctionHouse, 
        new_fee: u64
    ) {
        assert!(new_fee <= 10000, EInvalidFeePercentage);
        auction_house.fee_percentage = new_fee;
    }
    
    public fun new_admin_cap(
        _admin: &mut AdminCap, 
        ctx: &mut TxContext
    ): AdminCap {
        AdminCap { id: sui::object::new(ctx) }
    }
    
    public fun withdraw_fee<T>(
        _admin: &AdminCap, 
        auction_house: &mut AuctionHouse, 
        ctx: &mut TxContext
    ): Coin<T> {
        let type_name = type_name::with_defining_ids<T>();
        let fee_balance = bag::borrow_mut<TypeName, Balance<T>>(
            &mut auction_house.fee_balance, 
            type_name
        );
        let amount = balance::value(fee_balance);
        coin::from_balance(balance::split(fee_balance, amount), ctx)
    }
    
    public(package) fun deposit_item<T: store + key>(
        auction_house: &AuctionHouse, 
        kiosk: &mut Kiosk, 
        item: T
    ) {
        kiosk::place(kiosk, &auction_house.kiosk_owner_cap, item);
    }
    
    public(package) fun deposit_item_with_lock<T: store + key>(
        auction_house: &AuctionHouse, 
        kiosk: &mut Kiosk, 
        policy: &TransferPolicy<T>, 
        item: T
    ) {
        kiosk::lock(kiosk, &auction_house.kiosk_owner_cap, policy, item);
    }
    
    public(package) fun withdraw_item<T: store + key>(
        auction_house: &AuctionHouse, 
        kiosk: &mut Kiosk, 
        item_id: ID
    ): T {
        kiosk::take(kiosk, &auction_house.kiosk_owner_cap, item_id)
    }
    
    public(package) fun withdraw_item_with_lock<T: store + key>(
        auction_house: &AuctionHouse, 
        kiosk: &mut Kiosk, 
        item_id: ID, 
        ctx: &mut TxContext
    ): (T, TransferRequest<T>) {
        kiosk::list<T>(kiosk, &auction_house.kiosk_owner_cap, item_id, 0);
        kiosk::purchase(kiosk, item_id, coin::zero(ctx))
    }
    
    public(package) fun get_fee_from_payment<T>(
        auction_house: &mut AuctionHouse, 
        payment: &mut Coin<T>, 
        ctx: &mut TxContext
    ) {
        let type_name = type_name::with_defining_ids<T>();
        if (!bag::contains<TypeName>(&auction_house.fee_balance, type_name)) {
            bag::add(&mut auction_house.fee_balance, type_name, balance::zero<T>());
        };
        let payment_value = coin::value(payment);
        let fee_amount = mul_div_u64(payment_value, auction_house.fee_percentage, 10000);
        let fee_coin = coin::split(payment, fee_amount, ctx);
        balance::join(
            bag::borrow_mut<TypeName, Balance<T>>(&mut auction_house.fee_balance, type_name), 
            coin::into_balance(fee_coin)
        );
    }
    
    fun mul_div_u64(value: u64, multiplier: u64, divisor: u64): u64 {
        (((value as u128) * (multiplier as u128) / (divisor as u128)) as u64)
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx)
    }
    
    /// Helper function to create a user kiosk with a cap for testing/initialization
    /// This can be called by anyone to create their own kiosk for storing NFTs
    public fun create_user_kiosk(ctx: &mut TxContext): (Kiosk, KioskOwnerCap) {
        kiosk::new(ctx)
    }
    
    /// Entry function to create a user kiosk and transfer objects to sender
    /// Useful for users who want to create their own kiosk for auction participation
    public entry fun create_user_kiosk_and_transfer(ctx: &mut TxContext) {
        let (kiosk, cap) = kiosk::new(ctx);
        transfer::public_share_object(kiosk);
        transfer::public_transfer(cap, sui::tx_context::sender(ctx));
    }
}

