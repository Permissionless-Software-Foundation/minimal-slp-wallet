/*
  Unit test mocks for UTXOs.
*/

const simpleUtxos = {
  success: true,
  utxos: [
    {
      height: 629922,
      tx_hash:
        'd5228d2cdc77fbe5a9aa79f19b0933b6802f9f0067f42847fc4fe343664723e5',
      tx_pos: 0,
      value: 6000
    }
  ]
}

const mixedUtxos = [
  {
    height: 639443,
    tx_hash: '30707fffb9b295a06a68d217f49c198e9e1dbe1edc3874a0928ca1905f1709df',
    tx_pos: 0,
    value: 6000
  },
  {
    height: 639443,
    tx_hash: '8962566e413501224d178a02effc89be5ac0d8e4195f617415d443dc4c38fe50',
    tx_pos: 1,
    value: 546
  },
  {
    height: 639443,
    tx_hash: 'cbbc6106fdf6e21d84d66e06a1f7fcf3568817ddaa020ad1939db6ce0cfbe54b',
    tx_pos: 1,
    value: 546
  }
]

const hydratedUtxos = [
  {
    height: 639443,
    tx_hash: '30707fffb9b295a06a68d217f49c198e9e1dbe1edc3874a0928ca1905f1709df',
    tx_pos: 0,
    value: 6000,
    satoshis: 6000,
    txid: '30707fffb9b295a06a68d217f49c198e9e1dbe1edc3874a0928ca1905f1709df',
    vout: 0,
    isValid: false
  },
  {
    height: 639443,
    tx_hash: '8962566e413501224d178a02effc89be5ac0d8e4195f617415d443dc4c38fe50',
    tx_pos: 1,
    value: 546,
    satoshis: 546,
    txid: '8962566e413501224d178a02effc89be5ac0d8e4195f617415d443dc4c38fe50',
    vout: 1,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
    tokenTicker: 'TOK-CH',
    tokenName: 'TokyoCash',
    tokenDocumentUrl: '',
    tokenDocumentHash: '',
    decimals: 8,
    tokenType: 1,
    tokenQty: 1,
    isValid: true
  },
  {
    height: 639443,
    tx_hash: 'cbbc6106fdf6e21d84d66e06a1f7fcf3568817ddaa020ad1939db6ce0cfbe54b',
    tx_pos: 1,
    value: 546,
    satoshis: 546,
    txid: 'cbbc6106fdf6e21d84d66e06a1f7fcf3568817ddaa020ad1939db6ce0cfbe54b',
    vout: 1,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: 'd0feefd514ae9262a2030e50c6b6d4533000abd12d84bc48a50ba6d69c033c95',
    tokenTicker: 'PRO',
    tokenName: 'PROPHET',
    tokenDocumentUrl: '',
    tokenDocumentHash: '',
    decimals: 0,
    tokenType: 1,
    tokenQty: 1,
    isValid: true
  }
]

module.exports = {
  simpleUtxos,
  mixedUtxos,
  hydratedUtxos
}
