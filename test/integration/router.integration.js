/*
  Integration tests for the router.js file. These tests ensure that the
  same data is retrurned, regardless of which source it comes from.
*/

// Global npm libraries
const assert = require('chai').assert
const BCHJS = require('@psf/bch-js')

// Local libraries
const Router = require('../../lib/adapters/router')

describe('#router.js', () => {
  let uut

  beforeEach(() => {
    const bchjs = new BCHJS()
    uut = new Router({ bchjs })
  })

  describe('#getBalances', () => {
    it('should get a balance from bch-js', async () => {
      const addr = 'bitcoincash:qrl2nlsaayk6ekxn80pq0ks32dya8xfclyktem2mqj'

      const result = await uut.getBalance(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.success, true)
      assert.property(result.balance, 'confirmed')
      assert.property(result.balance, 'unconfirmed')
    })

    it('should get a balance from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new Router({ bchjs, interface: 'consumer-api' })

      const addr = 'bitcoincash:qrl2nlsaayk6ekxn80pq0ks32dya8xfclyktem2mqj'

      const result = await uut.getBalance(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.success, true)
      assert.property(result.balance, 'confirmed')
      assert.property(result.balance, 'unconfirmed')
    })
  })

  describe('#getUtxos', () => {
    it('should get UTXOs from bch-js', async () => {
      const addr = 'bitcoincash:qrl2nlsaayk6ekxn80pq0ks32dya8xfclyktem2mqj'

      const result = await uut.getUtxos(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result[0].address, addr)
      assert.property(result[0], 'bchUtxos')
      assert.property(result[0], 'slpUtxos')
    })

    it('should get UTXOs from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new Router({ bchjs, interface: 'consumer-api' })

      const addr = 'bitcoincash:qrl2nlsaayk6ekxn80pq0ks32dya8xfclyktem2mqj'

      const result = await uut.getUtxos(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result[0].address, addr)
      assert.property(result[0], 'bchUtxos')
      assert.property(result[0], 'slpUtxos')
    })
  })

  describe('#getTransactions', () => {
    it('should get a transaction history from bch-js', async () => {
      const addr = 'bitcoincash:qrl2nlsaayk6ekxn80pq0ks32dya8xfclyktem2mqj'

      const result = await uut.getTransactions(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.success, true)
      assert.property(result.transactions[0], 'height')
      assert.property(result.transactions[0], 'tx_hash')
    })

    it('should get a transaction history from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new Router({ bchjs, interface: 'consumer-api' })

      const addr = 'bitcoincash:qrl2nlsaayk6ekxn80pq0ks32dya8xfclyktem2mqj'

      const result = await uut.getTransactions(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.success, true)
      assert.property(result.transactions[0], 'height')
      assert.property(result.transactions[0], 'tx_hash')
    })
  })

  describe('#sendTx', () => {
    it('should send a tx through bch-js', async () => {
      const hex =
        '01000000013ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a000000006a4730440220540986d1c58d6e76f8f05501c520c38ce55393d0ed7ed3c3a82c69af04221232022058ea43ed6c05fec0eccce749a63332ed4525460105346f11108b9c26df93cd72012103083dfc5a0254613941ddc91af39ff90cd711cdcde03a87b144b883b524660c39ffffffff01807c814a000000001976a914d7e7c4e0b70eaa67ceff9d2823d1bbb9f6df9a5188ac00000000'

      const result = await uut.sendTx(hex)
      console.log(`result: ${JSON.stringify(result, null, 2)}`)

      // assert.equal(result.success, false)
      // assert.equal(result.status, 422)
      // assert.equal(result.endpoint, 'broadcast')
    })

    it('should send a tx through bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new Router({ bchjs, interface: 'consumer-api' })

      const hex =
        '01000000013ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a000000006a4730440220540986d1c58d6e76f8f05501c520c38ce55393d0ed7ed3c3a82c69af04221232022058ea43ed6c05fec0eccce749a63332ed4525460105346f11108b9c26df93cd72012103083dfc5a0254613941ddc91af39ff90cd711cdcde03a87b144b883b524660c39ffffffff01807c814a000000001976a914d7e7c4e0b70eaa67ceff9d2823d1bbb9f6df9a5188ac00000000'

      const result = await uut.sendTx(hex)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.success, false)
      assert.equal(result.status, 422)
      assert.equal(result.endpoint, 'broadcast')
    })
  })
})
