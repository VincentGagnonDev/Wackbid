/// Test helper module for creating kiosks with test NFTs
/// Useful for testnet deployment and testing
module contracts::test_helpers {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
    use sui::package;
    use sui::display;
    use std::string::{Self, String};

    /// Test NFT for auction testing
    /// Anyone can mint this on testnet for testing purposes
    public struct TestNFT has key, store {
        id: UID,
        name: String,
        description: String,
        image_url: String,
        number: u64,
    }

    /// One-Time-Witness for publisher
    public struct TEST_HELPERS has drop {}

    /// Initialize display for TestNFT
    fun init(otw: TEST_HELPERS, ctx: &mut TxContext) {
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"image_url"),
            string::utf8(b"number"),
        ];

        let values = vector[
            string::utf8(b"{name}"),
            string::utf8(b"{description}"),
            string::utf8(b"{image_url}"),
            string::utf8(b"#{number}"),
        ];

        let publisher = package::claim(otw, ctx);
        let mut display = display::new_with_fields<TestNFT>(
            &publisher, keys, values, ctx
        );
        display::update_version(&mut display);

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
    }

    /// Create a test NFT with custom properties
    public fun mint_test_nft(
        name: vector<u8>,
        description: vector<u8>,
        image_url: vector<u8>,
        number: u64,
        ctx: &mut TxContext
    ): TestNFT {
        TestNFT {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            image_url: string::utf8(image_url),
            number,
        }
    }

    /// Entry function: Mint a test NFT and transfer to sender
    /// Anyone can call this on testnet to get a test NFT
    public entry fun mint_and_transfer(
        name: vector<u8>,
        description: vector<u8>,
        image_url: vector<u8>,
        number: u64,
        ctx: &mut TxContext
    ) {
        let nft = mint_test_nft(name, description, image_url, number, ctx);
        transfer::public_transfer(nft, tx_context::sender(ctx));
    }

    /// Entry function: Create a kiosk with a test NFT inside
    /// Perfect for testnet setup - creates everything you need in one transaction
    /// 
    /// After calling this, you will have:
    /// - A shared Kiosk with a test NFT inside
    /// - The KioskOwnerCap to manage your kiosk
    /// 
    /// You can then immediately create an auction with this NFT!
    public entry fun create_kiosk_with_test_nft(
        name: vector<u8>,
        description: vector<u8>,
        image_url: vector<u8>,
        number: u64,
        ctx: &mut TxContext
    ) {
        // Create a new kiosk
        let (mut kiosk, kiosk_cap) = kiosk::new(ctx);
        
        // Mint a test NFT
        let nft = mint_test_nft(name, description, image_url, number, ctx);
        
        // Place NFT in the kiosk
        kiosk::place(&mut kiosk, &kiosk_cap, nft);
        
        // Share the kiosk and transfer the cap to sender
        transfer::public_share_object(kiosk);
        transfer::public_transfer(kiosk_cap, tx_context::sender(ctx));
    }

    /// Entry function: Create a kiosk with a test NFT using default values
    /// Quick setup with sensible defaults - perfect for quick testing
    public entry fun create_test_kiosk_quick(ctx: &mut TxContext) {
        create_kiosk_with_test_nft(
            b"Wackbid Test NFT",
            b"A test NFT for auction testing on Wackbid platform",
            b"https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
            1,
            ctx
        );
    }

    /// Create multiple test NFTs in a kiosk
    /// Useful for testing multiple auctions
    public entry fun create_kiosk_with_multiple_nfts(
        count: u64,
        ctx: &mut TxContext
    ) {
        // Create a new kiosk
        let (mut kiosk, kiosk_cap) = kiosk::new(ctx);
        
        let mut i = 0;
        while (i < count) {
            // Mint NFT with incremented number
            let nft = mint_test_nft(
                b"Wackbid Test NFT",
                b"Test NFT for auctions",
                b"https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
                i + 1,
                ctx
            );
            
            // Place in kiosk
            kiosk::place(&mut kiosk, &kiosk_cap, nft);
            i = i + 1;
        };
        
        // Share the kiosk and transfer the cap
        transfer::public_share_object(kiosk);
        transfer::public_transfer(kiosk_cap, tx_context::sender(ctx));
    }

    // ============ View Functions ============

    /// Get the name of a test NFT
    public fun get_name(nft: &TestNFT): String {
        nft.name
    }

    /// Get the description of a test NFT
    public fun get_description(nft: &TestNFT): String {
        nft.description
    }

    /// Get the image URL of a test NFT
    public fun get_image_url(nft: &TestNFT): String {
        nft.image_url
    }

    /// Get the number of a test NFT
    public fun get_number(nft: &TestNFT): u64 {
        nft.number
    }
}
