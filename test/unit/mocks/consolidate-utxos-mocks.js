/*
  Mock data for consolidate-utxos-unit.js tests
*/

const tokenUtxos01 = [
  {
    height: 762251,
    tx_hash: '1034346a618d3492882722cb8a21f72ceba802ee3a1f1c4a22bac80f13d13244',
    tx_pos: 1,
    value: 546,
    txid: '1034346a618d3492882722cb8a21f72ceba802ee3a1f1c4a22bac80f13d13244',
    vout: 1,
    isSlp: true,
    type: 'token',
    qty: '1',
    tokenId: 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d',
    address: 'bitcoincash:qq2tk7vedkp5hj3smpmz6let49q9u4wu9ga9tmyfcc',
    tokenType: 1,
    ticker: 'MT2',
    name: 'Mutable Token',
    documentUri: 'ipfs://bafybeie7oxpsr7evcnlptecxfdhaqlot4732phukd2ekgvuzoir2frost4',
    documentHash: '56ed1a5768076a318d02b5db64e125544dca57ab6b2cc7ca61dfa4645d244463',
    decimals: 0,
    qtyStr: '1',
    tokenQty: '1'
  },
  {
    height: 762251,
    tx_hash: '794c3885ca229cb3240a5c4ee6f28c2fd6ecbe0ba58f5416d59565b59ff8bea2',
    tx_pos: 1,
    value: 546,
    txid: '794c3885ca229cb3240a5c4ee6f28c2fd6ecbe0ba58f5416d59565b59ff8bea2',
    vout: 1,
    isSlp: true,
    type: 'token',
    qty: '100',
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    address: 'bitcoincash:qq2tk7vedkp5hj3smpmz6let49q9u4wu9ga9tmyfcc',
    tokenType: 1,
    ticker: 'TROUT',
    name: "Trout's test token",
    documentUri: 'troutsblog.com',
    documentHash: '',
    decimals: 2,
    qtyStr: '1',
    tokenQty: '1'
  },
  {
    height: 762251,
    tx_hash: '85b8f2f2040af5bb56b18181bd42d21796c719a96844ed3066739566a034b8dc',
    tx_pos: 1,
    value: 546,
    txid: '85b8f2f2040af5bb56b18181bd42d21796c719a96844ed3066739566a034b8dc',
    vout: 1,
    isSlp: true,
    type: 'token',
    qty: '100',
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    address: 'bitcoincash:qq2tk7vedkp5hj3smpmz6let49q9u4wu9ga9tmyfcc',
    tokenType: 1,
    ticker: 'TROUT',
    name: "Trout's test token",
    documentUri: 'troutsblog.com',
    documentHash: '',
    decimals: 2,
    qtyStr: '1',
    tokenQty: '1'
  }
]

const tokenList01 = [
  {
    tokenId: 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d',
    ticker: 'MT2',
    name: 'Mutable Token',
    decimals: 0,
    tokenType: 1,
    url: 'ipfs://bafybeie7oxpsr7evcnlptecxfdhaqlot4732phukd2ekgvuzoir2frost4',
    qty: 1
  },
  {
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    ticker: 'TROUT',
    name: "Trout's test token",
    decimals: 2,
    tokenType: 1,
    url: 'troutsblog.com',
    qty: 2
  }
]

const countTokenUtxosOut01 = [
  {
    tokenId: 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d',
    ticker: 'MT2',
    name: 'Mutable Token',
    qty: 1,
    cnt: 1,
    utxos: [
      {
        height: 762251,
        tx_hash: '1034346a618d3492882722cb8a21f72ceba802ee3a1f1c4a22bac80f13d13244',
        tx_pos: 1,
        value: 546,
        txid: '1034346a618d3492882722cb8a21f72ceba802ee3a1f1c4a22bac80f13d13244',
        vout: 1,
        isSlp: true,
        type: 'token',
        qty: '1',
        tokenId: 'c85042ab08a2099f27de880a30f9a42874202751d834c42717a20801a00aab0d',
        address: 'bitcoincash:qq2tk7vedkp5hj3smpmz6let49q9u4wu9ga9tmyfcc',
        tokenType: 1,
        ticker: 'MT2',
        name: 'Mutable Token',
        documentUri: 'ipfs://bafybeie7oxpsr7evcnlptecxfdhaqlot4732phukd2ekgvuzoir2frost4',
        documentHash: '56ed1a5768076a318d02b5db64e125544dca57ab6b2cc7ca61dfa4645d244463',
        decimals: 0,
        qtyStr: '1',
        tokenQty: '1'
      }
    ]
  },
  {
    tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
    ticker: 'TROUT',
    name: "Trout's test token",
    qty: 2,
    cnt: 2,
    utxos: [
      {
        height: 762251,
        tx_hash: '794c3885ca229cb3240a5c4ee6f28c2fd6ecbe0ba58f5416d59565b59ff8bea2',
        tx_pos: 1,
        value: 546,
        txid: '794c3885ca229cb3240a5c4ee6f28c2fd6ecbe0ba58f5416d59565b59ff8bea2',
        vout: 1,
        isSlp: true,
        type: 'token',
        qty: '100',
        tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        address: 'bitcoincash:qq2tk7vedkp5hj3smpmz6let49q9u4wu9ga9tmyfcc',
        tokenType: 1,
        ticker: 'TROUT',
        name: "Trout's test token",
        documentUri: 'troutsblog.com',
        documentHash: '',
        decimals: 2,
        qtyStr: '1',
        tokenQty: '1'
      },
      {
        height: 762251,
        tx_hash: '85b8f2f2040af5bb56b18181bd42d21796c719a96844ed3066739566a034b8dc',
        tx_pos: 1,
        value: 546,
        txid: '85b8f2f2040af5bb56b18181bd42d21796c719a96844ed3066739566a034b8dc',
        vout: 1,
        isSlp: true,
        type: 'token',
        qty: '100',
        tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        address: 'bitcoincash:qq2tk7vedkp5hj3smpmz6let49q9u4wu9ga9tmyfcc',
        tokenType: 1,
        ticker: 'TROUT',
        name: "Trout's test token",
        documentUri: 'troutsblog.com',
        documentHash: '',
        decimals: 2,
        qtyStr: '1',
        tokenQty: '1'
      }
    ]
  }
]

export {
  tokenUtxos01,
  tokenList01,
  countTokenUtxosOut01
}
