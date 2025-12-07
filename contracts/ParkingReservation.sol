// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ParkingToken.sol";

contract ParkingReservation {
    ParkingToken public parkingToken;

    struct Reservation {
        uint256 id;
        uint256 spotId;
        address user;
        uint256 startTime;
        uint256 endTime;
        uint256 amountPaid;
        bool isActive;
    }

    uint256 public nextReservationId = 1;
    
    // All reservations
    mapping(uint256 => Reservation) public reservations;
    
    // User's reservation IDs
    mapping(address => uint256[]) public userReservations;
    
    // Spot's current reservation ID (0 if none)
    mapping(uint256 => uint256) public spotCurrentReservation;

    event ReservationCreated(
        uint256 indexed reservationId,
        uint256 indexed spotId,
        address indexed user,
        uint256 startTime,
        uint256 endTime,
        uint256 amountPaid
    );

    event ReservationEnded(
        uint256 indexed reservationId,
        uint256 indexed spotId,
        address indexed user
    );

    constructor(address _parkingToken) {
        parkingToken = ParkingToken(_parkingToken);
    }

    function createReservation(uint256 spotId, uint256 durationHours) external payable {
        // Get spot info
        (
            string memory location,
            string memory spotNumber,
            uint256 pricePerHour,
            bool isAvailable,
            string memory imageURI
        ) = parkingToken.getParkingSpot(spotId);

        require(isAvailable, "Spot is not available");
        require(durationHours > 0, "Duration must be greater than 0");

        // Calculate total price
        uint256 totalPrice = pricePerHour * durationHours;
        require(msg.value >= totalPrice, "Insufficient payment");

        // Get spot owner and transfer payment
        address spotOwner = parkingToken.ownerOf(spotId);
        require(spotOwner != address(0), "Invalid spot owner");
        
        // Transfer payment directly to spot owner
        (bool success, ) = payable(spotOwner).call{value: msg.value}("");
        require(success, "Payment transfer failed");

        // Calculate times
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + (durationHours * 1 hours);

        // Create reservation
        uint256 reservationId = nextReservationId++;
        reservations[reservationId] = Reservation({
            id: reservationId,
            spotId: spotId,
            user: msg.sender,
            startTime: startTime,
            endTime: endTime,
            amountPaid: msg.value,
            isActive: true
        });

        // Track reservation
        userReservations[msg.sender].push(reservationId);
        spotCurrentReservation[spotId] = reservationId;

        // Mark spot as unavailable
        parkingToken.setSpotAvailability(spotId, false);

        emit ReservationCreated(
            reservationId,
            spotId,
            msg.sender,
            startTime,
            endTime,
            msg.value
        );
    }

    function endReservation(uint256 reservationId) external {
        Reservation storage reservation = reservations[reservationId];
        
        require(reservation.id != 0, "Reservation does not exist");
        require(reservation.isActive, "Reservation already ended");
        require(
            msg.sender == reservation.user || block.timestamp >= reservation.endTime,
            "Only user can end early, or wait until time expires"
        );

        // End reservation
        reservation.isActive = false;
        spotCurrentReservation[reservation.spotId] = 0;

        // Mark spot as available again
        parkingToken.setSpotAvailability(reservation.spotId, true);

        emit ReservationEnded(reservationId, reservation.spotId, reservation.user);
    }

    function getReservation(uint256 reservationId) external view returns (Reservation memory) {
        return reservations[reservationId];
    }

    function getUserReservations(address user) external view returns (Reservation[] memory) {
        uint256[] memory userResIds = userReservations[user];
        Reservation[] memory result = new Reservation[](userResIds.length);
        
        for (uint256 i = 0; i < userResIds.length; i++) {
            result[i] = reservations[userResIds[i]];
        }
        
        return result;
    }

    function getActiveUserReservations(address user) external view returns (Reservation[] memory) {
        uint256[] memory userResIds = userReservations[user];
        
        // Count active reservations
        uint256 activeCount = 0;
        for (uint256 i = 0; i < userResIds.length; i++) {
            if (reservations[userResIds[i]].isActive) {
                activeCount++;
            }
        }
        
        // Build result array
        Reservation[] memory result = new Reservation[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < userResIds.length; i++) {
            if (reservations[userResIds[i]].isActive) {
                result[index++] = reservations[userResIds[i]];
            }
        }
        
        return result;
    }

    function isSpotAvailable(uint256 spotId) external view returns (bool) {
        uint256 currentResId = spotCurrentReservation[spotId];
        if (currentResId == 0) return true;
        
        Reservation memory res = reservations[currentResId];
        // Available if reservation ended or expired
        return !res.isActive || block.timestamp >= res.endTime;
    }

    function getSpotCurrentReservation(uint256 spotId) external view returns (Reservation memory) {
        uint256 currentResId = spotCurrentReservation[spotId];
        return reservations[currentResId];
    }
}