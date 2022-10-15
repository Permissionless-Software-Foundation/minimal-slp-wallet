/*
  This library is used to optimize a wallet by consolidating the UTXOs it
  controls. Reducing the number of UTXOs has a direct effect at the speed
  of API calls and a good user experience. More UTXOs means more API calls,
  which means it takes more time to do everything. Reducing the number of UTXOs
  improves the user exerience.

  The functions in this library scan a wallets UTXO collection and looks for
  opportunities to consolidate them.
*/

// Global npm libraries
const RetryQueue = require('@chris.troutner/retry-queue-commonjs')

class ConsolidateUtxos {
  constructor (wallet) {
    // Dependency injection.
    this.wallet = wallet
    if (!this.wallet) {
      throw new Error('Must pass an instance of the wallet.')
    }

    // Encapsulate dependencies
    this.bchjs = wallet.bchjs
    this.retryQueue = new RetryQueue({
      attempts: 3,
      retryPeriod: 1000
    })

    // Bind all subfunction to the 'this' object
    this.start = this.start.bind(this)
    this.consolidateTokenUtxos = this.consolidateTokenUtxos.bind(this)
    this.countTokenUtxos = this.countTokenUtxos.bind(this)
    this.updateUtxos = this.updateUtxos.bind(this)
    this.countBchUtxos = this.countBchUtxos.bind(this)
  }

  // This is the top-level function that orchestrates all other functions in
  // this library. When called it will scan the UTXOs in a wallet, looking for
  // opportunities to consolidate UTXOs. If the dryRun input is set to true,
  // then no transactions are broadcasted.
  async start (inObj = {}) {
    try {
      const outObj = {}

      // Extract input variables from the input object.
      const { dryRun } = inObj

      await this.retryQueue.addToQueue(this.updateUtxos, {})

      outObj.bchUtxoCnt = this.countBchUtxos()
      // console.log(`bchUtxoCnt: ${outObj.bchUtxoCnt}`)

      outObj.bchTxid = null // Initial value

      // Consolidate all BCH UTXOs if there is more than one
      if (outObj.bchUtxoCnt > 1 && !dryRun) {
        outObj.bchTxid = await this.retryQueue.addToQueue(this.wallet.sendAll, this.wallet.walletInfo.cashAddress)

        await this.bchjs.Util.sleep(3000)

        await this.retryQueue.addToQueue(this.updateUtxos, {})
      }

      outObj.tokenUtxos = this.countTokenUtxos()
      // console.log(`tokenUtxos: ${JSON.stringify(outObj.tokenUtxos, null, 2)}`)

      outObj.tokenTxids = [] // Initial value
      if (!dryRun) {
        outObj.tokenTxids = await this.retryQueue.addToQueue(this.consolidateTokenUtxos, outObj.tokenUtxos)
      }

      return outObj
    } catch (err) {
      console.error('Error in conslidate-utxos.js/start()')
      throw err
    }
  }

  // This function expects the output of countTokenUtxos() as its input: an
  // array of objects, with each object representing a token.
  // If the number of UTXOs associated with a token is greater than zero,
  // the a transaction is broadcast to send the tokens back to the wallet, which
  // will consolidate all the token UTXOs.
  // It returns an array of TXIDs for any tokens that are consolidated.
  async consolidateTokenUtxos (tokenUtxos) {
    const tokenTxids = []

    for (let i = 0; i < tokenUtxos.length; i++) {
      const thisToken = tokenUtxos[i]

      if (thisToken.utxos.length > 1) {
        const receiver = {
          address: this.wallet.walletInfo.cashAddress,
          tokenId: thisToken.tokenId,
          qty: thisToken.qty
        }

        const txid = await this.wallet.sendTokens(receiver)
        tokenTxids.push(txid)

        await this.bchjs.Util.sleep(3000)

        await this.updateUtxos()
      }
    }

    return tokenTxids
  }

  // This function returns an array of objects. Each object represents a fungible
  // token class. It contains the count of UTXOs for that token.
  countTokenUtxos () {
    const tokenUtxos = this.wallet.utxos.utxoStore.slpUtxos.type1.tokens
    // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)

    const tokenList = this.wallet.tokens.listTokensFromUtxos(tokenUtxos)
    // console.log(`tokenList: ${JSON.stringify(tokenList, null, 2)}`)

    const outAry = []

    // Loop through each token class in the wallet.
    for (let i = 0; i < tokenList.length; i++) {
      const thisToken = tokenList[i]

      const tokenObj = {
        tokenId: thisToken.tokenId,
        ticker: thisToken.ticker,
        name: thisToken.name,
        qty: thisToken.qty,
        cnt: 0,
        utxos: []
      }

      // Loop through each token UTXO.
      for (let j = 0; j < tokenUtxos.length; j++) {
        const thisUtxo = tokenUtxos[j]

        // Add the UTXO to the token object if it matches the token ID.
        if (thisUtxo.tokenId === thisToken.tokenId) {
          tokenObj.cnt++
          tokenObj.utxos.push(thisUtxo)
        }
      }

      outAry.push(tokenObj)
    }

    return outAry
  }

  // Update the UTXO store of the wallet.
  async updateUtxos () {
    await this.wallet.walletInfoPromise
    await this.wallet.initialize()

    return true
  }

  // Count the number of BCH UTXOs in the wallet. These can all be consolidated
  // into a single UTXO.
  countBchUtxos () {
    const bchUtxos = this.wallet.utxos.utxoStore.bchUtxos
    // console.log(`bchUtxos: ${JSON.stringify(bchUtxos, null, 2)}`)

    return bchUtxos.length
  }
}

module.exports = ConsolidateUtxos
