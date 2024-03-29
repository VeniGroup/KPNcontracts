"use client"
import {ethers} from "ethers";
import { parseUnits } from 'ethers';
import { useEffect, useState } from 'react'
import {POLYGON_KPN, POLYGON_LOCKING, POLYGON_CLAIMING} from "../utils/addresses/address"
import KPNtokenJson from "../utils/abi/KPNToken.json"
import ClaimTokenJson from "../utils/abi/ClaimTokens.json"
import LockTokenJson from "../utils/abi/LockingContract.json"

const fetchLockTokens = (signerOrProvider) =>{
    return new ethers.Contract(POLYGON_LOCKING, LockTokenJson.abi, signerOrProvider)
}

const fetchKPNTokenContract = (signerOrProvider) =>{
    return new ethers.Contract(POLYGON_KPN, KPNtokenJson.abi, signerOrProvider)
}
const fetchClaimTokens = (signerOrProvider) =>{
    return new ethers.Contract(POLYGON_CLAIMING, ClaimTokenJson.abi, signerOrProvider)
}
const LandingPage = () => {
    const [currentAccount, setCurrentAccount] = useState(null)
    const [mintAmount, setMintAmount] = useState(0)
    const [targetAddress, setTargetAddress] = useState("")
    const [targetArray, setTargetArray] = useState([])
    const [maxCount, setMaxCount] = useState(0)
    const [currentStake, setCurrentStake] = useState(0)
    const [stakeDuration, setStakeDuration] = useState(0)
    const [stakeAmount, setStakeAmount] = useState(0)
    const [whitelistAddresses, setWhitelistAddresses] = useState([]);
    const [whitelistAmounts, setWhitelistAmounts] = useState([]);
    const [maxBulkSendCount, setMaxBulkSendCount] = useState(0);


    const checkIfWalletIsConnected = async () =>{
        try{
            if(!window.ethereum){
                alert("please install metamask extension")
            }
            
            const accounts = await window.ethereum.request({method: "eth_accounts"})
            if(accounts.length >0){
                const active = accounts[0]

                setCurrentAccount(active) // useState hook to store active accout
                fetchCurrentStakingState(active)

            }

        }catch (err){
            console.log(err)
        }
    }

    const connectToWallet = async () =>{
        try{
            if(!window.ethereum){
                alert("please install metamask extension")
                
            }

            const accounts = await window.ethereum.request({method: "eth_requestAccounts"})
            if(accounts.length >0){
                const current = accounts[0]
                setCurrentAccount(current)
            }
        }catch(err){
            console.log(err)
        }
    }

    const mintToDeployer = async (mintAmount) => {
        try {
            if (window.ethereum) {
                // Keeping the use of BrowserProvider as per your setup
                const provider = new ethers.BrowserProvider(window.ethereum);
    
                const signer = await provider.getSigner();
    
                const KPNContract = fetchKPNTokenContract(signer);
                // console.log("KPN Contract Address:", KPNContract.target)
    
                // Convert mintAmount to 18 decimal places
                // Assuming ethers is imported and available in the scope
                const amountInWei = parseUnits(mintAmount.toString(), 18);
    
                let tx = await KPNContract.mint(amountInWei);
                let res = await tx.wait();
                if (res.status === 1) {
                    console.log("success");
                    console.log(await KPNContract.balanceOf(currentAccount)); // Assuming currentAccount is the user's address
                } else {
                    console.log("failed");
                }
            }
        } catch (err) {
            console.error(err);
        }
    };    

    const burnFromDeployer = async (burnAmount) =>{
        try {
            if(window.ethereum){
                const provider = new ethers.BrowserProvider(window.ethereum)

                const signer = await provider.getSigner()
                
                const KPNContract = fetchKPNTokenContract(signer)
                
                let tx = await KPNContract.burn(burnAmount)
                let res = await tx.wait()
                if(res.status === 1 ){
                    console.log("success")
                    console.log(await KPNContract.balanceOf(currentAccount))
                }else {
                    console.log("failed")
                }

            }

        }catch(err){
            console.log(err)
        }
    }
    
    const mintToMiningContract = async (amount) => {
        try {
            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const KPNContract = fetchKPNTokenContract(signer);
    
                // Convert amount to wei for correct blockchain transaction format
                const formattedAmount = parseUnits(amount.toString(), 18);
    
                let tx = await KPNContract.mintToAddress(POLYGON_CLAIMING, formattedAmount);
                let res = await tx.wait();
                if (res.status === 1) {
                    console.log("success");
                    console.log(await KPNContract.balanceOf(POLYGON_CLAIMING)); // Log the balance of the mining contract
                } else {
                    console.log("failed");
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    //Self Claim Tokens
    const claimTokens = async () => {
        try {
            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const claimTokensContract = fetchClaimTokens(signer);
    
                console.log("ClaimTokens Contract Address:", claimTokensContract.target);
    
                const claimTx = await claimTokensContract.claimTokens();
                const claimRes = await claimTx.wait();
    
                if (claimRes.status === 1) {
                    console.log("Tokens claimed successfully.");
                } else {
                    console.log("Failed to claim tokens.");
                }
            }
        } catch (err) {
            console.log("Error claiming tokens:", err);
        }
    };

    // before mining to one user, make sure the contract has enough tokens
    // if contract needs more tokens, call mintToMiningContract 
    // mining contract and claim contract are the same contract, different name
    const sendToOneUserFromMining = async (address, amount) =>{
        try {
            if(window.ethereum){
                const provider = new ethers.BrowserProvider(window.ethereum)
                const signer = await provider.getSigner()
                const Claimtokens = fetchClaimTokens(signer)

                let tx = await Claimtokens.claimTokens()
                let res = await tx.wait()
                if(res.status === 1 ){
                    console.log("success")
                }else {
                    console.log("failed")
                }

            }

        }catch(err){
            console.log(err)
        }
    }




    const handleFileInput = async (e) =>{
        const file = e.target.files[0]
        const reader = new FileReader()
        let csvData
        reader.onload = (e) => {
            csvData = e.target.result; // This will contain the contents of the CSV file
            console.log(csvData)

        };
        reader.readAsText(file);
        // complete mapping of data to js object in this format
            // addressStructs need to be in this format
            /*
                [
                    {
                        target: receiversAddress,
                        amount: amount of tokens to send,
                    },
                ]

            */
        // then store in array to pass into bulkAddToWhiteList
    }


    const bulkSend = async (maxCount) => {
        try {
            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const claimTokensContract = fetchClaimTokens(signer);

                console.log("ClaimTokens Contract Address:", claimTokensContract.target);

                const bulkSendTx = await claimTokensContract.bulkSend(maxCount);
                const bulkSendRes = await bulkSendTx.wait();

                if (bulkSendRes.status === 1) {
                    console.log("Bulk send successful.");
                } else {
                    console.log("Failed to execute bulk send.");
                }
            }
        } catch (err) {
            console.log("Error in bulk send:", err);
        }
    };

    //Whitelist section
    const addToWhitelist = async (newTarget, claimAmount) => {
        try {
            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const claimTokensContract = fetchClaimTokens(signer);
    
                const formattedClaimAmount = parseUnits(claimAmount.toString(), 18);
    
                const addToWhitelistTx = await claimTokensContract.addToWhitelist(newTarget, formattedClaimAmount);
                const addToWhitelistRes = await addToWhitelistTx.wait();
    
                if (addToWhitelistRes.status === 1) {
                    console.log("Address added to whitelist successfully.");
                } else {
                    console.log("Failed to add address to whitelist.");
                }
            }
        } catch (err) {
            console.log("Error adding to whitelist:", err);
        }
    };
    
    const bulkAddToWhitelist = async (targets, amounts) => {
        try {
            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const claimTokensContract = fetchClaimTokens(signer);
    
                const formattedAmounts = amounts.map(amount => parseUnits(amount.toString(), 18));
    
                const bulkAddTx = await claimTokensContract.bulkAddToWhitelist(targets, formattedAmounts);
                const bulkAddRes = await bulkAddTx.wait();
    
                if (bulkAddRes.status === 1) {
                    console.log("Bulk add to whitelist successful.");
                } else {
                    console.log("Failed to execute bulk add to whitelist.");
                }
            }
        } catch (err) {
            console.log("Error in bulk adding to whitelist:", err);
        }
    };
    


    // STAKING FUNCTIONS
    // fetch current users stake
    const fetchCurrentStakingState = async (account) =>{
        
        try {
            if(window.ethereum){
                const provider = new ethers.BrowserProvider(window.ethereum)

                const lockingcontract = fetchLockTokens(provider)
                const kpn = fetchKPNTokenContract(provider)
                
                
                const usersStake = await lockingcontract.getStakedBalance(account)
                console.log(usersStake)
                setCurrentStake(usersStake)
                
                const usersBalance = await kpn.balanceOf(account)
                console.log(usersBalance)
                    


            }

        }catch(err){
            console.log(err)
        }
    }

    const stakeTokens = async (stakeAmount, stakeDuration) => {
        try {
            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const lockingContract = fetchLockTokens(signer);
                console.log("Locking Contract Address:", lockingContract.target);
                const KPNContract = fetchKPNTokenContract(signer);
                console.log("KPN Contract Address:", KPNContract.target)
    
                // Ensure stakeAmount is converted to wei for correct blockchain transaction format
                const formattedStakeAmount = parseUnits(stakeAmount.toString(), 18);
    
                // Assuming stakeDuration is already in the correct format (seconds) and doesn't need conversion
                // First, approve the locking contract to spend the tokens on behalf of the user
                console.log("Approving tokens for staking...");
                const approveTx = await KPNContract.approve(lockingContract.target, formattedStakeAmount);
                await approveTx.wait();
                console.log("Approval successful.");
    
                // Then, stake the tokens with the specified duration
                console.log("Staking tokens...");
                const stakeTx = await lockingContract.stake(formattedStakeAmount, Number(stakeDuration));
                const stakeRes = await stakeTx.wait();
    
                if (stakeRes.status === 1) {
                    console.log("Tokens staked successfully.");
                } else {
                    console.log("Failed to stake tokens.");
                }
            }
        } catch (err) {
            console.log("Error staking tokens:", err);
        }
    };
           

    const withdrawStake = async () => {
        try {
            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const lockingContract = fetchLockTokens(signer);
    
                console.log("Locking Contract Address:", lockingContract.target);
    
                const withdrawTx = await lockingContract.withdrawLocked();
                const withdrawRes = await withdrawTx.wait();
    
                if (withdrawRes.status === 1) {
                    console.log("Stake withdrawn successfully.");
                } else {
                    console.log("Failed to withdraw stake.");
                }
            }
        } catch (err) {
            console.log("Error withdrawing stake:", err);
        }
    };
    
    const setTier1Apr = async (newRate) =>{
        try {
            if(window.ethereum){
                const provider = new ethers.BrowserProvider(window.ethereum)

                const signer = await provider.getSigner()
                const lockingcontract = fetchLockTokens(signer)

                const tx = await lockingcontract.setTier1RewardRate(newRate)
                const res = await tx.wait()

                if(res.status===1){
                    console.log("success")
                }else {
                    console.log("failed")
                }



            }

        }catch(err){
            console.log(err)
        }
    }
    const setTier2Apr = async (newRate) =>{
        try {
            if(window.ethereum){
                const provider = new ethers.BrowserProvider(window.ethereum)

                const signer = await provider.getSigner()
                const lockingcontract = fetchLockTokens(signer)

                const tx = await lockingcontract.setTier2RewardRate(newRate)
                const res = await tx.wait()

                if(res.status===1){
                    console.log("success")
                }else {
                    console.log("failed")
                }



            }

        }catch(err){
            console.log(err)
        }
    }
    const setTier3Apr = async (newRate) =>{
        try {
            if(window.ethereum){
                const provider = new ethers.BrowserProvider(window.ethereum)

                const signer = await provider.getSigner()
                const lockingcontract = fetchLockTokens(signer)

                const tx = await lockingcontract.setTier3RewardRate(newRate)
                const res = await tx.wait()

                if(res.status===1){
                    console.log("success")
                }else {
                    console.log("failed")
                }



            }

        }catch(err){
            console.log(err)
        }
    }

    useEffect(()=>{
        checkIfWalletIsConnected()
        
    }, [])
    


  return (
    <div>
        <h1>KPN Dashboard</h1>
        {/* connect to metamask wallet */}
        {currentAccount ? <p>{currentAccount}</p> :  <button onClick={connectToWallet}>Connect To Wallet</button>}

        <h2>Admin Dash Test</h2>
        {/* mint to deployer wallet */}
        <input type="number"  onChange={e=>setMintAmount(e.target.value)} />
        <button onClick={e=>mintToDeployer(mintAmount)} >Mint To Deployer</button>
        <br></br>
        <input type="number"  onChange={e=>setMintAmount(e.target.value)} />
        <button onClick={e=>mintToMiningContract(mintAmount)} >Mint To Mining Contract</button>
        <br></br>
        <section>
            <h2>Claim Tokens and Rewards for Users</h2>
            <input type="number" placeholder="Max Bulk Send Count" onChange={e => setMaxBulkSendCount(e.target.value)} />
            <button onClick={() => bulkSend(maxBulkSendCount)}>Bulk Send</button>
        </section>

        <section>
            <h2>Whitelist Management</h2>
            <div>
                <h3>Add Single Address to Whitelist</h3>
                <input type="text" placeholder="Target Address" onChange={e => setTargetAddress(e.target.value)} />
                <input type="number" placeholder="Amount" onChange={e => setMintAmount(e.target.value)} />
                <button onClick={() => addToWhitelist(targetAddress, mintAmount)}>Add to Whitelist</button>
            </div>

            <div>
                <h3>Bulk Add To Whitelist</h3>
                <input type="file" accept=".csv" onChange={handleFileInput} />
                <button onClick={() => bulkAddToWhitelist(whitelistAddresses, whitelistAmounts)}>Import and Add to Whitelist</button>
            </div>
        </section>

        <section>
            <h2>Claim Tokens</h2>
            <button onClick={claimTokens}>Claim Tokens</button>
        </section>
        
        <br></br>

        <section>
            <h2>Staking</h2>
            <label>
                <input type="radio" name="duration" value="15552000" onChange={e => setStakeDuration(e.target.value)} /> 6 Months
            </label>
            <br />
            <label>
                <input type="radio" name="duration" value="31536000" onChange={e => setStakeDuration(e.target.value)} /> 12 Months
            </label>
            <br />
            <label>
                <input type="radio" name="duration" value="63072000" onChange={e => setStakeDuration(e.target.value)} /> 24 Months
            </label>
            <br />
            <br></br>
            <label>
                Stake amount:
                <input name="stake-amount" type="text" onChange={e => setStakeAmount(e.target.value)} />
            </label>
            <button onClick={() => stakeTokens(stakeAmount.toString(), stakeDuration.toString())}>Stake Tokens</button>
            <br />
            <br></br>
            <button onClick={withdrawStake}>Withdraw Stake</button>
        </section>

    </div>
  )
}

export default LandingPage