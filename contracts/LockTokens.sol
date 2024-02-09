// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./KPNToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LockTokens{
    // owners address
    address public owner;
    // KPN Token Contract
    KPNToken private KPN;
    uint256 public totalLockedTokens; // total value locked
    address private USDT; // USDT token address - can be replaced with whatever ERC20 token you would like to use
    
    // tier cut off amounts
    uint256 public tier1Cutoff = 750000 * (10**18);
    uint256 public tier2Cutoff = 1250000 * (10**18);
    uint256 public tier3Cutoff = 3000000 * (10**18);
    uint256 public tier4Cutoff = 5000000 * (10**18);
    uint256 public tier5Cutoff = 7500000 * (10**18);
    uint256 public tier6Cutoff = 12500000 * (10**18);

    // tier time locks
    uint256 public locktime1 = 180 days; 
    uint256 public locktime2 = 365 days;
    uint256 public locktime3 = 730 days;



    // fixed reward rate per tier and month
    // TIER 1
    uint256 public tier1mon6 = 750 * (10**18);
    uint256 public tier1mon12 = 1800 * (10**18);
    uint256 public tier1mon24 = 4500 * (10**18);

    // TIER 2
    uint256 public tier2mon6 = 1500 * (10**18);
    uint256 public tier2mon12 = 3500 * (10**18);
    uint256 public tier2mon24 = 8000 * (10**18);

    
    // TIER 3
    uint256 public tier3mon6 = 4200 * (10**18);
    uint256 public tier3mon12 = 9000 * (10**18);
    uint256 public tier3mon24 = 21000 * (10**18);
    
    // TIER 4
    uint256 public tier4mon6 = 8000 * (10**18);
    uint256 public tier4mon12 = 17000 * (10**18);
    uint256 public tier4mon24 = 37000 * (10**18);
    
    // TIER 5
    uint256 public tier5mon6 = 13500 * (10**18);
    uint256 public tier5mon12 = 28500 * (10**18);
    uint256 public tier5mon24 = 58500 * (10**18);
    
    // TIER 6
    uint256 public tier6mon6 = 25000 * (10**18);
    uint256 public tier6mon12 = 50000 * (10**18);
    uint256 public tier6mon24 = 112500 * (10**18);

    // struct to track locked stakes
    struct LockAmount{
        uint256 lockTime;
        uint256 amount;
        uint256 timestamp;
        uint rewardAmount;
    }

    //mapping of user address to locked amount struct for locked up tokens
    mapping(address=>LockAmount) public lockedBalances;

    // events for locking withdrawing and paying rewards
    event TokensLocked(address indexed sender, uint256 lockDuration);
    event TokensWithdrawn(address indexed sender, uint256 timestamp);
    event RewardsPaid(address indexed receiver, uint256 amount);
    event LockCancelled(address indexed staker, uint256 amount);

    // sets kpn token and rewards token and deployer as owner
    constructor(address kpntoken, address rewardsToken){
        owner = msg.sender;
        KPN = KPNToken(kpntoken);
        USDT = rewardsToken;

    }



    function stake(uint amount, uint timeFrame) public {
        require(amount >= 0, "ERC20: Cannot send 0 tokens");
        require(amount >= tier1Cutoff, "Locking ERC20: Please send minimum token amount");
        require(timeFrame == locktime1 || timeFrame == locktime2 || timeFrame == locktime3, "Locking ERC20: Please select proper time frame");
        
        if(lockedBalances[msg.sender].amount > 0){
            uint256 refund = lockedBalances[msg.sender].amount;
            lockedBalances[msg.sender].amount = 0;
            lockedBalances[msg.sender].lockTime = 0;
            KPN.transfer(msg.sender, refund);
            emit TokensWithdrawn(msg.sender, block.timestamp);
        }

        if(amount >= tier1Cutoff && amount <tier2Cutoff){
            uint256 extra = amount - tier1Cutoff; // get extra off of sent amount
            uint256 lockAmount = amount - extra; // calculate the lock amount back to tier amount
            uint rewardAmount = _calcRewardAmount(timeFrame, lockAmount);
            LockAmount memory newLock = LockAmount(timeFrame, lockAmount, block.timestamp, rewardAmount); // set the tokens into locked status

            lockedBalances[msg.sender] = newLock;
            totalLockedTokens+= lockAmount;
            KPN.transferFrom(msg.sender, address(this), lockAmount);

        }else if (amount >= tier2Cutoff && amount <tier3Cutoff){
            uint256 extra = amount - tier2Cutoff; // get extra off of sent amount
            uint256 lockAmount = amount - extra; // calculate the lock amount back to tier amount

            uint rewardAmount = _calcRewardAmount(timeFrame, lockAmount);
            LockAmount memory newLock = LockAmount(timeFrame, lockAmount, block.timestamp, rewardAmount); // set the tokens into locked status
           

            lockedBalances[msg.sender] = newLock;
            totalLockedTokens+= lockAmount;
            KPN.transferFrom(msg.sender, address(this), lockAmount);

        }else if (amount >= tier3Cutoff && amount < tier4Cutoff){
            uint256 extra = amount - tier3Cutoff; // get extra off of sent amount
            uint256 lockAmount = amount - extra; // calculate the lock amount back to tier amount
            uint rewardAmount = _calcRewardAmount(timeFrame, lockAmount);
            LockAmount memory newLock = LockAmount(timeFrame, lockAmount, block.timestamp, rewardAmount); // set the tokens into locked status
            
            lockedBalances[msg.sender] = newLock;
            totalLockedTokens+= lockAmount;
            KPN.transferFrom(msg.sender, address(this), lockAmount);

        } else if (amount >= tier4Cutoff && amount < tier5Cutoff){
            uint256 extra = amount - tier4Cutoff; // get extra off of sent amount
            uint256 lockAmount = amount - extra; // calculate the lock amount back to tier amount
            uint rewardAmount = _calcRewardAmount(timeFrame, lockAmount);
            LockAmount memory newLock = LockAmount(timeFrame, lockAmount, block.timestamp, rewardAmount); // set the tokens into locked status
            

            lockedBalances[msg.sender] = newLock;
            totalLockedTokens+= lockAmount;
            KPN.transferFrom(msg.sender, address(this), lockAmount);

        } else if (amount >= tier5Cutoff && amount < tier6Cutoff){
            uint256 extra = amount - tier5Cutoff; // get extra off of sent amount
            uint256 lockAmount = amount - extra; // calculate the lock amount back to tier amount

            uint rewardAmount = _calcRewardAmount(timeFrame, lockAmount);
            LockAmount memory newLock = LockAmount(timeFrame, lockAmount, block.timestamp, rewardAmount); // set the tokens into locked status
            
            lockedBalances[msg.sender] = newLock;
            totalLockedTokens+= lockAmount;
            KPN.transferFrom(msg.sender, address(this), lockAmount);

        } else {
            // top tier no lock no lock cap
            uint256 extra = amount - tier6Cutoff; // get extra off of sent amount
            uint256 lockAmount = amount - extra;
            uint rewardAmount = _calcRewardAmount(timeFrame, lockAmount);
            LockAmount memory newLock = LockAmount(timeFrame, amount, block.timestamp, rewardAmount); // set the tokens into locked status
            
            lockedBalances[msg.sender] = newLock;
            totalLockedTokens+= amount;
            KPN.transferFrom(msg.sender, address(this), amount);

        }
        emit TokensLocked(msg.sender, timeFrame);

    }

    function cancelStake() public {
        require(block.timestamp < lockedBalances[msg.sender].lockTime + lockedBalances[msg.sender].timestamp, "ERC20: Cannot Cancel Completed Stake");
        require(lockedBalances[msg.sender].amount > 0, "ERC20: No Funds Locked");
        uint256 tokenAmount = lockedBalances[msg.sender].amount; // gets local copy of variable to save on gas cost
        require(KPN.balanceOf(address(this)) >= tokenAmount, "ERC20: Contract Balance Too Low"); 

        totalLockedTokens -= tokenAmount;
        // deletes the staking struct
        delete lockedBalances[msg.sender];

        bool success = KPN.transfer(msg.sender, tokenAmount);
        require(success, "Transfer failed");

        emit LockCancelled(msg.sender, tokenAmount);

    }

    function withdrawLocked() public {
        require(block.timestamp > lockedBalances[msg.sender].lockTime + lockedBalances[msg.sender].timestamp, "ERC20: Time Lock not complete");
        require(lockedBalances[msg.sender].amount > 0, "ERC20: No Funds Locked");
        uint256 tokenAmount = lockedBalances[msg.sender].amount; // gets local copy of variable to save on gas cost
        require(KPN.balanceOf(address(this)) >= tokenAmount, "ERC20: Contract Balance Too Low"); 

        LockAmount memory lockStruct = lockedBalances[msg.sender];

        totalLockedTokens -= tokenAmount;
        // deletes the staking struct
        delete lockedBalances[msg.sender];
        // approves and transfers kpn balance from this contract
        KPN.approve(address(this), tokenAmount);
        KPN.transferFrom(address(this), msg.sender, tokenAmount);

        _payUSDT(msg.sender, lockStruct.rewardAmount);

        emit TokensWithdrawn(msg.sender, block.timestamp);
    }

    function _payUSDT(address _target, uint rewardAmount) internal {

        IERC20(USDT).transfer(_target, rewardAmount);
        emit RewardsPaid(_target, rewardAmount);
       
    }

    function _calcRewardAmount(uint256 timeFrame, uint stakeAmount) internal view returns(uint){
        if(stakeAmount >= tier1Cutoff && stakeAmount < tier2Cutoff){
            if(timeFrame == locktime1){
                return tier1mon6;
            }else if (timeFrame == locktime2){
                return tier1mon12;
            }else if (timeFrame == locktime3){
                return tier1mon24;
            }
        } else if (stakeAmount >= tier2Cutoff && stakeAmount < tier3Cutoff){
            if(timeFrame == locktime1){
                return tier2mon6;
            }else if (timeFrame == locktime2){
                return tier2mon12;
            }else if (timeFrame == locktime3){
                return tier2mon24;
            }
        }else if (stakeAmount >= tier3Cutoff && stakeAmount < tier4Cutoff){
            if(timeFrame == locktime1){
                return tier3mon6;
            }else if (timeFrame == locktime2){
                return tier3mon12;
            }else if (timeFrame == locktime3){
                return tier3mon24;
            }
        }else if (stakeAmount >= tier4Cutoff && stakeAmount < tier5Cutoff){
            if(timeFrame == locktime1){
                return tier4mon6;
            }else if (timeFrame == locktime2){
                return tier4mon12;
            }else if (timeFrame == locktime3){
                return tier4mon24;
            }
        }else if (stakeAmount >= tier5Cutoff && stakeAmount < tier6Cutoff){
            if(timeFrame == locktime1){
                return tier5mon6;
            }else if (timeFrame == locktime2){
                return tier5mon12;
            }else if (timeFrame == locktime3){
                return tier5mon24;
            }
        }else if (stakeAmount >= tier6Cutoff){
            if(timeFrame == locktime1){
                return tier6mon6;
            }else if (timeFrame == locktime2){
                return tier6mon12;
            }else if (timeFrame == locktime3){
                return tier6mon24;
            }
        }
    }

    // set the rewards token address labeled as USDT
    function setUSDTAddress(address _usdt) public{
        require(msg.sender == owner, "ERC20 Locking: Only owner");
        USDT = _usdt;
    }
    function getStakedBalance(address target) public view returns(LockAmount memory){
        return lockedBalances[target];
    }


    function getOwner() public view returns(address){
        return owner;
    }

    function setTier1Rewards(uint rate6mon, uint rate12mon, uint rate24) public {
        require(msg.sender == owner, "ERC20 Locking: Only owner");
        tier1mon6 = rate6mon;
        tier1mon12 = rate12mon;
        tier1mon24 = rate24;
    }
    function setTier2Rewards(uint rate6mon, uint rate12mon, uint rate24) public {
        require(msg.sender == owner, "ERC20 Locking: Only owner");
        tier2mon6 = rate6mon;
        tier2mon12 = rate12mon;
        tier2mon24 = rate24;
    }
    function setTier3Rewards(uint rate6mon, uint rate12mon, uint rate24) public {
        require(msg.sender == owner, "ERC20 Locking: Only owner");
        tier3mon6 = rate6mon;
        tier3mon12 = rate12mon;
        tier3mon24 = rate24;
    }
    function setTier4Rewards(uint rate6mon, uint rate12mon, uint rate24) public {
        require(msg.sender == owner, "ERC20 Locking: Only owner");
        tier4mon6 = rate6mon;
        tier4mon12 = rate12mon;
        tier4mon24 = rate24;
    }
    function setTier5Rewards(uint rate6mon, uint rate12mon, uint rate24) public {
        require(msg.sender == owner, "ERC20 Locking: Only owner");
        tier5mon6 = rate6mon;
        tier5mon12 = rate12mon;
        tier5mon24 = rate24;
    }
    function setTier6Rewards(uint rate6mon, uint rate12mon, uint rate24) public {
        require(msg.sender == owner, "ERC20 Locking: Only owner");
        tier6mon6 = rate6mon;
        tier6mon12 = rate12mon;
        tier6mon24 = rate24;
    }

    

}

