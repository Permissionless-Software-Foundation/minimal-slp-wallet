/*
  An example project illustrating how to use JS classes, introduced in
  ECMAScript 2015.
*/

'use strict'

const BCHJS = require("@chris.troutner/bch-js")

class MinimalBCHWallet {
  constructor(hdPrivateKeyOrMnemonic, advancedOptions) {
    this.advancedOptions = (advancedOptions || {})

    this.HdPath = this.advancedOptions.HdPath || `m/44'/245'/0'/0/0`;

    this.create(hdPrivateKeyOrMnemonic);

    // Encapsulae the bchjs library.
    this.BCHJS = BCHJS
}

module.exports = MinimalBCHWallet
