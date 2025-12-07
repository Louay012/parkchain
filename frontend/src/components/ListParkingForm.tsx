import React, { useState } from 'react';

interface ListParkingFormProps {
  walletAddress: string;
  onSuccess: (location: string, spotNumber: string, pricePerHour: string, imageUrl: string) => void;
  onCancel: () => void;
}

const ListParkingForm: React.FC<ListParkingFormProps> = ({ walletAddress, onSuccess, onCancel }) => {
  const [location, setLocation] = useState('');
  const [spotNumber, setSpotNumber] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess(location, spotNumber, pricePerHour, imageUrl);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">List Your Parking Spot</h2>
      <p className="text-sm text-gray-500 mb-4">
        🔗 This will mint an NFT on the blockchain representing your parking spot.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Downtown Plaza"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Spot Number</label>
          <input
            type="text"
            value={spotNumber}
            onChange={(e) => setSpotNumber(e.target.value)}
            placeholder="e.g., A-101"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Price per Hour (ETH)</label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={pricePerHour}
            onChange={(e) => setPricePerHour(e.target.value)}
            placeholder="e.g., 0.01"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Image URL (optional)</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
          ⚠️ You will be the owner of this parking spot NFT. Payments from reservations will go directly to your wallet.
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          >
            Mint on Blockchain
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

export default ListParkingForm;