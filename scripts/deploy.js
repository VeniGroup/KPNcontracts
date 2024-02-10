
const hre = require("hardhat");

const USDTAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
const multiSigWallet = "0x"

async function main() {
  const KPNToken = await hre.ethers.deployContract("KPNToken"[multiSigWallet])
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
