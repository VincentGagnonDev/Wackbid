module wackbid::dashboard;

public struct AdminCap has key {
    id:UID
}

public struct Dashboard has key {
    id:UID,
    auctions_id : vector<ID>
}




fun init(ctx: &mut TxContext) {

    
}