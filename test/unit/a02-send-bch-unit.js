/*
  Unit tests for the send-bch.js library.
*/

// npm libraries
const assert = require('chai').assert
const sinon = require('sinon')

const SendBCH = require('../../lib/send-bch')
let uut // Unit Under Test

const mockData = require('./mocks/send-bch-mocks')

describe('#SendBCH', () => {
  let sandbox

  // Restore the sandbox before each test.
  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new SendBCH()
  })

  afterEach(() => sandbox.restore())

  describe('#calculateFee', () => {
    it('should accurately calculate a P2PKH with 1 input and 2 outputs', () => {
      const fee = uut.calculateFee(1, 2, 1)
      // console.log('fee: ', fee)

      assert.equal(fee, 226)
    })

    it('should accurately calculate a P2PKH with 2 input and 2 outputs', () => {
      const fee = uut.calculateFee(2, 2, 1)
      // console.log('fee: ', fee)

      assert.equal(fee, 374)
    })

    it('should accurately calculate a P2PKH with 2 input and 3 outputs', () => {
      const fee = uut.calculateFee(2, 3, 1)
      // console.log('fee: ', fee)

      assert.equal(fee, 408)
    })
  })

  describe('#sortUtxosBySize', () => {
    it('should sort UTXOs in ascending order', () => {
      const utxos = uut.sortUtxosBySize(mockData.exampleUtxos01.utxos)
      // console.log('utxos: ', utxos)

      const lastElem = utxos.length - 1

      assert.isAbove(utxos[lastElem].value, utxos[0].value)
    })

    it('should sort UTXOs in descending order', () => {
      const utxos = uut.sortUtxosBySize(mockData.exampleUtxos01.utxos, 'DESCENDING')
      // console.log('utxos: ', utxos)

      const lastElem = utxos.length - 1

      assert.isAbove(utxos[0].value, utxos[lastElem].value)
    })
  })

  describe('#createTransaction', () => {
    it('should do something', async () => {
      sandbox
        .stub(uut.bchjs.Electrumx, 'utxo')
        .resolves(mockData.exampleUtxos02)

      const outputs = [
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 1000
        }
      ]

      const utxos = await uut.createTransaction(outputs, mockData.mockWallet)
      // console.log('utxos: ', utxos)
    })
  })
})
