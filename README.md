To install project dependencies
*ensure you have node installed*

    npm install

Contracts
    KPN Token
    Locking aka Staking contract
    Claiming aka Mining Contract

Commands
    npx hardhat test // runs tests
    npx hardhat run scripts/deploy.js // runs deploy script use '--network' flag to pick network specified in hardhat config file

Smart contract flow
    KPN contract mints tokens to either deployer wallet or Claiming contract( mining contract)
    
    * Mint to mining contract before any claims or sending to users*
    KPN Contract can burn tokens from the deployers wallet

    Claiming contract (aka mining contract) 
        sends to an individual user
        sends to a list of bulk users
        also has whitelist functions to create a whitelist stored to send to

    Locking contract (aka staking contract)
        update different apr's
        users can stake tokens for 6 months, 12 months, 24 months
        rewards paid in USDT (please ensure USDT is stored on the smart contract)
        withdraw from contract when stake duration is up

