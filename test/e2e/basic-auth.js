/*
  The purpose of this script is test and debug the usage of a Bearer token
  for connecting minimal-slp-wallet to private instances of bch-api.

  It assumes that the Bearer token has been placed in the BCHJSBEARERTOKEN_TEMP
  environment variable.
*/

// Global npm libraries

// Local libraries
const BchWallet = require('../../index')

async function startTest () {
  try {
    const wallet = new BchWallet(undefined, {
      bearerToken: process.env.BCHJSBEARERTOKEN_TEMP,
      restURL: process.env.BCHAPIURL
    })

    for (let i = 0; i < 5; i++) {
      const result = await wallet.getUtxos('bitcoincash:qqlrzp23w08434twmvr4fxw672whkjy0py26r63g3d')
      console.log(`result ${i}: ${JSON.stringify(result, null, 2)}`)
    }
  } catch (err) {
    console.log('Error: ', err)
  }
}
startTest()
