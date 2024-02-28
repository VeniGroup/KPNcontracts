
const hre = require("hardhat");

const USDTAddress = "0xA230Abc6076A497B254F92Bf5cE68ED6a35EC008"
const multiSigWallet = "0xB39aE99fb34d2Fd691BBeEDF595E3Ce7b002dF5e"

async function main() {
  const KPNToken = await hre.ethers.deployContract("KPNToken", [multiSigWallet])
  await KPNToken.waitForDeployment()

  const LockingContract = await hre.ethers.deployContract("LockTokens", [KPNToken.target, USDTAddress, multiSigWallet])
  await LockingContract.waitForDeployment()

  const ClaimingContract = await hre.ethers.deployContract("ClaimTokens", [KPNToken.target, multiSigWallet])
  await ClaimingContract.waitForDeployment()

  console.log(`
  KPN Deployed to ${KPNToken.target} \n
  Locking Contract Deployed to ${LockingContract.target} with ${USDTAddress} as the rewards token \n
  Claiming Mining Contract Deployed to ${ClaimingContract.target} \n
  Owner Wallet as MultiSigWallet: ${multiSigWallet}\n
  Please Write these addresses down for future reference
  `);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
