/*
  A utility library for handling, analyzing, and maintaining a collection of UTXOs.
*/

const BCHJS = require('@psf/bch-js')

let _this

class UTXOs {
  constructor () {
    // Encapsulate dependencies.
    this.bchjs = new BCHJS()

    // UTXO storage. Used as a cache for UTXO information to reduce the number
    // of network calls required to retrieve a UTXO.
    this.utxoStore = []

    // These arrays should reflect the utxoStore above, but split the data into
    // BCH-only and token-colored UTXOs.
    this.bchUtxos = []
    this.tokenUtxos = []

    this.temp = []

    // This should be the last command in the constructor.
    // _this is a local global variable for when 'this' loses scope.
    _this = this
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
    // Match up the hydrated and non-hydrated utxos
    try {
      // Validate input
      if (!Array.isArray(utxos)) throw new Error('Input must be an array')

      const limit = 20 // chunk limits
      const chunks = await _this.getArrayChunks(utxos, limit)

      let details = []
      for (let i = 0; i < chunks.length; i++) {
        const utxosToHydrate = chunks[i]
        // Request option
        const options = {
          method: 'POST',
          url: 'https://slp-api.fullstack.cash/slp/hydrateUtxos',
          data: {
            utxos: utxosToHydrate
          }
        }
        const result = await _this.bchjs.SLP.TokenType1.axios.request(options)
        details = [...details, ...result.data.details]
      }

      // console.log(`details: ${JSON.stringify(details, null, 2)}`)
      return details
    } catch (err) {
      console.error('Error in utxos.js/hydrate()')
      throw err
    }
  }

  // Get chunks from array
  async getArrayChunks (arrayToSlice, limit) {
    try {
      // Validate inputs
      if (!Array.isArray(arrayToSlice)) {
        throw new Error('arrayToSlice must be an array')
      }
      if (!limit || typeof limit !== 'number') {
        throw new Error('limit must be a number')
      }

      let offset = 0
      const result = []

      while (offset < arrayToSlice.length) {
        const chunk = arrayToSlice.slice(offset, offset + limit)
        result.push(chunk)
        offset = offset + limit
      }
      return result
    } catch (err) {
      console.error('Error in utxos.js/getArrayChunks()')
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
      this.utxoStore = []

      // Get UTXOs for the address.
      const utxos = await _this.getUtxos(addr)

      // Hydrate the UTXOs.
      const tokenInfo = await _this.hydrate(utxos)

      // Save information to the UTXO store.
      this.utxoStore = tokenInfo

      // Initialize the token and bch utxo arrays too.
      this.getBchUtxos()
      this.getTokenUtxos()

      // For debugging
      // console.log(`utxoStore: ${JSON.stringify(this.utxoStore, null, 2)}`)
      // console.log(`bchUtxos: ${JSON.stringify(this.bchUtxos, null, 2)}`)
      // console.log(`tokenUtxos: ${JSON.stringify(this.tokenUtxos, null, 2)}`)

      // Return the utxo Store.
      return this.utxoStore
    } catch (err) {
      console.error('Error in utxos.js/initUtxoStore()')
      throw err
    }
  }

  // Scans the utxoStore array and returns an array of the BCH-only utxos.
  getBchUtxos () {
    // Filter out the BCH-only UTXOs.
    const bchUtxos = this.utxoStore.filter(utxo => !utxo.isValid)

    // Update the bchUtxos array for this instance.
    this.bchUtxos = bchUtxos

    // Return the BCH-only UTXOs.
    return bchUtxos
  }

  // Scans the utxoStore array and returns an array of the token-colored UTXOs.
  getTokenUtxos () {
    // Filter out the colored-UTXOs that represent tokens.
    const tokenUtxos = this.utxoStore.filter(utxo => utxo.isValid)

    // Update the tokenUtxos array for this instance.
    this.tokenUtxos = tokenUtxos

    // Return the token-colored UTXOs.
    return tokenUtxos
  }

  // Given an array of new UTXOS from Electrumx, each element will be 'diffed'
  // with the utxoStore, and the matching UTXOs removed. The returned array
  // contains only the UTXOs that the wallet does not already know about. This
  // can be used to significantly reduce the number of REST API calls the wallet
  // needs to make to get token information for each new UTXO.
  diffUtxos (newUtxos) {
    try {
      const oldUtxos = _this.utxoStore
      const diffUtxos = []

      // Loop through each element in the newUtxos array.
      for (let i = 0; i < newUtxos.length; i++) {
        let matchFound = false

        // Loop through each element in the oldUtxos array.
        for (let j = 0; j < oldUtxos.length; j++) {
          if (oldUtxos[j].tx_hash === newUtxos[i].tx_hash) {
            matchFound = true
            break
          }
        }

        if (!matchFound) {
          // console.log('match found')
          diffUtxos.push(newUtxos[i])
        }
      }

      return diffUtxos
    } catch (err) {
      console.error('Error in utxos.js/diffUtxos()')
      throw err
    }
  }
}

module.exports = UTXOs
