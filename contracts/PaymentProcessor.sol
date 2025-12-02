// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PaymentProcessor
 * @dev Handles automatic payments and payment history for parking reservations
 */
contract PaymentProcessor is Ownable, ReentrancyGuard {
    struct Payment {
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        string purpose;
        bool isCompleted;
    }

    // Payment counter
    uint256 private paymentCounter;

    // Mapping from payment ID to payment details
    mapping(uint256 => Payment) public payments;

    // Mapping from user address to their payment IDs
    mapping(address => uint256[]) public userPayments;

    // Platform fee percentage (e.g., 2% = 200)
    uint256 public platformFeePercentage = 200; // 2%
    uint256 public constant FEE_DENOMINATOR = 10000;

    // Events
    event PaymentProcessed(
        uint256 indexed paymentId,
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 platformFee,
        string purpose
    );
    event PlatformFeeUpdated(uint256 newFeePercentage);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Process a payment from sender to receiver
     * @param to Receiver address
     * @param purpose Purpose of the payment
     */
    function processPayment(address to, string memory purpose) 
        public 
        payable 
        nonReentrant 
        returns (uint256) 
    {
        require(msg.value > 0, "Payment amount must be greater than 0");
        require(to != address(0), "Invalid receiver address");

        uint256 platformFee = (msg.value * platformFeePercentage) / FEE_DENOMINATOR;
        uint256 amountToReceiver = msg.value - platformFee;

        uint256 paymentId = paymentCounter++;

        payments[paymentId] = Payment({
            from: msg.sender,
            to: to,
            amount: msg.value,
            timestamp: block.timestamp,
            purpose: purpose,
            isCompleted: true
        });

        userPayments[msg.sender].push(paymentId);
        userPayments[to].push(paymentId);

        // Transfer to receiver
        (bool success, ) = to.call{value: amountToReceiver}("");
        require(success, "Payment to receiver failed");

        emit PaymentProcessed(paymentId, msg.sender, to, msg.value, platformFee, purpose);
        return paymentId;
    }

    /**
     * @dev Updates the platform fee percentage
     * @param newFeePercentage New fee percentage (e.g., 250 for 2.5%)
     */
    function updatePlatformFee(uint256 newFeePercentage) public onlyOwner {
        require(newFeePercentage <= 1000, "Fee cannot exceed 10%");
        platformFeePercentage = newFeePercentage;
        emit PlatformFeeUpdated(newFeePercentage);
    }

    /**
     * @dev Gets all payments for a user
     * @param user Address of the user
     */
    function getUserPayments(address user) public view returns (uint256[] memory) {
        return userPayments[user];
    }

    /**
     * @dev Gets payment details
     * @param paymentId ID of the payment
     */
    function getPayment(uint256 paymentId) public view returns (Payment memory) {
        return payments[paymentId];
    }

    /**
     * @dev Gets the payment history count
     */
    function getTotalPayments() public view returns (uint256) {
        return paymentCounter;
    }

    /**
     * @dev Withdraw accumulated platform fees
     */
    function withdrawFees() public onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");

        emit FundsWithdrawn(owner(), balance);
    }

    /**
     * @dev Receive function to accept payments
     */
    receive() external payable {}
}
