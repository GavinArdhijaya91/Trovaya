// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Adapter boundary for a World ID, Semaphore, or demo humanity verifier.
interface IZKHumanVerifier {
    function verifyHuman(address account, bytes calldata proof) external view returns (bool);
}
