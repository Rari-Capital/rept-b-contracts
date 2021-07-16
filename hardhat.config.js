require("@nomiclabs/hardhat-waffle");
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    mainnet: {
      url: process.env.MAINNET_WEB3_PROVIDER,
      accounts: [process.env.MAINNET_PRIVATE_KEY]
    },
    ropsten: {
      url: process.env.ROPSTEN_WEB3_PROVIDER,
      accounts: [process.env.ROPSTEN_PRIVATE_KEY]
    }
  }
};
