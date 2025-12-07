import { useState } from 'react';

interface ListParkingFormProps {
  walletAddress: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function ListParkingForm({ walletAddress, onSuccess, onCancel }: ListParkingFormProps) {
  const [location, setLocation] = useState('');
  const [spotNumber, setSpotNumber] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3001/api/parking/spots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerAddress: walletAddress,
          location,
          spotNumber,
          pricePerHour,
          imageUri: `ipfs://QmExample${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to list parking spot');
      }

      alert(`Parking spot listed successfully! Token ID: ${data.spot.tokenId}`);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to list parking spot');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-park-dark mb-4">
        List Your Parking Spot
      </h2>
      <p className="text-gray-600 mb-4">
        Connected Wallet: <span className="font-mono text-sm">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Downtown Plaza"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-park-primary focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Spot Number
          </label>
          <input
            type="text"
            value={spotNumber}
            onChange={(e) => setSpotNumber(e.target.value)}
            placeholder="e.g., A-101"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-park-primary focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Price per Hour (ETH)
          </label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={pricePerHour}
            onChange={(e) => setPricePerHour(e.target.value)}
            placeholder="e.g., 0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-park-primary focus:border-transparent"
            required
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-zinc-800 text-white py-2 px-4 rounded-lg hover:bg-park-secondary transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Listing...' : 'Add Parking Spot'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Your parking spot will be listed on the marketplace</li>
          <li>• When someone reserves your spot, they pay you directly</li>
          <li>• Payments are processed through the blockchain</li>
        </ul>
      </div>
    </div>
  );
}

export default ListParkingForm;
