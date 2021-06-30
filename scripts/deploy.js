const hre = require("hardhat");
const Web3 = require("web3");
var refunds = require(__dirname + "/../refunds.json");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile 
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // Refunds to BNs
  for (const x of Object.keys(refunds)) refunds[x] = new Web3.utils.BN(refunds[x], 16);

  // Get ETH sum
  var sum = Web3.utils.toBN(0);
  for (const x of Object.keys(refunds)) sum.iadd(refunds[x]);
  console.log("Sum of ETH:", sum.toString());
  var daiRefunds = {};
  for (const x of Object.keys(refunds)) daiRefunds[x] = refunds[x].muln(391625).divn(100); // ETH/USD = $3,916.25 at time of hack: https://etherscan.io/block/12394006
  var daiSum = Web3.utils.toBN(0);
  for (const x of Object.keys(daiRefunds)) daiSum.iadd(daiRefunds[x]);
  console.log("Sum of DAI:", daiSum.toString());

  // We get the contract to deploy
  const FYToken = await hre.ethers.getContractFactory("FYToken");
  const fyToken = await hre.upgrades.deployProxy(FYToken, [
    1622833200, // https://ipfs.fleek.co/ipfs/QmRZNQCGsKvBH22p6SoGLHrbkRLjKbRLhBjiru7hZJsLqo
    daiSum.toString(),
    "0x6b175474e89094c44da98b954eedeac495271d0f",
    "REPT-b",
    "REPT-b"
  ]);
  await fyToken.deployed();
  console.log("FYToken deployed to:", fyToken.address);

  // Multi-transfer
  var users = Object.keys(daiRefunds);
  var amounts = Object.values(daiRefunds);
  for (var i = 0; i < amounts.length; i++) {
    amounts[i] = amounts[i].toString();
    if (amounts[i] / 1e18 >= 100000) console.log("User receiving >= 100,000 DAI:", users[i], amounts[i] / 1e18);
  }
  for (var i = 0; i < users.length; i += 200) await fyToken.multiTransfer(users.slice(i, i + 200), amounts.slice(i, i + 200));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
