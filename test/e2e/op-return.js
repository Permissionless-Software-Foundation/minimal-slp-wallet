/*
  This is a live test for broadcasting a transaction with an OP_RETURN output
  for memo.cash.
*/

const WIF = 'L1tcvcqa5PztqqDH4ZEcUmHA9aSHhTau5E2Zwp1xEK5CrKBrjP3m'
// BCH Address: bitcoincash:qqkg30ryje97al52htqwvveha538y7gttywut3cdqv

const PREFIX = '6d02'
const MSG =
  'This is a test with a really long OP_RETURN. Let us see if this goes through. some more stuff.'

const BchWallet = require('../../index')

async function opReturnTest () {
  try {
    const wallet = new BchWallet(WIF)

    await wallet.walletInfoPromise
    console.log('wallet.utxos.utxoStore: ', wallet.utxos.utxoStore)

    const { hex } = await wallet.opReturn.createTransaction(
      wallet.walletInfo,
      wallet.utxos.utxoStore.bchUtxos,
      MSG,
      PREFIX
    )
    // console.log('hex: ', hex)
    // console.log('txid: ', txid)

    const txid2 = await wallet.ar.sendTx(hex)
    console.log('txid2: ', txid2)
  } catch (err) {
    console.error(err)
  }
}
opReturnTest()
