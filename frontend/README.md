Step 1:
    update .env file with correct deployer address, alchemy url/api key
    update contract addresses in utils/addresses/address.js
    Claiming_address is the mining contract to send tokens to users
    Lock Address is the staking contract
    KPN is the main token contract

Step 2:
    install ethers.js into project

Step 3:
    take functions from frontend/src/components/ Landingpage.js (modifier where needs) and implement into front end
    Functions are called on the client side and validated through metamask 
        It is not an API call as that is not secure to send signed transaction requests through -calls are made from the client

        Function calls will trigger a metamask pop up to sign and approve the transaction
        
        checkIfWalletIsConnected - used when page is loaded to make a request for the metamask account (if it was previously connected it will auto connect)

        connectWallet -if the wallet has not be connected before, this will trigger metamask to connect to the  front end

        mintToDeployer - called the kpn contract and mints tokens to the deployer wallet
            takes in amount of tokens to mint
        mintToMiningContract - calls kpn to mint tokens to the mining contract for distribution to users
            takes in amount of tokens to mint to mining contract
        sendToOneUserFromMining -sends tokens to a single address from the mining contract
            takes in an address and amount of tokens
        sendToBulkAddresses -this takes in an array of address and token amounts to bulk send to addresses
            takes in an array, array MUST BE FORMATTED this way
                [
                    {
                        target: receiversAddress,
                        amount: amount of tokens to send,
                    },
                ]


        STAKING FUNCTIONS
        fetchCurrentStakingState - fetches the current staking data (apr, current users staked balance)
        stakeTokens - takes in an amount and a time frame (has to be exactly 6 months, 12 months or 24 months in seconds format) 
            -locks tokens up for specified duration
        withdrawStake -after the full duration is up, this function allows stake withdrawn

        UPDATE APR
        pass in a new apr into one of these functions to change the different reward tiers
            setTier1RewardRate(uint newRate)
            setTier2RewardRate(uint newRate)
            setTier3RewardRate(uint newRate)



    

    
    
    
