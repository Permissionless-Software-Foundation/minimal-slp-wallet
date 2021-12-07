/*
  This is a wallet-service adapter library for talking to wallet services.

  This library is intended to be overwritten at run-time. This library defines
  the methods that should be implemented in library that is used to overwrite
  this one.

  If not overridden, it will default to use free-bch.fullstack.cash.
*/

// Public npm libraries
const axios = require("axios");

class WalletService {
  constructor(localConfig = {}) {
    // Default API Server
    this.apiServer = "https://free-bch.fullstack.cash";

    // Can override the default API Server.
    if (localConfig.bchWalletApi) {
      this.apiServer = localConfig.bchWalletApi;
    }

    // Encapsulate dependencies
    this.axios = axios;
  }

  // Get UTXOs for an address.
  async getUtxos(addr) {
    try {
      // Input validation
      if (!addr || typeof addr !== "string") {
        throw new Error("getUtxos() input address must be a string.");
      }

      const body = {
        address: addr
      };

      const result = await this.axios.post(`${this.apiServer}/bch/utxos`, body);

      // console.log(`result.data: ${JSON.stringify(result.data, null, 2)}`);
      return result.data;
    } catch (err) {
      console.error("Error in getUtxos()");
      throw err;
    }
  }

  // Broadcast a transaction to the network.
  async sendTx(hex) {
    try {
      // Input validation
      if (!hex || typeof hex !== "string") {
        throw new Error("sendTx() input hex must be a string.");
      }

      const body = {
        hex
      };

      const result = await this.axios.post(
        `${this.apiServer}/bch/broadcast`,
        body
      );
      // console.log(`result.data: ${JSON.stringify(result.data, null, 2)}`);

      return result.data;
    } catch (err) {
      console.error("Error in sendTx()");
      throw err;
    }
  }

  // Get the balance in BCH for an address
  async getBalances(addrs) {
    try {
      // Input validation.
      if (!addrs || !Array.isArray(addrs)) {
        throw new Error(
          "addrs input to getBalance() must be an array, of up to 20 addresses."
        );
      }

      const body = {
        addresses: addrs
      };
      const result = await this.axios.post(
        `${this.apiServer}/bch/balance`,
        body
      );

      // console.log(`result.data: ${JSON.stringify(result.data, null, 2)}`);
      return result.data;
    } catch (err) {
      console.error("Error in getBalance()");
      throw err;
    }
  }
}

module.exports = WalletService;
