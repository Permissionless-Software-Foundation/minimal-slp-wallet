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

let _this

class MinimalBCHWallet {
  constructor (hdPrivateKeyOrMnemonic, advancedOptions) {
    this.advancedOptions = advancedOptions || {}

    // BEGIN Handle advanced options.
    // HD Derivation path.
    this.hdPath = this.advancedOptions.hdPath || "m/44'/245'/0'/0/0"

    // bch-js options.
    const bchjsOptions = {}
    if (this.advancedOptions.restURL) {
      bchjsOptions.restURL = advancedOptions.restURL
    }

    if (this.advancedOptions.apiToken) {
      bchjsOptions.apiToken = advancedOptions.apiToken
    }

    // Allow passing of test flag for unit tests.
    this.isTest = false
    if (this.advancedOptions.test) this.isTest = true
    // END Handle advanced options.

    // Encapsulae the external libraries.
    this.crypto = crypto
    this.BCHJS = BCHJS
    this.bchjs = new BCHJS(bchjsOptions)

    // Instantiate local libraries.
    this.sendBch = new SendBCH()
    this.utxos = new Utxos()
    this.tokens = new Tokens()

    // Overwrite the dependencies copy of bchjs with this current instance.
    this.sendBch.bchjs = this.bchjs
    this.utxos.bchjs = this.bchjs
    this.tokens.bchjs = this.bchjs
    this.tokens.sendBch = this.sendBch
    this.tokens.utxos = this.utxos

    this.temp = []

    _this = this

    // The create() function returns a promise. When it resolves, the
    // walletInfoCreated flag will be set to true. The instance will also
    // have a new walletInfo property that will contain the wallet information.
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

      // Generate the HD wallet.
      mnemonic = mnemonic || _this.bchjs.Mnemonic.generate(128)
      const rootSeedBuffer = await _this.bchjs.Mnemonic.toSeed(mnemonic)
      const masterHDNode = _this.bchjs.HDNode.fromSeed(rootSeedBuffer)
      const childNode = masterHDNode.derivePath(this.hdPath)
      const privateKey = _this.bchjs.HDNode.toWIF(childNode)

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
      walletInfo.address = walletInfo.cashAddress = _this.bchjs.HDNode.toCashAddress(
        childNode
      )
      walletInfo.slpAddress = _this.bchjs.SLP.Address.toSLPAddress(
        walletInfo.address
      )
      walletInfo.legacyAddress = _this.bchjs.HDNode.toLegacyAddress(childNode)
      walletInfo.hdPath = _this.hdPath

      // return resolve(walletInfo)
      // return walletInfo

      if (this.isTest) {
        _this.utxos.utxoStore = utxoMocks.mockUtxoStore
        _this.utxos.bchUtxos = utxoMocks.mockBchUtxos
        _this.utxos.tokenUtxos = utxoMocks.mockTokenUtxos
      } else {
        // Get any  UTXOs for this wallet.
        await _this.utxos.initUtxoStore(walletInfo.address)
      }

      _this.walletInfoCreated = true
      _this.walletInfo = walletInfo
    } catch (err) {
      // return reject(err)
      console.error('Error in create()')
      throw err
    }
    // })
  }

  // Get the UTXO information for this wallet.
  getUtxos () {
    return _this.utxos.initUtxoStore()
  }

  // Encrypt the mnemonic of the wallet.
  encrypt (mnemonic, password) {
    return this.crypto.AES.encrypt(mnemonic, password).toString()
  }

  // Decrypte the mnemonic of the wallet.
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
      return _this.sendBch.sendBch(
        outputs,
        {
          mnemonic: _this.walletInfo.mnemonic,
          cashAddress: _this.walletInfo.address,
          hdPath: _this.walletInfo.hdPath
        },
        _this.utxos.bchUtxos
      )
    } catch (err) {
      console.error('Error in send()')
      throw err
    }
  }

  // Send Tokens. Returns a promise that resolves into a TXID.
  // This is a wrapper for the tokens.js library.
  sendTokens (output, satsPerByte = 1.0) {
    try {
      return _this.tokens.sendTokens(
        output,
        _this.walletInfo,
        _this.utxos.bchUtxos,
        _this.utxos.tokenUtxos,
        satsPerByte
      )
    } catch (err) {
      console.error('Error in send()')
      throw err
    }
  }

  // Return information on SLP tokens held by this wallet.
  listTokens (slpAddress) {
    const addr = slpAddress || this.walletInfo.slpAddress

    return _this.tokens.listTokensFromAddress(addr)
  }
}

module.exports = MinimalBCHWallet
