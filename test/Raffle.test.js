const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { expect, assert } = require("chai")
const { ethers, deployments, getNamedAccounts } = require("hardhat")

// require("@nomicfoundation/hardhat-chai-matchers")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle", async function () {
          let raffle, vrfCoordinatorV2Mock,raffleEntranceFee, raffleInterval,deployer, player
          const chainId = network.config.chainId

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              const signer = await ethers.getSigner(deployer);
              const vrfCoordinatorV2Deployment = await deployments.get("VRFCoordinatorV2Mock");
              const raffleDeployement = await deployments.get("Raffle");
              raffle = await ethers.getContractAt("Raffle", raffleDeployement.address)
              console.log(raffle.address , signer.address , vrfCoordinatorV2Deployment.address)
              vrfCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2Mock", vrfCoordinatorV2Deployment.address)
              raffleEntranceFee = await raffle.getEntryFee()
              raffleInterval = await raffle.getInterval()
              await vrfCoordinatorV2Mock.addConsumer(1, raffle.address)
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
              it("records players when they enter", async function(){
                //const { deployer } = await getNamedAccounts()
                await raffle.enterRaffle({ value: raffleEntranceFee })
                const playerFromContract = await raffle.getPlayer(0)
                assert.equal(playerFromContract, deployer)
              })
              it("emits event on enter", async function () {
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee }))
                      .to.emit(raffle, "RaffleEntered")
              })
              it("doesn't allow entrance when raffle is calculating", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [raffleInterval + 1])
                  await network.provider.send("evm_mine", [])
                  // Pretend to be a Chainlink Keeper
                  await raffle.performUpKeep([])
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith(
                      "Raffle_NotOpen",
                  )
              })
          }) 
          describe("checkUpkeep", async function () {
              it("returns false if people haven't sent any ETH", async function () {
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert(!upkeepNeeded)
              })
              it("returns false if raffle isn't open", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [raffleInterval + 1])
                  await network.provider.send("evm_mine", [])
                  await raffle.performUpKeep([])
                  const raffleState = await raffle.getRaffleState()
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert.equal(raffleState.toString(), "1")
                  assert(!upkeepNeeded)
              })
              it("returns false if enough time hasn't passed", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert(!upkeepNeeded)
              })
              it("returns true if enough time has passed, has players, eth, and is open", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [raffleInterval + 1])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert(upkeepNeeded)
              })
            })
            describe("performUpKeep",async function(){
                it("it can only run if checkUpkeep is true", async function () {
                    await raffle.enterRaffle({ value: raffleEntranceFee })
                    await network.provider.send("evm_increaseTime", [raffleInterval + 1])
                    await network.provider.send("evm_mine", [])
                    const tx = await raffle.performUpKeep([])
                    assert(tx)
                })
                it("reverts when checkUpkeep is false", async function () {
                    await expect(raffle.performUpKeep([])).to.be.revertedWith(
                        "Raffle_UpkeepNotNeeded",
                    )
                })
                it("updates the raffle state, emits an event, and calls the vrf coordinator", async function () {
                    await raffle.enterRaffle({ value: raffleEntranceFee })
                    await network.provider.send("evm_increaseTime", [raffleInterval + 1])
                    await network.provider.send("evm_mine", [])
                    const txResponse = await raffle.performUpKeep([])
                    const txReceipt = await txResponse.wait(1)
                    const requestId = txReceipt.events[1].args.requestId
                    const raffleState = await raffle.getRaffleState()
                    assert(requestId.toNumber() > 0)
                    assert(raffleState.toString() == "1")    
              })
            })
           describe("fulfillRandomWords",async function(){
                beforeEach(async function(){
                    await raffle.enterRaffle({ value: raffleEntranceFee })
                    await network.provider.send("evm_increaseTime", [raffleInterval + 1])
                    await network.provider.send("evm_mine", [])
                }) 
            })
      
    })
