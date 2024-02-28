// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IMultiSigWallet {
    function getOwners() external view returns (address[] memory);
}

contract ClaimTokens is AccessControl {
    using SafeERC20 for IERC20;
    IERC20 private KPNToken;
    IMultiSigWallet public immutable multiSigWallet;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant WHITELIST_MANAGER_ROLE = keccak256("WHITELIST_MANAGER_ROLE");

    mapping(address => uint256) public claimableTokens;
    mapping(address => bool) public isWhitelisted;
    address[] public whitelistedAddresses;
    address[] private adminAddresses; // Track addresses with ADMIN_ROLE
    address[] private whitelistManagerAddresses; // Track addresses with WHITELIST_MANAGER_ROLE

    uint256 public lastProcessedIndex;

    event TokenClaimed(address indexed claimer, uint256 amount);
    event BulkTokenClaimProcessed(uint256 totalProcessed, uint256 timestamp);

    constructor(address kpnToken, address multiSigWalletAddress) {
        require(kpnToken != address(0) && multiSigWalletAddress != address(0), "Address zero not allowed!");
        KPNToken = IERC20(kpnToken);
        multiSigWallet = IMultiSigWallet(multiSigWalletAddress);

        lastProcessedIndex = 0;

        address[] memory owners = multiSigWallet.getOwners();
        require(owners.length >= 3, "MultiSig wallet must have at least three owners");

        _grantRole(DEFAULT_ADMIN_ROLE, multiSigWalletAddress); // Assigns the multiSigWalletAddress the default admin role
        _grantRole(ADMIN_ROLE, multiSigWalletAddress);
        _grantRole(ADMIN_ROLE, owners[0]);
        _setRoleAdmin(WHITELIST_MANAGER_ROLE, ADMIN_ROLE); // Sets ADMIN_ROLE as the admin for WHITELIST_MANAGER_ROLE

        adminAddresses.push(multiSigWalletAddress); // Initialize adminAddresses with the multiSigWalletAddress address
        adminAddresses.push(owners[0]);

        whitelistManagerAddresses.push(multiSigWalletAddress);
        whitelistManagerAddresses.push(owners[0]);
    }

    function addToWhitelist(address newTarget, uint256 claimAmount) public onlyRole(WHITELIST_MANAGER_ROLE) {
        require(newTarget != address(0), "Cannot add zero address");
        require(!isWhitelisted[newTarget], "Already whitelisted");
        if (claimableTokens[newTarget] == 0) {
            whitelistedAddresses.push(newTarget);
            isWhitelisted[newTarget] = true;
        }
        claimableTokens[newTarget] = claimAmount;
    }

    function claimTokens(address target, uint256 amount) public onlyRole(ADMIN_ROLE){
        require(target  != address(0), "Zero address not allowed");
        require(amount > 0, "Must send a positive value");
        require(KPNToken.balanceOf(address(this)) >= amount, "Not enough tokens in contract to make this claim");
        KPNToken.safeTransfer(target, amount);
        emit TokenClaimed(target, amount);
    }

    function claimTokens() public {
        uint256 amount = claimableTokens[msg.sender];
        require(amount > 0, "No tokens to claim");
        claimableTokens[msg.sender] = 0; // Prevent Reentrancy
        KPNToken.safeTransfer(msg.sender, amount);
        emit TokenClaimed(msg.sender, amount);
    }

    function claimTokensBulk(address[] memory targets, uint256[] memory amounts) public onlyRole(ADMIN_ROLE) {
        require(targets.length == amounts.length, "Targets and amounts length mismatch");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }

        require(KPNToken.balanceOf(address(this)) >= totalAmount, "Not enough tokens in contract to cover all claims");

        for (uint256 i = 0; i < targets.length; i++) {
            address target = targets[i];
            uint256 amount = amounts[i];

            require(target != address(0), "Zero address not allowed");
            require(amount > 0, "Must send a positive value");

            KPNToken.safeTransfer(target, amount);
            emit TokenClaimed(target, amount);
        }
    }

    function bulkSend(uint256 maxCount) public onlyRole(ADMIN_ROLE) {
        uint256 count = 0;
        uint256 totalProcessed = 0;
        while (count < maxCount && lastProcessedIndex < whitelistedAddresses.length) {
            address userAddress = whitelistedAddresses[lastProcessedIndex];
            uint256 amount = claimableTokens[userAddress];
            if (amount > 0) {
                claimableTokens[userAddress] = 0;
                KPNToken.safeTransfer(userAddress, amount);
                emit TokenClaimed(userAddress, amount);
                totalProcessed += amount;
            }
            lastProcessedIndex++;
            count++;
        }
        emit BulkTokenClaimProcessed(totalProcessed, block.timestamp);
    }

    function bulkAddToWhitelist(address[] memory targets, uint256[] memory amounts) public onlyRole(WHITELIST_MANAGER_ROLE) {
        require(targets.length == amounts.length, "Targets and amounts length mismatch");
        for (uint i = 0; i < targets.length; i++) {
            addToWhitelist(targets[i], amounts[i]);
        }
    }

    function updateClaimAmount(address target, uint256 newAmount) public onlyRole(WHITELIST_MANAGER_ROLE) {
        require(target != address(0), "Cannot use zero address");
        claimableTokens[target] = newAmount;
    }

    function getWhitelist() public view returns (address[] memory) {
        return whitelistedAddresses;
    }

    function getTotalTokensToClaim() public view returns (uint256 totalClaimable) {
        for (uint i = 0; i < whitelistedAddresses.length; i++) {
            totalClaimable += claimableTokens[whitelistedAddresses[i]];
        }
        return totalClaimable;
    }

    // Override grantRole and revokeRole to track role membership
    function grantRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
        super.grantRole(role, account);
        if (role == ADMIN_ROLE && !_isInArray(account, adminAddresses)) {
            adminAddresses.push(account);
            whitelistManagerAddresses.push(account);
        } else if (role == WHITELIST_MANAGER_ROLE && !_isInArray(account, whitelistManagerAddresses)) {
            whitelistManagerAddresses.push(account);
        }
    }

    function revokeRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
        super.revokeRole(role, account);
        if (role == ADMIN_ROLE) {
            _removeFromArray(account, adminAddresses);
            _removeFromArray(account, whitelistManagerAddresses);
        } else if (role == WHITELIST_MANAGER_ROLE) {
            _removeFromArray(account, whitelistManagerAddresses);
        }
    }

    function getAdminAddresses() public view returns (address[] memory) {
        return adminAddresses;
    }

    function getWhitelistManagerAddresses() public view returns (address[] memory) {
        return whitelistManagerAddresses;
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
