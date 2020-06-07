/*
  An example project illustrating how to use JS classes, introduced in
  ECMAScript 2015.
*/

'use strict'

const UtilLib = require('./lib/util')
const myLib = new UtilLib()

// The main entry function for the program.
async function mainFunction() {
  try {
    const addr = "bitcoincash:qp3sn6vlwz28ntmf3wmyra7jqttfx7z6zgtkygjhc7"
    console.log(`addr: ${addr}`)

    const bchData = await myLib.getBchData(addr)

    console.log(`bchData: ${JSON.stringify(bchData,null,2)}`)
  } catch(err) {
    console.error(`Error in main program: `, err)
  }
}

// Start the program.
mainFunction()
