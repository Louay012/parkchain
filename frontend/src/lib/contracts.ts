// Contract configuration
export const CONTRACTS = {
  PARKING_TOKEN: "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9",
  PARKING_RESERVATION: "0xdc64a140aa3e981100a9beca4e685f962f0cf6c9",
  PAYMENT_PROCESSOR: "0x5fc8d32690cc91d4c39d9d3abcbd16989f875707",
} as const

export const PARKING_TOKEN_ABI = [
  "function mintParkingSpot(address to, string memory location, string memory spotNumber, uint256 pricePerHour, string memory imageURI) public returns (uint256)",
  "function setSpotAvailability(uint256 tokenId, bool isAvailable) external",
  "function getParkingSpot(uint256 tokenId) external view returns (string memory location, string memory spotNumber, uint256 pricePerHour, bool isAvailable, string memory imageURI)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function setReservationContract(address _reservationContract) external",
  "event ParkingSpotMinted(uint256 indexed tokenId, address indexed owner, string location, string spotNumber, uint256 pricePerHour)",
  "event SpotAvailabilityChanged(uint256 indexed tokenId, bool isAvailable)",
] as const

export const PARKING_RESERVATION_ABI = [
  "function createReservation(uint256 spotId, uint256 durationHours) external payable",
  "function endReservation(uint256 reservationId) external",
  "function getReservation(uint256 reservationId) external view returns (tuple(uint256 id, uint256 spotId, address user, uint256 startTime, uint256 endTime, uint256 amountPaid, bool isActive))",
  "function getUserReservations(address user) external view returns (tuple(uint256 id, uint256 spotId, address user, uint256 startTime, uint256 endTime, uint256 amountPaid, bool isActive)[])",
  "function getActiveUserReservations(address user) external view returns (tuple(uint256 id, uint256 spotId, address user, uint256 startTime, uint256 endTime, uint256 amountPaid, bool isActive)[])",
  "function isSpotAvailable(uint256 spotId) external view returns (bool)",
  "function getSpotCurrentReservation(uint256 spotId) external view returns (tuple(uint256 id, uint256 spotId, address user, uint256 startTime, uint256 endTime, uint256 amountPaid, bool isActive))",
  "event ReservationCreated(uint256 indexed reservationId, uint256 indexed spotId, address indexed user, uint256 startTime, uint256 endTime, uint256 amountPaid)",
  "event ReservationEnded(uint256 indexed reservationId, uint256 indexed spotId, address indexed user)",
] as const

export const PAYMENT_PROCESSOR_ABI = [
  "function processPayment(address to, string memory purpose) public payable returns (uint256)",
  "function updatePlatformFee(uint256 newFeePercentage) public",
  "function getUserPayments(address user) public view returns (uint256[] memory)",
  "function getPayment(uint256 paymentId) public view returns (tuple(address from, address to, uint256 amount, uint256 timestamp, string purpose, bool isCompleted))",
  "function getTotalPayments() public view returns (uint256)",
  "function withdrawFees() public",
  "function platformFeePercentage() public view returns (uint256)",
  "event PaymentProcessed(uint256 indexed paymentId, address indexed from, address indexed to, uint256 amount, uint256 platformFee, string purpose)",
  "event PlatformFeeUpdated(uint256 newFeePercentage)",
  "event FundsWithdrawn(address indexed owner, uint256 amount)",
] as const

export const NETWORK = {
  CHAIN_ID: 1337,
  NAME: "Ganache Local",
  RPC_URL: "http://127.0.0.1:7545",
} as const

export const API = {
  BASE_URL: "http://localhost:3001/api",
} as const
