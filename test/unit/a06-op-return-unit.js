/*
  Unit tests for the op-return.js library.
*/

// Public npm libraries
const assert = require('chai').assert
const sinon = require('sinon')
const BCHJS = require('@psf/bch-js')

// Local libraries
const OpReturn = require('../../lib/op-return')
// const Tokens = require('../../lib/tokens')
// const Utxos = require('../../lib/utxos')
const AdapterRouter = require('../../lib/adapters/router')

describe('#OP_RETURN', () => {
  let sandbox
  let uut

  beforeEach(() => {
    const config = {
      restURL: 'https://api.fullstack.cash/v5/'
    }
    const bchjs = new BCHJS(config)
    config.bchjs = bchjs
    config.ar = new AdapterRouter(config)
    uut = new OpReturn(config)
    // utxos = new Utxos(config)

    sandbox = sinon.createSandbox()

    // mockData = Object.assign({}, mockDataLib)
    // sendMockData = Object.assign({}, sendMockDataLib)
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if instance of bch-js is not passed', () => {
      try {
        uut = new OpReturn()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Must pass instance of bch-js when instantiating OpReturn library.'
        )
      }
    })

    it('should throw an error if instance of bch-js is not passed', () => {
      try {
        uut = new OpReturn({ bchjs: {} })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Must pass instance of Adapter Router.')
      }
    })
  })

  describe('#calculateFee', () => {
    it('should accurately calculate a P2PKH with 1 input and 2 outputs', () => {
      const fee = uut.calculateFee(1, 2, 1)
      // console.log('fee: ', fee)

      assert.equal(fee, 260)
    })

    it('should accurately calculate a P2PKH with 2 input and 2 outputs', () => {
      const fee = uut.calculateFee(2, 2, 1)
      // console.log('fee: ', fee)

      assert.equal(fee, 408)
    })

    it('should accurately calculate a P2PKH with 2 input and 3 outputs', () => {
      const fee = uut.calculateFee(2, 3, 1)
      // console.log('fee: ', fee)

      assert.equal(fee, 442)
    })

    it('should throw an error for bad input', () => {
      try {
        const fee = uut.calculateFee('a', 'b', 'c')
        console.log('fee: ', fee)

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(
          err.message,
          'Invalid input. Fee could not be calculated'
        )
      }
    })
  })
})
