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

  // describe('#getUtxos', () => {
  //   it('should retrieve UTXOs', async () => {
  //     const addr = 'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'
  //
  //     const utxos = await uut.getUtxos(addr)
  //     // console.log('utxos: ', utxos)
  //
  //     assert.isArray(utxos)
  //     assert.property(utxos[0], 'height')
  //     assert.property(utxos[0], 'tx_hash')
  //     assert.property(utxos[0], 'tx_pos')
  //     assert.property(utxos[0], 'value')
  //   })
  // })

  // describe('#hydrate', () => {
  //   it('should hydrate some UTXOs', async () => {
  //     const addr = 'bitcoincash:qqaqa62t2uhv9cl6ze3appmvy3tnz8kyvyd54cex00'
  //
  //     const utxos = await uut.getUtxos(addr)
  //     // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)
  //
  //     const hydratedUtxos = await uut.hydrate(utxos)
  //     // console.log(`hydratedUtxos: ${JSON.stringify(hydratedUtxos, null, 2)}`)
  //
  //     assert.isArray(hydratedUtxos)
  //     assert.equal(hydratedUtxos.length, 3)
  //
  //     // Each UTXO returned should have an isValid property.
  //     hydratedUtxos.forEach(elem => assert.property(elem, 'isValid'))
  //   })
  //
  //   // This test evaluates an address that has been 'dust attacked' with a
  //   // transaction that SLPDB won't evaluate. As a result, the SLPDB-based
  //   // hydrateUTXOs call will return 'null'
  //   it('should hydrate UTXOs from a dust attack', async () => {
  //     const addr = 'bitcoincash:qrv7l8qaerhng6flj60dx0f5nfxmhqtf9qjwlw9hg3'
  //
  //     const utxos = await uut.getUtxos(addr)
  //     // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)
  //
  //     const hydratedUtxos = await uut.hydrate(utxos)
  //     // console.log(`hydratedUtxos: ${JSON.stringify(hydratedUtxos, null, 2)}`)
  //
  //     assert.isArray(hydratedUtxos)
  //
  //     // At the time of writing this test, the address has 2 utxos.
  //     assert.equal(hydratedUtxos.length, 2)
  //
  //     // With the backup hydrate function, neight UTXO should show isValid=null.
  //     assert.notEqual(hydratedUtxos[0].isValid, null)
  //     assert.notEqual(hydratedUtxos[1].isValid, null)
  //   })
  // })

  // describe('#initUtxoStore', () => {
  //   it('should initialize and return the utxoStore', async () => {
  //     const addr = 'bitcoincash:qqaqa62t2uhv9cl6ze3appmvy3tnz8kyvyd54cex00'
  //
  //     const utxos = await uut.initUtxoStore(addr)
  //     // console.log(`utxos: ${JSON.stringify(utxos, null, 2)}`)
  //
  //     // Each UTXO returned should have an isValid property.
  //     utxos.forEach(elem => assert.property(elem, 'isValid'))
  //
  //     // The UTXO store should match the returned data.
  //     assert.deepEqual(uut.utxoStore, utxos)
  //
  //     // Token and BCH UTXOs should be separate.
  //     assert.equal(uut.bchUtxos.length, 1)
  //     assert.equal(uut.tokenUtxos.length, 2)
  //   })
  // })

  describe('#initUtxoStore2', () => {
    it('should initialize and return the utxoStore', async () => {
      const addr = 'bitcoincash:qqaqa62t2uhv9cl6ze3appmvy3tnz8kyvyd54cex00'

      const result = await uut.initUtxoStore2(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'address')
      assert.property(result, 'bchUtxos')
      assert.property(result, 'nullUtxos')
      assert.property(result, 'slpUtxos')
    })
  })

  // describe('#bkupValidate', () => {
  //   it('should validate a dust attack', async () => {
  //     const utxo = {
  //       height: 655965,
  //       tx_hash: 'a675af87dcd8d39be782737aa52e0076b52eb2f5ce355ffcb5567a64dd96b77e',
  //       tx_pos: 21,
  //       value: 547,
  //       satoshis: 547,
  //       txid: 'a675af87dcd8d39be782737aa52e0076b52eb2f5ce355ffcb5567a64dd96b77e',
  //       vout: 21,
  //       isValid: null
  //     }
  //
  //     const hydratedUtxo = await uut.bkupValidate(utxo)
  //     // console.log(`hydratedUtxo: ${JSON.stringify(hydratedUtxo, null, 2)}`)
  //
  //     // Assert that expected properties exist.
  //     assert.property(hydratedUtxo, 'height')
  //     assert.property(hydratedUtxo, 'tx_hash')
  //     assert.property(hydratedUtxo, 'tx_pos')
  //     assert.property(hydratedUtxo, 'value')
  //     assert.property(hydratedUtxo, 'satoshis')
  //     assert.property(hydratedUtxo, 'txid')
  //     assert.property(hydratedUtxo, 'vout')
  //     assert.property(hydratedUtxo, 'isValid')
  //
  //     // Expecting isValid to be validated to false.
  //     assert.equal(hydratedUtxo.isValid, false)
  //   })
  // })
})
