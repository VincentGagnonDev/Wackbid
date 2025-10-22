Here is provided all of the module in a successful Sui package that contains errors, event_wrapper, events, house, raffle, utils. 
The module of the package will be divided by section title such as this : [Errors] or [Raffle]
Everything in this package is functional and use the correct Sui move logic for when it comes to NFT transfer, etc.




[errors]
module 0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::errors {
    // decompiled from Move bytecode v6
}
 

[event_wrapper]
module 0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::event_wrapper {
    struct Event<T0: copy + drop> has copy, drop {
        pos0: T0,
    }
    
    public(friend) fun emit_event<T0: copy + drop>(arg0: T0) {
        let v0 = Event<T0>{pos0: arg0};
        0x2::event::emit<Event<T0>>(v0);
    }
    
    // decompiled from Move bytecode v6
}
 
[events]
module 0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::events {
    struct RaffleCreated has copy, drop {
        raffle_id: 0x2::object::ID,
    }
    
    struct RaffleParticipantJoined has copy, drop {
        raffle_id: 0x2::object::ID,
        participant_address: address,
    }
    
    struct RaffleWinnerSelected has copy, drop {
        raffle_id: 0x2::object::ID,
        winner_address: address,
    }
    
    struct RaffleFinished has copy, drop {
        raffle_id: 0x2::object::ID,
    }
    
    public(friend) fun emit_raffle_created(arg0: 0x2::object::ID) {
        let v0 = RaffleCreated{raffle_id: arg0};
        0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::event_wrapper::emit_event<RaffleCreated>(v0);
    }
    
    public(friend) fun emit_raffle_finished(arg0: 0x2::object::ID) {
        let v0 = RaffleFinished{raffle_id: arg0};
        0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::event_wrapper::emit_event<RaffleFinished>(v0);
    }
    
    public(friend) fun emit_raffle_participant_joined(arg0: 0x2::object::ID, arg1: address) {
        let v0 = RaffleParticipantJoined{
            raffle_id           : arg0, 
            participant_address : arg1,
        };
        0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::event_wrapper::emit_event<RaffleParticipantJoined>(v0);
    }
    
    public(friend) fun emit_raffle_winner_selected(arg0: 0x2::object::ID, arg1: address) {
        let v0 = RaffleWinnerSelected{
            raffle_id      : arg0, 
            winner_address : arg1,
        };
        0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::event_wrapper::emit_event<RaffleWinnerSelected>(v0);
    }
    
    // decompiled from Move bytecode v6
}

[house]
module 0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::house {
    struct AdminCap has store, key {
        id: 0x2::object::UID,
    }
    
    struct House has store, key {
        id: 0x2::object::UID,
        fee_percentage: u64,
        fee_balance: 0x2::bag::Bag,
        kiosk_owner_cap: 0x2::kiosk::KioskOwnerCap,
    }
    
    public fun change_fee_percentage(arg0: &AdminCap, arg1: &mut House, arg2: u64) {
        assert!(arg2 <= 10000, 2);
        arg1.fee_percentage = arg2;
    }
    
    public(friend) fun deposit_item<T0: store + key>(arg0: &House, arg1: &mut 0x2::kiosk::Kiosk, arg2: T0) {
        0x2::kiosk::place<T0>(arg1, &arg0.kiosk_owner_cap, arg2);
    }
    
    public(friend) fun deposit_item_with_lock<T0: store + key>(arg0: &House, arg1: &mut 0x2::kiosk::Kiosk, arg2: &0x2::transfer_policy::TransferPolicy<T0>, arg3: T0) {
        0x2::kiosk::lock<T0>(arg1, &arg0.kiosk_owner_cap, arg2, arg3);
    }
    
    public(friend) fun get_fee_from_payment<T0>(arg0: &mut House, arg1: &mut 0x2::coin::Coin<T0>, arg2: &mut 0x2::tx_context::TxContext) {
        let v0 = 0x1::type_name::get<T0>();
        if (!0x2::bag::contains<0x1::type_name::TypeName>(&arg0.fee_balance, v0)) {
            0x2::bag::add<0x1::type_name::TypeName, 0x2::balance::Balance<T0>>(&mut arg0.fee_balance, v0, 0x2::balance::zero<T0>());
        };
        0x2::balance::join<T0>(0x2::bag::borrow_mut<0x1::type_name::TypeName, 0x2::balance::Balance<T0>>(&mut arg0.fee_balance, v0), 0x2::coin::into_balance<T0>(0x2::coin::split<T0>(arg1, 0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::utils::mul_div_u64(0x2::coin::value<T0>(arg1), arg0.fee_percentage, 10000), arg2)));
    }
    
    fun init(arg0: &mut 0x2::tx_context::TxContext) {
        let (v0, v1) = 0x2::kiosk::new(arg0);
        let v2 = House{
            id              : 0x2::object::new(arg0), 
            fee_percentage  : 0, 
            fee_balance     : 0x2::bag::new(arg0), 
            kiosk_owner_cap : v1,
        };
        let v3 = AdminCap{id: 0x2::object::new(arg0)};
        0x2::transfer::public_share_object<House>(v2);
        0x2::transfer::public_share_object<0x2::kiosk::Kiosk>(v0);
        0x2::transfer::public_transfer<AdminCap>(v3, 0x2::tx_context::sender(arg0));
    }
    
    public fun new_admin_cap(arg0: &mut AdminCap, arg1: &mut 0x2::tx_context::TxContext) : AdminCap {
        AdminCap{id: 0x2::object::new(arg1)}
    }
    
    public fun withdraw_fee<T0>(arg0: &AdminCap, arg1: &mut House, arg2: &mut 0x2::tx_context::TxContext) : 0x2::coin::Coin<T0> {
        let v0 = 0x2::bag::borrow_mut<0x1::type_name::TypeName, 0x2::balance::Balance<T0>>(&mut arg1.fee_balance, 0x1::type_name::get<T0>());
        0x2::coin::from_balance<T0>(0x2::balance::split<T0>(v0, 0x2::balance::value<T0>(v0)), arg2)
    }
    
    public(friend) fun withdraw_item<T0: store + key>(arg0: &House, arg1: &mut 0x2::kiosk::Kiosk, arg2: 0x2::object::ID) : T0 {
        0x2::kiosk::take<T0>(arg1, &arg0.kiosk_owner_cap, arg2)
    }
    
    public(friend) fun withdraw_item_with_lock<T0: store + key>(arg0: &House, arg1: &mut 0x2::kiosk::Kiosk, arg2: 0x2::object::ID, arg3: &mut 0x2::tx_context::TxContext) : (T0, 0x2::transfer_policy::TransferRequest<T0>) {
        0x2::kiosk::list<T0>(arg1, &arg0.kiosk_owner_cap, arg2, 0);
        0x2::kiosk::purchase<T0>(arg1, arg2, 0x2::coin::zero<0x2::sui::SUI>(arg3))
    }
    
    // decompiled from Move bytecode v6
}


[raffle]
module 0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::raffle {
    struct Raffle<phantom T0, phantom T1> has store, key {
        id: 0x2::object::UID,
        participants: 0x2::table_vec::TableVec<address>,
        participants_capacity_map: 0x2::table::Table<address, u64>,
        participants_count: u64,
        balance: 0x2::balance::Balance<T0>,
        max_capacity: 0x1::option::Option<u64>,
        max_per_participant: 0x1::option::Option<u64>,
        cost: 0x1::option::Option<u64>,
        deadline: u64,
        raffle_item_id: 0x2::object::ID,
        internal_raffle_item_id: 0x1::option::Option<0x2::object::ID>,
        winner_address: 0x1::option::Option<address>,
        is_raffle_item_locked: bool,
        operator_cap_id: 0x2::object::ID,
        operator: address,
        is_raffle_paused: bool,
    }
    
    struct RaffleOperatorCap has store, key {
        id: 0x2::object::UID,
    }
    
    struct RaffleHotPotato {
        kiosk_id: 0x2::object::ID,
    }
    
    fun add_participant<T0, T1: store + key>(arg0: &mut Raffle<T0, T1>, arg1: address) {
        0x2::table_vec::push_back<address>(&mut arg0.participants, arg1);
        if (!0x2::table::contains<address, u64>(&arg0.participants_capacity_map, arg1)) {
            0x2::table::add<address, u64>(&mut arg0.participants_capacity_map, arg1, 1);
        } else {
            let v0 = 0x2::table::borrow_mut<address, u64>(&mut arg0.participants_capacity_map, arg1);
            *v0 = *v0 + 1;
        };
        arg0.participants_count = arg0.participants_count + 1;
    }
    
    public fun address_to_ticket_amount<T0, T1: store + key>(arg0: &Raffle<T0, T1>, arg1: address) : u64 {
        if (0x2::table::contains<address, u64>(&arg0.participants_capacity_map, arg1)) {
            *0x2::table::borrow<address, u64>(&arg0.participants_capacity_map, arg1)
        } else {
            0
        }
    }
    
    fun assert_cost<T0, T1: store + key>(arg0: &Raffle<T0, T1>, arg1: &0x2::coin::Coin<T0>) {
        if (0x1::option::is_some<u64>(&arg0.cost)) {
            assert!(0x2::coin::value<T0>(arg1) == *0x1::option::borrow<u64>(&arg0.cost), 102);
        };
    }
    
    fun assert_deadline_has_not_passed<T0, T1: store + key>(arg0: &Raffle<T0, T1>, arg1: &0x2::clock::Clock) {
        assert!(0x2::clock::timestamp_ms(arg1) < arg0.deadline, 106);
    }
    
    fun assert_deadline_has_passed<T0, T1: store + key>(arg0: &Raffle<T0, T1>, arg1: &0x2::clock::Clock) {
        assert!(0x2::clock::timestamp_ms(arg1) >= arg0.deadline, 105);
    }
    
    fun assert_deadline_is_in_the_future(arg0: u64, arg1: &0x2::clock::Clock) {
        assert!(arg0 > 0x2::clock::timestamp_ms(arg1), 115);
    }
    
    fun assert_is_raffle_finished<T0, T1: store + key>(arg0: &Raffle<T0, T1>) {
        assert!(0x1::option::is_some<0x2::object::ID>(&arg0.internal_raffle_item_id), 100);
    }
    
    fun assert_is_raffle_item_locked<T0, T1: store + key>(arg0: &Raffle<T0, T1>) {
        assert!(arg0.is_raffle_item_locked, 109);
    }
    
    fun assert_is_raffle_item_unlocked<T0, T1: store + key>(arg0: &Raffle<T0, T1>) {
        assert!(!arg0.is_raffle_item_locked, 110);
    }
    
    fun assert_is_raffle_paused<T0, T1: store + key>(arg0: &Raffle<T0, T1>) {
        assert!(!arg0.is_raffle_paused, 101);
    }
    
    fun assert_item_not_withdrawn<T0, T1: store + key>(arg0: &Raffle<T0, T1>) {
        assert!(0x1::option::is_some<0x2::object::ID>(&arg0.internal_raffle_item_id), 112);
    }
    
    fun assert_max_capacity<T0, T1: store + key>(arg0: &Raffle<T0, T1>) {
        if (0x1::option::is_some<u64>(&arg0.max_capacity)) {
            assert!(arg0.participants_count < *0x1::option::borrow<u64>(&arg0.max_capacity), 103);
        };
    }
    
    fun assert_max_per_participant<T0, T1: store + key>(arg0: &Raffle<T0, T1>, arg1: address) {
        if (0x1::option::is_some<u64>(&arg0.max_per_participant)) {
            let v0 = if (0x2::table::contains<address, u64>(&arg0.participants_capacity_map, arg1)) {
                *0x2::table::borrow<address, u64>(&arg0.participants_capacity_map, arg1)
            } else {
                0
            };
            assert!(v0 < *0x1::option::borrow<u64>(&arg0.max_per_participant), 104);
        };
    }
    
    fun assert_operator_cap<T0, T1: store + key>(arg0: &Raffle<T0, T1>, arg1: &RaffleOperatorCap) {
        assert!(arg0.operator_cap_id == 0x2::object::id<RaffleOperatorCap>(arg1), 111);
    }
    
    fun assert_participants_count_is_greater_than_zero<T0, T1: store + key>(arg0: &Raffle<T0, T1>) {
        assert!(arg0.participants_count > 0, 114);
    }
    
    fun assert_winner_not_selected<T0, T1: store + key>(arg0: &Raffle<T0, T1>) {
        assert!(0x1::option::is_none<address>(&arg0.winner_address), 107);
    }
    
    fun assert_winner_selected<T0, T1: store + key>(arg0: &Raffle<T0, T1>) {
        assert!(0x1::option::is_some<address>(&arg0.winner_address), 108);
    }
    
    public fun change_cost<T0, T1: store + key>(arg0: &RaffleOperatorCap, arg1: &mut Raffle<T0, T1>, arg2: u64) {
        assert_operator_cap<T0, T1>(arg1, arg0);
        arg1.cost = 0x1::option::some<u64>(arg2);
    }
    
    public fun change_deadline<T0, T1: store + key>(arg0: &RaffleOperatorCap, arg1: &mut Raffle<T0, T1>, arg2: u64) {
        assert_operator_cap<T0, T1>(arg1, arg0);
        arg1.deadline = arg2;
    }
    
    public fun change_max_capacity<T0, T1: store + key>(arg0: &RaffleOperatorCap, arg1: &mut Raffle<T0, T1>, arg2: u64) {
        assert_operator_cap<T0, T1>(arg1, arg0);
        arg1.max_capacity = 0x1::option::some<u64>(arg2);
    }
    
    public fun change_max_per_participant<T0, T1: store + key>(arg0: &RaffleOperatorCap, arg1: &mut Raffle<T0, T1>, arg2: u64) {
        assert_operator_cap<T0, T1>(arg1, arg0);
        arg1.max_per_participant = 0x1::option::some<u64>(arg2);
    }
    
    public fun change_pause_state<T0, T1: store + key>(arg0: &RaffleOperatorCap, arg1: &mut Raffle<T0, T1>, arg2: bool) {
        assert_operator_cap<T0, T1>(arg1, arg0);
        arg1.is_raffle_paused = arg2;
    }
    
    public fun create_raffle<T0, T1: store + key>(arg0: &mut 0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::house::House, arg1: &mut 0x2::kiosk::Kiosk, arg2: T1, arg3: u64, arg4: &0x2::clock::Clock, arg5: &mut 0x2::tx_context::TxContext) : (Raffle<T0, T1>, RaffleOperatorCap) {
        assert_deadline_is_in_the_future(arg3, arg4);
        let v0 = RaffleOperatorCap{id: 0x2::object::new(arg5)};
        let v1 = Raffle<T0, T1>{
            id                        : 0x2::object::new(arg5), 
            participants              : 0x2::table_vec::empty<address>(arg5), 
            participants_capacity_map : 0x2::table::new<address, u64>(arg5), 
            participants_count        : 0, 
            balance                   : 0x2::balance::zero<T0>(), 
            max_capacity              : 0x1::option::none<u64>(), 
            max_per_participant       : 0x1::option::none<u64>(), 
            cost                      : 0x1::option::none<u64>(), 
            deadline                  : arg3, 
            raffle_item_id            : 0x2::object::id<T1>(&arg2), 
            internal_raffle_item_id   : 0x1::option::some<0x2::object::ID>(0x2::object::id<T1>(&arg2)), 
            winner_address            : 0x1::option::none<address>(), 
            is_raffle_item_locked     : false, 
            operator_cap_id           : 0x2::object::id<RaffleOperatorCap>(&v0), 
            operator                  : 0x2::tx_context::sender(arg5), 
            is_raffle_paused          : true,
        };
        0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::house::deposit_item<T1>(arg0, arg1, arg2);
        0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::events::emit_raffle_created(0x2::object::id<Raffle<T0, T1>>(&v1));
        (v1, v0)
    }
    
    public fun create_raffle_with_lock<T0, T1: store + key>(arg0: &mut 0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::house::House, arg1: &mut 0x2::kiosk::Kiosk, arg2: &0x2::transfer_policy::TransferPolicy<T1>, arg3: T1, arg4: u64, arg5: &0x2::clock::Clock, arg6: &mut 0x2::tx_context::TxContext) : (Raffle<T0, T1>, RaffleOperatorCap) {
        assert_deadline_is_in_the_future(arg4, arg5);
        let v0 = RaffleOperatorCap{id: 0x2::object::new(arg6)};
        let v1 = Raffle<T0, T1>{
            id                        : 0x2::object::new(arg6), 
            participants              : 0x2::table_vec::empty<address>(arg6), 
            participants_capacity_map : 0x2::table::new<address, u64>(arg6), 
            participants_count        : 0, 
            balance                   : 0x2::balance::zero<T0>(), 
            max_capacity              : 0x1::option::none<u64>(), 
            max_per_participant       : 0x1::option::none<u64>(), 
            cost                      : 0x1::option::none<u64>(), 
            deadline                  : arg4, 
            raffle_item_id            : 0x2::object::id<T1>(&arg3), 
            internal_raffle_item_id   : 0x1::option::some<0x2::object::ID>(0x2::object::id<T1>(&arg3)), 
            winner_address            : 0x1::option::none<address>(), 
            is_raffle_item_locked     : true, 
            operator_cap_id           : 0x2::object::id<RaffleOperatorCap>(&v0), 
            operator                  : 0x2::tx_context::sender(arg6), 
            is_raffle_paused          : true,
        };
        0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::house::deposit_item_with_lock<T1>(arg0, arg1, arg2, arg3);
        0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::events::emit_raffle_created(0x2::object::id<Raffle<T0, T1>>(&v1));
        (v1, v0)
    }
    
    public fun finish_raffle<T0, T1: store + key>(arg0: &mut 0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::house::House, arg1: &mut Raffle<T0, T1>, arg2: &mut 0x2::kiosk::Kiosk, arg3: &0x2::clock::Clock, arg4: &mut 0x2::tx_context::TxContext) {
        assert_is_raffle_paused<T0, T1>(arg1);
        assert_deadline_has_passed<T0, T1>(arg1, arg3);
        assert_winner_selected<T0, T1>(arg1);
        assert_is_raffle_item_unlocked<T0, T1>(arg1);
        0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::events::emit_raffle_finished(0x2::object::id<Raffle<T0, T1>>(arg1));
        withdraw_balance_to_operator<T0, T1>(arg1, arg4);
        0x2::transfer::public_transfer<T1>(0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::house::withdraw_item<T1>(arg0, arg2, 0x1::option::extract<0x2::object::ID>(&mut arg1.internal_raffle_item_id)), *0x1::option::borrow<address>(&arg1.winner_address));
    }
    
    public fun finish_raffle_with_locked<T0, T1: store + key>(arg0: &mut 0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::house::House, arg1: &mut Raffle<T0, T1>, arg2: &mut 0x2::kiosk::Kiosk, arg3: &mut 0x2::kiosk::Kiosk, arg4: 0x2::kiosk::KioskOwnerCap, arg5: &0x2::transfer_policy::TransferPolicy<T1>, arg6: &0x2::clock::Clock, arg7: &mut 0x2::tx_context::TxContext) : (RaffleHotPotato, 0x2::transfer_policy::TransferRequest<T1>) {
        assert_is_raffle_paused<T0, T1>(arg1);
        assert_deadline_has_passed<T0, T1>(arg1, arg6);
        assert_winner_selected<T0, T1>(arg1);
        assert_is_raffle_item_locked<T0, T1>(arg1);
        let (v0, v1) = 0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::house::withdraw_item_with_lock<T1>(arg0, arg2, 0x1::option::extract<0x2::object::ID>(&mut arg1.internal_raffle_item_id), arg7);
        0x2::kiosk::lock<T1>(arg3, &arg4, arg5, v0);
        0x2::transfer::public_transfer<0x2::kiosk::KioskOwnerCap>(arg4, *0x1::option::borrow<address>(&arg1.winner_address));
        0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::events::emit_raffle_finished(0x2::object::id<Raffle<T0, T1>>(arg1));
        withdraw_balance_to_operator<T0, T1>(arg1, arg7);
        let v2 = RaffleHotPotato{kiosk_id: 0x2::object::id<0x2::kiosk::Kiosk>(arg3)};
        (v2, v1)
    }
    
    fun join_payment<T0, T1: store + key>(arg0: &mut Raffle<T0, T1>, arg1: 0x2::coin::Coin<T0>) {
        0x2::balance::join<T0>(&mut arg0.balance, 0x2::coin::into_balance<T0>(arg1));
    }
    
    public fun join_raffle<T0, T1: store + key>(arg0: &mut Raffle<T0, T1>, arg1: &mut 0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::house::House, arg2: 0x2::coin::Coin<T0>, arg3: &0x2::clock::Clock, arg4: &mut 0x2::tx_context::TxContext) {
        assert_is_raffle_finished<T0, T1>(arg0);
        assert_is_raffle_paused<T0, T1>(arg0);
        assert_cost<T0, T1>(arg0, &arg2);
        assert_max_capacity<T0, T1>(arg0);
        assert_max_per_participant<T0, T1>(arg0, 0x2::tx_context::sender(arg4));
        assert_deadline_has_not_passed<T0, T1>(arg0, arg3);
        add_participant<T0, T1>(arg0, 0x2::tx_context::sender(arg4));
        0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::house::get_fee_from_payment<T0>(arg1, &mut arg2, arg4);
        join_payment<T0, T1>(arg0, arg2);
        0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::events::emit_raffle_participant_joined(0x2::object::id<Raffle<T0, T1>>(arg0), 0x2::tx_context::sender(arg4));
    }
    
    public fun resolve_raffle_hot_potato(arg0: RaffleHotPotato, arg1: 0x2::kiosk::Kiosk) {
        let RaffleHotPotato { kiosk_id: v0 } = arg0;
        assert!(0x2::object::id<0x2::kiosk::Kiosk>(&arg1) == v0, 69420);
        0x2::transfer::public_share_object<0x2::kiosk::Kiosk>(arg1);
    }
    
    entry fun select_winner<T0, T1: store + key>(arg0: &mut Raffle<T0, T1>, arg1: &0x2::random::Random, arg2: &0x2::clock::Clock, arg3: &mut 0x2::tx_context::TxContext) {
        assert_is_raffle_paused<T0, T1>(arg0);
        assert_deadline_has_passed<T0, T1>(arg0, arg2);
        assert_winner_not_selected<T0, T1>(arg0);
        assert_item_not_withdrawn<T0, T1>(arg0);
        assert_participants_count_is_greater_than_zero<T0, T1>(arg0);
        let v0 = 0x2::random::new_generator(arg1, arg3);
        let v1 = 0x2::table_vec::borrow<address>(&arg0.participants, 0x2::random::generate_u64_in_range(&mut v0, 0, 0x2::table_vec::length<address>(&arg0.participants) - 1));
        arg0.winner_address = 0x1::option::some<address>(*v1);
        0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::events::emit_raffle_winner_selected(0x2::object::id<Raffle<T0, T1>>(arg0), *v1);
    }
    
    public fun share_raffle<T0, T1: store + key>(arg0: Raffle<T0, T1>) {
        0x2::transfer::public_share_object<Raffle<T0, T1>>(arg0);
    }
    
    fun withdraw_balance_to_operator<T0, T1: store + key>(arg0: &mut Raffle<T0, T1>, arg1: &mut 0x2::tx_context::TxContext) {
        0x2::transfer::public_transfer<0x2::coin::Coin<T0>>(0x2::coin::from_balance<T0>(0x2::balance::split<T0>(&mut arg0.balance, 0x2::balance::value<T0>(&arg0.balance)), arg1), arg0.operator);
    }
    
    public fun withdraw_raffle_item<T0, T1: store + key>(arg0: &RaffleOperatorCap, arg1: &mut Raffle<T0, T1>, arg2: &mut 0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::house::House, arg3: &mut 0x2::kiosk::Kiosk, arg4: &mut 0x2::tx_context::TxContext) : T1 {
        assert_operator_cap<T0, T1>(arg1, arg0);
        assert_winner_not_selected<T0, T1>(arg1);
        assert_is_raffle_item_unlocked<T0, T1>(arg1);
        withdraw_balance_to_operator<T0, T1>(arg1, arg4);
        0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::house::withdraw_item<T1>(arg2, arg3, 0x1::option::extract<0x2::object::ID>(&mut arg1.internal_raffle_item_id))
    }
    
    public fun withdraw_raffle_item_with_locked<T0, T1: store + key>(arg0: &RaffleOperatorCap, arg1: &mut Raffle<T0, T1>, arg2: &mut 0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::house::House, arg3: &mut 0x2::kiosk::Kiosk, arg4: &mut 0x2::tx_context::TxContext) : (T1, 0x2::transfer_policy::TransferRequest<T1>) {
        assert_operator_cap<T0, T1>(arg1, arg0);
        assert_winner_not_selected<T0, T1>(arg1);
        assert_is_raffle_item_locked<T0, T1>(arg1);
        withdraw_balance_to_operator<T0, T1>(arg1, arg4);
        0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::house::withdraw_item_with_lock<T1>(arg2, arg3, 0x1::option::extract<0x2::object::ID>(&mut arg1.internal_raffle_item_id), arg4)
    }
    
    // decompiled from Move bytecode v6
}

[utils]
module 0xafbaf841bc20499fc5d9b6a0acd1f99f278b4a5a55c2035dd98a90cded44d7cb::utils {
    public fun mul_div_u64(arg0: u64, arg1: u64, arg2: u64) : u64 {
        assert!(arg2 != 0, 1);
        ((arg0 as u128) * (arg1 as u128) / (arg2 as u128)) as u64
    }
    
    // decompiled from Move bytecode v6
}

