# Property Name Changes

Old auction properties -> New auction properties:
- auction.currentBid -> auction.highest_bid (in MIST, use mistToSui() to convert)
- auction.minimumBid -> N/A (not in new contract)
- auction.endTime -> auction.expiry_time
- auction.active -> auction.is_active
- auction.highestBidder -> auction.highest_bidder
- auction.nftType -> auction.nft_type
- auction.nft_id -> auction.item_id

Hook changes:
- useSignAndExecuteTransactionBlock -> useSignAndExecuteTransaction
- transactionBlock: tx -> transaction: tx

Function changes:
- closeAuctionTransaction -> finalizeAuctionTransaction
- cancelAuctionTransaction -> N/A (not in new contract)
