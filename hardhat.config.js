require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config()


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks:{
    mumbai:{
      url: process.env.TESTNET_ALCHEMY_URL,
      accounts: [process.env.POLYGON_DEPLOYER_PRIVATE],
    },
    bsctest:{
      url: process.env.TESTNET_ANKR_BNB,
      accounts: [process.env.POLYGON_DEPLOYER_PRIVATE],
    },
    polygon:{
      url: process.env.MAINNET_ALCHEMY_URL,
      accounts: [process.env.POLYGON_DEPLOYER_PRIVATE],
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: "VJSDX7ZS384QXHIXV273XYD797Q6GUV65U",
    },
  },
  
};
