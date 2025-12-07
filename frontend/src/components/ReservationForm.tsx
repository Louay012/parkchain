import React, { useState } from 'react';

interface ParkingSpot {
  tokenId: number;
  location: string;
  spotNumber: string;
  pricePerHour: string;
  isAvailable: boolean;
  ownerAddress: string;
}

interface ReservationFormProps {
  spot: ParkingSpot;
  onReserve: (durationHours: number) => void;
  onCancel: () => void;
}

const ReservationForm: React.FC<ReservationFormProps> = ({ spot, onReserve, onCancel }) => {
  const [durationHours, setDurationHours] = useState(1);

  const totalPrice = (parseFloat(spot.pricePerHour) * durationHours).toFixed(4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReserve(durationHours);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Reserve Parking Spot</h2>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <p className="font-semibold">{spot.location}</p>
        <p className="text-gray-600">Spot: {spot.spotNumber}</p>
        <p className="text-gray-600">Price: {spot.pricePerHour} ETH/hour</p>
        <p className="text-xs text-gray-400 mt-2">
          Owner: {spot.ownerAddress.slice(0, 6)}...{spot.ownerAddress.slice(-4)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Duration (hours)</label>
          <input
            type="number"
            min="1"
            max="24"
            value={durationHours}
            onChange={(e) => setDurationHours(parseInt(e.target.value) || 1)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-lg font-bold text-blue-800">
            Total: {totalPrice} ETH
          </p>
          <p className="text-sm text-blue-600">
            Payment goes directly to the spot owner
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Pay & Reserve
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReservationForm;