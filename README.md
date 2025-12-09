# 🚗 ParkChain - Blockchain Parking Management System

ParkChain is a decentralized application (dApp) for managing parking spots using blockchain technology. It features tokenization of parking spaces, automated reservations, immutable history tracking, and automatic payment processing.

## ✨ Features

- **🎫 Smart Contracts (Solidity)**: ERC721-based parking spot tokenization with reservation and payment management
- **⚙️ Backend (Node.js/TypeScript)**: RESTful API for parking management and QR code generation
- **🎨 Frontend (React + Tailwind CSS)**: Modern, responsive UI for booking and managing parking spots
- **📱 QR Code Generator**: Generate unique QR codes for parking tokens and reservations
- **🔄 Automated Deployment**: GitHub Actions workflow for CI/CD
- **📜 Immutable History**: All transactions recorded on blockchain
- **💰 Automatic Payments**: Smart contract-based payment processing

## 🏗️ Architecture

```
parkchain/
├── contracts/              # Solidity smart contracts
│   ├── ParkingToken.sol   # ERC721 token for parking spots
│   ├── ParkingReservation.sol  # Reservation management
│   └── PaymentProcessor.sol    # Payment handling
├── backend/               # Node.js backend server
│   ├── server.ts         # Express server
│   └── routes/           # API routes
│       ├── parking.ts    # Parking management endpoints
│       └── qr.ts         # QR code generation
├── frontend/             # React frontend
│   └── src/
│       ├── components/   # React components
│       ├── pages/        # Page components
│       └── utils/        # Utility functions
├── scripts/              # Deployment scripts
│   └── deploy.ts         # Contract deployment
├── test/                 # Contract tests
└── .github/workflows/    # CI/CD workflows
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm or yarn
- MetaMask or another Web3 wallet
- Hardhat

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Louay012/parkchain.git
cd parkchain
```

2. **Install root dependencies**
```bash
npm install --legacy-peer-deps
```

3. **Install frontend dependencies**
```bash
cd frontend
npm install
```

### 🔧 Configuration

Create a `.env` file in the root directory:

```env
# Network Configuration
NETWORK=localhost
RPC_URL=http://127.0.0.1:8545

# Contract Addresses (will be populated after deployment)
PARKING_TOKEN_ADDRESS=
PARKING_RESERVATION_ADDRESS=
PAYMENT_PROCESSOR_ADDRESS=

# Backend Configuration
PORT=3001

# Private key for deployment (use test accounts only!)
PRIVATE_KEY=
```

### 📦 Compile Smart Contracts

```bash
npx hardhat compile
```

### 🧪 Run Tests

```bash
npx hardhat test
```

### 🚀 Deploy Contracts

Start a local Hardhat node:
```bash
npx hardhat node
```

In another terminal, deploy contracts:
```bash
npx hardhat run scripts/deploy.ts --network ganache
```

### 🖥️ Start Backend Server

```bash
npm run backend
```

The backend will run on `http://localhost:3001`

### 🎨 Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

## 📝 Smart Contracts

### ParkingToken.sol
ERC721 token representing parking spot ownership with metadata including:
- Location
- Spot number
- Price per hour
- Availability status

### ParkingReservation.sol
Manages parking reservations with features:
- Create reservations with time slots
- Automatic payment processing
- Reservation cancellation with refunds
- Immutable reservation history

### PaymentProcessor.sol
Handles payments with:
- Platform fee collection
- Payment history tracking
- Automatic fund distribution
- Secure payment processing

## 🔌 API Endpoints

### Parking Management

- `GET /api/parking/spots` - Get all parking spots
- `GET /api/parking/spots/:tokenId` - Get specific parking spot
- `POST /api/parking/reservations` - Create a reservation
- `GET /api/parking/reservations/:address` - Get user reservations

### QR Code Generation

- `POST /api/qr/generate` - Generate QR code for parking token
- `POST /api/qr/reservation` - Generate QR code for reservation

## 🧑‍💻 Development

### Project Scripts

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy contracts
npm run deploy

# Start backend
npm run backend

# Start frontend (in frontend directory)
cd frontend && npm run dev

# Build frontend
cd frontend && npm run build
```

## 🌐 Branch Structure

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `hotfix/*` - Hotfix branches

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- Louay012

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Hardhat for Ethereum development environment
- React and Tailwind CSS for the frontend
- Express.js for the backend API

## 📞 Support

For support, please open an issue in the GitHub repository.

---

Made with ❤️ using Blockchain Technology