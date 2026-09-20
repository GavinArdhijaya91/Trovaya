// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ITrovayaIPNFT} from "./interfaces/ITrovayaIPNFT.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ITrovayaFamily.sol";

/**
 * @title TrovayaFamily
 * @notice Mengelola pembelian lisensi secara kolektif (urunan) untuk 3-5 orang.
 * @dev Kontrak ini bertindak sebagai proxy buyer untuk meminimalisir perubahan pada TrovayaIPNFT.
 */
contract TrovayaFamily is ReentrancyGuard, ITrovayaFamily {
    using SafeERC20 for IERC20;

    struct FamilyGroup {
        address[] members;
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 tokenId;
        bool isPurchased;
        address creator;
    }

    ITrovayaIPNFT public immutable ipNft;
    uint256 public groupCount;
    
    mapping(uint256 => FamilyGroup) public groups;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => mapping(address => uint256)) public tokenContributions;

    event GroupCreated(uint256 indexed groupId, address indexed creator, uint256 tokenId, uint256 targetAmount);
    event Contributed(uint256 indexed groupId, address indexed member, uint256 amount);
    event LicensePurchased(uint256 indexed groupId, uint256 tokenId);
    event RefundClaimed(uint256 indexed groupId, address indexed member, uint256 amount);

    error GroupFull();
    error NotAMember();
    error AlreadyContributed();
    error LicenseAlreadyPurchased();
    error InsufficientFunds();
    error InvalidAmount();

    constructor(address _ipNft) {
        ipNft = ITrovayaIPNFT(_ipNft);
    }

    /**
     * @notice Membuat grup urunan untuk membeli lisensi karya tertentu.
     * @param _members Daftar alamat anggota grup (maks 5 orang).
     * @param _tokenId ID karya yang ingin dibeli.
     * @param _targetAmount Harga lisensi yang harus dikumpulkan.
     */
    function createFamily(address[] calldata members, uint256 tokenId, uint256 targetAmount) external returns (uint256 groupId) {
        if (members.length < 3 || members.length > 5) revert("Members must be 3-5");
        
        groupCount++;
        groups[groupCount] = FamilyGroup({
            members: members,
            targetAmount: targetAmount,
            currentAmount: 0,
            tokenId: tokenId,
            isPurchased: false,
            creator: msg.sender
        });

        emit GroupCreated(groupCount, msg.sender, tokenId, targetAmount);
        return groupCount;
    }

    /**
     * @notice Menyetorkan dana untuk urunan lisensi.
     */
    function contribute(uint256 _groupId) external payable nonReentrant {
        _processContribution(_groupId, msg.value, address(0));
    }

    function contributeWithToken(address token, uint256 _groupId, uint256 amount) external nonReentrant {
        if (token == address(0)) revert("Invalid token");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        _processContribution(_groupId, amount, token);
    }

    function _processContribution(uint256 _groupId, uint256 amount, address token) internal {
        FamilyGroup storage group = groups[_groupId];
        if (group.creator == address(0)) revert("Group does not exist");
        if (group.isPurchased) revert LicenseAlreadyPurchased();
        
        if (token == address(0)) {
            if (contributions[_groupId][msg.sender] > 0) revert AlreadyContributed();
            if (amount == 0) revert InvalidAmount();
            contributions[_groupId][msg.sender] = amount;
        } else {
            if (tokenContributions[_groupId][msg.sender] > 0) revert AlreadyContributed();
            if (amount == 0) revert InvalidAmount();
            tokenContributions[_groupId][msg.sender] = amount;
        }

        bool isMember = false;
        for (uint i = 0; i < group.members.length; i++) {
            if (group.members[i] == msg.sender) {
                isMember = true;
                break;
            }
        }
        if (!isMember) revert NotAMember();

        group.currentAmount += amount;
        emit Contributed(_groupId, msg.sender, amount);

        if (group.currentAmount >= group.targetAmount) {
            _executePurchase(_groupId, token);
        }
    }

    function _executePurchase(uint256 _groupId, address token) internal {
        FamilyGroup storage group = groups[_groupId];
        
        uint256 excess = group.currentAmount - group.targetAmount;
        group.currentAmount = group.targetAmount;
        group.isPurchased = true;

        if (token == address(0)) {
            ipNft.purchaseCommercialLicense{value: group.targetAmount}(
                group.tokenId, 
                bytes32(0), // simplified for demo
                0
            );
        } else {
            ipNft.purchaseCommercialLicenseWithToken(
                token,
                group.tokenId,
                group.targetAmount,
                bytes32(0), // simplified for demo
                0
            );
        }
        
        emit LicensePurchased(_groupId, group.tokenId);
        
        if (excess > 0) {
            if (token == address(0)) {
                payable(group.creator).transfer(excess);
            } else {
                IERC20(token).safeTransfer(group.creator, excess);
            }
        }
    }

    /**
     * @notice Mengambil kembali dana jika grup gagal mencapai target dalam waktu tertentu.
     */
    function claimRefund(uint256 groupId) external nonReentrant {
        FamilyGroup storage group = groups[groupId];
        if (group.isPurchased) revert LicenseAlreadyPurchased();
        
        uint256 amount = contributions[groupId][msg.sender];
        if (amount == 0) revert InsufficientFunds();
        
        contributions[groupId][msg.sender] = 0;
        group.currentAmount -= amount;
        
        payable(msg.sender).transfer(amount);
        emit RefundClaimed(groupId, msg.sender, amount);
    }

    /**
     * @notice Fungsi helper untuk TrovayaVault memverifikasi akses via Family.
     */
    function isMemberOfPurchasedFamily(uint256 tokenId, address user) external view returns (bool) {
        for (uint i = 1; i <= groupCount; i++) {
            if (groups[i].tokenId == tokenId && groups[i].isPurchased) {
                for (uint j = 0; j < groups[i].members.length; j++) {
                    if (groups[i].members[j] == user) return true;
                }
            }
        }
        return false;
    }
}
