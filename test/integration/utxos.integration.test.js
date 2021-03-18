/*
  Integration tests for the utxos.js library
*/

const assert = require('chai').assert

const UTXOs = require('../../lib/utxos')
let uut

describe('#UTXOs', () => {
  beforeEach(() => {
    const config = {
      restURL: 'https://bchn.fullstack.cash/v4/'
    }
    uut = new UTXOs(config)
  })

  describe('#initUtxoStore', () => {
    it('should initialize and return the utxoStore', async () => {
      const addr = 'bitcoincash:qqaqa62t2uhv9cl6ze3appmvy3tnz8kyvyd54cex00'

      const result = await uut.initUtxoStore(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'address')
      assert.property(result, 'bchUtxos')
      assert.property(result, 'nullUtxos')
      assert.property(result, 'slpUtxos')
    })
  })
})
