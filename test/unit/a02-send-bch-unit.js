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
      const utxos = uut.sortUtxosBySize(
        mockData.exampleUtxos01.utxos,
        'DESCENDING'
      )
      // console.log('utxos: ', utxos)

      const lastElem = utxos.length - 1

      assert.isAbove(utxos[0].value, utxos[lastElem].value)
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
        mockData.exampleUtxos02.utxos
      )
      // console.log('necessaryUtxos: ', necessaryUtxos)
      // console.log('change: ', change)

      assert.isArray(necessaryUtxos)
      assert.equal(necessaryUtxos.length, 2)
      assert.isNumber(change)
    })

    it('should return UTXOs to achieve multiple outputs', () => {
      const outputs = [
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 12523803
        },
        {
          address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
          amountSat: 2000
        }
      ]

      const { necessaryUtxos, change } = uut.getNecessaryUtxosAndChange(
        outputs,
        mockData.exampleUtxos01.utxos
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

        uut.getNecessaryUtxosAndChange(outputs, mockData.exampleUtxos01.utxos)

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        // console.log('err: ', err)

        assert.include(err.message, 'Insufficient balance')
      }
    })
  })

  describe('#getKeyPairFromMnemonic', () => {
    it('should generate a key pair', async () => {
      const keyPair = await uut.getKeyPairFromMnemonic(mockData.mockWallet)
      // console.log(`keyPair: ${JSON.stringify(keyPair, null, 2)}`)

      // Ensure the output has the expected properties.
      assert.property(keyPair, 'compressed')
      assert.property(keyPair, 'network')
    })
  })

  // describe('#createTransaction', () => {
  //   it('should do something', async () => {
  //     sandbox
  //       .stub(uut.bchjs.Electrumx, 'utxo')
  //       .resolves(mockData.exampleUtxos02)
  //
  //     const outputs = [
  //       {
  //         address: 'bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h',
  //         amountSat: 1000
  //       }
  //     ]
  //
  //     const utxos = await uut.createTransaction(outputs, mockData.mockWallet)
  //     // console.log('utxos: ', utxos)
  //   })
  // })
})
