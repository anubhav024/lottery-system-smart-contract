const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2
    console.log("Deploying Raffel contract...")
    let subscriptionId;

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
       
        vrfCoordinatorV2 = vrfCoordinatorV2Mock.target
        const transcationRespnse = await vrfCoordinatorV2Mock.createSubscription()
        
        const transcationReceipt = await transcationRespnse.wait()
        
        const event = transcationReceipt.logs?.find((e) => e.topics[0] === "0x464722b4166576d3dcbba877b999bc35cf911f4eaf434b7eba68fa113951d0bf")
        if (!event) {
            throw new Error("SubscriptionCreated event not found!")
            // console.log("still error")
        }
        subscriptionId = event.args.subId

        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, ethers.parseEther("2"))
    } else {
        vrfCoordinatorV2 = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]

    const args = [
        entranceFee,
        vrfCoordinatorV2,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]

    console.log(args , "args")
    const raffle = await deploy("Raffel", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying contract...")
        await verify(raffle.address, args)
    }

    // console.log(`Raffel contract deployed at address: ${raffle.address}`);
}
