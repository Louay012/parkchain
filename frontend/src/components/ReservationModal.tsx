"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWallet } from "../context/WalletContext"
import { CONTRACTS, PARKING_RESERVATION_ABI } from "../lib/contracts"
import { MapPin, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import type { ParkingSpot, Reservation } from "../types"

interface ReservationModalProps {
  spot: ParkingSpot | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (reservation: Reservation) => void
}

export function ReservationModal({ spot, open, onOpenChange, onSuccess }: ReservationModalProps) {
  const { signer, account } = useWallet()
  const [duration, setDuration] = useState(1)
  const [loading, setLoading] = useState(false)

  const totalPrice = spot ? (Number.parseFloat(spot.pricePerHour) * duration).toFixed(6) : "0"

  useEffect(() => {
    if (open) setDuration(1)
  }, [open])

  const handleReserve = async () => {
    if (!signer || !account || !spot) {
      toast.error("Please connect your wallet")
      return
    }

    setLoading(true)
    try {
      const contract = new ethers.Contract(CONTRACTS.PARKING_RESERVATION, PARKING_RESERVATION_ABI, signer)
      const priceInWei = ethers.parseEther(totalPrice)

      const tx = await contract.createReservation(spot.id, duration, { value: priceInWei })
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

      const now = Math.floor(Date.now() / 1000)
      const reservation: Reservation = {
        id: reservationId,
        spotId: spot.id,
        user: account,
        startTime: now,
        endTime: now + duration * 3600,
        amountPaid: totalPrice,
        isActive: true,
        spotDetails: spot,
      }

      onSuccess(reservation)
    } catch (error: any) {
      console.error("Failed to create reservation:", error)
      toast.error(error.reason || "Failed to create reservation")
    } finally {
      setLoading(false)
    }
  }

  if (!open || !spot) return null

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
        <p className="mt-1 text-sm text-muted-foreground">Configure your reservation duration and confirm payment</p>

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
              </div>
            </div>
          </div>

          {/* Duration Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Duration: {duration} hour{duration > 1 ? "s" : ""}
            </label>
            <input
              type="range"
              min={1}
              max={24}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 hour</span>
              <span>24 hours</span>
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
                {duration} hour{duration > 1 ? "s" : ""}
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
            disabled={loading}
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
