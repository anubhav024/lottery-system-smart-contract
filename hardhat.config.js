require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()


/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  defaultNetwork: "hardhat",
  networks:{
    hardhat:{
      chainId:31337,
      blockConfirmations:1, // This is used for local testing, so we set it to 1
    },
    sepolia:{
      chainId:11155111,
      blockConfirmations:6, // This is used for testnet, so we set it to 6
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  solidity: "0.8.28",
  namedAccounts: {
      deployer: {
          default: 0, // here this will by default take the first account as deployer
        },
        player: {
          default: 1, // here this will by default take the second account as player
        },
    },
    gasReporter: {
        enabled: false,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
}
