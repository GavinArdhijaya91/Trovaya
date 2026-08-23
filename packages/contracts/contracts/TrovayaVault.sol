// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ITrovayaIPNFT} from "./interfaces/ITrovayaIPNFT.sol";
import {ITrovayaVault} from "./interfaces/ITrovayaVault.sol";
import {IZKHumanVerifier} from "./interfaces/IZKHumanVerifier.sol";

/// @title Trovaya encrypted-vault access coordinator
/// @notice Records authorization only. Encryption keys and clean files remain off-chain.
contract TrovayaVault is AccessControl, Pausable, ReentrancyGuard, ITrovayaVault {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    // Solhint requires immutable variables to use capitalized snake case.
    // slither-disable-next-line naming-convention
    ITrovayaIPNFT public immutable IP_NFT;
    IZKHumanVerifier public humanVerifier;

    mapping(uint256 tokenId => mapping(address account => AccessGrant grant)) private _accessGrants;

    error InvalidAddress();
    error InvalidHumanProof();
    error CommercialLicenseRequired();
    error AccessDenied();

    event HumanVerifierUpdated(address indexed previousVerifier, address indexed newVerifier);

    constructor(address initialOwner, ITrovayaIPNFT ipNFT_, IZKHumanVerifier humanVerifier_)
    {
        if (initialOwner == address(0) || address(ipNFT_) == address(0)
            || address(humanVerifier_) == address(0)) {
            revert InvalidAddress();
        }
        IP_NFT = ipNFT_;
        humanVerifier = humanVerifier_;
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(PAUSER_ROLE, initialOwner);
    }

    /// @notice Grants demo access after the configured adapter confirms a human proof.
    function unlockWithHumanProof(uint256 tokenId, bytes calldata proof)
        external whenNotPaused nonReentrant
    {
        // Metadata lookup also guarantees that the token exists. The creator
        // check defends the invariant if a future adapter changes that behavior.
        ITrovayaIPNFT.IPMetadata memory metadata = IP_NFT.getIPMetadata(tokenId);
        if (metadata.creator == address(0)) revert AccessDenied();
        if (!humanVerifier.verifyHuman(msg.sender, proof)) revert InvalidHumanProof();
        _grantAccess(tokenId, msg.sender, false, uint64(block.timestamp + 1 days));
    }

    /// @notice Grants access to a buyer that purchased the on-chain commercial license.
    function unlockWithLicense(uint256 tokenId) external whenNotPaused nonReentrant {
        if (!IP_NFT.hasCommercialLicense(tokenId, msg.sender)) revert CommercialLicenseRequired();
        ITrovayaIPNFT.LicenseReceipt memory receipt = IP_NFT.getLicenseReceipt(tokenId, msg.sender);
        ITrovayaIPNFT.IPMetadata memory metadata = IP_NFT.getIPMetadata(tokenId);
        uint256 expiry = uint256(receipt.purchasedAt) + metadata.licenseDurationSeconds;
        // Timestamp drift cannot extend access: expiry is fixed from purchase time.
        // slither-disable-next-line timestamp
        if (receipt.purchasedAt < 1 || expiry <= block.timestamp) revert AccessDenied();
        _grantAccess(tokenId, msg.sender, true, uint64(expiry));
    }

    function setHumanVerifier(IZKHumanVerifier newVerifier)
        external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant
    {
        if (address(newVerifier) == address(0)) revert InvalidAddress();
        address previousVerifier = address(humanVerifier);
        humanVerifier = newVerifier;
        emit HumanVerifierUpdated(previousVerifier, address(newVerifier));
    }

    function revokeAccess(uint256 tokenId, address account) external nonReentrant {
        ITrovayaIPNFT.IPMetadata memory metadata = IP_NFT.getIPMetadata(tokenId);
        if (msg.sender != metadata.creator && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert AccessDenied();
        AccessGrant storage grant = _accessGrants[tokenId][account];
        if (grant.grantedAt < 1 || grant.revokedAt > 0) revert AccessDenied();
        grant.revokedAt = uint64(block.timestamp);
        emit VaultAccessRevoked(tokenId, account, msg.sender);
    }

    function hasVaultAccess(uint256 tokenId, address account) public view returns (bool) {
        AccessGrant memory grant = _accessGrants[tokenId][account];
        // Timestamp is the intended enforcement clock for bounded access grants.
        // slither-disable-next-line timestamp
        return grant.grantedAt > 0 && grant.revokedAt < 1 && grant.expiresAt > block.timestamp;
    }

    function getAccessGrant(uint256 tokenId, address account) external view returns (AccessGrant memory) {
        return _accessGrants[tokenId][account];
    }

    function pause() external onlyRole(PAUSER_ROLE) nonReentrant {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) nonReentrant {
        _unpause();
    }

    function _grantAccess(uint256 tokenId, address account, bool viaLicense, uint64 expiresAt) private {
        _accessGrants[tokenId][account] = AccessGrant({ grantedAt: uint64(block.timestamp), expiresAt: expiresAt, revokedAt: 0, viaLicense: viaLicense });
        emit VaultAccessGranted(tokenId, account, viaLicense, expiresAt);
    }
}
