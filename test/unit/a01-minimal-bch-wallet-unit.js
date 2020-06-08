/*
  Unit tests for the main library.
*/

// npm libraries
const assert = require('chai').assert
const sinon = require('sinon')

// Mocking data libraries.
// const mockData = require('./mocks/util-mocks')

// Unit under test
const MinimalBCHWallet = require('../../index')
const uut = new MinimalBCHWallet()

describe('#index.js - Minimal BCH Wallet', () => {
  let sandbox

  // Restore the sandbox before each test.
  beforeEach(() => (sandbox = sinon.createSandbox()))
  afterEach(() => sandbox.restore())

  describe('#create', () => {
    it('should create a new wallet with no input', async () => {
      await uut.create()
      // console.log('uut: ', uut)

      assert.property(uut, 'mnemonic')
      assert.isString(uut.mnemonic)
      assert.isNotEmpty(uut.mnemonic)

      assert.property(uut, 'privateKey')
      assert.isString(uut.privateKey)
      assert.isNotEmpty(uut.privateKey)

      assert.property(uut, 'cashAddress')
      assert.isString(uut.cashAddress)
      assert.isNotEmpty(uut.cashAddress)

      assert.property(uut, 'legacyAddress')
      assert.isString(uut.legacyAddress)
      assert.isNotEmpty(uut.legacyAddress)

      assert.property(uut, 'slpAddress')
      assert.isString(uut.slpAddress)
      assert.isNotEmpty(uut.slpAddress)
    })
  })

  describe('#constructor', () => {
    it('should create a new wallet without encrypted mnemonic', async () => {
      const uut = new MinimalBCHWallet()
      await uut.walletInfo
      // console.log('uut: ', uut)

      assert.property(uut, 'mnemonic')
      assert.isString(uut.mnemonic)
      assert.isNotEmpty(uut.mnemonic)

      assert.property(uut, 'privateKey')
      assert.isString(uut.privateKey)
      assert.isNotEmpty(uut.privateKey)

      assert.property(uut, 'cashAddress')
      assert.isString(uut.cashAddress)
      assert.isNotEmpty(uut.cashAddress)

      assert.property(uut, 'legacyAddress')
      assert.isString(uut.legacyAddress)
      assert.isNotEmpty(uut.legacyAddress)

      assert.property(uut, 'slpAddress')
      assert.isString(uut.slpAddress)
      assert.isNotEmpty(uut.slpAddress)

      assert.notProperty(uut, 'mnemonicEncrypted')
    })

    it('should create a new wallet with encrypted mnemonic', async () => {
      const uut = new MinimalBCHWallet(null, { password: 'myStrongPassword' })
      await uut.walletInfo
      // console.log('uut: ', uut)

      assert.property(uut, 'mnemonic')
      assert.isString(uut.mnemonic)
      assert.isNotEmpty(uut.mnemonic)

      assert.property(uut, 'privateKey')
      assert.isString(uut.privateKey)
      assert.isNotEmpty(uut.privateKey)

      assert.property(uut, 'cashAddress')
      assert.isString(uut.cashAddress)
      assert.isNotEmpty(uut.cashAddress)

      assert.property(uut, 'legacyAddress')
      assert.isString(uut.legacyAddress)
      assert.isNotEmpty(uut.legacyAddress)

      assert.property(uut, 'slpAddress')
      assert.isString(uut.slpAddress)
      assert.isNotEmpty(uut.slpAddress)

      assert.property(uut, 'mnemonicEncrypted')
      assert.isString(uut.mnemonicEncrypted)
      assert.isNotEmpty(uut.mnemonicEncrypted)
    })

    it('should decrypt an encrypted mnemonic', async () => {
      const mnemonicEncrypted =
        'U2FsdGVkX18uyavim4FoIETcRxgOi1E/XFc1ARR3k6HVrJgH60YnLxjbs6yMnWMjpaqbBmSC3uYjhZ+cgFlndOEZI34T0sWFfL952CHCFjd2AjypCjFhqkmHzOCCkhgf'
      const mnemonic =
        'negative prepare champion corn bean proof one same column water warm melt'
      const password = 'myStrongPassword'

      const uut = new MinimalBCHWallet(mnemonicEncrypted, {
        password: password
      })
      await uut.walletInfo
      // console.log('uut: ', uut)

      assert.equal(uut.mnemonic, mnemonic)
    })

    it('should throw error if incorrect password', async () => {
      try {
        const mnemonicEncrypted =
          'U2FsdGVkX18uyavim4FoIETcRxgOi1E/XFc1ARR3k6HVrJgH60YnLxjbs6yMnWMjpaqbBmSC3uYjhZ+cgFlndOEZI34T0sWFfL952CHCFjd2AjypCjFhqkmHzOCCkhgf'

        const uut = new MinimalBCHWallet(mnemonicEncrypted, {
          password: 'bad password'
        })
        await uut.walletInfo

        assert.notProperty(uut, 'mnemonic', 'Unexpected result!')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Wrong password')
      }
    })

    it('should import clear-text wallet mnemonic', async () => {
      const mnemonic =
        'negative prepare champion corn bean proof one same column water warm melt'

      const uut = new MinimalBCHWallet(mnemonic)
      await uut.walletInfo
      // console.log('uut: ', uut)

      assert.property(uut, 'mnemonic')
      assert.isString(uut.mnemonic)
      assert.isNotEmpty(uut.mnemonic)
      assert.equal(uut.mnemonic, mnemonic)

      assert.property(uut, 'privateKey')
      assert.isString(uut.privateKey)
      assert.isNotEmpty(uut.privateKey)

      assert.property(uut, 'cashAddress')
      assert.isString(uut.cashAddress)
      assert.isNotEmpty(uut.cashAddress)

      assert.property(uut, 'legacyAddress')
      assert.isString(uut.legacyAddress)
      assert.isNotEmpty(uut.legacyAddress)

      assert.property(uut, 'slpAddress')
      assert.isString(uut.slpAddress)
      assert.isNotEmpty(uut.slpAddress)

      assert.notProperty(uut, 'mnemonicEncrypted')
    })
  })

  describe('#getBalance', () => {
    it('should return combined balance', async () => {
      // Mock live network call.
      sandbox.stub(uut.bchjs.Electrumx, 'balance').resolves({
        success: true,
        balance: {
          confirmed: 1000,
          unconfirmed: 0
        }
      })

      const addr = 'bitcoincash:qr69kyzha07dcecrsvjwsj4s6slnlq4r8c30lxnur3'

      const balance = await uut.getBalance(addr)

      assert.equal(balance, 1000)
    })
  })
})
