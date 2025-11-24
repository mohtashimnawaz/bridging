// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@layerzerolabs/oft-evm/contracts/OFTAdapter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * Minimal OFT Adapter scaffold. This contract delegates cross-chain messaging
 * to LayerZero via the OFTAdapter implementation. Adjust and extend before
 * production use.
 */
contract MyTokenOFTAdapter is OFTAdapter, Ownable {
    constructor(
        address _token,
        address _lzEndpoint,
        address _owner
    ) OFTAdapter(_token, _lzEndpoint, _owner) Ownable() {
        transferOwnership(_owner);
    }

    // Add admin functions if needed (e.g., emergencyPause, updateFees)
}
