/*
  Integration tests for the top-level index.js library.
*/

// Public npm libraries.
const assert = require('chai').assert

const BchWallet = require('../../index')

describe('#BchWallet', () => {
  let uut

  beforeEach(() => {
    uut = new BchWallet()
  })

  describe('#constructor', () => {
    it('should create a wallet with no input variables', async () => {
      uut = new BchWallet()
      await uut.walletInfoPromise

      assert.include(uut.walletInfo.cashAddress, 'bitcoincash:')
    })

    it('should create a wallet with a prior mnemonic', async () => {
      const mnemonic =
        'van human plastic grain brick hill bus twist sister bachelor near fabric'

      uut = new BchWallet(mnemonic)
      await uut.walletInfoPromise

      assert.include(
        uut.walletInfo.cashAddress,
        'bitcoincash:qpc7ufrzcm9ctylx6dsjwje8wx8gjdhghqn74rmmez'
      )
    })
  })

  describe('#create', () => {
    it('should create a wallet with a prior mnemonic', async () => {
      const mnemonic =
        'van human plastic grain brick hill bus twist sister bachelor near fabric'

      const walletPromise = await uut.create(mnemonic)
      // console.log(`walletPromise: ${JSON.stringify(walletPromise, null, 2)}`)

      assert.include(
        walletPromise.cashAddress,
        'bitcoincash:qpc7ufrzcm9ctylx6dsjwje8wx8gjdhghqn74rmmez'
      )
    })

    it('should create a wallet with a private key', async () => {
      const wif = 'KyGrqLtG5PLf97Lu6RXDMGKg6YbcmRKCemgoiufFXPmvQWyvThvE'

      const walletPromise = await uut.create(wif)
      // console.log(`walletPromise: ${JSON.stringify(walletPromise, null, 2)}`)

      assert.include(
        walletPromise.cashAddress,
        'bitcoincash:qpkjakz70s2xrkjpfn6tyzcnuxkyjdsa3ug45pw27y'
      )
    })
  })
})
