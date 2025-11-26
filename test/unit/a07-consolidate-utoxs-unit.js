/*
  Unit tests for the consolidate-utxos.js library.
*/

// Public npm libraries
import chai from 'chai'
import sinon from 'sinon'
// const BCHJS = require('@psf/bch-js')
import clone from 'lodash.clonedeep'

// Local libraries
import ConsolidateUtxos from '../../lib/consolidate-utxos.js'
import SlpWallet from '../../index.js'
import { tokenUtxos01, tokenList01, countTokenUtxosOut01 } from './mocks/consolidate-utxos-mocks.js'

const { assert } = chai

describe('#Consolidate-UTXOs', () => {
  let sandbox
  let uut
  let mockData

  beforeEach(async () => {
    const wallet = new SlpWallet()
    await wallet.walletInfoPromise

    uut = new ConsolidateUtxos(wallet)

    sandbox = sinon.createSandbox()

    mockData = {
      tokenUtxos01: clone(tokenUtxos01),
      tokenList01: clone(tokenList01),
      countTokenUtxosOut01: clone(countTokenUtxosOut01)
    }
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if instance of wallet is not passed', () => {
      try {
        uut = new ConsolidateUtxos()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Must pass an instance of the wallet.'
        )
      }
    })
  })

  describe('#countBchUtxos', () => {
    it('should count the number of UTXOs', () => {
      uut.wallet.utxos.utxoStore = {
        bchUtxos: ['a', 'b']
      }

      const result = uut.countBchUtxos()
      // console.log('result: ', result)

      assert.equal(result, 2)
    })
  })

  describe('#updateUtxos', () => {
    it('should update the UTXO store', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.wallet, 'initialize').resolves()

      const result = await uut.updateUtxos()

      assert.equal(result, true)
    })
  })

  describe('#countTokenUtxos', () => {
    it('should return an array of token classes', async () => {
      // Mock dependencies and force desired code path
      uut.wallet.utxos.utxoStore = {
        slpUtxos: {
          type1: {
            tokens: mockData.tokenUtxos01
          }
        }
      }
      sandbox.stub(uut.wallet.tokens, 'listTokensFromUtxos').returns(mockData.tokenList01)

      const result = uut.countTokenUtxos()
      // console.log('result: ', result)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.length, 2)
      assert.equal(result[0].cnt, 1)
      assert.equal(result[1].cnt, 2)
    })
  })

  describe('#consolidateTokenUtxos', () => {
    it('should consolidate token UTXOs and return an array of TXIDs', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.wallet, 'sendTokens').resolves('fake-txid')
      sandbox.stub(uut.bchjs.Util, 'sleep').resolves()
      sandbox.stub(uut, 'updateUtxos').resolves()

      const result = await uut.consolidateTokenUtxos(mockData.countTokenUtxosOut01)
      // console.log('result: ', result)

      assert.equal(result.length, 1)
      assert.equal(result[0], 'fake-txid')
    })
  })

  describe('#start', () => {
    it('should return expected properties and values if there are no UTXOs to consolidate', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut, 'updateUtxos').resolves()
      sandbox.stub(uut, 'countBchUtxos').returns(1)
      sandbox.stub(uut, 'countTokenUtxos').returns([])

      const result = await uut.start()
      // console.log('result: ', result)

      // Assert that expected properties exist
      assert.property(result, 'bchUtxoCnt')
      assert.property(result, 'bchTxid')
      assert.property(result, 'tokenUtxos')
      assert.property(result, 'tokenTxids')

      // Assert the properties have expected values.
      assert.equal(result.bchUtxoCnt, 1)
      assert.equal(result.bchTxid, null)
      assert.equal(result.tokenUtxos.length, 0)
      assert.equal(result.tokenTxids.length, 0)
    })

    it('should consolidate BCH and token UTXOs', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut, 'updateUtxos').resolves()
      sandbox.stub(uut, 'countBchUtxos').returns(2)
      sandbox.stub(uut.wallet, 'sendAll').resolves('fake-bch-txid')
      sandbox.stub(uut.bchjs.Util, 'sleep').resolves()
      sandbox.stub(uut, 'countTokenUtxos').returns(mockData.countTokenUtxosOut01)
      sandbox.stub(uut, 'consolidateTokenUtxos').resolves(['fake-token-txid'])

      const result = await uut.start()
      // console.log('result: ', result)

      // Assert that expected properties exist
      assert.property(result, 'bchUtxoCnt')
      assert.property(result, 'bchTxid')
      assert.property(result, 'tokenUtxos')
      assert.property(result, 'tokenTxids')

      // Assert the properties have expected values.
      assert.equal(result.bchUtxoCnt, 2)
      assert.equal(result.bchTxid, 'fake-bch-txid')
      assert.equal(result.tokenUtxos.length, 2)
      assert.equal(result.tokenTxids.length, 1)
    })

    it('should catch and throw errors', async () => {
      try {
        // Mock dependencies and force desired code path
        sandbox.stub(uut.retryQueue, 'addToQueue').rejects(new Error('fake error'))

        await uut.start()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err.message: ', err.message)
        assert.include(err.message, 'fake error')
      }
    })
  })
})
