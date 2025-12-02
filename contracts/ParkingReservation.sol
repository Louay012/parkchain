// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ParkingToken.sol";

/**
 * @title ParkingReservation
 * @dev Manages parking spot reservations with immutable history
 */
contract ParkingReservation is Ownable, ReentrancyGuard {
    ParkingToken public parkingToken;

    struct Reservation {
        uint256 tokenId;
        address renter;
        uint256 startTime;
        uint256 endTime;
        uint256 totalCost;
        bool isActive;
        bool isCompleted;
    }

    // Reservation counter
    uint256 private reservationCounter;

    // Mapping from reservation ID to reservation details
    mapping(uint256 => Reservation) public reservations;

    // Mapping from token ID to current active reservation
    mapping(uint256 => uint256) public activeReservations;

    // Mapping from user address to their reservation IDs
    mapping(address => uint256[]) public userReservations;

    // Events
    event ReservationCreated(
        uint256 indexed reservationId,
        uint256 indexed tokenId,
        address indexed renter,
        uint256 startTime,
        uint256 endTime,
        uint256 totalCost
    );
    event ReservationCompleted(uint256 indexed reservationId);
    event ReservationCancelled(uint256 indexed reservationId);

    constructor(address _parkingTokenAddress) Ownable(msg.sender) {
        parkingToken = ParkingToken(_parkingTokenAddress);
    }

    /**
     * @dev Creates a new reservation
     * @param tokenId Token ID of the parking spot
     * @param durationHours Duration of the reservation in hours
     */
    function createReservation(uint256 tokenId, uint256 durationHours) 
        public 
        payable 
        nonReentrant 
        returns (uint256) 
    {
        ParkingToken.ParkingSpot memory spot = parkingToken.getParkingSpot(tokenId);
        require(spot.isAvailable, "Parking spot not available");
        require(activeReservations[tokenId] == 0, "Parking spot already reserved");
        
        uint256 totalCost = spot.pricePerHour * durationHours;
        require(msg.value >= totalCost, "Insufficient payment");

        uint256 reservationId = reservationCounter++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + (durationHours * 1 hours);

        reservations[reservationId] = Reservation({
            tokenId: tokenId,
            renter: msg.sender,
            startTime: startTime,
            endTime: endTime,
            totalCost: totalCost,
            isActive: true,
            isCompleted: false
        });

        activeReservations[tokenId] = reservationId;
        userReservations[msg.sender].push(reservationId);

        // Transfer payment to parking spot owner
        address spotOwner = parkingToken.ownerOf(tokenId);
        (bool success, ) = spotOwner.call{value: totalCost}("");
        require(success, "Payment transfer failed");

        // Refund excess payment
        if (msg.value > totalCost) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - totalCost}("");
            require(refundSuccess, "Refund failed");
        }

        emit ReservationCreated(reservationId, tokenId, msg.sender, startTime, endTime, totalCost);
        return reservationId;
    }

    /**
     * @dev Completes a reservation
     * @param reservationId ID of the reservation
     */
    function completeReservation(uint256 reservationId) public {
        Reservation storage reservation = reservations[reservationId];
        require(reservation.isActive, "Reservation not active");
        require(
            msg.sender == reservation.renter || msg.sender == owner(),
            "Not authorized"
        );
        require(block.timestamp >= reservation.endTime, "Reservation not yet ended");

        reservation.isActive = false;
        reservation.isCompleted = true;
        activeReservations[reservation.tokenId] = 0;

        emit ReservationCompleted(reservationId);
    }

    /**
     * @dev Cancels a reservation (only before start time)
     * @param reservationId ID of the reservation
     */
    function cancelReservation(uint256 reservationId) public nonReentrant {
        Reservation storage reservation = reservations[reservationId];
        require(reservation.isActive, "Reservation not active");
        require(msg.sender == reservation.renter, "Not authorized");
        require(block.timestamp < reservation.startTime, "Cannot cancel ongoing reservation");

        reservation.isActive = false;
        activeReservations[reservation.tokenId] = 0;

        // Refund 90% (10% cancellation fee)
        uint256 refundAmount = (reservation.totalCost * 90) / 100;
        (bool success, ) = reservation.renter.call{value: refundAmount}("");
        require(success, "Refund failed");

        emit ReservationCancelled(reservationId);
    }

    /**
     * @dev Gets all reservations for a user
     * @param user Address of the user
     */
    function getUserReservations(address user) public view returns (uint256[] memory) {
        return userReservations[user];
    }

    /**
     * @dev Gets reservation details
     * @param reservationId ID of the reservation
     */
    function getReservation(uint256 reservationId) public view returns (Reservation memory) {
        return reservations[reservationId];
    }

    /**
     * @dev Checks if a parking spot is currently reserved
     * @param tokenId Token ID of the parking spot
     */
    function isSpotReserved(uint256 tokenId) public view returns (bool) {
        uint256 activeReservationId = activeReservations[tokenId];
        if (activeReservationId == 0) return false;
        
        Reservation memory reservation = reservations[activeReservationId];
        return reservation.isActive && block.timestamp < reservation.endTime;
    }
}
