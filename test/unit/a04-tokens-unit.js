/*
  Unit tests for the token library.
*/

const assert = require('chai').assert
const sinon = require('sinon')

const Tokens = require('../../lib/tokens')
let uut

const mockData = require('./mocks/utxo-mocks')

describe('#UTXOs', () => {
  let sandbox

  beforeEach(() => {
    uut = new Tokens()

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#listTokens', () => {
    it('should return a list of tokens', () => {
      const tokenInfo = uut.listTokens(mockData.hydratedUtxos)
      // console.log(`tokenInfo:  ${JSON.stringify(tokenInfo, null, 2)}`)

      // Assert that the returned array is the expected size.
      assert.isArray(tokenInfo)
      assert.equal(tokenInfo.length, 2)

      // Assert the objects in the array have the expected properties.
      assert.property(tokenInfo[0], 'tokenId')
      assert.property(tokenInfo[0], 'ticker')
      assert.property(tokenInfo[0], 'name')
      assert.property(tokenInfo[0], 'decimals')
      assert.property(tokenInfo[0], 'tokenType')
      assert.property(tokenInfo[0], 'url')
      assert.property(tokenInfo[0], 'qty')

      // Assert that the quantities are as expected.
      assert.equal(tokenInfo[0].qty, 1)
      assert.equal(tokenInfo[1].qty, 1)
    })

    it('should return aggregate token data', () => {
      const tokenInfo = uut.listTokens(mockData.tokenUtxos02)
      // console.log(`tokenInfo:  ${JSON.stringify(tokenInfo, null, 2)}`)

      // Assert that the returned array is the expected size.
      assert.isArray(tokenInfo)
      assert.equal(tokenInfo.length, 2)

      // Assert that the quantities are as expected.
      assert.equal(tokenInfo[0].qty, 2)
      assert.equal(tokenInfo[1].qty, 1)
    })

    it('should handle and throw errors', async () => {
      try {
        uut.listTokens('a')

        assert(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'utxos.forEach is not a function')
      }
    })
  })
})
