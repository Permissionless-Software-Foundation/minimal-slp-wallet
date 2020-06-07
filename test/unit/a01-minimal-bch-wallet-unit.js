/*
  Unit tests for the main library.
*/

// npm libraries
const assert = require('chai').assert
const sinon = require('sinon')

// Mocking data libraries.
// const mockData = require('./mocks/util-mocks')

// Unit under test
const MinimalBCHWallet = require('../../index')
const uut = new MinimalBCHWallet()

describe('#index.js - Minimal BCH Wallet', () => {
  let sandbox

  // Restore the sandbox before each test.
  beforeEach(() => (sandbox = sinon.createSandbox()))
  afterEach(() => sandbox.restore())

  describe('#create', () => {
    it('should create a wallet with no input', () => {
      uut.create()
      // console.log('uut: ', uut)

      assert.property(uut, 'mnemonic')
      assert.isString(uut.mnemonic)
      assert.isNotEmpty(uut.mnemonic)

      assert.property(uut, 'privateKey')
      assert.isString(uut.privateKey)
      assert.isNotEmpty(uut.privateKey)

      assert.property(uut, 'cashAddress')
      assert.isString(uut.cashAddress)
      assert.isNotEmpty(uut.cashAddress)

      assert.property(uut, 'legacyAddress')
      assert.isString(uut.legacyAddress)
      assert.isNotEmpty(uut.legacyAddress)

      assert.property(uut, 'slpAddress')
      assert.isString(uut.slpAddress)
      assert.isNotEmpty(uut.slpAddress)
    })
  })
})
