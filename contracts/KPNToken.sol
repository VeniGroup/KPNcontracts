// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IMultiSigWallet {
    function getOwners() external view returns (address[] memory);
}

contract KPNToken is ERC20, AccessControl{
    using SafeERC20 for ERC20;
    IMultiSigWallet public immutable multiSigWallet;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    address[] private adminAddresses; // Track addresses with ADMIN_ROLE

    uint256 private liveSupply;
    uint256 public constant maxSupply = 3 * (1e9) /* 3 Billion*/ * (1e18) /* Decimals = 18 */;
    

    constructor(address multiSigWalletAddress)ERC20("KonnektVPN", "KPN"){
        require(multiSigWalletAddress != address(0), "Address zero not allowed!");
        multiSigWallet = IMultiSigWallet(multiSigWalletAddress);
        address[] memory owners = multiSigWallet.getOwners();
        require(owners.length >= 3, "MultiSig wallet must have at least three owners");

        _grantRole(DEFAULT_ADMIN_ROLE, multiSigWalletAddress); // Assigns the multiSigWalletAddress the default admin role
        _grantRole(ADMIN_ROLE, multiSigWalletAddress);
        _grantRole(ADMIN_ROLE, owners[0]);
    

        adminAddresses.push(multiSigWalletAddress); // Initialize adminAddresses with the multiSigWalletAddress address
        adminAddresses.push(owners[0]);
    }

    // mints token to owners wallet
    function mint(uint256 amount) public onlyRole(ADMIN_ROLE){
        require(liveSupply + amount <= maxSupply, "ERC20: Over Max Supply Error");
        liveSupply += amount;
        _mint(msg.sender, amount);
    }
    function mintToMiners(address target, uint256 amount) external onlyRole(ADMIN_ROLE){
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

    // Override grantRole and revokeRole to track role membership
    function grantRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
        super.grantRole(role, account);
        if (role == ADMIN_ROLE && !_isInArray(account, adminAddresses)) {
            adminAddresses.push(account);
        } else {
            revert("Role not found!");
        }
    }

    function revokeRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
        super.revokeRole(role, account);
        if (role == ADMIN_ROLE) {
            _removeFromArray(account, adminAddresses);
        } else {
            revert("Role not found!");
        }
    }

    function getAdminAddresses() public view returns (address[] memory) {
        return adminAddresses;
    }

    // Helper function to check if an address is in an array
    function _isInArray(address account, address[] storage array) private view returns (bool) {
        for (uint i = 0; i < array.length; i++) {
            if (array[i] == account) {
                return true;
            }
        }
        return false;
    }

    // Helper function to remove an address from an array
    function _removeFromArray(address account, address[] storage array) private {
        for (uint i = 0; i < array.length; i++) {
            if (array[i] == account) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }

}
