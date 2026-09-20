// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ITrovayaIPNFT} from "./interfaces/ITrovayaIPNFT.sol";

/// @title Trovaya IP NFT
/// @notice Registers creator IP, consent, protected public media, and vault references.
contract TrovayaIPNFT is
    ERC721Enumerable,
    ERC721URIStorage,
    ERC2981,
    AccessControl,
    Pausable,
    ReentrancyGuard,
    ITrovayaIPNFT
{
    using SafeERC20 for IERC20;

    uint96 public constant MAX_ROYALTY_BPS = 10_000;
    uint64 public constant MAX_LICENSE_DURATION = 3650 days;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    uint256 private _nextTokenId = 1;

    mapping(uint256 tokenId => IPMetadata metadata) private _ipMetadata;
    mapping(uint256 tokenId => mapping(address buyer => bool purchased)) public hasCommercialLicense;
    mapping(uint256 tokenId => mapping(address buyer => LicenseReceipt receipt)) private _licenseReceipts;
    mapping(address token => mapping(address creator => uint256 amount)) public pendingTokenWithdrawals;
    mapping(address creator => uint256 amount) public pendingWithdrawals;
    uint256 public totalPendingWithdrawals;

    error InvalidRoyalty();
    error InvalidLicenseFee();
    error LicenseAlreadyPurchased();
    error TokenDoesNotExist();
    error WithdrawalFailed();
    error NoProceeds();
    error InvalidAddress();
    error InvalidLicenseTerms();
    error LicenseTermsMismatch();

    constructor(address initialAdmin) ERC721("Trovaya IP", "TRVIP") {
        if (initialAdmin == address(0)) revert InvalidAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(MINTER_ROLE, initialAdmin);
        _grantRole(PAUSER_ROLE, initialAdmin);
    }

    function mintIP(
        string memory tokenURI_,
        bool allowAITraining,
        uint256 commercialLicenseFee,
        string memory publicPoisonedCid,
        string memory encryptedVaultCid,
        uint96 royaltyBps,
        string memory licenseTermsURI,
        bytes32 licenseTermsHash,
        uint32 licenseTermsVersion,
        uint64 licenseDurationSeconds
    ) external whenNotPaused nonReentrant returns (uint256 tokenId) {
        return _mintIP(msg.sender, tokenURI_, allowAITraining, commercialLicenseFee,
            publicPoisonedCid, encryptedVaultCid, royaltyBps, licenseTermsURI,
            licenseTermsHash, licenseTermsVersion, licenseDurationSeconds);
    }

    /// @notice Relayer-friendly registration that preserves the user's creator attribution.
    function mintIPFor(
        address creator,
        string memory tokenURI_,
        bool allowAITraining,
        uint256 commercialLicenseFee,
        string memory publicPoisonedCid,
        string memory encryptedVaultCid,
        uint96 royaltyBps,
        string memory licenseTermsURI,
        bytes32 licenseTermsHash,
        uint32 licenseTermsVersion,
        uint64 licenseDurationSeconds
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant returns (uint256 tokenId) {
        return _mintIP(creator, tokenURI_, allowAITraining, commercialLicenseFee,
            publicPoisonedCid, encryptedVaultCid, royaltyBps, licenseTermsURI,
            licenseTermsHash, licenseTermsVersion, licenseDurationSeconds);
    }

    function _mintIP(
        address creator,
        string memory tokenURI_,
        bool allowAITraining,
        uint256 commercialLicenseFee,
        string memory publicPoisonedCid,
        string memory encryptedVaultCid,
        uint96 royaltyBps,
        string memory licenseTermsURI,
        bytes32 licenseTermsHash,
        uint32 licenseTermsVersion,
        uint64 licenseDurationSeconds
    ) private returns (uint256 tokenId) {
        if (creator == address(0)) revert InvalidAddress();
        if (royaltyBps > MAX_ROYALTY_BPS) revert InvalidRoyalty();
        if (bytes(licenseTermsURI).length == 0 || licenseTermsHash == bytes32(0)
            || licenseTermsVersion == 0 || licenseDurationSeconds == 0
            || licenseDurationSeconds > MAX_LICENSE_DURATION) revert InvalidLicenseTerms();

        tokenId = _nextTokenId++;
        _ipMetadata[tokenId] = IPMetadata({
            creator: creator,
            allowAITraining: allowAITraining,
            commercialLicenseFee: commercialLicenseFee,
            publicPoisonedCid: publicPoisonedCid,
            encryptedVaultCid: encryptedVaultCid,
            royaltyBps: royaltyBps,
            licenseTermsURI: licenseTermsURI,
            licenseTermsHash: licenseTermsHash,
            licenseTermsVersion: licenseTermsVersion,
            licenseDurationSeconds: licenseDurationSeconds
        });
        _setTokenURI(tokenId, tokenURI_);
        _setTokenRoyalty(tokenId, creator, royaltyBps);
        _safeMint(creator, tokenId);

        emit IPMinted(tokenId, creator, allowAITraining);
    }

    /// @notice Purchases a non-exclusive commercial license at the creator's listed fee.
    function purchaseCommercialLicense(
        uint256 tokenId,
        bytes32 expectedTermsHash,
        uint32 expectedTermsVersion
    ) external payable whenNotPaused nonReentrant {
        _processPurchase(tokenId, msg.value, address(0), expectedTermsHash, expectedTermsVersion);
    }

    function purchaseCommercialLicenseWithToken(
        address token,
        uint256 tokenId,
        uint256 amount,
        bytes32 expectedTermsHash,
        uint32 expectedTermsVersion
    ) external whenNotPaused nonReentrant {
        if (token == address(0)) revert InvalidAddress();
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        _processPurchase(tokenId, amount, token, expectedTermsHash, expectedTermsVersion);
    }

    function _processPurchase(
        uint256 tokenId,
        uint256 amount,
        address token,
        bytes32 expectedTermsHash,
        uint32 expectedTermsVersion
    ) internal {
        IPMetadata storage metadata = _ipMetadata[tokenId];
        if (metadata.creator == address(0)) revert TokenDoesNotExist();
        if (amount != metadata.commercialLicenseFee || amount == 0) revert InvalidLicenseFee();
        if (hasCommercialLicense[tokenId][msg.sender]) revert LicenseAlreadyPurchased();
        if (expectedTermsHash != metadata.licenseTermsHash
            || expectedTermsVersion != metadata.licenseTermsVersion) revert LicenseTermsMismatch();

        hasCommercialLicense[tokenId][msg.sender] = true;
        _licenseReceipts[tokenId][msg.sender] = LicenseReceipt({
            termsHash: metadata.licenseTermsHash,
            termsVersion: metadata.licenseTermsVersion,
            pricePaid: amount,
            purchasedAt: uint64(block.timestamp)
        });

        if (token == address(0)) {
            pendingWithdrawals[metadata.creator] += amount;
            totalPendingWithdrawals += amount;
        } else {
            pendingTokenWithdrawals[token][metadata.creator] += amount;
        }

        emit LicensePurchased(tokenId, msg.sender, amount);
        emit LicenseTermsAccepted(tokenId, msg.sender, metadata.licenseTermsHash,
            metadata.licenseTermsVersion, metadata.licenseTermsURI);
    }

    /// @notice Withdraws credited proceeds to a creator-selected recipient.
    function withdrawProceeds(address payable recipient) external nonReentrant {
        if (recipient == address(0)) revert InvalidAddress();
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NoProceeds();
        pendingWithdrawals[msg.sender] = 0;
        totalPendingWithdrawals -= amount;
        (bool sent,) = recipient.call{value: amount}("");
        if (!sent) revert WithdrawalFailed();
        emit ProceedsWithdrawn(msg.sender, recipient, amount);
    }

    function withdrawTokenProceeds(address token, address payable recipient) external nonReentrant {
        if (token == address(0) || recipient == address(0)) revert InvalidAddress();
        uint256 amount = pendingTokenWithdrawals[token][msg.sender];
        if (amount == 0) revert NoProceeds();
        pendingTokenWithdrawals[token][msg.sender] = 0;
        IERC20(token).safeTransfer(recipient, amount);
        emit ProceedsWithdrawn(msg.sender, recipient, amount);
    }

    function pause() external onlyRole(PAUSER_ROLE) nonReentrant {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) nonReentrant {
        _unpause();
    }

    function getIPMetadata(uint256 tokenId) external view returns (IPMetadata memory) {
        if (_ipMetadata[tokenId].creator == address(0)) revert TokenDoesNotExist();
        return _ipMetadata[tokenId];
    }

    function getLicenseReceipt(uint256 tokenId, address buyer)
        external view returns (LicenseReceipt memory)
    {
        return _licenseReceipts[tokenId][buyer];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage, ERC2981, AccessControl)
        returns (bool)
    {
        return interfaceId == type(ITrovayaIPNFT).interfaceId || super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    // Required by Solidity to resolve ERC721 and ERC721Enumerable inheritance.
    // slither-disable-next-line dead-code
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
}
