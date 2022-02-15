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
const sendMockData = require('./mocks/send-bch-mocks')

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

    it('should throw an error if instance of Adapter Router is not passed', () => {
      try {
        uut = new OpReturn({ bchjs: {} })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Must pass instance of Adapter Router.')
      }
    })
  })

  describe('#calculateFee', () => {
    it('should accurately calculate a P2PKH with 2 input and 2 outputs', () => {
      const fee = uut.calculateFee(2, 2, 3, 1)
      // console.log('fee: ', fee)

      assert.equal(fee, 421)
    })

    it('should throw an error for bad input', () => {
      try {
        uut.calculateFee('a', 'b', 'c')
        // console.log('fee: ', fee)

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(
          err.message,
          'Invalid input. Fee could not be calculated'
        )
      }
    })

    it('should calculate fee for minimum OP_RETURN size', () => {
      const fee = uut.calculateFee(1, 2, 3, 1)
      // console.log('fee: ', fee)

      assert.equal(fee, 273)
    })

    it('should calculate fee for maximum OP_RETURN size', () => {
      const fee = uut.calculateFee(1, 2, 223, 1)
      // console.log('fee: ', fee)

      assert.equal(fee, 493)
    })
  })

  describe('#getNecessaryUtxosAndChange', () => {
    it('should return UTXOs to achieve single output', () => {
      const outputs = [
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 600
        }
      ]

      const { necessaryUtxos, change } = uut.getNecessaryUtxosAndChange(
        outputs,
        sendMockData.exampleUtxos01.utxos
      )
      // console.log('necessaryUtxos: ', necessaryUtxos)
      // console.log('change: ', change)

      assert.isArray(necessaryUtxos)
      assert.equal(necessaryUtxos.length, 3)
      assert.isNumber(change)
    })

    it('should return UTXOs to achieve multiple outputs', () => {
      const outputs = [
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 12513803
        },
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 2000
        }
      ]

      const { necessaryUtxos, change } = uut.getNecessaryUtxosAndChange(
        outputs,
        sendMockData.exampleUtxos01.utxos
      )
      // console.log('necessaryUtxos: ', necessaryUtxos)
      // console.log('change: ', change)

      assert.isArray(necessaryUtxos)
      assert.equal(necessaryUtxos.length, 3)
      assert.isNumber(change)
    })

    it('should throw an error if not enough BCH', () => {
      try {
        const outputs = [
          {
            address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
            amountSat: 12525803
          },
          {
            address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
            amountSat: 2000
          }
        ]

        uut.getNecessaryUtxosAndChange(
          outputs,
          sendMockData.exampleUtxos01.utxos
        )

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        // console.log('err: ', err)

        assert.include(err.message, 'Insufficient balance')
      }
    })
  })

  describe('#createTransaction', () => {
    it('should throw an error if there are no BCH UTXOs.', async () => {
      try {
        await uut.createTransaction({}, [], [])

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'BCH UTXO list is empty')
      }
    })

    it('should generate tx with OP_RETURN', async () => {
      // const walletInfo = sendMockData.mockWallet

      const result = await uut.createTransaction(
        sendMockData.mockWallet,
        sendMockData.exampleUtxos01.utxos,
        'this is a test'
      )
      // console.log('result: ', result)

      assert.isString(result.hex)
      assert.isString(result.txid)
    })
  })
})
