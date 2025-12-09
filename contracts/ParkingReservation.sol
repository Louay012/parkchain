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
        bool isPaidOut;  // Whether owner has been paid
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
        address indexed user,
        uint256 ownerPayout,
        uint256 userRefund
    );

    constructor(address _parkingToken) {
        parkingToken = ParkingToken(_parkingToken);
    }

    function createReservation(uint256 spotId, uint256 startTime, uint256 endTime) external payable {
        require(startTime < endTime, "Start time must be before end time");
        require(startTime >= block.timestamp, "Start time must be in the future");
        
        // Get spot info - only what we need
        (
            ,  // location
            ,  // spotNumber
            uint256 pricePerHour,
            bool isAvailable,
            ,  // imageURI
            uint256 availableFrom,
            uint256 availableTo
        ) = parkingToken.getParkingSpot(spotId);

        require(isAvailable, "Spot is not available");
        require(startTime >= availableFrom, "Reservation starts before spot availability");
        require(endTime <= availableTo, "Reservation ends after spot availability");

        // Calculate duration in hours (rounded up) and total price
        uint256 durationHours = (endTime - startTime + 3599) / 3600;
        require(msg.value >= pricePerHour * durationHours, "Insufficient payment");

        // Verify spot owner exists
        address spotOwner = parkingToken.ownerOf(spotId);
        require(spotOwner != address(0), "Invalid spot owner");
        
        // Payment is held in contract until reservation ends

        // Create and store reservation
        uint256 reservationId = nextReservationId++;
        reservations[reservationId] = Reservation({
            id: reservationId,
            spotId: spotId,
            user: msg.sender,
            startTime: startTime,
            endTime: endTime,
            amountPaid: msg.value,
            isActive: true,
            isPaidOut: false
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
            msg.sender == reservation.user || 
            msg.sender == parkingToken.ownerOf(reservation.spotId) ||
            block.timestamp >= reservation.endTime,
            "Not authorized to end reservation"
        );

        // Calculate payouts
        uint256 ownerPayout;
        uint256 userRefund;
        
        uint256 totalDuration = reservation.endTime - reservation.startTime;
        
        if (block.timestamp >= reservation.endTime) {
            // Reservation completed normally - owner gets full payment
            ownerPayout = reservation.amountPaid;
            userRefund = 0;
        } else if (block.timestamp <= reservation.startTime) {
            // Cancelled before start - full refund to user
            ownerPayout = 0;
            userRefund = reservation.amountPaid;
        } else {
            // Ended early - calculate proportional amounts
            uint256 usedDuration = block.timestamp - reservation.startTime;
            ownerPayout = (reservation.amountPaid * usedDuration) / totalDuration;
            userRefund = reservation.amountPaid - ownerPayout;
        }

        // End reservation
        reservation.isActive = false;
        reservation.isPaidOut = true;
        spotCurrentReservation[reservation.spotId] = 0;

        // Mark spot as available again
        parkingToken.setSpotAvailability(reservation.spotId, true);

        // Pay the owner for used time
        if (ownerPayout > 0) {
            address spotOwner = parkingToken.ownerOf(reservation.spotId);
            (bool successOwner, ) = payable(spotOwner).call{value: ownerPayout}("");
            require(successOwner, "Owner payment failed");
        }

        // Refund user for unused time
        if (userRefund > 0) {
            (bool successUser, ) = payable(reservation.user).call{value: userRefund}("");
            require(successUser, "User refund failed");
        }

        emit ReservationEnded(reservationId, reservation.spotId, reservation.user, ownerPayout, userRefund);
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