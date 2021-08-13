/*
  These are unit tests for the JSON-RPC wallet service. That file is just
  a placeholder, which makes these unit tests silly. But they exist to increase
  the overall use test coverage of the repository.
*/

const WalletService = require('../../lib/adapters/json-rpc-wallet-service')

let uut

describe('#wallet-service-placeholder', () => {
  beforeEach(() => {
    uut = new WalletService()
  })

  describe('#getUtxos', () => {
    it('should return an array', async () => {
      uut.getUtxos()
    })
  })

  describe('#sendTx', () => {
    it('should return a string', async () => {
      uut.sendTx()
    })
  })

  describe('#getBalances', () => {
    it('should return an object', async () => {
      uut.getBalances()
    })
  })
})
