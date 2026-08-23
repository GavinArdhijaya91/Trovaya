// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface ITrovayaMintAndWithdraw {
    function mintIPFor(address,string memory,bool,uint256,string memory,string memory,uint96,string memory,bytes32,uint32,uint64) external returns (uint256);
    function withdrawProceeds(address payable recipient) external;
}

contract RejectingCreator is IERC721Receiver {
    error EtherRejected();

    receive() external payable { revert EtherRejected(); }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function withdrawTo(ITrovayaMintAndWithdraw trovaya, address payable recipient) external {
        trovaya.withdrawProceeds(recipient);
    }
}
