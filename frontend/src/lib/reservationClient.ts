import { CONTRACTS, PARKING_RESERVATION_ABI } from "./contracts"
import { ethers } from "ethers"

export async function isSpotAvailableFor(provider: ethers.BrowserProvider, tokenId: number, startTime: number, endTime: number): Promise<boolean> {
  const contract = new ethers.Contract(CONTRACTS.PARKING_RESERVATION, PARKING_RESERVATION_ABI, provider)
  return await contract.isAvailableFor(tokenId, startTime, endTime)
}

export async function createReservationWithPayment(signer: ethers.Signer, tokenId: number, startTime: number, endTime: number, valueWei: string) {
  const contract = new ethers.Contract(CONTRACTS.PARKING_RESERVATION, PARKING_RESERVATION_ABI, signer)
  const tx = await contract.createReservation(tokenId, startTime, endTime, { value: valueWei })
  return tx
}

export async function endReservation(signer: ethers.Signer, reservationId: number) {
  const contract = new ethers.Contract(CONTRACTS.PARKING_RESERVATION, PARKING_RESERVATION_ABI, signer)
  const tx = await contract.endReservation(reservationId)
  return tx
}