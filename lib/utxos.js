/*
  A utility library for handling, analyzing, and maintaining a collection of UTXOs.

  TODO:

*/

const BCHJS = require('@psf/bch-js')

// let _this

class UTXOs {
  constructor (config) {
    // Encapsulate dependencies.
    this.bchjs = new BCHJS(config)
    // this.bchjs = new BCHJS({ restURL: 'http://localhost:3000/v3/' })

    // UTXO storage. Used as a cache for UTXO information to reduce the number
    // of network calls required to retrieve a UTXO.
    this.utxoStore = []

    this.temp = []

    // This should be the last command in the constructor.
    // _this is a local global variable for when 'this' loses scope.
    // _this = this
  }

  // Replaces the old initUtxosStore() method.
  async initUtxoStore (addr) {
    try {
      // Clear the utxo store.
      this.utxoStore = []

      const utxos = await this.bchjs.Utxo.get(addr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      this.utxoStore = utxos[0]

      return this.utxoStore
    } catch (err) {
      console.error('Error in utxos.js/initUtxoStore()')
      throw err
    }
  }

  // Return the token UTXOs that are spendible. This includes Type 1, Group, and
  // NFT tokens. It ignores minting batons.
  getSpendableTokenUtxos () {
    try {
      const tokenUtxos = this.utxoStore.slpUtxos.type1.tokens.concat(
        this.utxoStore.slpUtxos.nft.groupTokens,
        this.utxoStore.slpUtxos.nft.tokens
      )
      // console.log(`getSpendableTokenUtxos tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)

      return tokenUtxos
    } catch (err) {
      console.error('Error in utxos.js/getSpendableTokenUtxos()')
      throw err
    }
  }
}

module.exports = UTXOs
