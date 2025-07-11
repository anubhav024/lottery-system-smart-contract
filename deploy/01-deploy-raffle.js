const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments
    const { deployer , player } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2
    console.log("Deploying Raffle contract...")
    let subscriptionId

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Deployment = await deployments.get("VRFCoordinatorV2Mock");
        const vrfCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2Mock", vrfCoordinatorV2Deployment.address);
        vrfCoordinatorV2 = vrfCoordinatorV2Mock;
        const transcationRespnse = await vrfCoordinatorV2Mock.createSubscription()
        const transcationReceipt = await transcationRespnse.wait()

        const event = transcationReceipt.events?.find(
            (e) =>
                e.event === "SubscriptionCreated",
        )
        if (!event) {
            throw new Error("SubscriptionCreated event not found!")
            // console.log("still error")
        }
        subscriptionId = event.args.subId

        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, ethers.utils.parseEther("2"))
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
        vrfCoordinatorV2.address,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]

    console.log(vrfCoordinatorV2.address, "args")
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying contract...")
        await verify(raffle.address, args)
    }

    // console.log(`Raffle contract deployed at address: ${raffle.address}`);
}
module.exports.tags = ["all", "raffle"]
