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
