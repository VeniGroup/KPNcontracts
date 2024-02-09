const { expect } = require("chai");
const hre  = require( "hardhat")
const {moveBlocks} = require("./utils/moveBlocks.js")
const {moveTime} = require("./utils/moveTime.js")

const tokens = (n) => {
    return ethers.parseUnits(n.toString(), 'ether')
}
const unToken = (n) => {
    return ethers.formatUnits(n, 'ether')
}
const initialSupply = tokens('200000000')
const addressZero = ("0x0000000000000000000000000000000000000000")

const locktime1 = 180 * 24 * 60 * 60; // 180 days
const locktime2 = 365 * 24 * 60 * 60; // 365 days
const locktime3 = 730 * 24 * 60 * 60; // 730 days

const tier1Cutoff = 750000 
const tier2Cutoff = 1250000 
const tier3Cutoff = 3000000
const tier4Cutoff = 5000000 
const tier5Cutoff = 7500000
const tier6Cutoff = 12500000 

const tier1mon6 = tokens(750);
    const tier1mon12 = tokens(1800);
    const tier1mon24 = tokens(4500);

    // TIER 2
    const tier2mon6 = tokens(1500);
    const tier2mon12 = tokens(3500)
    const tier2mon24 = tokens(8000)

    
    // TIER 3
    const tier3mon6 = tokens(4200)
    const tier3mon12 = tokens(9000)
    const tier3mon24 = tokens(21000)
    
    // TIER 4
    const tier4mon6 = tokens(8000)
    const tier4mon12 = tokens(17000)
    const tier4mon24 = tokens(37000)
    
    // TIER 5
    const tier5mon6 = tokens(13500)
    const tier5mon12 = tokens(28500)
    const tier5mon24 = tokens(58500)
    
    // TIER 6
    const tier6mon6 = tokens(25000)
    const tier6mon12 = tokens(50000)
    const tier6mon24 = tokens(112500) 

// based on one year
function _calculateUSDTRewards(kpntokens, rewardRate, timeDuration) {
    const untokened = unToken(kpntokens)
    const rewards = (untokened * rewardRate * timeDuration) / (locktime2 * 10000);
    return tokens(rewards)
}

const usdtAddress ="0xc2132D05D31c914a87C6611C10748AEb04B58e8F"


describe("KPN Token", () =>{
    let KPNToken, USDT, LockingContract, ClaimingContract, deployer, user1, user2, exchange, user4, user5
    beforeEach(async () =>{
        [deployer, user1, user2, exchange, user4, user5] = await ethers.getSigners()
        KPNToken = await ethers.deployContract("KPNToken")
        await KPNToken.waitForDeployment()
        
        // KPN token address and  usdt / rewards tokens address passed into constructor
        LockingContract = await hre.ethers.deployContract("LockTokens", [KPNToken.target, usdtAddress])
        await LockingContract.waitForDeployment()
        
        ClaimingContract = await hre.ethers.deployContract("ClaimTokens", [KPNToken.target])
        await ClaimingContract.waitForDeployment()
        
        USDT = await ethers.deployContract("TestUSDT", [LockingContract.target])
        await USDT.deployContract

        // update usdt address to test usdt contract
        await LockingContract.connect(deployer).setUSDTAddress(USDT.target);

        // console.log(`Token from scratch deployed to ${Scratch.target}`)
    })
    describe("Constructor and Deployment", () =>{
        it("checks the owner of scratch is the deployer", async () =>{
            // console.log("deployeer",deployer.address)
            // console.log("user1" ,user1.address)
            expect(await KPNToken.owner()).to.equal(deployer.address)
        })
        it("checks name, symbol, total supply as KonnektVPN, KPN, 200000000000000000000000000", async () =>{
            expect(await KPNToken.name()).to.equal("KonnektVPN")
            expect(await KPNToken.symbol()).to.equal("KPN")
            expect(await KPNToken.totalSupply()).to.equal(initialSupply)
        })
        it('assigns total supply to deployer', async () => {
            expect(await KPNToken.balanceOf(deployer.address)).to.equal(initialSupply)
        })
    })
    describe("Minting Tokens", () =>{
        describe("Success", ()=>{
            let tx, res, value
            beforeEach(async ()=>{
                value = tokens(100)
                // mint tokens to deployer to send
                tx = await KPNToken.connect(deployer).mint(value)
                res = await tx.wait()
            })
            it("checks the deployers balance", async () =>{
                expect(await KPNToken.balanceOf(deployer.address)).to.equal(value + initialSupply)
            })
            it("checks the transfer event is emitted for mint and contract mint", async () =>{
                expect(await KPNToken.connect(deployer).mint(value)).to.emit("Transfer").withArgs(addressZero, deployer.target, value)
            })
            it("checks the total circulating supply was increased", async () =>{
                expect(await KPNToken.totalSupply()).to.equal(BigInt("200000000000000000000000000") + BigInt(value))
            } )
            
        })
        describe("Failure", ()=>{
            let tx, res, value
            beforeEach(async ()=>{
                value = tokens(100)
                // mint tokens to deployer to send
                tx = await KPNToken.connect(deployer).mint(value)
                res = await tx.wait()
            })
            it("checks only the owner can mint to owner wallet", async () =>{
                await expect(KPNToken.connect(user1).mint(value)).to.be.revertedWith("ERC20: Only contract owner can call function")
            })
        })
    })
    describe("Burning Tokens", () =>{
        describe("Success", ()=>{
            let tx, res, value, burnAmount, transferAmount
            beforeEach(async ()=>{
                value = tokens(100)
                burnAmount = tokens(50)
                transferAmount = tokens(10)
                // mint tokens to deployer to send
                tx = await KPNToken.connect(deployer).mint(value)
                res = await tx.wait()
                tx = await KPNToken.connect(deployer).burn(burnAmount)
                res = await tx.wait()
            })
            it("checks the deployers balance after burn", async () =>{
                expect(await KPNToken.balanceOf(deployer.address)).to.equal(initialSupply + value - burnAmount)
            })
            it("checks the user1 balance after burn", async () =>{
                await KPNToken.connect(deployer).transfer(user1.address, transferAmount)
                expect(await KPNToken.balanceOf(user1.address)).to.equal(transferAmount)
                await KPNToken.connect(user1).burn(transferAmount)
                expect(await KPNToken.balanceOf(user1.address)).to.equal(0)
                
            })
            it("checks the contract balance after burn", async () =>{
                // checks the total supply is tracked after burn
                expect(await KPNToken.totalSupply()).to.equal(initialSupply + tokens(50))
            })
            it("checks the burn event is emitted", async () =>{
                await KPNToken.connect(deployer).transfer(user1.address, transferAmount)
                expect(await KPNToken.connect(user1).burn(transferAmount)).to.emit("Transfer")
            })
            
        })
        describe("Failure", ()=>{
            let tx, res, value, burnAmount
            beforeEach(async ()=>{
                value = tokens(100)
                burnAmount = tokens(50)
                
                // mint tokens to deployer to send
                tx = await KPNToken.connect(deployer).mint(value)
                res = await tx.wait()
                
            })
            it("checks user can only burn their own tokens", async () =>{
                await expect(KPNToken.connect(user1).burn(burnAmount)).to.be.reverted
                
            })
        })
    })
    describe("Sending tokens", () =>{
        let tx, res, value
        beforeEach(async ()=>{
            value = tokens(100)
            // mint tokens to deployer to send
            tx = await KPNToken.connect(deployer).mint(value)
            res = await tx.wait()
            tx = await KPNToken.connect(deployer).transfer(user1.address, value)
            res = await tx.wait()
        })
        describe("Success", () =>{
            it("transfers 100 tokens to user1 from deployer", async () =>{
                expect(await KPNToken.balanceOf(deployer.address)).to.equal(initialSupply)
                expect(await KPNToken.balanceOf(user1.address)).to.equal(value)
            })
            it('emits a Transfer event', async () => {  
                tx = await KPNToken.connect(deployer).mint(value)
                res = await tx.wait()
                expect( await KPNToken.connect(deployer).transfer(user1.address, value)).to.emit('Transfer')
                    .withArgs(deployer.address, user1.address, value) 
            })
        })
        describe("Failure", () =>{
            it('rejects insufficient balances', async () => {
                const invalidAmount = tokens(1000000000000000)
                await expect(KPNToken.connect(deployer).transfer(user1.address, invalidAmount)).to.be.reverted
            })
            it('rejects invalid receiver', async () => {
                const amount = tokens(100)
                await expect(KPNToken.connect(deployer).transfer('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
            })
        })
    })
    describe("Approving Tokens", ()=>{
        let tx, res, value
        beforeEach(async () => {
            value = tokens(100)
            // mint tokens to deployer to send
            tx = await KPNToken.connect(deployer).mint(value)
            res = await tx.wait()
            tx = await KPNToken.connect(deployer).approve(exchange.address, value) // approves the token transfer
            res = await tx.wait()
        })
        describe("Success", () =>{
            beforeEach(async () =>{
                tx = await KPNToken.connect(exchange).transferFrom(deployer.address, user1.address, value) // transfers tokens
                res = await tx.wait()
            })
            it("checks delegate transferFrom function", async () =>{
                expect(await KPNToken.balanceOf(deployer.address)).to.be.equal(initialSupply)
                expect(await KPNToken.balanceOf(user1.address)).to.be.equal(value)
            })
            it('checks the allowance was resets', async () => {
                expect(await KPNToken.allowance(deployer.address, exchange.address)).to.be.equal(0)
            })
            it('emits a Transfer event', async () => {  
                tx = await KPNToken.connect(deployer).mint(value)
                res = await tx.wait()
                tx = await KPNToken.connect(deployer).approve(exchange.address, value) // approves the token transfer
                res = await tx.wait()
                
                expect( await KPNToken.connect(exchange).transferFrom(deployer.address, user1.address, value)).to.emit('Transfer')
                    .withArgs(deployer.address, user1.address, value) 
            })
        })
        describe("Failure", () =>{
            const invalidAmount = tokens(100000000) // 100 Million, greater than total supply
            it("should fail the transfer of an amount > total supply", async () =>{
                await expect(KPNToken.connect(exchange).transferFrom(deployer.address, user1.address, invalidAmount)).to.be.reverted
            })
        })
    })
    describe("claim tokens airdrop function",()=>{
        describe("array address send", () =>{
            beforeEach(async () =>{
                const addressArray = [
                    {
                        target: user1.address,
                        amount: tokens(1)
                    },
                    {
                        target: user2.address,
                        amount: tokens(1)
                    }
                ]
                await KPNToken.connect(deployer).transfer(ClaimingContract.target, tokens(5000))
                await ClaimingContract.connect(deployer).bulkSend(addressArray)
            })
            it("checks the balance of user 1 was increased", async () =>{
                expect(await KPNToken.balanceOf(user1.address)).to.equal(tokens(1))
            })
        })
        describe("Success", () =>{
            let whitelist, deployerAmount, user1amount, user2amount, user3amount, user4amount, user5amount
            beforeEach(async () =>{
                [deployerAmount, user1amount, user2amount, user3amount, user4amount, user5amount] = [tokens(10), tokens(5), tokens(100), tokens(1000), tokens(500), tokens(15)]
                tx = await ClaimingContract.connect(deployer).addToWhiteList(deployer.address, deployerAmount)
                res = await tx.wait()
                await ClaimingContract.connect(deployer).addToWhiteList(user2.address, user2amount)
                await ClaimingContract.connect(deployer).addToWhiteList(user1.address, user1amount)
                await ClaimingContract.connect(deployer).addToWhiteList(exchange.address, user3amount)
                await ClaimingContract.connect(deployer).addToWhiteList(user4.address, user4amount)
                tx = await ClaimingContract.connect(deployer).addToWhiteList(user5.address, user5amount)
                res = await tx.wait()
                
                whitelist = await ClaimingContract.getWhitelist()
                
                
            })
            describe("Set whitelist",  ()=>{
                it("checks the length of the whitelist array", async () =>{
                    expect(whitelist.length).to.equal(6)
                })
                it("checks the deployer, user2, user1, exhcange, user4, user5 in that order", async ()=>{

                    expect(whitelist[0][0]).to.equal(deployer.address)
                    expect(whitelist[1][0]).to.equal(user2.address)
                    expect(whitelist[2][0]).to.equal(user1.address)
                    expect(whitelist[3][0]).to.equal(exchange.address)
                    expect(whitelist[4][0]).to.equal(user4.address)
                    expect(whitelist[5][0]).to.equal(user5.address)
               
                })
                it("checks the whitelist amounts were set", async () =>{

                    expect(whitelist[0][1]).to.equal(deployerAmount)
                    expect(whitelist[1][1]).to.equal(user2amount)
                    expect(whitelist[2][1]).to.equal(user1amount)
                    expect(whitelist[3][1]).to.equal(user3amount)
                    expect(whitelist[4][1]).to.equal(user4amount)
                    expect(whitelist[5][1]).to.equal(user5amount)

                })
            })
            describe("Claim tokens multisend", () =>{
                let user1Bal, user2bal, user3bal, user4bal, user5bal, deployerTransfer, totalClaim, claimInitial
                beforeEach(async () =>{
                    user1Bal = await KPNToken.balanceOf(user1.address)
                    user2bal = await KPNToken.balanceOf(user2.address)
                    user3bal = await KPNToken.balanceOf(exchange.address)
                    user4bal = await KPNToken.balanceOf(user4.address)
                    user5bal = await KPNToken.balanceOf(user5.address)
                    deployerTransfer = tokens(5000000)
                    await KPNToken.connect(deployer).transfer(ClaimingContract.target, deployerTransfer)
                    claimInitial = await KPNToken.balanceOf(ClaimingContract.target)

                    totalClaim = await ClaimingContract.getTotalTokensToClaim()
                    await ClaimingContract.connect(deployer).claimTokens()
                })
                it("checks the address[] received tokens", async () =>{
                    expect(await KPNToken.balanceOf(user1.address)).to.equal(user1Bal + user1amount)
                    expect(await KPNToken.balanceOf(user2.address)).to.equal(user2bal + user2amount)
                    expect(await KPNToken.balanceOf(exchange.address)).to.equal(user3bal + user3amount)
                    expect(await KPNToken.balanceOf(user4.address)).to.equal(user4bal + user4amount)
                    expect(await KPNToken.balanceOf(user5.address)).to.equal(user5bal + user5amount)
                })
                it("checks the contract balance was reduced by total tokens sent", async () =>{
                    expect(await KPNToken.balanceOf(ClaimingContract.target)).to.equal(claimInitial - totalClaim)
                })
                it("checks an event was emitted", async () =>{
                    user1Bal = await KPNToken.balanceOf(user1.address)
                    user2bal = await KPNToken.balanceOf(user2.address)
                    user3bal = await KPNToken.balanceOf(exchange.address)
                    user4bal = await KPNToken.balanceOf(user4.address)
                    user5bal = await KPNToken.balanceOf(user5.address)
                    deployerTransfer = tokens(500000)
                    await KPNToken.connect(deployer).transfer(ClaimingContract.target, deployerTransfer)
                   
                    expect(await ClaimingContract.connect(deployer).claimTokens()).to.emit("BulkTokenClaim")
                })
            })
            describe("Claim token direct send", () =>{
                beforeEach(async () =>{
                    await KPNToken.connect(deployer).transfer(ClaimingContract.target, tokens(1000))
                    await ClaimingContract.connect(deployer).claimToken(user1.address, tokens(10))
                })
                it("checks the address received tokens directly", async () =>{
                    expect(await KPNToken.balanceOf(user1.address)).to.equal(tokens(10))
                })
                it("checks the contract balance was reduced by total tokens sent",async () =>{
                    expect(await KPNToken.balanceOf(ClaimingContract.target)).to.equal(tokens(990))
                })
                it("checks an event was emitted", async () =>{
                    expect( await ClaimingContract.connect(deployer).claimToken(user1.address, tokens(10)) ).to.emit("TokenClaimed").withArgs(user1.address, tokens(10))
                })
            })
        })
        describe("Failure", () =>{
            describe("Claim tokens multisend ", () =>{
                it("checks only admin can add whitelist", async () =>{
                    await expect(ClaimingContract.connect(user1).addToWhiteList(user2.address, tokens(10))).to.be.revertedWith("Claiming ERC20: Only contract owner can call function")
                })
                it("checks the multisend reverts with claim contract only owner", async () =>{
                    await expect(ClaimingContract.connect(user1).claimTokens()).to.be.revertedWith("Claiming ERC20: Only contract owner can call function")
                })
                it("reverts if balance is too low", async () =>{
                    // call to transfer balance to zero
                    await ClaimingContract.connect(deployer).addToWhiteList(user2.address, tokens(200))
                    
                    await expect(ClaimingContract.connect(deployer).claimTokens()).to.be.revertedWith("Claiming ERC20: Contract Balance Too Low")
                })
                it("reverts if no addresses on whitelist", async () =>{
                    await expect(ClaimingContract.connect(deployer).claimTokens()).to.be.revertedWith("Claiming ERC20: No addresses on whitelist")
                })
            })
            describe("Claim token direct send", () =>{
                it("checks only admin can call function", async () =>{
                    await expect(ClaimingContract.connect(user1).claimToken(user2.address, tokens(10))).to.be.revertedWith("Claiming ERC20: Only contract owner can call function")
                })
                it("reverts if balance is too low", async () =>{  
                    await expect(ClaimingContract.connect(deployer).claimToken(user2.address, tokens(200))).to.be.revertedWith("Claiming ERC20: Contract Balance Too Low")
                })
                

            })

        })
        
    })
    describe("updated stake function", () =>{
        let tx, res, lockAmount, mintAmount, initialContractBal, struct
        beforeEach(async () =>{
            
            mintAmount = tokens(tier6Cutoff)
            
            initialContractBal = await KPNToken.balanceOf(LockingContract.target)
            
            
            tx = await KPNToken.connect(deployer).mint(mintAmount)
            res = await tx.wait()

            await KPNToken.approve(LockingContract.target, mintAmount)
        })
        describe("Success", () =>{
            it("checks the total locked tokens in contract", async () =>{
                tx = await LockingContract.connect(deployer).stake(tokens(tier1Cutoff), locktime1)
                res = await tx.wait()
                // total supply is the initial supply of tokens
                expect(await LockingContract.totalLockedTokens()).to.equal(tokens(tier1Cutoff))
            })
            it("checks the contract balance is increased", async () =>{
                tx = await LockingContract.connect(deployer).stake(tokens(tier1Cutoff), locktime1)
                res = await tx.wait()
                expect(await KPNToken.balanceOf(LockingContract.target)).to.equal(tokens(tier1Cutoff))
            })
            it("checks the tier 1 cut off", async () =>{
                tx = await LockingContract.connect(deployer).stake(tokens(tier1Cutoff) + tokens(10), locktime1)
                res = await tx.wait()
                expect(await LockingContract.totalLockedTokens()).to.equal(tokens(tier1Cutoff))
    
            })
            it("checks the tier 2 cutoff", async () =>{
                // checks the tier 2 cut off and returns the amount over the tier 1 cut off to the sender
                tx = await LockingContract.connect(deployer).stake(tokens(tier2Cutoff - 1), locktime1)
                res = await tx.wait()
                expect(await LockingContract.totalLockedTokens()).to.equal(tokens(tier1Cutoff))
            })
            it("checks tier 3", async () =>{
                tx = await LockingContract.connect(deployer).stake(tokens(tier3Cutoff), locktime1)
                res = await tx.wait()
                expect(await LockingContract.totalLockedTokens()).to.equal(tokens(tier3Cutoff))

            })
            it("checks tier 4", async () =>{
                tx = await LockingContract.connect(deployer).stake(tokens(tier4Cutoff), locktime2)
                res = await tx.wait()
                expect(await LockingContract.totalLockedTokens()).to.equal(tokens(tier4Cutoff))

            })
            it("checks tier 5", async () =>{
                tx = await LockingContract.connect(deployer).stake(tokens(tier5Cutoff), locktime3)
                res = await tx.wait()
                expect(await LockingContract.totalLockedTokens()).to.equal(tokens(tier5Cutoff))

            })
            it("checks tier 6", async () =>{
                tx = await LockingContract.connect(deployer).stake(tokens(tier6Cutoff), locktime1)
                res = await tx.wait()
                expect(await LockingContract.totalLockedTokens()).to.equal(tokens(tier6Cutoff))

            })
            it("checks the tokens were transferred from user1 to lock", async () =>{
                await KPNToken.connect(deployer).transfer(user1.address, tokens(tier2Cutoff))
                await KPNToken.connect(user1).approve(LockingContract.target, tokens(tier2Cutoff))
                await LockingContract.connect(user1).stake(tokens(tier2Cutoff), locktime1)
                expect(await KPNToken.balanceOf(LockingContract.target)).to.equal(tokens(tier2Cutoff))
            })
            it("checks the tokens above cutoff were returned", async() =>{
                const sendAmount = tokens(tier2Cutoff) + tokens(1)
                await KPNToken.connect(deployer).transfer(user1.address, sendAmount)
                await KPNToken.connect(user1).approve(LockingContract.target, sendAmount)
                await LockingContract.connect(user1).stake((sendAmount), locktime1)
                expect(await KPNToken.balanceOf(user1.address)).to.equal(tokens(1))
            })
            it("checks the tokens under cutoff were returned", async () =>{
                await KPNToken.connect(deployer).transfer(user1.address, tokens(200))
                await KPNToken.connect(user1).approve(LockingContract.target, tokens(200))
                await expect(LockingContract.connect(user1).stake(tokens(200), locktime1)).to.be.revertedWith("Locking ERC20: Please send minimum token amount")
                
            })
            it("checks for the Tokens Locked event", async () =>{
                await KPNToken.connect(deployer).transfer(user1.address, tokens(tier2Cutoff))
                await KPNToken.connect(user1).approve(LockingContract.target, tokens(tier2Cutoff))
                expect(await LockingContract.connect(user1).stake(tokens(tier2Cutoff), locktime2)).to.emit("TokensLocked").withArgs(user1.address, locktime1 )
                
            })
            it("checks the struct was created and has proper values", async () =>{
                await KPNToken.connect(deployer).transfer(user1.address, tokens(tier2Cutoff))
                await KPNToken.connect(user1).approve(LockingContract.target, tokens(tier2Cutoff))
                await LockingContract.connect(user1).stake(tokens(tier2Cutoff),locktime1)
                struct = await LockingContract.lockedBalances(user1.address)
                expect(struct.amount).to.equal(tokens(tier2Cutoff))
            })
            it("if a user tries to restake, it sends the original amount back to the owner to restart stake", async () =>{
                tx = await LockingContract.connect(deployer).stake(tokens(tier1Cutoff), locktime1)
                res = await tx.wait()
                struct = await LockingContract.lockedBalances(deployer.address)
                expect(await KPNToken.balanceOf(LockingContract.target)).to.equal(tokens(tier1Cutoff))
                expect(struct.amount).to.equal(tokens(tier1Cutoff))
                
                expect(struct.lockTime).to.equal(locktime1)
                
                tx = await LockingContract.connect(deployer).stake(tokens(tier4Cutoff), locktime1)
                res = await tx.wait()
                
                struct = await LockingContract.lockedBalances(deployer.address)
                expect(await KPNToken.balanceOf(LockingContract.target)).to.equal(tokens(tier4Cutoff))
                expect(struct.amount).to.equal(tokens(tier4Cutoff))
                expect(struct.lockTime).to.equal(locktime1)
                
            })
            describe("Withdraw Stake", async () =>{
                
                beforeEach(async () =>{
                    lockAmount = tokens(tier1Cutoff)
                    await KPNToken.connect(deployer).transfer(user1.address, lockAmount)
                    await KPNToken.connect(user1).approve(LockingContract.target, lockAmount)
                    await LockingContract.connect(user1).stake(lockAmount, locktime1)
                    struct = await LockingContract.lockedBalances(user1.address)

                })
                describe("Success", async () =>{
                    let rewardAmount
                    beforeEach(async () =>{
                        
                        moveTime(31556952)
                        

                    })
                    it("checks the tokens were withdrawn", async () =>{
                        await LockingContract.connect(user1).withdrawLocked()
                        expect(await KPNToken.balanceOf(user1.address)).to.equal(lockAmount)
                    })
                    it("checks a withdraw event was emitted", async () =>{
                        expect(await LockingContract.connect(user1).withdrawLocked()).to.emit("TokensWithdrawn")
                    })
                    it("checks a rewards event was emitted", async () =>{
                        expect(await LockingContract.connect(user1).withdrawLocked()).to.emit("RewardsPaid")
                    })
                    it("checks the struct was deleted", async () =>{
                        await LockingContract.connect(user1).withdrawLocked()
                        struct = await LockingContract.lockedBalances(user1.address)
                        expect(struct.lockTime).to.equal(0)
                        expect(struct.amount).to.equal(0)
                    })

        // THIS IS WHERE IM STUCK - FIX HERE

                    it("checks the reward tokens were paid out for tier 1 6 months", async () =>{
                        
                        
                        rewardAmount = tier1mon6
                        
                        
                        await LockingContract.connect(user1).withdrawLocked()
                        expect(await USDT.balanceOf(user1.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier 1 365 days", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier1Cutoff) )

                        lockAmount = tokens(tier1Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        // await LockingContract.connect(user2).stake(lockAmount, 31556952)
                        await LockingContract.connect(user2).stake(lockAmount, locktime2)
                        
                        moveTime(6.312e+7)
   
                        rewardAmount = tier1mon12
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier 1 730 days", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier1Cutoff) )
                        lockAmount = tokens(tier1Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        await LockingContract.connect(user2).stake(lockAmount, locktime3)
                        
                        moveTime(6.312e+7)
   
                        rewardAmount = tier1mon24
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier2  6 months", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier2Cutoff) )
                        lockAmount = tokens(tier2Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        await LockingContract.connect(user2).stake(lockAmount, locktime1)

                        moveTime(6.312e+7)
   
                        rewardAmount = tier2mon6
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier2  12 months", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier2Cutoff) )
                        lockAmount = tokens(tier2Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        await LockingContract.connect(user2).stake(lockAmount, locktime2)

                        moveTime(6.312e+7)
   
                        rewardAmount = tier2mon12
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier2  24 months", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier2Cutoff) )
                        lockAmount = tokens(tier2Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        await LockingContract.connect(user2).stake(lockAmount, locktime3)

                        moveTime(6.312e+7)
   
                        rewardAmount = tier2mon24
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier3  6 months", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier3Cutoff) )
                        lockAmount = tokens(tier3Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        await LockingContract.connect(user2).stake(lockAmount, locktime1)

                        moveTime(6.312e+7)
   
                        rewardAmount = tier3mon6
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier3  12 months", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier3Cutoff) )
                        lockAmount = tokens(tier3Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        await LockingContract.connect(user2).stake(lockAmount, locktime2)

                        moveTime(6.312e+7)
   
                        rewardAmount = tier3mon12
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier3  24 months", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier3Cutoff) )
                        lockAmount = tokens(tier3Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        await LockingContract.connect(user2).stake(lockAmount, locktime3)

                        moveTime(6.312e+7)
   
                        rewardAmount = tier3mon24
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier4  6 months", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier4Cutoff) )
                        lockAmount = tokens(tier4Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        await LockingContract.connect(user2).stake(lockAmount, locktime1)

                        moveTime(6.312e+7)
   
                        rewardAmount = tier4mon6
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier4  12 months", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier4Cutoff) )
                        lockAmount = tokens(tier4Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        await LockingContract.connect(user2).stake(lockAmount, locktime2)

                        moveTime(6.312e+7)
   
                        rewardAmount = tier4mon12
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier4  24 months", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier4Cutoff) )
                        lockAmount = tokens(tier4Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        await LockingContract.connect(user2).stake(lockAmount, locktime3)

                        moveTime(6.312e+7)
   
                        rewardAmount = tier4mon24
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier5  6 months", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier5Cutoff) )
                        lockAmount = tokens(tier5Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        await LockingContract.connect(user2).stake(lockAmount, locktime1)

                        moveTime(6.312e+7)
   
                        rewardAmount = tier5mon6
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier5  12 months", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier5Cutoff) )
                        lockAmount = tokens(tier5Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        await LockingContract.connect(user2).stake(lockAmount, locktime2)

                        moveTime(6.312e+7)
   
                        rewardAmount = tier5mon12
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier5  24 months", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier5Cutoff) )
                        lockAmount = tokens(tier5Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        await LockingContract.connect(user2).stake(lockAmount, locktime3)

                        moveTime(6.312e+7)
   
                        rewardAmount = tier5mon24
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier6  6 months", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier6Cutoff) )
                        lockAmount = tokens(tier6Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        await LockingContract.connect(user2).stake(lockAmount, locktime1)

                        moveTime(6.312e+7)
   
                        rewardAmount = tier6mon6
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier6  12 months", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier6Cutoff) )
                        lockAmount = tokens(tier6Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        await LockingContract.connect(user2).stake(lockAmount, locktime2)

                        moveTime(6.312e+7)
   
                        rewardAmount = tier6mon12
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })
                    it("checks the reward tokens were paid out for tier6  24 months", async () =>{
                        await KPNToken.connect(deployer).transfer(user2.address, tokens(tier6Cutoff) )
                        lockAmount = tokens(tier6Cutoff)
                        await KPNToken.connect(user2).approve(LockingContract.target, lockAmount)
                        await LockingContract.connect(user2).stake(lockAmount, locktime3)

                        moveTime(6.312e+7)
   
                        rewardAmount = tier6mon24
                        
                        await LockingContract.connect(user2).withdrawLocked()
                        expect(await USDT.balanceOf(user2.address)).to.equal(rewardAmount)
                    })

                })
                describe("Withdraw Failure", async () =>{
                    it("checks the tokens withdraw failed due to time not met", async () =>{
                        await expect(LockingContract.connect(user1).withdrawLocked()).to.be.revertedWith("ERC20: Time Lock not complete")
                        
                    })
                })
            })
        })
        describe("Failure Locking", () =>{
            beforeEach(async () =>{
                await KPNToken.connect(deployer).transfer(user1.address, tokens(tier2Cutoff))
                await KPNToken.connect(user1).approve(LockingContract.target, tokens(tier2Cutoff))
                await LockingContract.connect(user1).stake(tokens(tier2Cutoff), locktime1)
            })
            it("checks the funds were not locked if sent under tier 1 cut off", async () =>{
                await KPNToken.connect(deployer).transfer(user2.address, tokens(200))
                await KPNToken.connect(user2).approve(LockingContract.target, tokens(200))
                await expect(LockingContract.connect(user2).stake(tokens(200), locktime1)).to.be.revertedWith("Locking ERC20: Please send minimum token amount")
                
            })
            it("checks withdraw failed before time", async () =>{
                await expect(LockingContract.connect(user1).withdrawLocked()).to.be.revertedWith("ERC20: Time Lock not complete")
            })
        })
    })
    describe("cancel stake", () =>{
        let tx, res, lockAmount, mintAmount, initialContractBal, struct
        beforeEach(async () =>{
            
            mintAmount = tokens(tier6Cutoff)
            
            initialContractBal = await KPNToken.balanceOf(LockingContract.target)
            
            
            tx = await KPNToken.connect(deployer).mint(mintAmount)
            res = await tx.wait()

            await KPNToken.approve(LockingContract.target, mintAmount)
            tx = await LockingContract.connect(deployer).stake(tokens(tier1Cutoff), locktime1)
        })
        describe("success", () =>{
            it("checks the stake balance was transfered to deployer", async () =>{
                expect(await KPNToken.balanceOf(LockingContract.target)).to.equal(tokens(tier1Cutoff))
                await LockingContract.connect(deployer).cancelStake()
                expect(await KPNToken.balanceOf(deployer)).to.equal(mintAmount +initialSupply)
            })
            it("checks the locked balance struct is deleted", async () =>{
                await LockingContract.connect(deployer).cancelStake()
                struct = await LockingContract.getStakedBalance(deployer.address)
                expect(struct.amount).to.equal(0)
            })
            it("checks the lock cancelled event was emitted", async () =>{
                expect(await LockingContract.connect(deployer).cancelStake()).to.emit("LockCancelled").withArgs(deployer.address, tokens(tier1Cutoff))
            })
            it("checks the contract balance is zero kpn tokens", async () =>{
                await LockingContract.connect(deployer).cancelStake()
                expect(await KPNToken.balanceOf(LockingContract.target)).to.equal(0)
            })
            
        })
        describe("Failure", () =>{
            beforeEach(async () =>{
                moveTime(locktime1)
            })
            it("should fail the canecl stake with reason 'stake duration completed'", async () =>{
                await expect(LockingContract.connect(deployer).cancelStake()).to.be.revertedWith("ERC20: Cannot Cancel Completed Stake")
            })
        })
    })
})