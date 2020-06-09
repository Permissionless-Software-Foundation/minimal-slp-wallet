const mockWallet = {
  mnemonic: 'panel insane wrong volume better desk funny walnut bitter unable scare mix',
  cashAddress: 'bitcoincash:qqwsylce7r5ufe4mfc94xkd56t30ncnanq3v9m0kjj',
  address: 'bitcoincash:qqwsylce7r5ufe4mfc94xkd56t30ncnanq3v9m0kjj',
  legacyAddress: '13ePb2HkD8a8NcM2YtsezsRfsEUfuvHKbz',
  slpAddress: 'simpleledger:qqwsylce7r5ufe4mfc94xkd56t30ncnanqahwq6kvv',
  privateKey: 'KwPVaC4ui2NiKnJc8kkdSi5L47WeUupVBYf672pKhjZw4r4y2Mp9',
  hdPath: "m/44'/245'/0'/0/0"
}

// Example of output of bch-js.Electrumx.utxo()
const exampleUtxos01 = {
  success: true,
  utxos: [
    {
      tx_hash: '53cfccdc435dae1320c5603513928f0d6c3523e2dd5c6010bdae7065398a19cc',
      tx_pos: 1,
      value: 1143,
      height: 638717
    },
    {
      tx_hash: 'a36e48dc1666a219f4c8d624691d303b7f7f5484aa7354c3119dc1011567dbab',
      tx_pos: 1,
      value: 698,
      height: 638578
    },
    {
      tx_hash: 'b4d678b8d0bfbafeaf886df1cc5638e2c780622e575a11b3c5bed4bfb67142ac',
      tx_pos: 1,
      value: 12525803,
      height: 638563
    }
  ]
}

// Example of output of bch-js.Electrumx.utxo()
const exampleUtxos02 = {
  success: true,
  utxos: [
    {
      height: 0,
      tx_hash: '5a84d0416f8a4fe89308e3bba5ec31f37df29e8507436eb64d4fe730cda7e456',
      tx_pos: 0,
      value: 600
    },
    {
      height: 0,
      tx_hash: '1a2d7555b395faa23c13ce09804618b37bb9590b563c4b51dc737ed0d1ade0ee',
      tx_pos: 0,
      value: 555
    }
  ]
}

module.exports = {
  mockWallet,
  exampleUtxos01,
  exampleUtxos02
}
