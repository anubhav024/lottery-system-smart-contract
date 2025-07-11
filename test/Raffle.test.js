const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { expect, assert } = require("chai")
const { ethers, deployments, getNamedAccounts } = require("hardhat")

// require("@nomicfoundation/hardhat-chai-matchers")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle", async function () {
          let raffle, vrfCoordinatorV2Mock
          const chainId = network.config.chainId

          beforeEach(async function () {
              const { deployer } = await getNamedAccounts()
              await deployments.fixture(["all"])
              const signer = await ethers.getSigner(deployer);
              const vrfCoordinatorV2Deployment = await deployments.get("VRFCoordinatorV2Mock");
              const raffleDeployement = await deployments.get("Raffle");
              raffle = await ethers.getContractAt("Raffle", raffleDeployement.address)
              console.log(raffle.address , signer.address , vrfCoordinatorV2Deployment.address)
              vrfCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2Mock", vrfCoordinatorV2Deployment.address)
          })

          describe("constructor", async function () {
              it("initalizes the raffle correctly", async function () {
                  const raffleState = await raffle.getRaffleState()
                  const interval = await raffle.getInterval()
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(interval.toString(), networkConfig[chainId]["interval"].toString())
              })
          })

          describe("enterRaffle", async function () {
              it("revert when you don't pay enough", async function () {
                  await expect(raffle.enterRaffle()).to.be.revertedWith(
                      "Raffle_NotEnoughEthSent",
                  )
              })
          })
      })
