"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWallet } from "../context/WalletContext"
import { CONTRACTS, PARKING_TOKEN_ABI, PARKING_RESERVATION_ABI } from "../lib/contracts"
import { CalendarClock, QrCode, Clock, XCircle } from "lucide-react"
import { toast } from "sonner"
import type { Reservation, ParkingSpot } from "../types"

interface MyReservationsProps {
  onShowQR: (reservation: Reservation) => void
}

export function MyReservations({ onShowQR }: MyReservationsProps) {
  const { provider, signer, account } = useWallet()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [ending, setEnding] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"active" | "past">("active")

  const fetchReservations = async () => {
    if (!provider || !account) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const reservationContract = new ethers.Contract(CONTRACTS.PARKING_RESERVATION, PARKING_RESERVATION_ABI, provider)
      const tokenContract = new ethers.Contract(CONTRACTS.PARKING_TOKEN, PARKING_TOKEN_ABI, provider)

      const userReservations = await reservationContract.getUserReservations(account)

      const reservationsWithDetails = await Promise.all(
        userReservations.map(async (res: any) => {
          try {
            const [location, spotNumber, pricePerHour, isAvailable, imageURI] = await tokenContract.getParkingSpot(
              res.spotId,
            )

            return {
              id: Number(res.id),
              spotId: Number(res.spotId),
              user: res.user,
              startTime: Number(res.startTime),
              endTime: Number(res.endTime),
              amountPaid: ethers.formatEther(res.amountPaid),
              isActive: res.isActive,
              spotDetails: {
                id: Number(res.spotId),
                location,
                spotNumber,
                pricePerHour: ethers.formatEther(pricePerHour),
                isAvailable,
                imageURI,
                owner: "",
              } as ParkingSpot,
            }
          } catch {
            return {
              id: Number(res.id),
              spotId: Number(res.spotId),
              user: res.user,
              startTime: Number(res.startTime),
              endTime: Number(res.endTime),
              amountPaid: ethers.formatEther(res.amountPaid),
              isActive: res.isActive,
            }
          }
        }),
      )

      setReservations(reservationsWithDetails)
    } catch (error) {
      console.error("Failed to fetch reservations:", error)
      toast.error("Failed to load reservations")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [provider, account])

  const handleEndReservation = async (reservationId: number) => {
    if (!signer) {
      toast.error("Please connect your wallet")
      return
    }

    setEnding(reservationId)
    try {
      const contract = new ethers.Contract(CONTRACTS.PARKING_RESERVATION, PARKING_RESERVATION_ABI, signer)
      const tx = await contract.endReservation(reservationId)
      toast.info("Transaction submitted...")
      await tx.wait()
      toast.success("Reservation ended successfully!")
      fetchReservations()
    } catch (error: any) {
      console.error("Failed to end reservation:", error)
      toast.error(error.reason || "Failed to end reservation")
    } finally {
      setEnding(null)
    }
  }

  const formatTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleString()

  const getTimeRemaining = (endTime: number) => {
    const now = Date.now() / 1000
    const remaining = endTime - now
    if (remaining <= 0) return "Expired"
    const hours = Math.floor(remaining / 3600)
    const minutes = Math.floor((remaining % 3600) / 60)
    return `${hours}h ${minutes}m remaining`
  }

  const activeReservations = reservations.filter((r) => r.isActive)
  const pastReservations = reservations.filter((r) => !r.isActive)

  if (!provider || !account) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
          <p className="text-muted-foreground">Please connect your wallet to view your reservations</p>
        </div>
      </div>
    )
  }

  const ReservationCard = ({ reservation }: { reservation: Reservation }) => (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-start justify-between p-4 pb-2">
        <div>
          <h3 className="font-semibold">{reservation.spotDetails?.location || `Spot #${reservation.spotId}`}</h3>
          <p className="text-sm text-muted-foreground">
            {reservation.spotDetails?.spotNumber && `Spot #${reservation.spotDetails.spotNumber}`}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${reservation.isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
        >
          {reservation.isActive ? "Active" : "Completed"}
        </span>
      </div>
      <div className="space-y-2 p-4 pt-0 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>Start: {formatTime(reservation.startTime)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>End: {formatTime(reservation.endTime)}</span>
        </div>
        <p className="font-medium text-primary">Paid: {reservation.amountPaid} ETH</p>
        {reservation.isActive && (
          <span className="inline-block rounded border border-border px-2 py-1 text-xs">
            {getTimeRemaining(reservation.endTime)}
          </span>
        )}
      </div>
      {reservation.isActive && (
        <div className="flex gap-2 p-4 pt-0">
          <button
            onClick={() => onShowQR(reservation)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-transparent py-2 text-sm hover:bg-secondary"
          >
            <QrCode className="h-4 w-4" />
            Show QR
          </button>
          <button
            onClick={() => handleEndReservation(reservation.id)}
            disabled={ending === reservation.id}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive py-2 text-sm text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            {ending === reservation.id ? "Ending..." : "End Early"}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Reservations</h1>
        <p className="text-muted-foreground">Manage your parking reservations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === "active" ? "bg-background shadow" : "hover:bg-background/50"}`}
        >
          Active ({activeReservations.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === "past" ? "bg-background shadow" : "hover:bg-background/50"}`}
        >
          Past ({pastReservations.length})
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border bg-card p-4">
              <div className="h-6 w-3/4 rounded bg-muted" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {activeTab === "active" &&
            (activeReservations.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-12 text-center">
                <CalendarClock className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold">No Active Reservations</h3>
                <p className="mt-1 text-sm text-muted-foreground">You don't have any active parking reservations</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeReservations.map((reservation) => (
                  <ReservationCard key={reservation.id} reservation={reservation} />
                ))}
              </div>
            ))}

          {activeTab === "past" &&
            (pastReservations.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-12 text-center">
                <CalendarClock className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold">No Past Reservations</h3>
                <p className="mt-1 text-sm text-muted-foreground">Your completed reservations will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pastReservations.map((reservation) => (
                  <ReservationCard key={reservation.id} reservation={reservation} />
                ))}
              </div>
            ))}
        </>
      )}
    </div>
  )
}
