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

  // Mint example parking spots
  console.log("Minting example parking spots...");
  const [deployer] = await ethers.getSigners();

  // Set availability period: from now to 30 days from now
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysFromNow = now + (30 * 24 * 60 * 60);

  await (await parkingToken.mintParkingSpot(
    deployer.address,
    "Downtown Plaza",
    "A-101",
    ethers.parseEther("0.01"),
    "ipfs://QmExample1",
    now,
    thirtyDaysFromNow
  )).wait();
  console.log("Minted: Downtown Plaza A-101");

  await (await parkingToken.mintParkingSpot(
    deployer.address,
    "City Center Mall",
    "B-205",
    ethers.parseEther("0.015"),
    "ipfs://QmExample2",
    now,
    thirtyDaysFromNow
  )).wait();
  console.log("Minted: City Center Mall B-205");

  await (await parkingToken.mintParkingSpot(
    deployer.address,
    "Airport Parking",
    "C-310",
    ethers.parseEther("0.02"),
    "ipfs://QmExample3",
    now,
    thirtyDaysFromNow
  )).wait();
  console.log("Minted: Airport Parking C-310");

  console.log("\n✅ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });