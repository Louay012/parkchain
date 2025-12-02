import { expect } from "chai";
import { ethers } from "hardhat";
import { ParkingToken } from "../types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ParkingToken", function () {
  let parkingToken: ParkingToken;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const ParkingToken = await ethers.getContractFactory("ParkingToken");
    parkingToken = await ParkingToken.deploy();
    await parkingToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await parkingToken.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await parkingToken.name()).to.equal("ParkingToken");
      expect(await parkingToken.symbol()).to.equal("PARK");
    });
  });

  describe("Minting", function () {
    it("Should mint a parking spot token", async function () {
      await parkingToken.mintParkingSpot(
        addr1.address,
        "Downtown",
        "A-101",
        ethers.parseEther("0.01"),
        "ipfs://test"
      );

      expect(await parkingToken.ownerOf(0)).to.equal(addr1.address);
      
      const spot = await parkingToken.getParkingSpot(0);
      expect(spot.location).to.equal("Downtown");
      expect(spot.spotNumber).to.equal("A-101");
      expect(spot.pricePerHour).to.equal(ethers.parseEther("0.01"));
      expect(spot.isAvailable).to.equal(true);
    });

    it("Should only allow owner to mint", async function () {
      await expect(
        parkingToken.connect(addr1).mintParkingSpot(
          addr2.address,
          "Downtown",
          "A-101",
          ethers.parseEther("0.01"),
          "ipfs://test"
        )
      ).to.be.reverted;
    });

    it("Should emit ParkingSpotCreated event", async function () {
      await expect(
        parkingToken.mintParkingSpot(
          addr1.address,
          "Downtown",
          "A-101",
          ethers.parseEther("0.01"),
          "ipfs://test"
        )
      ).to.emit(parkingToken, "ParkingSpotCreated");
    });
  });

  describe("Availability Management", function () {
    beforeEach(async function () {
      await parkingToken.mintParkingSpot(
        addr1.address,
        "Downtown",
        "A-101",
        ethers.parseEther("0.01"),
        "ipfs://test"
      );
    });

    it("Should allow owner to change availability", async function () {
      await parkingToken.connect(addr1).setAvailability(0, false);
      const spot = await parkingToken.getParkingSpot(0);
      expect(spot.isAvailable).to.equal(false);
    });

    it("Should allow contract owner to change availability", async function () {
      await parkingToken.connect(owner).setAvailability(0, false);
      const spot = await parkingToken.getParkingSpot(0);
      expect(spot.isAvailable).to.equal(false);
    });

    it("Should not allow unauthorized users to change availability", async function () {
      await expect(
        parkingToken.connect(addr2).setAvailability(0, false)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Price Management", function () {
    beforeEach(async function () {
      await parkingToken.mintParkingSpot(
        addr1.address,
        "Downtown",
        "A-101",
        ethers.parseEther("0.01"),
        "ipfs://test"
      );
    });

    it("Should allow owner to update price", async function () {
      await parkingToken.connect(addr1).updatePrice(0, ethers.parseEther("0.02"));
      const spot = await parkingToken.getParkingSpot(0);
      expect(spot.pricePerHour).to.equal(ethers.parseEther("0.02"));
    });

    it("Should not allow unauthorized users to update price", async function () {
      await expect(
        parkingToken.connect(addr2).updatePrice(0, ethers.parseEther("0.02"))
      ).to.be.revertedWith("Not authorized");
    });
  });
});
