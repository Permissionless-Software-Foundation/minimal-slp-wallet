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
    tokenQty: '1',
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
    tokenQty: '1',
    isValid: true
  }
]

// Two token UTXOs from 2 tokens.
// const tokenUtxos01 = [
//   {
//     height: 639443,
//     tx_hash: '8962566e413501224d178a02effc89be5ac0d8e4195f617415d443dc4c38fe50',
//     tx_pos: 1,
//     value: 546,
//     satoshis: 546,
//     txid: '8962566e413501224d178a02effc89be5ac0d8e4195f617415d443dc4c38fe50',
//     vout: 1,
//     utxoType: 'token',
//     transactionType: 'send',
//     tokenId: '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
//     tokenTicker: 'TOK-CH',
//     tokenName: 'TokyoCash',
//     tokenDocumentUrl: '',
//     tokenDocumentHash: '',
//     decimals: 8,
//     tokenType: 1,
//     tokenQty: 1,
//     isValid: true
//   },
//   {
//     height: 639443,
//     tx_hash: 'cbbc6106fdf6e21d84d66e06a1f7fcf3568817ddaa020ad1939db6ce0cfbe54b',
//     tx_pos: 1,
//     value: 546,
//     satoshis: 546,
//     txid: 'cbbc6106fdf6e21d84d66e06a1f7fcf3568817ddaa020ad1939db6ce0cfbe54b',
//     vout: 1,
//     utxoType: 'token',
//     transactionType: 'send',
//     tokenId: 'd0feefd514ae9262a2030e50c6b6d4533000abd12d84bc48a50ba6d69c033c95',
//     tokenTicker: 'PRO',
//     tokenName: 'PROPHET',
//     tokenDocumentUrl: '',
//     tokenDocumentHash: '',
//     decimals: 0,
//     tokenType: 1,
//     tokenQty: 1,
//     isValid: true
//   }
// ]

const tokenUtxos01 = {
  address: 'bitcoincash:qqmjqwsplscmx0aet355p4l0j8q74thv7v90j65htu',
  bchUtxos: [
    {
      height: 639762,
      tx_hash:
        '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
      tx_pos: 4,
      value: 2960,
      satoshis: 2960,
      txid: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
      vout: 4,
      isValid: false
    }
  ],
  nullUtxos: [],
  slpUtxos: {
    type1: {
      mintBatons: [],
      tokens: [
        {
          height: 640005,
          tx_hash:
            '3ad72d9709c206329aa40777d9394ab6d0b5bd0962fba7180533fc966ece165c',
          tx_pos: 1,
          value: 546,
          txid:
            '3ad72d9709c206329aa40777d9394ab6d0b5bd0962fba7180533fc966ece165c',
          vout: 1,
          utxoType: 'token',
          transactionType: 'send',
          tokenId:
            'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
          tokenTicker: 'TROUT',
          tokenName: "Trout's test token",
          tokenDocumentUrl: 'troutsblog.com',
          tokenDocumentHash: '',
          decimals: 2,
          tokenType: 1,
          isValid: true,
          tokenQty: '1',
          qtyStr: '1',
          type: 'token'
        },
        {
          height: 639443,
          tx_hash:
            '8962566e413501224d178a02effc89be5ac0d8e4195f617415d443dc4c38fe50',
          tx_pos: 1,
          value: 546,
          satoshis: 546,
          txid:
            '8962566e413501224d178a02effc89be5ac0d8e4195f617415d443dc4c38fe50',
          vout: 1,
          utxoType: 'token',
          transactionType: 'send',
          tokenId:
            '497291b8a1dfe69c8daea50677a3d31a5ef0e9484d8bebb610dac64bbc202fb7',
          tokenTicker: 'TOK-CH',
          tokenName: 'TokyoCash',
          tokenDocumentUrl: '',
          tokenDocumentHash: '',
          decimals: 8,
          tokenType: 1,
          tokenQty: '1',
          qtyStr: '1',
          isValid: true,
          type: 'token'
        },
        {
          height: 639443,
          tx_hash:
            'cbbc6106fdf6e21d84d66e06a1f7fcf3568817ddaa020ad1939db6ce0cfbe54b',
          tx_pos: 1,
          value: 546,
          satoshis: 546,
          txid:
            'cbbc6106fdf6e21d84d66e06a1f7fcf3568817ddaa020ad1939db6ce0cfbe54b',
          vout: 1,
          utxoType: 'token',
          transactionType: 'send',
          tokenId:
            'd0feefd514ae9262a2030e50c6b6d4533000abd12d84bc48a50ba6d69c033c95',
          tokenTicker: 'PRO',
          tokenName: 'PROPHET',
          tokenDocumentUrl: '',
          tokenDocumentHash: '',
          decimals: 0,
          tokenType: 1,
          tokenQty: '1',
          qtyStr: '1',
          isValid: true,
          type: 'token'
        }
      ]
    },
    nft: {
      groupMintBatons: [],
      groupTokens: [],
      tokens: []
    }
  }
}

// Three token UTXOs from 2 tokens.
const tokenUtxos02 = [
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
  },
  {
    height: 639463,
    tx_hash: '8962566e413501224d178a02effc89be5ac0d8e4195f617415d443dc4c38fe51',
    tx_pos: 1,
    value: 546,
    satoshis: 546,
    txid: '8962566e413501224d178a02effc89be5ac0d8e4195f617415d443dc4c38fe51',
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
  }
]

const mockUtxoStore = [
  {
    height: 639762,
    tx_hash: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
    tx_pos: 1,
    value: 546,
    satoshis: 546,
    txid: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
    vout: 1,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    tokenTicker: 'TROUT',
    tokenName: "Trout's test token",
    tokenDocumentUrl: 'troutsblog.com',
    tokenDocumentHash: '',
    decimals: 2,
    tokenType: 1,
    tokenQty: 2,
    isValid: true
  },
  {
    height: 639762,
    tx_hash: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
    tx_pos: 4,
    value: 2960,
    satoshis: 2960,
    txid: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
    vout: 4,
    isValid: false
  }
]

const mockBchUtxos = [
  {
    height: 639762,
    tx_hash: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
    tx_pos: 4,
    value: 2960,
    satoshis: 2960,
    txid: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
    vout: 4,
    isValid: false
  }
]

const mockTokenUtxos = [
  {
    height: 639762,
    tx_hash: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
    tx_pos: 1,
    value: 546,
    satoshis: 546,
    txid: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
    vout: 1,
    utxoType: 'token',
    transactionType: 'send',
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    tokenTicker: 'TROUT',
    tokenName: "Trout's test token",
    tokenDocumentUrl: 'troutsblog.com',
    tokenDocumentHash: '',
    decimals: 2,
    tokenType: 1,
    tokenQty: 1,
    isValid: true
  }
]

const mockNFTGroupUtxos = {
  address: 'bitcoincash:qqmjqwsplscmx0aet355p4l0j8q74thv7v90j65htu',
  bchUtxos: [
    {
      height: 639762,
      tx_hash:
        '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
      tx_pos: 4,
      value: 2960,
      satoshis: 2960,
      txid: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
      vout: 4,
      isValid: false
    }
  ],
  nullUtxos: [],
  slpUtxos: {
    type1: {
      mintBatons: [],
      tokens: [
        {
          height: 640005,
          tx_hash:
            '3ad72d9709c206329aa40777d9394ab6d0b5bd0962fba7180533fc966ece165c',
          tx_pos: 1,
          value: 546,
          txid:
            '3ad72d9709c206329aa40777d9394ab6d0b5bd0962fba7180533fc966ece165c',
          vout: 1,
          utxoType: 'token',
          transactionType: 'send',
          tokenId:
            'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
          tokenTicker: 'TROUT',
          tokenName: "Trout's test token",
          tokenDocumentUrl: 'troutsblog.com',
          tokenDocumentHash: '',
          decimals: 2,
          tokenType: 1,
          isValid: true,
          tokenQty: '1'
        }
      ]
    },
    nft: {
      groupMintBatons: [],
      groupTokens: [
        {
          height: 0,
          tx_hash:
            'ed934cf70830fda6c2a0b00e8e9d797172ff459c6dcd9112710fa6bd87f02aae',
          tx_pos: 1,
          value: 546,
          satoshis: 546,
          txid:
            'ed934cf70830fda6c2a0b00e8e9d797172ff459c6dcd9112710fa6bd87f02aae',
          vout: 1,
          utxoType: 'token',
          transactionType: 'send',
          tokenId:
            '8cd26481aaed66198e22e05450839fda763daadbb9938b0c71521ef43c642299',
          tokenTicker: 'NFTTT',
          tokenName: 'NFT Test Token',
          tokenDocumentUrl: 'https://FullStack.cash',
          tokenDocumentHash: '',
          decimals: 0,
          tokenType: 129,
          tokenQty: 1,
          isValid: true
        }
      ],
      tokens: []
    }
  }
}

const mockNFTChildUtxos = {
  address: 'bitcoincash:qqmjqwsplscmx0aet355p4l0j8q74thv7v90j65htu',
  bchUtxos: [
    {
      height: 639762,
      tx_hash:
        '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
      tx_pos: 4,
      value: 2960,
      satoshis: 2960,
      txid: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
      vout: 4,
      isValid: false
    }
  ],
  nullUtxos: [],
  slpUtxos: {
    type1: {
      mintBatons: [],
      tokens: []
    },
    nft: {
      groupMintBatons: [],
      groupTokens: [],
      tokens: [
        {
          height: 650696,
          tx_hash:
            '6458885509a8eec6b4e10a515d3834638acc7e6e49b9b5969ee2a1d03224565d',
          tx_pos: 1,
          value: 546,
          satoshis: 546,
          txid:
            '6458885509a8eec6b4e10a515d3834638acc7e6e49b9b5969ee2a1d03224565d',
          vout: 1,
          utxoType: 'token',
          transactionType: 'send',
          tokenId:
            '82e3d97b3cd033e60ffa755450b9075cf44fe1b2f6d5dc13657d8263e716b6a5',
          tokenTicker: 'NFT004',
          tokenName: 'NFT Child',
          tokenDocumentUrl: 'https://FullStack.cash',
          tokenDocumentHash: '',
          decimals: 0,
          tokenType: 65,
          tokenQty: 1,
          isValid: true
        }
      ]
    }
  }
}

const dustAttackUtxo = {
  height: 655965,
  tx_hash: 'a675af87dcd8d39be782737aa52e0076b52eb2f5ce355ffcb5567a64dd96b77e',
  tx_pos: 21,
  value: 547,
  satoshis: 547,
  txid: 'a675af87dcd8d39be782737aa52e0076b52eb2f5ce355ffcb5567a64dd96b77e',
  vout: 21,
  isValid: null
}

const mockSlpApi = {
  details: [
    {
      height: 655965,
      tx_hash:
        'a675af87dcd8d39be782737aa52e0076b52eb2f5ce355ffcb5567a64dd96b77e',
      tx_pos: 21,
      value: 547,
      satoshis: 547,
      txid: 'a675af87dcd8d39be782737aa52e0076b52eb2f5ce355ffcb5567a64dd96b77e',
      vout: 21,
      isValid: false
    }
  ]
}

const mockSlpApiResult = {
  txid: 'a675af87dcd8d39be782737aa52e0076b52eb2f5ce355ffcb5567a64dd96b77e',
  isValid: false,
  msg: ''
}

const cornerCase1BchUtxos = [
  {
    height: 657451,
    tx_hash: '56f6e950622e180b1299df0112f09f3d81d071ab21aaebc3ab7955e8a96d6861',
    tx_pos: 4,
    value: 1144743,
    satoshis: 1144743,
    txid: '56f6e950622e180b1299df0112f09f3d81d071ab21aaebc3ab7955e8a96d6861',
    vout: 4,
    isValid: false
  },
  {
    height: 657466,
    tx_hash: 'c9b44538cc6dbe56b138f27a4311b4476713128f516f873452b4606f6e613bed',
    tx_pos: 0,
    value: 83002,
    satoshis: 83002,
    txid: 'c9b44538cc6dbe56b138f27a4311b4476713128f516f873452b4606f6e613bed',
    vout: 0,
    isValid: false
  },
  {
    height: 0,
    tx_hash: '99c9061f9afb8a201d32edfca2a5f3e753f8d218c69aa085d23ecf86c2a5744b',
    tx_pos: 4,
    value: 63754,
    satoshis: 63754,
    txid: '99c9061f9afb8a201d32edfca2a5f3e753f8d218c69aa085d23ecf86c2a5744b',
    vout: 4,
    isValid: false
  }
]

const cornerCase1TokenUtxos = {
  address: 'bitcoincash:qqmjqwsplscmx0aet355p4l0j8q74thv7v90j65htu',
  bchUtxos: [
    {
      height: 639762,
      tx_hash:
        '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
      tx_pos: 4,
      value: 2960,
      satoshis: 2960,
      txid: '7fd05098bad5acb6c3ec15723227eeaf0437615a5665e5715cbc4a54a67dfe6b',
      vout: 4,
      isValid: false
    }
  ],
  nullUtxos: [],
  slpUtxos: {
    type1: {
      mintBatons: [],
      tokens: [
        {
          height: 657466,
          tx_hash:
            'ad5c4626297068f28d9ba6d45fb218cb622911e07ebe3003be33e9b7e8f0bc7f',
          tx_pos: 2,
          value: 546,
          satoshis: 546,
          txid:
            'ad5c4626297068f28d9ba6d45fb218cb622911e07ebe3003be33e9b7e8f0bc7f',
          vout: 2,
          utxoType: 'token',
          transactionType: 'send',
          tokenId:
            '1a1fd545b922c8ee4ecd89bc312904f4e3ba4cf7850141066ad3e3f281668188',
          tokenTicker: 'MINT',
          tokenName: 'Mint',
          tokenDocumentUrl: 'mintslp.com',
          tokenDocumentHash: '',
          decimals: 8,
          tokenType: 1,
          tokenQty: 46,
          isValid: true
        },
        {
          height: 0,
          tx_hash:
            '99c9061f9afb8a201d32edfca2a5f3e753f8d218c69aa085d23ecf86c2a5744b',
          tx_pos: 1,
          value: 546,
          satoshis: 546,
          txid:
            '99c9061f9afb8a201d32edfca2a5f3e753f8d218c69aa085d23ecf86c2a5744b',
          vout: 1,
          utxoType: 'token',
          transactionType: 'send',
          tokenId:
            '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
          tokenTicker: 'PSF',
          tokenName: 'Permissionless Software Foundation',
          tokenDocumentUrl: 'psfoundation.cash',
          tokenDocumentHash: '',
          decimals: 8,
          tokenType: 1,
          tokenQty: 196,
          isValid: true
        },
        {
          height: 0,
          tx_hash:
            '99c9061f9afb8a201d32edfca2a5f3e753f8d218c69aa085d23ecf86c2a5744b',
          tx_pos: 2,
          value: 546,
          satoshis: 546,
          txid:
            '99c9061f9afb8a201d32edfca2a5f3e753f8d218c69aa085d23ecf86c2a5744b',
          vout: 2,
          utxoType: 'token',
          transactionType: 'send',
          tokenId:
            '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
          tokenTicker: 'PSF',
          tokenName: 'Permissionless Software Foundation',
          tokenDocumentUrl: 'psfoundation.cash',
          tokenDocumentHash: '',
          decimals: 8,
          tokenType: 1,
          tokenQty: 0.14152798,
          isValid: true
        }
      ]
    },
    nft: {
      groupMintBatons: [],
      groupTokens: [],
      tokens: []
    }
  }
}

module.exports = {
  simpleUtxos,
  mixedUtxos,
  hydratedUtxos,
  tokenUtxos01,
  tokenUtxos02,
  mockUtxoStore,
  mockBchUtxos,
  mockTokenUtxos,
  mockNFTGroupUtxos,
  mockNFTChildUtxos,
  dustAttackUtxo,
  mockSlpApi,
  mockSlpApiResult,
  cornerCase1BchUtxos,
  cornerCase1TokenUtxos
}
