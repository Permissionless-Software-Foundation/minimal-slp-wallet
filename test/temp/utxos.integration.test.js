/*
  Integration tests for the utxos.js library
*/

import chai from 'chai'
import BCHJS from '@psf/bch-js'

import AdapterRouter from '../../lib/adapters/router.js'
import UTXOs from '../../lib/utxos.js'

const { assert } = chai
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

    it('should initialize and return the utxoStore using web 3', async () => {
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
