// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITrovayaVault {
    event VaultAccessGranted(uint256 indexed tokenId, address indexed account, bool viaLicense);

    function unlockWithHumanProof(uint256 tokenId, bytes calldata proof) external;

    function unlockWithLicense(uint256 tokenId) external;

    function hasVaultAccess(uint256 tokenId, address account) external view returns (bool);
}
