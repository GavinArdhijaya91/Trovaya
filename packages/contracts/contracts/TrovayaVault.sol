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
    ITrovayaIPNFT public immutable IP_NFT;
    IZKHumanVerifier public humanVerifier;

    mapping(uint256 tokenId => mapping(address account => bool granted)) public hasVaultAccess;

    error InvalidAddress();
    error InvalidHumanProof();
    error CommercialLicenseRequired();

    event HumanVerifierUpdated(address indexed previousVerifier, address indexed newVerifier);

    constructor(address initialOwner, ITrovayaIPNFT ipNFT_, IZKHumanVerifier humanVerifier_)
    {
        if (address(ipNFT_) == address(0) || address(humanVerifier_) == address(0)) {
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
        // Metadata lookup also guarantees that the token exists.
        IP_NFT.getIPMetadata(tokenId);
        if (!humanVerifier.verifyHuman(msg.sender, proof)) revert InvalidHumanProof();
        _grantAccess(tokenId, msg.sender, false);
    }

    /// @notice Grants access to a buyer that purchased the on-chain commercial license.
    function unlockWithLicense(uint256 tokenId) external whenNotPaused nonReentrant {
        if (!IP_NFT.hasCommercialLicense(tokenId, msg.sender)) revert CommercialLicenseRequired();
        _grantAccess(tokenId, msg.sender, true);
    }

    function setHumanVerifier(IZKHumanVerifier newVerifier)
        external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant
    {
        if (address(newVerifier) == address(0)) revert InvalidAddress();
        address previousVerifier = address(humanVerifier);
        humanVerifier = newVerifier;
        emit HumanVerifierUpdated(previousVerifier, address(newVerifier));
    }

    function pause() external onlyRole(PAUSER_ROLE) nonReentrant {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) nonReentrant {
        _unpause();
    }

    function _grantAccess(uint256 tokenId, address account, bool viaLicense) private {
        hasVaultAccess[tokenId][account] = true;
        emit VaultAccessGranted(tokenId, account, viaLicense);
    }
}
