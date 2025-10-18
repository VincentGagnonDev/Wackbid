
module wackbid::auctions;


const EBidIsLowerThanTheHighestBid: u64 = 0;



public struct Auction has key {
    id:UID,
    expiration:u64,
    creator:address,
    participants:vector<address>,
    highest_bid:u64,
    highest_bidder:address
}


public fun create(
    expiration:u64,
    ctx: &mut TxContext
) : ID {
    let auction = Auction{
        id:object::new(ctx),
        expiration,
        creator:ctx.sender(),
        highest_bid: 0,
        highest_bidder: ctx.sender(),
        participants: vector[]
    };

    let id = auction.id.to_inner();
    transfer::transfer(auction, ctx.sender());

    id
    
}


public fun bid(auction: &mut Auction, bid_amount: u64, ctx: &mut TxContext) {
    assert!(auction.highest_bid < bid_amount, EBidIsLowerThanTheHighestBid);
    auction.highest_bid = bid_amount;
    auction.highest_bidder = ctx.sender();
    

    if (!auction.participants.contains(&ctx.sender())) {
        auction.participants.push_back(ctx.sender());
    }

    transfer::share_object(dashboard);
}


#[test]
fun test_create_auction_bid() {
    use sui::test_scenario;
    use std::debug;

    let creator = @0xCA;

    let mut scenario = test_scenario::begin(creator);
    {
        let id = create(1030123013, scenario.ctx());
        debug::print(&id);
    };

    scenario.next_tx(creator);
    {
        let mut auction = scenario.take_from_sender<Auction>();
        bid(&mut auction, 10, scenario.ctx());

        assert!(auction.highest_bid != 0);
        debug::print(&auction.highest_bidder);
        scenario.return_to_sender(auction);
    };

    scenario.end();
}


