export type View = "dashboard" | "spots" | "reservations" | "list" | "payments"

export interface ParkingSpot {
  id: number
  location: string
  spotNumber: string
  pricePerHour: string
  isAvailable: boolean
  imageURI: string
  owner: string
}

export interface Reservation {
  id: number
  spotId: number
  user: string
  startTime: number
  endTime: number
  amountPaid: string
  isActive: boolean
  spotDetails?: ParkingSpot
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
