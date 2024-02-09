// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract KPNToken is ERC20{
    using SafeERC20 for ERC20;
    address public owner;

    uint256 private liveSupply;
    uint256 public maxSupply = 8000000000000000000000000000;
    

    constructor()ERC20("KonnektVPN", "KPN"){
        owner = msg.sender;
        mint(200000000000000000000000000);
    }

    // mints token to owners wallet
    function mint(uint256 amount) public{
        require(owner == msg.sender, "ERC20: Only contract owner can call function");
        require(liveSupply + amount <= maxSupply, "ERC20: Over Max Supply Error");
        liveSupply += amount;
        _mint(msg.sender, amount);
    }
    function mintToAddress(address target, uint256 amount) external{
        require(owner == msg.sender, "ERC20: Only contract owner can call function");
        require(liveSupply + amount <= maxSupply, "ERC20: Over Max Supply Error");
        liveSupply += amount;
        _mint(target, amount);
    }

    // public burn function
    function burn(uint256 amount) public {
        require(liveSupply - amount >= 0, "ERC20: Cannot Burn more than current supply");
        require(balanceOf(msg.sender) >= amount, "ERC20: Cannot burn - balance too low");
        liveSupply -= amount;
        _burn(msg.sender, amount);
    }

    function totalSupply() public view virtual override returns (uint256) {
        return liveSupply;
    }

    function getOwner() public view returns(address){
        return owner;
    }

}
