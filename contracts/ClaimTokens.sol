// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
contract ClaimTokens{
    address public owner;
    IERC20 private KPNToken;
    
    struct WhiteList{
        address target;
        uint256 amount;
    }
    WhiteList[] public whiteList;

    constructor(address kpnToken){
        owner = msg.sender;
        KPNToken = IERC20(kpnToken);
    }

    event TokenClaimed(address indexed claimer, uint256 amount);

    event BulkTokenClaim(uint256 totalSent, uint256 timestamp);

    function addToWhiteList(address newTarget, uint256 claimAmount) public{
        require(owner == msg.sender, "Claiming ERC20: Only contract owner can call function");
        WhiteList memory newWhitelist = WhiteList(newTarget, claimAmount);
        whiteList.push(newWhitelist);
    }

    function claimTokens() public{
        require(owner == msg.sender, "Claiming ERC20: Only contract owner can call function");
        require(whiteList.length > 0, "Claiming ERC20: No addresses on whitelist");

        uint256 totalSendAmount = _calculateTotalClaim();

        require(KPNToken.balanceOf(address(this)) >= totalSendAmount, "Claiming ERC20: Contract Balance Too Low");

        for(uint i = 0; i < whiteList.length; i++){
            uint256 sendAmount = whiteList[i].amount;
            address target = whiteList[i].target;
            whiteList[i].amount = 0;
            KPNToken.transfer(target, sendAmount);
        }

        emit BulkTokenClaim(totalSendAmount, block.timestamp);

    }

    function claimToken(address target, uint256 amount) public{
        require(owner == msg.sender, "Claiming ERC20: Only contract owner can call function");
        require(KPNToken.balanceOf(address(this)) >= amount, "Claiming ERC20: Contract Balance Too Low");

        KPNToken.transfer(target, amount);

        emit TokenClaimed(target, amount);
    }
    


    function _calculateTotalClaim() internal view returns(uint256) {
        uint256 totalSend;
        for(uint i = 0; i < whiteList.length; i++){
            totalSend += whiteList[i].amount;
        }
        return totalSend;
    }

    function getTotalTokensToClaim() public view returns(uint256){
        return _calculateTotalClaim();
    }

    function getWhitelist() public view returns(WhiteList[] memory){
        return whiteList;
    }

    function bulkSend(WhiteList[] memory addressList) public {
        require(owner == msg.sender, "Claiming ERC20: Only contract owner can call function");
        for(uint i = 0; i < addressList.length; i++){
            KPNToken.transfer(addressList[i].target, addressList[i].amount);
        }
    }

    function getOwner() public view returns(address){
        return owner;
    }

}
