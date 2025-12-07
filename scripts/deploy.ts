const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("Deploying ParkChain contracts...");

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

  // Deploy PaymentProcessor
  const PaymentProcessor = await ethers.getContractFactory("PaymentProcessor");
  const paymentProcessor = await PaymentProcessor.deploy();
  await paymentProcessor.waitForDeployment();
  const paymentProcessorAddress = await paymentProcessor.getAddress();
  console.log(`PaymentProcessor deployed to: ${paymentProcessorAddress}`);

  console.log("\n=== Deployment Summary ===");
  console.log(`ParkingToken: ${parkingTokenAddress}`);
  console.log(`ParkingReservation: ${parkingReservationAddress}`);
  console.log(`PaymentProcessor: ${paymentProcessorAddress}`);
  console.log("==========================\n");

  // Mint some example parking spots
  console.log("Minting example parking spots...");
  const [deployer] = await ethers.getSigners();
  
  const tx1 = await parkingToken.mintParkingSpot(
    deployer.address,
    "Downtown Plaza",
    "A-101",
    ethers.parseEther("0.01"),
    "ipfs://QmExample1"
  );
  await tx1.wait();
  console.log("Minted parking spot: Downtown Plaza A-101");

  const tx2 = await parkingToken.mintParkingSpot(
    deployer.address,
    "City Center Mall",
    "B-205",
    ethers.parseEther("0.015"),
    "ipfs://QmExample2"
  );
  await tx2.wait();
  console.log("Minted parking spot: City Center Mall B-205");

  const tx3 = await parkingToken.mintParkingSpot(
    deployer.address,
    "Airport Parking",
    "C-310",
    ethers.parseEther("0.02"),
    "ipfs://QmExample3"
  );
  await tx3.wait();
  console.log("Minted parking spot: Airport Parking C-310");

  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
