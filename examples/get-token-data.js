/*
  An example for getting data on an SLP token. This example token includes
  mutable and immutable data.
*/

const SlpWallet = require('../index')

async function getTokenDataExample () {
  try {
    const tokenId = '59a62f35b0882b7c0ed80407d9190b460cc566cb6c01ed4817ad64f9d2508702'

    // Instantiate the wallet library.
    const slpWallet = new SlpWallet(undefined, { interface: 'consumer-api' })

    // Wait for the wallet to be created.
    await slpWallet.walletInfoPromise

    // Get token data
    const tokenData = await slpWallet.getTokenData(tokenId)
    console.log(`tokenData: ${JSON.stringify(tokenData, null, 2)}`)
  } catch (err) {
    console.error('Error: ', err)
  }
}
getTokenDataExample()
