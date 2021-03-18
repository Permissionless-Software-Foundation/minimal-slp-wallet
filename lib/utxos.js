/*
  A utility library for handling, analyzing, and maintaining a collection of UTXOs.

  TODO:

*/

const BCHJS = require('@psf/bch-js')

let _this

class UTXOs {
  constructor (config) {
    // Encapsulate dependencies.
    this.bchjs = new BCHJS(config)
    // this.bchjs = new BCHJS({ restURL: 'http://localhost:3000/v3/' })

    // UTXO storage. Used as a cache for UTXO information to reduce the number
    // of network calls required to retrieve a UTXO.
    this.utxoStore = []
    this.utxoStore2 = []

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
        // console.log(
        //   `utxosToHydrate: ${JSON.stringify(utxosToHydrate, null, 2)}`
        // )

        // Initial hydrate via bch-api
        let hydratedUtxos = await this.bchjs.SLP.Utils.hydrateUtxos([
          { utxos: utxosToHydrate }
        ])
        // console.log(`hydratedUtxos: ${JSON.stringify(hydratedUtxos, null, 2)}`)

        // Pull out the data.
        hydratedUtxos = hydratedUtxos.slpUtxos[0].utxos

        // Scan each hydated UTXO for a isValid=null property. If found, use
        // slp-api to hydrate that UTXO.
        for (let j = 0; j < hydratedUtxos.length; j++) {
          const thisUtxo = hydratedUtxos[j]

          if (thisUtxo.isValid === null) {
            console.warn(
              `Warning: Unvalidated UTXO detected: ${thisUtxo.tx_hash}`
            )
            hydratedUtxos[j] = await this.bkupValidate(thisUtxo)
          }
        }

        details = details.concat(hydratedUtxos)
      }

      // console.log(`details: ${JSON.stringify(details, null, 2)}`)
      return details
    } catch (err) {
      console.error('Error in utxos.js/hydrate()')
      throw err
    }
  }

  // Backup SLP Validation. Hydrate the UTXO using slp-api. This is a backup
  // method that is slower, but independent of SLPDB.
  async bkupValidate (utxo) {
    try {
      // console.log(`utxo: ${JSON.stringify(utxo, null, 2)}`)

      const txid = utxo.tx_hash
      // console.log(`txid: ${txid}`)

      const apiResult = await this.bchjs.SLP.Utils.validateTxid2(txid)
      // console.log(`temp: ${JSON.stringify(apiResult, null, 2)}`)

      utxo.isValid = apiResult.isValid

      return utxo
    } catch (err) {
      console.error('Error in bkupValidate()')
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

  // Replaces the old initUtxosStore() method.
  async initUtxoStore2 (addr) {
    try {
      // Clear the utxo store.
      this.utxoStore2 = []

      const utxos = await this.bchjs.Utxo.get(addr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      this.utxoStore2 = utxos[0]

      return this.utxoStore2
    } catch (err) {
      console.error('Error in utxos.js/initUtxoStore2()')
      throw err
    }
  }

  // Return the token UTXOs that are spendible. This includes Type 1, Group, and
  // NFT tokens. It ignores minting batons.
  getSpendableTokenUtxos () {
    try {
      const tokenUtxos = _this.utxoStore2.slpUtxos.type1.tokens.concat(
        _this.utxoStore2.slpUtxos.nft.groupTokens,
        _this.utxoStore2.slpUtxos.nft.tokens
      )

      return tokenUtxos
    } catch (err) {
      console.error('Error in utxos.js/getSpendableTokenUtxos()')
      throw err
    }
  }

  //
  // // Initialize the utxoStore.
  // // The UTXO store is cleared and refreshed with hydrated UTXO information.
  // // Given a BCH address, the UTXOs for that address are retrieved, UTXOs are
  // // hydrated with token information, and then saved to the utxoStore.
  // async initUtxoStore (addr) {
  //   try {
  //     // Clear the utxo store.
  //     this.utxoStore = []
  //
  //     // Get UTXOs for the address.
  //     const utxos = await _this.getUtxos(addr)
  //     // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)
  //
  //     // Hydrate the UTXOs.
  //     let tokenInfo = await _this.hydrate(utxos)
  //     // const tokenInfo = await _this.bchjs.SLP.Utils.hydrateUtxos([{ utxos }])
  //
  //     // Convert the token UTXOs into numbers.
  //     tokenInfo = tokenInfo.map(elem => {
  //       if (elem.tokenQty) {
  //         elem.tokenQty = Number(elem.tokenQty)
  //       }
  //
  //       return elem
  //     })
  //     // console.log(`tokenInfo: ${JSON.stringify(tokenInfo, null, 2)}`)
  //
  //     // Save information to the UTXO store.
  //     this.utxoStore = tokenInfo
  //     // this.utxoStore = tokenInfo.slpUtxos[0].utxos
  //
  //     // Initialize the token and bch utxo arrays too.
  //     this.getBchUtxos()
  //     this.getTokenUtxos()
  //
  //     // For debugging
  //     // console.log(`utxoStore: ${JSON.stringify(this.utxoStore, null, 2)}`)
  //     // console.log(`bchUtxos: ${JSON.stringify(this.bchUtxos, null, 2)}`)
  //     // console.log(`tokenUtxos: ${JSON.stringify(this.tokenUtxos, null, 2)}`)
  //
  //     // Return the utxo Store.
  //     return this.utxoStore
  //   } catch (err) {
  //     console.error('Error in utxos.js/initUtxoStore()')
  //     throw err
  //   }
  // }
  //
  // // Scans the utxoStore array and returns an array of the BCH-only utxos.
  // getBchUtxos () {
  //   try {
  //     // Filter out the BCH-only UTXOs.
  //     const bchUtxos = this.utxoStore.filter(utxo => utxo.isValid === false)
  //
  //     // Update the bchUtxos array for this instance.
  //     this.bchUtxos = bchUtxos
  //
  //     // Return the BCH-only UTXOs.
  //     return bchUtxos
  //   } catch (err) {
  //     console.log('Error in getBchUtxos()')
  //     throw err
  //   }
  // }
  //
  // // Scans the utxoStore array and returns an array of the token-colored UTXOs.
  // getTokenUtxos () {
  //   try {
  //     // Filter out the colored-UTXOs that represent tokens.
  //     const tokenUtxos = this.utxoStore.filter(utxo => utxo.isValid)
  //
  //     // Update the tokenUtxos array for this instance.
  //     this.tokenUtxos = tokenUtxos
  //
  //     // Return the token-colored UTXOs.
  //     return tokenUtxos
  //   } catch (err) {
  //     console.log('Error in getTokenUtxos()')
  //     throw err
  //   }
  // }

  // Given an array of new UTXOS from Electrumx, each element will be 'diffed'
  // with the utxoStore, and the matching UTXOs removed. The returned array
  // contains only the UTXOs that the wallet does not already know about. This
  // can be used to significantly reduce the number of REST API calls the wallet
  // needs to make to get token information for each new UTXO.
  //
  // TODO: This function really needs to return two array. One is a diff to get
  // new UTXOs. But it also needs to return a diff of the missing UTXOs. That
  // way spent UTXOs can be removed.
  // diffUtxos (newUtxos) {
  //   try {
  //     const oldUtxos = _this.utxoStore
  //     const diffUtxos = []
  //
  //     // Loop through each element in the newUtxos array.
  //     for (let i = 0; i < newUtxos.length; i++) {
  //       let matchFound = false
  //
  //       // Loop through each element in the oldUtxos array.
  //       for (let j = 0; j < oldUtxos.length; j++) {
  //         if (oldUtxos[j].tx_hash === newUtxos[i].tx_hash) {
  //           matchFound = true
  //           break
  //         }
  //       }
  //
  //       if (!matchFound) {
  //         // console.log('match found')
  //         diffUtxos.push(newUtxos[i])
  //       }
  //     }
  //
  //     return diffUtxos
  //   } catch (err) {
  //     console.error('Error in utxos.js/diffUtxos()')
  //     throw err
  //   }
  // }
}

module.exports = UTXOs
