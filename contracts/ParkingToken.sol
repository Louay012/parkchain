// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ParkingToken
 * @dev ERC721 token representing parking spot ownership
 * Each token represents a unique parking spot with metadata
 */
contract ParkingToken is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    struct ParkingSpot {
        string location;
        string spotNumber;
        uint256 pricePerHour;
        bool isAvailable;
    }

    // Mapping from token ID to parking spot details
    mapping(uint256 => ParkingSpot) public parkingSpots;

    // Events
    event ParkingSpotCreated(uint256 indexed tokenId, string location, string spotNumber, uint256 pricePerHour);
    event ParkingSpotAvailabilityChanged(uint256 indexed tokenId, bool isAvailable);
    event ParkingSpotPriceUpdated(uint256 indexed tokenId, uint256 newPrice);

    constructor() ERC721("ParkingToken", "PARK") Ownable(msg.sender) {}

    /**
     * @dev Mints a new parking spot token
     * @param to Address to mint the token to
     * @param location Location of the parking spot
     * @param spotNumber Spot number identifier
     * @param pricePerHour Price per hour for parking
     * @param uri Metadata URI for the token
     */
    function mintParkingSpot(
        address to,
        string memory location,
        string memory spotNumber,
        uint256 pricePerHour,
        string memory uri
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        parkingSpots[tokenId] = ParkingSpot({
            location: location,
            spotNumber: spotNumber,
            pricePerHour: pricePerHour,
            isAvailable: true
        });

        emit ParkingSpotCreated(tokenId, location, spotNumber, pricePerHour);
        return tokenId;
    }

    /**
     * @dev Updates parking spot availability
     * @param tokenId Token ID of the parking spot
     * @param isAvailable New availability status
     */
    function setAvailability(uint256 tokenId, bool isAvailable) public {
        require(_ownerOf(tokenId) == msg.sender || owner() == msg.sender, "Not authorized");
        parkingSpots[tokenId].isAvailable = isAvailable;
        emit ParkingSpotAvailabilityChanged(tokenId, isAvailable);
    }

    /**
     * @dev Updates parking spot price
     * @param tokenId Token ID of the parking spot
     * @param newPrice New price per hour
     */
    function updatePrice(uint256 tokenId, uint256 newPrice) public {
        require(_ownerOf(tokenId) == msg.sender || owner() == msg.sender, "Not authorized");
        parkingSpots[tokenId].pricePerHour = newPrice;
        emit ParkingSpotPriceUpdated(tokenId, newPrice);
    }

    /**
     * @dev Get parking spot details
     * @param tokenId Token ID of the parking spot
     */
    function getParkingSpot(uint256 tokenId) public view returns (ParkingSpot memory) {
        require(_ownerOf(tokenId) != address(0), "Parking spot does not exist");
        return parkingSpots[tokenId];
    }

    // The following functions are overrides required by Solidity.
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
