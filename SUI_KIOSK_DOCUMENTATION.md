Sui Kiosk
Kiosk is a decentralized system for commerce applications on Sui. It consists of Kiosk objects - shared objects owned by individual parties that store assets and allow listing them for sale as well as utilize custom trading functionality - for example, an auction. While being highly decentralized, Sui Kiosk provides a set of strong guarantees:

Kiosk owners retain ownership of their assets to the moment of purchase.
Creators set custom policies - sets of rules applied to every trade (such as pay royalty fee or do some arbitrary action X).
Marketplaces can index events the Kiosk object emits and subscribe to a single feed for on-chain asset trading.
Practically, Kiosk is a part of the Sui framework, and it is native to the system and available to everyone out of the box.

info
See the Kiosk SDK documentation for examples of working with Kiosk using TypeScript.

Sui Kiosk owners
Anyone can create a Sui Kiosk. Ownership of a kiosk is determined by the owner of the KioskOwnerCap, a special object that grants full access to a single kiosk. As the owner, you can sell any asset with a type (T) that has a shared TransferPolicy available, or you can use a kiosk to store assets even without a shared policy. You can’t sell or transfer any assets from your kiosk that do not have an associated transfer policy available.

To sell an item, if there is an existing transfer policy for the type (T), you just add your assets to your kiosk and then list them. You specify an offer amount when you list an item. Anyone can then purchase the item for the amount of SUI specified in the listing. The associated transfer policy determines what the buyer can do with the purchased asset.

A kiosk owner can:

Place and take items
List items for sale
Add and remove Extensions
Withdraw profits from sales
Borrow and mutate owned assets
Access the full set of trading tools, such as auctions, lotteries, and collection bidding
Sui Kiosk for buyers
A buyer is a party that purchases (or - more generally - receives) items from kiosks, anyone on the network can be a buyer (and, for example, a kiosk owner at the same time).

Benefits:

Buyers get access to global liquidity and can get the best offer
Buyers can place bids on collections through their kiosks
Most buyer actions performed in kiosks clean up seller objects, which results in free (gas-less) actions
Responsibilities:

Buyer is the party that pays the fees if they're set in the policy
Buyer must follow the rules set by creators or a transaction won't succeed
Guarantees:

When using a custom trading logic such as an auction, the items are guaranteed to be unchanged until the trade is complete
Sui Kiosk for marketplaces
As a marketplace operator, you can implement Sui Kiosk to watch for offers made in a collection of kiosks and display them on a marketplace site. You can also implement a custom system using Kiosk extensions (created by the community or third-parties). For example, marketplaces can use a TransferPolicyCap to implement application-specific transfer rules.

Sui Kiosk for creators
As a creator, Sui Kiosk supports strong enforcement for transfer policies and associated rules to protect assets and enforce asset ownership. Sui Kiosk gives creators more control over their creations, and puts creators and owners in control of how their works can be used.

Creator is a party that creates and controls the TransferPolicy for a single type. For example, the authors of SuiFrens are the Creators of the SuiFren<Capy> type and act as creators in the Kiosk ecosystem. Creators set the policy, but they might also be the first sellers of their assets through a kiosk.

Creators can:

Set any rules for trades
Set multiple ways ("tracks") of rules
Enable or disable trades at any moment with a policy
Enforce policies (like royalties) on all trades
Perform a primary sale of their assets through a kiosk
All of the above is effective immediately and globally.

Creators cannot:

Take or modify items stored in someone else's kiosk
Restrict taking items from kiosks if the "locking" rule was not set in the policy
Sui Kiosk guarantees
Sui Kiosk provides a set of guarantees that Sui enforces through smart contracts. These guarantees include:

Every trade in Sui Kiosk requires a TransferPolicy resolution. This gives creators control over how their assets can be traded.
True ownership, which means that only a kiosk owner can take, list, borrow, or modify the assets added to their kiosk. This is similar to how single-owner objects work on Sui.
Strong policy enforcement, for example Royalty policies, that lets creators enable or disable policies at any time that applies to all trades on the platform for objects with that policy attached.
Changes to a TransferPolicy apply instantly and globally.
In practice, these guarantees mean that:

When you list an item for sale, no one can modify it or take it from the kiosk.
When you define a PurchaseCap, an item remains locked and you can’t modify or take the item from the kiosk unless the trade uses or returns the PurchaseCap.
You can remove any rule at any time (as the owner).
You can disable any extension at any time (as the owner).
The state of an extension state is always accessible to the extension.
Asset states in Sui Kiosk
Sui Kiosk is a shared object that can store heterogeneous values, such as different sets of asset collectibles. When you add an asset to your kiosk, it has one of the following states:

PLACED: An item placed in the kiosk using the kiosk::place function. The kiosk owner can withdraw it and use it directly, borrow it (mutably or immutably), or list an item for sale.
LOCKED: An item placed in the kiosk using the kiosk::lock function. You can’t withdraw a Locked item from a kiosk, but you can borrow it mutably and list it for sale. Any item placed in a kiosk that has an associated kiosk lock policy have a LOCKED state.
LISTED: An item in the kiosk that is listed for sale using the kiosk::list or kiosk::place_and_list functions. You can’t modify an item while listed, but you can borrow it immutably or delist it, which returns it to its previous state.
LISTED EXCLUSIVELY: An item placed or locked in the kiosk by an extension that calls the kiosk::list_with_purchase_cap function. Only the kiosk owner can approve calling the function. The owner can only borrow it immutably. The extension must provide the functionality to delist / unlock the asset, or it might stay locked forever. Given that this action is explicitly performed by the owner - it is the responsibility of the owner to choose verified and audited extensions to use.
When someone purchases an asset from a kiosk, the asset leaves the kiosk and ownership transfers to the buyer’s address.

Open a Sui Kiosk
To use a Sui Kiosk, you must create one and have the KioskOwnerCap that matches the Kiosk object. You can create a new kiosk using a single transaction by calling the kiosk::default function. The function creates and shares a Kiosk, and transfers the KioskOwnerCap to your address.

Create a Sui Kiosk using programmable transaction blocks
let tx = new Transaction();
tx.moveCall({
	target: '0x2::kiosk::default',
});

Create a Sui Kiosk using the Sui CLI
tip
Beginning with the Sui v1.24.1 release, the --gas-budget option is no longer required for CLI commands.

$ sui client call \
    --package 0x2 \
    --module kiosk \
    --function default \
    --gas-budget 1000000000

Create a Sui Kiosk with advanced options
For more advanced use cases, when you want to choose the storage model or perform an action right away, you can use the programmable transaction block (PTB) friendly function kiosk::new. Kiosk is designed to be shared. If you choose a different storage model, such as owned, your kiosk might not function as intended or not be accessible to other users. You can make sure your kiosk works by testing it on Sui Testnet.

Create a Sui Kiosk with advanced options using programmable transaction blocks
let tx = new Transaction();
let [kiosk, kioskOwnerCap] = tx.moveCall({
	target: '0x2::kiosk::new',
});

tx.transferObjects([kioskOwnerCap], sender);
tx.moveCall({
	target: '0x2::transfer::public_share_object',
	arguments: [kiosk],
	typeArguments: '0x2::kiosk::Kiosk',
});

Create a Sui Kiosk with advanced options using the Sui CLI
Sui CLI does not support PTBs and transaction chaining yet. You can use the kiosk::default function instead.

Place items in and take items from your kiosk
As a kiosk owner, you can place any assets into your Sui Kiosk. You can take any item from your kiosk that is not currently listed for sale.

There's no limitations on which assets you can place in your kiosk. However, you can’t necessarily list and trade all of the items you place in your kiosk. The TransferPolicy associated with the type for the item determines whether you can trade it. To learn more, see the Purchase items from a kiosk section.

Place an item in your kiosk
To place an item to the kiosk, the owner needs to call the sui::kiosk::place function on the Kiosk object and pass the KioskOwnerCap and the Item as arguments.

ITEM_TYPE in the following examples represents the full type of the item.

Place an item using programmable transaction blocks
let tx = new Transaction();

let itemArg = tx.object('<ID>');
let kioskArg = tx.object('<ID>');
let kioskOwnerCapArg = tx.object('<ID>');

tx.moveCall({
	target: '0x2::kiosk::place',
	arguments: [kioskArg, kioskOwnerCapArg, itemArg],
	typeArguments: ['<ITEM_TYPE>'],
});

Place an item using the Sui CLI
$ sui client call \
    --package 0x2 \
    --module kiosk \
    --function place \
    --args "<KIOSK_ID>" "<CAP_ID>" "<ITEM_ID>" \
    --type-args "<ITEM_TYPE>" \
    --gas-budget 1000000000

Take items from a kiosk
To take an item from a kiosk you must be the kiosk owner. As the owner, call the sui::kiosk::take function on the Kiosk object, and pass the KioskOwnerCap and ID of the item as arguments.

ITEM_TYPE in the following examples represents the full type of the item.

Take an item from a kiosk using programmable transaction blocks
let tx = new Transaction();

let itemId = tx.pure.id('<ITEM_ID>');
let kioskArg = tx.object('<ID>');
let kioskOwnerCapArg = tx.object('<ID>');

let item = tx.moveCall({
	target: '0x2::kiosk::take',
	arguments: [kioskArg, kioskOwnerCapArg, itemId],
	typeArguments: ['<ITEM_TYPE>'],
});

Take an item from a kiosk using the Sui CLI
The kiosk::take function is built to be PTB friendly and returns the asset. The Sui CLI does not yet support transaction chaining.

Lock items in a kiosk
Some policies require that assets never get removed from a kiosk, such as for strong royalty enforcement. To support this, Sui Kiosk provides a locking mechanism. Locking is similar to placing except that you can't take a locked asset out of the kiosk.

To lock an asset in a kiosk, call the sui::kiosk::lock function. To ensure that you can later unlock the asset you must associate a TransferPolicy with the asset.

info
After you lock an asset, you must use list or list_with_purchase_cap functions to list it.

Lock an item in a kiosk
When you use the lock function, similar to using the place function, you specify the KioskOwnerCap and the Item as arguments. But to lock the item, you must also show the TransferPolicy.

<ITEM_TYPE> in the following examples represents the full type of the asset.

Lock an item using programmable transaction blocks
const tx = new Transaction();

let kioskArg = tx.object('<ID>');
let kioskOwnerCapArg = tx.object('<ID>');
let itemArg = tx.object('<ID>');
let transferPolicyArg = tx.object('<ID>');

tx.moveCall({
	target: '0x2::kiosk::lock',
	arguments: [kioskArg, kioskOwnerCapArg, transferPolicyArg, itemArg],
	typeArguments: ['<ITEM_TYPE>'],
});

Lock an item using the Sui CLI
$ sui client call \
    --package 0x2 \
    --module kiosk \
    --function lock \
    --args "<KIOSK_ID>" "<CAP_ID>" "<TRANSFER_POLICY_ID>" "<ITEM_ID>" \
    --type-args "<ITEM_TYPE>" \
    --gas-budget 1000000000

List and delist items from a kiosk
Sui Kiosk provides basic trading functionality. As a kiosk owner, you can list assets for sale, and buyers can discover and purchase them. Sui Kiosk supports listing items by default with three primary functions:

kiosk::list - list an asset for sale for a fixed price
kiosk::delist - remove an existing listing
kiosk::purchase - purchase an asset listed for sale
Anyone on the network can purchase an item listed from a Sui Kiosk. To learn more about the purchase flow, see the Purchase section. To learn more about asset states and what can be done with a listed item, see the Asset States section.

List an item from a kiosk
As a kiosk owner, you can use the kiosk::list function to list any asset you added to your kiosk. Include the item to sell and the list price as arguments. All listings on Sui are in SUI tokens. When you list an item, Sui emits a kiosk::ItemListed event that contains the kiosk ID, item ID, type of the item, and the list price.

List an item using programmable transaction blocks
let tx = new Transaction();

let kioskArg = tx.object('<ID>');
let capArg = tx.object('<ID>');
let itemId = tx.pure.id('<ID>');
let itemType = 'ITEM_TYPE';
let priceArg = tx.pure.u64('<price>'); // in MIST (1 SUI = 10^9 MIST)

tx.moveCall({
	target: '0x2::kiosk::list',
	arguments: [kioskArg, capArg, itemId, priceArg],
	typeArguments: [itemType],
});

List an item using the Sui CLI
$ sui client call \
    --package 0x2 \
    --module kiosk \
    --function list \
    --args "<KIOSK_ID>" "<CAP_ID>" "<ITEM_ID>" "<PRICE>" \
    --type-args "ITEM_TYPE" \
    --gas-budget 1000000000

Delist an item
As a kiosk owner you can use the kiosk::delist to delist any currently listed asset. Specify the item to delist as an argument.

When you delist an item, Sui returns to the kiosk owner the gas fees charged to list the item.

When you delist an item, Sui emits a kiosk::ItemDelisted event that contains the kiosk ID, item ID, and the type of the item.

Delist an item using the programmable transaction blocks
let tx = new Transaction();
let kioskArg = tx.object('<ID>');
let capArg = tx.object('<ID>');
let itemId = tx.pure.id('<ID>');
let itemType = 'ITEM_TYPE';

tx.moveCall({
	target: '0x2::kiosk::delist',
	arguments: [kioskArg, capArg, itemId],
	typeArguments: [itemType],
});

Delist an item using the Sui CLI
$ sui client call \
    --package 0x2 \
    --module kiosk \
    --function delist \
    --args "<KIOSK_ID>" "<CAP_ID>" "<ITEM_ID>" \
    --type-args "ITEM_TYPE" \
    --gas-budget 1000000000

Purchase an item from a kiosk
Anyone that has an address on the Sui network can purchase an item listed from a Sui Kiosk. To purchase an item, you can use the kiosk::purchase function. Specify the item to purchase and pay the list price set by the kiosk owner.

You can discover the items listed on the network with the kiosk::ItemListed event.

When you use the kiosk::purchase function, it returns the purchased asset and the TransferRequest for the type associated with the asset. To complete the purchase, you must meet the terms defined in the TransferPolicy applied to the asset.

Borrow an item from a kiosk
As a kiosk owner, you can access an asset placed or locked in a kiosk without taking the asset from the kiosk. You can always borrow the asset immutably. Whether you can mutably borrow an asset depends on the state of the asset. For example, you can’t borrow a listed asset because you can’t modify it while listed. The functions available include:

kiosk::borrow: Returns an immutable reference to the asset
kiosk::borrow_mut: Returns a mutable reference to the asset
kiosk::borrow_val: A PTB-friendly version of borrow_mut, which allows you to take an asset and place it back in the same transaction.
Immutable borrow
You can always borrow an asset from a kiosk immutably. You can use the kiosk::borrow function to borrow an asset, however, it is not possible to use references within a programmable transaction block. To access the asset you must use a published module (function).

Immutably borrow an asset using Sui Move
module examples::immutable_borrow;

use sui::kiosk::{Self, Kiosk, KioskOwnerCap};

public fun immutable_borrow_example<T>(self: &Kiosk, cap: &KioskOwnerCap, item_id: ID): &T {
    self.borrow(cap, item_id)
}

Mutable borrow with borrow_mut
You can mutably borrow an asset from a kiosk if it is not listed. You can use the kiosk::borrow_mut function to mutably borrow an asset. However, it is not possible to use references within a PTB, so to access the mutably borrowed asset you must use a published module (function).

Mutably borrow an asset using Sui Move
module examples::mutable_borrow;

use sui::kiosk::{Self, Kiosk, KioskOwnerCap};

public fun mutable_borrow_example<T>(
    self: &mut Kiosk, cap: &KioskOwnerCap, item_id: ID
): &mut T {
    self.borrow_mut(cap, item_id)
}

Mutable borrow with borrow_val
Use the PTB-friendly kiosk::borrow_val function to take an asset and place it back in the same transaction. To make sure the asset is placed back into the kiosk, the function obliges the caller with a Hot Potato. See The Move Book for more information on the Hot Potato pattern.

Mutable borrow with borrow_val using programmable transaction blocks
let tx = new Transaction();

let itemType = 'ITEM_TYPE';
let itemId = tx.pure.id('<ITEM_ID>');
let kioskArg = tx.object('<ID>');
let capArg = tx.object('<ID>');

let [item, promise] = tx.moveCall({
	target: '0x2::kiosk::borrow_val',
	arguments: [kioskArg, capArg, itemId],
	typeArguments: [itemType],
});

// freely mutate or reference the `item`
// any calls are available as long as they take a reference
// `returnValue` must be explicitly called

tx.moveCall({
	target: '0x2::kiosk::return_val',
	arguments: [kioskArg, item, promise],
	typeArguments: [itemType],
});

Withdraw proceeds from a completed sale
When someone purchases an item, Sui stores the proceeds from the sale in the kiosk. As the kiosk owner, you can withdraw the proceeds at any time by calling the kiosk::withdraw function. The function is simple, but because it is PTB friendly it is not currently supported in the Sui CLI.

Withdraw proceeds using programmable transaction blocks
let tx = new Transaction();
let kioskArg = tx.object('<ID>');
let capArg = tx.object('<ID>');

// because the function uses an Option<u64> argument,
// constructing is a bit more complex
let amountArg = tx.moveCall({
	target: '0x1::option::some',
	arguments: [tx.pure.u64('<amount>')],
	typeArguments: ['u64'],
});

// alternatively
let withdrawAllArg = tx.moveCall({
	target: '0x1::option::none',
	typeArguments: ['u64'],
});

let coin = tx.moveCall({
	target: '0x2::kiosk::withdraw',
	arguments: [kioskArg, capArg, amountArg],
	typeArguments: ['u64'],
});




//////////////////////////////////////



Kiosk Apps
Kiosk apps are a way to extend the functionality of Sui Kiosk while keeping the core functionality intact. You can develop apps to add new features to a kiosk without having to modify the core code or move the assets elsewhere.

There are two types of apps:

Basic apps
Permissioned apps
Basic apps
Basic Kiosk apps do not require Kiosk Apps API to function. They usually serve the purpose of adding custom metadata to a kiosk or wrapping/working with existing objects such as Kiosk or KioskOwnerCap. An example of an app that does not require the API is the Personal Kiosk app.

UID access via the uid_mut
Kiosk has an id: UID field like all objects on Sui, which allows this object to be uniquely identified and carry custom dynamic fields and dynamic object fields. The Kiosk itself is built around dynamic fields and features like place and list are built around dynamic object fields.

The uid_mut_as_owner function
Kiosk can carry additional dynamic fields and dynamic object fields. The uid_mut_as_owner function allows the Kiosk owner to mutably access the UID of the Kiosk object and use it to add or remove custom fields.

Function signature:

kiosk::uid_mut_as_owner(self: &mut Kiosk, cap: &KioskOwnerCap): &mut UID

The public uid getter
Anyone can read the uid of kiosks. This allows third party modules to read the fields of the kiosk if they're allowed to do so. Therefore enabling the object capability and other patterns.

Basic app ideas
You can attach custom dynamic fields to your kiosks that anyone can then read (but only you can modify), you can use this to implement basic apps. For example, a Kiosk Name app where you as the kiosk owner can set a name for the kiosk, attach it as a dynamic field, and make it readable by anyone.

module examples::kiosk_name_ext;

use std::string::String;
use sui::dynamic_field as df;
use sui::kiosk::{Self, Kiosk, KioskOwnerCap};

/// The dynamic field key for the Kiosk Name Extension
struct KioskName has copy, store, drop {}

/// Add a name to the Kiosk (in this implementation can be called only once)
public fun add(self: &mut Kiosk, cap: &KioskOwnerCap, name: String) {
    let uid_mut = self.uid_mut_as_owner(cap);
    df::add(uid_mut, KioskName {}, name)
}

/// Try to read the name of the Kiosk - if set - return Some(String), if not - None
public fun name(self: &Kiosk): Option<String> {
    if (df::exists_(self.uid(), KioskName {})) {
        option::some(*df::borrow(self.uid(), KioskName {}))
    } else {
        option::none()
    }
}

Permissioned apps using the Kiosk Apps API
Permissioned apps use the Kiosk Apps API to perform actions in the kiosk. They usually imply interaction with a third party and provide guarantees for the storage access (preventing malicious actions from the seller).

Just having access to the uid is often not enough to build an app due to the security limitations. Only the owner of a kiosk has full access to the uid, which means that an app involving a third party would require involvement from the kiosk owner in every step of the process.

In addition to limited and constrained access to storage, app permissions are also owner dependent. In the default setup, no party can place or lock items in a kiosk without its owner's consent. As a result, some cases such as collection bidding (offering X SUI for any item in a collection) requires the kiosk owner to approve the bid.

kiosk_extension module
The kiosk_extension module addresses concerns over owner bottlenecks and provides more guarantees for storage access. The module provides a set of functions that enable you to perform certain actions in the kiosk without the kiosk owner's involvement and have a guarantee that the storage of the app is not tampered with.

module example::my_extension;

use sui::kiosk_extension;

// ...

App lifecycle
These are the key points in the lifecycle of a Sui Kiosk app:

You can only install an app with an explicit call in the kiosk_extension module.
A kiosk owner can revoke permissions of an app at any time by calling the disable function.
A kiosk owner can re-enable a disabled app at any time by calling the enable function.
You can only remove apps if the app storage is empty (all items are removed).
Adding an app
For the app to function, the kiosk owner first needs to install it. To achieve that, an app needs to implement the add function that the kiosk owner calls to request all necessary permissions.

Implementing add function
The signature of the kiosk_extension::add function requires the app witness, making it impossible to install an app without an explicit implementation. The following example shows how to implement the add function for an app that requires the place permission:

module examples::letterbox_ext;

use sui::kiosk_extension;

// ... dependencies

/// The expected set of permissions for extension. It requires `place`.
const PERMISSIONS: u128 = 1;

/// The Witness struct used to identify and authorize the extension.
struct Extension has drop {}

/// Install the Mallbox extension into the Kiosk.
public fun add(kiosk: &mut Kiosk, cap: &KioskOwnerCap, ctx: &mut TxContext) {
    kiosk_extension::add(Extension {}, kiosk, cap, PERMISSIONS, ctx)
}

App permissions
Apps can request permissions from the kiosk owner on installation. Permissions follow the all or nothing principle. If the kiosk owner adds an app, it gets all of the requested permissions; if the kiosk owner then disables an app, it loses all of its permissions.

Structure
Permissions are represented as a u128 integer storing a bitmap. Each of the bits corresponds to a permission, the first bit is the least significant bit. The following table lists all permissions and their corresponding bit:

Bit	Decimal	Permission
0000	0	No permissions
0001	1	App can place
0010	2	App can place and lock
0011	3	App can place and lock
info
Currently, Sui Kiosk has only two permissions: place (first bit) and lock and place (second bit). The remaining bits are reserved for future use.

Using permissions in the add function
It's considered good practice to define a constant containing permissions of the app:

module examples::letterbox_ext;
// ... dependencies

/// The expected set of permissions for the app. It requires `place`.
const PERMISSIONS: u128 = 1;

/// The witness struct used to identify and authorize the app.
struct Extension has drop {}

/// Install the Mallbox app into the kiosk and request `place` permission.
public fun add(kiosk: &mut Kiosk, cap: &KioskOwnerCap, ctx: &mut TxContext) {
    kiosk_extension::add(Extension {}, kiosk, cap, PERMISSIONS, ctx)
}

Accessing protected functions
If an app requests and is granted permissions (and isn't disabled), it can access protected functions. The following example shows how to access the place function:

module examples::letterbox_ext;
// ...

/// Emitted when trying to place an item without permissions.
const ENotEnoughPermissions: u64 = 1;

/// Place a letter into the kiosk without the `KioskOwnerCap`.
public fun place(kiosk: &mut Kiosk, letter: Letter, policy: &TransferPolicy<T>) {
    assert!(kiosk_extension::can_place<Extension>(kiosk), ENotEnoughPermissions)

    kiosk_extension::place(Extension {}, kiosk, letter, policy)
}

Currently, two functions are available:

place<Ext, T>(Ext, &mut Kiosk, T, &TransferPolicy<T>) - similar to place
lock<Ext, T>(Ext, &mut Kiosk, T, &TransferPolicy<T>) - similar to lock
Checking permissions
Use the can_place<Ext>(kiosk: &Kiosk): bool function to check if the app has the place permission. Similarly, you can use the can_lock<Ext>(kiosk: &Kiosk): bool function to check if the app has the lock permission. Both functions make sure that the app is enabled, so you don't need to explicitly check for that.

App storage
Every app gets its isolated storage as a bag type that only the app module can access (providing the app witness). See The Move Book to learn more about dynamic collections, like bags, available in Move. After you install an app, it can use the storage to store its data. Ideally, the storage should be managed in a way that allows the app to be removed from the kiosk if there are no active trades or other activities happening at the moment.

The storage is always available to the app if it is installed. The owner of a kiosk can't access the storage of the app if the logic for it is not implemented.

Accessing the storage
An installed app can access the storage mutably or immutably using one of the following functions:

storage(_ext: Extension {}, kiosk: &Kiosk): Bag: returns a reference to the storage of the app. Use the function to read the storage.
storage_mut(_ext: Extension {}, kiosk: &mut Kiosk): &mut Bag: returns a mutable reference to the storage of the app. Use the function to read and write to the storage.
Disabling and removing
The kiosk owner can disable any app at any time. Doing so revokes all permissions of the app and prevents it from performing any actions in the kiosk. The kiosk owner can also re-enable the app at any time.

Disabling an app does not remove it from the kiosk. An installed app has access to its storage until completely removed from the kiosk.

Disabling an app
Use the disable<Ext>(kiosk: &mut Kiosk, cap: &KioskOwnerCap) function to disable an app. It revokes all permissions of the app and prevents it from performing any protected actions in the kiosk.

Example PTB

let txb = new TransactionBuilder();
let kioskArg = tx.object('<ID>');
let capArg = tx.object('<ID>');

txb.moveCall({
    target: '0x2::kiosk_extension::disable',
    arguments: [ kioskArg, capArg ],
    typeArguments: '<letter_box_package>::letterbox_ext::Extension'
});

Removing an app
You can remove an app only if the storage is empty. Use the remove<Ext>(kiosk: &mut Kiosk, cap: &KioskOwnerCap) function to facilitate removal. The function removes the app, unpacks the app storage and configuration and rebates the storage cost to the kiosk owner. Only the kiosk owner can perform this action.

The call fails if the storage is not empty.

Example PTB

let txb = new TransactionBuilder();
let kioskArg = tx.object('<ID>');
let capArg = tx.object('<ID>');

txb.moveCall({
    target: '0x2::kiosk_extension::remove',
    arguments: [ kioskArg, capArg ],
    typeArguments: '<letter_box_package>::letterbox_ext::Extension'
});




/////////////////////////////////////////////////////////



NFT Rental Example
NFT renting is a mechanism that allows individuals without ownership or possession of a specific NFT to temporarily utilize or experience it. The implementation of this process leverages the Kiosk Apps standard to establish an infrastructure for rental transactions. This approach closely aligns with the Ethereum ERC-4907 renting standard, making it a suitable choice for Solidity-based use cases intended for implementation on Sui.

The NFT Rental example satisfies the following project requirements:

Enable a lender to offer their assets for renting for a specified period of time (list for renting).
Enable a lender to define the rental duration.
Borrower has to comply with the renting period.
Borrower can gain mutable or immutable access to the NFT.
Immutable access is read-only.
Mutable, the lender should consider downgrade and upgrade operations and include them in the renting fee.
After the renting period has finished, the item can be sold normally.
Creator-defined royalties are respected by encompassing transfer policy rules.
Use cases
Some use cases for real-world NFT rental example include:

Gaming
Ticketing
Virtual land
Temporary assets and subscriptions
Gaming
There are multiple cases in gaming where renting NFTs can be beneficial to user experience:

In-game assets: NFTs can represent unique in-game items, characters, skins, or accessories. Players can rent these assets securely.
Ownership and authenticity: NFTs provide a transparent and immutable record of ownership, ensuring that players who truly own their in-game items can rent them and receive back the item under rent after the renting period expires. This can combat issues like fraud and counterfeiting.
Cross-game integration: Renting NFTs can work across multiple games, allowing players to carry and rent their unique items or characters from one game to another, fostering interoperability.
Gaming collectibles: NFTs can represent digital collectibles within games, creating a digital asset ecosystem where players can rent unique items.
Ticketing
In the realm of ticketing, NFTs play a pivotal role in enhancing transferability. These digital assets facilitate a secure and traceable transfer, resale, or rental of tickets, mitigating the risk of counterfeit tickets within the secondary market. The blockchain-based nature of NFTs ensures transparency and authenticity in each transaction, providing users with a reliable and fraud-resistant means to engage in ticket-related activities. This innovation not only simplifies the process for ticket holders but also contributes to a more trustworthy and efficient secondary ticket market.

Virtual land
Renting virtual lands and offices in the metaverse provides businesses with flexible solutions, enabling event companies to host gatherings without the commitment of permanent acquisitions and facilitating remote work through virtual offices. This approach not only offers cost-effective alternatives but also aligns with the evolving dynamics of digital business operations.

Temporary assets and subscriptions
Temporary assets and subscriptions are notable applications of rental NFTs, offering accessibility to virtual experiences like high-end virtual casinos or curated digital fashion. These NFTs cater to diverse budgets, broadening audience reach. Subscription rentals extend to pools of digital assets, allowing users to pay monthly for a set number of items, fostering accessibility, user retention, and acquisition. Holders can rent out unused subscriptions, ensuring no loss for them, potential customer gains for the protocol, and a commitment-free trial for temporary holders. This showcases the adaptability and user-centric appeal of rental NFTs in diverse scenarios.

Smart contract design
warning
Transferring kiosks might result in unexpected behaviors while an asset is being rented. If you want to disallow kiosk transferring all together, consider using personal kiosks.

The rental smart contract uses the Kiosk Apps standard. Both the lender and borrower must install a Kiosk extension to take part, and the creator of the borrowed asset type must create a rental policy and ProtectedTP object to allow the extension to manage rentals while enforcing royalties.

info
This implementation is charging a rental fee based on days. You can re-purpose and update the logic to support charging per hour, or even seconds.

Move modules
The NFT Rental example uses a single module, nft_rental.move. You can find the source for this file hosted in the sui repository in the examples directory. The source code includes extensive comments to help you follow the example's logic and structure.

nft_rental
The nft_rental module provides an API that facilitates lending or borrowing through the following operations:

List for renting
Delist from renting
Rent
Borrow by reference and borrow by value
Reclaim for the lender
Structs
The object model of the nft_rental module provides the structure of the app, beginning with the Rentables object. The struct has only the drop ability and acts as the extension key for the Kiosk Rentables extension.

public struct Rentables has drop {}

The Rented struct represents a rented item. The only field the struct includes is the ID of the object. It is used as the dynamic field key in the borrower's Bag entry when someone is actively borrowing an item. The struct has store, copy, and drop abilities because they are necessary for all dynamic field keys.

public struct Rented has store, copy, drop { id: ID }

The Listed struct represents a listed item. The only field the struct includes is the ID of the object. It is used as the dynamic field key in the renter's Bag entry after an item is listed for renting. Like Rented, this struct has store, copy, and drop abilities because they are necessary for all dynamic field keys.

public struct Listed has store, copy, drop { id: ID }

The Promise struct is created for borrowing by value. The Promise operates as the hot potato (a struct that has no capabilities that you can only pack and unpack in its module) that can only be resolved by returning the item back to the extension's Bag.

The Promise field lacks the store ability as it shouldn't be wrapped inside other objects. It also lacks the drop ability because only the return_val function can consume it.

public struct Promise {
  item: Rented,
  duration: u64,
  start_date: u64,
  price_per_day: u64,
  renter_kiosk: address,
  borrower_kiosk: ID
}

The Rentable struct is as a wrapper object that holds an asset that is being rented. Contains information relevant to the rental period, cost, and renter. This struct requires the store ability because it stores a value T that definitely also has store.

public struct Rentable<T: key + store> has store {
  object: T,
  /// Total amount of time offered for renting in days.
  duration: u64,
  /// Initially undefined, is updated once someone rents it.
  start_date: Option<u64>,
  price_per_day: u64,
  /// The kiosk ID that the object was taken from.
  kiosk_id: ID,
}

The RentalPolicy struct is a shared object that every creator mints. The struct defines the royalties the creator receives from each rent invocation.

public struct RentalPolicy<phantom T> has key, store {
  id: UID,
  balance: Balance<SUI>,
  /// Note: Move does not support float numbers.
  ///
  /// If you need to represent a float, you need to determine the desired
  /// precision and use a larger integer representation.
  ///
  /// For example, percentages can be represented using basis points:
  /// 10000 basis points represent 100% and 100 basis points represent 1%.
  amount_bp: u64
}

The ProtectedTP object is a shared object that creators mint to enable renting. The object provides authorized access to an empty TransferPolicy. This is in part required because of the restrictions that Kiosk imposes around royalty enforced items and their tradability. Additionally it allows the rental module to operate within the Extension framework while maintaining the guarantee that the assets handled will always be tradable.

A protected empty transfer policy is required to facilitate the rental process so that the extension can transfer the asset without any additional rules to resolve (like lock rule, loyalty rule, and so on). If creators want to enforce royalties on rentals, they can use the RentalPolicy detailed previously.

public struct ProtectedTP<phantom T> has key, store {
  id: UID,
  transfer_policy: TransferPolicy<T>,
  policy_cap: TransferPolicyCap<T>
}

Function signatures
The NFT Rental example includes the following functions that define the project's logic.

The install function enables installation of the Rentables extension in a kiosk. The party facilitating the rental process is responsible for making sure that the user installs the extension in their kiosk.

public fun install(
  kiosk: &mut Kiosk,
  cap: &KioskOwnerCap,
  ctx: &mut TxContext
){
  kiosk_extension::add(Rentables {}, kiosk, cap, PERMISSIONS, ctx);
}

The remove function enables the owner (and only the owner) of the kiosk to remove the extension. The extension storage must be empty for the transaction to succeed. The extension storage empties after the user is no longer borrowing or renting any items. The kiosk_extension::remove function performs the ownership check before executing.

public fun remove(kiosk: &mut Kiosk, cap: &KioskOwnerCap, _ctx: &mut TxContext){
  kiosk_extension::remove<Rentables>(kiosk, cap);
}

The setup_renting function mints and shares a ProtectedTP and a RentalPolicy object for type T. The publisher of type T is the only entity that can perform the action.

public fun setup_renting<T>(publisher: &Publisher, amount_bp: u64, ctx: &mut TxContext) {
  // Creates an empty TP and shares a ProtectedTP<T> object.
  // This can be used to bypass the lock rule under specific conditions.
  // Storing inside the cap the ProtectedTP with no way to access it
  // as we do not want to modify this policy
  let (transfer_policy, policy_cap) = transfer_policy::new<T>(publisher, ctx);

  let protected_tp = ProtectedTP {
    id: object::new(ctx),
    transfer_policy,
    policy_cap,
  };

  let rental_policy = RentalPolicy<T> {
    id: object::new(ctx),
    balance: balance::zero<SUI>(),
    amount_bp,
  };

  transfer::share_object(protected_tp);
  transfer::share_object(rental_policy);
}

The list function enables listing of an asset within the Rentables extension's bag, creating a bag entry with the asset's ID as the key and a Rentable wrapper object as the value. Requires the existence of a ProtectedTP transfer policy that only the creator of type T can create. The function assumes an item is already placed (and optionally locked) in a kiosk.

public fun list<T: key + store>(
  kiosk: &mut Kiosk,
  cap: &KioskOwnerCap,
  protected_tp: &ProtectedTP<T>,
  item_id: ID,
  duration: u64,
  price_per_day: u64,
  ctx: &mut TxContext,
) {
    
  // Aborts if Rentables extension is not installed.
  assert!(kiosk_extension::is_installed<Rentables>(kiosk), EExtensionNotInstalled);

  // Sets the kiosk owner to the transaction sender to keep metadata fields up to date.
  // This is also crucial to ensure the correct person receives the payment.
  // Prevents unexpected results in cases where the kiosk could have been transferred 
  // between users without the owner being updated.
  kiosk.set_owner(cap, ctx);

  // Lists the item for zero SUI.
  kiosk.list<T>(cap, item_id, 0);

  // Constructs a zero coin.
  let coin = coin::zero<SUI>(ctx);
  // Purchases the item with 0 SUI.
  let (object, request) = kiosk.purchase<T>(item_id, coin);

  // Resolves the TransferRequest with the empty TransferPolicy which is protected and accessible only via this module.
  let (_item, _paid, _from) = protected_tp.transfer_policy.confirm_request(request);

  // Wraps the item in the Rentable struct along with relevant metadata.
  let rentable = Rentable {
    object,
    duration,
    start_date: option::none<u64>(),
    price_per_day,
    kiosk_id: object::id(kiosk),
  };

  // Places the rentable as listed in the extension's bag (place_in_bag is a helper method defined in nft_rental.move file).
  place_in_bag<T, Listed>(kiosk, Listed { id: item_id }, rentable);
}

The delist function allows the renter to delist an item, as long as it's not currently being rented. The function also places (or locks, if a lock rule is present) the object back to owner's kiosk. You should mint an empty TransferPolicy even if you don't want to apply any royalties. If at some point you do want to enforce royalties, you can always update the existing TransferPolicy.

public fun delist<T: key + store>(
  kiosk: &mut Kiosk,
  cap: &KioskOwnerCap,
  transfer_policy: &TransferPolicy<T>,
  item_id: ID,
  _ctx: &mut TxContext,
) {

  // Aborts if the cap doesn't match the Kiosk.
  assert!(kiosk.has_access(cap), ENotOwner);

  // Removes the rentable item from the extension's Bag (take_from_bag is a helper method defined in nft_rental.move file). 
  let rentable = take_from_bag<T, Listed>(kiosk, Listed { id: item_id });

  // Deconstructs the Rentable object.
  let Rentable {
    object,
    duration: _,
    start_date: _,
    price_per_day: _,
    kiosk_id: _,
  } = rentable;

  // Respects the lock rule, if present, by re-locking the asset in the owner's Kiosk.
  if (has_rule<T, LockRule>(transfer_policy)) {
    kiosk.lock(cap, transfer_policy, object);
  } else {
    kiosk.place(cap, object);
  };
}

The rent function enables renting a listed Rentable. It permits anyone to borrow an item on behalf of another user, provided they have the Rentables extension installed. The rental_policy defines the portion of the coin that is retained as fees and added to the rental policy's balance.

public fun rent<T: key + store>(
  renter_kiosk: &mut Kiosk,
  borrower_kiosk: &mut Kiosk,
  rental_policy: &mut RentalPolicy<T>,
  item_id: ID,
  mut coin: Coin<SUI>,
  clock: &Clock,
  ctx: &mut TxContext,
) {

  // Aborts if Rentables extension is not installed.
  assert!(kiosk_extension::is_installed<Rentables>(borrower_kiosk), EExtensionNotInstalled);

  let mut rentable = take_from_bag<T, Listed>(renter_kiosk, Listed { id: item_id });

  // Calculates the price of the rental based on the days it was rented for by ensuring the outcome can be stored as a u64.
  let max_price_per_day = MAX_VALUE_U64 / rentable.duration;
  assert!(rentable.price_per_day <= max_price_per_day, ETotalPriceOverflow);
  let total_price = rentable.price_per_day * rentable.duration;

  // Accepts only exact balance for the payment and does not give change.
  let coin_value = coin.value();
  assert!(coin_value == total_price, ENotEnoughCoins);

  // Calculate fees_amount using the given basis points amount (percentage), ensuring the
  // result fits into a 64-bit unsigned integer.
  let mut fees_amount = coin_value as u128;
  fees_amount = fees_amount * (rental_policy.amount_bp as u128);
  fees_amount = fees_amount / (MAX_BASIS_POINTS as u128);

  // Calculate fees_amount using the given basis points amount (percentage), ensuring the result fits into a 64-bit unsigned integer.
  let fees = coin.split(fees_amount as u64, ctx);

  // Merges the fee balance of the given coin with the RentalPolicy balance.
  coin::put(&mut rental_policy.balance, fees);
  // Transfers the payment to the renter.
  transfer::public_transfer(coin, renter_kiosk.owner());
  rentable.start_date.fill(clock.timestamp_ms());

  place_in_bag<T, Rented>(borrower_kiosk, Rented { id: item_id }, rentable);
}

The borrow function enables the borrower to acquire the Rentable by reference from their bag.

public fun borrow<T: key + store>(
  kiosk: &mut Kiosk,
  cap: &KioskOwnerCap,
  item_id: ID,
  _ctx: &mut TxContext,
): &T {
  // Aborts if the cap doesn't match the Kiosk.
  assert!(kiosk.has_access(cap), ENotOwner);
  let ext_storage_mut = kiosk_extension::storage_mut(Rentables {}, kiosk);
  let rentable: &Rentable<T> = &ext_storage_mut[Rented { id: item_id }];
  &rentable.object
}

The borrow_val function enables the borrower to temporarily acquire the Rentable with an agreement or promise to return it. The Promise stores all the information about the Rentable, facilitating the reconstruction of the Rentable upon object return.

public fun borrow_val<T: key + store>(
  kiosk: &mut Kiosk,
  cap: &KioskOwnerCap,
  item_id: ID,
  _ctx: &mut TxContext,
): (T, Promise) {
  // Aborts if the cap doesn't match the Kiosk.
  assert!(kiosk.has_access(cap), ENotOwner);
  let borrower_kiosk = object::id(kiosk);

  let rentable = take_from_bag<T, Rented>(kiosk, Rented { id: item_id });

  // Construct a Promise struct containing the Rentable's metadata.
  let promise = Promise {
    item: Rented { id: item_id },
    duration: rentable.duration,
    start_date: *option::borrow(&rentable.start_date),
    price_per_day: rentable.price_per_day,
    renter_kiosk: rentable.kiosk_id,
    borrower_kiosk
  };

  // Deconstructs the rentable and returns the promise along with the wrapped item T.
  let Rentable {
    object,
    duration: _,
    start_date: _,
    price_per_day: _,
    kiosk_id: _,
  } = rentable;

  (object, promise)
}

The return_val function enables the borrower to return the borrowed item.

public fun return_val<T: key + store>(
  kiosk: &mut Kiosk,
  object: T,
  promise: Promise,
  _ctx: &mut TxContext,
) {
  assert!(kiosk_extension::is_installed<Rentables>(kiosk), EExtensionNotInstalled);

  let Promise {
    item,
    duration,
    start_date,
    price_per_day,
    renter_kiosk,
    borrower_kiosk,
  } = promise;

  let kiosk_id = object::id(kiosk);
  assert!(kiosk_id == borrower_kiosk, EInvalidKiosk);

  let rentable = Rentable {
    object,
    duration,
    start_date: option::some(start_date),
    price_per_day,
    kiosk_id: renter_kiosk,
  };

  place_in_bag(kiosk, item, rentable);
}

note
The reclaim functionality is manually invoked and the rental service provider is responsible for ensuring that the renter is reminded to reclaim. As such, this can cause the borrower to hold the asset for longer than the rental period. This can be mitigated through modification of the current contract by adding an assertion in the borrow and borrow_val functions to check if the rental period has expired.

The reclaim function enables an owner to claim back their asset after the rental period is over and place it inside their kiosk. If a lock rule is present, the example also locks the item inside the owner kiosk.

public fun reclaim<T: key + store>(
  renter_kiosk: &mut Kiosk,
  borrower_kiosk: &mut Kiosk,
  transfer_policy: &TransferPolicy<T>,
  clock: &Clock,
  item_id: ID,
  _ctx: &mut TxContext,
) {

  // Aborts if Rentables extension is not installed.
  assert!(kiosk_extension::is_installed<Rentables>(renter_kiosk), EExtensionNotInstalled);

  let rentable = take_from_bag<T, Rented>(borrower_kiosk, Rented { id: item_id });

  // Destructures the Rentable struct to place it back to the renter's Kiosk.
  let Rentable {
    object,
    duration,
    start_date,
    price_per_day: _,
    kiosk_id,
  } = rentable;

  // Aborts if provided kiosk is different that the initial kiosk the item was borrowed from.
  assert!(object::id(renter_kiosk) == kiosk_id, EInvalidKiosk);

  let start_date_ms = *option::borrow(&start_date);
  let current_timestamp = clock.timestamp_ms();
  let final_timestamp = start_date_ms + duration * SECONDS_IN_A_DAY;

  // Aborts if rental duration has not elapsed.
  assert!(current_timestamp > final_timestamp, ERentingPeriodNotOver);

  // Respects the lock rule, if present, by re-locking the asset in the owner's kiosk.
  if (transfer_policy.has_rule<T, LockRule>()) {
    kiosk_extension::lock<Rentables, T>(
      Rentables {},
      renter_kiosk,
      object,
      transfer_policy,
    );
  } else {
    kiosk_extension::place<Rentables, T>(
      Rentables {},
      renter_kiosk,
      object,
      transfer_policy,
    );
  };
}

Sequence diagrams
note
This implementation assumes that each creator, as an enabling action, creates a TransferPolicy even if empty, so that the Rentables extension can operate. This is a requirement in addition to invoking the setup_renting method.

Initialize
The initialization process is part of the flow but only happens once for each entity:

For a new type that a creator would like to allow to be rented
Involves invoking setup_renting and TransferPolicy creation with optional lock rule
For a Borrower that has never borrowed before using this framework
If no kiosk exists for the user, one should be created
Involves installing the extension in their kiosk
For a Renter that has never rented before using this framework
If no kiosk exists for the user, one should be created
Involves installing the extension in their kiosk
blockchain
kiosk_lock_rule module
transfer_policy module
Borrower's Extension
Renter's Extension
nft_rental module
Borrower
Renter
Creator
blockchain
kiosk_lock_rule module
transfer_policy module
Borrower's Extension
Renter's Extension
nft_rental module
Borrower
Renter
Creator
Setup Renting
Create TransferPolicy
opt
[Add lock rule]
Install Extension
Install Extension
Use Publisher and amountBP as inputs
Shares ProtectedTP and RentalPolicy
Use Publisher as input to create TransferPolicy
Shares TransferPolicy
Returns TransferPolicyCap
Use TransferPolicyCap as input in kiosk_lock_rule::add
Use TransferPolicy as input in kiosk_lock_rule::add
Shares TransferPolicy with lock rule
Returns TransferPolicyCap
Use kiosk, kioskOwnerCap as input to install extension
Extension is installed to kiosk
Use kiosk, kioskOwnerCap as input to install extension
Extension is installed to kiosk
List-Rent-Borrow-Reclaim
blockchain
coin module
Renter's Kiosk
kiosk module
Borrower's Extension Bag
Renter's Extension Bag
nft_rental module
Borrower
Renter
Creator's Rental Policy
blockchain
coin module
Renter's Kiosk
kiosk module
Borrower's Extension Bag
Renter's Extension Bag
nft_rental module
Borrower
Renter
Creator's Rental Policy
List for rent
Rent
Borrow
Perform operation & return Borrowed Item
Reclaim
alt
[Empty Transfer Policy]
[TransferPolicy with lock rule]
Use kiosk, kioskOwnerCap, ProtectedTP, ObjectID and Renting info as inputs in list
Use protectedTP as input in list
List object for zero price
Purchase Object
Take object from kiosk
Returns Object
Place Object in renter's bag
Use renter_kiosk, borrower_kiosk, RentalPolicy, objectID, coin and clock as inputs in rent
Use RentalPolicy as input in rent
Calculate payment and fees
Payment
Fees
Take object from renter's bag
Place rented Object in borrower's bag
Use kiosk, kioskOwnerCap, ObjectID as input in borrow
Take object from borrower's bag
Object, Promise
Operation on Object
Resolve return promise by returning Object, Promise
Place rented Object in borrower's bag
Use renter_kiosk, borrower_kiosk, clock as inputs in reclaim
Use TransferPolicy as input in reclaim
Take Object from borrower's bag if renting period is over
Place Object
Lock Object
List-Delist
blockchain
Renter's Kiosk
kiosk module
Renter's Extension Bag
nft_rental module
Renter
blockchain
Renter's Kiosk
kiosk module
Renter's Extension Bag
nft_rental module
Renter
List for rent
Delist
alt
[Empty Transfer Policy]
[TransferPolicy with lock rule]
Use kiosk, kioskOwnerCap, ProtectedTP, ObjectID and Renting info as inputs in list
Use protectedTP as input in list
List object for zero price
Purchase Object
Take object from kiosk
Returns Object
Place Object in renter's bag
Use renter_kiosk, borrower_kiosk, ObjectID as inputs in delist
Use transferPolicy as input in delist
Take Object from renter's bag
Place Object
Lock Object
Deployment
info
See "Hello, World!"(/guides/developer/getting-started/hello-world.mdx) for a more detailed guide on publishing packages or Sui Client CLI for a complete reference of client commands in the Sui CLI.

Before publishing your code, you must first initialize the Sui Client CLI, if you haven't already. To do so, in a terminal or console at the root directory of the project enter sui client. If you receive the following response, complete the remaining instructions:

Config file ["<FILE-PATH>/.sui/sui_config/client.yaml"] doesn't exist, do you want to connect to a Sui full node server [y/N]?

Enter y to proceed. You receive the following response:

Sui full node server URL (Defaults to Sui Testnet if not specified) :

Leave this blank (press Enter). You receive the following response:

Select key scheme to generate key pair (0 for ed25519, 1 for secp256k1, 2: for secp256r1):

Select 0. Now you should have a Sui address set up.

Before being able to publish your package to Testnet, you need Testnet SUI tokens. To get some, visit the online faucet at https://faucet.sui.io/. For other ways to get SUI in your Testnet account, see Get SUI Tokens.

Now that you have an account with some Testnet SUI, you can deploy your contracts. To publish your package, use the following command in the same terminal or console:

sui client publish --gas-budget <GAS-BUDGET>

For the gas budget, use a standard value such as 20000000.

Related links
NFT Rental example
The source code that this document references.

Sui Kiosk
Kiosk is a decentralized system for commerce applications on Sui. Kiosk is a part of the Sui framework, native to the system, and available to everyone.

Kiosk Apps
Kiosk apps are a way to extend the functionality of Sui Kiosk while keeping the core functionality intact. You can develop apps to add new features to a kiosk without having to modify the core code or move the assets elsewhere.

Custom Transfer Rules
Custom transfer rules enable you to define a set of rules that must be met before Sui considers a transfer operation valid.