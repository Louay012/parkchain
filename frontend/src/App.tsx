import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Header from './components/Header';
import ParkingSpotList from './components/ParkingSpotList';
import ReservationForm from './components/ReservationForm';
import QRCodeDisplay from './components/QRCodeDisplay';
import ListParkingForm from './components/ListParkingForm';
import MyReservations from './components/MyReservations';


const PARKING_TOKEN_ADDRESS = '0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9';
const PARKING_RESERVATION_ADDRESS = '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9';
// Contract ABIs (simplified)
const PARKING_TOKEN_ABI = [
  "function totalSupply() view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getParkingSpot(uint256 tokenId) view returns (string location, string spotNumber, uint256 pricePerHour, bool isAvailable, string imageURI)",
  "function mintParkingSpot(address to, string location, string spotNumber, uint256 pricePerHour, string imageURI) returns (uint256)"
];

const PARKING_RESERVATION_ABI = [
  "function createReservation(uint256 spotId, uint256 durationHours) payable",
  "function endReservation(uint256 reservationId)",
  "function getReservation(uint256 reservationId) view returns (tuple(uint256 id, uint256 spotId, address user, uint256 startTime, uint256 endTime, uint256 amountPaid, bool isActive))",
  "function getActiveUserReservations(address user) view returns (tuple(uint256 id, uint256 spotId, address user, uint256 startTime, uint256 endTime, uint256 amountPaid, bool isActive)[])",
  "function isSpotAvailable(uint256 spotId) view returns (bool)",
  "event ReservationCreated(uint256 indexed reservationId, uint256 indexed spotId, address indexed user, uint256 startTime, uint256 endTime, uint256 amountPaid)"
];

interface ParkingSpot {
  tokenId: number;
  location: string;
  spotNumber: string;
  pricePerHour: string;
  isAvailable: boolean;
  ownerAddress: string;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

function App() {
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [showListForm, setShowListForm] = useState(false);
  const [qrCodeData, setQRCodeData] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchParkingSpots();
  }, []);

  const getProvider = () => {
    if (!window.ethereum) throw new Error('Please install MetaMask');
    return new ethers.BrowserProvider(window.ethereum);
  };

  const fetchParkingSpots = async () => {
    try {
      const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      const parkingToken = new ethers.Contract(PARKING_TOKEN_ADDRESS, PARKING_TOKEN_ABI, provider);
      const parkingReservation = new ethers.Contract(PARKING_RESERVATION_ADDRESS, PARKING_RESERVATION_ABI, provider);

      const totalSupply = await parkingToken.totalSupply();
      const spots: ParkingSpot[] = [];

      for (let i = 1; i <= Number(totalSupply); i++) {
        try {
          const spotData = await parkingToken.getParkingSpot(i);
          const owner = await parkingToken.ownerOf(i);
          const isAvailable = await parkingReservation.isSpotAvailable(i);

          spots.push({
            tokenId: i,
            location: spotData.location,
            spotNumber: spotData.spotNumber,
            pricePerHour: ethers.formatEther(spotData.pricePerHour),
            isAvailable: isAvailable,
            ownerAddress: owner
          });
        } catch (error) {
          console.error(`Error fetching spot ${i}:`, error);
        }
      }

      setParkingSpots(spots);
    } catch (error) {
      console.error('Error fetching parking spots:', error);
      setParkingSpots([]);
    }
  };

  const handleSelectSpot = (spot: ParkingSpot) => {
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }
    setSelectedSpot(spot);
    setShowReservationForm(true);
    setQRCodeData(null);
  };

  const handleReservation = async (durationHours: number) => {
    if (!selectedSpot || !walletAddress) return;

    try {
      setLoading(true);
      const provider = getProvider();
      const signer = await provider.getSigner();

      const parkingReservation = new ethers.Contract(
        PARKING_RESERVATION_ADDRESS,
        PARKING_RESERVATION_ABI,
        signer
      );

      // Calculate total price
      const pricePerHour = ethers.parseEther(selectedSpot.pricePerHour);
      const totalPrice = pricePerHour * BigInt(durationHours);

      console.log(`Reserving spot ${selectedSpot.tokenId} for ${durationHours} hours`);
      console.log(`Total price: ${ethers.formatEther(totalPrice)} ETH`);

      // Create reservation on blockchain with payment
      const tx = await parkingReservation.createReservation(
        selectedSpot.tokenId,
        durationHours,
        { value: totalPrice }
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);

      // Parse event to get reservation ID
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = parkingReservation.interface.parseLog(log);
          return parsed?.name === 'ReservationCreated';
        } catch {
          return false;
        }
      });

      let reservationId = 'N/A';
      let endTime = new Date(Date.now() + durationHours * 60 * 60 * 1000).toLocaleString();
      
      if (event) {
        const parsed = parkingReservation.interface.parseLog(event);
        if (parsed) {
          reservationId = parsed.args[0].toString();
          endTime = new Date(Number(parsed.args[4]) * 1000).toLocaleString();
        }
      }

      // Generate QR code with blockchain data
      const qrData = JSON.stringify({
        reservationId,
        transactionHash: receipt.hash,
        spotId: selectedSpot.tokenId,
        location: selectedSpot.location,
        spotNumber: selectedSpot.spotNumber,
        endTime,
        userAddress: walletAddress,
        amountPaid: ethers.formatEther(totalPrice) + ' ETH',
        blockchain: 'Hardhat Local'
      });

      setShowReservationForm(false);
      setSelectedSpot(null);
      setQRCodeData(qrData);

      await fetchParkingSpots();

    } catch (error: any) {
      console.error('Error creating reservation:', error);
      alert(error.reason || error.message || 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleListSpot = async (location: string, spotNumber: string, pricePerHour: string, imageUrl: string) => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      const provider = getProvider();
      const signer = await provider.getSigner();

      const parkingToken = new ethers.Contract(
        PARKING_TOKEN_ADDRESS,
        PARKING_TOKEN_ABI,
        signer
      );

      const priceInWei = ethers.parseEther(pricePerHour);

      const tx = await parkingToken.mintParkingSpot(
        walletAddress,
        location,
        spotNumber,
        priceInWei,
        imageUrl || ''
      );

      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Parking spot minted on blockchain!');

      setShowListForm(false);
      await fetchParkingSpots();
      alert('Parking spot listed successfully on blockchain!');

    } catch (error: any) {
      console.error('Error listing spot:', error);
      alert(error.reason || error.message || 'Failed to list parking spot');
    } finally {
      setLoading(false);
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

  const disconnectWallet = () => {
    setWalletAddress('');
    setSelectedSpot(null);
    setShowReservationForm(false);
    setShowListForm(false);
    setQRCodeData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        walletAddress={walletAddress}
        onConnectWallet={connectWallet}
        onDisconnectWallet={disconnectWallet}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🅿️ ParkChain
          </h1>
          <p className="text-gray-600">
            Blockchain-powered parking • Tamper-proof reservations • Direct payments to owners
          </p>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700">Processing transaction...</p>
              <p className="text-sm text-gray-500">Please confirm in MetaMask</p>
            </div>
          </div>
        )}

        {/* Show QR Code after successful reservation */}
        {qrCodeData && (
          <div className="mb-8">
            <QRCodeDisplay
              data={qrCodeData}
              onClose={() => {
                setQRCodeData(null);
                fetchParkingSpots();
              }}
            />
          </div>
        )}

        {/* Show List Parking Form */}
        {showListForm && walletAddress && !qrCodeData && (
          <div className="mb-8">
            <ListParkingForm
              walletAddress={walletAddress}
              onSuccess={handleListSpot}
              onCancel={() => setShowListForm(false)}
            />
          </div>
        )}

        {/* Show Reservation Form */}
        {showReservationForm && selectedSpot && !qrCodeData && (
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
        )}

        {/* Show Main Content */}
        {!showListForm && !showReservationForm && !qrCodeData && (
          <>
            {/* Show user's active reservations */}
            {walletAddress && (
              <div className="mb-6">
                <MyReservations
                  walletAddress={walletAddress}
                  onReservationEnded={fetchParkingSpots}
                />
              </div>
            )}

            {/* Button for park owners to list their spots */}
            {walletAddress && (
              <div className="mb-6">
                <button
                  onClick={() => setShowListForm(true)}
                  className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors"
                >
                  + List Your Parking Spot
                </button>
              </div>
            )}

            {/* Parking Spots List */}
            <ParkingSpotList
              spots={parkingSpots}
              onSelectSpot={handleSelectSpot}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;