/*
  This is a live test for broadcasting a transaction with an OP_RETURN output
  for memo.cash.
*/

// Global npm libraries

// Local libraries
const BchWallet = require('../../index')

// Get the WIF from the environment variable.
// Exit if one is not provided.
const WIF = process.env.WIF
if (!WIF) {
  console.log(
    'In order to OP_RETURN e2e tests, you must specify a WIF as an environment variable.'
  )
  process.exit(0)
}

const MSG =
  'This is a test with a really long OP_RETURN. Let us see if this goes through. some more stuff.'

describe('OP_RETURN E2E Tests', () => {
  let wallet

  before(async () => {
    wallet = new BchWallet(WIF)

    await wallet.walletInfoPromise
    // console.log('wallet.utxos.utxoStore: ', wallet.utxos.utxoStore)
  })

  beforeEach(async () => {
    await wallet.bchjs.Util.sleep(1000)

    await wallet.getUtxos()
  })

  describe('Simple usage', () => {
    it('should post a simple memo.cash transaction', async () => {
      const txid = await wallet.sendOpReturn(MSG)

      console.log('txid: ', txid)
      console.log(`https://blockchair.com/bitcoin-cash/transaction/${txid}`)
    })
  })

  // These tests are useful for assessing fees and reliabilty.
  describe('Min & Max OP_RETURN size', () => {
    it('should post a memo.cash transaction using the maximum OP_RETURN size limit', async () => {
      let msg = '01234567890123456789012345678901234567890123456789'
      msg += '01234567890123456789012345678901234567890123456789'
      msg += '01234567890123456789012345678901234567890123456789'
      msg += '01234567890123456789012345678901234567890123456789'
      msg += '01234567890123456'

      const txid = await wallet.sendOpReturn(msg)

      console.log('txid: ', txid)
      console.log(`https://blockchair.com/bitcoin-cash/transaction/${txid}`)
    })

    it('should post an OP_RETURN tx with minimum OP_RETURN size', async () => {
      const txid = await wallet.sendOpReturn('', '')

      console.log('txid: ', txid)
      console.log(`https://blockchair.com/bitcoin-cash/transaction/${txid}`)
    })
  })
})
