Project Path: minimal-slp-wallet

Source Tree:

```
minimal-slp-wallet
├── dist
├── index.js
├── test
│   ├── unit
│   │   ├── a02-send-bch-unit.js
│   │   ├── a07-consolidate-utoxs-unit.js
│   │   ├── a06-op-return-unit.js
│   │   ├── a01-minimal-bch-wallet-unit.js
│   │   ├── a05-adapters-router-unit.js
│   │   ├── a03-utxos-unit.js
│   │   ├── a04-tokens-unit.js
│   │   └── mocks
│   │       ├── consolidate-utxos-mocks.js
│   │       ├── utxo-mocks.js
│   │       ├── util-mocks.js
│   │       └── send-bch-mocks.js
│   ├── e2e
│   │   ├── burn-token.js
│   │   ├── basic-auth.js
│   │   ├── op-return.js
│   │   └── consolidate-utxos-e2e.js
│   └── integration
│       ├── tokens.integration.test.js
│       ├── router.integration.js
│       ├── op-return.integration.js
│       ├── utxos.integration.test.js
│       └── index.integration.test.js
├── README.md
├── lib
│   ├── consolidate-utxos.js
│   ├── send-bch.js
│   ├── adapters
│   │   └── router.js
│   ├── utxos.js
│   ├── tokens.js
│   └── op-return.js
├── LICENSE.md
├── dev-docs
│   ├── images
│   │   └── dep-diagram.png
│   └── README.md
├── examples
│   ├── burn-all-tokens.js
│   ├── send-bch.js
│   ├── list-tokens.js
│   ├── validate-utxo.js
│   ├── get-token-data.js
│   ├── send-tokens.js
│   ├── create-wallet.js
│   └── burn-some-tokens.js
└── package.json

```

`/home/trout/work/psf/code/minimal-slp-wallet/index.js`:

```js
/*
  An npm JavaScript library for front end web apps. Implements a minimal
  Bitcoin Cash wallet.
*/

/* eslint-disable no-async-promise-executor */

'use strict'

const BCHJS = require('@psf/bch-js')
const crypto = require('crypto-js')

// Local libraries
const SendBCH = require('./lib/send-bch')
const Utxos = require('./lib/utxos')
const Tokens = require('./lib/tokens')
const AdapterRouter = require('./lib/adapters/router')
const OpReturn = require('./lib/op-return')
const ConsolidateUtxos = require('./lib/consolidate-utxos.js')

// let this

class MinimalBCHWallet {
  constructor (hdPrivateKeyOrMnemonic, advancedOptions = {}) {
    this.advancedOptions = advancedOptions

    // BEGIN Handle advanced options.
    // HD Derivation path.
    this.hdPath = this.advancedOptions.hdPath || "m/44'/245'/0'/0/0"

    // bch-js options.
    const bchjsOptions = {}
    if (this.advancedOptions.restURL) {
      bchjsOptions.restURL = advancedOptions.restURL
    }

    // JWT token for increased rate limits.
    if (this.advancedOptions.apiToken) {
      bchjsOptions.apiToken = advancedOptions.apiToken
    }

    // Basic Auth token for private installations of bch-api.
    if (this.advancedOptions.authPass) {
      bchjsOptions.authPass = advancedOptions.authPass
    }

    // Set the sats-per-byte fee rate.
    this.fee = 1.2
    if (this.advancedOptions.fee) {
      this.fee = this.advancedOptions.fee
    }
    // END Handle advanced options.

    // Encapsulae the external libraries.
    this.crypto = crypto
    this.BCHJS = BCHJS
    this.bchjs = new BCHJS(bchjsOptions)
    bchjsOptions.bchjs = this.bchjs

    // Instantiate the adapter router.
    if (advancedOptions.interface === 'consumer-api') {
      bchjsOptions.interface = 'consumer-api'
      // bchjsOptions.walletService = advancedOptions.walletService
      // bchjsOptions.bchWalletApi = advancedOptions.bchWalletApi
    }
    this.ar = new AdapterRouter(bchjsOptions)
    bchjsOptions.ar = this.ar

    // Instantiate local libraries.
    this.sendBch = new SendBCH(bchjsOptions)
    this.utxos = new Utxos(bchjsOptions)
    this.tokens = new Tokens(bchjsOptions)
    this.opReturn = new OpReturn(bchjsOptions)
    this.consolidateUtxos = new ConsolidateUtxos(this)

    this.temp = []
    this.isInitialized = false

    // The create() function returns a promise. When it resolves, the
    // walletInfoCreated flag will be set to true. The instance will also
    // have a new `walletInfo` property that will contain the wallet information.
    this.walletInfoCreated = false
    this.walletInfoPromise = this.create(hdPrivateKeyOrMnemonic)

    // Bind the 'this' object to all functions
    this.create = this.create.bind(this)
    this.initialize = this.initialize.bind(this)
    this.getUtxos = this.getUtxos.bind(this)
    this.getBalance = this.getBalance.bind(this)
    this.getTransactions = this.getTransactions.bind(this)
    this.getTxData = this.getTxData.bind(this)
    this.send = this.send.bind(this)
    this.sendTokens = this.sendTokens.bind(this)
    this.burnTokens = this.burnTokens.bind(this)
    this.listTokens = this.listTokens.bind(this)
    this.sendAll = this.sendAll.bind(this)
    this.burnAll = this.burnAll.bind(this)
    this.getUsd = this.getUsd.bind(this)
    this.sendOpReturn = this.sendOpReturn.bind(this)
    this.utxoIsValid = this.utxoIsValid.bind(this)
    this.getTokenData = this.getTokenData.bind(this)
    this.getTokenData2 = this.getTokenData2.bind(this)
    this.getKeyPair = this.getKeyPair.bind(this)
    this.optimize = this.optimize.bind(this)
    this.getTokenBalance = this.getTokenBalance.bind(this)
    this.getPubKey = this.getPubKey.bind(this)
    this.broadcast = this.broadcast.bind(this)
    this.getPsfWritePrice = this.getPsfWritePrice.bind(this)
    this.cid2json = this.cid2json.bind(this)
  }

  // Create a new wallet. Returns a promise that resolves into a wallet object.
  async create (mnemonicOrWif) {
    // return new Promise(async (resolve, reject) => {
    try {
      // Attempt to decrypt mnemonic if password is provided.
      if (mnemonicOrWif && this.advancedOptions.password) {
        mnemonicOrWif = this.decrypt(
          mnemonicOrWif,
          this.advancedOptions.password
        )
      }

      const walletInfo = {}

      // No input. Generate a new mnemonic.
      if (!mnemonicOrWif) {
        const mnemonic = this.bchjs.Mnemonic.generate(128)
        const rootSeedBuffer = await this.bchjs.Mnemonic.toSeed(mnemonic)
        const masterHDNode = this.bchjs.HDNode.fromSeed(rootSeedBuffer)
        const childNode = masterHDNode.derivePath(this.hdPath)

        walletInfo.privateKey = this.bchjs.HDNode.toWIF(childNode)
        walletInfo.publicKey = this.bchjs.HDNode.toPublicKey(
          childNode
        ).toString('hex')
        walletInfo.mnemonic = mnemonic
        walletInfo.address = walletInfo.cashAddress = this.bchjs.HDNode.toCashAddress(
          childNode
        )
        walletInfo.legacyAddress = this.bchjs.HDNode.toLegacyAddress(childNode)
        walletInfo.hdPath = this.hdPath

        //
      } else {
        // A WIF will start with L or K, will have no spaces, and will be 52
        // characters long.
        const startsWithKorL =
          mnemonicOrWif &&
          (mnemonicOrWif[0].toString().toLowerCase() === 'k' ||
            mnemonicOrWif[0].toString().toLowerCase() === 'l')
        const is52Chars = mnemonicOrWif && mnemonicOrWif.length === 52

        if (startsWithKorL && is52Chars) {
          // WIF Private Key

          walletInfo.privateKey = mnemonicOrWif
          const ecPair = this.bchjs.ECPair.fromWIF(mnemonicOrWif)
          // walletInfo.publicKey = ecPair.toPublicKey().toString('hex')
          walletInfo.publicKey = this.bchjs.ECPair.toPublicKey(ecPair).toString(
            'hex'
          )
          walletInfo.mnemonic = null
          walletInfo.address = walletInfo.cashAddress = this.bchjs.ECPair.toCashAddress(
            ecPair
          )
          walletInfo.legacyAddress = this.bchjs.ECPair.toLegacyAddress(ecPair)
          walletInfo.hdPath = null
        } else {
          // 12-word Mnemonic

          const mnemonic = mnemonicOrWif || this.bchjs.Mnemonic.generate(128)
          const rootSeedBuffer = await this.bchjs.Mnemonic.toSeed(mnemonic)
          const masterHDNode = this.bchjs.HDNode.fromSeed(rootSeedBuffer)
          const childNode = masterHDNode.derivePath(this.hdPath)

          walletInfo.privateKey = this.bchjs.HDNode.toWIF(childNode)
          walletInfo.publicKey = this.bchjs.HDNode.toPublicKey(
            childNode
          ).toString('hex')
          walletInfo.mnemonic = mnemonic
          walletInfo.address = walletInfo.cashAddress = this.bchjs.HDNode.toCashAddress(
            childNode
          )
          walletInfo.legacyAddress = this.bchjs.HDNode.toLegacyAddress(
            childNode
          )
          walletInfo.hdPath = this.hdPath
        }
      }

      // Encrypt the mnemonic if a password is provided.
      if (this.advancedOptions.password) {
        walletInfo.mnemonicEncrypted = this.encrypt(
          mnemonicOrWif,
          this.advancedOptions.password
        )
      }

      walletInfo.slpAddress = this.bchjs.SLP.Address.toSLPAddress(
        walletInfo.address
      )

      this.walletInfoCreated = true
      this.walletInfo = walletInfo

      return walletInfo
    } catch (err) {
      // return reject(err)
      console.error('Error in create()')
      throw err
    }
    // })
  }

  // Initialize is called to initialize the UTXO store, download token data, and
  // get a balance of the wallet.
  async initialize () {
    await this.walletInfoPromise

    await this.utxos.initUtxoStore(this.walletInfo.address)

    this.isInitialized = true

    return true
  }

  // Get the UTXO information for this wallet.
  async getUtxos (bchAddress) {
    let addr = bchAddress

    // If no address is passed in, but the wallet has been initialized, use the
    // wallet's address.
    if (!bchAddress && this.walletInfo && this.walletInfo.cashAddress) {
      addr = this.walletInfo.cashAddress
      return this.utxos.initUtxoStore(addr)
    }

    const utxos = await this.ar.getUtxos(addr)
    // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

    return utxos
  }

  // Encrypt the mnemonic of the wallet.
  encrypt (mnemonic, password) {
    return this.crypto.AES.encrypt(mnemonic, password).toString()
  }

  // Decrypt the mnemonic of the wallet.
  decrypt (mnemonicEncrypted, password) {
    let mnemonic

    try {
      mnemonic = this.crypto.AES.decrypt(mnemonicEncrypted, password).toString(
        this.crypto.enc.Utf8
      )
    } catch (err) {
      throw new Error('Wrong password')
    }

    return mnemonic
  }

  // Get the balance of the wallet.
  async getBalance (inObj = {}) {
    const { bchAddress } = inObj

    let addr = bchAddress

    // If no address is passed in, but the wallet has been initialized, use the
    // wallet's address.
    if (!bchAddress && this.walletInfo && this.walletInfo.cashAddress) {
      addr = this.walletInfo.cashAddress
    }

    const balances = await this.ar.getBalance(addr)

    return balances.balance.confirmed + balances.balance.unconfirmed
  }

  // Get transactions associated with the wallet.
  // Returns an array of object. Each object has a 'tx_hash' and 'height' property.
  async getTransactions (bchAddress, sortingOrder = 'DESCENDING') {
    let addr = bchAddress

    // If no address is passed in, but the wallet has been initialized, use the
    // wallet's address.
    if (!bchAddress && this.walletInfo && this.walletInfo.cashAddress) {
      addr = this.walletInfo.cashAddress
    }

    // console.log(`Getting transactions for ${addr}`)
    const data = await this.ar.getTransactions(addr, sortingOrder)

    return data.transactions
  }

  // Get transaction data for up to 20 TXIDs. txids should be an array. Each
  // element should be a string containing a TXID.
  async getTxData (txids = []) {
    const data = await this.ar.getTxData(txids)

    return data
  }

  // Send BCH. Returns a promise that resolves into a TXID.
  // This is a wrapper for the send-bch.js library.
  send (outputs) {
    try {
      // console.log(
      //   `this.utxos.bchUtxos: ${JSON.stringify(this.utxos.bchUtxos, null, 2)}`
      // )

      return this.sendBch.sendBch(
        outputs,
        {
          mnemonic: this.walletInfo.mnemonic,
          cashAddress: this.walletInfo.address,
          hdPath: this.walletInfo.hdPath,
          fee: this.fee,
          privateKey: this.walletInfo.privateKey
        },
        // this.utxos.bchUtxos
        this.utxos.utxoStore.bchUtxos
      )
    } catch (err) {
      console.error('Error in send()')
      throw err
    }
  }

  // Send Tokens. Returns a promise that resolves into a TXID.
  // This is a wrapper for the tokens.js library.
  sendTokens (output, satsPerByte, opts = {}) {
    try {
      // console.log(`utxoStore: ${JSON.stringify(this.utxos.utxoStore, null, 2)}`)

      // If mining fee is not specified, use the value assigned in the constructor.
      if (!satsPerByte) satsPerByte = this.fee

      // If output was passed in as an array, use only the first element of the Array.
      if (Array.isArray(output)) {
        output = output[0]
      }

      // Combine all Type 1, Group, and NFT token UTXOs. Ignore minting batons.
      const tokenUtxos = this.utxos.getSpendableTokenUtxos()
      // console.log('msw tokenUtxos: ', tokenUtxos)

      return this.tokens.sendTokens(
        output,
        this.walletInfo,
        this.utxos.utxoStore.bchUtxos,
        tokenUtxos,
        satsPerByte,
        opts
      )
    } catch (err) {
      console.error('Error in send()')
      throw err
    }
  }

  async burnTokens (qty, tokenId, satsPerByte) {
    try {
      // console.log(`utxoStore: ${JSON.stringify(this.utxos.utxoStore, null, 2)}`)

      // If mining fee is not specified, use the value assigned in the constructor.
      if (!satsPerByte) satsPerByte = this.fee

      // Combine all Type 1, Group, and NFT token UTXOs. Ignore minting batons.
      const tokenUtxos = this.utxos.getSpendableTokenUtxos()

      // Generate the transaction.
      return this.tokens.burnTokens(
        qty,
        tokenId,
        this.walletInfo,
        this.utxos.utxoStore.bchUtxos,
        tokenUtxos,
        satsPerByte
      )
    } catch (err) {
      console.error('Error in burnTokens()')
      throw err
    }
  }

  // Return information on SLP tokens held by this wallet.
  listTokens (slpAddress) {
    const addr = slpAddress || this.walletInfo.slpAddress

    return this.tokens.listTokensFromAddress(addr)
  }

  // Get the balance for a specific SLP token.
  getTokenBalance (inObj = {}) {
    const { tokenId, slpAddress } = inObj

    const addr = slpAddress || this.walletInfo.slpAddress

    return this.tokens.getTokenBalance(tokenId, addr)
  }

  // Send BCH. Returns a promise that resolves into a TXID.
  // This is a wrapper for the send-bch.js library.
  sendAll (toAddress) {
    try {
      return this.sendBch.sendAllBch(
        toAddress,
        {
          mnemonic: this.walletInfo.mnemonic,
          cashAddress: this.walletInfo.address,
          hdPath: this.walletInfo.hdPath,
          fee: this.fee,
          privateKey: this.walletInfo.privateKey
        },
        // this.utxos.bchUtxos
        this.utxos.utxoStore.bchUtxos
      )
    } catch (err) {
      console.error('Error in sendAll()')
      throw err
    }
  }

  // Burn all the SLP tokens associated to the token ID
  async burnAll (tokenId) {
    try {
      // Combine all Type 1, Group, and NFT token UTXOs. Ignore minting batons.
      const tokenUtxos = this.utxos.getSpendableTokenUtxos()
      // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)

      // Generate the transaction.
      const txid = await this.tokens.burnAll(
        tokenId,
        this.walletInfo,
        this.utxos.utxoStore.bchUtxos,
        tokenUtxos
      )

      return txid
    } catch (err) {
      console.error('Error in burnAll()')
      throw err
    }
  }

  // Get the spot price of BCH in USD.
  async getUsd () {
    return await this.ar.getUsd()
  }

  // Generate and broadcast a transaction with an OP_RETURN output.
  // Returns the txid of the transactions.
  async sendOpReturn (
    msg = '',
    prefix = '6d02', // Default to memo.cash
    bchOutput = [],
    satsPerByte = 1.0
  ) {
    try {
      // Wait for the wallet to finish initializing.
      await this.walletInfoPromise

      // console.log(
      //   `this.utxos.utxoStore ${JSON.stringify(this.utxos.utxoStore, null, 2)}`
      // )

      const txid = await this.opReturn.sendOpReturn(
        this.walletInfo,
        this.utxos.utxoStore.bchUtxos,
        msg,
        prefix,
        bchOutput,
        satsPerByte
      )

      return txid
    } catch (err) {
      console.error('Error in sendOpReturn()')
      throw err
    }
  }

  // Validate that a UTXO can be spent.
  // const utxo = {
  //   tx_hash: 'b94e1ff82eb5781f98296f0af2488ff06202f12ee92b0175963b8dba688d1b40',
  //   tx_pos: 0
  // }
  // isValid = await wallet.utxoIsValid(utxo)
  async utxoIsValid (utxo) {
    return await this.ar.utxoIsValid(utxo)
  }

  // Get mutable and immutable data associated with a token.
  async getTokenData (tokenId, withTxHistory = false) {
    return await this.ar.getTokenData(tokenId, withTxHistory)
  }

  // Get token icon and other media
  async getTokenData2 (tokenId, updateCache) {
    return await this.ar.getTokenData2(tokenId, updateCache)
  }

  // This method returns an object that contains a private key WIF, public key,
  // public address, and the index of the HD wallet that the key pair was
  // generated from. If no index is provided, it generates the root key pair
  // (index 0).
  async getKeyPair (hdIndex = 0) {
    await this.walletInfoPromise

    const mnemonic = this.walletInfo.mnemonic

    if (!mnemonic) {
      throw new Error('Wallet does not have a mnemonic. Can not generate a new key pair.')
    }

    // root seed buffer
    const rootSeed = await this.bchjs.Mnemonic.toSeed(mnemonic)

    const masterHDNode = this.bchjs.HDNode.fromSeed(rootSeed)

    const childNode = masterHDNode.derivePath(`m/44'/245'/0'/0/${hdIndex}`)

    const cashAddress = this.bchjs.HDNode.toCashAddress(childNode)
    console.log('Generating a new key pair for cashAddress: ', cashAddress)

    const wif = this.bchjs.HDNode.toWIF(childNode)

    const publicKey = this.bchjs.HDNode.toPublicKey(childNode).toString('hex')

    const slpAddress = this.bchjs.SLP.Address.toSLPAddress(cashAddress)

    const outObj = {
      hdIndex,
      wif,
      publicKey,
      cashAddress,
      slpAddress
    }

    return outObj
  }

  // Optimize the wallet by consolidating UTXOs. This has the effect of speeding
  // up all API calls and improving the UX.
  async optimize (dryRun = false) {
    return await this.consolidateUtxos.start({ dryRun })
  }

  // Get token icon and other media
  async getPubKey (addr) {
    try {
      return await this.ar.getPubKey(addr)
    } catch (err) {
      console.error('Error in minimal-slp-wallet/getPubKey()')
      throw err
    }
  }

  // Broadcast a hex-encoded TX to the network
  async broadcast (inObj = {}) {
    try {
      const { hex } = inObj

      return await this.ar.sendTx(hex)
    } catch (err) {
      console.error('Error in minimal-slp-wallet/broadcast()')
      throw err
    }
  }

  // Get the cost in PSF tokens to write 1MB of data to the PSFFPP IPFS pinning
  // network. Find out more at psffpp.com.
  async getPsfWritePrice () {
    try {
      return await this.ar.getPsfWritePrice()
    } catch (err) {
      console.error('Error in minimal-slp-wallet/getPsfWritePrice()')
      throw err
    }
  }

  // Convert a CID to a JSON object.
  async cid2json (inObj = {}) {
    try {
      const { cid } = inObj

      console.log('index.js/cid2json() cid: ', cid)

      return await this.ar.cid2json({ cid })
    } catch (err) {
      console.error('Error in minimal-slp-wallet/cid2json()')
      throw err
    }
  }
}

module.exports = MinimalBCHWallet

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/unit/a02-send-bch-unit.js`:

```js
/*
  Unit tests for the send-bch.js library.
*/

// npm libraries
const assert = require('chai').assert
const sinon = require('sinon')
const BCHJS = require('@psf/bch-js')
const clone = require('lodash.clonedeep')

// Local libraries
const SendBCH = require('../../lib/send-bch')
const AdapterRouter = require('../../lib/adapters/router')
let uut // Unit Under Test

const mockDataLib = require('./mocks/send-bch-mocks')
let mockData

describe('#SendBCH', () => {
  let sandbox

  // Restore the sandbox before each test.
  beforeEach(() => {
    sandbox = sinon.createSandbox()

    const config = {
      restURL: 'https://free-main.fullstack.cash/v5/'
    }
    const bchjs = new BCHJS(config)
    config.bchjs = bchjs
    config.ar = new AdapterRouter(config)
    uut = new SendBCH(config)

    mockData = clone(mockDataLib)
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if instance of bch-js is not passed.', () => {
      try {
        uut = new SendBCH()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Must pass instance of bch-js when instantiating SendBCH.'
        )
      }
    })

    it('should throw an error if instance of adapter router is not passed.', () => {
      try {
        uut = new SendBCH({ bchjs: {} })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Must pass instance of Adapter Router.')
      }
    })
  })

  describe('#calculateFee', () => {
    it('should accurately calculate a P2PKH with 1 input and 2 outputs', () => {
      const fee = uut.calculateFee(1, 2, 1)
      // console.log('fee: ', fee)

      assert.equal(fee, 260)
    })

    it('should accurately calculate a P2PKH with 2 input and 2 outputs', () => {
      const fee = uut.calculateFee(2, 2, 1)
      // console.log('fee: ', fee)

      assert.equal(fee, 408)
    })

    it('should accurately calculate a P2PKH with 2 input and 3 outputs', () => {
      const fee = uut.calculateFee(2, 3, 1)
      // console.log('fee: ', fee)

      assert.equal(fee, 442)
    })

    it('should throw an error for bad input', () => {
      try {
        const fee = uut.calculateFee('a', 'b', 'c')
        console.log('fee: ', fee)

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(
          err.message,
          'Invalid input. Fee could not be calculated'
        )
      }
    })
  })

  describe('#sortUtxosBySize', () => {
    it('should sort UTXOs in ascending order', () => {
      const utxos = uut.sortUtxosBySize(mockData.exampleUtxos01.utxos)
      // console.log('utxos: ', utxos)

      const lastElem = utxos.length - 1

      assert.isAbove(utxos[lastElem].value, utxos[0].value)
    })

    it('should sort UTXOs in descending order', () => {
      const utxos = uut.sortUtxosBySize(
        mockData.exampleUtxos01.utxos,
        'DESCENDING'
      )
      // console.log('utxos: ', utxos)

      const lastElem = utxos.length - 1

      assert.isAbove(utxos[0].value, utxos[lastElem].value)
    })
  })

  describe('#getNecessaryUtxosAndChange', () => {
    it('should return UTXOs to achieve single output', () => {
      const outputs = [
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 600
        }
      ]

      const { necessaryUtxos, change } = uut.getNecessaryUtxosAndChange(
        outputs,
        mockData.exampleUtxos01.utxos
      )
      // console.log('necessaryUtxos: ', necessaryUtxos)
      // console.log('change: ', change)

      assert.isArray(necessaryUtxos)
      assert.equal(necessaryUtxos.length, 3)
      assert.isNumber(change)
    })

    it('should return UTXOs to achieve multiple outputs', () => {
      const outputs = [
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 12513803
        },
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 2000
        }
      ]

      const { necessaryUtxos, change } = uut.getNecessaryUtxosAndChange(
        outputs,
        mockData.exampleUtxos01.utxos
      )
      // console.log('necessaryUtxos: ', necessaryUtxos)
      // console.log('change: ', change)

      assert.isArray(necessaryUtxos)
      assert.equal(necessaryUtxos.length, 3)
      assert.isNumber(change)
    })

    it('should throw an error if not enough BCH', () => {
      try {
        const outputs = [
          {
            address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
            amountSat: 12525803
          },
          {
            address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
            amountSat: 2000
          }
        ]

        uut.getNecessaryUtxosAndChange(outputs, mockData.exampleUtxos01.utxos)

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        // console.log('err: ', err)

        assert.include(err.message, 'Insufficient balance')
      }
    })

    it('should use custom sorting function', () => {
      const outputs = [
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 600
        }
      ]

      const sortingStub = sinon.stub().returnsArg(0)
      uut.getNecessaryUtxosAndChange(
        outputs,
        mockData.exampleUtxos01.utxos,
        1.0,
        { utxoSortingFn: sortingStub }
      )

      assert.ok(sortingStub.calledOnceWith(mockData.exampleUtxos01.utxos))
    })
  })

  describe('#getKeyPairFromMnemonic', () => {
    it('should generate a key pair from a wallet with a mnemonic', async () => {
      const keyPair = await uut.getKeyPairFromMnemonic(mockData.mockWallet)
      // console.log(`keyPair: ${JSON.stringify(keyPair, null, 2)}`)

      // Ensure the output has the expected properties.
      assert.property(keyPair, 'compressed')
      assert.property(keyPair, 'network')
    })

    it('should generate a key pair from a wallet without a mnemonic', async () => {
      // Force mnemonic to have a null value
      mockData.mockWallet.mnemonic = null

      const keyPair = await uut.getKeyPairFromMnemonic(mockData.mockWallet)
      // console.log(`keyPair: ${JSON.stringify(keyPair, null, 2)}`)

      // Ensure the output has the expected properties.
      assert.property(keyPair, 'compressed')
      assert.property(keyPair, 'network')
    })

    it('should throw error if wallet has neither mnemonic or private key', async () => {
      try {
        // Force desired code path
        mockData.mockWallet.mnemonic = null
        mockData.mockWallet.privateKey = null

        await uut.getKeyPairFromMnemonic(mockData.mockWallet)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Wallet has no mnemonic or private key!')
      }
    })
  })

  describe('#createTransaction', () => {
    it('should throw an error if UTXOs array is empty', async () => {
      try {
        const outputs = [
          {
            address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
            amountSat: 1000
          }
        ]

        await uut.createTransaction(outputs, mockData.mockWallet, [])

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'UTXO list is empty')
      }
    })

    it('should ignore change if below the dust limit', async () => {
      const outputs = [
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 600
        }
      ]

      const { hex, txid } = await uut.createTransaction(
        outputs,
        mockData.mockWallet,
        mockData.exampleUtxos01.utxos
      )

      assert.isString(hex)
      assert.isString(txid)
    })

    it('should add change output if above the dust limit', async () => {
      const outputs = [
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 625
        }
      ]

      const { hex, txid } = await uut.createTransaction(
        outputs,
        mockData.mockWallet,
        mockData.exampleUtxos01.utxos
      )
      // console.log('hex: ', hex)
      // console.log('txid: ', txid)

      assert.isString(hex)
      assert.isString(txid)
    })
  })

  describe('#sendBch', () => {
    it('should broadcast a transaction and return a txid', async () => {
      const hex =
        '0200000002abdb671501c19d11c35473aa84547f7f3b301d6924d6c8f419a26616dc486ea3010000006b4830450221009833f7bbecd7ba4c193f1edd693e42b337cd295b7e530cab3b2210f46c6cebe102200b65bf9b9bc66992c09cb1a40a2c84b629ba48c066b9f3cc5fe713a898051b6d41210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffffcc198a396570aebd10605cdde223356c0d8f92133560c52013ae5d43dccccf53010000006a47304402207bd190fce11a0cbf8dd8d0d987bcdd428168312f217ec61d018c3198014a786a02200b0ac3db775ea708eb9a76a9fa84fe9a68a0553408b143f52c220313cc2ecbd241210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff0271020000000000001976a914543dc8f7c91721da06da8c3941f79e26cfbce67288ac6c030000000000001976a9141d027f19f0e9c4e6bb4e0b5359b4d2e2f9e27d9888ac00000000'
      const txid =
        '66b7d1fced6df27feb7faf305de2e3d6470decb0276648411fd6a2f69fec8543'

      // Mock live network calls.
      sandbox.stub(uut, 'createTransaction').resolves(hex)
      sandbox.stub(uut.ar, 'sendTx').resolves(txid)

      const output = await uut.sendBch()

      assert.equal(output, txid)
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        const hex =
          '0200000002abdb671501c19d11c35473aa84547f7f3b301d6924d6c8f419a26616dc486ea3010000006b4830450221009833f7bbecd7ba4c193f1edd693e42b337cd295b7e530cab3b2210f46c6cebe102200b65bf9b9bc66992c09cb1a40a2c84b629ba48c066b9f3cc5fe713a898051b6d41210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffffcc198a396570aebd10605cdde223356c0d8f92133560c52013ae5d43dccccf53010000006a47304402207bd190fce11a0cbf8dd8d0d987bcdd428168312f217ec61d018c3198014a786a02200b0ac3db775ea708eb9a76a9fa84fe9a68a0553408b143f52c220313cc2ecbd241210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff0271020000000000001976a914543dc8f7c91721da06da8c3941f79e26cfbce67288ac6c030000000000001976a9141d027f19f0e9c4e6bb4e0b5359b4d2e2f9e27d9888ac00000000'

        // Mock live network calls.
        sandbox.stub(uut, 'createTransaction').resolves(hex)
        sandbox.stub(uut.ar, 'sendTx').throws(new Error('error message'))

        await uut.sendBch()

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })
  })

  describe('#createSendAllTx', () => {
    it('should throw an error if address is invalid type', async () => {
      try {
        const toAddress = 1

        await uut.createSendAllTx(toAddress, mockData.mockWallet, [])

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Address to send must be a bch address')
      }
    })

    it('should throw an error if UTXOs array is empty', async () => {
      try {
        const toAddress =
          'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h'

        await uut.createSendAllTx(toAddress, mockData.mockWallet, [])

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'UTXO list is empty')
      }
    })

    it('should build transaction', async () => {
      const toAddress =
        'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h'

      const { hex, txid } = await uut.createSendAllTx(
        toAddress,
        mockData.mockWallet,
        mockData.exampleUtxos01.utxos
      )
      // console.log('hex: ', hex)
      // console.log('txid: ', txid)

      assert.isString(hex)
      assert.isString(txid)
    })

    it('should use default fee if fee is not specified.', async () => {
      const toAddress =
        'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h'

      mockData.mockWallet.fee = undefined

      const { hex, txid } = await uut.createSendAllTx(
        toAddress,
        mockData.mockWallet,
        mockData.exampleUtxos01.utxos
      )
      // console.log('hex: ', hex)
      // console.log('txid: ', txid)

      assert.isString(hex)
      assert.isString(txid)
    })
  })

  describe('#sendAllBch', () => {
    it('should broadcast a transaction and return a txid', async () => {
      const hex =
        '0200000002abdb671501c19d11c35473aa84547f7f3b301d6924d6c8f419a26616dc486ea3010000006b4830450221009833f7bbecd7ba4c193f1edd693e42b337cd295b7e530cab3b2210f46c6cebe102200b65bf9b9bc66992c09cb1a40a2c84b629ba48c066b9f3cc5fe713a898051b6d41210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffffcc198a396570aebd10605cdde223356c0d8f92133560c52013ae5d43dccccf53010000006a47304402207bd190fce11a0cbf8dd8d0d987bcdd428168312f217ec61d018c3198014a786a02200b0ac3db775ea708eb9a76a9fa84fe9a68a0553408b143f52c220313cc2ecbd241210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff0271020000000000001976a914543dc8f7c91721da06da8c3941f79e26cfbce67288ac6c030000000000001976a9141d027f19f0e9c4e6bb4e0b5359b4d2e2f9e27d9888ac00000000'
      const txid =
        '66b7d1fced6df27feb7faf305de2e3d6470decb0276648411fd6a2f69fec8543'

      // Mock live network calls.
      sandbox.stub(uut, 'createSendAllTx').resolves(hex)
      sandbox.stub(uut.ar, 'sendTx').resolves(txid)

      const output = await uut.sendAllBch()

      assert.equal(output, txid)
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        const hex =
          '0200000002abdb671501c19d11c35473aa84547f7f3b301d6924d6c8f419a26616dc486ea3010000006b4830450221009833f7bbecd7ba4c193f1edd693e42b337cd295b7e530cab3b2210f46c6cebe102200b65bf9b9bc66992c09cb1a40a2c84b629ba48c066b9f3cc5fe713a898051b6d41210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffffcc198a396570aebd10605cdde223356c0d8f92133560c52013ae5d43dccccf53010000006a47304402207bd190fce11a0cbf8dd8d0d987bcdd428168312f217ec61d018c3198014a786a02200b0ac3db775ea708eb9a76a9fa84fe9a68a0553408b143f52c220313cc2ecbd241210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff0271020000000000001976a914543dc8f7c91721da06da8c3941f79e26cfbce67288ac6c030000000000001976a9141d027f19f0e9c4e6bb4e0b5359b4d2e2f9e27d9888ac00000000'

        // Mock live network calls.
        sandbox.stub(uut, 'createSendAllTx').resolves(hex)
        sandbox.stub(uut.ar, 'sendTx').throws(new Error('error message'))

        await uut.sendAllBch()

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })
  })
})

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/unit/a07-consolidate-utoxs-unit.js`:

```js
/*
  Unit tests for the consolidate-utxos.js library.
*/

// Public npm libraries
const assert = require('chai').assert
const sinon = require('sinon')
// const BCHJS = require('@psf/bch-js')
const clone = require('lodash.clonedeep')

// Local libraries
const ConsolidateUtxos = require('../../lib/consolidate-utxos.js')
const SlpWallet = require('../../index.js')
const mockDataLib = require('./mocks/consolidate-utxos-mocks')

describe('#Consolidate-UTXOs', () => {
  let sandbox
  let uut
  let mockData

  beforeEach(async () => {
    const wallet = new SlpWallet()
    await wallet.walletInfoPromise

    uut = new ConsolidateUtxos(wallet)

    sandbox = sinon.createSandbox()

    // mockData = Object.assign({}, mockDataLib)
    mockData = clone(mockDataLib)
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if instance of wallet is not passed', () => {
      try {
        uut = new ConsolidateUtxos()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Must pass an instance of the wallet.'
        )
      }
    })
  })

  describe('#countBchUtxos', () => {
    it('should count the number of UTXOs', () => {
      uut.wallet.utxos.utxoStore = {
        bchUtxos: ['a', 'b']
      }

      const result = uut.countBchUtxos()
      // console.log('result: ', result)

      assert.equal(result, 2)
    })
  })

  describe('#updateUtxos', () => {
    it('should update the UTXO store', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.wallet, 'initialize').resolves()

      const result = await uut.updateUtxos()

      assert.equal(result, true)
    })
  })

  describe('#countTokenUtxos', () => {
    it('should return an array of token classes', async () => {
      // Mock dependencies and force desired code path
      uut.wallet.utxos.utxoStore = {
        slpUtxos: {
          type1: {
            tokens: mockData.tokenUtxos01
          }
        }
      }
      sandbox.stub(uut.wallet.tokens, 'listTokensFromUtxos').returns(mockData.tokenList01)

      const result = uut.countTokenUtxos()
      // console.log('result: ', result)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.length, 2)
      assert.equal(result[0].cnt, 1)
      assert.equal(result[1].cnt, 2)
    })
  })

  describe('#consolidateTokenUtxos', () => {
    it('should consolidate token UTXOs and return an array of TXIDs', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.wallet, 'sendTokens').resolves('fake-txid')
      sandbox.stub(uut.bchjs.Util, 'sleep').resolves()
      sandbox.stub(uut, 'updateUtxos').resolves()

      const result = await uut.consolidateTokenUtxos(mockData.countTokenUtxosOut01)
      // console.log('result: ', result)

      assert.equal(result.length, 1)
      assert.equal(result[0], 'fake-txid')
    })
  })

  describe('#start', () => {
    it('should return expected properties and values if there are no UTXOs to consolidate', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut, 'updateUtxos').resolves()
      sandbox.stub(uut, 'countBchUtxos').returns(1)
      sandbox.stub(uut, 'countTokenUtxos').returns([])

      const result = await uut.start()
      // console.log('result: ', result)

      // Assert that expected properties exist
      assert.property(result, 'bchUtxoCnt')
      assert.property(result, 'bchTxid')
      assert.property(result, 'tokenUtxos')
      assert.property(result, 'tokenTxids')

      // Assert the properties have expected values.
      assert.equal(result.bchUtxoCnt, 1)
      assert.equal(result.bchTxid, null)
      assert.equal(result.tokenUtxos.length, 0)
      assert.equal(result.tokenTxids.length, 0)
    })

    it('should consolidate BCH and token UTXOs', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut, 'updateUtxos').resolves()
      sandbox.stub(uut, 'countBchUtxos').returns(2)
      sandbox.stub(uut.wallet, 'sendAll').resolves('fake-bch-txid')
      sandbox.stub(uut.bchjs.Util, 'sleep').resolves()
      sandbox.stub(uut, 'countTokenUtxos').returns(mockData.countTokenUtxosOut01)
      sandbox.stub(uut, 'consolidateTokenUtxos').resolves(['fake-token-txid'])

      const result = await uut.start()
      // console.log('result: ', result)

      // Assert that expected properties exist
      assert.property(result, 'bchUtxoCnt')
      assert.property(result, 'bchTxid')
      assert.property(result, 'tokenUtxos')
      assert.property(result, 'tokenTxids')

      // Assert the properties have expected values.
      assert.equal(result.bchUtxoCnt, 2)
      assert.equal(result.bchTxid, 'fake-bch-txid')
      assert.equal(result.tokenUtxos.length, 2)
      assert.equal(result.tokenTxids.length, 1)
    })

    it('should catch and throw errors', async () => {
      try {
        // Mock dependencies and force desired code path
        sandbox.stub(uut.retryQueue, 'addToQueue').rejects(new Error('fake error'))

        await uut.start()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err.message: ', err.message)
        assert.include(err.message, 'fake error')
      }
    })
  })
})

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/unit/a06-op-return-unit.js`:

```js
/*
  Unit tests for the op-return.js library.
*/

// Public npm libraries
const assert = require('chai').assert
const sinon = require('sinon')
const BCHJS = require('@psf/bch-js')

// Local libraries
const OpReturn = require('../../lib/op-return')
// const Tokens = require('../../lib/tokens')
// const Utxos = require('../../lib/utxos')
const AdapterRouter = require('../../lib/adapters/router')
const sendMockData = require('./mocks/send-bch-mocks')

describe('#OP_RETURN', () => {
  let sandbox
  let uut

  beforeEach(() => {
    const config = {
      restURL: 'https://api.fullstack.cash/v5/'
    }
    const bchjs = new BCHJS(config)
    config.bchjs = bchjs
    config.ar = new AdapterRouter(config)
    uut = new OpReturn(config)
    // utxos = new Utxos(config)

    sandbox = sinon.createSandbox()

    // mockData = Object.assign({}, mockDataLib)
    // sendMockData = Object.assign({}, sendMockDataLib)
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if instance of bch-js is not passed', () => {
      try {
        uut = new OpReturn()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Must pass instance of bch-js when instantiating OpReturn library.'
        )
      }
    })

    it('should throw an error if instance of Adapter Router is not passed', () => {
      try {
        uut = new OpReturn({ bchjs: {} })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Must pass instance of Adapter Router.')
      }
    })
  })

  describe('#calculateFee', () => {
    it('should accurately calculate a P2PKH with 2 input and 2 outputs', () => {
      const fee = uut.calculateFee(2, 2, 3, 1)
      // console.log('fee: ', fee)

      assert.equal(fee, 421)
    })

    it('should throw an error for bad input', () => {
      try {
        uut.calculateFee('a', 'b', 'c')
        // console.log('fee: ', fee)

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(
          err.message,
          'Invalid input. Fee could not be calculated'
        )
      }
    })

    it('should calculate fee for minimum OP_RETURN size', () => {
      const fee = uut.calculateFee(1, 2, 3, 1)
      // console.log('fee: ', fee)

      assert.equal(fee, 273)
    })

    it('should calculate fee for maximum OP_RETURN size', () => {
      const fee = uut.calculateFee(1, 2, 223, 1)
      // console.log('fee: ', fee)

      assert.equal(fee, 493)
    })
  })

  describe('#getNecessaryUtxosAndChange', () => {
    it('should return UTXOs to achieve single output', () => {
      const outputs = [
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 600
        }
      ]

      const { necessaryUtxos, change } = uut.getNecessaryUtxosAndChange(
        outputs,
        sendMockData.exampleUtxos01.utxos
      )
      // console.log('necessaryUtxos: ', necessaryUtxos)
      // console.log('change: ', change)

      assert.isArray(necessaryUtxos)
      assert.equal(necessaryUtxos.length, 3)
      assert.isNumber(change)
    })

    it('should return UTXOs to achieve multiple outputs', () => {
      const outputs = [
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 12513803
        },
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 2000
        }
      ]

      const { necessaryUtxos, change } = uut.getNecessaryUtxosAndChange(
        outputs,
        sendMockData.exampleUtxos01.utxos
      )
      // console.log('necessaryUtxos: ', necessaryUtxos)
      // console.log('change: ', change)

      assert.isArray(necessaryUtxos)
      assert.equal(necessaryUtxos.length, 3)
      assert.isNumber(change)
    })

    it('should throw an error if not enough BCH', () => {
      try {
        const outputs = [
          {
            address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
            amountSat: 12525803
          },
          {
            address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
            amountSat: 2000
          }
        ]

        uut.getNecessaryUtxosAndChange(
          outputs,
          sendMockData.exampleUtxos01.utxos
        )

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        // console.log('err: ', err)

        assert.include(err.message, 'Insufficient balance')
      }
    })
  })

  describe('#createTransaction', () => {
    it('should throw an error if there are no BCH UTXOs.', async () => {
      try {
        await uut.createTransaction({}, [], [])

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'BCH UTXO list is empty')
      }
    })

    it('should generate tx with OP_RETURN', async () => {
      // const walletInfo = sendMockData.mockWallet

      const result = await uut.createTransaction(
        sendMockData.mockWallet,
        sendMockData.exampleUtxos01.utxos,
        'this is a test'
      )
      // console.log('result: ', result)

      assert.isString(result.hex)
      assert.isString(result.txid)
    })

    it('should generate OP_RETURN tx with extra outputs', async () => {
      // const walletInfo = sendMockData.mockWallet

      const outputs = [
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 2525803
        },
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 2000
        }
      ]

      const result = await uut.createTransaction(
        sendMockData.mockWallet,
        sendMockData.exampleUtxos01.utxos,
        'this is a test',
        '6d02',
        outputs
      )
      // console.log('result: ', result)

      assert.isString(result.hex)
      assert.isString(result.txid)
    })
  })

  describe('#sendOpReturn', () => {
    it('should broadcast hex and return a txid', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'createTransaction').resolves('fake-hex')
      sandbox.stub(uut.ar, 'sendTx').resolves('fake-txid')

      const result = await uut.sendOpReturn()

      assert.equal(result, 'fake-txid')
    })
  })
})

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/unit/a01-minimal-bch-wallet-unit.js`:

```js
/*
  Unit tests for the main library.
*/

// npm libraries
const assert = require('chai').assert
const sinon = require('sinon')

// Mocking data libraries.
// const mockData = require('./mocks/util-mocks')
const mockUtxos = require('./mocks/utxo-mocks')

// Unit under test
const MinimalBCHWallet = require('../../index')

describe('#index.js - Minimal BCH Wallet', () => {
  let sandbox, uut

  // Restore the sandbox before each test.
  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new MinimalBCHWallet()
    await uut.walletInfoPromise
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should create a new wallet without encrypted mnemonic', async () => {
      uut = new MinimalBCHWallet(undefined)
      await uut.walletInfoPromise
      // console.log('uut: ', uut)

      assert.property(uut, 'walletInfo')
      assert.property(uut, 'walletInfoPromise')
      assert.property(uut, 'walletInfoCreated')
      assert.equal(uut.walletInfoCreated, true)

      assert.property(uut.walletInfo, 'mnemonic')
      assert.isString(uut.walletInfo.mnemonic)
      assert.isNotEmpty(uut.walletInfo.mnemonic)

      assert.property(uut.walletInfo, 'privateKey')
      assert.isString(uut.walletInfo.privateKey)
      assert.isNotEmpty(uut.walletInfo.privateKey)

      assert.property(uut.walletInfo, 'cashAddress')
      assert.isString(uut.walletInfo.cashAddress)
      assert.isNotEmpty(uut.walletInfo.cashAddress)

      assert.property(uut.walletInfo, 'legacyAddress')
      assert.isString(uut.walletInfo.legacyAddress)
      assert.isNotEmpty(uut.walletInfo.legacyAddress)

      assert.property(uut.walletInfo, 'slpAddress')
      assert.isString(uut.walletInfo.slpAddress)
      assert.isNotEmpty(uut.walletInfo.slpAddress)

      assert.notProperty(uut, 'mnemonicEncrypted')
      assert.notProperty(uut.walletInfo, 'mnemonicEncrypted')

      assert.equal(uut.isInitialized, false)
    })

    it('should create a new wallet with encrypted mnemonic', async () => {
      uut = new MinimalBCHWallet(null, {
        password: 'myStrongPassword'
      })
      await uut.walletInfoPromise
      // console.log('uut: ', uut)

      assert.property(uut.walletInfo, 'mnemonic')
      assert.isString(uut.walletInfo.mnemonic)
      assert.isNotEmpty(uut.walletInfo.mnemonic)

      assert.property(uut.walletInfo, 'privateKey')
      assert.isString(uut.walletInfo.privateKey)
      assert.isNotEmpty(uut.walletInfo.privateKey)

      assert.property(uut.walletInfo, 'cashAddress')
      assert.isString(uut.walletInfo.cashAddress)
      assert.isNotEmpty(uut.walletInfo.cashAddress)

      assert.property(uut.walletInfo, 'legacyAddress')
      assert.isString(uut.walletInfo.legacyAddress)
      assert.isNotEmpty(uut.walletInfo.legacyAddress)

      assert.property(uut.walletInfo, 'slpAddress')
      assert.isString(uut.walletInfo.slpAddress)
      assert.isNotEmpty(uut.walletInfo.slpAddress)

      assert.property(uut.walletInfo, 'mnemonicEncrypted')
      assert.isString(uut.walletInfo.mnemonicEncrypted)
      assert.isNotEmpty(uut.walletInfo.mnemonicEncrypted)
    })

    it('should decrypt an encrypted mnemonic', async () => {
      // Mock the utxo store, to ignore it for this test.
      // sandbox.stub(uut.utxos, 'initUtxoStore').resolves([])

      const mnemonicEncrypted =
        'U2FsdGVkX18uyavim4FoIETcRxgOi1E/XFc1ARR3k6HVrJgH60YnLxjbs6yMnWMjpaqbBmSC3uYjhZ+cgFlndOEZI34T0sWFfL952CHCFjd2AjypCjFhqkmHzOCCkhgf'
      const mnemonic =
        'negative prepare champion corn bean proof one same column water warm melt'
      const password = 'myStrongPassword'

      uut = new MinimalBCHWallet(mnemonicEncrypted, {
        password: password
      })
      await uut.walletInfoPromise
      // console.log('uut: ', uut)

      assert.equal(uut.walletInfo.mnemonic, mnemonic)
    })

    it('should throw error if incorrect password', async () => {
      try {
        const mnemonicEncrypted =
          'U2FsdGVkX18uyavim4FoIETcRxgOi1E/XFc1ARR3k6HVrJgH60YnLxjbs6yMnWMjpaqbBmSC3uYjhZ+cgFlndOEZI34T0sWFfL952CHCFjd2AjypCjFhqkmHzOCCkhgf'

        uut = new MinimalBCHWallet(mnemonicEncrypted, {
          password: 'bad password'
        })
        await uut.walletInfoPromise

        assert.notProperty(uut.walletInfo, 'mnemonic', 'Unexpected result!')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Wrong password')
      }
    })

    it('should import clear-text wallet mnemonic', async () => {
      const mnemonic =
        'negative prepare champion corn bean proof one same column water warm melt'

      uut = new MinimalBCHWallet(mnemonic)
      await uut.walletInfoPromise
      // console.log('uut: ', uut)

      assert.property(uut.walletInfo, 'mnemonic')
      assert.isString(uut.walletInfo.mnemonic)
      assert.isNotEmpty(uut.walletInfo.mnemonic)
      assert.equal(uut.walletInfo.mnemonic, mnemonic)

      assert.property(uut.walletInfo, 'privateKey')
      assert.isString(uut.walletInfo.privateKey)
      assert.isNotEmpty(uut.walletInfo.privateKey)

      assert.property(uut.walletInfo, 'cashAddress')
      assert.isString(uut.walletInfo.cashAddress)
      assert.isNotEmpty(uut.walletInfo.cashAddress)

      assert.property(uut.walletInfo, 'legacyAddress')
      assert.isString(uut.walletInfo.legacyAddress)
      assert.isNotEmpty(uut.walletInfo.legacyAddress)

      assert.property(uut.walletInfo, 'slpAddress')
      assert.isString(uut.walletInfo.slpAddress)
      assert.isNotEmpty(uut.walletInfo.slpAddress)

      assert.notProperty(uut.walletInfo, 'mnemonicEncrypted')
    })

    it('should import clear-text WIF private key', async () => {
      const wif = 'KyGrqLtG5PLf97Lu6RXDMGKg6YbcmRKCemgoiufFXPmvQWyvThvE'

      uut = new MinimalBCHWallet(wif)
      await uut.walletInfoPromise
      // console.log('uut: ', uut)

      assert.property(uut.walletInfo, 'mnemonic')
      assert.equal(uut.walletInfo.mnemonic, null)

      assert.property(uut.walletInfo, 'privateKey')
      assert.isString(uut.walletInfo.privateKey)
      assert.isNotEmpty(uut.walletInfo.privateKey)

      assert.property(uut.walletInfo, 'cashAddress')
      assert.isString(uut.walletInfo.cashAddress)
      assert.isNotEmpty(uut.walletInfo.cashAddress)

      assert.property(uut.walletInfo, 'legacyAddress')
      assert.isString(uut.walletInfo.legacyAddress)
      assert.isNotEmpty(uut.walletInfo.legacyAddress)

      assert.property(uut.walletInfo, 'slpAddress')
      assert.isString(uut.walletInfo.slpAddress)
      assert.isNotEmpty(uut.walletInfo.slpAddress)

      assert.notProperty(uut.walletInfo, 'mnemonicEncrypted')
    })

    it('should accept advanced options', async () => {
      const exampleURL = 'http://somewebsite.com/v3/'
      const exampleApiToken = 'myapitoken'

      const advancedOptions = {
        restURL: exampleURL,
        apiToken: exampleApiToken,
        authPass: 'test'
      }

      uut = new MinimalBCHWallet(undefined, advancedOptions)
      await uut.walletInfoPromise

      assert.equal(uut.advancedOptions.restURL, exampleURL)
      assert.equal(uut.advancedOptions.apiToken, exampleApiToken)
    })

    it('should adjust the tx fee', async () => {
      const advancedOptions = {
        fee: 3
      }

      uut = new MinimalBCHWallet(undefined, advancedOptions)
      await uut.walletInfoPromise

      assert.equal(uut.advancedOptions.fee, 3)
    })

    // CT 07-19-2020 - This test case is from a bug around the use of 'this'
    // and the '_this' local global. It was preventing the UTXO store from
    // being accessible.
    // it('should be able to access the UTXO store', async () => {
    //   uut = new MinimalBCHWallet(undefined)
    //   await uut.walletInfoPromise
    //
    //   assert.equal(uut.utxos.utxoStore, mockUtxos.mockUtxoStore)
    //   assert.equal(uut.utxos.bchUtxos, mockUtxos.mockBchUtxos)
    //   assert.equal(uut.utxos.tokenUtxos, mockUtxos.mockTokenUtxos)
    // })

    it('should update all instances of bch-js with the free tier', async () => {
      const freeUrl = 'https://api.fullstack.cash/v5/'

      uut = new MinimalBCHWallet(undefined, {
        restURL: freeUrl
      })

      assert.equal(uut.sendBch.bchjs.restURL, freeUrl)
      assert.equal(uut.utxos.bchjs.restURL, freeUrl)
      assert.equal(uut.tokens.bchjs.restURL, freeUrl)
    })

    it('should switch to consumer-api interface', () => {
      const advancedOptions = {
        interface: 'consumer-api'
      }

      uut = new MinimalBCHWallet(undefined, advancedOptions)

      assert.equal(uut.ar.interface, 'consumer-api')
    })
  })

  describe('#create', () => {
    it('should create a new wallet with no input', async () => {
      const walletInfoPromise = uut.create()
      await walletInfoPromise
      // console.log('walletInfo: ', uut.walletInfo)

      assert.property(uut, 'walletInfo')
      assert.property(uut, 'walletInfoPromise')
      assert.property(uut, 'walletInfoCreated')
      assert.equal(uut.walletInfoCreated, true)

      assert.property(uut.walletInfo, 'mnemonic')
      assert.isString(uut.walletInfo.mnemonic)
      assert.isNotEmpty(uut.walletInfo.mnemonic)

      assert.property(uut.walletInfo, 'privateKey')
      assert.isString(uut.walletInfo.privateKey)
      assert.isNotEmpty(uut.walletInfo.privateKey)

      assert.property(uut.walletInfo, 'publicKey')
      assert.isString(uut.walletInfo.publicKey)
      assert.isNotEmpty(uut.walletInfo.publicKey)

      assert.property(uut.walletInfo, 'cashAddress')
      assert.isString(uut.walletInfo.cashAddress)
      assert.isNotEmpty(uut.walletInfo.cashAddress)

      assert.property(uut.walletInfo, 'legacyAddress')
      assert.isString(uut.walletInfo.legacyAddress)
      assert.isNotEmpty(uut.walletInfo.legacyAddress)

      assert.property(uut.walletInfo, 'slpAddress')
      assert.isString(uut.walletInfo.slpAddress)
      assert.isNotEmpty(uut.walletInfo.slpAddress)
    })
  })

  describe('#initialize', () => {
    it('should initialize the UTXO store', async () => {
      // Mock dependencies
      sandbox.stub(uut.utxos, 'initUtxoStore').resolves()

      const result = await uut.initialize()

      assert.equal(uut.isInitialized, true)
      assert.equal(result, true)
    })
  })

  describe('#getBalance', () => {
    it('should return balance of given address', async () => {
      // Mock live network call.
      sandbox.stub(uut.bchjs.Electrumx, 'balance').resolves({
        success: true,
        balance: {
          confirmed: 1000,
          unconfirmed: 0
        }
      })

      const addr = 'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur3'

      const balance = await uut.getBalance(addr)

      assert.equal(balance, 1000)
    })

    it('should return balance of wallet address', async () => {
      // Mock live network call.
      sandbox.stub(uut.bchjs.Electrumx, 'balance').resolves({
        success: true,
        balance: {
          confirmed: 1000,
          unconfirmed: 0
        }
      })

      await uut.walletInfoPromise

      const balance = await uut.getBalance()

      assert.equal(balance, 1000)
    })
  })

  describe('#getTransactions', () => {
    it('should get transactions address is specified', async () => {
      sandbox.stub(uut.ar, 'getTransactions').resolves({
        success: true,
        transactions: [
          {
            height: 603416,
            tx_hash:
              'eef683d236d88e978bd406419f144057af3fe1b62ef59162941c1a9f05ded62c'
          }
        ]
      })

      const addr = 'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur3'

      const transactions = await uut.getTransactions(addr)
      // console.log(`transactions: ${JSON.stringify(transactions, null, 2)}`)

      assert.isArray(transactions)
    })

    it('should get transactions for wallet if address is not specified', async () => {
      // Mock live network calls
      sandbox.stub(uut.ar, 'getTransactions').resolves({
        success: true,
        transactions: [
          {
            height: 603416,
            tx_hash:
              'eef683d236d88e978bd406419f144057af3fe1b62ef59162941c1a9f05ded62c'
          }
        ]
      })

      await uut.walletInfoPromise

      const transactions = await uut.getTransactions()
      // console.log(`transactions: ${JSON.stringify(transactions, null, 2)}`)

      assert.isArray(transactions)
    })
  })

  describe('#send', () => {
    it('should broadcast a transaction and return a txid', async () => {
      await uut.walletInfoPromise

      const txid =
        '66b7d1fced6df27feb7faf305de2e3d6470decb0276648411fd6a2f69fec8543'

      // Mock live network calls.
      sandbox.stub(uut.sendBch, 'sendBch').resolves(txid)

      const output = await uut.send()

      assert.equal(output, txid)
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        await uut.walletInfoPromise

        // Mock live network calls.
        sandbox.stub(uut.sendBch, 'sendBch').throws(new Error('error message'))

        await uut.send()

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })
  })

  describe('#sendAll', () => {
    it('should broadcast a transaction and return a txid', async () => {
      await uut.walletInfoPromise

      const txid =
        '66b7d1fced6df27feb7faf305de2e3d6470decb0276648411fd6a2f69fec8543'

      // Mock live network calls.
      sandbox.stub(uut.sendBch, 'sendAllBch').resolves(txid)

      const output = await uut.sendAll()

      assert.equal(output, txid)
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        await uut.walletInfoPromise

        // Mock live network calls.
        sandbox
          .stub(uut.sendBch, 'sendAllBch')
          .throws(new Error('error message'))

        await uut.sendAll()

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })
  })

  describe('#sendTokens', () => {
    it('should broadcast a transaction and return a txid', async () => {
      const txid =
        '66b7d1fced6df27feb7faf305de2e3d6470decb0276648411fd6a2f69fec8543'

      // Mock live network calls.
      uut.utxos.utxoStore = mockUtxos.tokenUtxos01
      sandbox.stub(uut.tokens, 'sendTokens').resolves(txid)

      const output = await uut.sendTokens()

      assert.equal(output, txid)
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        // Mock live network calls.
        uut.utxos.utxoStore = mockUtxos.tokenUtxos01

        // Force an error
        sandbox
          .stub(uut.tokens, 'sendTokens')
          .throws(new Error('error message'))

        await uut.sendTokens()

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })

    it('should broadcast a transaction and return a txid', async () => {
      const txid =
        '66b7d1fced6df27feb7faf305de2e3d6470decb0276648411fd6a2f69fec8543'

      const outputs = [{
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '82e3d97b3cd033e60ffa755450b9075cf44fe1b2f6d5dc13657d8263e7165555',
        qty: 1
      }]

      // Mock live network calls.
      uut.utxos.utxoStore = mockUtxos.tokenUtxos01
      sandbox.stub(uut.tokens, 'sendTokens').resolves(txid)

      const output = await uut.sendTokens(outputs)

      assert.equal(output, txid)
    })
  })

  describe('#getUtxos', () => {
    it('should wrap the initUtxoStore function', async () => {
      await uut.walletInfoPromise

      sandbox.stub(uut.utxos, 'initUtxoStore').resolves({})

      const obj = await uut.getUtxos()

      assert.deepEqual(obj, {})
    })

    it('should get UTXOs for a given address', async () => {
      // Mock network calls.
      sandbox.stub(uut.ar, 'getUtxos').resolves(mockUtxos.tokenUtxos01)

      await uut.walletInfoPromise

      const addr = 'test-addr'

      const result = await uut.getUtxos(addr)
      // console.log('result: ', result)

      assert.property(result, 'bchUtxos')
      assert.property(result, 'nullUtxos')
      assert.property(result, 'slpUtxos')
      assert.property(result, 'address')
    })
  })

  describe('#listTokens', () => {
    it('should wrap the listTokensFromAddress function', async () => {
      await uut.walletInfoPromise

      sandbox.stub(uut.tokens, 'listTokensFromAddress').resolves({})

      const obj = await uut.listTokens()

      assert.deepEqual(obj, {})
    })
  })

  describe('#getTokenBalance', () => {
    it('should wrap the getTokenBalance() function from the token library', async () => {
      await uut.walletInfoPromise

      sandbox.stub(uut.tokens, 'getTokenBalance').resolves(0)

      const tokenId = 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
      const result = await uut.getTokenBalance(tokenId)

      assert.equal(result, 0)
    })
  })

  describe('#burnTokens', () => {
    it('should broadcast a transaction and return a txid', async () => {
      const txid =
        '66b7d1fced6df27feb7faf305de2e3d6470decb0276648411fd6a2f69fec8543'

      // Mock live network calls.
      uut.utxos.utxoStore = mockUtxos.tokenUtxos01
      sandbox.stub(uut.tokens, 'burnTokens').resolves(txid)

      const output = await uut.burnTokens()

      assert.equal(output, txid)
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        uut.utxos.utxoStore = mockUtxos.tokenUtxos01

        // Force an error
        sandbox
          .stub(uut.tokens, 'burnTokens')
          .throws(new Error('error message'))

        await uut.burnTokens()

        assert.fail('unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })
  })

  describe('#burnAll', () => {
    it('should broadcast a transaction and return a txid', async () => {
      const tokenId =
        'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'

      // Mock live network calls.
      uut.utxos.utxoStore = mockUtxos.tokenUtxos01
      sandbox.stub(uut.tokens, 'burnAll').resolves('txid')

      const output = await uut.burnAll(tokenId)
      // console.log('output: ', output)

      assert.equal(output, 'txid')
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        // Force an error
        sandbox
          .stub(uut.utxos, 'getSpendableTokenUtxos')
          .throws(new Error('error message'))

        await uut.burnAll()

        assert.fail('unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })
  })

  describe('#getUsd', () => {
    it('should pass data on to adapter router lib', async () => {
      // Mock dependencies
      sandbox.stub(uut.ar, 'getUsd').resolves(100)

      const result = await uut.getUsd()

      assert.equal(result, 100)
    })
  })

  describe('#sendOpReturn', () => {
    it('should broadcast OP_RETURN tx and return txid', async () => {
      // Mock dependencies
      sandbox.stub(uut.opReturn, 'sendOpReturn').resolves('fake-txid')

      const result = await uut.sendOpReturn()

      assert.equal(result, 'fake-txid')
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        // Force an error
        sandbox
          .stub(uut.opReturn, 'sendOpReturn')
          .throws(new Error('error message'))

        await uut.sendOpReturn()

        assert.fail('unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })
  })

  describe('#getTxData', () => {
    it('should pass request to adapter router', async () => {
      // Mock dependencies
      sandbox.stub(uut.ar, 'getTxData').resolves({ key: 'value' })

      const result = await uut.getTxData()

      assert.equal(result.key, 'value')
    })
  })

  describe('#utxoIsValid', async () => {
    it('shoudl wrap the utxoIsValid() function', async () => {
      // Mock dependencies
      sandbox.stub(uut.ar, 'utxoIsValid').resolves(true)

      const result = await uut.utxoIsValid()

      assert.equal(result, true)
    })
  })

  describe('#getTokenData', async () => {
    it('shoudl wrap the getTokenData() function', async () => {
      // Mock dependencies
      sandbox.stub(uut.ar, 'getTokenData').resolves(true)

      const result = await uut.getTokenData()

      assert.equal(result, true)
    })
  })

  describe('#getTokenData2', async () => {
    it('shoudl wrap the getTokenData2() function', async () => {
      // Mock dependencies
      sandbox.stub(uut.ar, 'getTokenData2').resolves(true)

      const result = await uut.getTokenData2()

      assert.equal(result, true)
    })
  })

  describe('#getKeyPair', () => {
    it('should return an object with a key pair', async () => {
      const result = await uut.getKeyPair(5)
      // console.log('result: ', result)

      assert.property(result, 'hdIndex')
      assert.property(result, 'wif')
      assert.property(result, 'publicKey')
      assert.property(result, 'cashAddress')
      assert.property(result, 'slpAddress')
    })

    it('should throw an error if wallet does not have a mnemonic', async () => {
      try {
        uut.walletInfo.mnemonic = ''

        await uut.getKeyPair()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Wallet does not have a mnemonic. Can not generate a new key pair.')
      }
    })

    it('should return root keypair if no argument is passed', async () => {
      const result = await uut.getKeyPair()
      // console.log('result: ', result)

      assert.equal(result.hdIndex, 0)
      assert.equal(result.wif, uut.walletInfo.privateKey)
      assert.equal(result.publicKey, uut.walletInfo.publicKey)
      assert.equal(result.cashAddress, uut.walletInfo.cashAddress)
      assert.equal(result.slpAddress, uut.walletInfo.slpAddress)
    })
  })

  describe('#optimize', () => {
    it('should call the consolidate-utoxs library', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.consolidateUtxos, 'start').resolves(1)

      const result = await uut.optimize()

      assert.equal(result, 1)
    })
  })

  describe('#getPubKey', () => {
    it('should pass call to the router', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.ar, 'getPubKey').resolves(1)

      const result = await uut.getPubKey('fake-addr')

      assert.equal(result, 1)
    })
  })

  describe('#broadcast', () => {
    it('should pass call to the router', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.ar, 'sendTx').resolves(1)

      const result = await uut.broadcast('fake-hex')

      assert.equal(result, 1)
    })
  })

  describe('#cid2json', () => {
    it('should convert a CID to a JSON object', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.ar, 'cid2json').resolves({ key: 'value' })

      const result = await uut.cid2json({ cid: 'fake-cid' })

      assert.equal(result.key, 'value')
    })
  })
})

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/unit/a05-adapters-router-unit.js`:

```js
/*
  Unit tests for the lib/adapters/router.js library.
*/

// Public npm libraries
const assert = require('chai').assert
const sinon = require('sinon')
const BCHJS = require('@psf/bch-js')

const AdapterRouter = require('../../lib/adapters/router')

let uut

describe('#adapter-router', () => {
  let sandbox
  // let utxos

  beforeEach(() => {
    const bchjs = new BCHJS()
    uut = new AdapterRouter({ bchjs })

    sandbox = sinon.createSandbox()

    // mockData = Object.assign({}, mockDataLib)
    // sendMockData = Object.assign({}, sendMockDataLib)
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if bch-js is not included', () => {
      try {
        uut = new AdapterRouter()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Must pass instance of bch-js when instantiating AdapterRouter.'
        )
      }
    })

    it('should select rest-api by default', () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs })

      assert.equal(uut.interface, 'rest-api')
    })

    it('should select consumer-api interface', () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      assert.equal(uut.interface, 'consumer-api')
    })

    it('should override restURL for consumer API', () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({
        bchjs,
        interface: 'consumer-api',
        restURL: 'fakeUrl'
      })

      assert.equal(uut.interface, 'consumer-api')
      assert.equal(uut.bchConsumer.restURL, 'fakeUrl')
    })
  })

  describe('#getUtxos', () => {
    it('should throw an error if address is not specified', async () => {
      try {
        await uut.getUtxos()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Address string required when calling getUtxos()'
        )
      }
    })

    it('should use bch-js by default', async () => {
      // Mock dependencies.
      sandbox.stub(uut.bchjs.Utxo, 'get').resolves(['test str'])

      const result = await uut.getUtxos('fake-addr')

      assert.equal(result, 'test str')
    })

    it('should use wallet service when consumer interface is selected', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies.
      sandbox.stub(uut.bchConsumer.bch, 'getUtxos').resolves(['test str'])

      const result = await uut.getUtxos('fake-addr')

      assert.equal(result, 'test str')
    })

    it('should throw error if communication error with bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies.
      sandbox
        .stub(uut.bchConsumer.bch, 'getUtxos')
        .resolves([{ success: false, message: 'test error' }])

      try {
        await uut.getUtxos('fake-addr')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.getUtxos('fake-addr')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })
  })

  describe('#sendTx', () => {
    it('should throw an error hex is not specified', async () => {
      try {
        await uut.sendTx()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Hex encoded transaction required as input.'
        )
      }
    })

    it('should use bch-js by default', async () => {
      // Mock dependencies.
      sandbox
        .stub(uut.bchjs.RawTransactions, 'sendRawTransaction')
        .resolves(['txid-str'])

      const result = await uut.sendTx('fakeHex')

      assert.equal(result, 'txid-str')
    })

    it('should catch full-node errors thrown by bch-js', async () => {
      // Mock dependencies.
      sandbox
        .stub(uut.bchjs.RawTransactions, 'sendRawTransaction')
        .rejects({ error: 'test error' })

      try {
        await uut.sendTx('fakeHex')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })

    it('should use wallet service when consumer-api interface is selected', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies.
      sandbox.stub(uut.bchConsumer.bch, 'sendTx').resolves({ txid: 'txid-str' })

      const result = await uut.sendTx('fakeHex')

      assert.equal(result, 'txid-str')
    })

    it('should throw error if communication error with bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies.
      sandbox
        .stub(uut.bchConsumer.bch, 'sendTx')
        .resolves({ success: false, message: 'test error' })

      try {
        await uut.sendTx('fakeHex')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.sendTx('fake-addr')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })
  })

  describe('#getBalance', () => {
    it('should throw an error if address is not specified', async () => {
      try {
        await uut.getBalance()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Address string required when calling getBalance()'
        )
      }
    })

    it('should use bch-js by default', async () => {
      // Mock dependencies.
      sandbox.stub(uut.bchjs.Electrumx, 'balance').resolves('test str')

      const result = await uut.getBalance('fake-addr')

      assert.equal(result, 'test str')
    })

    it('should use wallet service when consumer interface is selected', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies.
      sandbox
        .stub(uut.bchConsumer.bch, 'getBalance')
        .resolves({ success: true, balances: [{ balance: 'test str' }] })

      const result = await uut.getBalance('fake-addr')
      // console.log('result: ', result)

      assert.equal(result.balance, 'test str')
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.getBalance('fake-addr')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })

    it('should throw errors passed from service', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies.
      sandbox
        .stub(uut.bchConsumer.bch, 'getBalance')
        .resolves({ success: false, message: 'test-error' })

      try {
        await uut.getBalance('fake-addr')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test-error')
      }
    })
  })

  describe('#getTransactions', () => {
    it('should throw an error if address is not specified', async () => {
      try {
        await uut.getTransactions()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Address string required when calling getTransactions()'
        )
      }
    })

    it('should use bch-js by default', async () => {
      // Mock dependencies.
      sandbox.stub(uut.bchjs.Electrumx, 'transactions').resolves({ transactions: 'test str' })
      sandbox.stub(uut.bchjs.Electrumx, 'sortAllTxs').resolves('test str')

      const result = await uut.getTransactions('fake-addr')
      // console.log('result: ', result)

      assert.equal(result.transactions, 'test str')
    })

    it('should use wallet service when consumer interface is selected', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies.
      sandbox.stub(uut.bchConsumer.bch, 'getTxHistory').resolves({
        success: true,
        txs: ['test str']
      })

      const result = await uut.getTransactions('fake-addr')
      // console.log('result: ', result)

      assert.equal(result.transactions, 'test str')
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.getTransactions('fake-addr')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })
  })

  describe('#getTxData', () => {
    it('should throw an error if txids is a string', async () => {
      try {
        await uut.getTxData('blah')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Input txids must be an array of TXIDs. Up to 20.'
        )
      }
    })

    it('should use bch-js by default', async () => {
      // Mock dependencies.
      sandbox
        .stub(uut.bchjs.PsfSlpIndexer, 'tx')
        .resolves({ txData: { key: 'value' } })

      const result = await uut.getTxData(['fake-txid'])
      // console.log('result: ', result)

      assert.isArray(result)
      assert.equal(result[0].key, 'value')
    })

    it('should get data from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies.
      sandbox
        .stub(uut.bchConsumer.bch, 'getTxData')
        .resolves([{ key: 'value' }])

      const result = await uut.getTxData(['fake-txid'])
      // console.log('result: ', result)

      assert.isArray(result)
      assert.equal(result[0].key, 'value')
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.getTxData(['fake-addr'])

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })
  })

  describe('#getUsd', () => {
    it('should get price from bch-js', async () => {
      // Mock dependencies
      sandbox.stub(uut.bchjs.Price, 'getUsd').resolves(100)

      // Force selected interface.
      uut.interface = 'rest-api'

      const result = await uut.getUsd()

      assert.equal(result, 100)
    })

    it('should get price from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies
      sandbox.stub(uut.bchConsumer.bch, 'getUsd').resolves(100)

      // Force selected interface.
      uut.interface = 'consumer-api'

      const result = await uut.getUsd()

      assert.equal(result, 100)
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.getUsd()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })
  })

  describe('#utxoIsValid', () => {
    it('should validate UTXO from bch-js', async () => {
      // Mock dependencies
      sandbox.stub(uut.bchjs.Utxo, 'isValid').resolves(true)

      // Force selected interface.
      uut.interface = 'rest-api'

      const utxo = {
        tx_hash: 'b94e1ff82eb5781f98296f0af2488ff06202f12ee92b0175963b8dba688d1b40',
        tx_pos: 0
      }

      const result = await uut.utxoIsValid(utxo)

      assert.equal(result, true)
    })

    it('should validate UTXO from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies
      sandbox.stub(uut.bchConsumer.bch, 'utxoIsValid').resolves({ isValid: true })

      // Force selected interface.
      uut.interface = 'consumer-api'

      const utxo = {
        tx_hash: 'b94e1ff82eb5781f98296f0af2488ff06202f12ee92b0175963b8dba688d1b40',
        tx_pos: 0
      }

      const result = await uut.utxoIsValid(utxo)

      assert.equal(result, true)
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        const utxo = {
          tx_hash: 'b94e1ff82eb5781f98296f0af2488ff06202f12ee92b0175963b8dba688d1b40',
          tx_pos: 0
        }

        await uut.utxoIsValid(utxo)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })

    it('should throw an error if utxo is not specified', async () => {
      try {
        await uut.utxoIsValid()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'utxo required as input.')
      }
    })
  })

  describe('#getTokenData', () => {
    it('should get token data from bch-js', async () => {
      // Mock dependencies
      sandbox.stub(uut.bchjs.PsfSlpIndexer, 'getTokenData').resolves({
        genesisData: {},
        immutableData: {},
        mutableData: {}
      })

      // Force selected interface.
      uut.interface = 'rest-api'

      const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'

      const result = await uut.getTokenData(tokenId)

      assert.property(result, 'genesisData')
      assert.property(result, 'immutableData')
      assert.property(result, 'mutableData')
    })

    it('should get token data from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies
      sandbox.stub(uut.bchConsumer.bch, 'getTokenData').resolves({
        success: true,
        tokenData: {
          genesisData: {},
          immutableData: {},
          mutableData: {}
        }
      })

      const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'

      const result = await uut.getTokenData(tokenId)

      assert.property(result, 'genesisData')
      assert.property(result, 'immutableData')
      assert.property(result, 'mutableData')
    })

    // it('should throw an error if an interface is not specified', async () => {
    //   try {
    //     uut.interface = ''
    //
    //     const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'
    //
    //     await uut.getTokenData(tokenId)
    //
    //     assert.fail('Unexpected code path')
    //   } catch (err) {
    //     assert.include(err.message, 'this.interface is not specified')
    //   }
    // })

    it('should throw an error if token ID is not provided', async () => {
      try {
        await uut.getTokenData()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'tokenId required as input.')
      }
    })

    it('should sent token txs to Electrum library for sorting', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      const tokenId =
        '5f31905f335fa932879c5aabfd1c14ac748f6696148bd300f845ea5016ad573e'

      // Mock dependencies and force desired code path.
      sandbox.stub(uut.bchConsumer.bch, 'getTokenData').resolves({
        success: true,
        tokenData: {
          genesisData: {
            txs: []
          },
          immutableData: {},
          mutableData: {}
        }
      })
      sandbox.stub(uut.bchjs.Electrumx, 'sortAllTxs').resolves([])

      const result = await uut.getTokenData(tokenId, true)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result.genesisData.txs)
    })

    // CT 4/6/23 Saw this error in the wild. Created an error handler for it.
    it('should throw error if genesis data has no txs', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      const tokenId =
        '5f31905f335fa932879c5aabfd1c14ac748f6696148bd300f845ea5016ad573e'

      // Mock dependencies and force desired code path.
      sandbox.stub(uut.bchConsumer.bch, 'getTokenData').resolves({
        success: true,
        tokenData: {
          genesisData: {
          },
          immutableData: {},
          mutableData: {}
        }
      })
      sandbox.stub(uut.bchjs.Electrumx, 'sortAllTxs').resolves([])

      try {
        await uut.getTokenData(tokenId, true)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'No transaction history included with genesis data.')
      }
    })

    // CT 4/6/23 Saw this error in the wild
    it('should throw error if timeout occurs with wallet service', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies
      sandbox.stub(uut.bchConsumer.bch, 'getTokenData').resolves({
        success: false,
        message: 'request timed out',
        data: ''
      })

      const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'

      try {
        await uut.getTokenData(tokenId)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'request timed out')
      }
    })
  })

  describe('#getTokenData2', () => {
    it('should get token data from bch-js', async () => {
      // Mock dependencies
      sandbox.stub(uut.bchjs.PsfSlpIndexer, 'getTokenData2').resolves({
        tokenIcon: {},
        tokenStats: {},
        optimizedTokenIcon: {},
        iconRepoCompatible: {},
        ps002Compatible: {}
      })

      // Force selected interface.
      uut.interface = 'rest-api'

      const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'

      const result = await uut.getTokenData2(tokenId)

      assert.property(result, 'tokenIcon')
      assert.property(result, 'tokenStats')
      assert.property(result, 'optimizedTokenIcon')
      assert.property(result, 'iconRepoCompatible')
      assert.property(result, 'ps002Compatible')
    })

    it('should get token data from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies
      sandbox.stub(uut.bchConsumer.bch, 'getTokenData2').resolves({
        tokenData: {
          tokenIcon: {},
          tokenStats: {},
          optimizedTokenIcon: {},
          iconRepoCompatible: {},
          ps002Compatible: {}
        }
      })

      const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'

      const result = await uut.getTokenData2(tokenId)

      assert.property(result, 'tokenIcon')
      assert.property(result, 'tokenStats')
      assert.property(result, 'optimizedTokenIcon')
      assert.property(result, 'iconRepoCompatible')
      assert.property(result, 'ps002Compatible')
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'

        await uut.getTokenData2(tokenId)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })

    it('should throw an error if token ID is not provided', async () => {
      try {
        await uut.getTokenData2()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'tokenId required as input.')
      }
    })
  })

  describe('#getPubKey', () => {
    it('should return pubkey from bch-js', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.bchjs.encryption, 'getPubKey').resolves({
        success: true,
        publicKey: '033a24d13b45eaf53bebc7da5b7ee79a39615790b4fb16dab048fdcc5abd3764ef'
      })

      const addr =
        'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'

      const result = await uut.getPubKey(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isString(result)
    })

    it('should return pubkey from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies and force desired code path
      sandbox.stub(uut.bchConsumer.msg, 'getPubKey').resolves({
        success: true,
        status: 200,
        endpoint: 'pubkey',
        pubkey: {
          success: true,
          publicKey: '033a24d13b45eaf53bebc7da5b7ee79a39615790b4fb16dab048fdcc5abd3764ef'
        }
      })

      const addr =
        'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'

      const result = await uut.getPubKey(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isString(result)
    })

    it('should handle address without a pubkey from bch-js', async () => {
      try {
        // Mock dependencies and force desired code path
        sandbox.stub(uut.bchjs.encryption, 'getPubKey').rejects({
          success: false,
          error: 'No transaction history.'
        })

        const addr =
          'bitcoincash:qzxeg2p27ls5mkgcy56spadfydau0cyk0y4g90sgtl'

        await uut.getPubKey(addr)

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'No transaction history')
      }
    })

    it('should handle address without a pubkey from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies and force desired code path
      sandbox.stub(uut.bchConsumer.msg, 'getPubKey').resolves({
        success: false,
        status: 422,
        message: 'No transaction history.',
        endpoint: 'pubkey'
      })

      try {
        const addr =
          'bitcoincash:qzxeg2p27ls5mkgcy56spadfydau0cyk0y4g90sgtl'

        await uut.getPubKey(addr)

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'No transaction history')
      }
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.getPubKey('fake-addr')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })

    it('should throw an error if token ID is not provided', async () => {
      try {
        await uut.getPubKey()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'addr required as input.')
      }
    })
  })

  describe('#getPsfWritePrice', () => {
    it('should get price from bch-js', async () => {
      // Mock dependencies
      sandbox.stub(uut.bchjs.Price, 'getPsffppPrice').resolves(100)

      // Force selected interface.
      uut.interface = 'rest-api'

      const result = await uut.getPsfWritePrice()

      assert.equal(result, 100)
    })

    it('should get price from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies
      sandbox.stub(uut.bchConsumer.bch, 'getPsffppWritePrice').resolves(100)

      // Force selected interface.
      uut.interface = 'consumer-api'

      const result = await uut.getPsfWritePrice()

      assert.equal(result, 100)
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.getPsfWritePrice()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })
  })

  describe('#cid2json', () => {
    it('should convert a CID to a JSON object for bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies and force desired code path
      sandbox.stub(uut.bchConsumer.bch, 'cid2json').resolves({ key: 'value' })

      // Force selected interface.
      uut.interface = 'consumer-api'

      const result = await uut.cid2json({ cid: 'fake-cid' })

      assert.equal(result.key, 'value')
    })

    it('should throw an error for rest-api interface', async () => {
      try {
        uut.interface = 'rest-api'

        await uut.cid2json({ cid: 'fake-cid' })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'cid2json() is not supported with the rest-api interface.')
      }
    })

    it('should throw an error if no CID is provided', async () => {
      try {
        await uut.cid2json()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'cid required as input.')
      }
    })
  })
})

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/unit/a03-utxos-unit.js`:

```js
/*
  Unit tests for the utxos.js library
*/

const assert = require('chai').assert
const sinon = require('sinon')
const cloneDeep = require('lodash.clonedeep')
const BCHJS = require('@psf/bch-js')

const UTXOs = require('../../lib/utxos')
const AdapterRouter = require('../../lib/adapters/router')
let uut

const mockDataLib = require('./mocks/utxo-mocks')
let mockData

describe('#UTXOs', () => {
  let sandbox

  beforeEach(() => {
    const config = {
      restURL: 'https://api.fullstack.cash/v5/'
    }
    const bchjs = new BCHJS(config)
    config.bchjs = bchjs
    config.ar = new AdapterRouter(config)
    uut = new UTXOs(config)

    mockData = cloneDeep(mockDataLib)

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if instance of bch-js is not passed', () => {
      try {
        uut = new UTXOs()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Must pass instance of bch-js when instantiating AdapterRouter.'
        )
      }
    })

    it('should throw an error if instance of Adapter Router is not passed.', () => {
      try {
        uut = new UTXOs({ bchjs: {} })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Must pass instance of Adapter Router.')
      }
    })
  })

  describe('#initUtxoStore', () => {
    it('should initialize and return the utxoStore', async () => {
      const addr = 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      // Mock network calls.
      sandbox.stub(uut.ar, 'getUtxos').resolves(mockData.tokenUtxos01)

      const utxos = await uut.initUtxoStore(addr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      assert.property(utxos, 'bchUtxos')
      assert.property(utxos, 'nullUtxos')
      assert.property(utxos, 'slpUtxos')
      assert.property(utxos, 'address')
    })

    it('should handle errors', async () => {
      try {
        const addr = 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

        // Force an error
        sandbox.stub(uut.ar, 'getUtxos').rejects(new Error('test error'))

        await uut.initUtxoStore(addr)

        assert.fail('unexpected result')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })

    it('should handle network errors', async () => {
      try {
        const addr = 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

        // Force an error
        sandbox
          .stub(uut.ar, 'getUtxos')
          .resolves({ status: 422, message: 'test error' })

        await uut.initUtxoStore(addr)

        assert.fail('unexpected result')
      } catch (err) {
        // console.log(err)
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#getSpendableTokenUtxos', () => {
    it('should return all the spendable UTXOs', () => {
      uut.utxoStore = mockData.tokenUtxos01

      const tokenUtxos = uut.getSpendableTokenUtxos()
      // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)

      for (let i = 0; i < tokenUtxos.length; i++) {
        assert.equal(tokenUtxos[i].tokenType, 1)
      }
    })

    it('should handle an error', () => {
      try {
        uut.utxoStore = {}

        uut.getSpendableTokenUtxos()

        assert.fail('Unexpected result')
      } catch (err) {
        // console.log(err)
        assert.include(err.message, 'Cannot read')
      }
    })
  })
})

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/unit/a04-tokens-unit.js`:

```js
/*
  Unit tests for the token library.
*/

const assert = require('chai').assert
const sinon = require('sinon')
const BCHJS = require('@psf/bch-js')

const Tokens = require('../../lib/tokens')
const Utxos = require('../../lib/utxos')
const AdapterRouter = require('../../lib/adapters/router')

let uut

const mockDataLib = require('./mocks/utxo-mocks')
let mockData
const sendMockDataLib = require('./mocks/send-bch-mocks')
let sendMockData

describe('#tokens', () => {
  let sandbox
  let utxos

  beforeEach(() => {
    const config = {
      restURL: 'https://api.fullstack.cash/v5/'
    }
    const bchjs = new BCHJS(config)
    config.bchjs = bchjs
    config.ar = new AdapterRouter(config)
    uut = new Tokens(config)
    utxos = new Utxos(config)

    sandbox = sinon.createSandbox()

    mockData = Object.assign({}, mockDataLib)
    sendMockData = Object.assign({}, sendMockDataLib)
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if instance of bch-js is not passed', () => {
      try {
        uut = new Tokens()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Must pass instance of bch-js when instantiating Tokens library.'
        )
      }
    })

    it('should throw an error if instance of bch-js is not passed', () => {
      try {
        uut = new Tokens({ bchjs: {} })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Must pass instance of Adapter Router.')
      }
    })
  })

  describe('#listTokensFromUtxos', () => {
    it('should return a list of tokens', () => {
      const tokenInfo = uut.listTokensFromUtxos(mockData.hydratedUtxos)
      // console.log(`tokenInfo:  ${JSON.stringify(tokenInfo, null, 2)}`)

      // Assert that the returned array is the expected size.
      assert.isArray(tokenInfo)
      assert.equal(tokenInfo.length, 1)

      // Assert the objects in the array have the expected properties.
      assert.property(tokenInfo[0], 'tokenId')
      assert.property(tokenInfo[0], 'ticker')
      assert.property(tokenInfo[0], 'name')
      assert.property(tokenInfo[0], 'decimals')
      assert.property(tokenInfo[0], 'tokenType')
      assert.property(tokenInfo[0], 'url')
      assert.property(tokenInfo[0], 'qty')

      // Assert that the quantities are as expected.
      assert.equal(tokenInfo[0].qty, 1)
    })

    it('should return for non-SLP UTXOs', () => {
      const tokenInfo = uut.listTokensFromUtxos([{ isSlp: false }])
      // console.log(`tokenInfo:  ${JSON.stringify(tokenInfo, null, 2)}`)

      assert.equal(tokenInfo.length, 0)
    })

    it('should combine UTXOs with the same token', () => {
      const utxos = [mockData.hydratedUtxos[0], mockData.hydratedUtxos[0]]
      const tokenInfo = uut.listTokensFromUtxos(utxos)
      // console.log(`tokenInfo:  ${JSON.stringify(tokenInfo, null, 2)}`)

      assert.equal(tokenInfo[0].qty, 2)
    })

    it('should return aggregate token data', () => {
      const tokenInfo = uut.listTokensFromUtxos(mockData.tokenUtxos02)
      // console.log(`tokenInfo:  ${JSON.stringify(tokenInfo, null, 2)}`)

      // Assert that the returned array is the expected size.
      assert.isArray(tokenInfo)
      assert.equal(tokenInfo.length, 1)

      // Assert that the quantities are as expected.
      assert.equal(tokenInfo[0].qty, 1)
    })

    it('should handle and throw errors', async () => {
      try {
        uut.listTokensFromUtxos('a')

        assert(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'utxos.forEach is not a function')
      }
    })
  })

  describe('#createTransaction', () => {
    it('should throw an error if there are no BCH UTXOs.', async () => {
      try {
        await uut.createTransaction({}, {}, [], [])

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'BCH UTXO list is empty')
      }
    })

    it('should throw an error if there are no token UTXOs.', async () => {
      try {
        await uut.createTransaction({}, {}, ['placeholder'], [])

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'Token UTXO list is empty')
      }
    })

    it('should send token with no token change and no UTXO change', async () => {
      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
        qty: 1
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      utxos.utxoStore = mockData.tokenUtxos01
      const bchUtxos = utxos.utxoStore.bchUtxos
      const tokenUtxos = utxos.getSpendableTokenUtxos()
      // console.log('tokenUtxos: ', tokenUtxos)

      // Modify the BCH UTXO for this test.
      // bchUtxos[0].value = bchUtxos[0].satoshis = 100000

      const { hex, txid } = await uut.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        tokenUtxos
      )

      assert.isString(hex)
      assert.isString(txid)
    })

    it('should send token with token change and no UTXO change', async () => {
      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
        qty: 0.5
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      utxos.utxoStore = mockData.tokenUtxos01
      const bchUtxos = utxos.utxoStore.bchUtxos
      let tokenUtxos = utxos.getSpendableTokenUtxos()

      // modify tokenUtxo for this test.
      tokenUtxos = tokenUtxos.find(elem => elem.tokenId === output.tokenId)
      // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)
      tokenUtxos.tokenQty = '2'

      const { hex, txid } = await uut.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        [tokenUtxos]
      )

      assert.isString(hex)
      assert.isString(txid)
    })

    it('should send token with no token change and UTXO change', async () => {
      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
        qty: 1
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      // utxos.utxoStore = mockData.hydratedUtxos
      // const bchUtxos = utxos.getBchUtxos()
      // const tokenUtxos = utxos.getTokenUtxos()
      utxos.utxoStore = mockData.tokenUtxos01
      const bchUtxos = utxos.utxoStore.bchUtxos
      const tokenUtxos = utxos.getSpendableTokenUtxos()

      // Modify the BCH UTXO for this test.
      bchUtxos[0].value = bchUtxos[0].satoshis = 100000

      const { hex, txid } = await uut.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        tokenUtxos
      )

      assert.isString(hex)
      assert.isString(txid)
    })

    it('should send NFT Group token', async () => {
      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '8cd26481aaed66198e22e05450839fda763daadbb9938b0c71521ef43c642299',
        qty: 1
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      // utxos.utxoStore = mockData.mockNFTGroupUtxos
      // const bchUtxos = utxos.getBchUtxos()
      // const tokenUtxos = utxos.getTokenUtxos()
      utxos.utxoStore = mockData.mockNFTGroupUtxos
      const bchUtxos = utxos.utxoStore.bchUtxos
      const tokenUtxos = utxos.getSpendableTokenUtxos()

      // Modify the BCH UTXO for this test.
      bchUtxos[0].value = bchUtxos[0].satoshis = 100000

      const { hex, txid } = await uut.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        tokenUtxos
      )

      assert.isString(hex)
      assert.isString(txid)
    })

    it('should send NFT (Child) token', async () => {
      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '82e3d97b3cd033e60ffa755450b9075cf44fe1b2f6d5dc13657d8263e716b6a5',
        qty: 1
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      // utxos.utxoStore = mockData.mockNFTChildUtxos
      // const bchUtxos = utxos.getBchUtxos()
      // const tokenUtxos = utxos.getTokenUtxos()
      utxos.utxoStore = mockData.mockNFTChildUtxos
      const bchUtxos = utxos.utxoStore.bchUtxos
      const tokenUtxos = utxos.getSpendableTokenUtxos()

      // Modify the BCH UTXO for this test.
      bchUtxos[0].value = bchUtxos[0].satoshis = 100000

      const { hex, txid } = await uut.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        tokenUtxos
      )

      assert.isString(hex)
      assert.isString(txid)
    })

    it('should throw an error for unknown token type', async () => {
      try {
        const output = {
          address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
          tokenId:
            '82e3d97b3cd033e60ffa755450b9075cf44fe1b2f6d5dc13657d8263e716b6a5',
          qty: 1
        }

        const walletInfo = sendMockData.mockWallet

        // Prep the utxo data.
        utxos.utxoStore = mockData.mockNFTChildUtxos
        const bchUtxos = utxos.utxoStore.bchUtxos
        const tokenUtxos = utxos.getSpendableTokenUtxos()

        // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)

        // Manipulate the token type to force an error.
        tokenUtxos[0].tokenType = 888

        await uut.createTransaction(output, walletInfo, bchUtxos, tokenUtxos)

        assert.fail('Unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Token Type 888 unknown')
      }
    })

    it('should throw an error if expected token UTXOs are not in the wallet', async () => {
      try {
        const output = {
          address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
          tokenId:
            '82e3d97b3cd033e60ffa755450b9075cf44fe1b2f6d5dc13657d8263e7165555',
          qty: 1
        }

        const walletInfo = sendMockData.mockWallet

        // Prep the utxo data.
        utxos.utxoStore = mockData.mockNFTChildUtxos
        const bchUtxos = utxos.utxoStore.bchUtxos
        const tokenUtxos = utxos.getSpendableTokenUtxos()

        await uut.createTransaction(output, walletInfo, bchUtxos, tokenUtxos)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'Token UTXO with token ID')
      }
    })

    it('should use custom token utxo filtering function', async () => {
      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
        qty: 1
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      utxos.utxoStore = mockData.tokenUtxos01
      const bchUtxos = utxos.utxoStore.bchUtxos
      const tokenUtxos = utxos.getSpendableTokenUtxos()

      const utxosFilterStub = sinon.stub().returnsArg(0)
      await uut.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        tokenUtxos,
        1.0,
        { tokenUtxosFilter: utxosFilterStub }
      )

      assert.ok(utxosFilterStub.calledOnce)
    })

    it('should pass opts to sendBch.getNecessaryUtxosAndChange', async () => {
      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
        qty: 1
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      utxos.utxoStore = mockData.tokenUtxos01
      const bchUtxos = utxos.utxoStore.bchUtxos
      const tokenUtxos = utxos.getSpendableTokenUtxos()

      const fn = sandbox.stub(uut.sendBch, 'getNecessaryUtxosAndChange').returns({
        necessaryUtxos: mockData.simpleUtxos.utxos,
        change: 0
      })

      await uut.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        tokenUtxos,
        1.0,
        { config: 'ok' }
      )

      assert.ok(fn.calledOnceWith(
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        { config: 'ok' }
      ))
    })
  })

  describe('#sendTokens', () => {
    it('should broadcast a transaction and return a txid', async () => {
      const hex =
        '0200000002abdb671501c19d11c35473aa84547f7f3b301d6924d6c8f419a26616dc486ea3010000006b4830450221009833f7bbecd7ba4c193f1edd693e42b337cd295b7e530cab3b2210f46c6cebe102200b65bf9b9bc66992c09cb1a40a2c84b629ba48c066b9f3cc5fe713a898051b6d41210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffffcc198a396570aebd10605cdde223356c0d8f92133560c52013ae5d43dccccf53010000006a47304402207bd190fce11a0cbf8dd8d0d987bcdd428168312f217ec61d018c3198014a786a02200b0ac3db775ea708eb9a76a9fa84fe9a68a0553408b143f52c220313cc2ecbd241210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff0271020000000000001976a914543dc8f7c91721da06da8c3941f79e26cfbce67288ac6c030000000000001976a9141d027f19f0e9c4e6bb4e0b5359b4d2e2f9e27d9888ac00000000'
      const txid =
        '66b7d1fced6df27feb7faf305de2e3d6470decb0276648411fd6a2f69fec8543'

      // Mock live network calls.
      sandbox.stub(uut, 'createTransaction').resolves(hex)
      sandbox.stub(uut.ar, 'sendTx').resolves(txid)

      const output = await uut.sendTokens()

      assert.equal(output, txid)
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        const hex =
          '0200000002abdb671501c19d11c35473aa84547f7f3b301d6924d6c8f419a26616dc486ea3010000006b4830450221009833f7bbecd7ba4c193f1edd693e42b337cd295b7e530cab3b2210f46c6cebe102200b65bf9b9bc66992c09cb1a40a2c84b629ba48c066b9f3cc5fe713a898051b6d41210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffffcc198a396570aebd10605cdde223356c0d8f92133560c52013ae5d43dccccf53010000006a47304402207bd190fce11a0cbf8dd8d0d987bcdd428168312f217ec61d018c3198014a786a02200b0ac3db775ea708eb9a76a9fa84fe9a68a0553408b143f52c220313cc2ecbd241210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff0271020000000000001976a914543dc8f7c91721da06da8c3941f79e26cfbce67288ac6c030000000000001976a9141d027f19f0e9c4e6bb4e0b5359b4d2e2f9e27d9888ac00000000'

        // Mock live network calls.
        sandbox.stub(uut, 'createTransaction').resolves(hex)
        sandbox.stub(uut.ar, 'sendTx').throws(new Error('error message'))

        await uut.sendTokens()

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })

    it('should pass options to createTransaction', async () => {
      // Mock live network calls.
      const ct = sandbox.stub(uut, 'createTransaction').resolves('ok')
      sandbox.stub(uut.ar, 'sendTx').resolves('ok')

      await uut.sendTokens(null, null, null, null, null, { utxoSortingFn: 'sortingFn' })

      assert.ok(ct.calledOnceWith(
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        { utxoSortingFn: 'sortingFn' }
      ))
    })
  })

  describe('#listTokensFromAddress', () => {
    it('should get token information for an address', async () => {
      const addr = 'simpleledger:qqmjqwsplscmx0aet355p4l0j8q74thv7vf5epph4z'

      // Stub network calls and subfunctions that are not within the scope of testing.
      sandbox.stub(uut.utxos, 'initUtxoStore').resolves({})
      uut.utxos.utxoStore = mockData.tokenUtxos03
      // console.log(`uut.utxos.utxoStore: ${JSON.stringify(uut.utxos.utxoStore, null, 2)}`)

      const tokenInfo = await uut.listTokensFromAddress(addr)
      // console.log(`tokenInfo: ${JSON.stringify(tokenInfo, null, 2)}`)

      assert.isArray(tokenInfo)

      assert.property(tokenInfo[0], 'tokenId')
      assert.property(tokenInfo[0], 'ticker')
      assert.property(tokenInfo[0], 'name')
      assert.property(tokenInfo[0], 'decimals')
      assert.property(tokenInfo[0], 'tokenType')
      assert.property(tokenInfo[0], 'url')
      assert.property(tokenInfo[0], 'qty')
    })

    it('should throw an error if address is not specified', async () => {
      try {
        await uut.listTokensFromAddress()

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Address not provided')
      }
    })
  })

  describe('#getTokenBalance', () => {
    it('should get token information for an address', async () => {
      // Mock dependencies and force desired code path.
      sandbox.stub(uut, 'listTokensFromAddress').resolves([
        {
          tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
          ticker: 'TROUT',
          name: "Trout's test token",
          decimals: 2,
          tokenType: 1,
          url: 'troutsblog.com',
          qty: 1
        }
      ])

      const addr = 'simpleledger:qqmjqwsplscmx0aet355p4l0j8q74thv7vf5epph4z'
      const tokenId = 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'

      const tokenBalance = await uut.getTokenBalance(tokenId, addr)
      // console.log(`tokenBalance: ${JSON.stringify(tokenBalance, null, 2)}`)

      assert.equal(tokenBalance, 1)
    })

    it('should throw an error if token ID is not specified', async () => {
      try {
        await uut.getTokenBalance()

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'token ID not provided')
      }
    })

    it('should throw an error if address is not specified', async () => {
      try {
        await uut.getTokenBalance('fake-token-id')

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Address not provided')
      }
    })

    it('should return zero if address has not tokens', async () => {
      // Mock dependencies and force desired code path.
      sandbox.stub(uut, 'listTokensFromAddress').resolves([])

      const addr = 'simpleledger:qqmjqwsplscmx0aet355p4l0j8q74thv7vf5epph4z'
      const tokenId = 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'

      const tokenBalance = await uut.getTokenBalance(tokenId, addr)
      // console.log(`tokenBalance: ${JSON.stringify(tokenBalance, null, 2)}`)

      assert.equal(tokenBalance, 0)
    })
  })

  describe('#createBurnTransaction', () => {
    it('should throw an error if qty input is not provided.', async () => {
      try {
        await uut.createBurnTransaction()

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'qty must be number')
      }
    })

    it('should throw an error if tokenId input is not provided.', async () => {
      try {
        const tokenId = ''
        await uut.createBurnTransaction(1, tokenId)

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'tokenId must be string')
      }
    })

    it('should throw an error if walletInfo is not provided.', async () => {
      try {
        const tokenId =
          'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
        const walletInfo = ''
        await uut.createBurnTransaction(1, tokenId, walletInfo)

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'walletInfo must be a object')
      }
    })

    it('should throw an error if there are no BCH UTXOs.', async () => {
      try {
        const tokenId =
          'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
        const walletInfo = sendMockData.mockWallet
        const bchUtxos = []
        await uut.createBurnTransaction(1, tokenId, walletInfo, bchUtxos)

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'BCH UTXO list is empty')
      }
    })

    it('should throw an error if there are no token UTXOs.', async () => {
      try {
        const tokenId =
          'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
        const walletInfo = sendMockData.mockWallet

        // Prep the utxo data.
        utxos.utxoStore = mockData.tokenUtxos01
        const bchUtxos = utxos.utxoStore.bchUtxos
        await uut.createBurnTransaction(1, tokenId, walletInfo, bchUtxos)

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'Token UTXO list is empty')
      }
    })

    it('should throw an error if tokenId does not match', async () => {
      try {
        const tokenId = 'bad token id'
        const walletInfo = sendMockData.mockWallet

        // Prep the utxo data.
        utxos.utxoStore = mockData.mockNFTGroupUtxos
        const bchUtxos = utxos.utxoStore.bchUtxos
        const tokenUtxos = utxos.getSpendableTokenUtxos()

        await uut.createBurnTransaction(
          1,
          tokenId,
          walletInfo,
          bchUtxos,
          tokenUtxos
        )

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'tokenId does not match')
      }
    })

    it('should throw an error if wallet contains fewer tokens than are requested to burn', async () => {
      try {
        const tokenId = 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
        const walletInfo = sendMockData.mockWallet

        // Prep the utxo data.
        utxos.utxoStore = mockData.tokenUtxos01
        const bchUtxos = utxos.utxoStore.bchUtxos
        const tokenUtxos = utxos.getSpendableTokenUtxos()

        await uut.createBurnTransaction(
          100.5,
          tokenId,
          walletInfo,
          bchUtxos,
          tokenUtxos
        )

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'which is less than quantity to burn')
      }
    })

    /*
    it('should throw an error for non token type1.', async () => {
      try {
        const tokenId =
          '8cd26481aaed66198e22e05450839fda763daadbb9938b0c71521ef43c642299'
        const walletInfo = sendMockData.mockWallet

        // Prep the utxo data.
        utxos.utxoStore = mockData.mockNFTGroupUtxos
        const bchUtxos = utxos.utxoStore.bchUtxos
        const tokenUtxos = utxos.getSpendableTokenUtxos()

        await uut.createBurnTransaction(
          1,
          tokenId,
          walletInfo,
          bchUtxos,
          tokenUtxos
        )

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'Token must be type 1')
      }
    })
*/
    it('should generate burn transaction', async () => {
      const tokenId =
        'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      utxos.utxoStore = mockData.tokenUtxos01
      const bchUtxos = utxos.utxoStore.bchUtxos
      const tokenUtxos = utxos.getSpendableTokenUtxos()
      // console.log('tokenUtxos: ', tokenUtxos)

      const { hex, txid } = await uut.createBurnTransaction(
        1,
        tokenId,
        walletInfo,
        bchUtxos,
        tokenUtxos
      )

      assert.isString(hex)
      assert.isString(txid)
    })
  })

  describe('#burnTokens', () => {
    it('should broadcast a transaction and return a txid', async () => {
      const hex =
        '0200000002abdb671501c19d11c35473aa84547f7f3b301d6924d6c8f419a26616dc486ea3010000006b4830450221009833f7bbecd7ba4c193f1edd693e42b337cd295b7e530cab3b2210f46c6cebe102200b65bf9b9bc66992c09cb1a40a2c84b629ba48c066b9f3cc5fe713a898051b6d41210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffffcc198a396570aebd10605cdde223356c0d8f92133560c52013ae5d43dccccf53010000006a47304402207bd190fce11a0cbf8dd8d0d987bcdd428168312f217ec61d018c3198014a786a02200b0ac3db775ea708eb9a76a9fa84fe9a68a0553408b143f52c220313cc2ecbd241210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff0271020000000000001976a914543dc8f7c91721da06da8c3941f79e26cfbce67288ac6c030000000000001976a9141d027f19f0e9c4e6bb4e0b5359b4d2e2f9e27d9888ac00000000'
      const txid =
        '66b7d1fced6df27feb7faf305de2e3d6470decb0276648411fd6a2f69fec8543'

      // Mock live network calls.
      sandbox.stub(uut, 'createBurnTransaction').resolves(hex)
      sandbox.stub(uut.ar, 'sendTx').resolves(txid)

      const output = await uut.burnTokens()

      assert.equal(output, txid)
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        const hex =
          '0200000002abdb671501c19d11c35473aa84547f7f3b301d6924d6c8f419a26616dc486ea3010000006b4830450221009833f7bbecd7ba4c193f1edd693e42b337cd295b7e530cab3b2210f46c6cebe102200b65bf9b9bc66992c09cb1a40a2c84b629ba48c066b9f3cc5fe713a898051b6d41210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffffcc198a396570aebd10605cdde223356c0d8f92133560c52013ae5d43dccccf53010000006a47304402207bd190fce11a0cbf8dd8d0d987bcdd428168312f217ec61d018c3198014a786a02200b0ac3db775ea708eb9a76a9fa84fe9a68a0553408b143f52c220313cc2ecbd241210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff0271020000000000001976a914543dc8f7c91721da06da8c3941f79e26cfbce67288ac6c030000000000001976a9141d027f19f0e9c4e6bb4e0b5359b4d2e2f9e27d9888ac00000000'

        // Mock live network calls.
        sandbox.stub(uut, 'createBurnTransaction').resolves(hex)
        sandbox.stub(uut.ar, 'sendTx').throws(new Error('error message'))

        await uut.burnTokens()

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })
  })

  describe('#burnAll', () => {
    it('should throw an error if tokenId is not provided', async () => {
      try {
        await uut.burnAll()

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'tokenId must be a string')
      }
    })

    it('should throw an error if walletInfo is not provided', async () => {
      try {
        const slpUtxos = mockData.mockTokenUtxos
        const tokenId = slpUtxos[0].tokenId
        await uut.burnAll(tokenId)

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'walletInfo is required')
      }
    })

    it('should throw an error if bchUtxos is not provided', async () => {
      try {
        const slpUtxos = mockData.mockTokenUtxos
        const tokenId = slpUtxos[0].tokenId
        const walletInfo = sendMockData.mockWallet

        await uut.burnAll(tokenId, walletInfo)

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'BCH UTXO list is empty')
      }
    })

    it('should throw an error if bchUtxos list is empty', async () => {
      try {
        const slpUtxos = mockData.mockTokenUtxos
        const tokenId = slpUtxos[0].tokenId
        const walletInfo = sendMockData.mockWallet

        await uut.burnAll(tokenId, walletInfo, [])

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'BCH UTXO list is empty')
      }
    })

    it('should throw an error if slpUtxos is not provided', async () => {
      try {
        const slpUtxos = mockData.mockTokenUtxos
        const tokenId = slpUtxos[0].tokenId
        const walletInfo = sendMockData.mockWallet
        const bchUtxos = mockData.mockBchUtxos

        await uut.burnAll(tokenId, walletInfo, bchUtxos)

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'SLP UTXO list is empty')
      }
    })

    it('should throw an error if slpUtxos list is empty', async () => {
      try {
        const slpUtxos = mockData.mockTokenUtxos
        const tokenId = slpUtxos[0].tokenId
        const walletInfo = sendMockData.mockWallet
        const bchUtxos = mockData.mockBchUtxos

        await uut.burnAll(tokenId, walletInfo, bchUtxos, [])

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'SLP UTXO list is empty')
      }
    })

    it('should broadcast a transaction and return a txid', async () => {
      sandbox.stub(uut.sendBch, 'sendAllBch').resolves('fakeTxid')

      const walletInfo = sendMockData.mockWallet
      const bchUtxos = mockData.mockBchUtxos
      const slpUtxos = mockData.mockTokenUtxos
      const tokenId = slpUtxos[0].tokenId

      const output = await uut.burnAll(tokenId, walletInfo, bchUtxos, slpUtxos)

      assert.equal(output, 'fakeTxid')
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        // Force an error
        sandbox.stub(uut.sendBch, 'sendAllBch').rejects(new Error('fake error'))

        const walletInfo = sendMockData.mockWallet
        const bchUtxos = mockData.mockBchUtxos
        const slpUtxos = mockData.mockTokenUtxos
        const tokenId = slpUtxos[0].tokenId

        await uut.burnAll(tokenId, walletInfo, bchUtxos, slpUtxos)

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'fake error')
      }
    })

    it('should throw an error if no token UTXOs with token ID found', async () => {
      try {
        // sandbox.stub(uut.sendBch, 'sendAllBch').resolves('fakeTxid')

        const walletInfo = sendMockData.mockWallet
        const bchUtxos = mockData.mockBchUtxos
        const slpUtxos = mockData.mockTokenUtxos
        const tokenId = 'abc123'

        await uut.burnAll(tokenId, walletInfo, bchUtxos, slpUtxos)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'No token UTXOs found to burn after filtering')
      }
    })
  })
})

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/unit/mocks/consolidate-utxos-mocks.js`:

```js
/*
  Mock data for consolidate-utxos-unit.js tests
*/

const tokenUtxos01 = [
  {
    height: 762251,
    tx_hash: '1034346a618d3492882722cb8a21f72ceba802ee3a1f1c4a22bac80f13d13244',
    tx_pos: 1,
    value: 546,
    txid: '1034346a618d3492882722cb8a21f72ceba802ee3a1f1c4a22bac80f13d13244',
    vout: 1,
    isSlp: true,
    type: 'token',
    qty: '1',
    tokenId: 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d',
    address: 'bitcoincash:qq2tk7vedkp5hj3smpmz6let49q9u4wu9ga9tmyfcc',
    tokenType: 1,
    ticker: 'MT2',
    name: 'Mutable Token',
    documentUri: 'ipfs://bafybeie7oxpsr7evcnlptecxfdhaqlot4732phukd2ekgvuzoir2frost4',
    documentHash: '56ed1a5768076a318d02b5db64e125544dca57ab6b2cc7ca61dfa4645d244463',
    decimals: 0,
    qtyStr: '1',
    tokenQty: '1'
  },
  {
    height: 762251,
    tx_hash: '794c3885ca229cb3240a5c4ee6f28c2fd6ecbe0ba58f5416d59565b59ff8bea2',
    tx_pos: 1,
    value: 546,
    txid: '794c3885ca229cb3240a5c4ee6f28c2fd6ecbe0ba58f5416d59565b59ff8bea2',
    vout: 1,
    isSlp: true,
    type: 'token',
    qty: '100',
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    address: 'bitcoincash:qq2tk7vedkp5hj3smpmz6let49q9u4wu9ga9tmyfcc',
    tokenType: 1,
    ticker: 'TROUT',
    name: "Trout's test token",
    documentUri: 'troutsblog.com',
    documentHash: '',
    decimals: 2,
    qtyStr: '1',
    tokenQty: '1'
  },
  {
    height: 762251,
    tx_hash: '85b8f2f2040af5bb56b18181bd42d21796c719a96844ed3066739566a034b8dc',
    tx_pos: 1,
    value: 546,
    txid: '85b8f2f2040af5bb56b18181bd42d21796c719a96844ed3066739566a034b8dc',
    vout: 1,
    isSlp: true,
    type: 'token',
    qty: '100',
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    address: 'bitcoincash:qq2tk7vedkp5hj3smpmz6let49q9u4wu9ga9tmyfcc',
    tokenType: 1,
    ticker: 'TROUT',
    name: "Trout's test token",
    documentUri: 'troutsblog.com',
    documentHash: '',
    decimals: 2,
    qtyStr: '1',
    tokenQty: '1'
  }
]

const tokenList01 = [
  {
    tokenId: 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d',
    ticker: 'MT2',
    name: 'Mutable Token',
    decimals: 0,
    tokenType: 1,
    url: 'ipfs://bafybeie7oxpsr7evcnlptecxfdhaqlot4732phukd2ekgvuzoir2frost4',
    qty: 1
  },
  {
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    ticker: 'TROUT',
    name: "Trout's test token",
    decimals: 2,
    tokenType: 1,
    url: 'troutsblog.com',
    qty: 2
  }
]

const countTokenUtxosOut01 = [
  {
    tokenId: 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d',
    ticker: 'MT2',
    name: 'Mutable Token',
    qty: 1,
    cnt: 1,
    utxos: [
      {
        height: 762251,
        tx_hash: '1034346a618d3492882722cb8a21f72ceba802ee3a1f1c4a22bac80f13d13244',
        tx_pos: 1,
        value: 546,
        txid: '1034346a618d3492882722cb8a21f72ceba802ee3a1f1c4a22bac80f13d13244',
        vout: 1,
        isSlp: true,
        type: 'token',
        qty: '1',
        tokenId: 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d',
        address: 'bitcoincash:qq2tk7vedkp5hj3smpmz6let49q9u4wu9ga9tmyfcc',
        tokenType: 1,
        ticker: 'MT2',
        name: 'Mutable Token',
        documentUri: 'ipfs://bafybeie7oxpsr7evcnlptecxfdhaqlot4732phukd2ekgvuzoir2frost4',
        documentHash: '56ed1a5768076a318d02b5db64e125544dca57ab6b2cc7ca61dfa4645d244463',
        decimals: 0,
        qtyStr: '1',
        tokenQty: '1'
      }
    ]
  },
  {
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    ticker: 'TROUT',
    name: "Trout's test token",
    qty: 2,
    cnt: 2,
    utxos: [
      {
        height: 762251,
        tx_hash: '794c3885ca229cb3240a5c4ee6f28c2fd6ecbe0ba58f5416d59565b59ff8bea2',
        tx_pos: 1,
        value: 546,
        txid: '794c3885ca229cb3240a5c4ee6f28c2fd6ecbe0ba58f5416d59565b59ff8bea2',
        vout: 1,
        isSlp: true,
        type: 'token',
        qty: '100',
        tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        address: 'bitcoincash:qq2tk7vedkp5hj3smpmz6let49q9u4wu9ga9tmyfcc',
        tokenType: 1,
        ticker: 'TROUT',
        name: "Trout's test token",
        documentUri: 'troutsblog.com',
        documentHash: '',
        decimals: 2,
        qtyStr: '1',
        tokenQty: '1'
      },
      {
        height: 762251,
        tx_hash: '85b8f2f2040af5bb56b18181bd42d21796c719a96844ed3066739566a034b8dc',
        tx_pos: 1,
        value: 546,
        txid: '85b8f2f2040af5bb56b18181bd42d21796c719a96844ed3066739566a034b8dc',
        vout: 1,
        isSlp: true,
        type: 'token',
        qty: '100',
        tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        address: 'bitcoincash:qq2tk7vedkp5hj3smpmz6let49q9u4wu9ga9tmyfcc',
        tokenType: 1,
        ticker: 'TROUT',
        name: "Trout's test token",
        documentUri: 'troutsblog.com',
        documentHash: '',
        decimals: 2,
        qtyStr: '1',
        tokenQty: '1'
      }
    ]
  }
]

module.exports = {
  tokenUtxos01,
  tokenList01,
  countTokenUtxosOut01
}

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/unit/mocks/utxo-mocks.js`:

```js
/*
  Unit test mocks for UTXOs.
*/

const simpleUtxos = {
  success: true,
  utxos: [
    {
      height: 629922,
      tx_hash:
        'd5228d2cdc77fbe5a9aa79f19b0933b6802f9f0067f42847fc4fe343664723e5',
      tx_pos: 0,
      value: 6000
    }
  ]
}

const mixedUtxos = [
  {
    height: 639443,
    tx_hash: '30707fffb9b295a06a68d217f49c198e9e1dbe1edc3874a0928ca1905f1709df',
    tx_pos: 0,
    value: 6000
  },
  {
    height: 639443,
    tx_hash: '8962566e413501224d178a02effc89be5ac0d8e4195f617415d443dc4c38fe50',
    tx_pos: 1,
    value: 546
  },
  {
    height: 639443,
    tx_hash: 'cbbc6106fdf6e21d84d66e06a1f7fcf3568817ddaa020ad1939db6ce0cfbe54b',
    tx_pos: 1,
    value: 546
  }
]

const hydratedUtxos = [
  {
    height: 640005,
    tx_hash: '3ad72d9709c206329aa40777d9394ab6d0b5bd0962fba7180533fc966ece165c',
    tx_pos: 1,
    value: 546,
    txid: '3ad72d9709c206329aa40777d9394ab6d0b5bd0962fba7180533fc966ece165c',
    vout: 1,
    isSlp: true,
    type: 'token',
    qty: '100',
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    address: 'bitcoincash:qqmjqwsplscmx0aet355p4l0j8q74thv7v90j65htu',
    ticker: 'TROUT',
    name: "Trout's test token",
    documentUri: 'troutsblog.com',
    documentHash: '',
    decimals: 2,
    qtyStr: '1'
  }
]

const tokenUtxos01 = {
  address: 'bitcoincash:qqmjqwsplscmx0aet355p4l0j8q74thv7v90j65htu',
  bchUtxos: [
    {
      height: 639762,
      tx_hash:
        '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
      tx_pos: 4,
      value: 2960,
      satoshis: 2960,
      txid: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
      vout: 4,
      isValid: false
    }
  ],
  nullUtxos: [],
  slpUtxos: {
    type1: {
      mintBatons: [],
      tokens: [
        {
          height: 640005,
          tx_hash:
            '3ad72d9709c206329aa40777d9394ab6d0b5bd0962fba7180533fc966ece165c',
          tx_pos: 1,
          value: 546,
          txid:
            '3ad72d9709c206329aa40777d9394ab6d0b5bd0962fba7180533fc966ece165c',
          vout: 1,
          utxoType: 'token',
          transactionType: 'send',
          tokenId:
            'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
          tokenTicker: 'TROUT',
          tokenName: "Trout's test token",
          tokenDocumentUrl: 'troutsblog.com',
          tokenDocumentHash: '',
          decimals: 2,
          tokenType: 1,
          isValid: true,
          tokenQty: '1',
          qtyStr: '1',
          type: 'token'
        },
        {
          height: 639443,
          tx_hash:
            '8962566e413501224d178a02effc89be5ac0d8e4195f617415d443dc4c38fe50',
          tx_pos: 1,
          value: 546,
          satoshis: 546,
          txid:
            '8962566e413501224d178a02effc89be5ac0d8e4195f617415d443dc4c38fe50',
          vout: 1,
          utxoType: 'token',
          transactionType: 'send',
          tokenId:
            '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
          tokenTicker: 'TOK-CH',
          tokenName: 'TokyoCash',
          tokenDocumentUrl: '',
          tokenDocumentHash: '',
          decimals: 8,
          tokenType: 1,
          tokenQty: '1',
          qtyStr: '1',
          isValid: true,
          type: 'token'
        },
        {
          height: 639443,
          tx_hash:
            'cbbc6106fdf6e21d84d66e06a1f7fcf3568817ddaa020ad1939db6ce0cfbe54b',
          tx_pos: 1,
          value: 546,
          satoshis: 546,
          txid:
            'cbbc6106fdf6e21d84d66e06a1f7fcf3568817ddaa020ad1939db6ce0cfbe54b',
          vout: 1,
          utxoType: 'token',
          transactionType: 'send',
          tokenId:
            'd0feefd514ae9262a2030e50c6b6d4533000abd12d84bc48a50ba6d69c033c95',
          tokenTicker: 'PRO',
          tokenName: 'PROPHET',
          tokenDocumentUrl: '',
          tokenDocumentHash: '',
          decimals: 0,
          tokenType: 1,
          tokenQty: '1',
          qtyStr: '1',
          isValid: true,
          type: 'token'
        }
      ]
    },
    nft: {
      tokens: []
    },
    group: {
      tokens: [],
      mintBatons: []
    }
  }
}

// Three token UTXOs from 2 tokens.
const tokenUtxos02 = [
  {
    height: 640005,
    tx_hash: '3ad72d9709c206329aa40777d9394ab6d0b5bd0962fba7180533fc966ece165c',
    tx_pos: 1,
    value: 546,
    txid: '3ad72d9709c206329aa40777d9394ab6d0b5bd0962fba7180533fc966ece165c',
    vout: 1,
    isSlp: true,
    type: 'token',
    qty: '100',
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    address: 'bitcoincash:qqmjqwsplscmx0aet355p4l0j8q74thv7v90j65htu',
    ticker: 'TROUT',
    name: "Trout's test token",
    documentUri: 'troutsblog.com',
    documentHash: '',
    decimals: 2,
    qtyStr: '1'
  }
]

const tokenUtxos03 = {
  address: 'bitcoincash:qqmjqwsplscmx0aet355p4l0j8q74thv7v90j65htu',
  bchUtxos: [],
  slpUtxos: {
    type1: {
      tokens: [
        {
          height: 640005,
          tx_hash:
            '3ad72d9709c206329aa40777d9394ab6d0b5bd0962fba7180533fc966ece165c',
          tx_pos: 1,
          value: 546,
          txid:
            '3ad72d9709c206329aa40777d9394ab6d0b5bd0962fba7180533fc966ece165c',
          vout: 1,
          isSlp: true,
          type: 'token',
          qty: '100',
          tokenId:
            'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
          address: 'bitcoincash:qqmjqwsplscmx0aet355p4l0j8q74thv7v90j65htu',
          ticker: 'TROUT',
          name: "Trout's test token",
          documentUri: 'troutsblog.com',
          documentHash: '',
          decimals: 2,
          qtyStr: '1'
        }
      ],
      mintBatons: []
    },
    nft: {
      tokens: []
    },
    group: {
      tokens: [],
      mintBatons: []
    }
  },
  nullUtxos: []
}

const mockUtxoStore = [
  {
    height: 639762,
    tx_hash: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
    tx_pos: 1,
    value: 546,
    satoshis: 546,
    txid: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
    vout: 1,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    tokenTicker: 'TROUT',
    tokenName: "Trout's test token",
    tokenDocumentUrl: 'troutsblog.com',
    tokenDocumentHash: '',
    decimals: 2,
    tokenType: 1,
    tokenQty: 2,
    isValid: true
  },
  {
    height: 639762,
    tx_hash: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
    tx_pos: 4,
    value: 2960,
    satoshis: 2960,
    txid: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
    vout: 4,
    isValid: false
  }
]

const mockBchUtxos = [
  {
    height: 639762,
    tx_hash: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
    tx_pos: 4,
    value: 2960,
    satoshis: 2960,
    txid: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
    vout: 4,
    isValid: false
  }
]

const mockTokenUtxos = [
  {
    height: 639762,
    tx_hash: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
    tx_pos: 1,
    value: 546,
    satoshis: 546,
    txid: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
    vout: 1,
    type: 'token',
    transactionType: 'send',
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    tokenTicker: 'TROUT',
    tokenName: "Trout's test token",
    tokenDocumentUrl: 'troutsblog.com',
    tokenDocumentHash: '',
    decimals: 2,
    tokenType: 1,
    tokenQty: 1,
    isValid: true
  }
]

const mockNFTGroupUtxos = {
  address: 'bitcoincash:qqmjqwsplscmx0aet355p4l0j8q74thv7v90j65htu',
  bchUtxos: [
    {
      height: 639762,
      tx_hash:
        '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
      tx_pos: 4,
      value: 2960,
      satoshis: 2960,
      txid: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
      vout: 4,
      isValid: false
    }
  ],
  nullUtxos: [],
  slpUtxos: {
    type1: {
      mintBatons: [],
      tokens: [
        {
          height: 640005,
          tx_hash:
            '3ad72d9709c206329aa40777d9394ab6d0b5bd0962fba7180533fc966ece165c',
          tx_pos: 1,
          value: 546,
          txid:
            '3ad72d9709c206329aa40777d9394ab6d0b5bd0962fba7180533fc966ece165c',
          vout: 1,
          utxoType: 'token',
          transactionType: 'send',
          tokenId:
            'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
          tokenTicker: 'TROUT',
          tokenName: "Trout's test token",
          tokenDocumentUrl: 'troutsblog.com',
          tokenDocumentHash: '',
          decimals: 2,
          tokenType: 1,
          isValid: true,
          tokenQty: '1'
        }
      ]
    },
    group: {
      tokens: [
        {
          height: 0,
          tx_hash:
            'ed934cf70830fda6c2a0b00e8e9d797172ff459c6dcd9112710fa6bd87f02aae',
          tx_pos: 1,
          value: 546,
          satoshis: 546,
          txid:
            'ed934cf70830fda6c2a0b00e8e9d797172ff459c6dcd9112710fa6bd87f02aae',
          vout: 1,
          type: 'token',
          transactionType: 'send',
          tokenId:
            '8cd26481aaed66198e22e05450839fda763daadbb9938b0c71521ef43c642299',
          tokenTicker: 'NFTTT',
          tokenName: 'NFT Test Token',
          tokenDocumentUrl: 'https://FullStack.cash',
          tokenDocumentHash: '',
          decimals: 0,
          tokenType: 129,
          tokenQty: 1,
          isValid: true
        }
      ],
      mintBatons: []
    },
    nft: {
      tokens: []
    }
  }
}

const mockNFTChildUtxos = {
  address: 'bitcoincash:qqmjqwsplscmx0aet355p4l0j8q74thv7v90j65htu',
  bchUtxos: [
    {
      height: 639762,
      tx_hash:
        '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
      tx_pos: 4,
      value: 2960,
      satoshis: 2960,
      txid: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
      vout: 4,
      isValid: false
    }
  ],
  nullUtxos: [],
  slpUtxos: {
    type1: {
      mintBatons: [],
      tokens: []
    },
    nft: {
      tokens: [
        {
          height: 650696,
          tx_hash:
            '6458885509a8eec6b4e10a515d3834638acc7e6e49b9b5969ee2a1d03224565d',
          tx_pos: 1,
          value: 546,
          satoshis: 546,
          txid:
            '6458885509a8eec6b4e10a515d3834638acc7e6e49b9b5969ee2a1d03224565d',
          vout: 1,
          type: 'token',
          transactionType: 'send',
          tokenId:
            '82e3d97b3cd033e60ffa755450b9075cf44fe1b2f6d5dc13657d8263e716b6a5',
          tokenTicker: 'NFT004',
          tokenName: 'NFT Child',
          tokenDocumentUrl: 'https://FullStack.cash',
          tokenDocumentHash: '',
          decimals: 0,
          tokenType: 65,
          tokenQty: 1,
          isValid: true
        }
      ]
    },
    group: {
      mintBatons: [],
      tokens: []
    }
  }
}

const dustAttackUtxo = {
  height: 655965,
  tx_hash: 'a675af87dcd8d39be782737aa52e0076b52eb2f5ce355ffcb5567a64dd96b77e',
  tx_pos: 21,
  value: 547,
  satoshis: 547,
  txid: 'a675af87dcd8d39be782737aa52e0076b52eb2f5ce355ffcb5567a64dd96b77e',
  vout: 21,
  isValid: null
}

const mockSlpApi = {
  details: [
    {
      height: 655965,
      tx_hash:
        'a675af87dcd8d39be782737aa52e0076b52eb2f5ce355ffcb5567a64dd96b77e',
      tx_pos: 21,
      value: 547,
      satoshis: 547,
      txid: 'a675af87dcd8d39be782737aa52e0076b52eb2f5ce355ffcb5567a64dd96b77e',
      vout: 21,
      isValid: false
    }
  ]
}

const mockSlpApiResult = {
  txid: 'a675af87dcd8d39be782737aa52e0076b52eb2f5ce355ffcb5567a64dd96b77e',
  isValid: false,
  msg: ''
}

const cornerCase1BchUtxos = [
  {
    height: 657451,
    tx_hash: '56f6e950622e180b1299df0112f09f3d81d071ab21aaebc3ab7955e8a96d6861',
    tx_pos: 4,
    value: 1144743,
    satoshis: 1144743,
    txid: '56f6e950622e180b1299df0112f09f3d81d071ab21aaebc3ab7955e8a96d6861',
    vout: 4,
    isValid: false
  },
  {
    height: 657466,
    tx_hash: 'c9b44538cc6dbe56b138f27a4311b4476713128f516f873452b4606f6e613bed',
    tx_pos: 0,
    value: 83002,
    satoshis: 83002,
    txid: 'c9b44538cc6dbe56b138f27a4311b4476713128f516f873452b4606f6e613bed',
    vout: 0,
    isValid: false
  },
  {
    height: 0,
    tx_hash: '99c9061f9afb8a201d32edfca2a5f3e753f8d218c69aa085d23ecf86c2a5744b',
    tx_pos: 4,
    value: 63754,
    satoshis: 63754,
    txid: '99c9061f9afb8a201d32edfca2a5f3e753f8d218c69aa085d23ecf86c2a5744b',
    vout: 4,
    isValid: false
  }
]

const cornerCase1TokenUtxos = {
  address: 'bitcoincash:qqmjqwsplscmx0aet355p4l0j8q74thv7v90j65htu',
  bchUtxos: [
    {
      height: 639762,
      tx_hash:
        '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
      tx_pos: 4,
      value: 2960,
      satoshis: 2960,
      txid: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
      vout: 4,
      isValid: false
    }
  ],
  nullUtxos: [],
  slpUtxos: {
    type1: {
      mintBatons: [],
      tokens: [
        {
          height: 657466,
          tx_hash:
            'ad5c4626297068f28d9ba6d45fb218cb622911e07ebe3003be33e9b7e8f0bc7f',
          tx_pos: 2,
          value: 546,
          satoshis: 546,
          txid:
            'ad5c4626297068f28d9ba6d45fb218cb622911e07ebe3003be33e9b7e8f0bc7f',
          vout: 2,
          type: 'token',
          transactionType: 'send',
          tokenId:
            '1a1fd545b922c8ee4ecd89bc312904f4e3ba4cf7850141066ad3e3f281668188',
          tokenTicker: 'MINT',
          tokenName: 'Mint',
          tokenDocumentUrl: 'mintslp.com',
          tokenDocumentHash: '',
          decimals: 8,
          tokenType: 1,
          tokenQty: 46,
          isValid: true
        },
        {
          height: 0,
          tx_hash:
            '99c9061f9afb8a201d32edfca2a5f3e753f8d218c69aa085d23ecf86c2a5744b',
          tx_pos: 1,
          value: 546,
          satoshis: 546,
          txid:
            '99c9061f9afb8a201d32edfca2a5f3e753f8d218c69aa085d23ecf86c2a5744b',
          vout: 1,
          type: 'token',
          transactionType: 'send',
          tokenId:
            '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
          tokenTicker: 'PSF',
          tokenName: 'Permissionless Software Foundation',
          tokenDocumentUrl: 'psfoundation.cash',
          tokenDocumentHash: '',
          decimals: 8,
          tokenType: 1,
          tokenQty: 196,
          isValid: true
        },
        {
          height: 0,
          tx_hash:
            '99c9061f9afb8a201d32edfca2a5f3e753f8d218c69aa085d23ecf86c2a5744b',
          tx_pos: 2,
          value: 546,
          satoshis: 546,
          txid:
            '99c9061f9afb8a201d32edfca2a5f3e753f8d218c69aa085d23ecf86c2a5744b',
          vout: 2,
          type: 'token',
          transactionType: 'send',
          tokenId:
            '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
          tokenTicker: 'PSF',
          tokenName: 'Permissionless Software Foundation',
          tokenDocumentUrl: 'psfoundation.cash',
          tokenDocumentHash: '',
          decimals: 8,
          tokenType: 1,
          tokenQty: 0.14152798,
          isValid: true
        }
      ]
    },
    nft: {
      tokens: []
    },
    group: {
      tokens: [],
      mintBatons: []
    }
  }
}

module.exports = {
  simpleUtxos,
  mixedUtxos,
  hydratedUtxos,
  tokenUtxos01,
  tokenUtxos02,
  tokenUtxos03,
  mockUtxoStore,
  mockBchUtxos,
  mockTokenUtxos,
  mockNFTGroupUtxos,
  mockNFTChildUtxos,
  dustAttackUtxo,
  mockSlpApi,
  mockSlpApiResult,
  cornerCase1BchUtxos,
  cornerCase1TokenUtxos
}

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/unit/mocks/util-mocks.js`:

```js
/*
  A mocking library for util.js unit tests.
  A mocking library contains data to use in place of the data that would come
  from an external dependency.
*/

'use strict'

const mockBalance = {
  page: 1,
  totalPages: 1,
  itemsOnPage: 1000,
  address: 'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7',
  balance: '1000',
  totalReceived: '1000',
  totalSent: '0',
  unconfirmedBalance: '0',
  unconfirmedTxs: 0,
  txs: 1,
  txids: ['6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d']
}

const mockUtxos = [
  {
    txid: '6181c669614fa18039a19b23eb06806bfece1f7514ab457c3bb82a40fe171a6d',
    vout: 0,
    value: '1000',
    height: 601861,
    confirmations: 4560,
    satoshis: 1000
  }
]

module.exports = {
  mockBalance,
  mockUtxos
}

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/unit/mocks/send-bch-mocks.js`:

```js
const mockWallet = {
  mnemonic: 'panel insane wrong volume better desk funny walnut bitter unable scare mix',
  cashAddress: 'bitcoincash:qqwsylce7r5ufe4mfc94xkd56t30ncnanq3v9m0kjj',
  address: 'bitcoincash:qqwsylce7r5ufe4mfc94xkd56t30ncnanq3v9m0kjj',
  legacyAddress: '13ePb2HkD8a8NcM2YtsezsRfsEUfuvHKbz',
  slpAddress: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
  privateKey: 'KwPVaC4ui2NiKnJc8kkdSi5L47WeUupVBYf672pKhjZw4r4y2Mp9',
  hdPath: "m/44'/245'/0'/0/0"
}

// Example of output of bch-js.Electrumx.utxo()
const exampleUtxos01 = {
  success: true,
  utxos: [
    {
      tx_hash: '53cfccdc435dae1320c5603513928f0d6c3523e2dd5c6010bdae7065398a19cc',
      tx_pos: 1,
      value: 1143,
      height: 638717
    },
    {
      tx_hash: 'a36e48dc1666a219f4c8d624691d303b7f7f5484aa7354c3119dc1011567dbab',
      tx_pos: 1,
      value: 698,
      height: 638578
    },
    {
      tx_hash: 'b4d678b8d0bfbafeaf886df1cc5638e2c780622e575a11b3c5bed4bfb67142ac',
      tx_pos: 1,
      value: 12525803,
      height: 638563
    }
  ]
}

// Example of output of bch-js.Electrumx.utxo()
const exampleUtxos02 = {
  success: true,
  utxos: [
    {
      height: 0,
      tx_hash: '5a84d0416f8a4fe89308e3bba5ec31f37df29e8507436eb64d4fe730cda7e456',
      tx_pos: 0,
      value: 600
    },
    {
      height: 0,
      tx_hash: '1a2d7555b395faa23c13ce09804618b37bb9590b563c4b51dc737ed0d1ade0ee',
      tx_pos: 0,
      value: 555
    }
  ]
}

module.exports = {
  mockWallet,
  exampleUtxos01,
  exampleUtxos02
}

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/e2e/burn-token.js`:

```js
/*
  This is a live test for burning tokens with a wallet created from a WIF.
  Customize the constants at the top to run the test.
*/

const WIF = process.env.TEST_WIF
if (!WIF) throw new Error('TEST_WIF env var not found.')

// BCH Address: bitcoincash:qqkg30ryje97al52htqwvveha538y7gttywut3cdqv
const TOKEN_ID =
  '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'
const BURN_QTY = 0.01

const BchWallet = require('../../index')

async function burnTest () {
  try {
    // Use bch-api
    // const wallet = new BchWallet(WIF, { interface: 'rest-api' })
    // Use bch-consumer
    const wallet = new BchWallet(WIF, { interface: 'consumer-api' })

    await wallet.walletInfoPromise

    const txid = await wallet.burnTokens(BURN_QTY, TOKEN_ID)
    console.log('txid: ', txid)
  } catch (err) {
    console.error(err)
  }
}
burnTest()

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/e2e/basic-auth.js`:

```js
/*
  The purpose of this script is test and debug the usage of a Basic Authorization
  token for connecting minimal-slp-wallet to private instances of bch-api.
  Private instances of bch-api use Basic Authentiation instead of JWT tokens.

  It assumes that the Basic Auth token has been placed in the BCHJSAUTHPASS_TEMP
  environment variable.
*/

// Global npm libraries

// Local libraries
const BchWallet = require('../../index')

async function startTest () {
  try {
    const wallet = new BchWallet(undefined, {
      authPass: process.env.BCHJSAUTHPASS_TEMP,
      restURL: process.env.BCHAPIURL
    })

    for (let i = 0; i < 5; i++) {
      const result = await wallet.getUtxos('bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d')
      console.log(`result ${i}: ${JSON.stringify(result, null, 2)}`)
    }
  } catch (err) {
    console.log('Error: ', err)
  }
}
startTest()

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/e2e/op-return.js`:

```js
/*
  This is a live test for broadcasting a transaction with an OP_RETURN output
  for memo.cash.
*/

// Global npm libraries

// Local libraries
const BchWallet = require('../../index')

// Get the WIF from the environment variable.
// Exit if one is not provided.
const WIF = process.env.WIF
if (!WIF) {
  console.log(
    'In order to OP_RETURN e2e tests, you must specify a WIF as an environment variable.'
  )
  process.exit(0)
}

const MSG =
  'This is a test with a really long OP_RETURN. Let us see if this goes through. some more stuff.'

describe('OP_RETURN E2E Tests', () => {
  let wallet

  before(async () => {
    wallet = new BchWallet(WIF)

    await wallet.walletInfoPromise
    // console.log('wallet.utxos.utxoStore: ', wallet.utxos.utxoStore)
  })

  beforeEach(async () => {
    await wallet.bchjs.Util.sleep(1000)

    await wallet.getUtxos()
  })

  describe('Simple usage', () => {
    it('should post a simple memo.cash transaction', async () => {
      const txid = await wallet.sendOpReturn(MSG)

      console.log('txid: ', txid)
      console.log(`https://blockchair.com/bitcoin-cash/transaction/${txid}`)
    })
  })

  // These tests are useful for assessing fees and reliabilty.
  describe('Min & Max OP_RETURN size', () => {
    it('should post a memo.cash transaction using the maximum OP_RETURN size limit', async () => {
      let msg = '01234567890123456789012345678901234567890123456789'
      msg += '01234567890123456789012345678901234567890123456789'
      msg += '01234567890123456789012345678901234567890123456789'
      msg += '01234567890123456789012345678901234567890123456789'
      msg += '01234567890123456'

      const txid = await wallet.sendOpReturn(msg)

      console.log('txid: ', txid)
      console.log(`https://blockchair.com/bitcoin-cash/transaction/${txid}`)
    })

    it('should post an OP_RETURN tx with minimum OP_RETURN size', async () => {
      const txid = await wallet.sendOpReturn('', '')

      console.log('txid: ', txid)
      console.log(`https://blockchair.com/bitcoin-cash/transaction/${txid}`)
    })
  })
})

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/e2e/consolidate-utxos-e2e.js`:

```js
/*
  This is e2e test that exercises the consolidateUtxos() function.

  It is assumed that you prep the wallet with UTXOs before executing this script.
*/

// Local libraries
const SlpWallet = require('../../index.js')

const mnemonic = 'vital man apology edge load license rubber whip blue menu lens alarm'
// KycKzy9fRPvoVr5zJQSyrYdCqeNvTdj7JdbyZnRirvyf3KoouKDq
// bitcoincash:qq2tk7vedkp5hj3smpmz6let49q9u4wu9ga9tmyfcc

// Top-level function for this test.
async function testOptimization () {
  try {
    const wallet = new SlpWallet(mnemonic, { interface: 'consumer-api' })

    const result = await wallet.optimize()
    console.log('result: ', result)
  } catch (err) {
    console.error('Error in testOptimization(): ', err)
  }
}
testOptimization()

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/integration/tokens.integration.test.js`:

```js
/*
  Integration tests for the tokens.js library
*/

const assert = require('chai').assert
const BCHJS = require('@psf/bch-js')

const Tokens = require('../../lib/tokens')
const AdapterRouter = require('../../lib/adapters/router')
let uut

describe('#tokens.js', () => {
  beforeEach(() => {
    const config = {
      restURL: 'https://bchn.fullstack.cash/v5/'
    }
    const bchjs = new BCHJS(config)
    config.bchjs = bchjs
    config.ar = new AdapterRouter(config)
    uut = new Tokens(config)
  })

  describe('#listTokensFromAddress', () => {
    it('should return tokens held by an address', async () => {
      const addr = 'simpleledger:qqmjqwsplscmx0aet355p4l0j8q74thv7vf5epph4z'

      const tokenInfo = await uut.listTokensFromAddress(addr)
      console.log(`tokenInfo: ${JSON.stringify(tokenInfo, null, 2)}`)

      assert.isArray(tokenInfo)

      assert.property(tokenInfo[0], 'tokenId')
      assert.property(tokenInfo[0], 'ticker')
      assert.property(tokenInfo[0], 'name')
      assert.property(tokenInfo[0], 'decimals')
      assert.property(tokenInfo[0], 'tokenType')
      assert.property(tokenInfo[0], 'url')
      assert.property(tokenInfo[0], 'qty')
    })

    it('should return info on NFTs', async () => {
      const addr = 'bitcoincash:qzjs5l0a3gvmfuqw9szs4glzpf4j63jjkvfj9hqedl'

      const tokenInfo = await uut.listTokensFromAddress(addr)
      console.log(`tokenInfo: ${JSON.stringify(tokenInfo, null, 2)}`)

      assert.equal(tokenInfo[0].tokenType, 65)
    })
  })

  describe('#getTokenBalance', () => {
    it('should get the token balance for a wallet', async () => {
      const addr = 'simpleledger:qqmjqwsplscmx0aet355p4l0j8q74thv7vf5epph4z'
      const tokenId = 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'

      const tokenBalance = await uut.getTokenBalance(tokenId, addr)
      console.log(`tokenBalance: ${JSON.stringify(tokenBalance, null, 2)}`)

      assert.isAbove(tokenBalance, 0)
    })
  })
})

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/integration/router.integration.js`:

```js
/*
  Integration tests for the router.js file. These tests ensure that the
  same data is retrurned, regardless of which source it comes from.
*/

// Global npm libraries
const assert = require('chai').assert
const BCHJS = require('@psf/bch-js')

// Local libraries
const Router = require('../../lib/adapters/router')

// const restURL = 'http://localhost:5005'
// const restURL = 'https://free-bch.fullstack.cash'
const restURL = 'https://dev-consumer.psfoundation.info'

describe('#router.js', () => {
  let uut

  beforeEach(() => {
    // const bchjs = new BCHJS({ restURL: 'http://localhost:3000/v5/' })
    const bchjs = new BCHJS()
    uut = new Router({ bchjs })
  })

  describe('#getBalances', () => {
    it('should get a balance from bch-js', async () => {
      const addr = 'bitcoincash:qrl2nlsaayk6ekxn80pq0ks32dya8xfclyktem2mqj'

      const result = await uut.getBalance(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.success, true)
      assert.property(result.balance, 'confirmed')
      assert.property(result.balance, 'unconfirmed')
    })

    it('should get a balance from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new Router({ bchjs, interface: 'consumer-api', restURL })

      const addr = 'bitcoincash:qrl2nlsaayk6ekxn80pq0ks32dya8xfclyktem2mqj'

      const result = await uut.getBalance(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.success, true)
      assert.property(result.balance, 'confirmed')
      assert.property(result.balance, 'unconfirmed')
    })
  })
  //
  // describe('#getUtxos', () => {
  //   it('should get UTXOs from bch-js', async () => {
  //     const addr = 'bitcoincash:qrl2nlsaayk6ekxn80pq0ks32dya8xfclyktem2mqj'
  //
  //     const result = await uut.getUtxos(addr)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.equal(result.address, addr)
  //     assert.property(result, 'bchUtxos')
  //     assert.property(result, 'slpUtxos')
  //   })
  //
  //   it('should get UTXOs from bch-consumer', async () => {
  //     const bchjs = new BCHJS()
  //     uut = new Router({ bchjs, interface: 'consumer-api', restURL })
  //
  //     const addr = 'bitcoincash:qrl2nlsaayk6ekxn80pq0ks32dya8xfclyktem2mqj'
  //
  //     const result = await uut.getUtxos(addr)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.equal(result.address, addr)
  //     assert.property(result, 'bchUtxos')
  //     assert.property(result, 'slpUtxos')
  //   })
  // })
  //
  // describe('#getTransactions', () => {
  //   it('should get a transaction history from bch-js', async () => {
  //     const addr = 'bitcoincash:qrl2nlsaayk6ekxn80pq0ks32dya8xfclyktem2mqj'
  //
  //     const result = await uut.getTransactions(addr)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.equal(result.success, true)
  //     assert.property(result.transactions[0], 'height')
  //     assert.property(result.transactions[0], 'tx_hash')
  //   })
  //
  //   it('should get a transaction history from bch-consumer', async () => {
  //     const bchjs = new BCHJS()
  //     uut = new Router({ bchjs, interface: 'consumer-api', restURL })
  //
  //     const addr = 'bitcoincash:qrl2nlsaayk6ekxn80pq0ks32dya8xfclyktem2mqj'
  //
  //     const result = await uut.getTransactions(addr)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.equal(result.success, true)
  //     assert.property(result.transactions[0], 'height')
  //     assert.property(result.transactions[0], 'tx_hash')
  //   })
  // })
  //
  // describe('#sendTx', () => {
  //   it('should send a tx through bch-js', async () => {
  //     try {
  //       const hex =
  //         '01000000013ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a000000006a4730440220540986d1c58d6e76f8f05501c520c38ce55393d0ed7ed3c3a82c69af04221232022058ea43ed6c05fec0eccce749a63332ed4525460105346f11108b9c26df93cd72012103083dfc5a0254613941ddc91af39ff90cd711cdcde03a87b144b883b524660c39ffffffff01807c814a000000001976a914d7e7c4e0b70eaa67ceff9d2823d1bbb9f6df9a5188ac00000000'
  //
  //       await uut.sendTx(hex)
  //       // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //       assert.fail('Unexpected code path')
  //     } catch (err) {
  //       assert.include(err.message, 'Missing inputs')
  //     }
  //   })
  //
  //   it('should send a tx through bch-consumer', async () => {
  //     try {
  //       const bchjs = new BCHJS()
  //       uut = new Router({ bchjs, interface: 'consumer-api', restURL })
  //
  //       const hex =
  //         '01000000013ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a000000006a4730440220540986d1c58d6e76f8f05501c520c38ce55393d0ed7ed3c3a82c69af04221232022058ea43ed6c05fec0eccce749a63332ed4525460105346f11108b9c26df93cd72012103083dfc5a0254613941ddc91af39ff90cd711cdcde03a87b144b883b524660c39ffffffff01807c814a000000001976a914d7e7c4e0b70eaa67ceff9d2823d1bbb9f6df9a5188ac00000000'
  //
  //       await uut.sendTx(hex)
  //
  //       assert.fail('Unexpected code path')
  //     } catch (err) {
  //       assert.include(err.message, 'Missing inputs')
  //     }
  //   })
  // })
  //
  // describe('#getUsd', () => {
  //   it('should get USD price from bch-js', async () => {
  //     const result = await uut.getUsd()
  //     // console.log('result: ', result)
  //
  //     assert.isAbove(result, 0)
  //   })
  //
  //   it('should get USD price from bch-consumer', async () => {
  //     const bchjs = new BCHJS()
  //     uut = new Router({ bchjs, interface: 'consumer-api', restURL })
  //
  //     const result = await uut.getUsd()
  //     // console.log('result: ', result)
  //
  //     assert.isAbove(result, 0)
  //   })
  // })
  //
  // describe('#getTxData', () => {
  //   it('should get a TX data from bch-js', async () => {
  //     const txids = [
  //       '01517ff1587fa5ffe6f5eb91c99cf3f2d22330cd7ee847e928ce90ca95bf781b'
  //     ]
  //
  //     const result = await uut.getTxData(txids)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.isArray(result)
  //     assert.equal(result.length, 1)
  //     assert.equal(result[0].txid, txids[0])
  //   })
  //
  //   it('should get TX data from bch-consumer', async () => {
  //     const bchjs = new BCHJS()
  //     uut = new Router({ bchjs, interface: 'consumer-api', restURL })
  //
  //     const txids = [
  //       '5f31905f335fa932879c5aabfd1c14ac748f6696148bd300f845ea5016ad573e'
  //     ]
  //
  //     const result = await uut.getTxData(txids, true)
  //     console.log('result: ', result)
  //
  //     assert.isArray(result)
  //     assert.equal(result.length, 1)
  //     assert.equal(result[0].txid, txids[0])
  //   })
  // })
  //
  // describe('#utxoIsValid', async () => {
  //   it('should validate UTXO from bch-js', async () => {
  //     const utxo = {
  //       tx_hash: 'a2059b1321e96a90a386894a68fa5829756118895b3cdb9a0393d94fd2ceed93',
  //       tx_pos: 0
  //     }
  //
  //     const result = await uut.utxoIsValid(utxo)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.equal(result, true)
  //   })
  //
  //   it('should validate UTXO from bch-consumer', async () => {
  //     const bchjs = new BCHJS()
  //     uut = new Router({ bchjs, interface: 'consumer-api', restURL })
  //
  //     const utxo = {
  //       tx_hash: 'a2059b1321e96a90a386894a68fa5829756118895b3cdb9a0393d94fd2ceed93',
  //       tx_pos: 0
  //     }
  //
  //     const result = await uut.utxoIsValid(utxo)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.equal(result, true)
  //   })
  // })
  //
  // describe('#getTokenData', async () => {
  //   it('should get token data from bch-js', async () => {
  //     const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'
  //
  //     const result = await uut.getTokenData(tokenId)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'genesisData')
  //     assert.property(result, 'immutableData')
  //     assert.property(result, 'mutableData')
  //   })
  //
  //   it('should get token data from web 3 infra', async () => {
  //     const bchjs = new BCHJS()
  //     uut = new Router({ bchjs, interface: 'consumer-api', restURL })
  //
  //     const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'
  //
  //     const result = await uut.getTokenData(tokenId)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.property(result, 'genesisData')
  //     assert.property(result, 'immutableData')
  //     assert.property(result, 'mutableData')
  //   })
  //
  //   it('should get token data with TX history from web 2', async () => {
  //     const tokenId = '43eddfb11c9941edffb8c8815574bb0a43969a7b1de39ad14cd043eaa24fd38d'
  //
  //     const result = await uut.getTokenData(tokenId, true)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.isArray(result.genesisData.txs)
  //   })
  //
  //   it('should get token data with TX history from web 3', async () => {
  //     const bchjs = new BCHJS()
  //     uut = new Router({ bchjs, interface: 'consumer-api', restURL })
  //
  //     const tokenId = '43eddfb11c9941edffb8c8815574bb0a43969a7b1de39ad14cd043eaa24fd38d'
  //
  //     const result = await uut.getTokenData(tokenId, true)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.isArray(result.genesisData.txs)
  //   })
  //
  //   it('should return token txs in ascending order from bch-consumer', async () => {
  //     const bchjs = new BCHJS()
  //     uut = new Router({ bchjs, interface: 'consumer-api', restURL })
  //
  //     const tokenId =
  //       '5f31905f335fa932879c5aabfd1c14ac748f6696148bd300f845ea5016ad573e'
  //
  //     const result = await uut.getTokenData(tokenId, true)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     const firstHeight = result.genesisData.txs[0].height
  //     const lastTx = result.genesisData.txs.length - 1
  //     const lastHeight = result.genesisData.txs[lastTx].height
  //
  //     assert.isAbove(lastHeight, firstHeight)
  //   })
  //
  //   it('should return token txs in ascending order from bch-js', async () => {
  //     // const bchjs = new BCHJS()
  //     // uut = new Router({ bchjs, interface: 'consumer-api', restURL })
  //
  //     const tokenId =
  //       '5f31905f335fa932879c5aabfd1c14ac748f6696148bd300f845ea5016ad573e'
  //
  //     const result = await uut.getTokenData(tokenId, true)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     const firstHeight = result.genesisData.txs[0].height
  //     const lastTx = result.genesisData.txs.length - 1
  //     const lastHeight = result.genesisData.txs[lastTx].height
  //
  //     assert.isAbove(lastHeight, firstHeight)
  //   })
  //
  //   it('should return token txs in ascending order from bch-consumer', async () => {
  //     const bchjs = new BCHJS()
  //     uut = new Router({ bchjs, interface: 'consumer-api', restURL })
  //
  //     const tokenId =
  //       '5f31905f335fa932879c5aabfd1c14ac748f6696148bd300f845ea5016ad573e'
  //
  //     const result = await uut.getTokenData(tokenId, true, 'ASCENDING')
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     const firstHeight = result.genesisData.txs[0].height
  //     const lastTx = result.genesisData.txs.length - 1
  //     const lastHeight = result.genesisData.txs[lastTx].height
  //
  //     assert.isAbove(lastHeight, firstHeight)
  //   })
  //
  //   it('should return token txs in ascending order from bch-js', async () => {
  //     // const bchjs = new BCHJS()
  //     // uut = new Router({ bchjs, interface: 'consumer-api', restURL })
  //
  //     const tokenId =
  //       '5f31905f335fa932879c5aabfd1c14ac748f6696148bd300f845ea5016ad573e'
  //
  //     const result = await uut.getTokenData(tokenId, true, 'ASCENDING')
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     const firstHeight = result.genesisData.txs[0].height
  //     const lastTx = result.genesisData.txs.length - 1
  //     const lastHeight = result.genesisData.txs[lastTx].height
  //
  //     assert.isAbove(lastHeight, firstHeight)
  //   })
  // })
  //
  // describe('#getPubKey', () => {
  //   it('should return pubkey from bch-js', async () => {
  //     const addr =
  //       'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'
  //
  //     const result = await uut.getPubKey(addr)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.isString(result)
  //   })
  //
  //   it('should return pubkey from bch-consumer', async () => {
  //     const bchjs = new BCHJS()
  //     uut = new Router({ bchjs, interface: 'consumer-api', restURL })
  //
  //     const addr =
  //       'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'
  //
  //     const result = await uut.getPubKey(addr)
  //     // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  //
  //     assert.isString(result)
  //   })
  //
  //   it('should handle address without a pubkey from bch-js', async () => {
  //     try {
  //       const addr =
  //         'bitcoincash:qzxeg2p27ls5mkgcy56spadfydau0cyk0y4g90sgtl'
  //
  //       await uut.getPubKey(addr)
  //
  //       assert.fail('Unexpected code path')
  //     } catch (err) {
  //       // console.log('err: ', err)
  //       assert.include(err.message, 'No transaction history')
  //     }
  //   })
  //
  //   it('should handle address without a pubkey from bch-consumer', async () => {
  //     const bchjs = new BCHJS()
  //     uut = new Router({ bchjs, interface: 'consumer-api', restURL })
  //
  //     try {
  //       const addr =
  //         'bitcoincash:qzxeg2p27ls5mkgcy56spadfydau0cyk0y4g90sgtl'
  //
  //       await uut.getPubKey(addr)
  //
  //       assert.fail('Unexpected code path')
  //     } catch (err) {
  //       // console.log('err: ', err)
  //       assert.include(err.message, 'No transaction history')
  //     }
  //   })
  // })
  //
  // describe('#getPsfWritePrice', () => {
  //   it('should get getPsfWritePrice price from bch-js', async () => {
  //     const result = await uut.getPsfWritePrice()
  //     console.log('result: ', result)
  //
  //     assert.isNumber(result)
  //   })
  //
  //   it('should get getPsfWritePrice price from bch-consumer', async () => {
  //     const bchjs = new BCHJS()
  //     uut = new Router({ bchjs, interface: 'consumer-api', restURL })
  //
  //     const result = await uut.getPsfWritePrice()
  //     // console.log('result: ', result)
  //
  //     assert.isNumber(result)
  //   })
  // })

  describe('#cid2json', () => {
    it('should convert a CID to a JSON object from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new Router({ bchjs, interface: 'consumer-api', restURL })

      // const cid = 'bafkreigbgrvpagnmrqz2vhofifrqobigsxkdvnvikf5iqrkrbwrzirazhm'
      const cid = 'bafybeihm637ky2kpuucvmtyoh4ulpelxhpo3fffmu6cb6ci6jchdztrqxm'

      const result = await uut.cid2json({ cid })
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.property(result, 'json')

      assert.equal(result.success, true)
    })
  })
})

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/integration/op-return.integration.js`:

```js
/*
  Integration tests for the op-return.js library.

  In order to run these tests, the WIF below must control a UTXO for paying
  transaciton fees. No transaction will be broadcast, but it needs UTXOs to
  work with.
*/

// public npm libraries
const assert = require('chai').assert
const BCHJS = require('@psf/bch-js')
const bchjs = new BCHJS()

// local libraries
const BchWallet = require('../../index')

// constants
const WIF = 'L1tcvcqa5PztqqDH4ZEcUmHA9aSHhTau5E2Zwp1xEK5CrKBrjP3m'
// BCH Address: bitcoincash:qqkg30ryje97al52htqwvveha538y7gttywut3cdqv

const bchUtxos = [
  {
    height: 725735,
    tx_hash: '8ff0152ad9aa88a4e747d47666e32e95e5144ee1ea9b7312fd471774a30e7027',
    tx_pos: 3,
    value: 353421,
    txid: '8ff0152ad9aa88a4e747d47666e32e95e5144ee1ea9b7312fd471774a30e7027',
    vout: 3,
    address: 'bitcoincash:qzz597tw8ya9m6za056lrvd8f37d02s6puzd3426za',
    isSlp: false
  }
]

describe('#op-return', () => {
  let wallet

  beforeEach(async () => {
    wallet = new BchWallet(WIF, { noUpdate: true })

    // await wallet.walletInfoPromise
  })

  describe('#createTransaction', () => {
    it('should create a memo tx by default', async () => {
      const { hex, txid } = await wallet.opReturn.createTransaction(
        wallet.walletInfo,
        bchUtxos,
        'This is a test message'
      )

      assert.isString(hex)
      assert.isString(txid)

      const txData = await bchjs.RawTransactions.decodeRawTransaction(hex)
      // console.log('txData: ', txData)
      // console.log(`txData.vout[0]: ${JSON.stringify(txData.vout[0], null, 2)}`)

      // Assert expected prefix exists.
      assert.include(txData.vout[0].scriptPubKey.asm, ' 621 ')
    })

    it('should use an arbitrary prefix', async () => {
      const { hex, txid } = await wallet.opReturn.createTransaction(
        wallet.walletInfo,
        bchUtxos,
        'This is a test message',
        'ffff'
      )
      // console.log('hex: ', hex)
      // console.log('txid: ', txid)

      assert.isString(hex)
      assert.isString(txid)

      const txData = await bchjs.RawTransactions.decodeRawTransaction(hex)
      // console.log('txData: ', txData)
      // console.log(`txData.vout[0]: ${JSON.stringify(txData.vout[0], null, 2)}`)

      // Assert expected prefix exists.
      assert.include(txData.vout[0].scriptPubKey.asm, ' -32767 ')
    })
  })
})

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/integration/utxos.integration.test.js`:

```js
/*
  Integration tests for the utxos.js library
*/

const assert = require('chai').assert
const BCHJS = require('@psf/bch-js')

const AdapterRouter = require('../../lib/adapters/router')
const UTXOs = require('../../lib/utxos')
let uut

describe('#UTXOs', () => {
  beforeEach(() => {
    const config = {
      restURL: 'https://bchn.fullstack.cash/v5/'
    }

    const bchjs = new BCHJS(config)
    config.bchjs = bchjs

    config.ar = new AdapterRouter(config)
    uut = new UTXOs(config)
  })

  describe('#initUtxoStore', () => {
    it('should initialize and return the utxoStore from bchn.fullstack.cash', async () => {
      const addr = 'bitcoincash:qqaqa62t2uhv9cl6ze3appmvy3tnz8kyvyd54cex00'

      const result = await uut.initUtxoStore(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'address')
      assert.property(result, 'bchUtxos')
      assert.property(result, 'nullUtxos')
      assert.property(result, 'slpUtxos')
    })

    it('should initialize and return the utxoStore using web 3', async () => {
      // Re-initialize UUT for using web 3 infra.
      const bchjs = new BCHJS()
      const config = {
        bchjs,
        interface: 'consumer-api',
        restURL: 'https://free-bch.fullstack.cash'
      }
      config.ar = new AdapterRouter(config)
      uut = new UTXOs(config)

      const addr = 'bitcoincash:qqaqa62t2uhv9cl6ze3appmvy3tnz8kyvyd54cex00'

      const result = await uut.initUtxoStore(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'address')
      assert.property(result, 'bchUtxos')
      assert.property(result, 'nullUtxos')
      assert.property(result, 'slpUtxos')
    })
  })
})

```

`/home/trout/work/psf/code/minimal-slp-wallet/test/integration/index.integration.test.js`:

```js
/*
  Integration tests for the top-level index.js library.
*/

// Public npm libraries.
const assert = require('chai').assert

// Local libraries
const BchWallet = require('../../index')

const restURL = 'https://free-bch.fullstack.cash'

describe('#BchWallet', () => {
  let uut

  beforeEach(() => {
    uut = new BchWallet()
  })

  describe('#constructor', () => {
    it('should create a wallet with no input variables', async () => {
      uut = new BchWallet()
      await uut.walletInfoPromise

      assert.include(uut.walletInfo.cashAddress, 'bitcoincash:')
    })

    it('should create a wallet with a prior mnemonic', async () => {
      const mnemonic =
        'van human plastic grain brick hill bus twist sister bachelor near fabric'

      uut = new BchWallet(mnemonic)
      await uut.walletInfoPromise

      assert.include(
        uut.walletInfo.cashAddress,
        'bitcoincash:qpc7ufrzcm9ctylx6dsjwje8wx8gjdhghqn74rmmez'
      )
    })
  })

  describe('#create', () => {
    it('should create a wallet with a prior mnemonic', async () => {
      const mnemonic =
        'van human plastic grain brick hill bus twist sister bachelor near fabric'

      const walletPromise = await uut.create(mnemonic)
      // console.log(`walletPromise: ${JSON.stringify(walletPromise, null, 2)}`)

      assert.include(
        walletPromise.cashAddress,
        'bitcoincash:qpc7ufrzcm9ctylx6dsjwje8wx8gjdhghqn74rmmez'
      )
    })

    it('should create a wallet with a private key', async () => {
      const wif = 'KyGrqLtG5PLf97Lu6RXDMGKg6YbcmRKCemgoiufFXPmvQWyvThvE'

      const walletPromise = await uut.create(wif)
      // console.log(`walletPromise: ${JSON.stringify(walletPromise, null, 2)}`)

      assert.include(
        walletPromise.cashAddress,
        'bitcoincash:qpkjakz70s2xrkjpfn6tyzcnuxkyjdsa3ug45pw27y'
      )
    })
  })

  describe('#getBalance', () => {
    it('should get the balance for an address', async () => {
      const addr = 'bitcoincash:qqh793x9au6ehvh7r2zflzguanlme760wuzehgzjh9'
      const result = await uut.getBalance(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`);

      assert.isAbove(result, 546)
    })
  })

  describe('#utxoIsValid', () => {
    it('should return true for valid UTXO using fullstack interface', async () => {
      const utxo = {
        txid: '53d24b3a0388c6a410745d58d2172e65eaa24cbc074c0c420292887284d7723b',
        vout: 0
      }

      const result = await uut.utxoIsValid(utxo)

      assert.equal(result, true)
    })

    it('should return true for valid UTXO using consumer-api interface', async () => {
      uut = new BchWallet(undefined, { interface: 'consumer-api', restURL })

      const utxo = {
        txid: '53d24b3a0388c6a410745d58d2172e65eaa24cbc074c0c420292887284d7723b',
        vout: 0
      }

      const result = await uut.utxoIsValid(utxo)

      assert.equal(result, true)
    })

    it('should return false for invalid UTXO using fullstack interface', async () => {
      const utxo = {
        txid: '17754221b29f189532d4fc2ae89fb467ad2dede30fdec4854eb2129b3ba90d7a',
        vout: 0
      }

      const result = await uut.utxoIsValid(utxo)

      assert.equal(result, false)
    })

    it('should return true for valid UTXO using consumer-api interface', async () => {
      uut = new BchWallet(undefined, { interface: 'consumer-api', restURL, noUpdate: true })

      const utxo = {
        txid: '17754221b29f189532d4fc2ae89fb467ad2dede30fdec4854eb2129b3ba90d7a',
        vout: 0
      }

      const result = await uut.utxoIsValid(utxo)

      assert.equal(result, false)
    })
  })

  describe('#getTokenData', () => {
    // CT 5/17/23 Disabling this test. There is an internal issue with bch-api
    // which causes this test to fail. When bch-api internally tries to retrieve
    // the mutable token data, it hits a rate limit.
    // it('should get token data from fullstack.cash', async () => {
    //   const tokenId = 'f212a3ab2141dcd34f7e800253f1a61344523e6886fdfa2421bbedf3aa52617a'

    //   const result = await uut.getTokenData(tokenId)
    //   console.log('result: ', result)

    //   assert.include(result.immutableData, 'ipfs')
    //   assert.include(result.mutableData, 'ipfs')
    // })

    it('should get token data from free-bch', async () => {
      uut = new BchWallet(undefined, { interface: 'consumer-api', restURL, noUpdate: true })

      const tokenId = 'f212a3ab2141dcd34f7e800253f1a61344523e6886fdfa2421bbedf3aa52617a'

      const result = await uut.getTokenData(tokenId)
      // console.log('result: ', result)

      assert.include(result.immutableData, 'ipfs')
      assert.include(result.mutableData, 'ipfs')
    })
  })

  describe('#getTokenData2', () => {
    it('should get token data from fullstack.cash', async () => {
      const tokenId = 'b93137050d6a6dcdba12432f018660541ffb4b457bf4020258272632c13e92d9'

      const result = await uut.getTokenData2(tokenId)
      console.log('result: ', result)

      assert.property(result, 'tokenIcon')
      assert.property(result, 'tokenStats')
      assert.property(result, 'optimizedTokenIcon')
      assert.property(result, 'iconRepoCompatible')
      assert.property(result, 'ps002Compatible')
    })

    // it('should get token data from free-bch', async () => {
    //   uut = new BchWallet(undefined, { interface: 'consumer-api', restURL, noUpdate: true })
    //
    //   const tokenId = 'eb93f05553ff088bffb0ec687519e83c59e5108c160f7c25a4b6c45109d7e40b'
    //
    //   const result = await uut.getTokenData(tokenId)
    //   // console.log('result: ', result)
    //
    //   assert.include(result.immutableData, 'ipfs')
    //   assert.include(result.mutableData, 'ipfs')
    // })
  })

  describe('#getTransactions', () => {
    it('should sort descending by default from bch-js', async () => {
      const addr = 'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'

      const result = await uut.getTransactions(addr)
      // console.log('result: ', result)
      // console.log(`result[0].height: ${result[0].height}, result[40].height: ${result[40].height}`)

      assert.isAbove(result[0].height, result[40].height)
    })

    it('should sort descending by default from consumer-api', async () => {
      uut = new BchWallet(undefined, { interface: 'consumer-api', restURL, noUpdate: true })

      const addr = 'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'

      const result = await uut.getTransactions(addr)
      // console.log('result: ', result)
      // console.log(`result[0]: ${JSON.stringify(result[0])}, result[40]: ${JSON.stringify(result[40])}`)

      assert.isAbove(result[0].height, result[40].height)
    })

    it('should sort ascending from bch-js', async () => {
      const addr = 'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'

      const result = await uut.getTransactions(addr, 'ASCENDING')
      // console.log('result: ', result)
      // console.log(`result[0].height: ${result[0].height}, result[40].height: ${result[40].height}`)

      assert.isAbove(result[40].height, result[0].height)
    })

    it('should sort ascending by default from consumer-api', async () => {
      uut = new BchWallet(undefined, { interface: 'consumer-api', restURL, noUpdate: true })

      const addr = 'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'

      const result = await uut.getTransactions(addr, 'ASCENDING')
      // console.log('result: ', result)
      // console.log(`result[0]: ${JSON.stringify(result[0])}, result[40]: ${JSON.stringify(result[40])}`)

      assert.isAbove(result[40].height, result[0].height)
    })
  })
})

```

`/home/trout/work/psf/code/minimal-slp-wallet/README.md`:

```md
# minimal-slp-wallet

This is a minimalist Bitcoin Cash (BCH) wallet 'engine' for use with front end web apps. It contains all the core functionality needed by a wallet:

- Create a new BCH wallet, import a mnemonic, or import a private key (WIF)
- Encrypt a wallets mnemonic for safe storage
- Send and receive BCH
- Send and receive SLP tokens
- Get balances and UTXOs
- Retrieve transaction history & transaction details
- Burn tokens
- Price BCH in USD
- Send messages on the blockchain via OP_RETURN data
- Verify that a UTXO is unspent
- Get token icons and other media associated with a token

It is 'token aware' and can work with all SLP tokens, including NFTs. It can interface with Web 2 infrastructure like [FullStack.cash](https://fullstack.cash) or with the [Cash Stack Web 3 infrastructure](https://cashstack.info) via the [bch-consumer library](https://www.npmjs.com/package/bch-consumer).

This target consumers for this library is:

- [bch-wallet-web3-android](https://permissionless-software-foundation.github.io/bch-wallet-web3-android/) Bitcoin Cash wallet app that runs on Web and Android.
- [psf-bch-wallet](https://github.com/Permissionless-Software-Foundation/psf-bch-wallet) command line wallet.

The default derivation path for the wallet keypair is `m/44'/245'/0'/0/0`. This is the BIP44 standard for SLP token-aware BCH wallets.

## Examples

The [examples](./examples) directory shows how to write node.js JavaScript apps that use this library to work with BCH:

- [Create a wallet](./examples/create-wallet.js)
- [Send BCH](./examples/send-bch.js)
- [List Tokens](./examples/list-tokens.js)
- [Send Tokens](./examples/send-tokens.js)

## How to use it?

### Browser

#### Add to your HTML scripts

```js
<script src="https://unpkg.com/minimal-slp-wallet"></script>
```

This will load the wallet into `window.SlpAddress`

#### Node.js

```bash
npm install minimal-slp-wallet --save
```

```js
// ESM
import BchWallet from 'minimal-slp-wallet'

// CommonJS
const BchWallet = require('minimal-slp-wallet')
```

### Instantiate Library

The wallet has different configuration parameters, that allow it to use web2 or web3 infrastructure. After instantiating a class, two Promises should be awaited:

- `await bchWallet.walletInfoPromise` will resolve when the BCH has been fully created. It only takes a few microseconds. Once resolves, the object `bchWallet.walletInfo` will contain all the wallet information.
- `await bchWallet.initialize()` will reach out to the blockchain and initialize the wallet by fetching its balance, tokens, and UTXO information. This is not necessary to call when creating a new wallet without a transaction history.

#### Using Web 2 Infrastructure

```js
const BchWallet = require('minimal-slp-wallet')

const bchWallet = new BchWallet(undefined, {
  interface: 'rest-api',
  restURL: 'https://api.fullstack.cash/v5/'
})
await bchWallet.initialize()
```

#### Using Web 3 Interface

```js
const BchWallet = require('minimal-slp-wallet')

const bchWallet = new BchWallet(undefined, {
  interface: 'consumer-api',
  restURL: 'https://free-bch.fullstack.cash'
  // Connect to your own instance of ipfs-bch-wallet-consumer:
  // restURL: 'http://localhost:5005'
})
await bchWallet.initialize()
```

### Create new wallets

```js
const bchWallet = new BchWallet()
await bchWallet.walletInfoPromise // Wait for wallet to be created.

// 12 words seed phrase for the wallet
console.log(bchWallet.walletInfo.mnemonic)

// cash address derived from the seed (derivation path: m/44'/245'/0'/0/0)
console.log(bchWallet.walletInfo.cashAddress)

// legacy address derived from the seed (derivation path: m/44'/245'/0'/0/0)
console.log(bchWallet.walletInfo.legacyAddress)

// private key for the BCH address derived from the seed (derivation path: m/44'/245'/0'/0/0)
console.log(bchWallet.walletInfo.privateKey)
```

### Mnemonic encryption

```js
const bchWallet = new BchWallet(null, {
  password: 'myStrongPassword'
})

// 12 words seed phrase for the wallet
console.log(bchWallet.walletInfo.mnemonic)

// encrypted mnemonic
console.log(bchWallet.walletInfo.mnemonicEncrypted)

const bchWallet2 = new BchWallet(bchWallet.walletInfo.mnemonicEncrypted, {
  password: 'myStrongPassword'
})

// decrypted mnemonic
console.log(bchWallet2.walletInfo.mnemonic)
```

### Initialize wallet with mnemonic

```js
// initialize with 12 words seed phrase for the wallet
const bchWallet = new BchWallet(
  'minor bench until split suffer shine series bag avoid cruel orient aunt'
)

// initialize for specific HD derivation path
const bchWallet2 = new BchWallet(
  'minor bench until split suffer shine series bag avoid cruel orient aunt',
  {
    HdPath: "m/44'/245'/0'/1'"
  }
)
```

### Initialize wallet with private key
Private keys are in WIF format, and start with a capital 'K' or 'L'.

```js
const bchWallet = new BchWallet('L3BUek8oq1iijZTkfdRYo8RDxEe3PpB8MyJnh2FSGWAoCjAffQCp')
```

### Send transactions

You can send funds to other BCH wallets. You can distribute funds to N users by simply extending the receiver array.

```js
const bchWallet = new BchWallet()

const receivers = [
  {
    address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
    // amount in satoshis, 1 satoshi = 0.00000001 Bitcoin
    amountSat: 100000
  }
]

const txid = await bchWallet.send(receivers)

// Transaction ID
// you can then see the transaction in one of the explorers
// example: `https://explorer.bitcoin.com/bch/tx/${tx.txid}`;
console.log(txid)
```

### Send Tokens

You can send tokens in a similar way:

```js
const receiver = {
  address: 'simpleledger:qpeq7xx5x3a2jfa0x0w8cjqp4v9cm842vgsjqwzvfk',
  tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
  qty: 1.25
}

const txid = await bchWallet.sendTokens(receiver)

// Transaction ID
console.log(txid)
```

_Note:_ Only single token sends are supported at the moment. i.e. One token type
per receiver per transaction.

### Get Wallet Balance

Gets balance (confirmed + unconfirmed) for an BCH address

```js
// will get a balance for bchWallet.cashAddress
const myBalance = await bchWallet.getBalance()

// will get a balance for any address
const balanceOfOtherAddress = await bchWallet.getBalance({
  bchAddress: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h'
})
```

### List Tokens

List the SLP tokens held by an address.

```js
// will get token balance for bchWallet.cashAddress
const myBalance = await bchWallet.listTokens()

// will get a balance for any address
const balanceOfOtherAddress = await bchWallet.listTokens(
  'simpleledger:qpeq7xx5x3a2jfa0x0w8cjqp4v9cm842vgsjqwzvfk'
)
```

### Get Token Balance

Given a token ID, list the balance held by an address

```js
// Get the token balance for the wallet.
const myBalance = await bchWallet.getTokenBalance({
  tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
})

// Get a token balance for any address
const balanceOfOtherAddress = await bchWallet.getTokenBalance({
  tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
  slpAddress: 'simpleledger:qpeq7xx5x3a2jfa0x0w8cjqp4v9cm842vgsjqwzvfk'
})
```

### Get Token Data
Given a Token ID for an SLP token, retrieve data about the token. This includes mutable and immutable data using the [PS002 specification](https://github.com/Permissionless-Software-Foundation/specifications/blob/master/ps002-slp-mutable-data.md) which controls token icons and other metadata.

```js
const bchWallet = new BchWallet()

const tokenId = '59a62f35b0882b7c0ed80407d9190b460cc566cb6c01ed4817ad64f9d2508702'

const tokenData = await slpWallet.getTokenData(tokenId)
```

This function call can also retrieve the transaction history for a token. This is particularly useful for NFTs, for applications that need to find the current address holding the NFT.

`const tokenData = await slpWallet.getTokenData(tokenId, true)`

The TX history is sorted in descending order by default. It can be sorted in ascending order like this:

`const tokenData = await slpWallet.getTokenData(tokenId, true, 'ASCENDING')`

### Get Token Media
Given a Token ID for an SLP token, retrieve the token icon URL and other associated media. This includes mutable and immutable data using the [PS007 specification](https://github.com/Permissionless-Software-Foundation/specifications/blob/master/ps007-token-data-schema.md) which controls token icons and other metadata.

`getTokenData()` returns much faster, but the client has to lookup the data on IPFS. `getTokenData2()` has the server lookup the token data. This can sometimes be faster, or sometimes it can take several seconds.

```js
const bchWallet = new BchWallet()

const tokenId = '59a62f35b0882b7c0ed80407d9190b460cc566cb6c01ed4817ad64f9d2508702'

const tokenData = await slpWallet.getTokenData2(tokenId)
```

### Get Wallet Transaction History

Get an array of TXIDs of the transactions involving this wallet.

```js
// will get transaction history for bchWallet.cashAddress
const myTransactions = await bchWallet.getTransactions()

// will get transaction history for any address
const txHistoryOfOtherAddress = await bchWallet.getTransactions(
  'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h'
)
```

### Get Detailed Transaction Data

Get transactions details for an array of up to 20 TXIDs.

```js
// Input is an array of up to 20 TXIDs.
const txids = [
  '01517ff1587fa5ffe6f5eb91c99cf3f2d22330cd7ee847e928ce90ca95bf781b'
]

const result = await bchWallet.getTxData(txids)
```

### Get the Price of BCH in USD

```js
// Get the current spot price of BCH in USD
const result = await bchWallet.getUsd()
```

### Send Memo.cash TX with OP_RETURN Data

```js
// Write a small amount of text to the blockchain, compatible with memo.cash.
const result = await bchWallet.sendOpReturn('This is a memo.cash post.')
```

### Error Handling

```js
try {
  tx = await bchWallet.send([
    {
      address: 'bitcoincash:qrlhkg4d9z3y88j246a6482xzregxaxnfsagmd2kh3',
      amountSat: 1000
    }
  ])
} catch (err) {
  console.error(err)

  if (err.message && err.message.indexOf('Insufficient') > -1) {
    return alert('Insufficient balance on your BCH account.')
  }

  return alert('Error. Try again later.')
}
```

### Save keys in the browser

While developing BCH apps, remember to never send the private keys / mnemonic / seed phrase to your servers.

1. Your servers can be hacked
2. Depending on your jurisdiction you may not have the allowance to manage the funds of your users

```js
const bchWallet1 = new BchWallet()

// save the mnemonic for later
localStorage.setItem('BCH_MNEMONIC', bchWallet1.walletInfo.mnemonic)

// retrieve mnemonic to initialize the wallet
const bchWallet2 = new BchWallet(localStorage.getItem('BCH_MNEMONIC'))
```

### Validate a UTXO
In BCH applications, it's often necessary to validate if a UTXO is still alive and spendable, or if it's already been spent. This function returns true if the UTXO is still spendable, false if not.

```js
const utxo = {
  txid: 'b94e1ff82eb5781f98296f0af2488ff06202f12ee92b0175963b8dba688d1b40',
  vout: 0
}

const isValid = await bchWallet.utxoIsValid(utxo)
```

### Generate a Key Pair
If a wallet is generated from a 12-word mnemonic, it can generate a key pair from the HD wallet.

```js
const keyPair = await bchWallet.getKeyPair(5)
```

### Optimize Wallet
Every [UTXO](https://github.com/bitcoinbook/bitcoinbook/blob/develop/ch06.asciidoc#transaction-outputs-and-inputs) in the wallet results in an API call. Calling the `optimize()` function will consolidate the number of UTXOs in the wallet. This speeds up performance and leads to a better user experience overall.

```js
await bchWallet.optimize()
```

### Get a Public Key
If an address has made at least one send transaction, the it is possible to lookup the addresses public key from the blockchain. This public key can then be used to send encrypted messages to that address. If successful, this function will return a string that contains a hex-encoded public key.


```js
const addr = 'bitcoincash:...'
const pubKey = await bchWallet.getPubKey(addr)
```

### Get UTXOs for an Address
This function can retrieve the UTXOs controlled by the wallet:

```js
const utxos = await bchWallet.getUtxos()
```

Or the UTXOs held by another address can be retrieved:

```js
const utxos = await bchWallet.getUtxos('bitcoincash...')
```

### Broadcast a Transaction
If you have a hex-encoded transaction, you can broadcast it to the network:

```js
const hex = '0200...tx-in-hex-format'
const txid = await bchWallet.broadcast({hex})
console.log(txid)
```

### Get the PSF Write Price
This function retrieves the cost in PSF tokens to pin 1MB of content to the
decentralized PSFFPP IPFS pinning network. Find out more at [PSFFPP.com](https://psffpp.com).

```js
const price = await bchWallet.getPsfWritePrice()
console.log(price)
// 0.08335233
```

### Convert a CID to a JSON object
When using the `getTokenData()` the mutable and immutable token data is returned as an IPFS CID. The data is stored as a JSON file on the IPFS network. In that case, the JSON object can be retrieved from the CID.

```js
const cid = 'bafkreigbgrvpagnmrqz2vhofifrqobigsxkdvnvikf5iqrkrbwrzirazhm'
const json = await bchWallet.cid2json({ cid })
console.log(json)
/*
{
  "success":true,
  "json":{
    "schema":"1",
    "tokenIcon":"https://pin.fullstack.cash/ipfs/view/bafkreibmtefm7h75bre6fglddm3ehzev4kl4q2ohk2a2omv2pfmcmc3rpm",
    "fullSizedUrl":"https://pin.fullstack.cash/ipfs/view/bafkreibmtefm7h75bre6fglddm3ehzev4kl4q2ohk2a2omv2pfmcmc3rpm",
    "nsfw":false,
    "userData":{},
    "jsonLd":{},
    "about":"This Type 128 Group token controls a series of NFTs that represent edu..."
  }
}
*/
```

# Licence

[MIT](LICENSE.md)

```

`/home/trout/work/psf/code/minimal-slp-wallet/lib/consolidate-utxos.js`:

```js
/*
  This library is used to optimize a wallet by consolidating the UTXOs it
  controls. Reducing the number of UTXOs has a direct effect at the speed
  of API calls and a good user experience. More UTXOs means more API calls,
  which means it takes more time to do everything. Reducing the number of UTXOs
  improves the user exerience.

  The functions in this library scan a wallets UTXO collection and looks for
  opportunities to consolidate them.
*/

// Global npm libraries
const RetryQueue = require('@chris.troutner/retry-queue-commonjs')

class ConsolidateUtxos {
  constructor (wallet) {
    // Dependency injection.
    this.wallet = wallet
    if (!this.wallet) {
      throw new Error('Must pass an instance of the wallet.')
    }

    // Encapsulate dependencies
    this.bchjs = wallet.bchjs
    this.retryQueue = new RetryQueue({
      attempts: 3,
      retryPeriod: 1000
    })

    // Bind all subfunction to the 'this' object
    this.start = this.start.bind(this)
    this.consolidateTokenUtxos = this.consolidateTokenUtxos.bind(this)
    this.countTokenUtxos = this.countTokenUtxos.bind(this)
    this.updateUtxos = this.updateUtxos.bind(this)
    this.countBchUtxos = this.countBchUtxos.bind(this)
  }

  // This is the top-level function that orchestrates all other functions in
  // this library. When called it will scan the UTXOs in a wallet, looking for
  // opportunities to consolidate UTXOs. If the dryRun input is set to true,
  // then no transactions are broadcasted.
  async start (inObj = {}) {
    try {
      const outObj = {}

      // Extract input variables from the input object.
      const { dryRun } = inObj

      await this.retryQueue.addToQueue(this.updateUtxos, {})

      outObj.bchUtxoCnt = this.countBchUtxos()
      // console.log(`bchUtxoCnt: ${outObj.bchUtxoCnt}`)

      outObj.bchTxid = null // Initial value

      // Consolidate all BCH UTXOs if there is more than one
      if (outObj.bchUtxoCnt > 1 && !dryRun) {
        outObj.bchTxid = await this.retryQueue.addToQueue(this.wallet.sendAll, this.wallet.walletInfo.cashAddress)

        await this.bchjs.Util.sleep(3000)

        await this.retryQueue.addToQueue(this.updateUtxos, {})
      }

      outObj.tokenUtxos = this.countTokenUtxos()
      // console.log(`tokenUtxos: ${JSON.stringify(outObj.tokenUtxos, null, 2)}`)

      outObj.tokenTxids = [] // Initial value
      if (!dryRun) {
        outObj.tokenTxids = await this.retryQueue.addToQueue(this.consolidateTokenUtxos, outObj.tokenUtxos)
      }

      return outObj
    } catch (err) {
      console.error('Error in conslidate-utxos.js/start()')
      throw err
    }
  }

  // This function expects the output of countTokenUtxos() as its input: an
  // array of objects, with each object representing a token.
  // If the number of UTXOs associated with a token is greater than zero,
  // the a transaction is broadcast to send the tokens back to the wallet, which
  // will consolidate all the token UTXOs.
  // It returns an array of TXIDs for any tokens that are consolidated.
  async consolidateTokenUtxos (tokenUtxos) {
    const tokenTxids = []

    for (let i = 0; i < tokenUtxos.length; i++) {
      const thisToken = tokenUtxos[i]

      if (thisToken.utxos.length > 1) {
        const receiver = {
          address: this.wallet.walletInfo.cashAddress,
          tokenId: thisToken.tokenId,
          qty: thisToken.qty
        }

        const txid = await this.wallet.sendTokens(receiver)
        tokenTxids.push(txid)

        await this.bchjs.Util.sleep(3000)

        await this.updateUtxos()
      }
    }

    return tokenTxids
  }

  // This function returns an array of objects. Each object represents a fungible
  // token class. It contains the count of UTXOs for that token.
  countTokenUtxos () {
    const tokenUtxos = this.wallet.utxos.utxoStore.slpUtxos.type1.tokens
    // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)

    const tokenList = this.wallet.tokens.listTokensFromUtxos(tokenUtxos)
    // console.log(`tokenList: ${JSON.stringify(tokenList, null, 2)}`)

    const outAry = []

    // Loop through each token class in the wallet.
    for (let i = 0; i < tokenList.length; i++) {
      const thisToken = tokenList[i]

      const tokenObj = {
        tokenId: thisToken.tokenId,
        ticker: thisToken.ticker,
        name: thisToken.name,
        qty: thisToken.qty,
        cnt: 0,
        utxos: []
      }

      // Loop through each token UTXO.
      for (let j = 0; j < tokenUtxos.length; j++) {
        const thisUtxo = tokenUtxos[j]

        // Add the UTXO to the token object if it matches the token ID.
        if (thisUtxo.tokenId === thisToken.tokenId) {
          tokenObj.cnt++
          tokenObj.utxos.push(thisUtxo)
        }
      }

      outAry.push(tokenObj)
    }

    return outAry
  }

  // Update the UTXO store of the wallet.
  async updateUtxos () {
    await this.wallet.walletInfoPromise
    await this.wallet.initialize()

    return true
  }

  // Count the number of BCH UTXOs in the wallet. These can all be consolidated
  // into a single UTXO.
  countBchUtxos () {
    const bchUtxos = this.wallet.utxos.utxoStore.bchUtxos
    // console.log(`bchUtxos: ${JSON.stringify(bchUtxos, null, 2)}`)

    return bchUtxos.length
  }
}

module.exports = ConsolidateUtxos

```

`/home/trout/work/psf/code/minimal-slp-wallet/lib/send-bch.js`:

```js
/*
  This library contains functions specific to sending BCH.
*/

// let this

// const BCHJS = require('@psf/bch-js')
const bchDonation = require('bch-donation')
// const AdapterRouter = require('./adapters/router')

// Send the Permissionless Software Foundation a donation to thank them for creating
// and maintaining this software.
const PSF_DONATION = 2000

class SendBCH {
  constructor (localConfig = {}) {
    // Dependency injection.
    this.bchjs = localConfig.bchjs
    if (!this.bchjs) {
      throw new Error(
        'Must pass instance of bch-js when instantiating SendBCH.'
      )
    }
    this.ar = localConfig.ar
    if (!this.ar) {
      throw new Error('Must pass instance of Adapter Router.')
    }

    this.restURL = localConfig.restURL
    this.apiToken = localConfig.apiToken
    // this.ar = new AdapterRouter({ bchjs: this.bchjs })

    // this.bchjs = new BCHJS(config)

    // This should be the last command in the constructor.
    // this is a local global variable for when 'this' loses scope.
    // this = this
  }

  // Top-level function that orchestrates the sending of BCH.
  // Expects an array of BCH-only UTXOs. Does not check if UTXOs belong to a token,
  // and will burn tokens if they are included in the UTXO list.
  async sendBch (outputs, walletInfo, utxos) {
    // console.log('sendBch() walletInfo: ', walletInfo)

    try {
      // Generate the transaction.
      const transaction = await this.createTransaction(
        outputs,
        walletInfo,
        utxos
      )
      // console.log('transaction hex: ', transaction.hex)

      // Broadcast the transaction to the network.
      // const txid = await this.bchjs.RawTransactions.sendRawTransaction(
      //   transaction.hex
      // )
      const txid = await this.ar.sendTx(transaction.hex)
      // console.log('sendBch(): ', txid)

      // TODO: Remove the spent UTXOs from the utxoStore.

      return txid
    } catch (err) {
      console.error('Error in send-bch.js/sendBch()')
      throw err
    }
  }

  // outputs is an array of output objects. Look like this:
  // {
  //     address: "bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h",
  //     // amount in satoshis, 1 satoshi = 0.00000001 Bitcoin
  //     amountSat: 100000
  // }
  // Expects an array of BCH-only UTXOs. Does not check if UTXOs belong to a token,
  // and will burn tokens if they are included in the UTXO list.
  async createTransaction (outputs, walletInfo, utxos) {
    // console.log('createTransaction() walletInfo: ', walletInfo)

    try {
      // If the BCH utxos array is still empty, then throw an error.
      if (!utxos || utxos.length === 0) {
        throw new Error('UTXO list is empty')
      }

      // Default value of 1 sat-per-byte if mining fee is not specified.
      if (!walletInfo.fee) walletInfo.fee = 1.0

      // Determine the UTXOs needed to be spent for this TX, and the change
      // that will be returned to the wallet.
      const { necessaryUtxos, change } = this.getNecessaryUtxosAndChange(
        outputs,
        utxos,
        walletInfo.fee
      )

      // Create an instance of the Transaction Builder.
      const transactionBuilder = new this.bchjs.TransactionBuilder()

      // Add inputs
      necessaryUtxos.forEach(utxo => {
        transactionBuilder.addInput(utxo.tx_hash, utxo.tx_pos)
      })

      // Add outputs
      outputs.forEach(receiver => {
        transactionBuilder.addOutput(
          this.bchjs.Address.toLegacyAddress(receiver.address),
          receiver.amountSat)
      })

      // Send a 2000 sat donation to PSF to thank them for creating this awesome software.
      // console.log(`psf: ${bchDonation('psf').donations}`)
      transactionBuilder.addOutput(bchDonation('psf').donations, PSF_DONATION)

      // Send change back to the wallet, if it's bigger than dust.
      // console.log(`change: ${change}`)
      if (change && change > 546) {
        transactionBuilder.addOutput(walletInfo.cashAddress, change)
      }

      // Generate a key pair from the mnemonic.
      const keyPair = await this.getKeyPairFromMnemonic(walletInfo)

      // Sign each UTXO that is about to be spent.
      necessaryUtxos.forEach((utxo, i) => {
        let redeemScript

        transactionBuilder.sign(
          i,
          keyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.value
        )
      })

      // Build the transaction, return the compiled transaction in hex format.
      const tx = transactionBuilder.build()
      return { hex: tx.toHex(), txid: tx.getId() }
    } catch (err) {
      console.error('Error in send-bch.js/createTransaction()')
      throw err
    }
  }

  // Get the UTXOs required to generate a transaction.
  // Uses the smallest UTXOs first, which maximizes the number UTXOs used.
  // This helps reduce the total number UTXOs in the wallet, which is efficient
  // for limiting the number of network calls, and leads to better UX.
  getNecessaryUtxosAndChange (outputs, availableUtxos, satsPerByte = 1.0, opts = {}) {
    const sortedUtxos = (opts.utxoSortingFn
      ? opts.utxoSortingFn(availableUtxos)
      : this.sortUtxosBySize(availableUtxos, 'ASCENDING')
    )
    // console.log(`sortedUtxos: ${JSON.stringify(sortedUtxos, null, 2)}`)

    // const satsPerByte = 1.0

    // Calculate the miner fee, assuming inputs (this cost will be added later).
    // Change is assumed, that is the +1.
    const fee = this.calculateFee(0, outputs.length + 1, satsPerByte)
    // console.log(`fee: ${fee}`)

    // Calculate the satoshis needed (minus the fee for each input)
    const satoshisToSend = outputs.reduce(
      (acc, receiver) => acc + receiver.amountSat,
      0
    )
    let satoshisNeeded = satoshisToSend + fee + PSF_DONATION

    let satoshisAvailable = 0
    const necessaryUtxos = []

    // Add each UTXO to the calculation until enough satoshis are found.
    for (const utxo of sortedUtxos) {
      // TODO: Check getTxOut() on the full node to verify the UTXO is valid.

      // TODO: Check the ancestor history to make sure the UTXO won't fail the
      // 50-chain limit rule.

      // Add the next UTXO.
      necessaryUtxos.push(utxo)
      satoshisAvailable += utxo.value

      // Additional cost per Utxo input is 148 sats for mining fees.
      satoshisNeeded += 148

      // Exit the loop once enough UTXOs are found to pay the the TX.
      if (satoshisAvailable >= satoshisNeeded) {
        break
      }
    }

    // Calculate the remainder or 'change' to send back to the sender.
    const change = satoshisAvailable - satoshisNeeded
    // console.log(`change: ${change}`)

    // If change is less than zero, something went wrong. Sanity check.
    if (change < 0) {
      console.error(
        `Available satoshis (${satoshisAvailable}) below needed satoshis (${satoshisNeeded}).`
      )
      throw new Error('Insufficient balance')
    }

    // console.log(`necessaryUtxos: ${JSON.stringify(necessaryUtxos, null, 2)}`)
    // console.log(`change: ${JSON.stringify(change, null, 2)}`)

    return { necessaryUtxos, change }
  }

  // Sort the UTXOs by the size of satoshis they hold.
  sortUtxosBySize (utxos, sortingOrder = 'ASCENDING') {
    if (sortingOrder === 'ASCENDING') {
      return utxos.sort((a, b) => a.value - b.value)
    } else {
      return utxos.sort((a, b) => b.value - a.value)
    }
  }

  // Calculate the miner fee that needs to be paid for this transaction.
  calculateFee (numInputs, numOutputs, satsPerByte) {
    try {
      const byteCount = this.bchjs.BitcoinCash.getByteCount(
        { P2PKH: numInputs },
        { P2PKH: numOutputs + 1 }
      )

      const fee = Math.ceil(byteCount * satsPerByte)

      if (isNaN(fee)) {
        throw new Error('Invalid input. Fee could not be calculated.')
      }

      return fee
    } catch (err) {
      console.error('Error in send-bch.js/calculateFee()')
      throw err
    }
  }

  // TODO: change the name of this function to getKeyPair()
  // Generate a EC key pair.
  async getKeyPairFromMnemonic (walletInfo) {
    // console.log('getKeyPairFromMnemonic() walletInfo: ', walletInfo)

    // If the wallet has a 12-word mnemonic, generate the key from there.
    if (walletInfo.mnemonic) {
      const rootSeed = await this.bchjs.Mnemonic.toSeed(walletInfo.mnemonic)
      const masterHDNode = this.bchjs.HDNode.fromSeed(rootSeed /*, "bchtest" */)
      const change = this.bchjs.HDNode.derivePath(
        masterHDNode,
        walletInfo.hdPath
      )

      const keyPair = this.bchjs.HDNode.toKeyPair(change)

      return keyPair
    } else {
      // No mnemonic. Wallet generated from WIF private key.

      const wif = walletInfo.privateKey
      if (!wif) {
        throw new Error('Wallet has no mnemonic or private key!')
      }

      const ecPair = this.bchjs.ECPair.fromWIF(walletInfo.privateKey)

      return ecPair
    }
  }

  // Top-level function that orchestrates the sending of BCH.
  // Expects an array of BCH-only UTXOs. Does not check if UTXOs belong to a token,
  // and will burn tokens if they are included in the UTXO list.
  async sendAllBch (toAddress, walletInfo, utxos) {
    try {
      // Generate the transaction.
      const transaction = await this.createSendAllTx(
        toAddress,
        walletInfo,
        utxos
      )
      // console.log('transaction hex: ', transaction.hex)

      // Broadcast the transaction to the network.
      const txid = await this.ar.sendTx(transaction.hex)
      // console.log(txid)

      // TODO: Remove the spent UTXOs from the utxoStore.

      return txid
    } catch (err) {
      console.error('Error in send-bch.js/sendAllBch()')
      throw err
    }
  }

  // Expects an array of BCH-only UTXOs. Does not check if UTXOs belong to a token,
  // and will burn tokens if they are included in the UTXO list.
  async createSendAllTx (toAddress, walletInfo, utxos) {
    try {
      // console.log(`walletInfo: ${JSON.stringify(walletInfo, null, 2)}`)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      // Validate Inputs
      if (!toAddress || typeof toAddress !== 'string') {
        throw new Error('Address to send must be a bch address')
      }
      // If the BCH utxos array is still empty, then throw an error.
      if (!utxos || utxos.length === 0) {
        throw new Error('UTXO list is empty')
      }

      // Create an instance of the Transaction Builder.
      const transactionBuilder = new this.bchjs.TransactionBuilder()

      // Set default value of 1 sat-per-byte if fee not specified.
      if (!walletInfo.fee) walletInfo.fee = 1.0

      const satsPerByte = walletInfo.fee

      let totalAmount = 0

      // Calculate Fee
      let fee = this.calculateFee(0, 2, satsPerByte)
      fee += PSF_DONATION

      // Add inputs
      utxos.forEach(utxo => {
        totalAmount += utxo.value
        // Additional cost per Utxo input is 148 sats for mining fees.
        fee += 148
        transactionBuilder.addInput(utxo.tx_hash, utxo.tx_pos)
      })
      // console.log(`totalAmount: ${totalAmount}`)
      // console.log(`fee: ${fee}`)

      // Add outputs
      transactionBuilder.addOutput(toAddress, totalAmount - fee)

      // Send a 2000 sat donation to PSF to thank them for creating this awesome software.
      transactionBuilder.addOutput(bchDonation('psf').donations, PSF_DONATION)

      // Generate a key pair from the mnemonic.
      const keyPair = await this.getKeyPairFromMnemonic(walletInfo)

      // Sign each UTXO that is about to be spent.
      utxos.forEach((utxo, i) => {
        let redeemScript

        transactionBuilder.sign(
          i,
          keyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.value
        )
      })

      // Build the transaction, return the compiled transaction in hex format.
      const tx = transactionBuilder.build()
      return { hex: tx.toHex(), txid: tx.getId() }
    } catch (err) {
      console.error('Error in send-bch.js/createSendAllTx()')
      throw err
    }
  }
}

module.exports = SendBCH

```

`/home/trout/work/psf/code/minimal-slp-wallet/lib/adapters/router.js`:

```js
/*
  This file routes the network calls to the appropriate adapter, based on
  how this library is instantiated. This allows the code for wallet functions
  to be the same, while building different network adapters that are drop-in
  replacements for one another.

  If this.interface === 'rest-api', then use bch-js api.FullStack.cash
  if this.interface === 'consumer-api', then use bch-consumer and free-bch.fullstack.cash.
*/

const BchConsumer = require('bch-consumer')

class AdapterRouter {
  constructor (localConfig = {}) {
    // Dependency injection.
    this.bchjs = localConfig.bchjs
    if (!this.bchjs) {
      throw new Error(
        'Must pass instance of bch-js when instantiating AdapterRouter.'
      )
    }

    // Select the interface to use for network calls.
    this.interface = 'rest-api' // default
    if (localConfig.interface === 'consumer-api') {
      this.interface = 'consumer-api'
      if (localConfig.restURL) {
        this.bchConsumer = new BchConsumer({ restURL: localConfig.restURL })
      } else {
        this.bchConsumer = new BchConsumer()
      }
    }
    console.log(`Initializing minimal-slp-wallet routers with this interface: ${this.interface}`)

    // Allow the wallet service adapter to be overwritten at runtime.
    // if (localConfig.walletService) {
    //   this.walletService = localConfig.walletService
    // } else {
    //   // Use the default placeholder if service adapter is to specified.
    //   this.walletService = new WalletConsumer(localConfig)
    // }

    // Bind 'this' object to all methods
    this.getBalance = this.getBalance.bind(this)
    this.getUtxos = this.getUtxos.bind(this)
    this.getTransactions = this.getTransactions.bind(this)
    this.getTxData = this.getTxData.bind(this)
    this.sendTx = this.sendTx.bind(this)
    this.getUsd = this.getUsd.bind(this)
    this.utxoIsValid = this.utxoIsValid.bind(this)
    this.getTokenData = this.getTokenData.bind(this)
    this.getTokenData2 = this.getTokenData2.bind(this)
    this.getPubKey = this.getPubKey.bind(this)
    this.getPsfWritePrice = this.getPsfWritePrice.bind(this)
    this.cid2json = this.cid2json.bind(this)
  }

  async getBalance (addr) {
    try {
      if (!addr) {
        throw new Error('Address string required when calling getBalance()')
      }

      if (this.interface === 'rest-api') {
        const balances = await this.bchjs.Electrumx.balance(addr)
        return balances

        //
      } else if (this.interface === 'consumer-api') {
        const result = await this.bchConsumer.bch.getBalance(addr)
        // console.log('result: ', result)

        // Handle failure from communicating with wallet service.
        if (!result.success) {
          throw new Error(result.message)
        }

        // Construct an object that matches the bchjs output.
        const balances = {
          success: result.success,
          balance: result.balances[0].balance
        }

        return balances
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in router.js/getBalance()')
      throw err
    }
  }

  // Get UTXOs from the network service.
  async getUtxos (addr) {
    try {
      if (!addr) {
        throw new Error('Address string required when calling getUtxos()')
      }

      // console.log(`getUtxos() this.interface: ${this.interface}`)
      if (this.interface === 'rest-api') {
        const utxos = await this.bchjs.Utxo.get(addr)
        // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

        return utxos
      } else if (this.interface === 'consumer-api') {
        const utxos = await this.bchConsumer.bch.getUtxos(addr)
        // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

        // Handle communication errors.
        if (utxos[0].success === false) throw new Error(utxos[0].message)

        return utxos[0]
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in router.js/getUtxos()')
      throw err
    }
  }

  // Get transaction history for an address.
  async getTransactions (addr, sortingOrder = 'DESCENDING') {
    try {
      if (!addr) {
        throw new Error(
          'Address string required when calling getTransactions()'
        )
      }

      if (this.interface === 'rest-api') {
        const data = await this.bchjs.Electrumx.transactions(addr)
        // console.log('getTransactions() rest-api: ', data)

        const sortedTxs = await this.bchjs.Electrumx.sortAllTxs(data.transactions, sortingOrder)
        data.transactions = sortedTxs

        return data

        //
      } else if (this.interface === 'consumer-api') {
        const result = await this.bchConsumer.bch.getTxHistory(addr, sortingOrder)
        // console.log(
        //   `getTransactions() bchConsumer: ${JSON.stringify(result, null, 2)}`
        // )

        // Construct an object that matches the bchjs output.
        const txs = {
          success: result.success,
          transactions: result.txs
        }

        return txs
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in router.js/getBalance()')
      throw err
    }
  }

  // Get transaction details for an array of TXIDs, up to 20 elements.
  async getTxData (txids) {
    try {
      if (!Array.isArray(txids)) {
        throw new Error('Input txids must be an array of TXIDs. Up to 20.')
      }

      // console.log('minimal getTxData txids: ', txids)
      // console.log('minimal interface: ', this.interface)

      if (this.interface === 'rest-api') {
        const data = []
        for (let i = 0; i < txids.length; i++) {
          const txid = txids[i]
          // console.log('txid: ', txid)

          const txData = await this.bchjs.PsfSlpIndexer.tx(txid)
          data.push(txData.txData)
        }

        return data

        //
      } else if (this.interface === 'consumer-api') {
        const result = await this.bchConsumer.bch.getTxData(txids)

        return result
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in router.js/getTxData()')
      throw err
    }
  }

  // Attempts to broadcast a transaction to the network. hex is expected to be
  // a string containing a hexidecimal recresentation of the transaction.
  async sendTx (hex) {
    try {
      if (!hex) {
        throw new Error('Hex encoded transaction required as input.')
      }

      if (this.interface === 'rest-api') {
        let txid = await this.bchjs.RawTransactions.sendRawTransaction([hex])
        // console.log('txid: ', txid)

        // bch-js returns an array. Refactor this to return a string.
        txid = txid[0]

        return txid
      } else if (this.interface === 'consumer-api') {
        const txid = await this.bchConsumer.bch.sendTx(hex)
        // console.log('sendTx() txid: ', txid)

        if (txid.success === false) throw new Error(txid.message)

        return txid.txid
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in router.js/sendTx()')

      if (err.error) throw new Error(err.error)
      throw err
    }
  }

  // Get the current price for BCH in USD.
  async getUsd () {
    try {
      if (this.interface === 'rest-api') {
        const price = await this.bchjs.Price.getUsd()
        return price
      } else if (this.interface === 'consumer-api') {
        const price = await this.bchConsumer.bch.getUsd()
        return price
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in minimal-slp-wallet/getPrice()')

      throw err
    }
  }

  // Validate that a UTXO is spendable.
  async utxoIsValid (utxo) {
    try {
      if (!utxo) {
        throw new Error('utxo required as input.')
      }

      if (this.interface === 'rest-api') {
        const isValid = await this.bchjs.Utxo.isValid(utxo)
        return isValid
      } else if (this.interface === 'consumer-api') {
        const result = await this.bchConsumer.bch.utxoIsValid(utxo)
        return result.isValid
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in minimal-slp-wallet/utxoIsValid()')

      throw err
    }
  }

  // Get mutable and immutable data associated with a token
  async getTokenData (tokenId, withTxHistory = false, sortOrder = 'DESCENDING') {
    try {
      if (!tokenId) {
        throw new Error('tokenId required as input.')
      }

      let tokenData

      if (this.interface === 'rest-api') {
        tokenData = await this.bchjs.PsfSlpIndexer.getTokenData(tokenId, withTxHistory)
        // return tokenData
      } else if (this.interface === 'consumer-api') {
        tokenData = await this.bchConsumer.bch.getTokenData(tokenId, withTxHistory)
        // console.log('tokenData: ', JSON.stringify(tokenData, null, 2))

        // Handle failure from communicating with wallet service.
        if (!tokenData.success) {
          throw new Error(tokenData.message)
        }

        tokenData = tokenData.tokenData
      }

      // If the token history is requested, then sort the transactions.
      // TODO: the Electrumx.sortAllTxs() makes a call to get the block height,
      // which could be problematic. It would be best to pull that function out
      // of the bch-js library and create a utility function in this library.
      if (withTxHistory) {
        if (!tokenData.genesisData.txs) {
          throw new Error('No transaction history included with genesis data.')
        }

        // 4/6/23 CT - commented out this sorting function because it depends on
        // a network call to bch-api, which is not available when this function
        // is called with the consumer-api interface. I believe this sorting
        // is redundent anyways. It was put here as a temporary fix until the
        // sorting was added to bch-api, which it has been.
        // const sortedTxs = await this.bchjs.Electrumx.sortAllTxs(tokenData.genesisData.txs, sortOrder)
        // tokenData.genesisData.txs = sortedTxs
      }

      return tokenData

      // throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in minimal-slp-wallet/getTokenData()')

      throw err
    }
  }

  // Get token icon and other media
  async getTokenData2 (tokenId, updateCache = false) {
    try {
      if (!tokenId) {
        throw new Error('tokenId required as input.')
      }

      if (this.interface === 'rest-api') {
        const tokenData = await this.bchjs.PsfSlpIndexer.getTokenData2(tokenId, updateCache)
        return tokenData
      } else if (this.interface === 'consumer-api') {
        const tokenData = await this.bchConsumer.bch.getTokenData2(tokenId, updateCache)
        return tokenData.tokenData
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in minimal-slp-wallet/getTokenData2()')

      throw err
    }
  }

  // Get a public key for a given address. This can be used to send encrypted
  // messages to the address.
  async getPubKey (addr) {
    try {
      if (!addr) {
        throw new Error('addr required as input.')
      }

      if (this.interface === 'rest-api') {
        let pubKey
        try {
          pubKey = await this.bchjs.encryption.getPubKey(addr)
          // console.log('pubKey: ', pubKey)
        } catch (err) {
          // console.log('err: ', err)
          throw new Error(err.error)
        }

        // console.log('pubKey: ', pubKey)

        return pubKey.publicKey
      } else if (this.interface === 'consumer-api') {
        const result = await this.bchConsumer.msg.getPubKey(addr)
        // console.log('result: ', result)

        if (!result.success) {
          throw new Error(result.message)
        }

        return result.pubkey.publicKey
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in minimal-slp-wallet/router.js/getPubKey()')

      throw err
    }
  }

  // Retrieve the current price in PSF tokens to write 1MB of data to the
  // PSFFPP (psffpp.com) IPFS pinning network.
  async getPsfWritePrice () {
    try {
      let price

      if (this.interface === 'rest-api') {
        try {
          price = await this.bchjs.Price.getPsffppPrice()
          console.log('price: ', price)
        } catch (err) {
          console.log('err: ', err)
          throw new Error(err.error)
        }

        return price
      } else if (this.interface === 'consumer-api') {
        price = await this.bchConsumer.bch.getPsffppWritePrice()
        // console.log('result: ', result)

        return price
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      console.error('Error in minimal-slp-wallet/router.js/getPsfWritePrice()')

      throw err
    }
  }

  // Convert a CID to a JSON object.
  async cid2json (inObj = {}) {
    try {
      const { cid } = inObj
      // console.log('router.js/cid2json() cid: ', cid)

      if (!cid) {
        throw new Error('cid required as input.')
      }

      if (this.interface === 'rest-api') {
        throw new Error('cid2json() is not supported with the rest-api interface.')
      } else if (this.interface === 'consumer-api') {
        const result = await this.bchConsumer.bch.cid2json({ cid })
        return result
      }

      throw new Error('this.interface is not specified')
    } catch (err) {
      if (err.isAxiosError) {
        const errMsg = err.response.data

        console.error('Error in minimal-slp-wallet/router.js/cid2json()')
        throw new Error(errMsg)
      } else {
        console.error('Error in minimal-slp-wallet/router.js/cid2json()')
        throw err
      }
    }
  }
}

module.exports = AdapterRouter

```

`/home/trout/work/psf/code/minimal-slp-wallet/lib/utxos.js`:

```js
/*
  A utility library for handling, analyzing, and maintaining a collection of UTXOs.

  TODO:

*/

// const BCHJS = require('@psf/bch-js')
// const AdapterRouter = require('./adapters/router')

// let this

class UTXOs {
  constructor (localConfig = {}) {
    // Dependency injection.
    this.bchjs = localConfig.bchjs
    if (!this.bchjs) {
      throw new Error(
        'Must pass instance of bch-js when instantiating AdapterRouter.'
      )
    }
    this.ar = localConfig.ar
    if (!this.ar) {
      throw new Error('Must pass instance of Adapter Router.')
    }

    // Encapsulate dependencies.
    // this.bchjs = new BCHJS(config)
    // this.bchjs = new BCHJS({ restURL: 'http://localhost:3000/v3/' })
    // this.ar = new AdapterRouter({ bchjs: this.bchjs })

    // UTXO storage. Used as a cache for UTXO information to reduce the number
    // of network calls required to retrieve a UTXO.
    this.utxoStore = {}

    this.temp = []

    // This should be the last command in the constructor.
    // this is a local global variable for when 'this' loses scope.
    // this = this
  }

  // Retrieve UTXO data for the wallet from the blockchain.
  async initUtxoStore (addr) {
    try {
      // Clear the utxo store.
      this.utxoStore = []

      // const utxos = await this.bchjs.Utxo.get(addr)
      const utxos = await this.ar.getUtxos(addr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      // Handle network failures.
      if (utxos.status > 399) {
        throw new Error(utxos.message)
      }

      this.utxoStore = utxos

      return this.utxoStore
    } catch (err) {
      console.error('Error in utxos.js/initUtxoStore()')
      throw err
    }
  }

  // Return the token UTXOs that are spendible. This currently only includes
  // Type 1. Group, and NFT tokens are not yet supported. It ignores minting
  // batons.
  getSpendableTokenUtxos () {
    try {
      // console.log('this.utxoStore: ', this.utxoStore)
      // console.log(`this.utxoStore: ${JSON.stringify(this.utxoStore, null, 2)}`)

      // This was used in bch-js v4 when SLPDB was used. This can hopefully be
      // used again when psf-slp-indexer supports NFTs.
      const tokenUtxos = this.utxoStore.slpUtxos.type1.tokens.concat(
        this.utxoStore.slpUtxos.nft.tokens,
        this.utxoStore.slpUtxos.group.tokens
      )

      // const tokenUtxos = this.utxoStore.slpUtxos.type1.tokens
      // console.log(
      //   `getSpendableTokenUtxos tokenUtxos: ${JSON.stringify(
      //     tokenUtxos,
      //     null,
      //     2
      //   )}`
      // )

      return tokenUtxos
    } catch (err) {
      console.error('Error in utxos.js/getSpendableTokenUtxos()')
      throw err
    }
  }
}

module.exports = UTXOs

```

`/home/trout/work/psf/code/minimal-slp-wallet/lib/tokens.js`:

```js
/*
  This library provides functions for dealing with SLP tokens.
*/

// External npm dependencies.
// const BCHJS = require('@psf/bch-js')
const bchDonation = require('bch-donation')

// Local dependencies
const SendBCH = require('./send-bch')
const Utxos = require('./utxos')
// const AdapterRouter = require('./adapters/router')

// let this

// Send the Permissionless Software Foundation a donation to thank them for creating
// and maintaining this software.
const PSF_DONATION = 2000

class Tokens {
  constructor (localConfig = {}) {
    // Dependency injection.
    this.bchjs = localConfig.bchjs
    if (!this.bchjs) {
      throw new Error('Must pass instance of bch-js when instantiating Tokens library.')
    }
    this.ar = localConfig.ar
    if (!this.ar) {
      throw new Error('Must pass instance of Adapter Router.')
    }

    // Encapsulate dependencies.
    // this.bchjs = new BCHJS(localConfig)
    this.sendBch = new SendBCH(localConfig)
    this.utxos = new Utxos(localConfig)
    // this.ar = new AdapterRouter({ bchjs: this.bchjs })

    // This should be the last command in the constructor.
    // this is a local global variable for when 'this' loses scope.
    // this = this
  }

  // This is a wrapper for listTokensFromUtxos(). It takes a BCH address,
  // retrieves the UTXOs for that address and feeds it to listTokensFromUtxos().
  // It returns the results.
  async listTokensFromAddress (addr) {
    try {
      if (!addr) throw new Error('Address not provided')

      // Convert to a BCH address.
      addr = this.bchjs.SLP.Address.toCashAddress(addr)

      // Refresh the utxo store.
      await this.utxos.initUtxoStore(addr)
      // console.log(
      //   `this.utxos.utxoStore: ${JSON.stringify(this.utxos.utxoStore, null, 2)}`
      // )

      const hydratedUtxos = this.utxos.getSpendableTokenUtxos()
      // console.log(`hydratedUtxos: ${JSON.stringify(hydratedUtxos, null, 2)}`)

      return this.listTokensFromUtxos(hydratedUtxos)
    } catch (err) {
      console.error('Error in tokens.js/listTokensFromAddress()')
      throw err
    }
  }

  // This function calls listTokensFromAddress(), then filters the results for
  // a specific token, and returns the balance of that token. If the token is
  // not found, it returns 0.
  async getTokenBalance (tokenId, addr) {
    try {
      // Input validation.
      if (!tokenId) throw new Error('token ID not provided')
      if (!addr) throw new Error('Address not provided')
      console.log('tokenId: ', tokenId)

      // Get an array of tokens held by the address.
      const tokens = await this.listTokensFromAddress(addr)
      // console.log('tokens: ', tokens)

      // Filter out the token of interest.
      const token = tokens.filter(x => x.tokenId === tokenId)

      // If there are no tokens matching the token ID, return 0.
      if (!token.length) {
        return 0
      }

      // Return the token balance.
      return token[0].qty
    } catch (err) {
      console.error('Error in tokens.js/getTokenBalance()')
      throw err
    }
  }

  // Returns an array of Objects with token information. Expects an array of
  // hydrated UTXOs as input.
  listTokensFromUtxos (utxos) {
    try {
      // console.log(
      //   `listTokensFromUtxos utxos: ${JSON.stringify(utxos, null, 2)}`
      // )

      // Array used to assemble token information.
      const tokenInfo = []

      utxos.forEach(utxo => {
        // console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)

        // Skip if this is not a valid token UTXO.
        // if (!utxo.isValid) return
        if (!utxo.isSlp || utxo.type !== 'token') return

        // Check if the current UTXO represents a token that is already in the
        // tokenInfo array.
        const exists = tokenInfo.findIndex(
          thisToken => thisToken.tokenId === utxo.tokenId
        )
        // console.log(`exists: ${JSON.stringify(exists, null, 2)}`)

        // Token does not exist yet in the list.
        if (exists < 0) {
          const infoObj = {
            tokenId: utxo.tokenId,
            ticker: utxo.ticker,
            name: utxo.name,
            decimals: utxo.decimals,
            tokenType: utxo.tokenType,
            url: utxo.documentUri,
            qty: Number(utxo.qtyStr)
          }

          tokenInfo.push(infoObj)
        } else {
          // Token already exists in the tokenInfo array.
          // Just update the quantity.
          tokenInfo[exists].qty += Number(utxo.qtyStr)
        }
      })

      return tokenInfo
    } catch (err) {
      console.error('Error in tokens.js/listTokensFromUtxos()')
      throw err
    }
  }

  // Top-level wrapper function that orchestrates the sending of tokens.
  // output is a single object that looks like this:
  // {
  //     address: "simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv",
  //     tokenId: "497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7",
  //     qty: 1
  // }
  async sendTokens (
    output,
    walletInfo,
    bchUtxos,
    tokenUtxos,
    satsPerByte = 1.0,
    opts = {}
  ) {
    try {
      // Generate the transaction.
      const transaction = await this.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        tokenUtxos,
        satsPerByte,
        opts
      )

      // Debugging.
      // console.log('transaction hex: ', transaction.hex)

      // Broadcast the transaction to the network.
      const txid = await this.ar.sendTx(transaction.hex)
      // console.log(txid)

      // TODO: Remove the spent UTXOs from the utxoStore.

      return txid
    } catch (err) {
      console.error('Error in tokens.js/sendTokens()')
      throw err
    }
  }

  // Build the transaction for sending a token.
  async createTransaction (
    output,
    walletInfo,
    bchUtxos,
    tokenUtxos,
    satsPerByte = 1.0,
    opts = {}
  ) {
    try {
      // console.log('createTransaction() start tokenUtxos: ', tokenUtxos)
      // console.log('output: ', output)

      // If the BCH utxos array is still empty, then throw an error.
      if (!bchUtxos || bchUtxos.length === 0) {
        throw new Error('BCH UTXO list is empty')
      }

      // If the BCH utxos array is still empty, then throw an error.
      if (!tokenUtxos || tokenUtxos.length === 0) {
        throw new Error('Token UTXO list is empty')
      }

      // Collect just the UTXOs that match the user-selected token ID.
      const tokenId = output.tokenId

      // Filter out the token UTXOs that match the selected token ID.
      // tokenUtxos = tokenUtxos.filter(e => e.tokenId === tokenId)
      tokenUtxos = tokenUtxos.filter(
        e => e.tokenId === tokenId && e.type === 'token'
      )
      // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)
      // console.log(`tokenUtxos[0].tokenType: ${tokenUtxos[0].tokenType}`)

      if (tokenUtxos.length === 0) throw new Error(`Token UTXO with token ID ${tokenId} not found!`)

      // Generate the BCH output object.
      const bchOutput = [
        {
          address: walletInfo.cashAddress,

          // Premium paid for SLP OP_RETURN data.
          // ToDo: Add a better way to calculate extra costs of OP_RETURN.
          // amountSat: 500
          amountSat: 500 + 50 * satsPerByte
        }
      ]

      // Determine the UTXOs needed to be spent for this TX, and the change
      // that will be returned to the wallet.
      const {
        necessaryUtxos,
        change
      } = this.sendBch.getNecessaryUtxosAndChange(
        bchOutput,
        bchUtxos,
        satsPerByte,
        opts
      )

      // Create an instance of the Transaction Builder.
      const transactionBuilder = new this.bchjs.TransactionBuilder()

      // Add token inputs
      if (opts.tokenUtxosFilter) {
        tokenUtxos = opts.tokenUtxosFilter(tokenUtxos)
      }

      tokenUtxos.forEach(utxo => {
        transactionBuilder.addInput(utxo.tx_hash, utxo.tx_pos)
      })

      // Add BCH inputs
      necessaryUtxos.forEach(utxo => {
        transactionBuilder.addInput(utxo.tx_hash, utxo.tx_pos)
      })

      // Add required tokenQty property used by generateSendOpReturn()
      tokenUtxos = tokenUtxos.map(x => {
        x.tokenQty = parseFloat(x.qtyStr)
        return x
      })

      // console.log('tokens.js tokenUtxos: ', tokenUtxos)

      // Generate the proper SLP OP_RETURN
      let slpSendObj = {}
      // Fungable SLP token.
      if (tokenUtxos[0].tokenType === 1) {
        slpSendObj = await this.bchjs.SLP.TokenType1.generateSendOpReturn(
          tokenUtxos,
          output.qty
        )

      // NFT (Child)
      } else if (tokenUtxos[0].tokenType === 65) {
        slpSendObj = await this.bchjs.SLP.NFT1.generateNFTChildSendOpReturn(
          tokenUtxos,
          output.qty
        )

        // NFT Group
      } else if (tokenUtxos[0].tokenType === 129) {
        slpSendObj = await this.bchjs.SLP.NFT1.generateNFTGroupSendOpReturn(
          tokenUtxos,
          output.qty
        )

        // throw an error for any other token type.
      } else throw new Error(`Token Type ${tokenUtxos[0].tokenType} unknown`)

      const slpBuf = Buffer.from(slpSendObj.script, 'hex')
      transactionBuilder.addOutput(slpBuf, 0)

      // Send dust transaction representing tokens being sent.
      transactionBuilder.addOutput(
        this.bchjs.SLP.Address.toLegacyAddress(output.address),
        546
      )

      // Return any token change back to the sender.
      if (slpSendObj.outputs > 1) {
        transactionBuilder.addOutput(
          this.bchjs.SLP.Address.toLegacyAddress(walletInfo.address),
          546
        )
      }

      // Add outputs
      // outputs.forEach(receiver => {
      //   transactionBuilder.addOutput(receiver.address, receiver.amountSat)
      // })
      // transactionBuilder.addOutput(output.address, output.amountSat)

      // Send a 2000 sat donation to PSF to thank them for creating this awesome software.
      // console.log(`psf: ${bchDonation('psf').donations}`)
      transactionBuilder.addOutput(bchDonation('psf').donations, PSF_DONATION)

      // Send change back to the wallet, if it's bigger than dust.
      // console.log(`change: ${change}`)
      if (change && change > 546) {
        transactionBuilder.addOutput(walletInfo.cashAddress, change)
      }

      // Generate a key pair from the mnemonic.
      const keyPair = await this.sendBch.getKeyPairFromMnemonic(walletInfo)

      // Sign each UTXO that is about to be spent.
      tokenUtxos.forEach((utxo, i) => {
        let redeemScript

        transactionBuilder.sign(
          i,
          keyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.value
        )
      })

      // Sign each UTXO that is about to be spent.
      necessaryUtxos.forEach((utxo, i) => {
        let redeemScript

        transactionBuilder.sign(
          tokenUtxos.length + i,
          keyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.value
        )
      })

      // Build the transaction, return the compiled transaction in hex format.
      const tx = transactionBuilder.build()
      return { hex: tx.toHex(), txid: tx.getId() }
    } catch (err) {
      console.error('Error in tokens.js/createTransaction()')
      throw err
    }
  }

  // Build the transaction to burn tokens.
  async createBurnTransaction (
    qty,
    tokenId,
    walletInfo,
    bchUtxos,
    tokenUtxos,
    satsPerByte = 1.0
  ) {
    try {
      if (!qty || typeof qty !== 'number') {
        throw new Error('qty must be number')
      }
      if (!tokenId || typeof tokenId !== 'string') {
        throw new Error('tokenId must be string')
      }
      if (!walletInfo || typeof walletInfo !== 'object') {
        throw new Error('walletInfo must be a object')
      }
      // If the BCH utxos array is still empty, then throw an error.
      if (!bchUtxos || bchUtxos.length === 0) {
        throw new Error('BCH UTXO list is empty')
      }
      // If the BCH utxos array is still empty, then throw an error.
      if (!tokenUtxos || tokenUtxos.length === 0) {
        throw new Error('Token UTXO list is empty')
      }

      // Filter out the token UTXOs that match the selected token ID.
      // tokenUtxos = tokenUtxos.filter(e => e.tokenId === tokenId)
      tokenUtxos = tokenUtxos.filter(
        e => e.tokenId === tokenId && e.type === 'token'
      )
      if (!tokenUtxos.length) {
        throw new Error('tokenId does not match')
      }
      // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)
      // console.log(`tokenUtxos[0].tokenType: ${tokenUtxos[0].tokenType}`)

      // Throw an error if the number of tokens in the wallet are less than the
      // number of tokens to be burned.
      let tokenQty = 0
      for (let i = 0; i < tokenUtxos.length; i++) {
        const thisUtxo = tokenUtxos[i]

        tokenQty += parseFloat(thisUtxo.tokenQty)
      }
      if (tokenQty < qty) {
        throw new Error(`Available tokens are ${tokenQty}, which is less than quantity to burn (${qty})`)
      }

      // Generate the BCH output object.
      const bchOutput = [
        {
          address: walletInfo.cashAddress,

          // Premium paid for SLP OP_RETURN data.
          // ToDo: Add a better way to calculate extra costs of OP_RETURN.
          // amountSat: 500
          amountSat: 500 + 50 * satsPerByte
        }
      ]

      // Determine the UTXOs needed to be spent for this TX, and the change
      // that will be returned to the wallet.
      const {
        necessaryUtxos,
        change
      } = this.sendBch.getNecessaryUtxosAndChange(
        bchOutput,
        bchUtxos,
        satsPerByte
      )

      // Create an instance of the Transaction Builder.
      const transactionBuilder = new this.bchjs.TransactionBuilder()

      // Add token inputs
      tokenUtxos.forEach(utxo => {
        transactionBuilder.addInput(utxo.tx_hash, utxo.tx_pos)
      })

      // Add BCH inputs
      necessaryUtxos.forEach(utxo => {
        transactionBuilder.addInput(utxo.tx_hash, utxo.tx_pos)
      })

      // Add legacy property to token UTXOs.
      tokenUtxos.map(x => {
        x.tokenQty = x.qtyStr
        return x
      })

      // Generate the proper SLP OP_RETURN
      const slpSendObj = await this.bchjs.SLP.TokenType1.generateBurnOpReturn(
        tokenUtxos,
        qty
      )

      const slpBuf = slpSendObj // Buffer.from(slpSendObj.script, 'hex')
      transactionBuilder.addOutput(slpBuf, 0)

      // Send dust transaction representing tokens being sent.
      transactionBuilder.addOutput(
        this.bchjs.SLP.Address.toLegacyAddress(walletInfo.address),
        546
      )

      // Send a 2000 sat donation to PSF to thank them for creating this awesome software.
      // console.log(`psf: ${bchDonation('psf').donations}`)
      transactionBuilder.addOutput(bchDonation('psf').donations, PSF_DONATION)

      // Send change back to the wallet, if it's bigger than dust.
      // console.log(`change: ${change}`)
      if (change && change > 546) {
        transactionBuilder.addOutput(walletInfo.cashAddress, change)
      }

      // Generate a key pair from the mnemonic.
      const keyPair = await this.sendBch.getKeyPairFromMnemonic(walletInfo)

      // Sign each UTXO that is about to be spent.
      tokenUtxos.forEach((utxo, i) => {
        let redeemScript

        transactionBuilder.sign(
          i,
          keyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.value
        )
      })

      // Sign each UTXO that is about to be spent.
      necessaryUtxos.forEach((utxo, i) => {
        let redeemScript

        transactionBuilder.sign(
          tokenUtxos.length + i,
          keyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.value
        )
      })

      // Build the transaction, return the compiled transaction in hex format.
      const tx = transactionBuilder.build()
      return { hex: tx.toHex(), txid: tx.getId() }
    } catch (err) {
      console.error('Error in tokens.js/createBurnTransaction()')
      throw err
    }
  }

  // Burn a *specific quantity* of tokens.
  async burnTokens (
    qty,
    tokenId,
    walletInfo,
    bchUtxos,
    tokenUtxos,
    satsPerByte = 1.0
  ) {
    try {
      // Generate the transaction.
      const transaction = await this.createBurnTransaction(
        qty,
        tokenId,
        walletInfo,
        bchUtxos,
        tokenUtxos,
        satsPerByte
      )

      // Debugging.
      // console.log('transaction hex: ', transaction.hex)

      // Broadcast the transaction to the network.
      const txid = await this.ar.sendTx(transaction.hex)

      // TODO: Remove the spent UTXOs from the utxoStore.

      return txid
    } catch (err) {
      console.error('Error in tokens.js/burnTokens()')
      throw err
    }
  }

  // Burn ALL the SLP tokens in the wallet associated to the tokenID
  async burnAll (tokenId, walletInfo, bchUtxos, tokenUtxos) {
    try {
      // Input validation
      // If the SLP utxos array is still empty, then throw an error.
      if (!tokenId || typeof tokenId !== 'string') {
        throw new Error('tokenId must be a string')
      }
      // If the SLP utxos array is still empty, then throw an error.
      if (!walletInfo || typeof walletInfo !== 'object') {
        throw new Error('walletInfo is required')
      }

      // If the BCH utxos array is empty, then throw an error.
      if (!bchUtxos || bchUtxos.length === 0) {
        throw new Error('BCH UTXO list is empty')
      }
      // console.log(`burnAll() bchUtxos: ${JSON.stringify(bchUtxos, null, 2)}`)

      // If the SLP utxos array is empty, then throw an error.
      if (!tokenUtxos || tokenUtxos.length === 0) {
        throw new Error('SLP UTXO list is empty')
      }
      // console.log(`burnAll() tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)
      // console.log(`tokenId: ${tokenId}`)

      // Get the SLP UTXOs of the tokens to be burned
      tokenUtxos = tokenUtxos.filter(
        e => e.tokenId === tokenId && e.type === 'token'
      )
      // console.log(`burnAll() tokenUtxos after filtering: ${JSON.stringify(tokenUtxos, null, 2)}`)

      if (tokenUtxos.length === 0) {
        throw new Error(`No token UTXOs found to burn after filtering, for token ID ${tokenId}`)
      }

      // UTXOs array that contains the SLP UTXOs to burn
      // and the necessary BCH UTXOs to pay the fee
      const utxos = tokenUtxos.concat(bchUtxos)
      // console.log(`combined utxos: ${JSON.stringify(utxos, null, 2)}`)

      const txid = await this.sendBch.sendAllBch(
        walletInfo.cashAddress,
        walletInfo,
        utxos
      )

      return txid
    } catch (err) {
      console.error('Error in tokens.js/burnAll()')
      throw err
    }
  }
}

module.exports = Tokens

```

`/home/trout/work/psf/code/minimal-slp-wallet/lib/op-return.js`:

```js
/*
  This library contains utility functions for crafting transactions that
  contain an OP_RETURN output.
*/

// Public npm libraries
const bchDonation = require('bch-donation')

// Local libraries
const SendBCH = require('./send-bch')

const PSF_DONATION = 2000

class OpReturn {
  constructor (localConfig = {}) {
    // Dependency injection.
    this.bchjs = localConfig.bchjs
    if (!this.bchjs) {
      throw new Error(
        'Must pass instance of bch-js when instantiating OpReturn library.'
      )
    }
    this.ar = localConfig.ar
    if (!this.ar) {
      throw new Error('Must pass instance of Adapter Router.')
    }

    // Encapsulate dependencies.
    // this.bchjs = new BCHJS(localConfig)
    this.sendBch = new SendBCH(localConfig)
    // this.utxos = new Utxos(localConfig)
    // this.ar = new AdapterRouter({ bchjs: this.bchjs })
  }

  // Calculate the miner fee that needs to be paid for this transaction.
  // Takes the size of the OP_RETURN buffer size into account.
  calculateFee (numInputs, numOutputs, bufSize = 3, satsPerByte) {
    try {
      const byteCount = this.bchjs.BitcoinCash.getByteCount(
        { P2PKH: numInputs },
        { P2PKH: numOutputs + 1 }
      )

      // console.log(`satsPerByte: ${satsPerByte}`)

      let fee = Math.ceil(byteCount * satsPerByte)
      // console.log(`fee before op_return: ${fee}`)

      // Adjust for the buffer size of the op_return
      const minOpReturnFee = 10
      fee = fee + minOpReturnFee + Math.ceil(bufSize * satsPerByte)
      // console.log(`Fee with an OP_RETURN buffer size of ${bufSize}: ${fee}`)

      if (isNaN(fee)) {
        throw new Error('Invalid input. Fee could not be calculated.')
      }

      return fee
    } catch (err) {
      console.error('Error in send-bch.js/calculateFee()')
      throw err
    }
  }

  // Get the UTXOs required to generate a transaction.
  // Uses the smallest UTXOs first, which maximizes the number UTXOs used.
  // This helps reduce the total number UTXOs in the wallet, which is efficient
  // for limiting the number of network calls, and leads to better UX.
  getNecessaryUtxosAndChange (
    outputs,
    availableUtxos,
    bufLen,
    satsPerByte = 1.0
  ) {
    const sortedUtxos = this.sendBch.sortUtxosBySize(
      availableUtxos,
      'ASCENDING'
    )
    // console.log(`sortedUtxos: ${JSON.stringify(sortedUtxos, null, 2)}`)

    // const satsPerByte = 1.0

    // Calculate the miner fee, assuming inputs (this cost will be added later).
    // Change is assumed, that is the +1.
    const fee = this.calculateFee(0, outputs.length + 1, bufLen, satsPerByte)
    // console.log(`fee: ${fee}`)

    // Calculate the satoshis needed (minus the fee for each input)
    const satoshisToSend = outputs.reduce(
      (acc, receiver) => acc + receiver.amountSat,
      0
    )
    let satoshisNeeded = satoshisToSend + fee + PSF_DONATION
    // console.log(`satoshis needed: ${satoshisNeeded}`)

    let satoshisAvailable = 0
    const necessaryUtxos = []

    // Add each UTXO to the calculation until enough satoshis are found.
    for (const utxo of sortedUtxos) {
      // TODO: Check getTxOut() on the full node to verify the UTXO is valid.

      // TODO: Check the ancestor history to make sure the UTXO won't fail the
      // 50-chain limit rule.

      // Add the next UTXO.
      necessaryUtxos.push(utxo)
      satoshisAvailable += utxo.value

      // Additional cost per Utxo input is 148 sats for mining fees.
      satoshisNeeded += 148

      // Exit the loop once enough UTXOs are found to pay the the TX.
      if (satoshisAvailable >= satoshisNeeded) {
        break
      }
    }

    // Calculate the remainder or 'change' to send back to the sender.
    const change = satoshisAvailable - satoshisNeeded
    // console.log(`change: ${change}`)

    // If change is less than zero, something went wrong. Sanity check.
    if (change < 0) {
      console.error(
        `Available satoshis (${satoshisAvailable}) below needed satoshis (${satoshisNeeded}).`
      )
      throw new Error('Insufficient balance')
    }

    // console.log(`necessaryUtxos: ${JSON.stringify(necessaryUtxos, null, 2)}`)
    // console.log(`change: ${JSON.stringify(change, null, 2)}`)

    return { necessaryUtxos, change }
  }

  // Build the transaction for sending a TX with an OP_RETURN output.
  // Note: SLP token UTXOs should not be sent to this function. They will be
  // burned.
  // An optional prefix is expected, as a hex string. If not provided, it will
  // default to the memo.cash prefix for posting a 'tweet'.
  //
  // Other outputs can be added for sending BCH to. This can be useful for signaling.
  // The bchOutput array should contain objects with a 'address' and 'amountSat'
  // properties.
  //
  // The sats-per-byte can be increased from the default of 1, for times when
  // the blockchain is congested and a fee market occurs.
  async createTransaction (
    walletInfo,
    bchUtxos,
    msg = '', // OP_RETURN data in utf8 string format.
    prefix = '6d02', // Hex prefix. Replace with Lokad ID or memo.cash prefix.
    bchOutput = [], // Array of objects with address and amountSat property
    satsPerByte = 1.0
  ) {
    try {
      // console.log('createTransaction() start tokenUtxos: ', tokenUtxos)

      // If the BCH utxos array is still empty, then throw an error.
      if (!bchUtxos || bchUtxos.length === 0) {
        throw new Error('BCH UTXO list is empty')
      }

      // Generate the OP_RETURN data.
      const script = [
        this.bchjs.Script.opcodes.OP_RETURN,
        Buffer.from(prefix, 'hex'),
        Buffer.from(msg)
      ]
      const data = this.bchjs.Script.encode2(script)
      // console.log('data.length: ', data.length)

      // Generate the BCH output object.
      // const bchOutput = [
      //   {
      //     address: walletInfo.cashAddress,
      //     amountSat: 550 // dust
      //   }
      // ]

      // Determine the UTXOs needed to be spent for this TX, and the change
      // that will be returned to the wallet.
      const { necessaryUtxos, change } = this.getNecessaryUtxosAndChange(
        bchOutput,
        bchUtxos,
        data.length,
        satsPerByte
      )

      // Create an instance of the Transaction Builder.
      const transactionBuilder = new this.bchjs.TransactionBuilder()

      // Add BCH inputs
      necessaryUtxos.forEach(utxo => {
        transactionBuilder.addInput(utxo.tx_hash, utxo.tx_pos)
      })

      // console.log('tokens.js tokenUtxos: ', tokenUtxos)

      // Add the OP_RETURN as the second output of the transaction.
      transactionBuilder.addOutput(data, 0)

      // Send a 2000 sat donation to PSF to thank them for creating this awesome software.
      // console.log(`psf: ${bchDonation('psf').donations}`)
      transactionBuilder.addOutput(bchDonation('psf').donations, PSF_DONATION)

      // Send change back to the wallet, if it's bigger than dust.
      // console.log(`change: ${change}`)
      // console.log(`walletInfo.cashAddress: ${walletInfo.cashAddress}`)
      if (change && change > 546) {
        transactionBuilder.addOutput(walletInfo.cashAddress, change)
      }

      // Add any additional outputs specified by the user.
      for (let i = 0; i < bchOutput.length; i++) {
        const thisOutput = bchOutput[i]
        transactionBuilder.addOutput(thisOutput.address, thisOutput.amountSat)
      }

      // Generate a key pair from the mnemonic.
      const keyPair = await this.sendBch.getKeyPairFromMnemonic(walletInfo)

      // Sign each UTXO that is about to be spent.
      necessaryUtxos.forEach((utxo, i) => {
        let redeemScript

        transactionBuilder.sign(
          i,
          keyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.value
        )
      })

      // Build the transaction, return the compiled transaction in hex format.
      const tx = transactionBuilder.build()
      return { hex: tx.toHex(), txid: tx.getId() }
    } catch (err) {
      console.error('Error in op-return.js/createTransaction()')
      throw err
    }
  }

  // Generate and broadcast a TX with an OP_RETURN output. Returns the TXID
  // of the transaction.
  async sendOpReturn (
    wallet,
    bchUtxos,
    msg = '',
    prefix = '6d02', // Default to memo.cash
    bchOutput = [],
    satsPerByte = 1.0
  ) {
    const { hex } = await this.createTransaction(
      wallet,
      bchUtxos,
      msg,
      prefix,
      bchOutput,
      satsPerByte
    )

    // Broadcast the transaction to the network.
    const txid = await this.ar.sendTx(hex)

    return txid
  }
}

module.exports = OpReturn

```

`/home/trout/work/psf/code/minimal-slp-wallet/LICENSE.md`:

```md
The MIT License (MIT)
Copyright (c) 2021-2022 Chris Troutner <chris.troutner@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

```

`/home/trout/work/psf/code/minimal-slp-wallet/dev-docs/README.md`:

```md
# Developer Documentation

The minimal-slp-wallet library is used to tie in the [psf-bch-wallet](https://github.com/Permissionless-Software-Foundation/psf-bch-wallet) command line wallet and the [gatsby-ipfs-web-wallet](https://github.com/Permissionless-Software-Foundation/gatsby-ipfs-web-wallet) web wallet. They both leverage minimal-slp-wallet as the 'wallet engine'.

This is highly complimentary, as psf-bch-wallet can be used for rapid prototyping and debugging. The web wallet is slower to develop on, but makes for a more accessible (non-developer) UI.

![Dependency diagram](./images/dep-diagram.png)

```

`/home/trout/work/psf/code/minimal-slp-wallet/examples/burn-all-tokens.js`:

```js
/*
  An example for burning tokens with this library.
*/

const SlpWallet = require('../index')

async function burnTokens () {
  try {
    // Replace the values for the constants below to customize for your use.
    const MNEMONIC =
      'essence appear intact casino neck scatter search post cube fit door margin'
    // bitcoincash:qzl40sfyyqlmgc44y6rqjsarpyr3j9alnqyuqcwjc5
    const TOKENID =
      '6201f3efe486c577433622817b99645e1d473cd3882378f9a0efc128ab839a82'

    // Instantiate the wallet library.
    const slpWallet = new SlpWallet(MNEMONIC)

    // Wait for the wallet to be created.
    await slpWallet.walletInfoPromise

    console.log(`wallet info: ${JSON.stringify(slpWallet.walletInfo, null, 2)}`)

    // console.log('slpWallet.utxos.utxoStore: ', slpWallet.utxos.utxoStore)

    // Get the balance of the wallet.
    const balance = await slpWallet.getBalance()
    console.log(`balance: ${balance} satoshis`)

    // Exit if the wallet has no balance.
    if (balance === 0) {
      console.log(
        `The balance of your wallet is zero. Send BCH to ${
          slpWallet.walletInfo.address
        } to run this example.`
      )
      return
    }

    const txid = await slpWallet.burnAll(TOKENID)

    console.log(`Success! Tokens burnt with TXID: ${txid}`)
  } catch (err) {
    console.error('Error: ', err)
  }
}
burnTokens()

```

`/home/trout/work/psf/code/minimal-slp-wallet/examples/send-bch.js`:

```js
/*
  An example for sending BCH with this library.
*/

const SlpWallet = require('../index')

async function sendBch () {
  try {
    // Replace the values for the constants below to customize for your use.
    const MNEMONIC =
      'essence appear intact casino neck scatter search post cube fit door margin'
    const RECIEVER = ''
    const SATS_TO_SEND = 1000

    // Instantiate the wallet library.
    const slpWallet = new SlpWallet(MNEMONIC)

    // Wait for the wallet to be created.
    await slpWallet.walletInfoPromise

    // Get the balance of the wallet.
    const balance = await slpWallet.getBalance()
    console.log(`balance: ${balance} satoshis`)

    // Exit if the wallet has no balance.
    if (balance === 0) {
      console.log(
        `The balance of your wallet is zero. Send BCH to ${
          slpWallet.walletInfo.address
        } to run this example.`
      )
      return
    }

    // Create the outputs array.
    const outputs = []

    // If reciever is not specified, send the funds back to the wallet.
    if (RECIEVER === '') {
      outputs.push({
        address: slpWallet.walletInfo.address,
        amountSat: SATS_TO_SEND
      })
    //
    // Send the funds to the reciever.
    } else {
      outputs.push({
        address: RECIEVER,
        amountSat: SATS_TO_SEND
      })
    }

    const txid = await slpWallet.send(outputs)

    console.log(`Success! BCH sent with TXID: ${txid}`)
  } catch (err) {
    console.error('Error: ', err)
  }
}
sendBch()

```

`/home/trout/work/psf/code/minimal-slp-wallet/examples/list-tokens.js`:

```js
/*
  An example for listing the tokens and token balances of the wallet. a
*/

const SlpWallet = require('../index')

async function listTokens () {
  try {
    // Replace the values for the constants below to customize for your use.
    const MNEMONIC =
      'essence appear intact casino neck scatter search post cube fit door margin'

    // Instantiate the wallet library.
    const slpWallet = new SlpWallet(MNEMONIC)

    // Wait for the wallet to be created.
    await slpWallet.walletInfoPromise

    // Get the token summary
    const tokenInfo = await slpWallet.listTokens()
    console.log(`tokenInfo: ${JSON.stringify(tokenInfo, null, 2)}`)
  } catch (err) {
    console.error('Error: ', err)
  }
}
listTokens()

```

`/home/trout/work/psf/code/minimal-slp-wallet/examples/validate-utxo.js`:

```js
/*
  An example for checking if a UTXO is still valid and spendable.
*/

const SlpWallet = require('../index')

async function validateUtxo () {
  try {
    const utxo = {
      txid: 'b94e1ff82eb5781f98296f0af2488ff06202f12ee92b0175963b8dba688d1b40',
      vout: 0
    }

    // Instantiate the wallet library.
    const slpWallet = new SlpWallet(undefined, { interface: 'consumer-api' })

    // Wait for the wallet to be created.
    await slpWallet.walletInfoPromise

    // Get the token summary
    const isValid = await slpWallet.utxoIsValid(utxo)
    console.log(`UTXO is valid: ${isValid}`)
  } catch (err) {
    console.error('Error: ', err)
  }
}
validateUtxo()

```

`/home/trout/work/psf/code/minimal-slp-wallet/examples/get-token-data.js`:

```js
/*
  An example for getting data on an SLP token. This example token includes
  mutable and immutable data.
*/

const SlpWallet = require('../index')

async function getTokenDataExample () {
  try {
    const tokenId = '59a62f35b0882b7c0ed80407d9190b460cc566cb6c01ed4817ad64f9d2508702'

    // Instantiate the wallet library.
    const slpWallet = new SlpWallet(undefined, { interface: 'consumer-api' })

    // Wait for the wallet to be created.
    await slpWallet.walletInfoPromise

    // Get token data
    const tokenData = await slpWallet.getTokenData(tokenId)
    console.log(`tokenData: ${JSON.stringify(tokenData, null, 2)}`)
  } catch (err) {
    console.error('Error: ', err)
  }
}
getTokenDataExample()

```

`/home/trout/work/psf/code/minimal-slp-wallet/examples/send-tokens.js`:

```js
/*
  An example for sending tokens with this library.
*/

const SlpWallet = require('../index')

async function sendTokens () {
  try {
    // Replace the values for the constants below to customize for your use.
    const MNEMONIC =
      'essence appear intact casino neck scatter search post cube fit door margin'
    const RECIEVER = ''
    const TOKENID =
      '82e3d97b3cd033e60ffa755450b9075cf44fe1b2f6d5dc13657d8263e716b6a5'
    const TOKENS_TO_SEND = 1

    // Instantiate the wallet library.
    const slpWallet = new SlpWallet(MNEMONIC)

    // Wait for the wallet to be created.
    await slpWallet.walletInfoPromise

    // console.log('slpWallet.utxos.utxoStore: ', slpWallet.utxos.utxoStore)

    // Get the balance of the wallet.
    const balance = await slpWallet.getBalance()
    console.log(`balance: ${balance} satoshis`)

    // Exit if the wallet has no balance.
    if (balance === 0) {
      console.log(
        `The balance of your wallet is zero. Send BCH to ${
          slpWallet.walletInfo.address
        } to run this example.`
      )
      return
    }

    // Create the outputs array.
    let output = {}

    // If reciever is not specified, send the funds back to the wallet.
    if (RECIEVER === '') {
      output = {
        address: slpWallet.walletInfo.address,
        tokenId: TOKENID,
        qty: TOKENS_TO_SEND
      }
      //
      // Send the funds to the reciever.
    } else {
      output = {
        address: RECIEVER,
        tokenId: TOKENID,
        qty: TOKENS_TO_SEND
      }
    }

    const txid = await slpWallet.sendTokens(output)

    console.log(`Success! Tokens sent with TXID: ${txid}`)
  } catch (err) {
    console.error('Error: ', err)
  }
}
sendTokens()

```

`/home/trout/work/psf/code/minimal-slp-wallet/examples/create-wallet.js`:

```js
/*
  An example app for creating a wallet using this library.
*/

const BchWallet = require('../index')

async function createWallet () {
  try {
    // Instantiate the wallet library.
    const bchWallet = new BchWallet()

    // Wait for the wallet to be created.
    await bchWallet.walletInfoPromise

    // Print out the wallet information.
    console.log(
      `Wallet information: ${JSON.stringify(bchWallet.walletInfo, null, 2)}`
    )
  } catch (err) {
    console.error('Error: ', err)
  }
}
createWallet()

```

`/home/trout/work/psf/code/minimal-slp-wallet/examples/burn-some-tokens.js`:

```js
/*
  An example for burning tokens with this library.
*/

const SlpWallet = require('../index')

async function burnTokens () {
  try {
    // Replace the values for the constants below to customize for your use.
    const MNEMONIC =
      'essence appear intact casino neck scatter search post cube fit door margin'
    // bitcoincash:qzl40sfyyqlmgc44y6rqjsarpyr3j9alnqyuqcwjc5
    const TOKENID =
      '6201f3efe486c577433622817b99645e1d473cd3882378f9a0efc128ab839a82'
    const TOKENS_TO_BURN = 0.1

    // Instantiate the wallet library.
    const slpWallet = new SlpWallet(MNEMONIC)

    // Wait for the wallet to be created.
    await slpWallet.walletInfoPromise

    console.log(`wallet info: ${JSON.stringify(slpWallet.walletInfo, null, 2)}`)

    // console.log('slpWallet.utxos.utxoStore: ', slpWallet.utxos.utxoStore)

    // Get the balance of the wallet.
    const balance = await slpWallet.getBalance()
    console.log(`balance: ${balance} satoshis`)

    // Exit if the wallet has no balance.
    if (balance === 0) {
      console.log(
        `The balance of your wallet is zero. Send BCH to ${
          slpWallet.walletInfo.address
        } to run this example.`
      )
      return
    }

    const txid = await slpWallet.burnTokens(TOKENS_TO_BURN, TOKENID)

    console.log(`Success! Tokens burnt with TXID: ${txid}`)
  } catch (err) {
    console.error('Error: ', err)
  }
}
burnTokens()

```

`/home/trout/work/psf/code/minimal-slp-wallet/package.json`:

```json
{
  "name": "minimal-slp-wallet",
  "version": "5.0.0",
  "description": "A minimalist Bitcoin Cash (BCH) wallet npm library, for use in a web apps.",
  "main": "./index.js",
  "module": "./dist/minimal-slp-wallet.min.js",
  "scripts": {
    "start": "node index.js",
    "test": "TEST=unit nyc mocha test/unit/",
    "test:integration": "mocha --timeout 35000 test/integration/",
    "test:temp": "mocha --timeout 25000 -g '#UTXOs' test/integration/",
    "lint": "standard --env mocha --fix",
    "docs": "./node_modules/.bin/apidoc -i lib/ -o docs",
    "coverage": "nyc report --reporter=text-lcov | coveralls",
    "coverage:report": "nyc --reporter=html mocha test/unit/ --exit",
    "build": "browserify index.js -p tinyify --s SlpWallet -o dist/minimal-slp-wallet.min.js"
  },
  "keywords": [
    "bitcoin",
    "bitcoin cash",
    "wallet",
    "javascript",
    "cryptocurrency",
    "react",
    "front end",
    "client",
    "apidoc",
    "slp",
    "tokens"
  ],
  "author": "Chris Troutner <chris.troutner@gmail.com>",
  "license": "MIT",
  "apidoc": {
    "title": "minimal-slp-wallet",
    "url": "localhost:5000"
  },
  "repository": "Permissionless-Software-Foundation/minimal-slp-wallet",
  "dependencies": {
    "@chris.troutner/retry-queue-commonjs": "1.0.8",
    "@psf/bch-js": "6.8.0",
    "apidoc": "0.51.0",
    "bch-consumer": "1.6.2",
    "bch-donation": "1.1.2",
    "crypto-js": "4.0.0"
  },
  "devDependencies": {
    "browserify": "17.0.0",
    "chai": "4.2.0",
    "coveralls": "3.1.0",
    "eslint": "7.17.0",
    "eslint-config-prettier": "7.1.0",
    "eslint-config-standard": "16.0.2",
    "eslint-plugin-node": "11.1.0",
    "eslint-plugin-prettier": "3.3.1",
    "eslint-plugin-standard": "4.0.1",
    "husky": "4.3.8",
    "lodash.clonedeep": "4.5.0",
    "mocha": "9.2.1",
    "nyc": "15.1.0",
    "semantic-release": "19.0.3",
    "sinon": "9.2.0",
    "standard": "16.0.4",
    "tinyify": "3.0.0"
  },
  "release": {
    "publish": [
      {
        "path": "@semantic-release/npm",
        "npmPublish": true
      }
    ]
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run build"
    }
  },
  "exports": {
    ".": {
      "import": {
        "browser": "./dist/minimal-slp-wallet.min.js",
        "node": "./index.js",
        "default": "./index.js"
      },
      "require": {
        "default": "./index.js"
      }
    }
  }
}

```
