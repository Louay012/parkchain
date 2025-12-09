// Contract configuration
export const CONTRACTS = {
  PARKING_TOKEN: "0x8a503Ca9a911C54593BAE8cbb57b1098324d9236",
  PARKING_RESERVATION: "0xf19b14bCcB02f18AD11817f624CEB15a04fab247",
} as const

export const PARKING_TOKEN_ABI = [
  "function mintParkingSpot(address to, string memory location, string memory spotNumber, uint256 pricePerHour, string memory imageURI, uint256 availableFrom, uint256 availableTo) public returns (uint256)",
  "function setSpotAvailability(uint256 tokenId, bool isAvailable) external",
  "function getParkingSpot(uint256 tokenId) external view returns (string memory location, string memory spotNumber, uint256 pricePerHour, bool isAvailable, string memory imageURI, uint256 availableFrom, uint256 availableTo)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function setReservationContract(address _reservationContract) external",
  "event ParkingSpotMinted(uint256 indexed tokenId, address indexed owner, string location, string spotNumber, uint256 pricePerHour)",
  "event SpotAvailabilityChanged(uint256 indexed tokenId, bool isAvailable)",
] as const

export const PARKING_RESERVATION_ABI = [
  "function createReservation(uint256 spotId, uint256 startTime, uint256 endTime) external payable",
  "function endReservation(uint256 reservationId) external",
  "function getReservation(uint256 reservationId) external view returns (tuple(uint256 id, uint256 spotId, address user, uint256 startTime, uint256 endTime, uint256 amountPaid, bool isActive, bool isPaidOut))",
  "function getUserReservations(address user) external view returns (tuple(uint256 id, uint256 spotId, address user, uint256 startTime, uint256 endTime, uint256 amountPaid, bool isActive, bool isPaidOut)[])",
  "function getActiveUserReservations(address user) external view returns (tuple(uint256 id, uint256 spotId, address user, uint256 startTime, uint256 endTime, uint256 amountPaid, bool isActive, bool isPaidOut)[])",
  "function isSpotAvailable(uint256 spotId) external view returns (bool)",
  "function getSpotCurrentReservation(uint256 spotId) external view returns (tuple(uint256 id, uint256 spotId, address user, uint256 startTime, uint256 endTime, uint256 amountPaid, bool isActive, bool isPaidOut))",
  "event ReservationCreated(uint256 indexed reservationId, uint256 indexed spotId, address indexed user, uint256 startTime, uint256 endTime, uint256 amountPaid)",
  "event ReservationEnded(uint256 indexed reservationId, uint256 indexed spotId, address indexed user, uint256 ownerPayout, uint256 userRefund)",
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
  NAME: "Ganache",
  RPC_URL: "http://127.0.0.1:7545",  // Changed from 8545 to 7545
} as const


export const API = {
  BASE_URL: "http://localhost:3001/api",
} as const
