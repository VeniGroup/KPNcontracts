const {ethers} =require( "ethers")
require("dotenv").config()
const {POLYGON_KPN, POLYGON_CLAIMING, POLYGON_LOCKING} = require("../addresses/address")
const KPNtokenJson = require("../abi/KPNToken.json")
const ClaimTokenJson = require( "../abi/ClaimTokens.json")
const LockTokenJson = require( "../abi/LockingContract.json")


 const fetchKPNTokenContract = (signerOrProvider) =>{
    return new ethers.Contract(POLYGON_KPN, KPNtokenJson.abi, signerOrProvider)
}
 const fetchClaimTokens = (signerOrProvider) =>{
    return new ethers.Contract(POLYGON_CLAIMING, ClaimTokenJson.abi, signerOrProvider)
}
 const fetchLockingTokens = (signerOrProvider) =>{
    return new ethers.Contract(POLYGON_LOCKING, LockTokenJson.abi, signerOrProvider)
}

 const getDeployerWallet = (provider) =>{
    return new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)
}

module.exports = {
    fetchClaimTokens,
    fetchKPNTokenContract,
    getDeployerWallet,
    fetchLockingTokens
}