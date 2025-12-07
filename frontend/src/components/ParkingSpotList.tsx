import React from 'react';

interface ParkingSpot {
  tokenId: number;
  location: string;
  spotNumber: string;
  pricePerHour: string;
  isAvailable: boolean;
  ownerAddress: string;
}

interface ParkingSpotListProps {
  spots: ParkingSpot[];
  onSelectSpot: (spot: ParkingSpot) => void;
}

const ParkingSpotList: React.FC<ParkingSpotListProps> = ({ spots = [], onSelectSpot }) => {
  if (!spots || spots.length === 0) {
    return (
      <div className="bg-gray-100 p-6 rounded-lg text-center text-gray-500">
        No parking spots available. Be the first to list one!
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Available Parking Spots</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {spots.map((spot) => (
          <div
            key={spot.tokenId}
            className={`p-4 rounded-lg shadow-md border-2 ${
              spot.isAvailable 
                ? 'bg-white border-green-200' 
                : 'bg-gray-100 border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{spot.location}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                spot.isAvailable 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {spot.isAvailable ? 'Available' : 'Reserved'}
              </span>
            </div>
            
            <p className="text-gray-600">Spot: {spot.spotNumber}</p>
            <p className="text-gray-600">Price: {spot.pricePerHour} ETH/hour</p>
            <p className="text-xs text-gray-400 mt-2 truncate">
              Owner: {spot.ownerAddress.slice(0, 6)}...{spot.ownerAddress.slice(-4)}
            </p>

            {spot.isAvailable && (
              <button
                onClick={() => onSelectSpot(spot)}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                Reserve Now
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParkingSpotList;