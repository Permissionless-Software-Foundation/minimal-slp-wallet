/*
  Unit tests for the token library.
*/

const assert = require('chai').assert
const sinon = require('sinon')
const BCHJS = require('@psf/bch-js')

const Tokens = require('../../lib/tokens')
const Utxos = require('../../lib/utxos')
const AdapterRouter = require('../../lib/adapters/router')

let uut

const mockDataLib = require('./mocks/utxo-mocks')
let mockData
const sendMockDataLib = require('./mocks/send-bch-mocks')
let sendMockData

describe('#tokens', () => {
  let sandbox
  let utxos

  beforeEach(() => {
    const config = {
      restURL: 'https://api.fullstack.cash/v5/'
    }
    const bchjs = new BCHJS(config)
    config.bchjs = bchjs
    config.ar = new AdapterRouter(config)
    uut = new Tokens(config)
    utxos = new Utxos(config)

    sandbox = sinon.createSandbox()

    mockData = Object.assign({}, mockDataLib)
    sendMockData = Object.assign({}, sendMockDataLib)
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if instance of bch-js is not passed', () => {
      try {
        uut = new Tokens()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Must pass instance of bch-js when instantiating AdapterRouter.'
        )
      }
    })

    it('should throw an error if instance of bch-js is not passed', () => {
      try {
        uut = new Tokens({ bchjs: {} })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Must pass instance of Adapter Router.')
      }
    })
  })

  describe('#listTokensFromUtxos', () => {
    it('should return a list of tokens', () => {
      const tokenInfo = uut.listTokensFromUtxos(mockData.hydratedUtxos)
      // console.log(`tokenInfo:  ${JSON.stringify(tokenInfo, null, 2)}`)

      // Assert that the returned array is the expected size.
      assert.isArray(tokenInfo)
      assert.equal(tokenInfo.length, 1)

      // Assert the objects in the array have the expected properties.
      assert.property(tokenInfo[0], 'tokenId')
      assert.property(tokenInfo[0], 'ticker')
      assert.property(tokenInfo[0], 'name')
      assert.property(tokenInfo[0], 'decimals')
      assert.property(tokenInfo[0], 'tokenType')
      assert.property(tokenInfo[0], 'url')
      assert.property(tokenInfo[0], 'qty')

      // Assert that the quantities are as expected.
      assert.equal(tokenInfo[0].qty, 1)
    })

    it('should return for non-SLP UTXOs', () => {
      const tokenInfo = uut.listTokensFromUtxos([{ isSlp: false }])
      // console.log(`tokenInfo:  ${JSON.stringify(tokenInfo, null, 2)}`)

      assert.equal(tokenInfo.length, 0)
    })

    it('should combine UTXOs with the same token', () => {
      const utxos = [mockData.hydratedUtxos[0], mockData.hydratedUtxos[0]]
      const tokenInfo = uut.listTokensFromUtxos(utxos)
      // console.log(`tokenInfo:  ${JSON.stringify(tokenInfo, null, 2)}`)

      assert.equal(tokenInfo[0].qty, 2)
    })

    it('should return aggregate token data', () => {
      const tokenInfo = uut.listTokensFromUtxos(mockData.tokenUtxos02)
      // console.log(`tokenInfo:  ${JSON.stringify(tokenInfo, null, 2)}`)

      // Assert that the returned array is the expected size.
      assert.isArray(tokenInfo)
      assert.equal(tokenInfo.length, 1)

      // Assert that the quantities are as expected.
      assert.equal(tokenInfo[0].qty, 1)
    })

    it('should handle and throw errors', async () => {
      try {
        uut.listTokensFromUtxos('a')

        assert(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'utxos.forEach is not a function')
      }
    })
  })

  describe('#createTransaction', () => {
    it('should throw an error if there are no BCH UTXOs.', async () => {
      try {
        await uut.createTransaction({}, {}, [], [])

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'BCH UTXO list is empty')
      }
    })

    it('should throw an error if there are no token UTXOs.', async () => {
      try {
        await uut.createTransaction({}, {}, ['placeholder'], [])

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'Token UTXO list is empty')
      }
    })

    it('should send token with no token change and no UTXO change', async () => {
      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
        qty: 1
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      utxos.utxoStore = mockData.tokenUtxos01
      const bchUtxos = utxos.utxoStore.bchUtxos
      const tokenUtxos = utxos.getSpendableTokenUtxos()
      // console.log('tokenUtxos: ', tokenUtxos)

      // Modify the BCH UTXO for this test.
      // bchUtxos[0].value = bchUtxos[0].satoshis = 100000

      const { hex, txid } = await uut.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        tokenUtxos
      )

      assert.isString(hex)
      assert.isString(txid)
    })

    it('should send token with token change and no UTXO change', async () => {
      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
        qty: 0.5
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      utxos.utxoStore = mockData.tokenUtxos01
      const bchUtxos = utxos.utxoStore.bchUtxos
      let tokenUtxos = utxos.getSpendableTokenUtxos()

      // modify tokenUtxo for this test.
      tokenUtxos = tokenUtxos.find(elem => elem.tokenId === output.tokenId)
      // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)
      tokenUtxos.tokenQty = '2'

      const { hex, txid } = await uut.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        [tokenUtxos]
      )

      assert.isString(hex)
      assert.isString(txid)
    })

    it('should send token with no token change and UTXO change', async () => {
      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
        qty: 1
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      // utxos.utxoStore = mockData.hydratedUtxos
      // const bchUtxos = utxos.getBchUtxos()
      // const tokenUtxos = utxos.getTokenUtxos()
      utxos.utxoStore = mockData.tokenUtxos01
      const bchUtxos = utxos.utxoStore.bchUtxos
      const tokenUtxos = utxos.getSpendableTokenUtxos()

      // Modify the BCH UTXO for this test.
      bchUtxos[0].value = bchUtxos[0].satoshis = 100000

      const { hex, txid } = await uut.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        tokenUtxos
      )

      assert.isString(hex)
      assert.isString(txid)
    })

    it('should send NFT Group token', async () => {
      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '8cd26481aaed66198e22e05450839fda763daadbb9938b0c71521ef43c642299',
        qty: 1
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      // utxos.utxoStore = mockData.mockNFTGroupUtxos
      // const bchUtxos = utxos.getBchUtxos()
      // const tokenUtxos = utxos.getTokenUtxos()
      utxos.utxoStore = mockData.mockNFTGroupUtxos
      const bchUtxos = utxos.utxoStore.bchUtxos
      const tokenUtxos = utxos.getSpendableTokenUtxos()

      // Modify the BCH UTXO for this test.
      bchUtxos[0].value = bchUtxos[0].satoshis = 100000

      const { hex, txid } = await uut.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        tokenUtxos
      )

      assert.isString(hex)
      assert.isString(txid)
    })

    it('should send NFT (Child) token', async () => {
      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '82e3d97b3cd033e60ffa755450b9075cf44fe1b2f6d5dc13657d8263e716b6a5',
        qty: 1
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      // utxos.utxoStore = mockData.mockNFTChildUtxos
      // const bchUtxos = utxos.getBchUtxos()
      // const tokenUtxos = utxos.getTokenUtxos()
      utxos.utxoStore = mockData.mockNFTChildUtxos
      const bchUtxos = utxos.utxoStore.bchUtxos
      const tokenUtxos = utxos.getSpendableTokenUtxos()

      // Modify the BCH UTXO for this test.
      bchUtxos[0].value = bchUtxos[0].satoshis = 100000

      const { hex, txid } = await uut.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        tokenUtxos
      )

      assert.isString(hex)
      assert.isString(txid)
    })

    it('should throw an error for unknown token type', async () => {
      try {
        const output = {
          address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
          tokenId:
            '82e3d97b3cd033e60ffa755450b9075cf44fe1b2f6d5dc13657d8263e716b6a5',
          qty: 1
        }

        const walletInfo = sendMockData.mockWallet

        // Prep the utxo data.
        utxos.utxoStore = mockData.mockNFTChildUtxos
        const bchUtxos = utxos.utxoStore.bchUtxos
        const tokenUtxos = utxos.getSpendableTokenUtxos()

        // console.log(`tokenUtxos: ${JSON.stringify(tokenUtxos, null, 2)}`)

        // Manipulate the token type to force an error.
        tokenUtxos[0].tokenType = 888

        await uut.createTransaction(output, walletInfo, bchUtxos, tokenUtxos)

        assert.fail('Unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Token Type 888 unknown')
      }
    })

    it('should throw an error if expected token UTXOs are not in the wallet', async () => {
      try {
        const output = {
          address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
          tokenId:
            '82e3d97b3cd033e60ffa755450b9075cf44fe1b2f6d5dc13657d8263e7165555',
          qty: 1
        }

        const walletInfo = sendMockData.mockWallet

        // Prep the utxo data.
        utxos.utxoStore = mockData.mockNFTChildUtxos
        const bchUtxos = utxos.utxoStore.bchUtxos
        const tokenUtxos = utxos.getSpendableTokenUtxos()

        await uut.createTransaction(output, walletInfo, bchUtxos, tokenUtxos)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'Token UTXO with token ID')
      }
    })

    it('should use custom token utxo filtering function', async () => {
      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
        qty: 1
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      utxos.utxoStore = mockData.tokenUtxos01
      const bchUtxos = utxos.utxoStore.bchUtxos
      const tokenUtxos = utxos.getSpendableTokenUtxos()

      const utxosFilterStub = sinon.stub().returnsArg(0)
      await uut.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        tokenUtxos,
        1.0,
        { tokenUtxosFilter: utxosFilterStub }
      )

      assert.ok(utxosFilterStub.calledOnce)
    })

    it('should pass opts to sendBch.getNecessaryUtxosAndChange', async () => {
      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
        qty: 1
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      utxos.utxoStore = mockData.tokenUtxos01
      const bchUtxos = utxos.utxoStore.bchUtxos
      const tokenUtxos = utxos.getSpendableTokenUtxos()

      const fn = sandbox.stub(uut.sendBch, 'getNecessaryUtxosAndChange').returns({
        necessaryUtxos: mockData.simpleUtxos.utxos,
        change: 0
      })

      await uut.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        tokenUtxos,
        1.0,
        { config: 'ok' }
      )

      assert.ok(fn.calledOnceWith(
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        { config: 'ok' }
      ))
    })
  })

  describe('#sendTokens', () => {
    it('should broadcast a transaction and return a txid', async () => {
      const hex =
        '0200000002abdb671501c19d11c35473aa84547f7f3b301d6924d6c8f419a26616dc486ea3010000006b4830450221009833f7bbecd7ba4c193f1edd693e42b337cd295b7e530cab3b2210f46c6cebe102200b65bf9b9bc66992c09cb1a40a2c84b629ba48c066b9f3cc5fe713a898051b6d41210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffffcc198a396570aebd10605cdde223356c0d8f92133560c52013ae5d43dccccf53010000006a47304402207bd190fce11a0cbf8dd8d0d987bcdd428168312f217ec61d018c3198014a786a02200b0ac3db775ea708eb9a76a9fa84fe9a68a0553408b143f52c220313cc2ecbd241210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff0271020000000000001976a914543dc8f7c91721da06da8c3941f79e26cfbce67288ac6c030000000000001976a9141d027f19f0e9c4e6bb4e0b5359b4d2e2f9e27d9888ac00000000'
      const txid =
        '66b7d1fced6df27feb7faf305de2e3d6470decb0276648411fd6a2f69fec8543'

      // Mock live network calls.
      sandbox.stub(uut, 'createTransaction').resolves(hex)
      sandbox.stub(uut.ar, 'sendTx').resolves(txid)

      const output = await uut.sendTokens()

      assert.equal(output, txid)
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        const hex =
          '0200000002abdb671501c19d11c35473aa84547f7f3b301d6924d6c8f419a26616dc486ea3010000006b4830450221009833f7bbecd7ba4c193f1edd693e42b337cd295b7e530cab3b2210f46c6cebe102200b65bf9b9bc66992c09cb1a40a2c84b629ba48c066b9f3cc5fe713a898051b6d41210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffffcc198a396570aebd10605cdde223356c0d8f92133560c52013ae5d43dccccf53010000006a47304402207bd190fce11a0cbf8dd8d0d987bcdd428168312f217ec61d018c3198014a786a02200b0ac3db775ea708eb9a76a9fa84fe9a68a0553408b143f52c220313cc2ecbd241210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff0271020000000000001976a914543dc8f7c91721da06da8c3941f79e26cfbce67288ac6c030000000000001976a9141d027f19f0e9c4e6bb4e0b5359b4d2e2f9e27d9888ac00000000'

        // Mock live network calls.
        sandbox.stub(uut, 'createTransaction').resolves(hex)
        sandbox.stub(uut.ar, 'sendTx').throws(new Error('error message'))

        await uut.sendTokens()

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })

    it('should pass options to createTransaction', async () => {
      // Mock live network calls.
      const ct = sandbox.stub(uut, 'createTransaction').resolves('ok')
      sandbox.stub(uut.ar, 'sendTx').resolves('ok')

      await uut.sendTokens(null, null, null, null, null, { utxoSortingFn: 'sortingFn' })

      assert.ok(ct.calledOnceWith(
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        sinon.match.any,
        { utxoSortingFn: 'sortingFn' }
      ))
    })
  })

  describe('#listTokensFromAddress', () => {
    it('should get token information for an address', async () => {
      const addr = 'simpleledger:qqmjqwsplscmx0aet355p4l0j8q74thv7vf5epph4z'

      // Stub network calls and subfunctions that are not within the scope of testing.
      sandbox.stub(uut.utxos, 'initUtxoStore').resolves({})
      uut.utxos.utxoStore = mockData.tokenUtxos03
      // console.log(`uut.utxos.utxoStore: ${JSON.stringify(uut.utxos.utxoStore, null, 2)}`)

      const tokenInfo = await uut.listTokensFromAddress(addr)
      // console.log(`tokenInfo: ${JSON.stringify(tokenInfo, null, 2)}`)

      assert.isArray(tokenInfo)

      assert.property(tokenInfo[0], 'tokenId')
      assert.property(tokenInfo[0], 'ticker')
      assert.property(tokenInfo[0], 'name')
      assert.property(tokenInfo[0], 'decimals')
      assert.property(tokenInfo[0], 'tokenType')
      assert.property(tokenInfo[0], 'url')
      assert.property(tokenInfo[0], 'qty')
    })

    it('should throw an error if address is not specified', async () => {
      try {
        await uut.listTokensFromAddress()

        assert.equal(true, false, 'Unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Address not provided')
      }
    })
  })

  describe('#createBurnTransaction', () => {
    it('should throw an error if qty input is not provided.', async () => {
      try {
        await uut.createBurnTransaction()

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'qty must be number')
      }
    })

    it('should throw an error if tokenId input is not provided.', async () => {
      try {
        const tokenId = ''
        await uut.createBurnTransaction(1, tokenId)

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'tokenId must be string')
      }
    })

    it('should throw an error if walletInfo is not provided.', async () => {
      try {
        const tokenId =
          'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
        const walletInfo = ''
        await uut.createBurnTransaction(1, tokenId, walletInfo)

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'walletInfo must be a object')
      }
    })

    it('should throw an error if there are no BCH UTXOs.', async () => {
      try {
        const tokenId =
          'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
        const walletInfo = sendMockData.mockWallet
        const bchUtxos = []
        await uut.createBurnTransaction(1, tokenId, walletInfo, bchUtxos)

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'BCH UTXO list is empty')
      }
    })

    it('should throw an error if there are no token UTXOs.', async () => {
      try {
        const tokenId =
          'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
        const walletInfo = sendMockData.mockWallet

        // Prep the utxo data.
        utxos.utxoStore = mockData.tokenUtxos01
        const bchUtxos = utxos.utxoStore.bchUtxos
        await uut.createBurnTransaction(1, tokenId, walletInfo, bchUtxos)

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'Token UTXO list is empty')
      }
    })

    it('should throw an error if tokenId does not match', async () => {
      try {
        const tokenId = 'bad token id'
        const walletInfo = sendMockData.mockWallet

        // Prep the utxo data.
        utxos.utxoStore = mockData.mockNFTGroupUtxos
        const bchUtxos = utxos.utxoStore.bchUtxos
        const tokenUtxos = utxos.getSpendableTokenUtxos()

        await uut.createBurnTransaction(
          1,
          tokenId,
          walletInfo,
          bchUtxos,
          tokenUtxos
        )

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'tokenId does not match')
      }
    })
    /*
    it('should throw an error for non token type1.', async () => {
      try {
        const tokenId =
          '8cd26481aaed66198e22e05450839fda763daadbb9938b0c71521ef43c642299'
        const walletInfo = sendMockData.mockWallet

        // Prep the utxo data.
        utxos.utxoStore = mockData.mockNFTGroupUtxos
        const bchUtxos = utxos.utxoStore.bchUtxos
        const tokenUtxos = utxos.getSpendableTokenUtxos()

        await uut.createBurnTransaction(
          1,
          tokenId,
          walletInfo,
          bchUtxos,
          tokenUtxos
        )

        assert.equal(true, false, 'unexpecte result')
      } catch (err) {
        assert.include(err.message, 'Token must be type 1')
      }
    })
*/
    it('should generate burn transaction', async () => {
      const tokenId =
        'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      utxos.utxoStore = mockData.tokenUtxos01
      const bchUtxos = utxos.utxoStore.bchUtxos
      const tokenUtxos = utxos.getSpendableTokenUtxos()

      const { hex, txid } = await uut.createBurnTransaction(
        1,
        tokenId,
        walletInfo,
        bchUtxos,
        tokenUtxos
      )

      assert.isString(hex)
      assert.isString(txid)
    })
  })

  describe('#burnTokens', () => {
    it('should broadcast a transaction and return a txid', async () => {
      const hex =
        '0200000002abdb671501c19d11c35473aa84547f7f3b301d6924d6c8f419a26616dc486ea3010000006b4830450221009833f7bbecd7ba4c193f1edd693e42b337cd295b7e530cab3b2210f46c6cebe102200b65bf9b9bc66992c09cb1a40a2c84b629ba48c066b9f3cc5fe713a898051b6d41210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffffcc198a396570aebd10605cdde223356c0d8f92133560c52013ae5d43dccccf53010000006a47304402207bd190fce11a0cbf8dd8d0d987bcdd428168312f217ec61d018c3198014a786a02200b0ac3db775ea708eb9a76a9fa84fe9a68a0553408b143f52c220313cc2ecbd241210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff0271020000000000001976a914543dc8f7c91721da06da8c3941f79e26cfbce67288ac6c030000000000001976a9141d027f19f0e9c4e6bb4e0b5359b4d2e2f9e27d9888ac00000000'
      const txid =
        '66b7d1fced6df27feb7faf305de2e3d6470decb0276648411fd6a2f69fec8543'

      // Mock live network calls.
      sandbox.stub(uut, 'createBurnTransaction').resolves(hex)
      sandbox.stub(uut.ar, 'sendTx').resolves(txid)

      const output = await uut.burnTokens()

      assert.equal(output, txid)
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        const hex =
          '0200000002abdb671501c19d11c35473aa84547f7f3b301d6924d6c8f419a26616dc486ea3010000006b4830450221009833f7bbecd7ba4c193f1edd693e42b337cd295b7e530cab3b2210f46c6cebe102200b65bf9b9bc66992c09cb1a40a2c84b629ba48c066b9f3cc5fe713a898051b6d41210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffffcc198a396570aebd10605cdde223356c0d8f92133560c52013ae5d43dccccf53010000006a47304402207bd190fce11a0cbf8dd8d0d987bcdd428168312f217ec61d018c3198014a786a02200b0ac3db775ea708eb9a76a9fa84fe9a68a0553408b143f52c220313cc2ecbd241210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff0271020000000000001976a914543dc8f7c91721da06da8c3941f79e26cfbce67288ac6c030000000000001976a9141d027f19f0e9c4e6bb4e0b5359b4d2e2f9e27d9888ac00000000'

        // Mock live network calls.
        sandbox.stub(uut, 'createBurnTransaction').resolves(hex)
        sandbox.stub(uut.ar, 'sendTx').throws(new Error('error message'))

        await uut.burnTokens()

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })
  })

  describe('#burnAll', () => {
    it('should throw an error if tokenId is not provided', async () => {
      try {
        await uut.burnAll()

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'tokenId must be a string')
      }
    })

    it('should throw an error if walletInfo is not provided', async () => {
      try {
        const slpUtxos = mockData.mockTokenUtxos
        const tokenId = slpUtxos[0].tokenId
        await uut.burnAll(tokenId)

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'walletInfo is required')
      }
    })

    it('should throw an error if bchUtxos is not provided', async () => {
      try {
        const slpUtxos = mockData.mockTokenUtxos
        const tokenId = slpUtxos[0].tokenId
        const walletInfo = sendMockData.mockWallet

        await uut.burnAll(tokenId, walletInfo)

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'BCH UTXO list is empty')
      }
    })

    it('should throw an error if bchUtxos list is empty', async () => {
      try {
        const slpUtxos = mockData.mockTokenUtxos
        const tokenId = slpUtxos[0].tokenId
        const walletInfo = sendMockData.mockWallet

        await uut.burnAll(tokenId, walletInfo, [])

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'BCH UTXO list is empty')
      }
    })

    it('should throw an error if slpUtxos is not provided', async () => {
      try {
        const slpUtxos = mockData.mockTokenUtxos
        const tokenId = slpUtxos[0].tokenId
        const walletInfo = sendMockData.mockWallet
        const bchUtxos = mockData.mockBchUtxos

        await uut.burnAll(tokenId, walletInfo, bchUtxos)

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'SLP UTXO list is empty')
      }
    })

    it('should throw an error if slpUtxos list is empty', async () => {
      try {
        const slpUtxos = mockData.mockTokenUtxos
        const tokenId = slpUtxos[0].tokenId
        const walletInfo = sendMockData.mockWallet
        const bchUtxos = mockData.mockBchUtxos

        await uut.burnAll(tokenId, walletInfo, bchUtxos, [])

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'SLP UTXO list is empty')
      }
    })

    it('should broadcast a transaction and return a txid', async () => {
      sandbox.stub(uut.sendBch, 'sendAllBch').resolves('fakeTxid')

      const walletInfo = sendMockData.mockWallet
      const bchUtxos = mockData.mockBchUtxos
      const slpUtxos = mockData.mockTokenUtxos
      const tokenId = slpUtxos[0].tokenId

      const output = await uut.burnAll(tokenId, walletInfo, bchUtxos, slpUtxos)

      assert.equal(output, 'fakeTxid')
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        // Force an error
        sandbox.stub(uut.sendBch, 'sendAllBch').rejects(new Error('fake error'))

        const walletInfo = sendMockData.mockWallet
        const bchUtxos = mockData.mockBchUtxos
        const slpUtxos = mockData.mockTokenUtxos
        const tokenId = slpUtxos[0].tokenId

        await uut.burnAll(tokenId, walletInfo, bchUtxos, slpUtxos)

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'fake error')
      }
    })

    it('should throw an error if no token UTXOs with token ID found', async () => {
      try {
        // sandbox.stub(uut.sendBch, 'sendAllBch').resolves('fakeTxid')

        const walletInfo = sendMockData.mockWallet
        const bchUtxos = mockData.mockBchUtxos
        const slpUtxos = mockData.mockTokenUtxos
        const tokenId = 'abc123'

        await uut.burnAll(tokenId, walletInfo, bchUtxos, slpUtxos)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'No token UTXOs found to burn after filtering')
      }
    })
  })
})
