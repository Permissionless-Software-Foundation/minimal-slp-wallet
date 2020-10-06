/*
  Integration tests for the utxos.js library
*/

const assert = require('chai').assert

const UTXOs = require('../../lib/utxos')
let uut

describe('#UTXOs', () => {
  beforeEach(() => {
    uut = new UTXOs()
  })

  describe('#getUtxos', () => {
    it('should retrieve UTXOs', async () => {
      const addr = 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      const utxos = await uut.getUtxos(addr)
      // console.log('utxos: ', utxos)

      assert.isArray(utxos)
      assert.property(utxos[0], 'height')
      assert.property(utxos[0], 'tx_hash')
      assert.property(utxos[0], 'tx_pos')
      assert.property(utxos[0], 'value')
    })
  })

  describe('#hydrate', () => {
    it('should hydrate some UTXOs', async () => {
      const addr = 'bitcoincash:qqaqa62t2uhv9cl6ze3appmvy3tnz8kyvyd54cex00'

      const utxos = await uut.getUtxos(addr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      const hydratedUtxos = await uut.hydrate(utxos)
      // console.log(`hydratedUtxos: ${JSON.stringify(hydratedUtxos, null, 2)}`)

      assert.isArray(hydratedUtxos)
      assert.equal(hydratedUtxos.length, 3)

      // Each UTXO returned should have an isValid property.
      hydratedUtxos.forEach(elem => assert.property(elem, 'isValid'))
    })

    // This test evaluates an address that has been 'dust attacked' with a
    // transaction that SLPDB won't evaluate. As a result, the SLPDB-based
    // hydrateUTXOs call will return 'null'
    it('should hydrate UTXOs from a dust attack', async () => {
      const addr = 'bitcoincash:qrv7l8qaerhng6flj60dx0f5nfxmhqtf9qjwlw9hg3'

      const utxos = await uut.getUtxos(addr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      const hydratedUtxos = await uut.hydrate(utxos)
      // console.log(`hydratedUtxos: ${JSON.stringify(hydratedUtxos, null, 2)}`)

      assert.isArray(hydratedUtxos)

      // At the time of writing this test, the address has 2 utxos.
      assert.equal(hydratedUtxos.length, 2)

      // With the backup hydrate function, neight UTXO should show isValid=null.
      assert.notEqual(hydratedUtxos[0].isValid, null)
      assert.notEqual(hydratedUtxos[1].isValid, null)
    })
  })

  describe('#initUtxoStore', () => {
    it('should initialize and return the utxoStore', async () => {
      const addr = 'bitcoincash:qqaqa62t2uhv9cl6ze3appmvy3tnz8kyvyd54cex00'

      const utxos = await uut.initUtxoStore(addr)
      // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)

      // Each UTXO returned should have an isValid property.
      utxos.forEach(elem => assert.property(elem, 'isValid'))

      // The UTXO store should match the returned data.
      assert.deepEqual(uut.utxoStore, utxos)

      // Token and BCH UTXOs should be separate.
      assert.equal(uut.bchUtxos.length, 1)
      assert.equal(uut.tokenUtxos.length, 2)
    })
  })
})
