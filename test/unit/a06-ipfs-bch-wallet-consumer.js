/*
  These are unit tests for the JSON-RPC wallet service. That file is just
  a placeholder, which makes these unit tests silly. But they exist to increase
  the overall use test coverage of the repository.
*/

// Global npm libraries
const assert = require("chai").assert;
const sinon = require("sinon");

// Local libraries
const WalletService = require("../../lib/adapters/ipfs-bch-wallet-consumer");

let uut;

describe("#wallet-service-placeholder", () => {
  let uut;
  let sandbox;

  beforeEach(() => {
    uut = new WalletService();

    sandbox = sinon.createSandbox();
  });

  afterEach(() => sandbox.restore());

  beforeEach(() => {
    uut = new WalletService();
  });

  describe("#constructor", () => {
    it("should overwrite API server", () => {
      const bchWalletApi = "http://localhost:5001";

      uut = new WalletService({ bchWalletApi });
    });
  });

  describe("#getUtxos", () => {
    it("should throw an error if input is not a string", async () => {
      try {
        await uut.getUtxos();

        assert.fail("Unexpected code path");
      } catch (err) {
        assert.include(
          err.message,
          "getUtxos() input address must be a string."
        );
      }
    });

    it("should return utxo data", async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, "post").resolves({ data: "test-data" });

      const addr = "test-address";

      const result = await uut.getUtxos(addr);
      // console.log('result: ', result)

      assert.equal(result, "test-data");
    });

    it("should throw an error if network timeout", async () => {
      try {
        // Force network timeout
        sandbox.stub(uut.axios, "post").rejects(new Error("request timed out"));

        const addr = "test-address";

        await uut.getUtxos(addr);

        assert.fail("Unexpected code path");
      } catch (err) {
        assert.include(err.message, "request timed out");
      }
    });
  });

  describe("#sendTx", () => {
    it("should throw an error if input is not an array", async () => {
      try {
        await uut.sendTx();

        assert.fail("Unexpected code path");
      } catch (err) {
        assert.include(err.message, "sendTx() input hex must be a string.");
      }
    });

    it("should broadcast TX and return a txid", async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, "post").resolves({ data: "test-data" });

      const hex = "test-address";

      const result = await uut.sendTx(hex);
      // console.log('result: ', result)

      assert.equal(result, "test-data");
    });

    it("should throw an error if network timeout", async () => {
      try {
        // Force network timeout
        sandbox.stub(uut.axios, "post").rejects(new Error("request timed out"));

        const hex = "test-address";

        await uut.sendTx(hex);

        assert.fail("Unexpected code path");
      } catch (err) {
        assert.include(err.message, "request timed out");
      }
    });
  });

  describe("#getBalances", () => {
    it("should throw an error if input is not an array", async () => {
      try {
        await uut.getBalances();

        assert.fail("Unexpected code path");
      } catch (err) {
        assert.include(
          err.message,
          "addrs input to getBalance() must be an array, of up to 20 addresses."
        );
      }
    });

    it("should return address balances", async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, "post").resolves({ data: "test-data" });

      const addr = ["test-address"];

      const result = await uut.getBalances(addr);
      // console.log('result: ', result)

      assert.equal(result, "test-data");
    });

    it("should throw an error if network timeout", async () => {
      try {
        // Force network timeout
        sandbox.stub(uut.axios, "post").rejects(new Error("request timed out"));

        const addr = ["test-address"];

        await uut.getBalances(addr);

        assert.fail("Unexpected code path");
      } catch (err) {
        assert.include(err.message, "request timed out");
      }
    });
  });
});
