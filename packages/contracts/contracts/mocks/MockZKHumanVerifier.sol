// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IZKHumanVerifier} from "../interfaces/IZKHumanVerifier.sol";

/// @notice Demo-only verifier for the PRD's mock ZK-KYC flow. Never use in production.
contract MockZKHumanVerifier is AccessControl, ReentrancyGuard, IZKHumanVerifier {
    bytes32 public constant VERIFIER_OPERATOR_ROLE = keccak256("VERIFIER_OPERATOR_ROLE");
    mapping(address account => bool verified) public isVerifiedHuman;

    event HumanVerificationUpdated(address indexed account, bool verified);

    constructor(address initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(VERIFIER_OPERATOR_ROLE, initialAdmin);
    }

    function setVerifiedHuman(address account, bool verified)
        external onlyRole(VERIFIER_OPERATOR_ROLE) nonReentrant
    {
        isVerifiedHuman[account] = verified;
        emit HumanVerificationUpdated(account, verified);
    }

    function verifyHuman(address account, bytes calldata proof) external view returns (bool) {
        // Non-empty demo proof prevents accidental blank submissions; no ZK claim is made.
        return isVerifiedHuman[account] && proof.length > 0;
    }
}
