/*
  An npm JavaScript library for front end web apps. Implements a minimal
  Bitcoin Cash wallet.
*/

'use strict'

const BCHJS = require('@chris.troutner/bch-js')
const crypto = require('crypto-js')

let _this

class MinimalBCHWallet {
  constructor (hdPrivateKeyOrMnemonic, advancedOptions) {
    this.advancedOptions = advancedOptions || {}

    this.HdPath = this.advancedOptions.HdPath || "m/44'/245'/0'/0/0"

    // Encapsulae the external libraries.
    this.BCHJS = BCHJS
    this.bchjs = new BCHJS()
    this.crypto = crypto

    _this = this

    this.walletInfo = this.create(hdPrivateKeyOrMnemonic)
  }

  // Create a new wallet.
  async create (mnemonic) {
    // Attempt to decrypt mnemonic if password is provided.
    if (mnemonic && this.advancedOptions.password) {
      mnemonic = this.decrypt(mnemonic, this.advancedOptions.password)
    }

    // Generate the HD wallet.
    mnemonic = mnemonic || _this.bchjs.Mnemonic.generate(128)
    const rootSeedBuffer = await _this.bchjs.Mnemonic.toSeed(mnemonic)
    const masterHDNode = _this.bchjs.HDNode.fromSeed(rootSeedBuffer)
    const childNode = masterHDNode.derivePath(this.HdPath)
    const privateKey = _this.bchjs.HDNode.toWIF(childNode)

    // Encrypt the mnemonic if a password is provided.
    if (this.advancedOptions.password) {
      this.mnemonicEncrypted = this.encrypt(mnemonic, this.advancedOptions.password)
    }

    // Set the wallet properties.
    this.mnemonic = mnemonic
    this.privateKey = privateKey
    this.address = this.cashAddress = _this.bchjs.HDNode.toCashAddress(
      childNode
    )
    this.slpAddress = _this.bchjs.SLP.Address.toSLPAddress(this.address)
    this.legacyAddress = _this.bchjs.HDNode.toLegacyAddress(childNode)
  }

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

  encrypt (mnemonic, password) {
    return this.crypto.AES.encrypt(mnemonic, password).toString()
  }

  async getBalance (bchAddress) {
    const addr = bchAddress || this.cashAddress
    const balances = await this.bchjs.Electrumx.balance(addr)

    return balances.balance.confirmed + balances.balance.unconfirmed
  }

  async getTransactions (bchAddress) {
    const addr = bchAddress || this.cashAddress
    const data = await this.bchjs.Electrumx.transactions(addr)

    const transactions = data.transactions.map(x => x.tx_hash)
    return transactions
  }
}

module.exports = MinimalBCHWallet
