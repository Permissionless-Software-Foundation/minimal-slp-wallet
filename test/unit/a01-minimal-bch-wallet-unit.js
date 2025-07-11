/*
  Unit tests for the main library.
*/

// npm libraries
const assert = require('chai').assert
const sinon = require('sinon')

// Mocking data libraries.
// const mockData = require('./mocks/util-mocks')
const mockUtxos = require('./mocks/utxo-mocks')

// Unit under test
const MinimalBCHWallet = require('../../index')

describe('#index.js - Minimal BCH Wallet', () => {
  let sandbox, uut

  // Restore the sandbox before each test.
  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new MinimalBCHWallet()
    await uut.walletInfoPromise
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should instantiate with default interface and restURL', async () => {
      uut = new MinimalBCHWallet()

      assert.equal(uut.ar.interface, 'consumer-api')
      assert.equal(uut.ar.bchjs.restURL, 'https://free-bch.fullstack.cash')
    })
    it('should create a new wallet without encrypted mnemonic', async () => {
      uut = new MinimalBCHWallet(undefined)
      await uut.walletInfoPromise
      // console.log('uut: ', uut)

      assert.property(uut, 'walletInfo')
      assert.property(uut, 'walletInfoPromise')
      assert.property(uut, 'walletInfoCreated')
      assert.equal(uut.walletInfoCreated, true)

      assert.property(uut.walletInfo, 'mnemonic')
      assert.isString(uut.walletInfo.mnemonic)
      assert.isNotEmpty(uut.walletInfo.mnemonic)

      assert.property(uut.walletInfo, 'privateKey')
      assert.isString(uut.walletInfo.privateKey)
      assert.isNotEmpty(uut.walletInfo.privateKey)

      assert.property(uut.walletInfo, 'cashAddress')
      assert.isString(uut.walletInfo.cashAddress)
      assert.isNotEmpty(uut.walletInfo.cashAddress)

      assert.property(uut.walletInfo, 'legacyAddress')
      assert.isString(uut.walletInfo.legacyAddress)
      assert.isNotEmpty(uut.walletInfo.legacyAddress)

      assert.property(uut.walletInfo, 'slpAddress')
      assert.isString(uut.walletInfo.slpAddress)
      assert.isNotEmpty(uut.walletInfo.slpAddress)

      assert.notProperty(uut, 'mnemonicEncrypted')
      assert.notProperty(uut.walletInfo, 'mnemonicEncrypted')

      assert.equal(uut.isInitialized, false)
    })

    it('should create a new wallet with encrypted mnemonic', async () => {
      uut = new MinimalBCHWallet(null, {
        password: 'myStrongPassword'
      })
      await uut.walletInfoPromise
      // console.log('uut: ', uut)

      assert.property(uut.walletInfo, 'mnemonic')
      assert.isString(uut.walletInfo.mnemonic)
      assert.isNotEmpty(uut.walletInfo.mnemonic)

      assert.property(uut.walletInfo, 'privateKey')
      assert.isString(uut.walletInfo.privateKey)
      assert.isNotEmpty(uut.walletInfo.privateKey)

      assert.property(uut.walletInfo, 'cashAddress')
      assert.isString(uut.walletInfo.cashAddress)
      assert.isNotEmpty(uut.walletInfo.cashAddress)

      assert.property(uut.walletInfo, 'legacyAddress')
      assert.isString(uut.walletInfo.legacyAddress)
      assert.isNotEmpty(uut.walletInfo.legacyAddress)

      assert.property(uut.walletInfo, 'slpAddress')
      assert.isString(uut.walletInfo.slpAddress)
      assert.isNotEmpty(uut.walletInfo.slpAddress)

      assert.property(uut.walletInfo, 'mnemonicEncrypted')
      assert.isString(uut.walletInfo.mnemonicEncrypted)
      assert.isNotEmpty(uut.walletInfo.mnemonicEncrypted)
    })

    it('should decrypt an encrypted mnemonic', async () => {
      // Mock the utxo store, to ignore it for this test.
      // sandbox.stub(uut.utxos, 'initUtxoStore').resolves([])

      const mnemonicEncrypted =
        'U2FsdGVkX18uyavim4FoIETcRxgOi1E/XFc1ARR3k6HVrJgH60YnLxjbs6yMnWMjpaqbBmSC3uYjhZ+cgFlndOEZI34T0sWFfL952CHCFjd2AjypCjFhqkmHzOCCkhgf'
      const mnemonic =
        'negative prepare champion corn bean proof one same column water warm melt'
      const password = 'myStrongPassword'

      uut = new MinimalBCHWallet(mnemonicEncrypted, {
        password: password
      })
      await uut.walletInfoPromise
      // console.log('uut: ', uut)

      assert.equal(uut.walletInfo.mnemonic, mnemonic)
    })

    it('should throw error if incorrect password', async () => {
      try {
        const mnemonicEncrypted =
          'U2FsdGVkX18uyavim4FoIETcRxgOi1E/XFc1ARR3k6HVrJgH60YnLxjbs6yMnWMjpaqbBmSC3uYjhZ+cgFlndOEZI34T0sWFfL952CHCFjd2AjypCjFhqkmHzOCCkhgf'

        uut = new MinimalBCHWallet(mnemonicEncrypted, {
          password: 'bad password'
        })
        await uut.walletInfoPromise

        assert.notProperty(uut.walletInfo, 'mnemonic', 'Unexpected result!')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Wrong password')
      }
    })

    it('should import clear-text wallet mnemonic', async () => {
      const mnemonic =
        'negative prepare champion corn bean proof one same column water warm melt'

      uut = new MinimalBCHWallet(mnemonic)
      await uut.walletInfoPromise
      // console.log('uut: ', uut)

      assert.property(uut.walletInfo, 'mnemonic')
      assert.isString(uut.walletInfo.mnemonic)
      assert.isNotEmpty(uut.walletInfo.mnemonic)
      assert.equal(uut.walletInfo.mnemonic, mnemonic)

      assert.property(uut.walletInfo, 'privateKey')
      assert.isString(uut.walletInfo.privateKey)
      assert.isNotEmpty(uut.walletInfo.privateKey)

      assert.property(uut.walletInfo, 'cashAddress')
      assert.isString(uut.walletInfo.cashAddress)
      assert.isNotEmpty(uut.walletInfo.cashAddress)

      assert.property(uut.walletInfo, 'legacyAddress')
      assert.isString(uut.walletInfo.legacyAddress)
      assert.isNotEmpty(uut.walletInfo.legacyAddress)

      assert.property(uut.walletInfo, 'slpAddress')
      assert.isString(uut.walletInfo.slpAddress)
      assert.isNotEmpty(uut.walletInfo.slpAddress)

      assert.notProperty(uut.walletInfo, 'mnemonicEncrypted')
    })

    it('should import clear-text WIF private key', async () => {
      const wif = 'KyGrqLtG5PLf97Lu6RXDMGKg6YbcmRKCemgoiufFXPmvQWyvThvE'

      uut = new MinimalBCHWallet(wif)
      await uut.walletInfoPromise
      // console.log('uut: ', uut)

      assert.property(uut.walletInfo, 'mnemonic')
      assert.equal(uut.walletInfo.mnemonic, null)

      assert.property(uut.walletInfo, 'privateKey')
      assert.isString(uut.walletInfo.privateKey)
      assert.isNotEmpty(uut.walletInfo.privateKey)

      assert.property(uut.walletInfo, 'cashAddress')
      assert.isString(uut.walletInfo.cashAddress)
      assert.isNotEmpty(uut.walletInfo.cashAddress)

      assert.property(uut.walletInfo, 'legacyAddress')
      assert.isString(uut.walletInfo.legacyAddress)
      assert.isNotEmpty(uut.walletInfo.legacyAddress)

      assert.property(uut.walletInfo, 'slpAddress')
      assert.isString(uut.walletInfo.slpAddress)
      assert.isNotEmpty(uut.walletInfo.slpAddress)

      assert.notProperty(uut.walletInfo, 'mnemonicEncrypted')
    })

    it('should accept advanced options', async () => {
      const exampleURL = 'http://somewebsite.com/v3/'
      const exampleApiToken = 'myapitoken'

      const advancedOptions = {
        restURL: exampleURL,
        apiToken: exampleApiToken,
        authPass: 'test'
      }

      uut = new MinimalBCHWallet(undefined, advancedOptions)
      await uut.walletInfoPromise

      assert.equal(uut.advancedOptions.restURL, exampleURL)
      assert.equal(uut.advancedOptions.apiToken, exampleApiToken)
    })

    it('should adjust the tx fee', async () => {
      const advancedOptions = {
        fee: 3
      }

      uut = new MinimalBCHWallet(undefined, advancedOptions)
      await uut.walletInfoPromise

      assert.equal(uut.advancedOptions.fee, 3)
    })

    // CT 07-19-2020 - This test case is from a bug around the use of 'this'
    // and the '_this' local global. It was preventing the UTXO store from
    // being accessible.
    // it('should be able to access the UTXO store', async () => {
    //   uut = new MinimalBCHWallet(undefined)
    //   await uut.walletInfoPromise
    //
    //   assert.equal(uut.utxos.utxoStore, mockUtxos.mockUtxoStore)
    //   assert.equal(uut.utxos.bchUtxos, mockUtxos.mockBchUtxos)
    //   assert.equal(uut.utxos.tokenUtxos, mockUtxos.mockTokenUtxos)
    // })

    it('should update all instances of bch-js with the free tier', async () => {
      const freeUrl = 'https://api.fullstack.cash/v5/'

      uut = new MinimalBCHWallet(undefined, {
        restURL: freeUrl
      })

      assert.equal(uut.sendBch.bchjs.restURL, freeUrl)
      assert.equal(uut.utxos.bchjs.restURL, freeUrl)
      assert.equal(uut.tokens.bchjs.restURL, freeUrl)
    })

    it('should switch to rest-api interface', () => {
      const advancedOptions = {
        interface: 'rest-api'
      }

      uut = new MinimalBCHWallet(undefined, advancedOptions)

      assert.equal(uut.ar.interface, 'rest-api')
    })
  })

  describe('#create', () => {
    it('should create a new wallet with no input', async () => {
      const walletInfoPromise = uut.create()
      await walletInfoPromise
      // console.log('walletInfo: ', uut.walletInfo)

      assert.property(uut, 'walletInfo')
      assert.property(uut, 'walletInfoPromise')
      assert.property(uut, 'walletInfoCreated')
      assert.equal(uut.walletInfoCreated, true)

      assert.property(uut.walletInfo, 'mnemonic')
      assert.isString(uut.walletInfo.mnemonic)
      assert.isNotEmpty(uut.walletInfo.mnemonic)

      assert.property(uut.walletInfo, 'privateKey')
      assert.isString(uut.walletInfo.privateKey)
      assert.isNotEmpty(uut.walletInfo.privateKey)

      assert.property(uut.walletInfo, 'publicKey')
      assert.isString(uut.walletInfo.publicKey)
      assert.isNotEmpty(uut.walletInfo.publicKey)

      assert.property(uut.walletInfo, 'cashAddress')
      assert.isString(uut.walletInfo.cashAddress)
      assert.isNotEmpty(uut.walletInfo.cashAddress)

      assert.property(uut.walletInfo, 'legacyAddress')
      assert.isString(uut.walletInfo.legacyAddress)
      assert.isNotEmpty(uut.walletInfo.legacyAddress)

      assert.property(uut.walletInfo, 'slpAddress')
      assert.isString(uut.walletInfo.slpAddress)
      assert.isNotEmpty(uut.walletInfo.slpAddress)
    })
  })

  describe('#initialize', () => {
    it('should initialize the UTXO store', async () => {
      // Mock dependencies
      sandbox.stub(uut.utxos, 'initUtxoStore').resolves()

      const result = await uut.initialize()

      assert.equal(uut.isInitialized, true)
      assert.equal(result, true)
    })
  })

  describe('#getBalance', () => {
    it('should return balance of given address', async () => {
      // Mock live network call.
      sandbox.stub(uut.ar.bchConsumer.bch, 'getBalance').resolves({
        success: true,
        balances: [
          {
            balance: { confirmed: 1000, unconfirmed: 0 },
            address: 'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur3'
          }
        ]
      })

      const addr = 'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur3'

      const balance = await uut.getBalance(addr)

      assert.equal(balance, 1000)
    })

    it('should return balance of wallet address', async () => {
      // Mock live network call.
      sandbox.stub(uut.ar.bchConsumer.bch, 'getBalance').resolves({
        success: true,
        balances: [
          {
            balance: { confirmed: 1000, unconfirmed: 0 },
            address: 'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur3'
          }
        ]
      })

      await uut.walletInfoPromise

      const balance = await uut.getBalance()

      assert.equal(balance, 1000)
    })
  })

  describe('#getTransactions', () => {
    it('should get transactions address is specified', async () => {
      sandbox.stub(uut.ar, 'getTransactions').resolves({
        success: true,
        transactions: [
          {
            height: 603416,
            tx_hash:
              'eef683d236d88e978bd406419f144057af3fe1b62ef59162941c1a9f05ded62c'
          }
        ]
      })

      const addr = 'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur3'

      const transactions = await uut.getTransactions(addr)
      // console.log(`transactions: ${JSON.stringify(transactions, null, 2)}`)

      assert.isArray(transactions)
    })

    it('should get transactions for wallet if address is not specified', async () => {
      // Mock live network calls
      sandbox.stub(uut.ar, 'getTransactions').resolves({
        success: true,
        transactions: [
          {
            height: 603416,
            tx_hash:
              'eef683d236d88e978bd406419f144057af3fe1b62ef59162941c1a9f05ded62c'
          }
        ]
      })

      await uut.walletInfoPromise

      const transactions = await uut.getTransactions()
      // console.log(`transactions: ${JSON.stringify(transactions, null, 2)}`)

      assert.isArray(transactions)
    })
  })

  describe('#send', () => {
    it('should broadcast a transaction and return a txid', async () => {
      await uut.walletInfoPromise

      const txid =
        '66b7d1fced6df27feb7faf305de2e3d6470decb0276648411fd6a2f69fec8543'

      // Mock live network calls.
      sandbox.stub(uut.sendBch, 'sendBch').resolves(txid)

      const output = await uut.send()

      assert.equal(output, txid)
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        await uut.walletInfoPromise

        // Mock live network calls.
        sandbox.stub(uut.sendBch, 'sendBch').throws(new Error('error message'))

        await uut.send()

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })
  })

  describe('#sendAll', () => {
    it('should broadcast a transaction and return a txid', async () => {
      await uut.walletInfoPromise

      const txid =
        '66b7d1fced6df27feb7faf305de2e3d6470decb0276648411fd6a2f69fec8543'

      // Mock live network calls.
      sandbox.stub(uut.sendBch, 'sendAllBch').resolves(txid)

      const output = await uut.sendAll()

      assert.equal(output, txid)
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        await uut.walletInfoPromise

        // Mock live network calls.
        sandbox
          .stub(uut.sendBch, 'sendAllBch')
          .throws(new Error('error message'))

        await uut.sendAll()

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })
  })

  describe('#sendTokens', () => {
    it('should broadcast a transaction and return a txid', async () => {
      const txid =
        '66b7d1fced6df27feb7faf305de2e3d6470decb0276648411fd6a2f69fec8543'

      // Mock live network calls.
      uut.utxos.utxoStore = mockUtxos.tokenUtxos01
      sandbox.stub(uut.tokens, 'sendTokens').resolves(txid)

      const output = await uut.sendTokens()

      assert.equal(output, txid)
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        // Mock live network calls.
        uut.utxos.utxoStore = mockUtxos.tokenUtxos01

        // Force an error
        sandbox
          .stub(uut.tokens, 'sendTokens')
          .throws(new Error('error message'))

        await uut.sendTokens()

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })

    it('should broadcast a transaction and return a txid', async () => {
      const txid =
        '66b7d1fced6df27feb7faf305de2e3d6470decb0276648411fd6a2f69fec8543'

      const outputs = [{
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '82e3d97b3cd033e60ffa755450b9075cf44fe1b2f6d5dc13657d8263e7165555',
        qty: 1
      }]

      // Mock live network calls.
      uut.utxos.utxoStore = mockUtxos.tokenUtxos01
      sandbox.stub(uut.tokens, 'sendTokens').resolves(txid)

      const output = await uut.sendTokens(outputs)

      assert.equal(output, txid)
    })
  })

  describe('#getUtxos', () => {
    it('should wrap the initUtxoStore function', async () => {
      await uut.walletInfoPromise

      sandbox.stub(uut.utxos, 'initUtxoStore').resolves({})

      const obj = await uut.getUtxos()

      assert.deepEqual(obj, {})
    })

    it('should get UTXOs for a given address', async () => {
      // Mock network calls.
      sandbox.stub(uut.ar, 'getUtxos').resolves(mockUtxos.tokenUtxos01)

      await uut.walletInfoPromise

      const addr = 'test-addr'

      const result = await uut.getUtxos(addr)
      // console.log('result: ', result)

      assert.property(result, 'bchUtxos')
      assert.property(result, 'nullUtxos')
      assert.property(result, 'slpUtxos')
      assert.property(result, 'address')
    })
  })

  describe('#listTokens', () => {
    it('should wrap the listTokensFromAddress function', async () => {
      await uut.walletInfoPromise

      sandbox.stub(uut.tokens, 'listTokensFromAddress').resolves({})

      const obj = await uut.listTokens()

      assert.deepEqual(obj, {})
    })
  })

  describe('#getTokenBalance', () => {
    it('should wrap the getTokenBalance() function from the token library', async () => {
      await uut.walletInfoPromise

      sandbox.stub(uut.tokens, 'getTokenBalance').resolves(0)

      const tokenId = 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
      const result = await uut.getTokenBalance(tokenId)

      assert.equal(result, 0)
    })
  })

  describe('#burnTokens', () => {
    it('should broadcast a transaction and return a txid', async () => {
      const txid =
        '66b7d1fced6df27feb7faf305de2e3d6470decb0276648411fd6a2f69fec8543'

      // Mock live network calls.
      uut.utxos.utxoStore = mockUtxos.tokenUtxos01
      sandbox.stub(uut.tokens, 'burnTokens').resolves(txid)

      const output = await uut.burnTokens()

      assert.equal(output, txid)
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        uut.utxos.utxoStore = mockUtxos.tokenUtxos01

        // Force an error
        sandbox
          .stub(uut.tokens, 'burnTokens')
          .throws(new Error('error message'))

        await uut.burnTokens()

        assert.fail('unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })
  })

  describe('#burnAll', () => {
    it('should broadcast a transaction and return a txid', async () => {
      const tokenId =
        'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'

      // Mock live network calls.
      uut.utxos.utxoStore = mockUtxos.tokenUtxos01
      sandbox.stub(uut.tokens, 'burnAll').resolves('txid')

      const output = await uut.burnAll(tokenId)
      // console.log('output: ', output)

      assert.equal(output, 'txid')
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        // Force an error
        sandbox
          .stub(uut.utxos, 'getSpendableTokenUtxos')
          .throws(new Error('error message'))

        await uut.burnAll()

        assert.fail('unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })
  })

  describe('#getUsd', () => {
    it('should pass data on to adapter router lib', async () => {
      // Mock dependencies
      sandbox.stub(uut.ar, 'getUsd').resolves(100)

      const result = await uut.getUsd()

      assert.equal(result, 100)
    })
  })

  describe('#sendOpReturn', () => {
    it('should broadcast OP_RETURN tx and return txid', async () => {
      // Mock dependencies
      sandbox.stub(uut.opReturn, 'sendOpReturn').resolves('fake-txid')

      const result = await uut.sendOpReturn()

      assert.equal(result, 'fake-txid')
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        // Force an error
        sandbox
          .stub(uut.opReturn, 'sendOpReturn')
          .throws(new Error('error message'))

        await uut.sendOpReturn()

        assert.fail('unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })
  })

  describe('#getTxData', () => {
    it('should pass request to adapter router', async () => {
      // Mock dependencies
      sandbox.stub(uut.ar, 'getTxData').resolves({ key: 'value' })

      const result = await uut.getTxData()

      assert.equal(result.key, 'value')
    })
  })

  describe('#utxoIsValid', async () => {
    it('shoudl wrap the utxoIsValid() function', async () => {
      // Mock dependencies
      sandbox.stub(uut.ar, 'utxoIsValid').resolves(true)

      const result = await uut.utxoIsValid()

      assert.equal(result, true)
    })
  })

  describe('#getTokenData', async () => {
    it('shoudl wrap the getTokenData() function', async () => {
      // Mock dependencies
      sandbox.stub(uut.ar, 'getTokenData').resolves(true)

      const result = await uut.getTokenData()

      assert.equal(result, true)
    })
  })

  describe('#getTokenData2', async () => {
    it('shoudl wrap the getTokenData2() function', async () => {
      // Mock dependencies
      sandbox.stub(uut.ar, 'getTokenData2').resolves(true)

      const result = await uut.getTokenData2()

      assert.equal(result, true)
    })
  })

  describe('#getKeyPair', () => {
    it('should return an object with a key pair', async () => {
      const result = await uut.getKeyPair(5)
      // console.log('result: ', result)

      assert.property(result, 'hdIndex')
      assert.property(result, 'wif')
      assert.property(result, 'publicKey')
      assert.property(result, 'cashAddress')
      assert.property(result, 'slpAddress')
    })

    it('should throw an error if wallet does not have a mnemonic', async () => {
      try {
        uut.walletInfo.mnemonic = ''

        await uut.getKeyPair()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Wallet does not have a mnemonic. Can not generate a new key pair.')
      }
    })

    it('should return root keypair if no argument is passed', async () => {
      const result = await uut.getKeyPair()
      // console.log('result: ', result)

      assert.equal(result.hdIndex, 0)
      assert.equal(result.wif, uut.walletInfo.privateKey)
      assert.equal(result.publicKey, uut.walletInfo.publicKey)
      assert.equal(result.cashAddress, uut.walletInfo.cashAddress)
      assert.equal(result.slpAddress, uut.walletInfo.slpAddress)
    })
  })

  describe('#optimize', () => {
    it('should call the consolidate-utoxs library', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.consolidateUtxos, 'start').resolves(1)

      const result = await uut.optimize()

      assert.equal(result, 1)
    })
  })

  describe('#getPubKey', () => {
    it('should pass call to the router', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.ar, 'getPubKey').resolves(1)

      const result = await uut.getPubKey('fake-addr')

      assert.equal(result, 1)
    })
    it('should handle and catch router error', async () => {
      try {
        // Mock dependencies and force desired code path
        sandbox.stub(uut.ar, 'getPubKey').throws(new Error('error message'))

        await uut.getPubKey('fake-addr')

        assert.fail('Unexpected code path')
      } catch (error) {
        assert.equal(error.message, 'error message')
      }
    })
  })

  describe('#broadcast', () => {
    it('should pass call to the router', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.ar, 'sendTx').resolves(1)

      const result = await uut.broadcast('fake-hex')

      assert.equal(result, 1)
    })
    it('should handle and catch router error', async () => {
      try {
        // Mock dependencies and force desired code path
        sandbox.stub(uut.ar, 'sendTx').throws(new Error('error message'))

        await uut.broadcast('fake-hex')

        assert.fail('Unexpected code path')
      } catch (error) {
        assert.equal(error.message, 'error message')
      }
    })
  })

  describe('#cid2json', () => {
    it('should convert a CID to a JSON object', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.ar, 'cid2json').resolves({ key: 'value' })

      const result = await uut.cid2json({ cid: 'fake-cid' })

      assert.equal(result.key, 'value')
    })
    it('should handle and catch router error', async () => {
      try {
        // Mock dependencies and force desired code path
        sandbox.stub(uut.ar, 'cid2json').throws(new Error('error message'))

        await uut.cid2json({ cid: 'fake-cid' })

        assert.fail('Unexpected code path')
      } catch (error) {
        assert.equal(error.message, 'error message')
      }
    })
  })
  describe('#getPsfWritePrice', () => {
    it('should get psf write price', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.ar, 'getPsfWritePrice').resolves(0.03570889)

      const result = await uut.getPsfWritePrice()

      assert.isNumber(result)
    })
    it('should handle and catch router error', async () => {
      try {
        // Mock dependencies and force desired code path
        sandbox.stub(uut.ar, 'getPsfWritePrice').throws(new Error('error message'))

        await uut.getPsfWritePrice()

        assert.fail('Unexpected code path')
      } catch (error) {
        assert.equal(error.message, 'error message')
      }
    })
  })
})
