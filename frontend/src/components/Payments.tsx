"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useWallet } from "../context/WalletContext"
import { CONTRACTS, PARKING_RESERVATION_ABI, PARKING_TOKEN_ABI } from "../lib/contracts"
import { CreditCard, RefreshCw, TrendingUp, TrendingDown } from "lucide-react"
import { toast } from "sonner"

interface Transaction {
  id: number
  reservationId: number
  amount: string
  amountETH: string
  timestamp: number
  tokenId: number
  location: string
  spotNumber: string
  startTime: number
  endTime: number
  cancelled: boolean
  refundedAmount: string
  refundedAmountETH: string
  type: "charge" | "refund"
}

export function Payments() {
  const { provider, account } = useWallet()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCharges, setTotalCharges] = useState("0")
  const [totalRefunds, setTotalRefunds] = useState("0")

  const fetchTransactions = async () => {
    if (!provider || !account) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const reservationContract = new ethers.Contract(CONTRACTS.PARKING_RESERVATION, PARKING_RESERVATION_ABI, provider)
      const tokenContract = new ethers.Contract(CONTRACTS.PARKING_TOKEN, PARKING_TOKEN_ABI, provider)

      // Get nextReservationId to iterate through all reservations
      let nextId = 1
      try {
        nextId = Number((await reservationContract.nextReservationId()).toString())
      } catch (e) {
        console.warn("Could not fetch nextReservationId", e)
      }

      const transactionsList: Transaction[] = []
      let totalChargesWei = ethers.getBigInt(0)
      let totalRefundsWei = ethers.getBigInt(0)

      // Iterate through all reservations and collect transactions for the user
      for (let id = 1; id < nextId; id++) {
        try {
          const r: any = await reservationContract.getReservationById(id)

          if (!r) continue

          // Handle both tuple and object formats
          const userAddr = (r.user || r[1] || "").toString().toLowerCase()

          // Only include reservations for the connected account
          if (userAddr !== account.toLowerCase()) continue

          const reservationId = id
          const tokenId = Number(r.tokenId || r[2])
          const paidAmount = r.paidAmount || r[6] || "0"
          const paidWei = ethers.getBigInt(paidAmount)
          const startTime = Number(r.startTime || r[3])
          const endTime = Number(r.endTime || r[4])
          const cancelled = Boolean(r.cancelled || r[7])
          const refundedAmount = r.refundedAmount || r[8] || "0"
          const refundedWei = ethers.getBigInt(refundedAmount)

          // Fetch spot details
          let location = "Unknown Location"
          let spotNumber = "Unknown"
          try {
            const spotData = await tokenContract.getParkingSpot(tokenId)
            location = spotData[0]
            spotNumber = spotData[1]
          } catch (e) {
            console.warn(`Could not fetch spot ${tokenId}`, e)
          }

          // Add charge transaction
          if (paidWei > ethers.getBigInt(0)) {
            transactionsList.push({
              id: reservationId * 2 - 1, // Unique ID for charge
              reservationId,
              amount: paidAmount,
              amountETH: ethers.formatEther(paidAmount),
              timestamp: startTime,
              tokenId,
              location,
              spotNumber,
              startTime,
              endTime,
              cancelled,
              refundedAmount,
              refundedAmountETH: ethers.formatEther(refundedAmount),
              type: "charge",
            })
            totalChargesWei = totalChargesWei + paidWei
          }

          // Add refund transaction if cancelled
          if (cancelled && refundedWei > ethers.getBigInt(0)) {
            transactionsList.push({
              id: reservationId * 2, // Unique ID for refund
              reservationId,
              amount: refundedAmount,
              amountETH: ethers.formatEther(refundedAmount),
              timestamp: startTime + 86400, // Mock refund timestamp (1 day after start)
              tokenId,
              location,
              spotNumber,
              startTime,
              endTime,
              cancelled,
              refundedAmount,
              refundedAmountETH: ethers.formatEther(refundedAmount),
              type: "refund",
            })
            totalRefundsWei = totalRefundsWei + refundedWei
          }
        } catch (innerErr) {
          console.warn(`Failed to read reservation ${id}:`, innerErr)
        }
      }

      // Sort by timestamp descending (newest first)
      setTransactions(transactionsList.sort((a, b) => b.timestamp - a.timestamp))
      setTotalCharges(ethers.formatEther(totalChargesWei))
      setTotalRefunds(ethers.formatEther(totalRefundsWei))
    } catch (error: any) {
      console.error("fetchTransactions error:", error)
      toast.error("Unable to load payment history. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (provider && account) {
      fetchTransactions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, account])

  if (!provider || !account) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CreditCard className="h-12 w-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-semibold">Connect Your Wallet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Connect your wallet to view your transaction history</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transaction History</h2>
          <p className="text-muted-foreground">View all your parking charges and refunds</p>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="rounded-lg border border-border p-2 hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Charged</p>
              <p className="text-2xl font-bold text-red-600">{totalCharges} ETH</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/20">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Refunded</p>
              <p className="text-2xl font-bold text-green-600">{totalRefunds} ETH</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border bg-card p-4">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="mt-3 h-4 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold">No Transactions</h3>
          <p className="mt-1 text-sm text-muted-foreground">You don't have any transaction history yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={`${tx.id}`} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tx.type === "charge" ? "bg-red-500/20" : "bg-green-500/20"}`}>
                      {tx.type === "charge" ? (
                        <TrendingDown className={`h-4 w-4 ${tx.type === "charge" ? "text-red-600" : "text-green-600"}`} />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        {tx.type === "charge" ? "Parking Charge" : "Refund"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {tx.location} - Spot #{tx.spotNumber}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Reservation #{tx.reservationId} • {new Date(tx.timestamp * 1000).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${tx.type === "charge" ? "text-red-600" : "text-green-600"}`}>
                    {tx.type === "charge" ? "-" : "+"}{tx.amountETH} ETH
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tx.type === "charge" ? "Charged" : "Refunded"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
