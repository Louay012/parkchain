"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWallet } from "../context/WalletContext"
import { CONTRACTS, PARKING_RESERVATION_ABI } from "../lib/contracts"
import { MapPin, Loader2, X, Clock } from "lucide-react"
import { toast } from "sonner"
import type { ParkingSpot, Reservation } from "../types"

interface ReservationModalProps {
  spot: ParkingSpot | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (reservation: Reservation) => void
}

// Helper to format timestamp to datetime-local input value
const formatDateTimeLocal = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  return date.toISOString().slice(0, 16)
}

// Helper to get current time rounded up to nearest 5 minutes
const getCurrentTimeRounded = () => {
  const now = Math.floor(Date.now() / 1000)
  return now + (300 - (now % 300)) // Round up to next 5 minutes
}

// Helper to get duration in hours
const getDurationHours = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return 0
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  return Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60)))
}

export function ReservationModal({ spot, open, onOpenChange, onSuccess }: ReservationModalProps) {
  const { signer, account } = useWallet()
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [loading, setLoading] = useState(false)

  const durationHours = getDurationHours(startTime, endTime)
  const totalPrice = spot ? (Number.parseFloat(spot.pricePerHour) * durationHours).toFixed(6) : "0"

  useEffect(() => {
    if (open && spot) {
      // Set default times - start from now (or availableFrom if in future), not from past availability
      const now = getCurrentTimeRounded()
      const effectiveStart = Math.max(now, spot.availableFrom)
      setStartTime(formatDateTimeLocal(effectiveStart))
      setEndTime(formatDateTimeLocal(Math.min(effectiveStart + 3600, spot.availableTo))) // Default 1 hour
    }
  }, [open, spot])

  const handleReserve = async () => {
    if (!signer || !account || !spot) {
      toast.error("Please connect your wallet")
      return
    }

    if (!startTime || !endTime) {
      toast.error("Please select start and end times")
      return
    }

    const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000)
    const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000)
    const now = Math.floor(Date.now() / 1000)

    if (endTimestamp <= startTimestamp) {
      toast.error("End time must be after start time")
      return
    }

    if (startTimestamp < now) {
      toast.error("Start time must be in the future")
      return
    }

    if (startTimestamp < spot.availableFrom || endTimestamp > spot.availableTo) {
      toast.error("Selected time is outside spot availability")
      return
    }

    setLoading(true)
    try {
      const contract = new ethers.Contract(CONTRACTS.PARKING_RESERVATION, PARKING_RESERVATION_ABI, signer)
      const priceInWei = ethers.parseEther(totalPrice)

      const tx = await contract.createReservation(spot.id, startTimestamp, endTimestamp, { value: priceInWei })
      toast.info("Transaction submitted. Waiting for confirmation...")
      const receipt = await tx.wait()

      const iface = new ethers.Interface(PARKING_RESERVATION_ABI)
      const log = receipt.logs.find((log: any) => {
        try {
          const parsed = iface.parseLog(log)
          return parsed?.name === "ReservationCreated"
        } catch {
          return false
        }
      })

      let reservationId = 1
      if (log) {
        const parsed = iface.parseLog(log)
        reservationId = Number(parsed?.args[0])
      }

      const reservation: Reservation = {
        id: reservationId,
        spotId: spot.id,
        user: account,
        startTime: startTimestamp,
        endTime: endTimestamp,
        amountPaid: totalPrice,
        isActive: true,
        spotDetails: spot,
      }

      onSuccess(reservation)
    } catch (error: any) {
      console.error("Failed to create reservation:", error)
      // Extract error message from various possible locations
      const errorMessage = error.reason || 
        error.data?.message || 
        error.error?.message ||
        error.message ||
        "Failed to create reservation"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!open || !spot) return null

  // Minimum datetime is either now or spot availability start (whichever is later)
  const now = getCurrentTimeRounded()
  const effectiveMinTime = Math.max(now, spot.availableFrom)
  const minDateTime = formatDateTimeLocal(effectiveMinTime)
  const maxDateTime = formatDateTimeLocal(spot.availableTo)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-lg p-1 hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold">Reserve Parking Spot</h2>
        <p className="mt-1 text-sm text-muted-foreground">Select your reservation time and confirm payment</p>

        <div className="mt-6 space-y-4">
          {/* Spot Info */}
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">{spot.location}</h4>
                <p className="text-sm text-muted-foreground">Spot #{spot.spotNumber}</p>
                <p className="text-sm font-medium text-primary">{spot.pricePerHour} ETH/hour</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {new Date(spot.availableFrom * 1000).toLocaleString()} - {new Date(spot.availableTo * 1000).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="datetime-local"
                  value={startTime}
                  min={minDateTime}
                  max={maxDateTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="datetime-local"
                  value={endTime}
                  min={startTime || minDateTime}
                  max={maxDateTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Price Summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span>{spot.pricePerHour} ETH/hour</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span>
                {durationHours} hour{durationHours !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">{totalPrice} ETH</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-lg border border-border bg-transparent py-2 text-sm font-medium hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleReserve}
            disabled={loading || durationHours === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm & Pay"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
