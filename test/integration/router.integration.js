/*
  Integration tests for the router.js file. These tests ensure that the
  same data is returned, regardless of which source it comes from.
*/

// Global npm libraries
import chai from 'chai'
import BCHJS from '@psf/bch-js'

// Local libraries
import Router from '../../lib/adapters/router.js'

const { assert } = chai

// const restURL = 'http://localhost:5005'
// const restURL = 'https://free-bch.fullstack.cash'
const consumerURL = process.env.CONSUMER_URL

describe('#router.js', () => {
  let uut

  beforeEach(() => {
    const bchjs = new BCHJS({
      restURL: process.env.REST_URL
    })
    uut = new Router({ bchjs, interface: 'rest-api', restURL: process.env.REST_URL })
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
      const bchjs = new BCHJS({restURL: consumerURL})
      uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })

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
      const bchjs = new BCHJS({restURL: 'http://placeholder'})
      uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })
  
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
      const bchjs = new BCHJS({restURL: 'http://placeholder'})
      uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })
  
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
        const bchjs = new BCHJS({restURL: 'http://placeholder'})
        uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })
  
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
      const bchjs = new BCHJS({restURL: 'http://placeholder'})
      uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })
  
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
      const bchjs = new BCHJS({restURL: 'http://placeholder'})
      uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })
  
      const txids = [
        '5f31905f335fa932879c5aabfd1c14ac748f6696148bd300f845ea5016ad573e'
      ]
  
      const result = await uut.getTxData(txids, true)
      // console.log('result: ', result)
  
      assert.isArray(result)
      assert.equal(result.length, 1)
      assert.equal(result[0].txid, txids[0])
    })
  })
  
  describe('#utxoIsValid', async () => {
    it('should validate UTXO from bch-js', async () => {
      const utxo = {
        tx_hash: 'a2059b1321e96a90a386894a68fa5829756118895b3cdb9a0393d94fd2ceed93',
        tx_pos: 0
      }
  
      const result = await uut.utxoIsValid(utxo)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  
      assert.equal(result, true)
    })
  
    it('should validate UTXO from bch-consumer', async () => {
      const bchjs = new BCHJS({restURL: 'http://placeholder'})
      uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })
  
      const utxo = {
        tx_hash: 'a2059b1321e96a90a386894a68fa5829756118895b3cdb9a0393d94fd2ceed93',
        tx_pos: 0
      }
  
      const result = await uut.utxoIsValid(utxo)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  
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
  
    it('should get token data from web 3 infra', async () => {
      const bchjs = new BCHJS({restURL: 'http://placeholder'})
      uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })
  
      const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'
  
      const result = await uut.getTokenData(tokenId)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  
      assert.property(result, 'genesisData')
      assert.property(result, 'immutableData')
      assert.property(result, 'mutableData')
    })
  
    it('should get token data with TX history from web 2', async () => {
      const tokenId = '43eddfb11c9941edffb8c8815574bb0a43969a7b1de39ad14cd043eaa24fd38d'
  
      const result = await uut.getTokenData(tokenId, true)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  
      assert.isArray(result.genesisData.txs)
    })
  
    it('should get token data with TX history from web 3', async () => {
      const bchjs = new BCHJS({restURL: 'http://placeholder'})
      uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })
  
      const tokenId = '43eddfb11c9941edffb8c8815574bb0a43969a7b1de39ad14cd043eaa24fd38d'
  
      const result = await uut.getTokenData(tokenId, true)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  
      assert.isArray(result.genesisData.txs)
    })
  
    it('should return token txs in ascending order from bch-consumer', async () => {
      const bchjs = new BCHJS({restURL: 'http://placeholder'})
      uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })
  
      const tokenId =
        '5f31905f335fa932879c5aabfd1c14ac748f6696148bd300f845ea5016ad573e'
  
      const result = await uut.getTokenData(tokenId, true)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  
      const firstHeight = result.genesisData.txs[0].height
      const lastTx = result.genesisData.txs.length - 1
      const lastHeight = result.genesisData.txs[lastTx].height
  
      assert.isAbove(lastHeight, firstHeight)
    })
  
    it('should return token txs in ascending order from bch-js', async () => {
      // const bchjs = new BCHJS()
      // uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })
  
      const tokenId =
        '5f31905f335fa932879c5aabfd1c14ac748f6696148bd300f845ea5016ad573e'
  
      const result = await uut.getTokenData(tokenId, true)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  
      const firstHeight = result.genesisData.txs[0].height
      const lastTx = result.genesisData.txs.length - 1
      const lastHeight = result.genesisData.txs[lastTx].height
  
      assert.isAbove(lastHeight, firstHeight)
    })
  
    it('should return token txs in ascending order from bch-consumer', async () => {
      const bchjs = new BCHJS({restURL: 'http://placeholder'})
      uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })
  
      const tokenId =
        '5f31905f335fa932879c5aabfd1c14ac748f6696148bd300f845ea5016ad573e'
  
      const result = await uut.getTokenData(tokenId, true, 'ASCENDING')
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  
      const firstHeight = result.genesisData.txs[0].height
      const lastTx = result.genesisData.txs.length - 1
      const lastHeight = result.genesisData.txs[lastTx].height
  
      assert.isAbove(lastHeight, firstHeight)
    })
  
    it('should return token txs in ascending order from bch-js', async () => {
      // const bchjs = new BCHJS()
      // uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })
  
      const tokenId =
        '5f31905f335fa932879c5aabfd1c14ac748f6696148bd300f845ea5016ad573e'
  
      const result = await uut.getTokenData(tokenId, true, 'ASCENDING')
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  
      const firstHeight = result.genesisData.txs[0].height
      const lastTx = result.genesisData.txs.length - 1
      const lastHeight = result.genesisData.txs[lastTx].height
  
      assert.isAbove(lastHeight, firstHeight)
    })
  })
  
  describe('#getPubKey', () => {
    it('should return pubkey from bch-js', async () => {
      const addr =
        'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'
  
      const result = await uut.getPubKey(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  
      assert.isString(result)
    })
  
    it('should return pubkey from bch-consumer', async () => {
      const bchjs = new BCHJS({restURL: 'http://placeholder'})
      uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })
  
      const addr =
        'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'
  
      const result = await uut.getPubKey(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)
  
      assert.isString(result)
    })
  
    it('should handle address without a pubkey from bch-js', async () => {
      try {
        const addr =
          'bitcoincash:qzxeg2p27ls5mkgcy56spadfydau0cyk0y4g90sgtl'
  
        await uut.getPubKey(addr)
  
        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'No transaction history')
      }
    })
  
    it('should handle address without a pubkey from bch-consumer', async () => {
      const bchjs = new BCHJS({restURL: 'http://placeholder'})
      uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })
  
      try {
        const addr =
          'bitcoincash:qzxeg2p27ls5mkgcy56spadfydau0cyk0y4g90sgtl'
  
        await uut.getPubKey(addr)
  
        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'No transaction history')
      }
    })
  })
  
  describe('#getPsfWritePrice', () => {
    it('should get getPsfWritePrice price from bch-js', async () => {
      const result = await uut.getPsfWritePrice()
      console.log('result: ', result)
  
      assert.isNumber(result)
    })
  
    it('should get getPsfWritePrice price from bch-consumer', async () => {
      const bchjs = new BCHJS({restURL: 'http://placeholder'})
      uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })
  
      const result = await uut.getPsfWritePrice()
      // console.log('result: ', result)
  
      assert.isNumber(result)
    })
  })

  describe('#cid2json', () => {
    it('should convert a CID to a JSON object from bch-consumer', async () => {
      const bchjs = new BCHJS({restURL: 'http://placeholder'})
      uut = new Router({ bchjs, interface: 'consumer-api', consumerURL })

      // const cid = 'bafkreigbgrvpagnmrqz2vhofifrqobigsxkdvnvikf5iqrkrbwrzirazhm'
      const cid = 'bafybeihm637ky2kpuucvmtyoh4ulpelxhpo3fffmu6cb6ci6jchdztrqxm'

      const result = await uut.cid2json({ cid })
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.property(result, 'success')
      assert.property(result, 'json')

      assert.equal(result.success, true)
    })
  })
})
