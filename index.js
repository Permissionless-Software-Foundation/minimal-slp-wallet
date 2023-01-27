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
    this.getKeyPair = this.getKeyPair.bind(this)
    this.optimize = this.optimize.bind(this)
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
  async getBalance (bchAddress) {
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
  async optimize () {
    return await this.consolidateUtxos.start()
  }

  // Get token icon and other media
  async getPubKey (addr) {
    return await this.ar.getPubKey(addr)
  }

  // Broadcast a hex-encoded TX to the network
  async broadcast (hex) {
    return await this.ar.sendTx(hex)
  }
}

module.exports = MinimalBCHWallet
