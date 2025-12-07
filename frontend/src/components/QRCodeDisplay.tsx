import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  data: string;
  onClose: () => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ data, onClose }) => {
  let parsedData: any = null;
  try {
    parsedData = JSON.parse(data);
  } catch {
    parsedData = null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4 text-green-600">✅ Reservation Confirmed!</h2>
      
      <div className="bg-white p-4 inline-block rounded-lg border-2 border-gray-200 mb-4">
        <QRCodeSVG value={data} size={200} />
      </div>

      {parsedData && (
        <div className="text-left bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">Reservation Details:</h3>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-600">Location:</span> {parsedData.location}</p>
            <p><span className="text-gray-600">Spot:</span> {parsedData.spotNumber}</p>
            <p><span className="text-gray-600">Ends at:</span> {parsedData.endTime}</p>
            <p><span className="text-gray-600">Amount Paid:</span> {parsedData.amountPaid}</p>
            <p><span className="text-gray-600">Reservation ID:</span> {parsedData.reservationId}</p>
            <p className="text-xs text-gray-400 mt-2 truncate">
              TX: {parsedData.transactionHash}
            </p>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500 mb-4">
        🔗 Stored on blockchain • Show this QR code at the parking spot
      </p>

      <button
        onClick={onClose}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition w-full"
      >
        Done
      </button>
    </div>
  );
};

export default QRCodeDisplay;