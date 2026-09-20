// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITrovayaFamily {
    function createFamily(address[] calldata _members, uint256 _tokenId, uint256 _targetAmount) external returns (uint256);
    function contribute(uint256 _groupId) external payable;
    function contributeWithToken(address token, uint256 _groupId, uint256 amount) external;
    function isMemberOfPurchasedFamily(uint256 _tokenId, address _user) external view returns (bool);
}
