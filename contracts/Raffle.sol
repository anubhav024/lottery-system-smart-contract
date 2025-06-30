// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import  "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

error Raffle_NotEnoughEthSent();
error Raffle_TransferFailed();
error Raffle_NotOpen();
error Raffle_UpkeepNotNeeded(
    uint256 currentBalance,
    uint256 numPlayers,
    uint256 RaffleState
);

contract Raffle is VRFConsumerBaseV2{
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
    RaffleState private s_RaffleState;
    uint private s_lastTimeStamp;
    uint private immutable i_interval;

// Types
    enum RaffleState {
        OPEN,
        CALCULATING
    }

// Events
    event RaffleEntered(address indexed player);
    event RequestedRaffleWinner(uint indexed requestId);
    event RaffleWinnerPicked(address indexed winner);

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
        s_RaffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
        
    }
    function enterRaffle() public payable{
        if(msg.value < i_entryFee) {
            revert Raffle_NotEnoughEthSent();
        }
        if(s_RaffleState != RaffleState.OPEN) {
            revert Raffle_NotOpen();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEntered(msg.sender);
    }

    function checkUpkeepLogic() internal view returns (bool upkeepNeeded) {
        bool isOpen = (RaffleState.OPEN == s_RaffleState);
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
            revert Raffle_UpkeepNotNeeded(address(this).balance, s_players.length,uint256(s_RaffleState));
        }
        s_RaffleState = RaffleState.CALCULATING;
       uint requestId=i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            requestConfirmations,
            i_callbackGasLimit,
            numWords
        );
    emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(uint256 requestId,uint256[] memory randomWords) internal override {
        
        uint indexodWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexodWinner];
        s_recentWinner=recentWinner;
        s_RaffleState = RaffleState.OPEN;
        s_players = new address payable[](0); // Reset the players array for the next raffle
        s_lastTimeStamp = block.timestamp; // Reset the last timestamp for the next raffle
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        require(success, "Transfer failed");
        if(!success) {
            revert Raffle_TransferFailed();
        }

        emit RaffleWinnerPicked(recentWinner);
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

    function getRaffleState() public view returns (RaffleState) {
        return s_RaffleState;
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

    function getInterval() public view returns (uint) {
        return i_interval;
    }

}