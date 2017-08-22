pragma solidity ^0.4.11;

import './main.sol';

import './erc20.sol';

contract Vault is Module {
    /*
        Defines how the vault will behave when a donor donates some ether.
        For each donation, the vault will grant multiplier * donationInWei / inputCurrencyPriceInWei
        tokens hosted at tokenAddress.
    */
    struct PayBehavior {
        /*
            Number of tokens that would be granted to donor for each input currency unit.
        */
        uint multiplier;

        /*
            Address of an oracle that returns the price of the desired input currency,
            such as USD, in Weis.
            Use zero if Wei is the desired input currency unit.
        */
        address oracleAddress;

        /*
            Address of the contract that grants donor tokens.
        */
        address tokenAddress;

        /*
            The pay behavior will only be valid if the current block number is
            less than untilBlockNumber.
        */
        uint untilBlockNumber;
    }

    PayBehavior[] public payBehaviors; //Array of pay behaviors.

    modifier onlyPrevVault {
        require(msg.sender == moduleAddresses['VAULT']);
        _;
    }

    function Vault(address mainAddr){
        mainAddress = mainAddr;
    }

    function withdraw(uint amountInWeis, address to) onlyDao {
        require(this.balance >= amountInWeis); //Make sure there's enough Ether in the vault
        require(to.balance + amountInWeis > to.balance); //Prevent overflow
        to.transfer(amountInWeis);
    }

    //Pay behavior manipulators.

    function addPayBehavior(PayBehavior behavior) onlyDao {
        payBehaviors.push(behavior);
    }

    function removePaybehavior(PayBehavior behavior) onlyDao {
        for (uint i = 0; i < payBehaviors.length; i++) {
            if (behavior == payBehaviors[i]) {
                delete payBehaviors[i];
                break;
            }
        }
    }

    function removePayBehaviorAtIndex(uint index) onlyDao {
        delete payBehaviors[index];
    }

    function removeAllPayBehaviors() onlyDao {
        delete payBehaviors;
    }

    //Import and export functions for updating modules.

    //Called by the old vault to transfer data to the new vault.
    function importFromVault(PayBehavior[] behaviors) onlyPrevVault {
        payBehaviors = behaviors;
    }

    //Transfers all data and funds to the new vault.
    function exportToVault(address newVaultAddr, bool burn) onlyDao {
        Vault newVault = Vault(newVaultAddr);
        newVault.importFromVault(payBehaviors);
        newVault.transfer(this.balance);
        if (burn) {
            this.selfdestruct();
        }
    }

    //Handles incoming donation.
    function() payable {
        for (uint i = 0; i < payBehaviors.length; i++) {
            PayBehavior behavior = payBehaviors[i];
            if (block.number < behavior.untilBlockNumber) {
                //Todo: implement specific interface for oracle and token
                /*
                Oracle oracle = Oracle(behavior.oracleAddress);
                uint inputCurrencyPriceInWeis = oracle.getPrice();
                ERC20 token = ERC20(behavior.tokenAddress());
                token.transfer(msg.sender, behavior.multiplier * msg.value / inputCurrencyPriceInWeis);
                */
            }
        }
    }
}