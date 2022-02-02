/*
  Integration tests for the utxos.js library
*/

const assert = require('chai').assert
const BCHJS = require('@psf/bch-js')

const AdapterRouter = require('../../lib/adapters/router')
const UTXOs = require('../../lib/utxos')
let uut

describe('#UTXOs', () => {
  beforeEach(() => {
    const config = {
      restURL: 'https://bchn.fullstack.cash/v5/'
    }

    const bchjs = new BCHJS(config)
    config.bchjs = bchjs

    config.ar = new AdapterRouter(config)
    uut = new UTXOs(config)
  })

  describe('#initUtxoStore', () => {
    it('should initialize and return the utxoStore from bchn.fullstack.cash', async () => {
      const addr = 'bitcoincash:qqaqa62t2uhv9cl6ze3appmvy3tnz8kyvyd54cex00'

      const result = await uut.initUtxoStore(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'address')
      assert.property(result, 'bchUtxos')
      assert.property(result, 'nullUtxos')
      assert.property(result, 'slpUtxos')
    })

    it('should initialize and return the utxoStore from free-bch.fullstack.cash', async () => {
      // Re-initialize UUT for using web 3 infra.
      const bchjs = new BCHJS()
      const config = {
        bchjs,
        interface: 'consumer-api',
        restURL: 'https://free-bch.fullstack.cash'
      }
      config.ar = new AdapterRouter(config)
      uut = new UTXOs(config)

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
