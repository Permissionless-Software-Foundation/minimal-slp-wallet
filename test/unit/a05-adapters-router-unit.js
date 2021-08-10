/*
  Unit tests for the lib/adapters/router.js library.
*/

// Public npm libraries
const assert = require('chai').assert
const sinon = require('sinon')
const BCHJS = require('@psf/bch-js')

// const Tokens = require('../../lib/tokens')
// const Utxos = require('../../lib/utxos')

const AdapterRouter = require('../../lib/adapters/router')

let uut

// const mockDataLib = require('./mocks/utxo-mocks')
// let mockData
// const sendMockDataLib = require('./mocks/send-bch-mocks')
// let sendMockData

describe('#adapter-router', () => {
  let sandbox
  // let utxos

  beforeEach(() => {
    const bchjs = new BCHJS()
    uut = new AdapterRouter({ bchjs })

    sandbox = sinon.createSandbox()

    // mockData = Object.assign({}, mockDataLib)
    // sendMockData = Object.assign({}, sendMockDataLib)
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if bch-js is not included', () => {
      try {
        uut = new AdapterRouter()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Must pass instance of bch-js when instantiating AdapterRouter.'
        )
      }
    })

    it('should select rest-api by default', () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs })

      assert.equal(uut.interface, 'rest-api')
    })

    it('should select json-rpc interface', () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'json-rpc' })

      assert.equal(uut.interface, 'json-rpc')
    })
  })

  describe('#getUtxos', () => {
    it('should throw an error if address is not specified', async () => {
      try {
        await uut.getUtxos()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Address string required when calling getUtxos()'
        )
      }
    })

    it('should use bch-js by default', async () => {
      // Mock dependencies.
      sandbox.stub(uut.bchjs.Utxo, 'get').resolves(['test str'])

      const result = await uut.getUtxos('fake-addr')

      assert.equal(result, 'test str')
    })

    it('should use wallet service when json-rpc interface is selected', async () => {
      // Mock dependencies.
      sandbox.stub(uut.jsonRpcWalletService, 'getUtxos').resolves(['test str'])

      uut.interface = 'json-rpc'

      const result = await uut.getUtxos('fake-addr')

      assert.equal(result, 'test str')
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.getUtxos('fake-addr')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })
  })
})
