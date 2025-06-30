// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import  "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

error Raffel_NotEnoughEthSent();
error Raffel_TransferFailed();
error Raffel_NotOpen();
error Raffel_UpkeepNotNeeded(
    uint256 currentBalance,
    uint256 numPlayers,
    uint256 raffelState
);

contract Raffel is VRFConsumerBaseV2{
// State variables
    uint256 private immutable i_entryFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint16 private constant requestConfirmations = 3;
    uint32 private immutable i_callbackGasLimit = 100000;
    uint32 private constant numWords = 1;

// Lottery variables
    address private s_recentWinner;
    RaffelState private s_raffelState;
    uint private s_lastTimeStamp;
    uint private immutable i_interval;

// Types
    enum RaffelState {
        OPEN,
        CALCULATING
    }

// Events
    event RaffelEntered(address indexed player);
    event RequestedRaffelWinner(uint indexed requestId);
    event RaffelWinnerPicked(address indexed winner);

    constructor(
        uint256 entryFee, 
        address vrfCoordinator,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint interval
        ) 
        
        VRFConsumerBaseV2(vrfCoordinator) {
        i_entryFee = entryFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffelState = RaffelState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
        
    }
    function enterRaffel() public payable{
        if(msg.value < i_entryFee) {
            revert Raffel_NotOpen();
        }
        if(s_raffelState != RaffelState.OPEN) {
            revert("Raffel is not open");
        }
        s_players.push(payable(msg.sender));
        emit RaffelEntered(msg.sender);
    }

    function checkUpkeepLogic() internal view returns (bool upkeepNeeded) {
        bool isOpen = (RaffelState.OPEN == s_raffelState);
        bool timePassed = (block.timestamp - s_lastTimeStamp) > i_interval;
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = (address(this).balance > 0);
        upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        returns (bool upkeepNeeded, bytes memory /* performData */)
    {
      upkeepNeeded = checkUpkeepLogic();
    }

    function performUpKeep(bytes calldata) external     {
        
        if(!checkUpkeepLogic()) {
            revert Raffel_UpkeepNotNeeded(address(this).balance, s_players.length,uint256(s_raffelState));
        }
        s_raffelState = RaffelState.CALCULATING;
       uint requestId=i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            requestConfirmations,
            i_callbackGasLimit,
            numWords
        );
    emit RequestedRaffelWinner(requestId);
    }

    function fulfillRandomWords(uint256 requestId,uint256[] memory randomWords) internal override {
        
        uint indexodWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexodWinner];
        s_recentWinner=recentWinner;
        s_raffelState = RaffelState.OPEN;
        s_players = new address payable[](0); // Reset the players array for the next raffle
        s_lastTimeStamp = block.timestamp; // Reset the last timestamp for the next raffle
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        require(success, "Transfer failed");
        if(!success) {
            revert Raffel_TransferFailed();
        }

        emit RaffelWinnerPicked(recentWinner);
    }

// View Pure Functions
    // View functions are used to get the state of the contract without modifying it.
    // They are read-only and do not cost any gas to call.
    // Pure functions are used to perform calculations without accessing the state of the contract.
    function getEntryFee() external view returns (uint256) {
        return i_entryFee;
    }

    function getPlayer(uint256 index) external view returns (address payable) {
        return s_players[index];
    }

    function gertRecentWinner() public view returns (address){
        return s_recentWinner;
    }

    function getRaffelState() public view returns (RaffelState) {
        return s_raffelState;
    }   

    function getNumWords() public pure returns (uint32) {
        return 1;
    }

    function getNumberofPlayers() public view returns (uint256) {
        return s_players.length;
    } 

    function getRequestConfirmations() public pure returns (uint16) {
        return requestConfirmations;
    }

    function getLatestTimeStamp() public view returns (uint) {
        return s_lastTimeStamp;
    }

}