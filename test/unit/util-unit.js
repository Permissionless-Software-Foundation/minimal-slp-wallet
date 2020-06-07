/*
  Unit tests for the util.js utility library.
*/

// npm libraries
const chai = require('chai')
const sinon = require('sinon')

// Locally global variables.
const assert = chai.assert

// Mocking data libraries.
const mockData = require('./mocks/util-mocks')

// Unit under test
const UtilLib = require('../../lib/util')
const uut = new UtilLib()

describe('#util.js', () => {
  let sandbox

  // Restore the sandbox before each test.
  beforeEach(() => (sandbox = sinon.createSandbox()))
  afterEach(() => sandbox.restore())

  describe('#getBchData', () => {
    it('should throw error if address is not a string', async () => {
      try {
        const addr = 1234

        await uut.getBchData(addr)

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        assert.include(err.message, 'Address must be a string')
      }
    })

    it('should get BCH data on an address', async () => {
      // Mock external dependencies.
      sandbox
        .stub(uut.bchjs.Blockbook, 'balance')
        .resolves(mockData.mockBalance)
      sandbox.stub(uut.bchjs.Blockbook, 'utxo').resolves(mockData.mockUtxos)

      const addr = 'bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7'

      const bchData = await uut.getBchData(addr)

      // Assert that top-level properties exist.
      assert.property(bchData, 'balance')
      assert.property(bchData, 'utxos')

      // Assert essential UTXOs properties exist.
      assert.isArray(bchData.utxos)
      assert.property(bchData.utxos[0], 'txid')
      assert.property(bchData.utxos[0], 'vout')
      assert.property(bchData.utxos[0], 'satoshis')
    })
  })
})
