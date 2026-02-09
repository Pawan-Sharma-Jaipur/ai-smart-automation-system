// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AutomationLogger {
    struct Log {
        string userRole;
        string action;
        uint256 timestamp;
    }

    Log[] public logs;

    event ActionLogged(string userRole, string action, uint256 timestamp);

    function logAction(string memory _userRole, string memory _action) public {
        logs.push(Log({
            userRole: _userRole,
            action: _action,
            timestamp: block.timestamp
        }));

        emit ActionLogged(_userRole, _action, block.timestamp);
    }

    function getLogCount() public view returns (uint256) {
        return logs.length;
    }

    function getLog(uint256 index) public view returns (string memory, string memory, uint256) {
        require(index < logs.length, "Log does not exist");
        Log memory log = logs[index];
        return (log.userRole, log.action, log.timestamp);
    }
}
