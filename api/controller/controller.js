const {ethers} =require( "ethers")
require("dotenv").config()
const {fetchClaimTokens, fetchKPNTokenContract, getDeployerWallet, fetchLockingTokens} = require("../utils/helpers/helpers")
const {POLYGON_CLAIMING} = require("../utils/addresses/address")

async function getCurrentState(req, res) {
    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_ALCHEMY_URL)
    const KPN = fetchKPNTokenContract(provider)
    
    res.header("Content-Type",'application/json');
    res.json({  
        kpn_owner: (await KPN.owner()),
        circulating_supply: (await KPN.totalSupply()).toString(),
        max_supply: (await KPN.maxSupply()).toString()

    })
}
// need to get amount from body
async function mintToDeployer(req, res){
    const amountStr = req.body.amount;
    const amount = ethers.parseEther(amountStr)

    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_ALCHEMY_URL)
    const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)

    const KPN = fetchKPNTokenContract(deployer)
    const tx = await KPN.mint(amount)
    const resp = await tx.wait()
    if(resp.status ===  1){
        res.header("Content-Type",'application/json');
        res.status(200).json({
            "status": "success",
            "amount": amount.toString(),
            "to_address": deployer.address,
            "deployer_balance": (await KPN.balanceOf(deployer.address)).toString()
        })

    } else {
        res.status(400).json({
            "status": "failed",
        })
    }


}



async function mintToMining(req, res) {
    const amountStr = req.body.amount;
    const ethAmount = ethers.parseEther(amountStr)
    

    if (ethAmount <= 0) {
        res.status(400).json({ "error": 'Invalid amount' });
        return;
    }

    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_ALCHEMY_URL)
    const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)
    
    const KPN = fetchKPNTokenContract(deployer)

    const currentSupply = await KPN.totalSupply();
    if(BigInt(ethAmount) + BigInt(currentSupply) > (2**256 - 1)){
        res.json({
            "error": "overflow error"
        })
    }

    const tx = await KPN.mintToAddress(POLYGON_CLAIMING, ethAmount.toString())
    const resp = await tx.wait()
    if(resp.status ===  1){
        res.header("Content-Type",'application/json');
        res.status(200).json({
            "status": "success",
            "amount": ethAmount.toString(),
            "to_address": POLYGON_CLAIMING,
            "mining_contract_balance": (await KPN.balanceOf(POLYGON_CLAIMING)).toString()
        })

    } else {
        res.status(400).json({
            "status": "failed",
        })
    }

}

async function burn(req, res){
    const amountStr = req.body.amount;
    const amount = ethers.parseEther(amountStr)

    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_ALCHEMY_URL)
    const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)

    const KPN = fetchKPNTokenContract(deployer)
    const tx = await KPN.burn(amount)
    const resp = await tx.wait()
    if(resp.status ===  1){
        res.header("Content-Type",'application/json');
        res.status(200).json({
            "status": "success",
            "amount": amount.toString(),
            "burn_address": deployer.address,
            "deployer_balance": (await KPN.balanceOf(deployer.address)).toString()
        })

    } else {
        res.status(400).json({
            "status": "failed",
        })
    }
}

async function miningContractState(req, res) {
    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_ALCHEMY_URL)
    const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)
    const MiningContract = fetchClaimTokens(deployer)
    const KPN = fetchKPNTokenContract(deployer)

    res.header("Content-Type",'application/json');
    res.json({
        "status": "success",
        "state": {
            "owner": await MiningContract.owner(),
            "mining_kpn_balance":  (await KPN.balanceOf(MiningContract.target)).toString(),
            "whitelist_address": (await MiningContract.getWhitelist()),
        },
    })


}

async function addToWhitelist(req, res) {
    const addressToAdd = req.body.address
    const amountStr = req.body.amount;
    const amountToSend = ethers.parseEther(amountStr)

    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_ALCHEMY_URL)
    const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)
    const MiningContract = fetchClaimTokens(deployer)

    const tx = await MiningContract.addToWhiteList(addressToAdd, amountToSend)
    const resp = await tx.wait()
    if(resp.status === 1) {
        res.header("Content-Type",'application/json');
        res.status(200).json({
            "status": "success",
            "address_added": addressToAdd,
            "amount_to_send": amountToSend.toString()
        })
    }else {
        res.status(400).json({
            "status": "failed",
            "message": "error adding whitelist"
        })
    }

}

// send tokens to whitelist
async function sendToWhitelist(req, res){
    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_ALCHEMY_URL)
    const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)

    const KPN = fetchKPNTokenContract(deployer)

    const MiningContract = fetchClaimTokens(deployer)

    const tx = await MiningContract.claimTokens()
    const resp = await tx.wait()
    if(resp.status === 1) {
        res.header("Content-Type",'application/json');
        res.status(200).json({
            "status": "success",
            "whitelists_sent": true,
            "mining_contract_balance": (await KPN.balanceOf(POLYGON_CLAIMING)).toString()
            
        })
    }else {
        res.status(400).json({
            "status": "failed",
            "message": "error sending to whitelist"
        })
    }

}

async function mineToOneAddress(req, res) {
    const address = req.body.address
    const amountStr = req.body.amount;
    const amountToSend = ethers.parseEther(amountStr)


    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_ALCHEMY_URL)
    const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)

    const KPN = fetchKPNTokenContract(deployer)

    const MiningContract = fetchClaimTokens(deployer)

    const tx = await MiningContract.claimToken(address, amountToSend)
    const resp = await tx.wait()
    if(resp.status === 1) {
        res.header("Content-Type",'application/json');
        res.status(200).json({
            "status": "success",
            "target_user_balance": (await KPN.balanceOf(address)).toString(),
            "amount_sent": amountStr,
            
        })
    }else {
        res.status(400).json({
            "status": "failed",
            "message": "error mining to user"
        })
    }

}

async function getWhitelist(req, res) {
    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_ALCHEMY_URL)
    const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)

    const MiningContract = fetchClaimTokens(deployer)

    const whitelist = await MiningContract.getWhitelist()
    const mappedData = whitelist.map((i)=>{
        console.log(i)
        return {
            "address": i.target,
            "amount": (i.amount).toString()
        }
    })
    

    res.header("Content-Type",'application/json');
    res.status(200).json({
        "status": "success",
        "whitelist_array": mappedData,
    })
    
}

async function sendToBulk(req, res) {
    const targets = req.body.address_list

    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_ALCHEMY_URL)
    const deployer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)
    const KPN = fetchKPNTokenContract(deployer)

    const MiningContract = fetchClaimTokens(deployer)

    const mappedData = targets.map((i)=>{
        return {
            "target": i.target,
            "amount": ethers.parseEther(i.amount).toString()
        }
    })
    console.log("mapped data", mappedData)
    
    
    const tx = await MiningContract.bulkSend(mappedData)
    const resp = await tx.wait()
    if(resp.status === 1){
        res.header("Content-Type",'application/json');
        res.status(200).json({
            "status": "success",
            "bulk_send_list": mappedData,
            "mining_contract_balance": (await KPN.balanceOf(POLYGON_CLAIMING)).toString()
        })

    }
    else {
        res.status(400).json({
            "status": "failed",
            "message": "error mining to user"
        })
    }

}


async function getLockingAprRates(req, res) {
    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_ALCHEMY_URL)
    const Locking = fetchLockingTokens(provider)
    
    res.header("Content-Type",'application/json');
    res.json({  
        kpn_owner: (await Locking.owner()),
        apr_tiers: (await Locking.getAprTiers()).toString(),
        // max_supply: (await Locking.maxSupply()).toString()

    })

}


module.exports = {
    getCurrentState,
    mintToDeployer,
    mintToMining,
    burn,
    miningContractState,
    addToWhitelist,
    sendToWhitelist,
    mineToOneAddress,
    getWhitelist,
    sendToBulk,
    getLockingAprRates
}