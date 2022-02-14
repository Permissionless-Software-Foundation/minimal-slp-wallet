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
      console.log('result: ', result)
    })

    // it('should send token with no token change and no UTXO change', async () => {
    //   const output = {
    //     address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
    //     tokenId:
    //       '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
    //     qty: 1
    //   }
    //
    //   const walletInfo = sendMockData.mockWallet
    //
    //   // Prep the utxo data.
    //   utxos.utxoStore = mockData.tokenUtxos01
    //   const bchUtxos = utxos.utxoStore.bchUtxos
    //   const tokenUtxos = utxos.getSpendableTokenUtxos()
    //   // console.log('tokenUtxos: ', tokenUtxos)
    //
    //   // Modify the BCH UTXO for this test.
    //   // bchUtxos[0].value = bchUtxos[0].satoshis = 100000
    //
    //   const { hex, txid } = await uut.createTransaction(
    //     output,
    //     walletInfo,
    //     bchUtxos,
    //     tokenUtxos
    //   )
    //
    //   assert.isString(hex)
    //   assert.isString(txid)
    // })

    // it('should send token with token change and no UTXO change', async () => {
    //   const output = {
    //     address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
    //     tokenId:
    //       '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
    //     qty: 0.5
    //   }
    //
    //   const walletInfo = sendMockData.mockWallet
    //
    //   // Prep the utxo data.
    //   utxos.utxoStore = mockData.tokenUtxos01
    //   const bchUtxos = utxos.utxoStore.bchUtxos
    //   let tokenUtxos = utxos.getSpendableTokenUtxos()
    //
    //   // modify tokenUtxo for this test.
    //   tokenUtxos = tokenUtxos.find(elem => elem.tokenId === output.tokenId)
    //   // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)
    //   tokenUtxos.tokenQty = '2'
    //
    //   const { hex, txid } = await uut.createTransaction(
    //     output,
    //     walletInfo,
    //     bchUtxos,
    //     [tokenUtxos]
    //   )
    //
    //   assert.isString(hex)
    //   assert.isString(txid)
    // })

    // it('should send token with no token change and UTXO change', async () => {
    //   const output = {
    //     address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
    //     tokenId:
    //       '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
    //     qty: 1
    //   }
    //
    //   const walletInfo = sendMockData.mockWallet
    //
    //   // Prep the utxo data.
    //   // utxos.utxoStore = mockData.hydratedUtxos
    //   // const bchUtxos = utxos.getBchUtxos()
    //   // const tokenUtxos = utxos.getTokenUtxos()
    //   utxos.utxoStore = mockData.tokenUtxos01
    //   const bchUtxos = utxos.utxoStore.bchUtxos
    //   const tokenUtxos = utxos.getSpendableTokenUtxos()
    //
    //   // Modify the BCH UTXO for this test.
    //   bchUtxos[0].value = bchUtxos[0].satoshis = 100000
    //
    //   const { hex, txid } = await uut.createTransaction(
    //     output,
    //     walletInfo,
    //     bchUtxos,
    //     tokenUtxos
    //   )
    //
    //   assert.isString(hex)
    //   assert.isString(txid)
    // })
  })
})
