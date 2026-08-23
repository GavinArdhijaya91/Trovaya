// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITrovayaVault {
    struct AccessGrant { uint64 grantedAt; uint64 expiresAt; uint64 revokedAt; bool viaLicense; }
    event VaultAccessGranted(uint256 indexed tokenId, address indexed account, bool viaLicense, uint64 expiresAt);
    event VaultAccessRevoked(uint256 indexed tokenId, address indexed account, address indexed revokedBy);

    function unlockWithHumanProof(uint256 tokenId, bytes calldata proof) external;

    function unlockWithLicense(uint256 tokenId) external;

    function hasVaultAccess(uint256 tokenId, address account) external view returns (bool);
    function getAccessGrant(uint256 tokenId, address account) external view returns (AccessGrant memory);
    function revokeAccess(uint256 tokenId, address account) external;
}
