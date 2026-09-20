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
        string licenseTermsURI;
        bytes32 licenseTermsHash;
        uint32 licenseTermsVersion;
        uint64 licenseDurationSeconds;
    }

    struct LicenseReceipt {
        bytes32 termsHash;
        uint32 termsVersion;
        uint256 pricePaid;
        uint64 purchasedAt;
    }

    event IPMinted(uint256 indexed tokenId, address indexed creator, bool allowAITraining);
    event LicensePurchased(uint256 indexed tokenId, address indexed buyer, uint256 fee);
    event ProceedsWithdrawn(address indexed creator, address indexed recipient, uint256 amount);
    event LicenseTermsAccepted(
        uint256 indexed tokenId,
        address indexed buyer,
        bytes32 indexed termsHash,
        uint32 termsVersion,
        string termsURI
    );

    function mintIP(
        string memory tokenURI,
        bool allowAITraining,
        uint256 commercialLicenseFee,
        string memory publicPoisonedCid,
        string memory encryptedVaultCid,
        uint96 royaltyBps,
        string memory licenseTermsURI,
        bytes32 licenseTermsHash,
        uint32 licenseTermsVersion,
        uint64 licenseDurationSeconds
    ) external returns (uint256);

    function mintIPFor(
        address creator,
        string memory tokenURI,
        bool allowAITraining,
        uint256 commercialLicenseFee,
        string memory publicPoisonedCid,
        string memory encryptedVaultCid,
        uint96 royaltyBps,
        string memory licenseTermsURI,
        bytes32 licenseTermsHash,
        uint32 licenseTermsVersion,
        uint64 licenseDurationSeconds
    ) external returns (uint256);

    function purchaseCommercialLicense(
        uint256 tokenId,
        bytes32 expectedTermsHash,
        uint32 expectedTermsVersion
    ) external payable;

    function purchaseCommercialLicenseWithToken(
        address token,
        uint256 tokenId,
        uint256 amount,
        bytes32 expectedTermsHash,
        uint32 expectedTermsVersion
    ) external;

    function getIPMetadata(uint256 tokenId) external view returns (IPMetadata memory);

    function hasCommercialLicense(uint256 tokenId, address buyer) external view returns (bool);

    function pendingWithdrawals(address creator) external view returns (uint256);

    function withdrawProceeds(address payable recipient) external;

    function getLicenseReceipt(uint256 tokenId, address buyer)
        external view returns (LicenseReceipt memory);
}
