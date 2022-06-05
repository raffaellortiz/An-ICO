const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { DRAGON_DEV_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main() {

  const dragonDevNFTContract = DRAGON_DEV_NFT_CONTRACT_ADDRESS;
  const dragonDevTokenContract = await ethers.getContractFactory("DragonDevToken");
  const deployedDragonDevTokenContract = await dragonDevTokenContract.deploy(dragonDevNFTContract);
  
  console.log("Dragon Dev Token Contract Address:", deployedDragonDevTokenContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });