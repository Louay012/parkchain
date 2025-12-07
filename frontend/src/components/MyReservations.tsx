import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

const PARKING_RESERVATION_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const PARKING_TOKEN_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const PARKING_RESERVATION_ABI = [
  "function getActiveUserReservations(address user) view returns (tuple(uint256 id, uint256 spotId, address user, uint256 startTime, uint256 endTime, uint256 amountPaid, bool isActive)[])",
  "function endReservation(uint256 reservationId)"
];

const PARKING_TOKEN_ABI = [
  "function getParkingSpot(uint256 tokenId) view returns (string location, string spotNumber, uint256 pricePerHour, bool isAvailable, string imageURI)"
];

interface Reservation {
  id: number;
  spotId: number;
  location: string;
  spotNumber: string;
  endTime: number;
  amountPaid: string;
  timeRemaining: number;
}

interface MyReservationsProps {
  walletAddress: string;
  onReservationEnded: () => void;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

const MyReservations: React.FC<MyReservationsProps> = ({ walletAddress, onReservationEnded }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    try {
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      const parkingReservation = new ethers.Contract(PARKING_RESERVATION_ADDRESS, PARKING_RESERVATION_ABI, provider);
      const parkingToken = new ethers.Contract(PARKING_TOKEN_ADDRESS, PARKING_TOKEN_ABI, provider);

      const rawReservations = await parkingReservation.getActiveUserReservations(walletAddress);

      const formattedReservations: Reservation[] = await Promise.all(
        rawReservations.map(async (r: any) => {
          const spotData = await parkingToken.getParkingSpot(r.spotId);
          return {
            id: Number(r.id),
            spotId: Number(r.spotId),
            location: spotData.location,
            spotNumber: spotData.spotNumber,
            endTime: Number(r.endTime) * 1000,
            amountPaid: ethers.formatEther(r.amountPaid),
            timeRemaining: Math.max(0, Number(r.endTime) * 1000 - Date.now())
          };
        })
      );

      setReservations(formattedReservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchReservations();
      const interval = setInterval(fetchReservations, 30000);
      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  const endReservation = async (reservationId: number) => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const parkingReservation = new ethers.Contract(PARKING_RESERVATION_ADDRESS, PARKING_RESERVATION_ABI, signer);

      const tx = await parkingReservation.endReservation(reservationId);
      await tx.wait();

      alert('Reservation ended on blockchain!');
      fetchReservations();
      onReservationEnded();
    } catch (error: any) {
      console.error('Error ending reservation:', error);
      alert(error.reason || error.message || 'Failed to end reservation');
    }
  };

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Expired';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-500">
        Loading reservations from blockchain...
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-500">
        No active reservations
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">My Active Reservations 🔗</h3>
      {reservations.map(reservation => (
        <div key={reservation.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">{reservation.location}</p>
              <p className="text-gray-600">Spot: {reservation.spotNumber}</p>
              <p className="text-sm text-gray-500">
                Ends: {new Date(reservation.endTime).toLocaleString()}
              </p>
              <p className={`text-sm font-medium ${reservation.timeRemaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatTimeRemaining(reservation.timeRemaining)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Paid: {reservation.amountPaid} ETH
              </p>
            </div>
            <button
              onClick={() => endReservation(reservation.id)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
            >
              End Early
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyReservations;