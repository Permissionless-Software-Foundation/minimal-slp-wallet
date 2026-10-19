/*
  Unit tests for lib/bch-consumer.js
*/

import chai from 'chai'
import BchConsumer from '../../lib/bch-consumer.js'

const { assert } = chai

const restURL = 'https://example.test'

function mockHttp () {
  const calls = []
  return {
    calls,
    post: async (url, body) => {
      calls.push({ method: 'post', url, body })
      return {
        data: {
          success: true,
          usd: 250,
          psfPrice: 0.08,
          txData: [{ txid: 'abc' }],
          pubkey: { publicKey: '02aa' }
        }
      }
    },
    get: async (url) => {
      calls.push({ method: 'get', url })
      return {
        data: {
          usd: 250,
          psfPrice: 0.08,
          token: { id: 'cid' }
        }
      }
    }
  }
}

describe('#bch-consumer', () => {
  it('should default the REST URL', () => {
    const uut = new BchConsumer()
    assert.equal(uut.restURL, 'https://free-bch.fullstack.cash')
  })

  it('should use a provided REST URL', () => {
    const uut = new BchConsumer({ restURL })
    assert.equal(uut.restURL, restURL)
    assert.equal(uut.bch.restURL, restURL)
    assert.equal(uut.msg.restURL, restURL)
  })

  it('should post a single address balance', async () => {
    const http = mockHttp()
    const uut = new BchConsumer({ restURL, axios: http })

    const result = await uut.bch.getBalance('bitcoincash:qtest')

    assert.equal(result.success, true)
    assert.equal(http.calls[0].url, `${restURL}/bch/balance`)
    assert.deepEqual(http.calls[0].body, { addresses: ['bitcoincash:qtest'] })
  })

  it('should post an array of addresses for balance', async () => {
    const http = mockHttp()
    const uut = new BchConsumer({ restURL, axios: http })

    await uut.bch.getBalance(['bitcoincash:qone', 'bitcoincash:qtwo'])

    assert.deepEqual(http.calls[0].body, {
      addresses: ['bitcoincash:qone', 'bitcoincash:qtwo']
    })
  })

  it('should reject an invalid balance input', async () => {
    const uut = new BchConsumer({ restURL, axios: mockHttp() })

    try {
      await uut.bch.getBalance(12)
      assert.fail('Unexpected code path')
    } catch (err) {
      assert.include(err.message, 'Input must be a string')
    }
  })

  it('should post a single address for UTXOs', async () => {
    const http = mockHttp()
    const uut = new BchConsumer({ restURL, axios: http })

    await uut.bch.getUtxos('bitcoincash:qtest')

    assert.equal(http.calls[0].url, `${restURL}/bch/utxos`)
    assert.deepEqual(http.calls[0].body, { address: 'bitcoincash:qtest' })
  })

  it('should post a bulk UTXO lookup', async () => {
    const http = mockHttp()
    const uut = new BchConsumer({ restURL, axios: http })
    const addrs = ['bitcoincash:qone', 'bitcoincash:qtwo']

    await uut.bch.getUtxos(addrs)

    assert.equal(http.calls[0].url, `${restURL}/bch/utxosBulk`)
    assert.deepEqual(http.calls[0].body, { addresses: addrs })
  })

  it('should reject a UTXO lookup that is not a string or array', async () => {
    const uut = new BchConsumer({ restURL, axios: mockHttp() })

    try {
      await uut.bch.getUtxos(12)
      assert.fail('Unexpected code path')
    } catch (err) {
      assert.include(err.message, 'addr parameter must be an array or a string')
    }
  })

  it('should reject a bulk UTXO lookup over 20 addresses', async () => {
    const uut = new BchConsumer({ restURL, axios: mockHttp() })
    const addrs = Array.from({ length: 21 }, (_, i) => `addr${i}`)

    try {
      await uut.bch.getUtxos(addrs)
      assert.fail('Unexpected code path')
    } catch (err) {
      assert.include(err.message, 'must not exceed 20')
    }
  })

  it('should post transaction history', async () => {
    const http = mockHttp()
    const uut = new BchConsumer({ restURL, axios: http })

    await uut.bch.getTxHistory('bitcoincash:qtest', 'ASCENDING')

    assert.equal(http.calls[0].url, `${restURL}/bch/txHistory`)
    assert.deepEqual(http.calls[0].body, {
      address: 'bitcoincash:qtest',
      sortOrder: 'ASCENDING'
    })
  })

  it('should reject a non-string transaction history address', async () => {
    const uut = new BchConsumer({ restURL, axios: mockHttp() })

    try {
      await uut.bch.getTxHistory(['nope'])
      assert.fail('Unexpected code path')
    } catch (err) {
      assert.include(err.message, 'Input must be a string')
    }
  })

  it('should broadcast a hex transaction', async () => {
    const http = mockHttp()
    const uut = new BchConsumer({ restURL, axios: http })

    await uut.bch.sendTx('00ff')

    assert.equal(http.calls[0].url, `${restURL}/bch/broadcast`)
    assert.deepEqual(http.calls[0].body, { hex: '00ff' })
  })

  it('should reject a non-string transaction hex', async () => {
    const uut = new BchConsumer({ restURL, axios: mockHttp() })

    try {
      await uut.bch.sendTx(['00ff'])
      assert.fail('Unexpected code path')
    } catch (err) {
      assert.include(err.message, 'hex representation')
    }
  })

  it('should return transaction data from the response', async () => {
    const http = mockHttp()
    const uut = new BchConsumer({ restURL, axios: http })

    const result = await uut.bch.getTxData(['abc'])

    assert.deepEqual(result, [{ txid: 'abc' }])
    assert.equal(http.calls[0].url, `${restURL}/bch/txData`)
  })

  it('should reject transaction data input that is not an array', async () => {
    const uut = new BchConsumer({ restURL, axios: mockHttp() })

    try {
      await uut.bch.getTxData('abc')
      assert.fail('Unexpected code path')
    } catch (err) {
      assert.include(err.message, 'array of strings')
    }
  })

  it('should return the USD price', async () => {
    const uut = new BchConsumer({ restURL, axios: mockHttp() })
    const price = await uut.bch.getUsd()
    assert.equal(price, 250)
  })

  it('should post a UTXO validity check', async () => {
    const http = mockHttp()
    const uut = new BchConsumer({ restURL, axios: http })
    const utxo = { txid: 'abc', vout: 0 }

    await uut.bch.utxoIsValid(utxo)

    assert.equal(http.calls[0].url, `${restURL}/bch/utxoIsValid`)
    assert.deepEqual(http.calls[0].body, { utxo })
  })

  it('should post token data lookups', async () => {
    const http = mockHttp()
    const uut = new BchConsumer({ restURL, axios: http })

    await uut.bch.getTokenData('token-id', true)
    await uut.bch.getTokenData2('token-id', true)

    assert.equal(http.calls[0].url, `${restURL}/bch/getTokenData`)
    assert.deepEqual(http.calls[0].body, { tokenId: 'token-id', withTxHistory: true })
    assert.equal(http.calls[1].url, `${restURL}/bch/getTokenData2`)
    assert.deepEqual(http.calls[1].body, { tokenId: 'token-id', updateCache: true })
  })

  it('should return the PSF write price', async () => {
    const http = mockHttp()
    const uut = new BchConsumer({ restURL, axios: http })

    const price = await uut.bch.getPsffppWritePrice()

    assert.equal(price, 0.08)
    assert.equal(http.calls[0].url, `${restURL}/price/psffpp`)
  })

  it('should fetch JSON for a CID', async () => {
    const http = mockHttp()
    const uut = new BchConsumer({ restURL, axios: http })

    const result = await uut.bch.cid2json({ cid: 'bafytest' })

    assert.deepEqual(result, { usd: 250, psfPrice: 0.08, token: { id: 'cid' } })
    assert.equal(http.calls[0].url, `${restURL}/ipfs/cid2json/bafytest`)
  })

  it('should require a CID', async () => {
    const uut = new BchConsumer({ restURL, axios: mockHttp() })

    try {
      await uut.bch.cid2json({})
      assert.fail('Unexpected code path')
    } catch (err) {
      assert.include(err.message, 'cid is required')
    }
  })

  it('should post a public key lookup', async () => {
    const http = mockHttp()
    const uut = new BchConsumer({ restURL, axios: http })

    const result = await uut.msg.getPubKey('bitcoincash:qtest')

    assert.equal(result.pubkey.publicKey, '02aa')
    assert.equal(http.calls[0].url, `${restURL}/bch/pubkey`)
    assert.deepEqual(http.calls[0].body, { address: 'bitcoincash:qtest' })
  })

  it('should reject a non-string public key address', async () => {
    const uut = new BchConsumer({ restURL, axios: mockHttp() })

    try {
      await uut.msg.getPubKey(12)
      assert.fail('Unexpected code path')
    } catch (err) {
      assert.include(err.message, 'Input must be a string')
    }
  })
})
