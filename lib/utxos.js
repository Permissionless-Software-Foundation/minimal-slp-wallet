/*
  A utility library for handling, analyzing, and maintaining a collection of UTXOs.
*/

const BCHJS = require('@chris.troutner/bch-js')

let _this

class UTXOs {
  constructor () {
    _this = this

    _this.bchjs = new BCHJS()
  }
}

module.exports = UTXOs
