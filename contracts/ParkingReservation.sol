// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ParkingToken.sol";

contract ParkingReservation {
    ParkingToken public parkingToken;
    uint256 public nextReservationId = 1;

    struct Reservation {
        uint256 id;
        address user;
        uint256 tokenId;
        uint256 startTime;
        uint256 endTime;
        bool active;
        uint256 paidAmount;
        bool cancelled;
        uint256 refundedAmount;
    }

    // reservations per parking token
    mapping(uint256 => Reservation[]) private reservationsBySpot;
    mapping(uint256 => Reservation) private reservationsById;

    event ReservationCreated(
        uint256 indexed reservationId,
        uint256 indexed tokenId,
        address indexed user,
        uint256 startTime,
        uint256 endTime,
        uint256 paidAmount
    );
    event ReservationEnded(uint256 indexed reservationId);
    event ReservationCancelled(uint256 indexed reservationId, uint256 refundedAmount);

    constructor(address parkingTokenAddress) {
        parkingToken = ParkingToken(parkingTokenAddress);
    }

    // Create a reservation for a spot if requested time range fits spot availability and doesn't overlap active reservations
    function createReservation(
        uint256 tokenId,
        uint256 startTime,
        uint256 endTime
    ) external payable returns (uint256) {
        require(startTime < endTime, "Invalid time range");

        // get spot info (matches frontend ABI)
        (, , uint256 pricePerHour, , , uint256 availableFrom, uint256 availableTo) = parkingToken.getParkingSpot(tokenId);

        require(startTime >= availableFrom && endTime <= availableTo, "Requested time outside spot availability window");

        // overlap check with active reservations
        Reservation[] storage list = reservationsBySpot[tokenId];
        for (uint256 i = 0; i < list.length; i++) {
            if (!list[i].active) continue;
            // overlap if (start < existingEnd) && (end > existingStart)
            if (startTime < list[i].endTime && endTime > list[i].startTime) {
                revert("Time slot already reserved");
            }
        }

        // compute payment required (ceil to hours)
        uint256 durationSeconds = endTime - startTime;
        uint256 durationHours = (durationSeconds + 3599) / 3600;
        uint256 requiredAmount = pricePerHour * durationHours;

        require(msg.value >= requiredAmount, "Insufficient payment");

        uint256 rid = nextReservationId++;
        Reservation memory r = Reservation({
            id: rid,
            user: msg.sender,
            tokenId: tokenId,
            startTime: startTime,
            endTime: endTime,
            active: true,
            paidAmount: requiredAmount,
            cancelled: false,
            refundedAmount: 0
        });

        reservationsBySpot[tokenId].push(r);
        reservationsById[rid] = r;

        emit ReservationCreated(rid, tokenId, msg.sender, startTime, endTime, requiredAmount);

        // refund overpayment
        if (msg.value > requiredAmount) {
            payable(msg.sender).transfer(msg.value - requiredAmount);
        }

        // Note: Do NOT change ParkingToken.isAvailable here. Global availability remains owner-controlled.

        return rid;
    }

    // End (cancel/finish) a reservation
    function endReservation(uint256 reservationId) external {
        Reservation storage r = reservationsById[reservationId];
        require(r.id != 0, "Reservation not found");
        require(r.active, "Already ended");
        require(msg.sender == r.user || msg.sender == parkingToken.ownerOf(r.tokenId), "Not authorized to end");

        r.active = false;
        r.cancelled = true;
        r.refundedAmount = r.paidAmount;

        // update array entry
        Reservation[] storage list = reservationsBySpot[r.tokenId];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i].id == reservationId) {
                list[i].active = false;
                list[i].cancelled = true;
                list[i].refundedAmount = r.paidAmount;
                break;
            }
        }

        // Refund the user
        (bool success, ) = payable(r.user).call{value: r.paidAmount}("");
        require(success, "Refund failed");

        emit ReservationCancelled(reservationId, r.paidAmount);
        emit ReservationEnded(reservationId);
    }

    // View whether a given time range is available for a token
    function isAvailableFor(uint256 tokenId, uint256 startTime, uint256 endTime) external view returns (bool) {
        if (startTime >= endTime) return false;

        (, , , , , uint256 availableFrom, uint256 availableTo) = parkingToken.getParkingSpot(tokenId);
        if (startTime < availableFrom || endTime > availableTo) return false;

        Reservation[] storage list = reservationsBySpot[tokenId];
        for (uint256 i = 0; i < list.length; i++) {
            if (!list[i].active) continue;
            if (startTime < list[i].endTime && endTime > list[i].startTime) {
                return false;
            }
        }
        return true;
    }

    // Return reservations for a spot (read-only)
    function getReservationsForSpot(uint256 tokenId) external view returns (Reservation[] memory) {
        return reservationsBySpot[tokenId];
    }

    // Return a reservation by id
    function getReservationById(uint256 reservationId) external view returns (Reservation memory) {
        require(reservationsById[reservationId].id != 0, "Reservation not found");
        return reservationsById[reservationId];
    }
}