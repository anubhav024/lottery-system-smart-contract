const { network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const BASE_FEE = ethers.parseEther("0.25"); // 0.25 is the base fee in LINK
const GAS_PRICE_LINK = 1e9; // 1 LINK = 1e9

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const args = [BASE_FEE, GAS_PRICE_LINK];
    
    if(developmentChains.includes(network.name)) {
        console.log("Local network detected! Deploying mocks...");
    await deploy("VRFCoordinatorV2Mock", {
        from: deployer,
        args: args,
        log: true,
    });
    console.log("Mocks deployed!");
    console.log("----------------------------------------------------");
};
}

module.exports.tags = ["all", "mocks"];