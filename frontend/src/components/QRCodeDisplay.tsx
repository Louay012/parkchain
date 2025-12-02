interface QRCodeDisplayProps {
  qrCode: string;
  onClose: () => void;
}

function QRCodeDisplay({ qrCode, onClose }: QRCodeDisplayProps) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-park-dark mb-4">
          Reservation Confirmed! 🎉
        </h2>
        <p className="text-gray-600 mb-6">
          Scan this QR code to access your parking spot
        </p>

        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <img 
            src={qrCode} 
            alt="Parking Token QR Code" 
            className="mx-auto"
          />
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              ✓ Payment processed successfully
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ℹ Show this QR code at the parking entrance
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-park-blue text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          Back to Parking Spots
        </button>
      </div>
    </div>
  )
}

export default QRCodeDisplay
