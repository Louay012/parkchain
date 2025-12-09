export type View = "dashboard" | "spots" | "reservations" | "list" | "payments"

export interface Reservation {
  id: number
  user: string
  tokenId: number
  startTime: number
  endTime: number
  active: boolean
  paidAmount: string
  cancelled: boolean
  refundedAmount: string
}

export interface ParkingSpot {
  id: number
  location: string
  spotNumber: string
  pricePerHour: string
  isAvailable: boolean
  imageURI?: string
  owner: string
  availableFrom: number
  availableTo: number
}
export interface Payment {
  id: number
  from: string
  to: string
  amount: string
  timestamp: number
  purpose: string
  isIncoming: boolean
}
