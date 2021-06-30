// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IFYToken {
    /// @dev Asset that is returned on redemption.
    function underlying() external view returns (address);

    /// @dev Unix time at which redemption of fyToken for underlying are possible
    function maturity() external view returns (uint256);
}
