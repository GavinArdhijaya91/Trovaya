// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
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
    uint96 public constant MAX_ROYALTY_BPS = 10_000;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    uint256 private _nextTokenId = 1;

    mapping(uint256 tokenId => IPMetadata metadata) private _ipMetadata;
    mapping(uint256 tokenId => mapping(address buyer => bool purchased)) public hasCommercialLicense;

    error InvalidRoyalty();
    error InvalidLicenseFee();
    error LicenseAlreadyPurchased();
    error TokenDoesNotExist();
    error PaymentFailed();
    error InvalidAddress();

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
        uint96 royaltyBps
    ) external whenNotPaused nonReentrant returns (uint256 tokenId) {
        return _mintIP(msg.sender, tokenURI_, allowAITraining, commercialLicenseFee,
            publicPoisonedCid, encryptedVaultCid, royaltyBps);
    }

    /// @notice Relayer-friendly registration that preserves the user's creator attribution.
    function mintIPFor(
        address creator,
        string memory tokenURI_,
        bool allowAITraining,
        uint256 commercialLicenseFee,
        string memory publicPoisonedCid,
        string memory encryptedVaultCid,
        uint96 royaltyBps
    ) external onlyRole(MINTER_ROLE) whenNotPaused nonReentrant returns (uint256 tokenId) {
        return _mintIP(creator, tokenURI_, allowAITraining, commercialLicenseFee,
            publicPoisonedCid, encryptedVaultCid, royaltyBps);
    }

    function _mintIP(
        address creator,
        string memory tokenURI_,
        bool allowAITraining,
        uint256 commercialLicenseFee,
        string memory publicPoisonedCid,
        string memory encryptedVaultCid,
        uint96 royaltyBps
    ) private returns (uint256 tokenId) {
        if (creator == address(0)) revert InvalidAddress();
        if (royaltyBps > MAX_ROYALTY_BPS) revert InvalidRoyalty();

        tokenId = _nextTokenId++;
        _safeMint(creator, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        _setTokenRoyalty(tokenId, creator, royaltyBps);
        _ipMetadata[tokenId] = IPMetadata({
            creator: creator,
            allowAITraining: allowAITraining,
            commercialLicenseFee: commercialLicenseFee,
            publicPoisonedCid: publicPoisonedCid,
            encryptedVaultCid: encryptedVaultCid,
            royaltyBps: royaltyBps
        });

        emit IPMinted(tokenId, creator, allowAITraining);
    }

    /// @notice Purchases a non-exclusive commercial license at the creator's listed fee.
    function purchaseCommercialLicense(uint256 tokenId) external payable whenNotPaused nonReentrant {
        IPMetadata storage metadata = _ipMetadata[tokenId];
        if (metadata.creator == address(0)) revert TokenDoesNotExist();
        if (msg.value != metadata.commercialLicenseFee || msg.value == 0) revert InvalidLicenseFee();
        if (hasCommercialLicense[tokenId][msg.sender]) revert LicenseAlreadyPurchased();

        hasCommercialLicense[tokenId][msg.sender] = true;
        (bool sent,) = payable(metadata.creator).call{value: msg.value}("");
        if (!sent) revert PaymentFailed();

        emit LicensePurchased(tokenId, msg.sender, msg.value);
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

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
}
