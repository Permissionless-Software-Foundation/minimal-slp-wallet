/*
  Integration tests for the router.js file. These tests ensure that the
  same data is retrurned, regardless of which source it comes from.
*/

// Global npm libraries
const assert = require('chai').assert
const BCHJS = require('@psf/bch-js')

// Local libraries
const Router = require('../../lib/adapters/router')

// const restURL = 'http://localhost:5005'
const restURL = 'https://free-bch.fullstack.cash'

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

      assert.equal(result.address, addr)
      assert.property(result, 'bchUtxos')
      assert.property(result, 'slpUtxos')
    })

    it('should get UTXOs from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new Router({ bchjs, interface: 'consumer-api' })

      const addr = 'bitcoincash:qrl2nlsaayk6ekxn80pq0ks32dya8xfclyktem2mqj'

      const result = await uut.getUtxos(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result.address, addr)
      assert.property(result, 'bchUtxos')
      assert.property(result, 'slpUtxos')
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
      try {
        const hex =
          '01000000013ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a000000006a4730440220540986d1c58d6e76f8f05501c520c38ce55393d0ed7ed3c3a82c69af04221232022058ea43ed6c05fec0eccce749a63332ed4525460105346f11108b9c26df93cd72012103083dfc5a0254613941ddc91af39ff90cd711cdcde03a87b144b883b524660c39ffffffff01807c814a000000001976a914d7e7c4e0b70eaa67ceff9d2823d1bbb9f6df9a5188ac00000000'

        await uut.sendTx(hex)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Missing inputs')
      }
    })

    it('should send a tx through bch-consumer', async () => {
      try {
        const bchjs = new BCHJS()
        uut = new Router({ bchjs, interface: 'consumer-api' })

        const hex =
          '01000000013ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a000000006a4730440220540986d1c58d6e76f8f05501c520c38ce55393d0ed7ed3c3a82c69af04221232022058ea43ed6c05fec0eccce749a63332ed4525460105346f11108b9c26df93cd72012103083dfc5a0254613941ddc91af39ff90cd711cdcde03a87b144b883b524660c39ffffffff01807c814a000000001976a914d7e7c4e0b70eaa67ceff9d2823d1bbb9f6df9a5188ac00000000'

        await uut.sendTx(hex)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Missing inputs')
      }
    })
  })

  describe('#getUsd', () => {
    it('should get USD price from bch-js', async () => {
      const result = await uut.getUsd()
      // console.log('result: ', result)

      assert.isAbove(result, 0)
    })

    it('should get USD price from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new Router({ bchjs, interface: 'consumer-api' })

      const result = await uut.getUsd()
      // console.log('result: ', result)

      assert.isAbove(result, 0)
    })
  })

  describe('#getTxData', () => {
    it('should get a TX data from bch-js', async () => {
      const txids = [
        '01517ff1587fa5ffe6f5eb91c99cf3f2d22330cd7ee847e928ce90ca95bf781b'
      ]

      const result = await uut.getTxData(txids)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.equal(result.length, 1)
      assert.equal(result[0].txid, txids[0])
    })

    it('should get TX data from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new Router({ bchjs, interface: 'consumer-api' })

      const txids = [
        '01517ff1587fa5ffe6f5eb91c99cf3f2d22330cd7ee847e928ce90ca95bf781b'
      ]

      const result = await uut.getTxData(txids)
      // console.log('result: ', result)

      assert.isArray(result)
      assert.equal(result.length, 1)
      assert.equal(result[0].txid, txids[0])
    })
  })

  describe('#utxoIsValid', async () => {
    it('should validate UTXO from bch-js', async () => {
      const utxo = {
        tx_hash: 'b94e1ff82eb5781f98296f0af2488ff06202f12ee92b0175963b8dba688d1b40',
        tx_pos: 0
      }

      const result = await uut.utxoIsValid(utxo)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result, true)
    })

    it('should validate UTXO from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new Router({ bchjs, interface: 'consumer-api', restURL })

      const utxo = {
        tx_hash: 'b94e1ff82eb5781f98296f0af2488ff06202f12ee92b0175963b8dba688d1b40',
        tx_pos: 0
      }

      const result = await uut.utxoIsValid(utxo)
      console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.equal(result, true)
    })
  })

  describe('#getTokenData', async () => {
    it('should get token data from bch-js', async () => {
      const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'

      const result = await uut.getTokenData(tokenId)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'genesisData')
      assert.property(result, 'immutableData')
      assert.property(result, 'mutableData')
    })

    it('should validate UTXO from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new Router({ bchjs, interface: 'consumer-api', restURL })

      const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'

      const result = await uut.getTokenData(tokenId)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'genesisData')
      assert.property(result, 'immutableData')
      assert.property(result, 'mutableData')
    })
  })
})
