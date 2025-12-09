// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ParkingToken is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId = 1;

    struct ParkingSpot {
        string location;
        string spotNumber;
        uint256 pricePerHour;
        bool isAvailable;
        string imageURI;
        uint256 availableFrom;
        uint256 availableTo;
    }

    mapping(uint256 => ParkingSpot) public parkingSpots;
    
    // Address authorized to change spot availability (ParkingReservation contract)
    address public reservationContract;

    event ParkingSpotMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string location,
        string spotNumber,
        uint256 pricePerHour
    );

    event SpotAvailabilityChanged(uint256 indexed tokenId, bool isAvailable);

    constructor() ERC721("ParkingToken", "PARK") Ownable(msg.sender) {}

    function setReservationContract(address _reservationContract) external onlyOwner {
        reservationContract = _reservationContract;
    }

    function mintParkingSpot(
        address to,
        string memory location,
        string memory spotNumber,
        uint256 pricePerHour,
        string memory imageURI,
        uint256 availableFrom,
        uint256 availableTo
    ) public returns (uint256) {
        require(availableTo > availableFrom, "End time must be after start time");
        
        uint256 tokenId = _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, imageURI);

        parkingSpots[tokenId] = ParkingSpot({
            location: location,
            spotNumber: spotNumber,
            pricePerHour: pricePerHour,
            isAvailable: true,
            imageURI: imageURI,
            availableFrom: availableFrom,
            availableTo: availableTo
        });

        emit ParkingSpotMinted(tokenId, to, location, spotNumber, pricePerHour);

        return tokenId;
    }

    function setSpotAvailability(uint256 tokenId, bool isAvailable) external {
        require(
            msg.sender == reservationContract || msg.sender == ownerOf(tokenId),
            "Not authorized"
        );
        parkingSpots[tokenId].isAvailable = isAvailable;
        emit SpotAvailabilityChanged(tokenId, isAvailable);
    }

    function getParkingSpot(uint256 tokenId) external view returns (
        string memory location,
        string memory spotNumber,
        uint256 pricePerHour,
        bool isAvailable,
        string memory imageURI,
        uint256 availableFrom,
        uint256 availableTo
    ) {
        ParkingSpot memory spot = parkingSpots[tokenId];
        return (
            spot.location,
            spot.spotNumber,
            spot.pricePerHour,
            spot.isAvailable,
            spot.imageURI,
            spot.availableFrom,
            spot.availableTo
        );
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}