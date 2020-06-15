/*
  This library provides functions for dealing with SLP tokens.
*/

const BCHJS = require('@chris.troutner/bch-js')

let _this

class Tokens {
  constructor () {
    // _this is a local global variable for when 'this' loses scope.
    _this = this

    // Encapsulate dependencies.
    _this.bchjs = new BCHJS()
  }

  // Returns an array of Objects with token information. Expects an array of
  // hydrated UTXOs as input.
  listTokens (utxos) {
    try {
      // Array used to assemble token information.
      const tokenInfo = []

      utxos.forEach(utxo => {
        // Skip if this is not a valid token UTXO.
        if (!utxo.isValid) return

        // Check if the current UTXO represents a token that is already in the
        // tokenInfo array.
        const exists = tokenInfo.findIndex(
          thisToken => thisToken.tokenId === utxo.tokenId
        )
        // console.log(`exists: ${JSON.stringify(exists, null, 2)}`)

        // Token does not exist yet in the list.
        if (exists < 0) {
          const infoObj = {
            tokenId: utxo.tokenId,
            ticker: utxo.tokenTicker,
            name: utxo.tokenName,
            decimals: utxo.decimals,
            tokenType: utxo.tokenType,
            url: utxo.tokenDocumentUrl,
            qty: utxo.tokenQty
          }

          tokenInfo.push(infoObj)
        } else {
          // Token already exists in the tokenInfo array.
          // Just update the quantity.
          tokenInfo[exists].qty += utxo.tokenQty
        }
      })

      return tokenInfo
    } catch (err) {
      console.error('Error in tokens.js/listTokens()')
      throw err
    }
  }
}

module.exports = Tokens
