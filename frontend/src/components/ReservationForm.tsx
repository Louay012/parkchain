import { useState } from 'react'

interface ParkingSpot {
  tokenId: number;
  location: string;
  spotNumber: string;
  pricePerHour: string;
  isAvailable: boolean;
}

interface ReservationFormProps {
  spot: ParkingSpot;
  onReserve: (durationHours: number) => void;
  onCancel: () => void;
}

function ReservationForm({ spot, onReserve, onCancel }: ReservationFormProps) {
  const [durationHours, setDurationHours] = useState(1);

  const calculateTotalCost = () => {
    return (parseFloat(spot.pricePerHour) * durationHours).toFixed(4);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReserve(durationHours);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-park-dark mb-6">
        Reserve Parking Spot
      </h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="font-semibold text-park-dark">{spot.location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Spot Number</p>
            <p className="font-semibold text-park-dark">{spot.spotNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Price per Hour</p>
            <p className="font-semibold text-park-blue">{spot.pricePerHour} ETH</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Token ID</p>
            <p className="font-semibold text-park-dark">#{spot.tokenId}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (hours)
          </label>
          <input
            type="number"
            min="1"
            max="24"
            value={durationHours}
            onChange={(e) => setDurationHours(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-park-blue focus:border-transparent"
          />
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-park-dark">
              Total Cost:
            </span>
            <span className="text-2xl font-bold text-park-blue">
              {calculateTotalCost()} ETH
            </span>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-park-blue text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Confirm Reservation
          </button>
        </div>
      </form>
    </div>
  )
}

export default ReservationForm
