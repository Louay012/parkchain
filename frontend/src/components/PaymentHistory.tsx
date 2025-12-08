"use client"

import { useState, useEffect } from "react"
import { useWallet } from "../context/WalletContext"
import { Receipt, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { toast } from "sonner"
import type { Payment } from "../types"

export function PaymentHistory() {
  const { provider, account } = useWallet()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPayments = async () => {
      if (!provider || !account) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // In production this would fetch from PaymentProcessor contract events
        const mockPayments: Payment[] = []
        setPayments(mockPayments)
      } catch (error) {
        console.error("Failed to fetch payments:", error)
        toast.error("Failed to load payment history")
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [provider, account])

  const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`
  const formatTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleString()

  if (!provider || !account) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
          <p className="text-muted-foreground">Please connect your wallet to view payment history</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment History</h1>
        <p className="text-muted-foreground">Track your parking payments and earnings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Spent", value: "0.000 ETH" },
          { label: "Total Earned", value: "0.000 ETH", highlight: true },
          { label: "Transactions", value: payments.length.toString() },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.highlight ? "text-primary" : ""}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Payment List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-4 rounded-lg border border-border bg-card p-4">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
              <div className="h-6 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-12 text-center">
          <Receipt className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold">No Payments Yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your payment history will appear here after your first transaction
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${payment.isIncoming ? "bg-primary/20" : "bg-muted"}`}
              >
                {payment.isIncoming ? (
                  <ArrowDownLeft className="h-5 w-5 text-primary" />
                ) : (
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{payment.purpose}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${payment.isIncoming ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                  >
                    {payment.isIncoming ? "Received" : "Sent"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {payment.isIncoming ? "From" : "To"}:{" "}
                  {truncateAddress(payment.isIncoming ? payment.from : payment.to)}
                </p>
                <p className="text-xs text-muted-foreground">{formatTime(payment.timestamp)}</p>
              </div>
              <p className={`font-semibold ${payment.isIncoming ? "text-primary" : ""}`}>
                {payment.isIncoming ? "+" : "-"}
                {payment.amount} ETH
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
