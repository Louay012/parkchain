"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { toast } from "sonner"
import { useWallet } from "../context/WalletContext"
import { CONTRACTS, PARKING_RESERVATION_ABI, PARKING_TOKEN_ABI } from "../lib/contracts"
import { Clock, MapPin, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import type { Reservation } from "../types"

interface MyReservationsProps {
  onShowQR: (reservation: Reservation) => void
}

export function MyReservations({ onShowQR }: MyReservationsProps) {
  const { provider, signer, account } = useWallet()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [spotNames, setSpotNames] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
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

      // Get nextReservationId to know how many reservations exist
      let nextId = 1
      try {
        nextId = Number((await reservationContract.nextReservationId()).toString())
      } catch (e) {
        console.warn("Could not fetch nextReservationId, assuming 1", e)
      }

      const collected: Reservation[] = []
      const spotNamesMap: Record<number, string> = {}

      // Iterate through all reservation IDs and filter by user
      for (let id = 1; id < nextId; id++) {
        try {
          const r: any = await reservationContract.getReservationById(id)
          console.debug(`[MyReservations] raw reservation ${id}:`, r)
          if (!r) continue

          // Handle both tuple and object formats
          const userAddr = (r.user || r[1] || "").toString().toLowerCase()
          const reservationId = Number(r.id || r[0] || id)
          const tokenId = Number(r.tokenId || r[2])
          const startTime = Number(r.startTime || r[3])
          const endTime = Number(r.endTime || r[4])
          const active = Boolean(r.active || r[5])
          const paidAmount = r.paidAmount ? (r.paidAmount.toString?.() || String(r.paidAmount)) : "0"
          const cancelled = Boolean(r.cancelled || r[7])
          const refundedAmount = r.refundedAmount ? (r.refundedAmount.toString?.() || String(r.refundedAmount)) : "0"

          console.debug(`[MyReservations] parsed ${reservationId}: user=${userAddr}, tokenId=${tokenId}, start=${startTime}, end=${endTime}, active=${active}, cancelled=${cancelled}`)

          // Only include reservations for the connected account
          if (userAddr !== account.toLowerCase()) continue

          const reservationUser = r.user || r[1]
          collected.push({
            id: reservationId,
            user: reservationUser,
            tokenId,
            startTime,
            endTime,
            active,
            paidAmount,
            cancelled,
            refundedAmount,
          })

          // Fetch spot name if not already fetched
          if (!spotNamesMap[tokenId]) {
            try {
              const spotData = await tokenContract.getParkingSpot(tokenId)
              spotNamesMap[tokenId] = `${spotData[0]} - Spot #${spotData[1]}`
            } catch (e) {
              console.warn(`Could not fetch spot ${tokenId}`, e)
              spotNamesMap[tokenId] = `Spot #${tokenId}`
            }
          }
        } catch (innerErr) {
          console.warn(`Failed to read reservation ${id}:`, innerErr)
        }
      }

      setReservations(collected)
      setSpotNames(spotNamesMap)

      // if no active reservations but some past ones exist, switch tab so user sees them
      const activeCount = collected.filter((r) => r.active).length
      const pastCount = collected.length - activeCount
      if (activeCount === 0 && pastCount > 0) setActiveTab("past")
    } catch (error: any) {
      console.error("fetchReservations error:", error)
      toast.error("Unable to load your reservations. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (provider && account) {
      fetchReservations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, account])

  const handleEndReservation = async (reservationId: number) => {
    if (!signer) {
      toast.error("Please connect your wallet first")
      return
    }

    setEnding(reservationId)
    try {
      const contract = new ethers.Contract(CONTRACTS.PARKING_RESERVATION, PARKING_RESERVATION_ABI, signer)
      const tx = await contract.endReservation(reservationId)
      toast.info("Canceling your reservation... Please wait.")
      await tx.wait()
      toast.success("Reservation cancelled and refund processed!")
      await fetchReservations()
    } catch (err: any) {
      console.error("endReservation error:", err)
      toast.error("Unable to cancel reservation. Please try again.")
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
    const mins = Math.floor((remaining % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  const activeReservations = reservations.filter((r) => r.active)
  const pastReservations = reservations.filter((r) => !r.active)

  if (!provider || !account) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <MapPin className="h-12 w-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-semibold">Connect Your Wallet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Connect your wallet to view your reservations</p>
      </div>
    )
  }

  const ReservationCard = ({ reservation }: { reservation: Reservation }) => (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Reservation #{reservation.id}</h3>
            {reservation.active ? (
              <CheckCircle className="h-4 w-4 text-primary" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{spotNames[reservation.tokenId] || `Spot #${reservation.tokenId}`}</p>
        </div>
        {reservation.active && (
          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            {getTimeRemaining(reservation.endTime)}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{formatTime(reservation.startTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="ml-6">to</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{formatTime(reservation.endTime)}</span>
        </div>
        <div className="mt-2 text-sm font-medium">
          Paid: {ethers.formatEther(reservation.paidAmount)} ETH
        </div>
        {!reservation.active && reservation.cancelled && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-600">Refunded: {ethers.formatEther(reservation.refundedAmount)} ETH</span>
          </div>
        )}
      </div>

      {reservation.active && (
        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            onClick={() => onShowQR(reservation)}
            disabled={ending === reservation.id}
          >
            Show QR Code
          </button>
          <button
            className="flex-1 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 disabled:opacity-50 py-2 text-sm font-medium"
            onClick={() => handleEndReservation(reservation.id)}
            disabled={ending === reservation.id}
          >
            {ending === reservation.id ? "Ending…" : "End"}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Reservations</h2>
          <p className="text-muted-foreground">View and manage your parking reservations</p>
        </div>
        <button
          onClick={fetchReservations}
          disabled={loading}
          className="rounded-lg border border-border p-2 hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium ${activeTab === "active" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("active")}
        >
          Active ({activeReservations.length})
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === "past" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("past")}
        >
          Past ({pastReservations.length})
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border bg-card p-4">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="mt-3 h-4 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : activeTab === "active" ? (
        activeReservations.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold">No Active Reservations</h3>
            <p className="mt-1 text-sm text-muted-foreground">You don't have any active parking reservations</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeReservations.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </div>
        )
      ) : pastReservations.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold">No Past Reservations</h3>
          <p className="mt-1 text-sm text-muted-foreground">You don't have any past parking reservations</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pastReservations.map((r) => (
            <ReservationCard key={r.id} reservation={r} />
          ))}
        </div>
      )}
    </div>
  )
}