const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("Deploying ParkChain contracts...\n");

  // Deploy ParkingToken
  const ParkingToken = await ethers.getContractFactory("ParkingToken");
  const parkingToken = await ParkingToken.deploy();
  await parkingToken.waitForDeployment();
  const parkingTokenAddress = await parkingToken.getAddress();
  console.log(`ParkingToken deployed to: ${parkingTokenAddress}`);

  // Deploy ParkingReservation
  const ParkingReservation = await ethers.getContractFactory("ParkingReservation");
  const parkingReservation = await ParkingReservation.deploy(parkingTokenAddress);
  await parkingReservation.waitForDeployment();
  const parkingReservationAddress = await parkingReservation.getAddress();
  console.log(`ParkingReservation deployed to: ${parkingReservationAddress}`);

  // Link ParkingReservation to ParkingToken (so it can change availability)
  const tx = await parkingToken.setReservationContract(parkingReservationAddress);
  await tx.wait();
  console.log(`ParkingToken linked to ParkingReservation`);

  console.log("\n=== Deployment Summary ===");
  console.log(`ParkingToken: ${parkingTokenAddress}`);
  console.log(`ParkingReservation: ${parkingReservationAddress}`);
  console.log("==========================\n");

  console.log("✅ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });