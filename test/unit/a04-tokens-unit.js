/*
  Unit tests for the token library.
*/

const assert = require('chai').assert
const sinon = require('sinon')

const Tokens = require('../../lib/tokens')
const Utxos = require('../../lib/utxos')

let uut

const mockData = require('./mocks/utxo-mocks')
const sendMockData = require('./mocks/send-bch-mocks')

describe('#tokens', () => {
  let sandbox
  let utxos

  beforeEach(() => {
    uut = new Tokens()
    utxos = new Utxos()

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

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
      sandbox.stub(uut.bchjs.SLP.TokenType1, 'getHexOpReturn').resolves({
        script:
          '6a04534c500001010453454e4420497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7080000000005f5e100',
        outputs: 1
      })

      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
        qty: 1
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      utxos.utxoStore = mockData.hydratedUtxos
      const bchUtxos = utxos.getBchUtxos()
      const tokenUtxos = utxos.getTokenUtxos()

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
      sandbox.stub(uut.bchjs.SLP.TokenType1, 'getHexOpReturn').resolves({
        script:
          '6a04534c500001010453454e4420497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7080000000005f5e100080000000005f5e100',
        outputs: 2
      })

      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
        qty: 1
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      utxos.utxoStore = mockData.hydratedUtxos
      const bchUtxos = utxos.getBchUtxos()
      const tokenUtxos = utxos.getTokenUtxos()

      // modify tokenUtxo for this test.
      tokenUtxos[0].tokenQty = 2

      const { hex, txid } = await uut.createTransaction(
        output,
        walletInfo,
        bchUtxos,
        tokenUtxos
      )

      assert.isString(hex)
      assert.isString(txid)
    })

    it('should send token with no token change and UTXO change', async () => {
      sandbox.stub(uut.bchjs.SLP.TokenType1, 'getHexOpReturn').resolves({
        script:
          '6a04534c500001010453454e4420497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7080000000005f5e100080000000005f5e100',
        outputs: 2
      })

      const output = {
        address: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
        tokenId:
          '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
        qty: 1
      }

      const walletInfo = sendMockData.mockWallet

      // Prep the utxo data.
      utxos.utxoStore = mockData.hydratedUtxos
      const bchUtxos = utxos.getBchUtxos()
      const tokenUtxos = utxos.getTokenUtxos()

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
      sandbox.stub(uut.utxos, 'getUtxos').resolves({})
      sandbox.stub(uut.utxos, 'hydrate').resolves(mockData.tokenUtxos01)

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
})
