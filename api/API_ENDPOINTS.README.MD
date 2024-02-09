ENDPOINTS

KPN TOKEN API:
    GET
        api.get("/kpnstate",getCurrentState ) -used to get state data of kpn smart contract
        returns owner, circulating supply and max supply
    POST   
        api.post("/deployeraddressmint", mintToDeployer) -mint tokens to deployer wallet
            data to be sent in this format
                {
                    "amount": "stringvalue"
                }

        api.post("/miningmint", mintToMining) - mints to mining contract
            data to be sent in this format
                {
                    "amount": "stringvalue"
                }

        api.post("/burn", burn) burn tokens from deployer wallet
            data to be sent in this format
                {
                    "amount": "stringvalue"
                }


MINING CONTRACT
    GET
        api.get("/miningcontractstate",miningContractState ) - get mining contract data

        api.get("/whitelist", getWhitelist) gets whitelist data (should you choose to use this function)
    
    POST
        api.post("/addtowhitelist",addToWhitelist ) -store addresses and amounts to send for future 
            data to be sent in this format
                {
                    "address": "ethersaddress",
                    "amount": "stringvalue"
                }

        api.post("/sendtowhitelist",sendToWhitelist ) -sends to the entire whitelist their designated amount
        

        api.post("/sendtouser",mineToOneAddress ) -mine kpn tokens from mining contract to one specific user
            data to be sent in this format
            {
                "address": "ethersaddress",
                "amount": "stringvalue"
            }
            
        api.post("/sendtobulk",sendToBulk ) -takes in an array from the request body. array contains target address and amount
            data format
                {
                    "target":"evmAddress",
                    "amount" "stringvalue"
                }

// mining contract api calls