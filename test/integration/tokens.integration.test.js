/*
  Integration tests for the tokens.js library
*/

const assert = require('chai').assert

const Tokens = require('../../lib/tokens')
let uut

describe('#tokens.js', () => {
  beforeEach(() => {
    uut = new Tokens()
  })

  describe('#listTokensFromAddress', () => {
    it('should return tokens held by an address', async () => {
      const addr = 'simpleledger:qqmjqwsplscmx0aet355p4l0j8q74thv7vf5epph4z'

      const tokenInfo = await uut.listTokensFromAddress(addr)
      // console.log(`tokenInfo: ${JSON.stringify(tokenInfo, null, 2)}`)

      assert.isArray(tokenInfo)

      assert.property(tokenInfo[0], 'tokenId')
      assert.property(tokenInfo[0], 'ticker')
      assert.property(tokenInfo[0], 'name')
      assert.property(tokenInfo[0], 'decimals')
      assert.property(tokenInfo[0], 'tokenType')
      assert.property(tokenInfo[0], 'url')
      assert.property(tokenInfo[0], 'qty')
    })
  })
})
