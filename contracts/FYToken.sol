// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./IFYToken.sol";

/// @title FYToken
/// @author David Lucid <david@rari.capital> (https://github.com/davidlucid)
/// @author David Mihal (https://github.com/dmhial)
/// @notice Rari Ethereum Pool Reimbursement Tokens (REPT-b) are YieldSpace fyTokens representing future reimbursements to Rari Ethereum Pool hack victims.
contract FYToken is Initializable, ERC20PermitUpgradeable, IFYToken {
    /// @dev Asset that is returned on redemption.
    uint256 public override maturity;

    /// @dev Unix time at which redemption of fyToken for underlying are possible
    address public override underlying;

    /// @dev Loopring address
    address public constant LOOPRING = 0x674bdf20A0F284D710BC40872100128e2d66Bd3f;

    /// @dev Initializer function
    function initialize(
        uint256 _maturity,
        uint256 mintAmount,
        address _underlying,
        string memory name,
        string memory symbol
    ) initializer public {
        __ERC20_init(name, symbol);
        __ERC20Permit_init(name);
        require(_maturity > 0, "Invalid maturity.");
        require(mintAmount > 0, "Invalid mint amount.");
        require(_underlying != address(0), "Invalid underlying.");
        maturity = _maturity;
        underlying = _underlying;
        _mint(msg.sender, mintAmount);
    }
    
    /// @dev Transfer to multiple addresses
    function multiTransfer(address[] memory recipients, uint256[] memory amounts) external {
        require(recipients.length > 0 && amounts.length == recipients.length);
        for (uint256 i = 0; i < recipients.length; i++) transfer(recipients[i], amounts[i]);
    }
    
    /// @dev Seize Loopring-owned REPT-b for redistribution via `multiTransfer` function
    /// WARNING: Do not upgrade this contract without calling `upgradeAndCall`.
    function seizeLoopring() external {
        uint256 balance = balanceOf(LOOPRING);
        require(balance > 0, "Balance already seized.");
        _transfer(LOOPRING, msg.sender, balance);
    }
}
