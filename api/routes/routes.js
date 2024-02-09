const {ethers} =require( "ethers")
require("dotenv").config()
const express = require('express')
const {getCurrentState, mintToDeployer, mintToMining, burn, miningContractState, addToWhitelist, sendToWhitelist, mineToOneAddress, getWhitelist, sendToBulk, getLockingAprRates} = require("../controller/controller")


const api = express.Router()

// kpn api calls
api.get("/kpnstate",getCurrentState )
api.post("/deployeraddressmint", mintToDeployer)
api.post("/miningmint", mintToMining)

api.post("/burn", burn)

// mining contract api calls
api.get("/miningcontractstate",miningContractState )
api.get("/whitelist", getWhitelist)
api.post("/addtowhitelist",addToWhitelist )
api.post("/sendtowhitelist",sendToWhitelist )
api.post("/sendtouser",mineToOneAddress )
api.post("/sendtobulk",sendToBulk )

api.get("/lockingapr", getLockingAprRates)


module.exports = {
    api
}
