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
/*   describe('#getSendOpReturn', () => {
    it('should return OP_RETURN object ', async () => {
      const tokenUtxos = [{
        tokenId: '0a321bff9761f28e06a268b14711274bb77617410a16807bd0437ef234a072b1',
        decimals: 0,
        tokenQty: 2
      }]
      const sendQty = 1
      const result = await uut.getSendOpReturn(tokenUtxos, sendQty)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.hasAllKeys(result, ['script', 'outputs'])
      assert.isNumber(result.outputs)
    })
  }) */
})
