/*
  Integration tests for the op-return.js library.

  In order to run these tests, the WIF below must control a UTXO for paying
  transaciton fees. No transaction will be broadcast, but it needs UTXOs to
  work with.
*/

// constants
const WIF = 'L1tcvcqa5PztqqDH4ZEcUmHA9aSHhTau5E2Zwp1xEK5CrKBrjP3m'
// BCH Address: bitcoincash:qqkg30ryje97al52htqwvveha538y7gttywut3cdqv

// public npm libraries

// local libraries
const BchWallet = require('../../index')

describe('#op-return', () => {
  let wallet

  beforeEach(async () => {
    wallet = new BchWallet(WIF)

    await wallet.walletInfoPromise
  })

  describe('#createTransaction', () => {
    it('should create a memo tx by default', async () => {
      const { hex } = await wallet.opReturn.createTransaction(
        wallet.walletInfo,
        wallet.utxos.utxoStore.bchUtxos,
        'test'
      )

      console.log('hex: ', hex)
    })
  })
})
