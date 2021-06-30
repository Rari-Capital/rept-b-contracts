// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./IFYToken.sol";

contract FYToken is Initializable, ERC20PermitUpgradeable, IFYToken {
    uint256 public override maturity;
    address public override underlying;

    function initialize(
        uint256 _maturity,
        uint256 mintAmount,
        address _underlying,
        string memory name,
        string memory symbol
    ) initializer public {
        __ERC20_init(name, symbol);
        __ERC20Permit_init(name);
        maturity = _maturity;
        underlying = _underlying;
        _mint(msg.sender, mintAmount);
    }
    
    function multiTransfer(address[] memory recipients, uint256[] memory amounts) external {
        require(recipients.length > 0 && amounts.length == recipients.length);
        for (uint256 i = 0; i < recipients.length; i++) transfer(recipients[i], amounts[i]);
    }
}
