/*
  Unit tests for the lib/adapters/router.js library.
*/

// Public npm libraries
const assert = require('chai').assert
const sinon = require('sinon')
const BCHJS = require('@psf/bch-js')

const AdapterRouter = require('../../lib/adapters/router')

let uut

describe('#adapter-router', () => {
  let sandbox
  // let utxos

  beforeEach(() => {
    const bchjs = new BCHJS()
    uut = new AdapterRouter({ bchjs })

    sandbox = sinon.createSandbox()

    // mockData = Object.assign({}, mockDataLib)
    // sendMockData = Object.assign({}, sendMockDataLib)
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if bch-js is not included', () => {
      try {
        uut = new AdapterRouter()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Must pass instance of bch-js when instantiating AdapterRouter.'
        )
      }
    })

    it('should select rest-api by default', () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs })

      assert.equal(uut.interface, 'rest-api')
    })

    it('should select consumer-api interface', () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      assert.equal(uut.interface, 'consumer-api')
    })

    it('should override restURL for consumer API', () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({
        bchjs,
        interface: 'consumer-api',
        restURL: 'fakeUrl'
      })

      assert.equal(uut.interface, 'consumer-api')
      assert.equal(uut.bchConsumer.restURL, 'fakeUrl')
    })
  })

  describe('#getUtxos', () => {
    it('should throw an error if address is not specified', async () => {
      try {
        await uut.getUtxos()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Address string required when calling getUtxos()'
        )
      }
    })

    it('should use bch-js by default', async () => {
      // Mock dependencies.
      sandbox.stub(uut.bchjs.Utxo, 'get').resolves(['test str'])

      const result = await uut.getUtxos('fake-addr')

      assert.equal(result, 'test str')
    })

    it('should use wallet service when consumer interface is selected', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies.
      sandbox.stub(uut.bchConsumer.bch, 'getUtxos').resolves(['test str'])

      const result = await uut.getUtxos('fake-addr')

      assert.equal(result, 'test str')
    })

    it('should throw error if communication error with bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies.
      sandbox
        .stub(uut.bchConsumer.bch, 'getUtxos')
        .resolves([{ success: false, message: 'test error' }])

      try {
        await uut.getUtxos('fake-addr')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.getUtxos('fake-addr')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })
  })

  describe('#sendTx', () => {
    it('should throw an error hex is not specified', async () => {
      try {
        await uut.sendTx()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Hex encoded transaction required as input.'
        )
      }
    })

    it('should use bch-js by default', async () => {
      // Mock dependencies.
      sandbox
        .stub(uut.bchjs.RawTransactions, 'sendRawTransaction')
        .resolves(['txid-str'])

      const result = await uut.sendTx('fakeHex')

      assert.equal(result, 'txid-str')
    })

    it('should catch full-node errors thrown by bch-js', async () => {
      // Mock dependencies.
      sandbox
        .stub(uut.bchjs.RawTransactions, 'sendRawTransaction')
        .rejects({ error: 'test error' })

      try {
        await uut.sendTx('fakeHex')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })

    it('should use wallet service when consumer-api interface is selected', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies.
      sandbox.stub(uut.bchConsumer.bch, 'sendTx').resolves({ txid: 'txid-str' })

      const result = await uut.sendTx('fakeHex')

      assert.equal(result, 'txid-str')
    })

    it('should throw error if communication error with bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies.
      sandbox
        .stub(uut.bchConsumer.bch, 'sendTx')
        .resolves({ success: false, message: 'test error' })

      try {
        await uut.sendTx('fakeHex')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.sendTx('fake-addr')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })
  })

  describe('#getBalance', () => {
    it('should throw an error if address is not specified', async () => {
      try {
        await uut.getBalance()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Address string required when calling getBalance()'
        )
      }
    })

    it('should use bch-js by default', async () => {
      // Mock dependencies.
      sandbox.stub(uut.bchjs.Electrumx, 'balance').resolves('test str')

      const result = await uut.getBalance('fake-addr')

      assert.equal(result, 'test str')
    })

    it('should use wallet service when consumer interface is selected', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies.
      sandbox
        .stub(uut.bchConsumer.bch, 'getBalance')
        .resolves({ success: true, balances: [{ balance: 'test str' }] })

      const result = await uut.getBalance('fake-addr')
      // console.log('result: ', result)

      assert.equal(result.balance, 'test str')
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.getBalance('fake-addr')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })

    it('should throw errors passed from service', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies.
      sandbox
        .stub(uut.bchConsumer.bch, 'getBalance')
        .resolves({ success: false, message: 'test-error' })

      try {
        await uut.getBalance('fake-addr')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test-error')
      }
    })
  })

  describe('#getTransactions', () => {
    it('should throw an error if address is not specified', async () => {
      try {
        await uut.getTransactions()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Address string required when calling getTransactions()'
        )
      }
    })

    it('should use bch-js by default', async () => {
      // Mock dependencies.
      sandbox.stub(uut.bchjs.Electrumx, 'transactions').resolves({ transactions: 'test str' })
      sandbox.stub(uut.bchjs.Electrumx, 'sortAllTxs').resolves('test str')

      const result = await uut.getTransactions('fake-addr')
      // console.log('result: ', result)

      assert.equal(result.transactions, 'test str')
    })

    it('should use wallet service when consumer interface is selected', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies.
      sandbox.stub(uut.bchConsumer.bch, 'getTxHistory').resolves({
        success: true,
        txs: ['test str']
      })

      const result = await uut.getTransactions('fake-addr')
      // console.log('result: ', result)

      assert.equal(result.transactions, 'test str')
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.getTransactions('fake-addr')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })
  })

  describe('#getTxData', () => {
    it('should throw an error if txids is a string', async () => {
      try {
        await uut.getTxData('blah')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Input txids must be an array of TXIDs. Up to 20.'
        )
      }
    })

    it('should use bch-js by default', async () => {
      // Mock dependencies.
      sandbox
        .stub(uut.bchjs.PsfSlpIndexer, 'tx')
        .resolves({ txData: { key: 'value' } })

      const result = await uut.getTxData(['fake-txid'])
      // console.log('result: ', result)

      assert.isArray(result)
      assert.equal(result[0].key, 'value')
    })

    it('should get data from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies.
      sandbox
        .stub(uut.bchConsumer.bch, 'getTxData')
        .resolves([{ key: 'value' }])

      const result = await uut.getTxData(['fake-txid'])
      // console.log('result: ', result)

      assert.isArray(result)
      assert.equal(result[0].key, 'value')
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.getTxData(['fake-addr'])

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })
  })

  describe('#getUsd', () => {
    it('should get price from bch-js', async () => {
      // Mock dependencies
      sandbox.stub(uut.bchjs.Price, 'getUsd').resolves(100)

      // Force selected interface.
      uut.interface = 'rest-api'

      const result = await uut.getUsd()

      assert.equal(result, 100)
    })

    it('should get price from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies
      sandbox.stub(uut.bchConsumer.bch, 'getUsd').resolves(100)

      // Force selected interface.
      uut.interface = 'consumer-api'

      const result = await uut.getUsd()

      assert.equal(result, 100)
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.getUsd()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })
  })

  describe('#utxoIsValid', () => {
    it('should validate UTXO from bch-js', async () => {
      // Mock dependencies
      sandbox.stub(uut.bchjs.Utxo, 'isValid').resolves(true)

      // Force selected interface.
      uut.interface = 'rest-api'

      const utxo = {
        tx_hash: 'b94e1ff82eb5781f98296f0af2488ff06202f12ee92b0175963b8dba688d1b40',
        tx_pos: 0
      }

      const result = await uut.utxoIsValid(utxo)

      assert.equal(result, true)
    })

    it('should validate UTXO from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies
      sandbox.stub(uut.bchConsumer.bch, 'utxoIsValid').resolves({ isValid: true })

      // Force selected interface.
      uut.interface = 'consumer-api'

      const utxo = {
        tx_hash: 'b94e1ff82eb5781f98296f0af2488ff06202f12ee92b0175963b8dba688d1b40',
        tx_pos: 0
      }

      const result = await uut.utxoIsValid(utxo)

      assert.equal(result, true)
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        const utxo = {
          tx_hash: 'b94e1ff82eb5781f98296f0af2488ff06202f12ee92b0175963b8dba688d1b40',
          tx_pos: 0
        }

        await uut.utxoIsValid(utxo)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })

    it('should throw an error if utxo is not specified', async () => {
      try {
        await uut.utxoIsValid()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'utxo required as input.')
      }
    })
  })

  describe('#getTokenData', () => {
    it('should get token data from bch-js', async () => {
      // Mock dependencies
      sandbox.stub(uut.bchjs.PsfSlpIndexer, 'getTokenData').resolves({
        genesisData: {},
        immutableData: {},
        mutableData: {}
      })

      // Force selected interface.
      uut.interface = 'rest-api'

      const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'

      const result = await uut.getTokenData(tokenId)

      assert.property(result, 'genesisData')
      assert.property(result, 'immutableData')
      assert.property(result, 'mutableData')
    })

    it('should get token data from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies
      sandbox.stub(uut.bchConsumer.bch, 'getTokenData').resolves({
        success: true,
        tokenData: {
          genesisData: {},
          immutableData: {},
          mutableData: {}
        }
      })

      const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'

      const result = await uut.getTokenData(tokenId)

      assert.property(result, 'genesisData')
      assert.property(result, 'immutableData')
      assert.property(result, 'mutableData')
    })

    // it('should throw an error if an interface is not specified', async () => {
    //   try {
    //     uut.interface = ''
    //
    //     const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'
    //
    //     await uut.getTokenData(tokenId)
    //
    //     assert.fail('Unexpected code path')
    //   } catch (err) {
    //     assert.include(err.message, 'this.interface is not specified')
    //   }
    // })

    it('should throw an error if token ID is not provided', async () => {
      try {
        await uut.getTokenData()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'tokenId required as input.')
      }
    })

    it('should sent token txs to Electrum library for sorting', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      const tokenId =
        '5f31905f335fa932879c5aabfd1c14ac748f6696148bd300f845ea5016ad573e'

      // Mock dependencies and force desired code path.
      sandbox.stub(uut.bchConsumer.bch, 'getTokenData').resolves({
        success: true,
        tokenData: {
          genesisData: {
            txs: []
          },
          immutableData: {},
          mutableData: {}
        }
      })
      sandbox.stub(uut.bchjs.Electrumx, 'sortAllTxs').resolves([])

      const result = await uut.getTokenData(tokenId, true)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result.genesisData.txs)
    })

    // CT 4/6/23 Saw this error in the wild. Created an error handler for it.
    it('should throw error if genesis data has no txs', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      const tokenId =
        '5f31905f335fa932879c5aabfd1c14ac748f6696148bd300f845ea5016ad573e'

      // Mock dependencies and force desired code path.
      sandbox.stub(uut.bchConsumer.bch, 'getTokenData').resolves({
        success: true,
        tokenData: {
          genesisData: {
          },
          immutableData: {},
          mutableData: {}
        }
      })
      sandbox.stub(uut.bchjs.Electrumx, 'sortAllTxs').resolves([])

      try {
        await uut.getTokenData(tokenId, true)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'No transaction history included with genesis data.')
      }
    })

    // CT 4/6/23 Saw this error in the wild
    it('should throw error if timeout occurs with wallet service', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies
      sandbox.stub(uut.bchConsumer.bch, 'getTokenData').resolves({
        success: false,
        message: 'request timed out',
        data: ''
      })

      const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'

      try {
        await uut.getTokenData(tokenId)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'request timed out')
      }
    })
  })

  describe('#getTokenData2', () => {
    it('should get token data from bch-js', async () => {
      // Mock dependencies
      sandbox.stub(uut.bchjs.PsfSlpIndexer, 'getTokenData2').resolves({
        tokenIcon: {},
        tokenStats: {},
        optimizedTokenIcon: {},
        iconRepoCompatible: {},
        ps002Compatible: {}
      })

      // Force selected interface.
      uut.interface = 'rest-api'

      const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'

      const result = await uut.getTokenData2(tokenId)

      assert.property(result, 'tokenIcon')
      assert.property(result, 'tokenStats')
      assert.property(result, 'optimizedTokenIcon')
      assert.property(result, 'iconRepoCompatible')
      assert.property(result, 'ps002Compatible')
    })

    it('should get token data from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies
      sandbox.stub(uut.bchConsumer.bch, 'getTokenData2').resolves({
        tokenData: {
          tokenIcon: {},
          tokenStats: {},
          optimizedTokenIcon: {},
          iconRepoCompatible: {},
          ps002Compatible: {}
        }
      })

      const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'

      const result = await uut.getTokenData2(tokenId)

      assert.property(result, 'tokenIcon')
      assert.property(result, 'tokenStats')
      assert.property(result, 'optimizedTokenIcon')
      assert.property(result, 'iconRepoCompatible')
      assert.property(result, 'ps002Compatible')
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        const tokenId = 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d'

        await uut.getTokenData2(tokenId)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })

    it('should throw an error if token ID is not provided', async () => {
      try {
        await uut.getTokenData2()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'tokenId required as input.')
      }
    })
  })

  describe('#getPubKey', () => {
    it('should return pubkey from bch-js', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.bchjs.encryption, 'getPubKey').resolves({
        success: true,
        publicKey: '033a24d13b45eaf53bebc7da5b7ee79a39615790b4fb16dab048fdcc5abd3764ef'
      })

      const addr =
        'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'

      const result = await uut.getPubKey(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isString(result)
    })

    it('should return pubkey from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies and force desired code path
      sandbox.stub(uut.bchConsumer.msg, 'getPubKey').resolves({
        success: true,
        status: 200,
        endpoint: 'pubkey',
        pubkey: {
          success: true,
          publicKey: '033a24d13b45eaf53bebc7da5b7ee79a39615790b4fb16dab048fdcc5abd3764ef'
        }
      })

      const addr =
        'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'

      const result = await uut.getPubKey(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isString(result)
    })

    it('should handle address without a pubkey from bch-js', async () => {
      try {
        // Mock dependencies and force desired code path
        sandbox.stub(uut.bchjs.encryption, 'getPubKey').rejects({
          success: false,
          error: 'No transaction history.'
        })

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
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies and force desired code path
      sandbox.stub(uut.bchConsumer.msg, 'getPubKey').resolves({
        success: false,
        status: 422,
        message: 'No transaction history.',
        endpoint: 'pubkey'
      })

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

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.getPubKey('fake-addr')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })

    it('should throw an error if token ID is not provided', async () => {
      try {
        await uut.getPubKey()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'addr required as input.')
      }
    })
  })

  describe('#getPsfWritePrice', () => {
    it('should get price from bch-js', async () => {
      // Mock dependencies
      sandbox.stub(uut.bchjs.Price, 'getPsffppPrice').resolves(100)

      // Force selected interface.
      uut.interface = 'rest-api'

      const result = await uut.getPsfWritePrice()

      assert.equal(result, 100)
    })
    it('should handle bchjs error', async () => {
      try {
        // Mock dependencies
        sandbox.stub(uut.bchjs.Price, 'getPsffppPrice').throws(new Error('error message'))
        // Force selected interface.
        uut.interface = 'rest-api'

        await uut.getPsfWritePrice()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'error message')
      }
    })

    it('should get price from bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies
      sandbox.stub(uut.bchConsumer.bch, 'getPsffppWritePrice').resolves(100)

      // Force selected interface.
      uut.interface = 'consumer-api'

      const result = await uut.getPsfWritePrice()

      assert.equal(result, 100)
    })

    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.getPsfWritePrice()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })
  })

  describe('#cid2json', () => {
    it('should convert a CID to a JSON object for bch-consumer', async () => {
      const bchjs = new BCHJS()
      uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

      // Mock dependencies and force desired code path
      sandbox.stub(uut.bchConsumer.bch, 'cid2json').resolves({ key: 'value' })

      // Force selected interface.
      uut.interface = 'consumer-api'

      const result = await uut.cid2json({ cid: 'fake-cid' })

      assert.equal(result.key, 'value')
    })

    it('should throw an error for rest-api interface', async () => {
      try {
        uut.interface = 'rest-api'

        await uut.cid2json({ cid: 'fake-cid' })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'cid2json() is not supported with the rest-api interface.')
      }
    })
    it('should throw an error if an interface is not specified', async () => {
      try {
        uut.interface = ''

        await uut.cid2json({ cid: 'fake-cid' })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'this.interface is not specified')
      }
    })
    it('should handle axios error', async () => {
      try {
        const bchjs = new BCHJS()
        uut = new AdapterRouter({ bchjs, interface: 'consumer-api' })

        const axiosErr = new Error('axios error')
        axiosErr.isAxiosError = true
        axiosErr.response = { data: 'axios error data' }

        sandbox.stub(uut.bchConsumer.bch, 'cid2json').throws(axiosErr)

        uut.interface = 'consumer-api'

        await uut.cid2json({ cid: 'fake-cid' })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'axios error data')
      }
    })
    it('should throw an error if no CID is provided', async () => {
      try {
        await uut.cid2json()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'cid required as input.')
      }
    })
  })
})
