const hre = require("hardhat");
const { exec } = require("child_process");
const util = require("util");
const execAsync = util.promisify(exec);

async function main() {
    const USDTAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
    const multiSigWallet = "0xB39aE99fb34d2Fd691BBeEDF595E3Ce7b002dF5e";
    const KPNaddress = ""; // Replace with KPN address after doing deployKPN

    // Deploy KPNToken
    // const KPNToken = await deployContract("KPNToken", [multiSigWallet]);
    // await flattenAndVerify(KPNToken, ["KPNToken", multiSigWallet]);

    // Deploy LockTokens
    const LockTokens = await deployContract("LockTokens", [KPNaddress, USDTAddress, multiSigWallet]);
    await flattenAndVerify(LockTokens, ["LockTokens", KPNaddress, USDTAddress, multiSigWallet]);

    // Deploy ClaimTokens
    const ClaimTokens = await deployContract("ClaimTokens", [KPNaddress, multiSigWallet]);
    await flattenAndVerify(ClaimTokens, ["ClaimTokens", KPNaddress, multiSigWallet]);

    console.log("Deployment, flattening, and verification process completed.");
}

async function deployContract(contractName, args) {
    const ContractFactory = await hre.ethers.getContractFactory(contractName);
    const contract = await ContractFactory.deploy(...args);
    await contract.waitForDeployment();
    console.log(`${contractName} deployed to: ${contract.target}`);
    return { contract, args };
}

async function flattenAndVerify({ contract, args }, contractNames) {
    const flattenedPath = `./flattened/${contractNames}.sol`;
    await flattenContract(`./contracts/${contractNames}.sol`, flattenedPath);

    // Introduce a delay before verification to ensure the contract is fully propagated
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 60 seconds
    try {
        await hre.run("verify:verify", {
            address: contract.target,
            constructorArguments: args,
        });
        console.log(`Verified: ${contract.target}`);
    } catch (error) {
        console.error(`Verification failed for ${contract.target}:`, error.message);
    }
}

async function flattenContract(contractPath, outputPath) {
    try {
        const { stdout, stderr } = await execAsync(`npx sol-merger "${contractPath}" "${outputPath}"`);
        console.log(stdout);
        if (stderr) console.error(stderr);
        console.log(`Contract flattened and saved to ${outputPath}`);
    } catch (error) {
        console.error(`Error flattening contract: ${error}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
