/*
  Integration tests for the top-level index.js library.
*/

// Public npm libraries.
const assert = require('chai').assert

// Local libraries
const BchWallet = require('../../index')

const restURL = 'https://free-bch.fullstack.cash'

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

  describe('#getBalance', () => {
    it('should get the balance for an address', async () => {
      const addr = 'bitcoincash:qqh793x9au6ehvh7r2zflzguanlme760wuzehgzjh9'
      const result = await uut.getBalance(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`);

      assert.isAbove(result, 546)
    })
  })

  describe('#utxoIsValid', () => {
    it('should return true for valid UTXO using fullstack interface', async () => {
      const utxo = {
        txid: '53d24b3a0388c6a410745d58d2172e65eaa24cbc074c0c420292887284d7723b',
        vout: 0
      }

      const result = await uut.utxoIsValid(utxo)

      assert.equal(result, true)
    })

    it('should return true for valid UTXO using consumer-api interface', async () => {
      uut = new BchWallet(undefined, { interface: 'consumer-api', restURL })

      const utxo = {
        txid: '53d24b3a0388c6a410745d58d2172e65eaa24cbc074c0c420292887284d7723b',
        vout: 0
      }

      const result = await uut.utxoIsValid(utxo)

      assert.equal(result, true)
    })

    it('should return false for invalid UTXO using fullstack interface', async () => {
      const utxo = {
        txid: '17754221b29f189532d4fc2ae89fb467ad2dede30fdec4854eb2129b3ba90d7a',
        vout: 0
      }

      const result = await uut.utxoIsValid(utxo)

      assert.equal(result, false)
    })

    it('should return true for valid UTXO using consumer-api interface', async () => {
      uut = new BchWallet(undefined, { interface: 'consumer-api', restURL, noUpdate: true })

      const utxo = {
        txid: '17754221b29f189532d4fc2ae89fb467ad2dede30fdec4854eb2129b3ba90d7a',
        vout: 0
      }

      const result = await uut.utxoIsValid(utxo)

      assert.equal(result, false)
    })
  })

  describe('#getTokenData', () => {
    // CT 5/17/23 Disabling this test. There is an internal issue with bch-api
    // which causes this test to fail. When bch-api internally tries to retrieve
    // the mutable token data, it hits a rate limit.
    // it('should get token data from fullstack.cash', async () => {
    //   const tokenId = 'f212a3ab2141dcd34f7e800253f1a61344523e6886fdfa2421bbedf3aa52617a'

    //   const result = await uut.getTokenData(tokenId)
    //   console.log('result: ', result)

    //   assert.include(result.immutableData, 'ipfs')
    //   assert.include(result.mutableData, 'ipfs')
    // })

    it('should get token data from free-bch', async () => {
      uut = new BchWallet(undefined, { interface: 'consumer-api', restURL, noUpdate: true })

      const tokenId = 'f212a3ab2141dcd34f7e800253f1a61344523e6886fdfa2421bbedf3aa52617a'

      const result = await uut.getTokenData(tokenId)
      // console.log('result: ', result)

      assert.include(result.immutableData, 'ipfs')
      assert.include(result.mutableData, 'ipfs')
    })
  })

  describe('#getTokenData2', () => {
    it('should get token data from fullstack.cash', async () => {
      const tokenId = 'b93137050d6a6dcdba12432f018660541ffb4b457bf4020258272632c13e92d9'

      const result = await uut.getTokenData2(tokenId)
      console.log('result: ', result)

      assert.property(result, 'tokenIcon')
      assert.property(result, 'tokenStats')
      assert.property(result, 'optimizedTokenIcon')
      assert.property(result, 'iconRepoCompatible')
      assert.property(result, 'ps002Compatible')
    })

    // it('should get token data from free-bch', async () => {
    //   uut = new BchWallet(undefined, { interface: 'consumer-api', restURL, noUpdate: true })
    //
    //   const tokenId = 'eb93f05553ff088bffb0ec687519e83c59e5108c160f7c25a4b6c45109d7e40b'
    //
    //   const result = await uut.getTokenData(tokenId)
    //   // console.log('result: ', result)
    //
    //   assert.include(result.immutableData, 'ipfs')
    //   assert.include(result.mutableData, 'ipfs')
    // })
  })

  describe('#getTransactions', () => {
    it('should sort descending by default from bch-js', async () => {
      const addr = 'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'

      const result = await uut.getTransactions(addr)
      // console.log('result: ', result)
      // console.log(`result[0].height: ${result[0].height}, result[40].height: ${result[40].height}`)

      assert.isAbove(result[0].height, result[40].height)
    })

    it('should sort descending by default from consumer-api', async () => {
      uut = new BchWallet(undefined, { interface: 'consumer-api', restURL, noUpdate: true })

      const addr = 'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'

      const result = await uut.getTransactions(addr)
      // console.log('result: ', result)
      // console.log(`result[0]: ${JSON.stringify(result[0])}, result[40]: ${JSON.stringify(result[40])}`)

      assert.isAbove(result[0].height, result[40].height)
    })

    it('should sort ascending from bch-js', async () => {
      const addr = 'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'

      const result = await uut.getTransactions(addr, 'ASCENDING')
      // console.log('result: ', result)
      // console.log(`result[0].height: ${result[0].height}, result[40].height: ${result[40].height}`)

      assert.isAbove(result[40].height, result[0].height)
    })

    it('should sort ascending by default from consumer-api', async () => {
      uut = new BchWallet(undefined, { interface: 'consumer-api', restURL, noUpdate: true })

      const addr = 'bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d'

      const result = await uut.getTransactions(addr, 'ASCENDING')
      // console.log('result: ', result)
      // console.log(`result[0]: ${JSON.stringify(result[0])}, result[40]: ${JSON.stringify(result[40])}`)

      assert.isAbove(result[40].height, result[0].height)
    })
  })
})
