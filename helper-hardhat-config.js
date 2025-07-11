const { ethers } = require("ethers");

const networkConfig={
    11155111: {
        name: "sepolia",
        vrfCoordinatorV2: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
        entranceFee: ethers.utils.parseEther("0.01"), // 0.01 ETH
        gasLane:"0x8077df514608a09f83e4e8d300645594e5d7234665448ba83f51a50f842bd3d9",
        subscriptionId: "1234", // Replace with your actual subscription ID
        callbackGasLimit: "500000", // 500,000 gas
        interval : "30", // 30 seconds

    },
    31337: {
        name: "hardhat",
        entranceFee: ethers.utils.parseEther("0.01"), // 0.01 ETH
        gasLane:"0x8077df514608a09f83e4e8d300645594e5d7234665448ba83f51a50f842bd3d9",
        callbackGasLimit: "500000",
        interval : "30", // 30 seconds
    },
}

const developmentChains = ["hardhat", "localhost"];

module.exports = {
    networkConfig,
    developmentChains,
}