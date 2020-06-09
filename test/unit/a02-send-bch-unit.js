/*
  Unit tests for the send-bch.js library.
*/

// npm libraries
const assert = require('chai').assert
const sinon = require('sinon')

const SendBCH = require('../../lib/send-bch')
let uut // Unit Under Test

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
})
