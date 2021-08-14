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
const utxoMocks = require('./test/unit/mocks/utxo-mocks')
const AdapterRouter = require('./lib/adapters/router')

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

    // Set the sats-per-byte fee rate.
    this.fee = 1.2
    if (this.advancedOptions.fee) {
      this.fee = this.advancedOptions.fee
    }

    // Allow passing of noUpdate flag, to prevent automatic UTXO retrieval
    // after wallet is created.
    this.noUpdate = false
    if (this.advancedOptions.noUpdate) this.noUpdate = true
    // END Handle advanced options.

    // Encapsulae the external libraries.
    this.crypto = crypto
    this.BCHJS = BCHJS
    this.bchjs = new BCHJS(bchjsOptions)
    bchjsOptions.bchjs = this.bchjs

    // Instantiate the adapter router.
    if (advancedOptions.interface === 'json-rpc') {
      if (!advancedOptions.jsonRpcWalletService) {
        throw new Error(
          'Must pass wallet service instance if using json-rpc interface.'
        )
      }

      bchjsOptions.interface = 'json-rpc'
      bchjsOptions.jsonRpcWalletService = advancedOptions.jsonRpcWalletService
    }
    this.ar = new AdapterRouter(bchjsOptions)
    bchjsOptions.ar = this.ar

    // Instantiate local libraries.
    this.sendBch = new SendBCH(bchjsOptions)
    this.utxos = new Utxos(bchjsOptions)
    this.tokens = new Tokens(bchjsOptions)

    this.temp = []

    // this = this

    // The create() function returns a promise. When it resolves, the
    // walletInfoCreated flag will be set to true. The instance will also
    // have a new `walletInfo` property that will contain the wallet information.
    this.walletInfoCreated = false
    this.walletInfoPromise = this.create(hdPrivateKeyOrMnemonic)
  }

  // Create a new wallet. Returns a promise that resolves into a wallet object.
  async create (mnemonic) {
    // return new Promise(async (resolve, reject) => {
    try {
      // Attempt to decrypt mnemonic if password is provided.
      if (mnemonic && this.advancedOptions.password) {
        mnemonic = this.decrypt(mnemonic, this.advancedOptions.password)
      }

      // TODO: Detect if mnemonic is actually a WIF, and handle accordingly.
      // A WIF will start with L or K, and will have no spaces.

      // Generate the HD wallet.
      mnemonic = mnemonic || this.bchjs.Mnemonic.generate(128)
      const rootSeedBuffer = await this.bchjs.Mnemonic.toSeed(mnemonic)
      const masterHDNode = this.bchjs.HDNode.fromSeed(rootSeedBuffer)
      const childNode = masterHDNode.derivePath(this.hdPath)
      const privateKey = this.bchjs.HDNode.toWIF(childNode)
      const publicKey = this.bchjs.HDNode.toPublicKey(childNode)

      const walletInfo = {}

      // Encrypt the mnemonic if a password is provided.
      if (this.advancedOptions.password) {
        walletInfo.mnemonicEncrypted = this.encrypt(
          mnemonic,
          this.advancedOptions.password
        )
      }

      // Set the wallet properties.
      walletInfo.mnemonic = mnemonic
      walletInfo.privateKey = privateKey
      walletInfo.publicKey = publicKey.toString('hex')
      walletInfo.address = walletInfo.cashAddress = this.bchjs.HDNode.toCashAddress(
        childNode
      )
      walletInfo.slpAddress = this.bchjs.SLP.Address.toSLPAddress(
        walletInfo.address
      )
      walletInfo.legacyAddress = this.bchjs.HDNode.toLegacyAddress(childNode)
      walletInfo.hdPath = this.hdPath

      // Do not update the wallet UTXOs if noUpdate flag is set.
      if (!this.noUpdate) {
        // Get any  UTXOs for this wallet.
        await this.utxos.initUtxoStore(walletInfo.address)
      }

      this.walletInfoCreated = true
      this.walletInfo = walletInfo
    } catch (err) {
      // return reject(err)
      console.error('Error in create()')
      throw err
    }
    // })
  }

  // Get the UTXO information for this wallet.
  getUtxos () {
    return this.utxos.initUtxoStore(this.walletInfo.address)
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
    const addr = bchAddress || this.walletInfo.cashAddress
    const balances = await this.bchjs.Electrumx.balance(addr)

    return balances.balance.confirmed + balances.balance.unconfirmed
  }

  // Get transactions associated with the wallet.
  async getTransactions (bchAddress) {
    const addr = bchAddress || this.walletInfo.cashAddress
    const data = await this.bchjs.Electrumx.transactions(addr)

    const transactions = data.transactions.map(x => x.tx_hash)
    return transactions
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
          fee: this.fee
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
  sendTokens (output, satsPerByte) {
    try {
      // console.log(`utxoStore: ${JSON.stringify(this.utxos.utxoStore, null, 2)}`)

      // If mining fee is not specified, use the value assigned in the constructor.
      if (!satsPerByte) satsPerByte = this.fee

      // Combine all Type 1, Group, and NFT token UTXOs. Ignore minting batons.
      const tokenUtxos = this.utxos.getSpendableTokenUtxos()

      return this.tokens.sendTokens(
        output,
        this.walletInfo,
        // this.utxos.bchUtxos,
        this.utxos.utxoStore.bchUtxos,
        // this.utxos.tokenUtxos,
        tokenUtxos,
        satsPerByte
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
          fee: this.fee
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
      return this.tokens.burnAll(
        tokenId,
        this.walletInfo,
        this.utxos.utxoStore.bchUtxos,
        tokenUtxos
      )
    } catch (err) {
      console.error('Error in burnAll()')
      throw err
    }
  }
}

module.exports = MinimalBCHWallet
