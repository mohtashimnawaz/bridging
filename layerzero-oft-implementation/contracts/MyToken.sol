// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        // Start with zero supply; minting controlled by owner (bridge)
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
