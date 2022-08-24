/*
  An example for checking if a UTXO is still valid and spendable.
*/

const SlpWallet = require('../index')

async function validateUtxo () {
  try {
    const utxo = {
      txid: 'b94e1ff82eb5781f98296f0af2488ff06202f12ee92b0175963b8dba688d1b40',
      vout: 0
    }

    // Instantiate the wallet library.
    const slpWallet = new SlpWallet(undefined, {interface: 'consumer-api'})

    // Wait for the wallet to be created.
    await slpWallet.walletInfoPromise

    // Get the token summary
    const isValid = await slpWallet.utxoIsValid(utxo)
    console.log(`UTXO is valid: ${isValid}`)
  } catch (err) {
    console.error('Error: ', err)
  }
}
validateUtxo()
