const fs = require("fs");
const Web3 = require("web3");
const rftAbi = require(__dirname + "/../abi/RariFundToken.json");
const rfmAbi = require(__dirname + "/../abi/RariFundManager.json");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile 
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // Get ETH refunds
  var web3 = new Web3(process.env.MAINNET_WEB3_PROVIDER);
  var rept = new web3.eth.Contract(rftAbi, "0xCda4770d65B4211364Cb870aD6bE19E7Ef1D65f4");
  var repManager = new web3.eth.Contract(rfmAbi, "0xD6e194aF3d9674b62D1b30Ec676030C23961275e");
  var hacker = "0x2f755e8980f0c2e81681d82cccd1a4bd5b4d5d46";
  var events = await rept.getPastEvents("Transfer", { fromBlock: 0, toBlock: 12394250 });
  var refunds = {};

  for (const x of events) {
    // Disregard transactions to and from the hacker
    if (x.returnValues.from.toLowerCase() === hacker.toLowerCase() || x.returnValues.to.toLowerCase() === hacker.toLowerCase()) continue;

    // Set refund to the difference between before and after the hack (disregard txs to the 0 address)
    if (Object.keys(refunds).indexOf(x.returnValues.to) < 0 && x.returnValues.to !== "0x0000000000000000000000000000000000000000")
      refunds[x.returnValues.to] = Web3.utils.toBN(await repManager.methods.balanceOf(x.returnValues.to).call(12394006)).sub(Web3.utils.toBN(await repManager.methods.balanceOf(x.returnValues.to).call(12394250)));

    // Subtract withdrawals during the hack from the refunds
    if (x.blockNumber >= 12394007) {
      if (x.returnValues.to !== "0x0000000000000000000000000000000000000000") throw "Non-withdrawal transaction found during hack: " + x.transactionHash;
      console.log("Withdrawal during hack:", x.transactionHash);
      var withdrawalEventParams = web3.eth.abi.decodeParameters(["uint256", "uint256"], (await web3.eth.getTransactionReceipt(x.transactionHash)).logs.find(element => element.address.toLowerCase() == "0xD6e194aF3d9674b62D1b30Ec676030C23961275e".toLowerCase()).data);
      refunds[x.returnValues.from].isub(Web3.utils.toBN(withdrawalEventParams[0]));
    }
  }

  // Get ETH sum
  var sum = Web3.utils.toBN(0);
  for (const x of Object.keys(refunds)) sum.iadd(refunds[x]);
  console.log("Sum of ETH:", sum.toString());
  var daiRefunds = {};
  for (const x of Object.keys(refunds)) daiRefunds[x] = refunds[x].muln(391625).divn(100); // ETH/USD = $3,916.25 at time of hack: https://etherscan.io/block/12394006
  var daiSum = Web3.utils.toBN(0);
  for (const x of Object.keys(daiRefunds)) daiSum.iadd(daiRefunds[x]);
  console.log("Sum of DAI:", daiSum.toString());

  // Write ETH refunds to file
  await new Promise(function (resolve, reject) {
    fs.writeFile(__dirname + "/../refunds.json", JSON.stringify(refunds), function(err) {
      if (err) reject(err);
      resolve();
    });
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
