interface ParkingSpot {
  tokenId: number;
  location: string;
  spotNumber: string;
  pricePerHour: string;
  isAvailable: boolean;
  ownerAddress?: string;
}

interface ParkingSpotListProps {
  spots: ParkingSpot[];
  onSelectSpot: (spot: ParkingSpot) => void;
}

function ParkingSpotList({ spots, onSelectSpot }: ParkingSpotListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {spots.map((spot) => (
        <div
          key={spot.tokenId}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-park-dark mb-1">
                {spot.location}
              </h3>
              <p className="text-gray-500 text-sm">Spot #{spot.spotNumber}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                spot.isAvailable
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {spot.isAvailable ? 'Available' : 'Occupied'}
            </span>
          </div>

          <div className="mb-4">
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-park-blue">
                {spot.pricePerHour}
              </span>
              <span className="text-gray-600 ml-2">ETH/hour</span>
            </div>
            {spot.ownerAddress && (
              <p className="text-xs text-gray-500 mt-1">
                Owner: {spot.ownerAddress.slice(0, 6)}...{spot.ownerAddress.slice(-4)}
              </p>
            )}
          </div>

          <button
            onClick={() => onSelectSpot(spot)}
            disabled={!spot.isAvailable}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              spot.isAvailable
                ? 'bg-park-blue text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {spot.isAvailable ? 'Reserve Now' : 'Not Available'}
          </button>
        </div>
      ))}
    </div>
  )
}

export default ParkingSpotList
