# minimal-bch-wallet

This is a minalist Bitcoin Cash (BCH) wallet for use with front end web apps.
It's forked from the [Simple Bitcoin Wallet](https://www.npmjs.com/package/simple-bitcoin-wallet) developed by [Honest.cash](https://honest.cash). It's intended to be used with the [gatsby-ipfs-web-wallet](https://github.com/Permissionless-Software-Foundation/gatsby-ipfs-web-wallet) and [bch-js](https://www.npmjs.com/package/@chris.troutner/bch-js) provided by [FullStack.cash](https://fullstack.cash)

The default derivation path for the wallet keypair is `m/44'/145'/0'/0/0`. This is the BIP44 standard for BCH wallets.

## How to use it?

### Import
#### Add to your HTML scripts
```js
<script src="https://unpkg.com/minimal-bch-wallet"></script>
```

#### Node module
```bash
npm install minimal-bch-wallet --save
```

```js
// module import
import BchWallet from "minimal-bch-wallet";

// nodejs modules
const BchWallet = require("minimal-bch-wallet");
```

### Create new wallets
```js
const bchWallet = new BchWallet();
await bchWallet.walletInfoPromise // Wait for wallet to be created.

// 12 words seed phrase for the wallet
console.log(bchWallet.walletInfo.mnemonic);

// cash address derived from the seed (derivation path: m/44'/145'/0'/0/0)
console.log(bchWallet.walletInfo.cashAddress);

// legacy address derived from the seed (derivation path: m/44'/145'/0'/0/0)
console.log(bchWallet.walletInfo.legacyAddress);

// private key for the BCH address derived from the seed (derivation path: m/44'/145'/0'/0/0)
console.log(bchWallet.walletInfo.privateKey);
```

### Mnemonic encryption
```js
const bchWallet = new BchWallet(null, {
  password: "myStrongPassword"
});

// 12 words seed phrase for the wallet
console.log(bchWallet.walletInfo.mnemonic);

// encrypted mnemonic
console.log(bchWallet.walletInfo.mnemonicEncrypted);

const bchWallet2 = new BchWallet(bchWallet.walletInfo.mnemonicEncrypted, {
  password: "myStrongPassword"
});

// decrypted mnemonic
console.log(bchWallet2.walletInfo.mnemonic);
```

### Initialize wallet with mnemonic
```js
// initialize with 12 words seed phrase for the wallet
const bchWallet = new BchWallet("minor bench until split suffer shine series bag avoid cruel orient aunt");

// initialize for specific HD derivation path
const bchWallet2 = new BchWallet("minor bench until split suffer shine series bag avoid cruel orient aunt", {
    HdPath: "m/44'/145'/0'/1'"
});
```

### Send transactions
You can send funds to other BCH wallets. You can distribute funds to N users by simply extending the receiver array.
```js
const bchWallet = new BchWallet();

const receivers = [
    {
        address: "bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h",
        // amount in satoshis, 1 satoshi = 0.00000001 Bitcoin
        amountSat: 100000
    }
];

const txid = await bchWallet.send(receivers);

// Transaction ID
// you can then see the transaction in one of the explorers
// example: `https://explorer.bitcoin.com/bch/tx/${tx.txid}`;
console.log(txid);
```


### Get Wallet Balance
Gets balance (confirmed + unconfirmed) for an BCH address

```js
// will get a balance for bchWallet.cashAddress
const myBalance = await bchWallet.getBalance();

// will get a balance for any address
const balanceOfOtherAddress = await bchWallet.getBalance("bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h");
```

### Get Wallet Transaction History
Get an array of TXIDs of the transactions involving this wallet.

```js
// will get transaction history for bchWallet.cashAddress
const myTransactions = await bchWallet.getTransactions();

// will get transaction history for any address
const txHistoryOfOtherAddress = await bchWallet.getTransactions("bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h");
```


### Error Handling
```js
try {
    tx = await bchWallet.send([
        { address: "bitcoincash:qrlhkg4d9z3y88j246a6482xzregxaxnfsagmd2kh3", amountSat: 1000 }
    ]);
} catch (err) {
    console.error(err);

    if (err.message && err.message.indexOf("Insufficient") > -1) {
        return alert("Insufficient balance on your BCH account.");
    }

    return alert("Error. Try again later.");
}
```

### Save keys in the browser
While developing BCH apps, remember to never send the private keys / mnemonic / seed phrase to your servers.
1. Your servers can be hacked
2. Depending on your jurisdiction you may not have the allowance to manage the funds of your users
```js
const bchWallet1 = new BchWallet();

// save the mnemonic for later
localStorage.setItem("BCH_MNEMONIC", bchWallet1.walletInfo.mnemonic);

// retrieve mnemonic to initialize the wallet
const bchWallet2 = new BchWallet(localStorage.getItem("BCH_MNEMONIC"));
```


# Licence
[MIT](LICENSE.md)
