const {developmentChains,networkConfig} = require("../helper-hardhat-config")
const {expect,assert} = require("chai")

const {ethers, deployments, getNamedAccounts} = require("hardhat")

!developmentChains.includes(network.name)
    ? describe.skip :describe("Raffle", async  function(){
        let raffle, vrfCoordinatorV2Mock
        const chainId = network.config.chainId

        beforeEach(async function(){
            const {deployer} = await getNamedAccounts()
            await deployments.fixture(["all"])
            const signer = await ethers.getSigner(deployer)
            raffle = await ethers.getContract("Raffle",signer)
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", signer)
            
        })

        describe("constructor",async function(){
            it("initalizes the raffle correctly", async function(){
                const raffleState = await raffle.getRaffleState()
                const interval = await raffle.getInterval();
                assert.equal(raffleState.toString(),"0")
                assert.equal(interval.toString(),networkConfig[chainId]["interval"].toString())

            })
        })
    }) 