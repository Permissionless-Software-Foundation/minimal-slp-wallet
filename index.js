/*
  An npm JavaScript library for front end web apps. Implements a minimal
  Bitcoin Cash wallet.
*/

/* eslint-disable no-async-promise-executor */

'use strict'

const BCHJS = require('@chris.troutner/bch-js')
const crypto = require('crypto-js')

const SendBCH = require('./lib/send-bch')

let _this

class MinimalBCHWallet {
  constructor (hdPrivateKeyOrMnemonic, advancedOptions) {
    this.advancedOptions = advancedOptions || {}

    this.hdPath = this.advancedOptions.hdPath || "m/44'/245'/0'/0/0"

    // Encapsulae the external libraries.
    this.BCHJS = BCHJS
    this.bchjs = new BCHJS()
    this.crypto = crypto
    this.sendBch = new SendBCH()

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

      _this.walletInfoCreated = true
      _this.walletInfo = walletInfo
    } catch (err) {
      // return reject(err)
      console.error('Error in create()')
      throw err
    }
    // })
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
      return _this.sendBch.sendBch(outputs, {
        mnemonic: _this.walletInfo.mnemonic,
        cashAddress: _this.walletInfo.address,
        hdPath: _this.walletInfo.hdPath
      })
    } catch (err) {
      console.error('Error in send()')
      throw err
    }
  }
}

module.exports = MinimalBCHWallet
