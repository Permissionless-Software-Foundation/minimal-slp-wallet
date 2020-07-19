/*
  An example for sending tokens with this library.
*/

const SlpWallet = require('../index')
// const util = require('util')

async function sendBch () {
  try {
    // Replace the values for the constants below to customize for your use.
    const MNEMONIC =
      'essence appear intact casino neck scatter search post cube fit door margin'
    // const RECIEVER = ''
    // const TOKENID =
    //   'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
    // const TOKENS_TO_SEND = 1

    // Instantiate the wallet library.
    const slpWallet = new SlpWallet(MNEMONIC)

    // Wait for the wallet to be created.
    await slpWallet.walletInfoPromise
    console.log(`slpWallet.walletInfoCreated: ${slpWallet.walletInfoCreated}`)

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

    // await slpWallet.utxos.initUtxoStore(slpWallet.walletInfo.address)
    // console.log(
    //   `slpWallet.utxos.utxoStore: ${JSON.stringify(
    //     slpWallet.utxos.utxoStore,
    //     null,
    //     2
    //   )}`
    // )

    // console.log('slpWallet.utxos: ', util.inspect(slpWallet.utxos))

    // slpWallet.bchUtxos = slpWallet.utxos.getBchUtxos()
    // slpWallet.tokenUtxos = slpWallet.utxos.getTokenUtxos()

    console.log(
      `slpWallet.utxos.bchUtxos: ${JSON.stringify(
        slpWallet.utxos.bchUtxos,
        null,
        2
      )}`
    )
    console.log(
      `slpWallet.utxos.tokenUtxos: ${JSON.stringify(
        slpWallet.utxos.tokenUtxos,
        null,
        2
      )}`
    )

    console.log(`slpWallet.temp: ${JSON.stringify(slpWallet.temp, null, 2)}`)
    slpWallet.fillTemp()
    // slpWallet.temp = ['x', 'y', 'z']
    console.log(`slpWallet.temp: ${JSON.stringify(slpWallet.temp, null, 2)}`)

    console.log(
      `slpWallet.utxos.temp: ${JSON.stringify(slpWallet.utxos.temp, null, 2)}`
    )
    slpWallet.utxos.fillTemp()
    // slpWallet.utxos.temp = ['x', 'y', 'z']
    console.log(
      `slpWallet.utxos.temp: ${JSON.stringify(slpWallet.utxos.temp, null, 2)}`
    )
  } catch (err) {
    console.error('Error: ', err)
  }
}
sendBch()
