/*
  Unit tests for the utxos.js library
*/

const assert = require('chai').assert
const sinon = require('sinon')
const cloneDeep = require('lodash.clonedeep')
const BCHJS = require('@psf/bch-js')

const UTXOs = require('../../lib/utxos')
const AdapterRouter = require('../../lib/adapters/router')
let uut

const mockDataLib = require('./mocks/utxo-mocks')
let mockData

describe('#UTXOs', () => {
  let sandbox

  beforeEach(() => {
    const config = {
      restURL: 'https://api.fullstack.cash/v5/'
    }
    const bchjs = new BCHJS(config)
    config.bchjs = bchjs
    config.ar = new AdapterRouter(config)
    uut = new UTXOs(config)

    mockData = cloneDeep(mockDataLib)

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if instance of bch-js is not passed', () => {
      try {
        uut = new UTXOs()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Must pass instance of bch-js when instantiating AdapterRouter.'
        )
      }
    })

    it('should throw an error if instance of Adapter Router is not passed.', () => {
      try {
        uut = new UTXOs({ bchjs: {} })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Must pass instance of Adapter Router.')
      }
    })
  })

  describe('#initUtxoStore', () => {
    it('should initialize and return the utxoStore', async () => {
      const addr = 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      // Mock network calls.
      sandbox.stub(uut.ar, 'getUtxos').resolves([mockData.tokenUtxos01])

      const utxos = await uut.initUtxoStore(addr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      assert.property(utxos, 'bchUtxos')
      assert.property(utxos, 'nullUtxos')
      assert.property(utxos, 'slpUtxos')
      assert.property(utxos, 'address')
    })

    it('should handle network errors', async () => {
      try {
        const addr = 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

        // Force an error
        sandbox.stub(uut.ar, 'getUtxos').rejects(new Error('test error'))

        await uut.initUtxoStore(addr)

        assert.fail('unexpected result')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#getSpendableTokenUtxos', () => {
    it('should return all the spendable UTXOs', () => {
      uut.utxoStore = mockData.tokenUtxos01

      const tokenUtxos = uut.getSpendableTokenUtxos()
      // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)

      for (let i = 0; i < tokenUtxos.length; i++) {
        assert.equal(tokenUtxos[i].tokenType, 1)
      }
    })

    it('should handle an error', () => {
      try {
        uut.utxoStore = {}

        uut.getSpendableTokenUtxos()

        assert.fail('Unexpected result')
      } catch (err) {
        // console.log(err)
        assert.include(err.message, "Cannot read property 'type1' of undefined")
      }
    })
  })
})
