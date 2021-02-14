/*
  Unit tests for the utxos.js library
*/

const assert = require('chai').assert
const sinon = require('sinon')
const cloneDeep = require('lodash.clonedeep')

const UTXOs = require('../../lib/utxos')
let uut

const mockDataLib = require('./mocks/utxo-mocks')
let mockData

describe('#UTXOs', () => {
  let sandbox

  beforeEach(() => {
    const config = {
      restURL: 'https://api.fullstack.cash/v4/'
    }
    uut = new UTXOs(config)

    mockData = cloneDeep(mockDataLib)

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#getUtxos', () => {
    it('should get UTXO information for an address', async () => {
      // Mock network calls.
      sandbox.stub(uut.bchjs.Electrumx, 'utxo').resolves(mockData.simpleUtxos)

      const addr = 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      const utxos = await uut.getUtxos(addr)
      // console.log('utxos: ', utxos)

      assert.isArray(utxos)
      assert.property(utxos[0], 'height')
      assert.property(utxos[0], 'tx_hash')
      assert.property(utxos[0], 'tx_pos')
      assert.property(utxos[0], 'value')
    })

    it('should handle network errors', async () => {
      try {
        sandbox
          .stub(uut.bchjs.Electrumx, 'utxo')
          .throws(new Error('test error'))

        const addr = 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

        await uut.getUtxos(addr)

        assert(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })

    it('should handle unsuccesful queries', async () => {
      try {
        sandbox
          .stub(uut.bchjs.Electrumx, 'utxo')
          .resolves({ success: false, message: 'error message' })

        const addr = 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

        await uut.getUtxos(addr)

        assert(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Could not get UTXOs')
      }
    })
  })

  describe('#getArrayChunks', () => {
    it('should throw error if "arrayToSlice" input is not array type', async () => {
      try {
        const arr = 1
        const limit = 5
        await uut.getArrayChunks(arr, limit)
      } catch (err) {
        assert.include(err.message, 'arrayToSlice must be an array')
      }
    })
    it('should throw error if "limit" input is not number type', async () => {
      try {
        const arr = []
        const limit = '5'
        await uut.getArrayChunks(arr, limit)
      } catch (err) {
        assert.include(err.message, 'limit must be a number')
      }
    })
    it('should return chunks if array length is greatter than limit ', async () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
      const limit = 5
      const result = await uut.getArrayChunks(arr, limit)

      assert.equal(result.length, arr.length / limit)
      assert.isArray(result[0])
      assert.isArray(result[1])
    })
    it('should return chunks if array length is less than limit ', async () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, [{ test: 'test' }]]
      const limit = 20
      const result = await uut.getArrayChunks(arr, limit)

      assert.equal(result.length, 1)
      assert.isArray(result[0])
      assert.deepEqual(arr, result[0])
    })
    it('should return empty array if arrayToSlice is empty', async () => {
      const arr = []
      const limit = 20
      const result = await uut.getArrayChunks(arr, limit)

      assert.equal(result.length, 0)
    })
  })

  describe('#bkupValidate', () => {
    it('should validate a dust attack', async () => {
      // Mock network call.
      sandbox
        .stub(uut.bchjs.SLP.Utils, 'validateTxid2')
        .resolves(mockData.mockSlpApiResult)

      const hydratedUtxo = await uut.bkupValidate(mockData.dustAttackUtxo)
      // console.log(`hydratedUtxo: ${JSON.stringify(hydratedUtxo, null, 2)}`)

      // Assert that expected properties exist.
      assert.property(hydratedUtxo, 'height')
      assert.property(hydratedUtxo, 'tx_hash')
      assert.property(hydratedUtxo, 'tx_pos')
      assert.property(hydratedUtxo, 'value')
      assert.property(hydratedUtxo, 'satoshis')
      assert.property(hydratedUtxo, 'txid')
      assert.property(hydratedUtxo, 'vout')
      assert.property(hydratedUtxo, 'isValid')

      // Expecting isValid to be validated to false.
      assert.equal(hydratedUtxo.isValid, false)
    })

    it('should handle network errors', async () => {
      try {
        // Force network error.
        sandbox
          .stub(uut.bchjs.SLP.Utils, 'validateTxid2')
          .rejects(new Error('test error'))

        await uut.bkupValidate(mockData.dustAttackUtxo)

        assert(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#hydrate', () => {
    it('should get token information for each UTXO', async () => {
      const utxos = mockData.mixedUtxos

      // Mock network calls.
      sandbox
        .stub(uut.bchjs.SLP.Utils, 'hydrateUtxos')
        .resolves({ slpUtxos: [{ utxos: mockData.hydratedUtxos }] })

      const hydratedUtxos = await uut.hydrate(utxos)
      // console.log(`hydratedUtxos: ${JSON.stringify(hydratedUtxos, null, 2)}`)

      assert.deepEqual(hydratedUtxos, mockData.hydratedUtxos)
    })

    it('should handle network errors', async () => {
      try {
        const utxos = mockData.mixedUtxos

        // Force an error.
        sandbox
          .stub(uut.bchjs.SLP.Utils, 'hydrateUtxos')
          .rejects(new Error('test error'))

        await uut.hydrate(utxos)

        assert(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })

    it('should throw error if input is invalid type', async () => {
      try {
        await uut.hydrate(1)

        assert(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'Input must be an array')
      }
    })

    it('should get token information when SLPDB returns isValid=null', async () => {
      const utxos = mockData.mixedUtxos

      // Force hydrateUtxos() to return a UTXO with a isValid=null value.
      // const mockedUtxos = Object.assign({}, mockData) // Clone the testwallet
      mockData.hydratedUtxos[0].isValid = null
      sandbox
        .stub(uut.bchjs.SLP.Utils, 'hydrateUtxos')
        .resolves({ slpUtxos: [{ utxos: mockData.hydratedUtxos }] })

      // Mock bkupValidate() to return an isValid=false value.
      sandbox.stub(uut, 'bkupValidate').resolves(mockData.hydratedUtxos[0])

      const hydratedUtxos = await uut.hydrate(utxos)
      // console.log(`hydratedUtxos: ${JSON.stringify(hydratedUtxos, null, 2)}`)

      assert.deepEqual(hydratedUtxos, mockData.hydratedUtxos)
    })
  })

  describe('#initUtxoStore', () => {
    it('should initialize and return the utxoStore', async () => {
      const addr = 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      // Mock network calls.
      sandbox.stub(uut, 'getUtxos').resolves(mockData.mixedUtxos)
      // sandbox.stub(uut, 'hydrate').resolves(mockData.hydratedUtxos)
      sandbox
        .stub(uut.bchjs.SLP.Utils, 'hydrateUtxos')
        .resolves({ slpUtxos: [{ utxos: mockData.hydratedUtxos }] })

      const utxos = await uut.initUtxoStore(addr)

      // Each UTXO returned should have an isValid property.
      utxos.forEach(elem => assert.property(elem, 'isValid'))

      // The UTXO store should match the returned data.
      assert.deepEqual(uut.utxoStore, utxos)

      // Token and BCH UTXOs should be separate.
      assert.equal(uut.bchUtxos.length, 1)
      assert.equal(uut.tokenUtxos.length, 2)
    })

    it('should handle network errors', async () => {
      try {
        const addr = 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

        sandbox.stub(uut, 'getUtxos').throws(new Error('test error'))

        await uut.initUtxoStore(addr)

        assert(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#diffUtxos', () => {
    it('should return an empty array when utxos are the same', () => {
      // Force the utxoStore.
      uut.utxoStore = mockData.mixedUtxos

      const result = uut.diffUtxos(mockData.mixedUtxos)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.equal(result.length, 0)
    })

    it('should return only dissimilar utxos', () => {
      // Should return a single UTXO, the only one that is different.

      // Force the utxoStore.
      uut.utxoStore = mockData.tokenUtxos01

      const result = uut.diffUtxos(mockData.tokenUtxos02)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.equal(result.length, 1)
    })

    it('should handle an error', () => {
      try {
        uut.diffUtxos()
      } catch (err) {
        // console.log(err)
        assert.include(err.message, 'length')
      }
    })
  })
})
