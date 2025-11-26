/*
  Integration tests for the tokens.js library
*/

import chai from 'chai'
import BCHJS from '@psf/bch-js'

import Tokens from '../../lib/tokens.js'
import AdapterRouter from '../../lib/adapters/router.js'

const { assert } = chai
let uut

describe('#tokens.js', () => {
  beforeEach(() => {
    const config = {
      restURL: 'https://bchn.fullstack.cash/v5/'
    }
    const bchjs = new BCHJS(config)
    config.bchjs = bchjs
    config.ar = new AdapterRouter(config)
    uut = new Tokens(config)
  })

  describe('#listTokensFromAddress', () => {
    it('should return tokens held by an address', async () => {
      const addr = 'simpleledger:qqmjqwsplscmx0aet355p4l0j8q74thv7vf5epph4z'

      const tokenInfo = await uut.listTokensFromAddress(addr)
      console.log(`tokenInfo: ${JSON.stringify(tokenInfo, null, 2)}`)

      assert.isArray(tokenInfo)

      assert.property(tokenInfo[0], 'tokenId')
      assert.property(tokenInfo[0], 'ticker')
      assert.property(tokenInfo[0], 'name')
      assert.property(tokenInfo[0], 'decimals')
      assert.property(tokenInfo[0], 'tokenType')
      assert.property(tokenInfo[0], 'url')
      assert.property(tokenInfo[0], 'qty')
    })

    it('should return info on NFTs', async () => {
      const addr = 'bitcoincash:qzjs5l0a3gvmfuqw9szs4glzpf4j63jjkvfj9hqedl'

      const tokenInfo = await uut.listTokensFromAddress(addr)
      console.log(`tokenInfo: ${JSON.stringify(tokenInfo, null, 2)}`)

      assert.equal(tokenInfo[0].tokenType, 65)
    })
  })

  describe('#getTokenBalance', () => {
    it('should get the token balance for a wallet', async () => {
      const addr = 'simpleledger:qqmjqwsplscmx0aet355p4l0j8q74thv7vf5epph4z'
      const tokenId = 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'

      const tokenBalance = await uut.getTokenBalance(tokenId, addr)
      console.log(`tokenBalance: ${JSON.stringify(tokenBalance, null, 2)}`)

      assert.isAbove(tokenBalance, 0)
    })
  })
})
