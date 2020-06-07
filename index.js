/*
  An npm JavaScript library for front end web apps. Implements a minimal
  Bitcoin Cash wallet.
*/

'use strict'

const BCHJS = require('@chris.troutner/bch-js')
// const CryptoJS = require('crypto-js')

let _this

class MinimalBCHWallet {
  constructor (hdPrivateKeyOrMnemonic, advancedOptions) {
    this.advancedOptions = advancedOptions || {}

    this.HdPath = this.advancedOptions.HdPath || "m/44'/245'/0'/0/0"

    // Encapsulae the bchjs library.
    this.BCHJS = BCHJS
    this.bchjs = new BCHJS()

    _this = this

    this.create(hdPrivateKeyOrMnemonic)
  }

  // Create a new wallet.
  async create (mnemonic) {
    // if (mnemonic && this.advancedOptions.password) {
    //   mnemonic = SimpleWallet.decrypt(mnemonic, this.advancedOptions.password);
    // }

    mnemonic = mnemonic || _this.bchjs.Mnemonic.generate(128)
    const rootSeedBuffer = await _this.bchjs.Mnemonic.toSeed(mnemonic)
    const masterHDNode = _this.bchjs.HDNode.fromSeed(rootSeedBuffer)
    const childNode = masterHDNode.derivePath(this.HdPath)
    const privateKey = _this.bchjs.HDNode.toWIF(childNode)

    // if (this.advancedOptions.password) {
    //   this.mnemonicEncrypted = SimpleWallet.encrypt(mnemonic, this.advancedOptions.password);
    // }

    this.mnemonic = mnemonic
    this.privateKey = privateKey
    this.address = this.cashAddress = _this.bchjs.HDNode.toCashAddress(childNode)
    this.slpAddress = _this.bchjs.SLP.Address.toSLPAddress(this.address)
    this.legacyAddress = _this.bchjs.HDNode.toLegacyAddress(childNode)
  }
}

module.exports = MinimalBCHWallet
