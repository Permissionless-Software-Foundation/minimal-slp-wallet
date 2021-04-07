/*
  An example for burning tokens with this library.
*/

const SlpWallet = require('../index')

async function burnTokens () {
  try {
    // Replace the values for the constants below to customize for your use.
    const MNEMONIC =
      'essence appear intact casino neck scatter search post cube fit door margin'
    // bitcoincash:qzl40sfyyqlmgc44y6rqjsarpyr3j9alnqyuqcwjc5
    const TOKENID =
      '6201f3efe486c577433622817b99645e1d473cd3882378f9a0efc128ab839a82'

    // Instantiate the wallet library.
    const slpWallet = new SlpWallet(MNEMONIC)

    // Wait for the wallet to be created.
    await slpWallet.walletInfoPromise

    console.log(`wallet info: ${JSON.stringify(slpWallet.walletInfo, null, 2)}`)

    // console.log('slpWallet.utxos.utxoStore: ', slpWallet.utxos.utxoStore)

    // Get the balance of the wallet.
    const balance = await slpWallet.getBalance()
    console.log(`balance: ${balance} satoshis`)

    // Exit if the wallet has no balance.
    if (balance === 0) {
      console.log(
        `The balance of your wallet is zero. Send BCH to ${
          slpWallet.walletInfo.address
        } to run this example.`
      )
      return
    }

    const txid = await slpWallet.burnAll(TOKENID)

    console.log(`Success! Tokens burnt with TXID: ${txid}`)
  } catch (err) {
    console.error('Error: ', err)
  }
}
burnTokens()
