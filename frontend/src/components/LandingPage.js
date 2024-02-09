"use client"
import {ethers} from "ethers";
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
    const [currentStake, setCurrentStake] = useState(0)
    const [stakeDuration, setStakeDuration] = useState(0)
    const [stakeAmount, setStakeAmount] = useState(0)

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

    const mintToDeployer = async (mintAmount) =>{
        try {
            if(window.ethereum){
                const provider = new ethers.BrowserProvider(window.ethereum)

                const signer = await provider.getSigner()
                
                const KPNContract = fetchKPNTokenContract(signer)
                
                let tx = await KPNContract.mint(mintAmount)
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

    const mintToMiningContract = async (amount) =>{
        try {
            if(window.ethereum){
                const provider = new ethers.BrowserProvider(window.ethereum)
                
                const signer = await provider.getSigner()
                
                const KPNContract = fetchKPNTokenContract(signer)
               
                let tx = await KPNContract.mintToAddress(POLYGON_CLAIMING, amount)
                let res = await tx.wait()
                if(res.status === 1 ){
                    console.log("success")
                    console.log(await KPNContract.balanceOf(POLYGON_CLAIMING))
                }else {
                    console.log("failed")
                }

            }

        }catch(err){
            console.log(err)
        }
    }

    // before mining to one user, make sure the contract has enough tokens
    // if contract needs more tokens, call mintToMiningContract 
    // mining contract and claim contract are the same contract, different name
    const sendToOneUserFromMining = async (address, amount) =>{
        try {
            if(window.ethereum){
                const provider = new ethers.BrowserProvider(window.ethereum)
                const signer = await provider.getSigner()
                const Claimtokens = fetchClaimTokens(signer)

                let tx = await Claimtokens.claimToken(address, amount)
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
        // then store in array to pass into sendToBulkAddresses
    }


    const sendToBulkAddresses = async (addressStructs) =>{
        try {
            if(window.ethereum){
                const provider = new ethers.BrowserProvider(window.ethereum)

                const signer = await provider.getSigner()
                const Claimtokens = fetchClaimTokens(signer)

                

                let tx = await Claimtokens.bulkSend(addressStructs)
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

    const stakeTokens = async () =>{
        try {
            if(window.ethereum){
                const provider = new ethers.BrowserProvider(window.ethereum)

                const signer = await provider.getSigner()
                const lockingcontract = fetchLockTokens(signer)

                const kpn = fetchKPNTokenContract(signer)

                const etherAmount = ethers.parseEther(stakeAmount)
                

                const apprTx = await kpn.approve(lockingcontract.target, etherAmount)
                const appRes = await apprTx.wait()

                const tx = await lockingcontract.stake(etherAmount, stakeDuration)
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

    const withdrawStake = async () =>{
        try {
            if(window.ethereum){
                const provider = new ethers.BrowserProvider(window.ethereum)

                const signer = await provider.getSigner()
                const lockingcontract = fetchLockTokens(signer)

                const tx = await lockingcontract.withdrawLocked()
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
        <h1>Hello World</h1>
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
        <input type="number"  onChange={e=>setMintAmount(e.target.value)} />
        <input type="text" onChange={e=>setTargetAddress(e.target.value)} />
        <button onClick={e=>sendToOneUserFromMining(targetAddress, mintAmount)} >Send To One User From Mining Contract</button>
        <br></br>
        <input type="file" accept=".csv" onChange={handleFileInput} />
        <input type="text" onChange={e=>setTargetAddress(e.target.value)} />
        <button onClick={e=>sendToBulkAddresses(targetArray)} >Mint To target addresses Array</button>
        <br></br>

        <div>
            <h2>Staking</h2>
            <label name="six-months">6 Months</label>
            <input name="six-months" type="checkbox" value={180 * 24 * 60 * 60} onClick={e=>setStakeDuration(15552000)}/>
            <br />
            <label name="six-months">12 Months</label>
            <input name="twelve-months" type="checkbox" value={365 * 24 * 60 * 60} onClick={e=>setStakeDuration(31536000)}/>
            <br />
            <label name="six-months">24 Months</label>
            <input name="twentyfour-months" type="checkbox" value={730 * 24 * 60 * 60} onClick={e=>setStakeDuration(63072000)}/>
            <br />
            <label name="stake-amount">Stake amount</label>
            <input name="stake-amount" type="text" onChange={e=>setStakeAmount(e.target.value)}/>
            <button onClick={stakeTokens} >Stake Tokens</button>
            <br />
            <button onClick={withdrawStake} >Withdraw Stake</button>
        </div>
    </div>
  )
}

export default LandingPage