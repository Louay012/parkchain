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
}

let parkingSpots: ParkingSpotData[] = [
  {
    tokenId: 0,
    location: "Downtown Plaza",
    spotNumber: "A-101",
    pricePerHour: "0.01",
    isAvailable: true
  },
  {
    tokenId: 1,
    location: "City Center Mall",
    spotNumber: "B-205",
    pricePerHour: "0.015",
    isAvailable: true
  },
  {
    tokenId: 2,
    location: "Airport Parking",
    spotNumber: "C-310",
    pricePerHour: "0.02",
    isAvailable: true
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

// POST create reservation
router.post('/reservations', (req: Request, res: Response) => {
  const { tokenId, renter, durationHours } = req.body;
  
  if (!tokenId || !renter || !durationHours) {
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
  const reservation = {
    reservationId: Date.now(),
    tokenId,
    renter,
    durationHours,
    totalCost: totalCost.toString(),
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
