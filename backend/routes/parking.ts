import express, { Request, Response } from 'express';
import { ethers } from 'ethers';

const router = express.Router();

// In-memory storage for demo purposes
// In production, use a database
interface ParkingSpotData {
  tokenId: number;
  location: string;
  spotNumber: string;
  pricePerHour: string;
  isAvailable: boolean;
  ownerAddress: string; // Owner's wallet address
}

let nextTokenId = 3; // Start after the initial demo spots

let parkingSpots: ParkingSpotData[] = [
  {
    tokenId: 0,
    location: "Downtown Plaza",
    spotNumber: "A-101",
    pricePerHour: "0.01",
    isAvailable: true,
    ownerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" // Default deployer
  },
  {
    tokenId: 1,
    location: "City Center Mall",
    spotNumber: "B-205",
    pricePerHour: "0.015",
    isAvailable: true,
    ownerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  },
  {
    tokenId: 2,
    location: "Airport Parking",
    spotNumber: "C-310",
    pricePerHour: "0.02",
    isAvailable: true,
    ownerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  }
];

// GET all parking spots
router.get('/spots', (req: Request, res: Response) => {
  res.json({ spots: parkingSpots });
});

// GET specific parking spot
router.get('/spots/:tokenId', (req: Request, res: Response) => {
  const tokenId = parseInt(req.params.tokenId);
  const spot = parkingSpots.find(s => s.tokenId === tokenId);
  
  if (!spot) {
    return res.status(404).json({ error: 'Parking spot not found' });
  }
  
  res.json({ spot });
});

// POST create a new parking spot (for park owners to list their spots)
router.post('/spots', (req: Request, res: Response) => {
  const { ownerAddress, location, spotNumber, pricePerHour, imageUri } = req.body;
  
  if (!ownerAddress || !location || !spotNumber || !pricePerHour) {
    return res.status(400).json({ error: 'Missing required fields: ownerAddress, location, spotNumber, pricePerHour' });
  }
  
  // Validate Ethereum address
  if (!ethers.isAddress(ownerAddress)) {
    return res.status(400).json({ error: 'Invalid owner address' });
  }
  
  // Create new parking spot
  const newSpot: ParkingSpotData = {
    tokenId: nextTokenId++,
    location,
    spotNumber,
    pricePerHour: pricePerHour.toString(),
    isAvailable: true,
    ownerAddress
  };
  
  parkingSpots.push(newSpot);
  
  res.json({ 
    success: true, 
    message: 'Parking spot listed successfully!',
    spot: newSpot 
  });
});

// GET spots owned by a specific address
router.get('/spots/owner/:address', (req: Request, res: Response) => {
  const ownerAddress = req.params.address;
  const ownedSpots = parkingSpots.filter(s => s.ownerAddress.toLowerCase() === ownerAddress.toLowerCase());
  res.json({ spots: ownedSpots });
});

// POST create reservation
router.post('/reservations', (req: Request, res: Response) => {
  const { tokenId, renter, durationHours } = req.body;
  
  if (tokenId === undefined || !renter || !durationHours) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const spot = parkingSpots.find(s => s.tokenId === tokenId);
  
  if (!spot) {
    return res.status(404).json({ error: 'Parking spot not found' });
  }
  
  if (!spot.isAvailable) {
    return res.status(400).json({ error: 'Parking spot not available' });
  }
  
  // Calculate total cost
  const totalCost = parseFloat(spot.pricePerHour) * durationHours;
  
  // Create reservation (simplified for demo)
  // In production, the frontend calls the smart contract directly
  // which handles the payment to the owner
  const reservation = {
    reservationId: Date.now(),
    tokenId,
    renter,
    ownerAddress: spot.ownerAddress, // Include owner address for payment
    durationHours,
    totalCost: totalCost.toString(),
    totalCostWei: ethers.parseEther(totalCost.toString()).toString(),
    startTime: new Date().toISOString(),
    status: 'active'
  };
  
  // Update spot availability
  spot.isAvailable = false;
  
  res.json({ reservation });
});

// GET reservation history
router.get('/reservations/:address', (req: Request, res: Response) => {
  const address = req.params.address;
  
  // In production, fetch from blockchain or database
  res.json({ 
    reservations: [],
    message: 'Reservation history for ' + address 
  });
});

export default router;
