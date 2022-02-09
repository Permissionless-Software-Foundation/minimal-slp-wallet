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
        .resolves('txid-str')

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
      sandbox.stub(uut.bchConsumer.bch, 'sendTx').resolves('txid-str')

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
      sandbox.stub(uut.bchjs.Electrumx, 'transactions').resolves('test str')

      const result = await uut.getTransactions('fake-addr')

      assert.equal(result, 'test str')
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
})
