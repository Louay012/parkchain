"use client"

import { useWallet } from "../context/WalletContext"
import { Car, CalendarClock, Wallet, TrendingUp, ArrowRight, Shield } from "lucide-react"

interface DashboardProps {
  onViewSpots: () => void
  onViewReservations: () => void
}

export function Dashboard({ onViewSpots, onViewReservations }: DashboardProps) {
  const { account, balance, isCorrectNetwork } = useWallet()

  const stats = [
    {
      label: "Wallet Balance",
      value: account ? `${Number.parseFloat(balance).toFixed(4)} ETH` : "Not Connected",
      icon: Wallet,
      color: "text-primary",
    },
    {
      label: "Network Status",
      value: isCorrectNetwork ? "Connected" : "Wrong Network",
      icon: Shield,
      color: isCorrectNetwork ? "text-primary" : "text-destructive",
    },
    {
      label: "Platform Fee",
      value: "2%",
      icon: TrendingUp,
      color: "text-warning",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to ParkChain</h1>
        <p className="text-muted-foreground">Decentralized parking reservations powered by blockchain technology</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between pb-2">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-6">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10" />
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Browse Parking Spots</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Find and reserve available parking spots near you. Pay with ETH directly to spot owners.
          </p>
          <button
            onClick={onViewSpots}
            className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            View Spots
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-6">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-accent/10" />
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
            <CalendarClock className="h-6 w-6 text-accent" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">My Reservations</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            View your active reservations, generate QR codes, and manage your parking sessions.
          </p>
          <button
            onClick={onViewReservations}
            className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            View Reservations
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold">How It Works</h3>
        <p className="mt-1 text-sm text-muted-foreground">Get started with ParkChain in three simple steps</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            { step: 1, title: "Connect Wallet", desc: "Connect your MetaMask wallet to get started" },
            { step: 2, title: "Find a Spot", desc: "Browse available spots and choose duration" },
            { step: 3, title: "Pay & Park", desc: "Pay with ETH and get your QR code" },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                {item.step}
              </div>
              <h4 className="mt-3 font-semibold">{item.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
