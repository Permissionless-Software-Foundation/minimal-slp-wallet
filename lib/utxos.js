/*
  A utility library for handling, analyzing, and maintaining a collection of UTXOs.
*/

const BCHJS = require('@chris.troutner/bch-js')

let _this

class UTXOs {
  constructor () {
    // _this is a local global variable for when 'this' loses scope.
    _this = this

    // Encapsulate dependencies.
    _this.bchjs = new BCHJS()

    // UTXO storage. Used as a cache for UTXO information to reduce the number
    // of network calls required to retrieve a UTXO.
    _this.utxoStore = []
  }

  // Get raw UTXOs from the ElectrumX indexer.
  async getUtxos (addr) {
    try {
      const utxos = await _this.bchjs.Electrumx.utxo(addr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      if (!utxos.success) throw new Error(`Could not get UTXOs for ${addr}`)

      return utxos.utxos
    } catch (err) {
      console.error('Error in utxos.js/getUtxos()')
      throw err
    }
  }

  // Hydrate an array of UTXOs with SLP token data.
  async hydrate (utxos) {
    try {
      const details = await _this.bchjs.SLP.Utils.tokenUtxoDetails(utxos)
      // console.log(`details: ${JSON.stringify(details, null, 2)}`)

      // Match up the hydrated and non-hydrated utxos

      return details
    } catch (err) {
      console.error('Error in utxos.js/hydrate()')
      throw err
    }
  }

  // Initialize the utxoStore.
  // The UTXO store is cleared and refreshed with hydrated UTXO information.
  // Given a BCH address, the UTXOs for that address are retrieved, UTXOs are
  // hydrated with token information, and then saved to the utxoStore.
  async initUtxoStore (addr) {
    try {
      // Clear the utxo store.
      _this.utxoStore = []

      // Get UTXOs for the address.
      const utxos = await _this.getUtxos(addr)

      // Hydrate the UTXOs.
      const tokenInfo = await _this.hydrate(utxos)

      // Save information to the UTXO store.
      _this.utxoStore = tokenInfo

      // Return the utxo Store.
      return _this.utxoStore
    } catch (err) {
      console.error('Error in utxos.js/initUtxoStore()')
      throw err
    }
  }
}

module.exports = UTXOs
