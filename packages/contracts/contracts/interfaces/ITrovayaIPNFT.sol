// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITrovayaIPNFT {
    struct IPMetadata {
        address creator;
        bool allowAITraining;
        uint256 commercialLicenseFee;
        string publicPoisonedCid;
        string encryptedVaultCid;
        uint96 royaltyBps;
    }

    event IPMinted(uint256 indexed tokenId, address indexed creator, bool allowAITraining);
    event LicensePurchased(uint256 indexed tokenId, address indexed buyer, uint256 fee);

    function mintIP(
        string memory tokenURI,
        bool allowAITraining,
        uint256 commercialLicenseFee,
        string memory publicPoisonedCid,
        string memory encryptedVaultCid,
        uint96 royaltyBps
    ) external returns (uint256);

    function mintIPFor(
        address creator,
        string memory tokenURI,
        bool allowAITraining,
        uint256 commercialLicenseFee,
        string memory publicPoisonedCid,
        string memory encryptedVaultCid,
        uint96 royaltyBps
    ) external returns (uint256);

    function purchaseCommercialLicense(uint256 tokenId) external payable;

    function getIPMetadata(uint256 tokenId) external view returns (IPMetadata memory);

    function hasCommercialLicense(uint256 tokenId, address buyer) external view returns (bool);
}
