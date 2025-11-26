/*
  Integration tests for the op-return.js library.

  In order to run these tests, the WIF below must control a UTXO for paying
  transaciton fees. No transaction will be broadcast, but it needs UTXOs to
  work with.
*/

// public npm libraries
import chai from 'chai'
import BCHJS from '@psf/bch-js'

// local libraries
import BchWallet from '../../index.js'

const { assert } = chai
const bchjs = new BCHJS()

// constants
const WIF = 'L1tcvcqa5PztqqDH4ZEcUmHA9aSHhTau5E2Zwp1xEK5CrKBrjP3m'
// BCH Address: bitcoincash:qqkg30ryje97al52htqwvveha538y7gttywut3cdqv

const bchUtxos = [
  {
    height: 725735,
    tx_hash: '8ff0152ad9aa88a4e747d47666e32e95e5144ee1ea9b7312fd471774a30e7027',
    tx_pos: 3,
    value: 353421,
    txid: '8ff0152ad9aa88a4e747d47666e32e95e5144ee1ea9b7312fd471774a30e7027',
    vout: 3,
    address: 'bitcoincash:qzz597tw8ya9m6za056lrvd8f37d02s6puzd3426za',
    isSlp: false
  }
]

describe('#op-return', () => {
  let wallet

  beforeEach(async () => {
    wallet = new BchWallet(WIF, { noUpdate: true })

    // await wallet.walletInfoPromise
  })

  describe('#createTransaction', () => {
    it('should create a memo tx by default', async () => {
      const { hex, txid } = await wallet.opReturn.createTransaction(
        wallet.walletInfo,
        bchUtxos,
        'This is a test message'
      )

      assert.isString(hex)
      assert.isString(txid)

      const txData = await bchjs.RawTransactions.decodeRawTransaction(hex)
      // console.log('txData: ', txData)
      // console.log(`txData.vout[0]: ${JSON.stringify(txData.vout[0], null, 2)}`)

      // Assert expected prefix exists.
      assert.include(txData.vout[0].scriptPubKey.asm, ' 621 ')
    })

    it('should use an arbitrary prefix', async () => {
      const { hex, txid } = await wallet.opReturn.createTransaction(
        wallet.walletInfo,
        bchUtxos,
        'This is a test message',
        'ffff'
      )
      // console.log('hex: ', hex)
      // console.log('txid: ', txid)

      assert.isString(hex)
      assert.isString(txid)

      const txData = await bchjs.RawTransactions.decodeRawTransaction(hex)
      // console.log('txData: ', txData)
      // console.log(`txData.vout[0]: ${JSON.stringify(txData.vout[0], null, 2)}`)

      // Assert expected prefix exists.
      assert.include(txData.vout[0].scriptPubKey.asm, ' -32767 ')
    })
  })
})
