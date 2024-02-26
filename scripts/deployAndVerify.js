const hre = require("hardhat");

async function main() {
    const USDTAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
    const multiSigWallet = "0x91Aa6C17340b1837aD8DcD5835249392BCB4fC5d";

    // Deploy KPNToken
    const KPNToken = await deployContract("KPNToken", [multiSigWallet]);

    // Deploy LockTokens
    const LockTokens = await deployContract("LockTokens", [KPNToken.address, USDTAddress, multiSigWallet]);

    // Deploy ClaimTokens
    const ClaimTokens = await deployContract("ClaimTokens", [KPNToken.address, multiSigWallet]);

    console.log("Deployment and verification completed.");
}

async function deployContract(contractName, args) {
    const ContractFactory = await hre.ethers.getContractFactory(contractName);
    const contract = await ContractFactory.deploy(...args);
    await contract.deployed();
    console.log(`${contractName} deployed to: ${contract.address}`);

    // Verification
    try {
        await hre.run("verify:verify", {
            address: contract.address,
            constructorArguments: args,
        });
        console.log(`Verified: ${contractName} at ${contract.address}`);
    } catch (error) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log(`${contractName} at ${contract.address} is already verified.`);
        } else {
            console.error(`Verification failed for ${contractName} at ${contract.address}`, error);
        }
    }
    return contract;
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
