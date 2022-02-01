const hre = require("hardhat");
const Web3 = require("web3");
var reptRefunds = require(__dirname + "/../loopring-rept.json");
var ammRefunds = require(__dirname + "/../loopring-amm.json");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile 
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // Refunds to BNs
  for (const x of Object.keys(reptRefunds)) reptRefunds[x] = new Web3.utils.BN(reptRefunds[x]);
  for (const x of Object.keys(ammRefunds)) ammRefunds[x] = new Web3.utils.BN(ammRefunds[x]);

  // Get AMM-REPT-ETH token sum
  var ammTokenSum = Web3.utils.toBN(0);
  for (const x of Object.keys(ammRefunds)) ammTokenSum.iadd(ammRefunds[x]);

  // Redistribute AMM balance 
  var ammReptBalance = reptRefunds["0x76d8ea32c511a87ee4bff5f00e758dd362adf3d0"];
  delete reptRefunds["0x76d8ea32c511a87ee4bff5f00e758dd362adf3d0"];

  for (const x of Object.keys(ammRefunds)) {
    if (reptRefunds[x] === undefined) reptRefunds[x] = ammRefunds[x].mul(ammReptBalance).div(ammTokenSum);
    else reptRefunds[x].iadd(ammRefunds[x].mul(ammReptBalance).div(ammTokenSum));
  }

  // Get REPT sum across Loopring holders
  var reptSum = Web3.utils.toBN(0);
  for (const x of Object.keys(reptRefunds)) reptSum.iadd(reptRefunds[x]);
  console.log("Sum of REPT owned by Loopring:", reptSum.toString());

  // Check REPT-b allocated to Loopring
  const FYToken = await hre.ethers.getContractFactory("FYToken");
  const fyToken = await FYToken.attach(process.env.DEPLOYED_FY_TOKEN);
  var daiAllocated = new Web3.utils.BN((await fyToken.balanceOf("0x674bdf20a0f284d710bc40872100128e2d66bd3f")).toString());
  console.log("DAI allocated to Loopring:", daiAllocated.toString());

  // Calculate DAI refunds
  var daiRefunds = {};

  for (const x of Object.keys(reptRefunds)) {
    daiRefunds[x] = reptRefunds[x].mul(daiAllocated).div(reptSum);
  }
  
  // Get DAI sum
  var daiSum = Web3.utils.toBN(0);
  for (const x of Object.keys(daiRefunds)) daiSum.iadd(daiRefunds[x]);
  console.log("Sum of DAI to distribute:", daiSum.toString());

  // We get the contract to deploy
  const fyTokenImplementationAddress = await hre.upgrades.prepareUpgrade(process.env.DEPLOYED_FY_TOKEN, FYToken);
  console.log("FYToken implementation deployed to:", fyTokenImplementationAddress);
  var seizeLoopringCalldata = fyToken.interface.encodeFunctionData("seizeLoopring");
  var proxyAdminInterface = new ethers.utils.Interface(["function upgradeAndCall(address proxy, address implementation, bytes memory data)"]);
  var upgradeAndCallCalldata = proxyAdminInterface.encodeFunctionData("upgradeAndCall", [process.env.DEPLOYED_FY_TOKEN, fyTokenImplementationAddress, seizeLoopringCalldata])
  console.log("`ProxyAdmin.upgradeAndCall` calldata:", upgradeAndCallCalldata);

  // Multi-transfer
  var users = Object.keys(daiRefunds);
  var amounts = Object.values(daiRefunds);
  for (var i = 0; i < amounts.length; i++) amounts[i] = amounts[i].toString();

  for (var i = 0; i < users.length; i += 400) {
    var multiTransferCalldata = await fyToken.interface.encodeFunctionData("multiTransfer", [users.slice(i, i + 400), amounts.slice(i, i + 400)]);
    var upgradeAndCallCalldata = proxyAdminInterface.encodeFunctionData("upgradeAndCall", [process.env.DEPLOYED_FY_TOKEN, fyTokenImplementationAddress, multiTransferCalldata])
    console.log("`ProxyAdmin.upgradeAndCall` calldata:", upgradeAndCallCalldata);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
