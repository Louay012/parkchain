import { useState, useEffect } from 'react'
import Header from './components/Header'
import ParkingSpotList from './components/ParkingSpotList'
import ReservationForm from './components/ReservationForm'
import QRCodeDisplay from './components/QRCodeDisplay'

interface ParkingSpot {
  tokenId: number;
  location: string;
  spotNumber: string;
  pricePerHour: string;
  isAvailable: boolean;
}

function App() {
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [qrCodeData, setQRCodeData] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');

  useEffect(() => {
    fetchParkingSpots();
  }, []);

  const fetchParkingSpots = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/parking/spots');
      const data = await response.json();
      setParkingSpots(data.spots);
    } catch (error) {
      console.error('Error fetching parking spots:', error);
      // Use default data if backend is not available
      setParkingSpots([
        {
          tokenId: 0,
          location: "Downtown Plaza",
          spotNumber: "A-101",
          pricePerHour: "0.01",
          isAvailable: true
        },
        {
          tokenId: 1,
          location: "City Center Mall",
          spotNumber: "B-205",
          pricePerHour: "0.015",
          isAvailable: true
        },
        {
          tokenId: 2,
          location: "Airport Parking",
          spotNumber: "C-310",
          pricePerHour: "0.02",
          isAvailable: true
        }
      ]);
    }
  };

  const handleSelectSpot = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
    setShowReservationForm(true);
    setQRCodeData(null);
  };

  const handleReservation = async (durationHours: number) => {
    if (!selectedSpot || !walletAddress) return;

    try {
      // Generate QR code for the reservation
      const response = await fetch('http://localhost:3001/api/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId: selectedSpot.tokenId,
          location: selectedSpot.location,
          spotNumber: selectedSpot.spotNumber,
          pricePerHour: selectedSpot.pricePerHour,
        }),
      });

      const data = await response.json();
      setQRCodeData(data.qrCode);
      setShowReservationForm(false);
    } catch (error) {
      console.error('Error creating reservation:', error);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setWalletAddress(accounts[0]);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('Please install MetaMask to use this application');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        walletAddress={walletAddress} 
        onConnectWallet={connectWallet}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-park-dark mb-2">
            Welcome to ParkChain
          </h1>
          <p className="text-gray-600">
            Blockchain-powered parking management system
          </p>
        </div>

        {qrCodeData ? (
          <div className="mb-8">
            <QRCodeDisplay 
              qrCode={qrCodeData} 
              onClose={() => setQRCodeData(null)}
            />
          </div>
        ) : showReservationForm && selectedSpot ? (
          <div className="mb-8">
            <ReservationForm
              spot={selectedSpot}
              onReserve={handleReservation}
              onCancel={() => {
                setShowReservationForm(false);
                setSelectedSpot(null);
              }}
            />
          </div>
        ) : (
          <ParkingSpotList
            spots={parkingSpots}
            onSelectSpot={handleSelectSpot}
          />
        )}
      </main>
    </div>
  )
}

export default App
