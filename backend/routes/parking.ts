import { Router } from 'express';

const router = Router();

interface ParkingSpot {
  tokenId: number;
  location: string;
  spotNumber: string;
  pricePerHour: string;
  isAvailable: boolean;
  ownerAddress: string;
  imageUrl?: string;
}

interface Reservation {
  id: number;
  spotId: number;
  userAddress: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
}

// In-memory storage (replace with database in production)
let parkingSpots: ParkingSpot[] = [
  {
    tokenId: 1,
    location: "Downtown Plaza",
    spotNumber: "A-101",
    pricePerHour: "0.01",
    isAvailable: true,
    ownerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  },
  {
    tokenId: 2,
    location: "City Center Mall",
    spotNumber: "B-205",
    pricePerHour: "0.015",
    isAvailable: true,
    ownerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  },
  {
    tokenId: 3,
    location: "Airport Parking",
    spotNumber: "C-310",
    pricePerHour: "0.02",
    isAvailable: true,
    ownerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  }
];

let reservations: Reservation[] = [];
let nextReservationId = 1;

// Check and update expired reservations
const updateExpiredReservations = () => {
  const now = Date.now();
  
  reservations.forEach(reservation => {
    if (reservation.isActive && reservation.endTime <= now) {
      // Reservation has expired
      reservation.isActive = false;
      
      // Make the spot available again
      const spot = parkingSpots.find(s => s.tokenId === reservation.spotId);
      if (spot) {
        spot.isAvailable = true;
        console.log(`Spot ${spot.spotNumber} is now available (reservation expired)`);
      }
    }
  });
};

// Run expiration check every minute
setInterval(updateExpiredReservations, 60 * 1000);

// GET all parking spots
router.get('/spots', (req, res) => {
  updateExpiredReservations(); // Check for expired reservations
  res.json(parkingSpots);
});

// GET spots by owner
router.get('/spots/owner/:address', (req, res) => {
  const ownerSpots = parkingSpots.filter(
    spot => spot.ownerAddress.toLowerCase() === req.params.address.toLowerCase()
  );
  res.json(ownerSpots);
});

// POST create a new parking spot
router.post('/spots', (req, res) => {
  const { ownerAddress, location, spotNumber, pricePerHour, imageUrl } = req.body;

  if (!ownerAddress || !location || !spotNumber || !pricePerHour) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newSpot: ParkingSpot = {
    tokenId: parkingSpots.length + 1,
    location,
    spotNumber,
    pricePerHour,
    isAvailable: true,
    ownerAddress,
    imageUrl
  };

  parkingSpots.push(newSpot);
  res.status(201).json({ success: true, spot: newSpot });
});

// POST create a reservation
router.post('/reservations', (req, res) => {
  const { spotId, userAddress, durationHours } = req.body;

  if (!spotId || !userAddress || !durationHours) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Find the spot
  const spot = parkingSpots.find(s => s.tokenId === spotId);
  if (!spot) {
    return res.status(404).json({ error: 'Parking spot not found' });
  }

  // Check if spot is available
  updateExpiredReservations();
  if (!spot.isAvailable) {
    return res.status(400).json({ error: 'Parking spot is not available' });
  }

  // Create reservation
  const now = Date.now();
  const reservation: Reservation = {
    id: nextReservationId++,
    spotId,
    userAddress,
    startTime: now,
    endTime: now + (durationHours * 60 * 60 * 1000), // Convert hours to milliseconds
    isActive: true
  };

  reservations.push(reservation);

  // Mark spot as unavailable
  spot.isAvailable = false;

  console.log(`Spot ${spot.spotNumber} reserved by ${userAddress} for ${durationHours} hours`);
  console.log(`Reservation ends at: ${new Date(reservation.endTime).toLocaleString()}`);

  res.status(201).json({
    success: true,
    reservation: {
      ...reservation,
      spot,
      endTimeFormatted: new Date(reservation.endTime).toLocaleString()
    }
  });
});

// GET active reservations for a user
router.get('/reservations/user/:address', (req, res) => {
  updateExpiredReservations();
  
  const userReservations = reservations
    .filter(r => r.userAddress.toLowerCase() === req.params.address.toLowerCase() && r.isActive)
    .map(r => {
      const spot = parkingSpots.find(s => s.tokenId === r.spotId);
      return {
        ...r,
        spot,
        endTimeFormatted: new Date(r.endTime).toLocaleString(),
        timeRemaining: Math.max(0, r.endTime - Date.now())
      };
    });

  res.json(userReservations);
});

// GET all active reservations
router.get('/reservations', (req, res) => {
  updateExpiredReservations();
  
  const activeReservations = reservations
    .filter(r => r.isActive)
    .map(r => {
      const spot = parkingSpots.find(s => s.tokenId === r.spotId);
      return {
        ...r,
        spot,
        endTimeFormatted: new Date(r.endTime).toLocaleString(),
        timeRemaining: Math.max(0, r.endTime - Date.now())
      };
    });

  res.json(activeReservations);
});

// POST manually end a reservation (early checkout)
router.post('/reservations/:id/end', (req, res) => {
  const reservationId = parseInt(req.params.id);
  const reservation = reservations.find(r => r.id === reservationId);

  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  if (!reservation.isActive) {
    return res.status(400).json({ error: 'Reservation is already ended' });
  }

  // End the reservation
  reservation.isActive = false;
  reservation.endTime = Date.now();

  // Make spot available
  const spot = parkingSpots.find(s => s.tokenId === reservation.spotId);
  if (spot) {
    spot.isAvailable = true;
  }

  res.json({ success: true, message: 'Reservation ended', spot });
});

export default router;