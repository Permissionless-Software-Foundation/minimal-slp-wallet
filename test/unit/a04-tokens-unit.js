/*
  Unit tests for the token library.
*/

const assert = require('chai').assert
const sinon = require('sinon')
const BCHJS = require('@psf/bch-js')

const Tokens = require('../../lib/tokens')
const Utxos = require('../../lib/utxos')

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
  })

  describe('#listTokensFromUtxos', () => {
    it('should return a list of tokens', () => {
      const tokenInfo = uut.listTokensFromUtxos(mockData.hydratedUtxos)
      // console.log(`tokenInfo:  ${JSON.stringify(tokenInfo, null, 2)}`)

      // Assert that the returned array is the expected size.
      assert.isArray(tokenInfo)
      assert.equal(tokenInfo.length, 2)

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
      assert.equal(tokenInfo[1].qty, 1)
    })

    it('should return aggregate token data', () => {
      const tokenInfo = uut.listTokensFromUtxos(mockData.tokenUtxos02)
      // console.log(`tokenInfo:  ${JSON.stringify(tokenInfo, null, 2)}`)

      // Assert that the returned array is the expected size.
      assert.isArray(tokenInfo)
      assert.equal(tokenInfo.length, 2)

      // Assert that the quantities are as expected.
      assert.equal(tokenInfo[0].qty, 2)
      assert.equal(tokenInfo[1].qty, 1)
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
        qty: 1
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

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'Token Type 888 unknown')
      }
    })

    // This corner case was discovered when trying to 'send all' PSF tokens.
    // TXID: fc87f721eb9bbd71006a79ae7a33ac41b723c71d12b51a8224ceb73d9960473c
    // The whole number was sent at one UTXO and the decimal part of the token
    // is sent as change to the same address.
    //
    // This test reliably generates the same results in hex format, you can use
    // This endpoint to deconstruct the transaction. Notice that outputs 1 and
    // 2 are dust and SLP outputs.
    // https://free-main.fullstack.cash/v3/rawtransactions/decodeRawTransaction/02000000034b74a5c286cf3ed285a09ac618d2f853e7f3a5a2fced321d208afb9a1f06c999010000006b483045022100aa293b80ffc608b223af429b9c9e4ec8d961099406fa863dab8a83f5e7ef85a4022023295d7c167b58c0202d4053147477704909f6845cf91c46045a175a4695998141210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff4b74a5c286cf3ed285a09ac618d2f853e7f3a5a2fced321d208afb9a1f06c999020000006b48304502210088337579933248ae80f0b90d1502f17111aab6d00b4580c0de5076452d370ad10220613f6bd41b477858c7b8dbc0085b4c323889d9c70f36a8b79ca12427f3ffd09441210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff4b74a5c286cf3ed285a09ac618d2f853e7f3a5a2fced321d208afb9a1f06c999040000006b48304502210087d041cc2715578ae242fc88063dd1f4a55a557e176e844390e80045414f73e802201a5c00d892f3b9c228459b0ffcca04c8ede98eb6c368f145161d608e45c7034641210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff050000000000000000406a04534c500001010453454e442038e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0080000000490404400080000000000d7f45e22020000000000001976a9147c64bd3437ae896bb6518586cd7acbdc8435643b88ac22020000000000001976a9141d027f19f0e9c4e6bb4e0b5359b4d2e2f9e27d9888acd0070000000000001976a914203b64bfbaa9e58333295b621159ddebc591ecb188ac42ee0000000000001976a9141d027f19f0e9c4e6bb4e0b5359b4d2e2f9e27d9888ac00000000
    it('should handle corner case #1', async () => {
      const output = {
        address: 'simpleledger:qp7xf0f5x7hgj6ak2xzcdnt6e0wggdty8vqe0asv5y',
        tokenId:
          '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
        qty: 196
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      utxos.utxoStore = mockData.cornerCase1TokenUtxos
      const bchUtxos = utxos.utxoStore.bchUtxos
      const tokenUtxos = utxos.getSpendableTokenUtxos()

      const { hex } = await uut.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        tokenUtxos
      )
      // console.log('hex: ', hex)

      assert.isString(hex)
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
      sandbox
        .stub(uut.bchjs.RawTransactions, 'sendRawTransaction')
        .resolves(txid)

      const output = await uut.sendTokens()

      assert.equal(output, txid)
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        const hex =
          '0200000002abdb671501c19d11c35473aa84547f7f3b301d6924d6c8f419a26616dc486ea3010000006b4830450221009833f7bbecd7ba4c193f1edd693e42b337cd295b7e530cab3b2210f46c6cebe102200b65bf9b9bc66992c09cb1a40a2c84b629ba48c066b9f3cc5fe713a898051b6d41210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffffcc198a396570aebd10605cdde223356c0d8f92133560c52013ae5d43dccccf53010000006a47304402207bd190fce11a0cbf8dd8d0d987bcdd428168312f217ec61d018c3198014a786a02200b0ac3db775ea708eb9a76a9fa84fe9a68a0553408b143f52c220313cc2ecbd241210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff0271020000000000001976a914543dc8f7c91721da06da8c3941f79e26cfbce67288ac6c030000000000001976a9141d027f19f0e9c4e6bb4e0b5359b4d2e2f9e27d9888ac00000000'

        // Mock live network calls.
        sandbox.stub(uut, 'createTransaction').resolves(hex)
        sandbox
          .stub(uut.bchjs.RawTransactions, 'sendRawTransaction')
          .throws(new Error('error message'))

        await uut.sendTokens()

        assert.equal(true, false, 'unexpected result')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'error message')
      }
    })
  })

  describe('#listTokensFromAddress', () => {
    it('should get token information for an address', async () => {
      const addr = 'simpleledger:qqmjqwsplscmx0aet355p4l0j8q74thv7vf5epph4z'

      // Stub network calls and subfunctions that are not within the scope of testing.
      // sandbox.stub(uut.utxos, 'getUtxos').resolves({})
      // sandbox.stub(uut.utxos, 'hydrate').resolves(mockData.tokenUtxos01)
      sandbox.stub(uut.utxos, 'initUtxoStore').resolves({})
      uut.utxos.utxoStore = mockData.tokenUtxos01
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
      sandbox
        .stub(uut.bchjs.RawTransactions, 'sendRawTransaction')
        .resolves(txid)

      const output = await uut.burnTokens()

      assert.equal(output, txid)
    })

    it('should throw an error if there is an issue with broadcasting a tx', async () => {
      try {
        const hex =
          '0200000002abdb671501c19d11c35473aa84547f7f3b301d6924d6c8f419a26616dc486ea3010000006b4830450221009833f7bbecd7ba4c193f1edd693e42b337cd295b7e530cab3b2210f46c6cebe102200b65bf9b9bc66992c09cb1a40a2c84b629ba48c066b9f3cc5fe713a898051b6d41210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffffcc198a396570aebd10605cdde223356c0d8f92133560c52013ae5d43dccccf53010000006a47304402207bd190fce11a0cbf8dd8d0d987bcdd428168312f217ec61d018c3198014a786a02200b0ac3db775ea708eb9a76a9fa84fe9a68a0553408b143f52c220313cc2ecbd241210259da20750fbde4e48d48068aa93e02701554dc66b4fe83851a91023110093449ffffffff0271020000000000001976a914543dc8f7c91721da06da8c3941f79e26cfbce67288ac6c030000000000001976a9141d027f19f0e9c4e6bb4e0b5359b4d2e2f9e27d9888ac00000000'

        // Mock live network calls.
        sandbox.stub(uut, 'createBurnTransaction').resolves(hex)
        sandbox
          .stub(uut.bchjs.RawTransactions, 'sendRawTransaction')
          .throws(new Error('error message'))

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
  })
})
