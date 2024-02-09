require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config()


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks:{
    polygon:{
      url: process.env.MAINNET_ALCHEMY_URL,
      accounts: [process.env.POLYGON_DEPLOYER_PRIVATE],
    },
  },
  etherscan:{
    apiKey: process.env.POLYGONSCAN_API
  }
  
};
