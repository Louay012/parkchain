"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { useWallet } from "../context/WalletContext"
import { CONTRACTS, PARKING_TOKEN_ABI } from "../lib/contracts"
import { MapPin, Clock, Search, Filter, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { ParkingSpot } from "../types"

interface ParkingSpotListProps {
  onReserve: (spot: ParkingSpot) => void
}

export function ParkingSpotList({ onReserve }: ParkingSpotListProps) {
  const { provider, account } = useWallet()
  const [spots, setSpots] = useState<ParkingSpot[]>([])
  const [filteredSpots, setFilteredSpots] = useState<ParkingSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)

  const fetchSpots = async () => {
    if (!provider) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const contract = new ethers.Contract(CONTRACTS.PARKING_TOKEN, PARKING_TOKEN_ABI, provider)
      const totalSupply = await contract.totalSupply()
      const spotsData: ParkingSpot[] = []

      for (let i = 1; i <= Number(totalSupply); i++) {
        try {
          const [location, spotNumber, pricePerHour, isAvailable, imageURI] = await contract.getParkingSpot(i)
          const owner = await contract.ownerOf(i)

          spotsData.push({
            id: i,
            location,
            spotNumber,
            pricePerHour: ethers.formatEther(pricePerHour),
            isAvailable,
            imageURI,
            owner,
          })
        } catch (error) {
          console.error(`Error fetching spot ${i}:`, error)
        }
      }

      setSpots(spotsData)
      setFilteredSpots(spotsData)
    } catch (error) {
      console.error("Failed to fetch parking spots:", error)
      toast.error("Failed to load parking spots")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSpots()
  }, [provider])

  useEffect(() => {
    let result = spots

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (spot) => spot.location.toLowerCase().includes(query) || spot.spotNumber.toLowerCase().includes(query),
      )
    }

    if (showAvailableOnly) {
      result = result.filter((spot) => spot.isAvailable)
    }

    setFilteredSpots(result)
  }, [searchQuery, showAvailableOnly, spots])

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
          <p className="text-muted-foreground">Please connect your wallet to view available parking spots</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parking Spots</h1>
          <p className="text-muted-foreground">{filteredSpots.length} spots available</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
            className={`rounded-lg border p-2 ${showAvailableOnly ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}
          >
            <Filter className="h-4 w-4" />
          </button>
          <button onClick={fetchSpots} className="rounded-lg border border-border p-2 hover:bg-secondary">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border bg-card">
              <div className="h-32 rounded-t-lg bg-muted" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
              </div>
              <div className="p-4 pt-0">
                <div className="h-10 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredSpots.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold">No Spots Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery ? "Try adjusting your search query" : "No parking spots have been listed yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSpots.map((spot) => (
            <div key={spot.id} className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="relative h-32 bg-muted">
                {spot.imageURI ? (
                  <img
                    src={spot.imageURI || "/placeholder.svg"}
                    alt={spot.location}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <MapPin className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <span
                  className={`absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-medium ${spot.isAvailable ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                >
                  {spot.isAvailable ? "Available" : "Reserved"}
                </span>
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{spot.location}</h3>
                    <p className="text-sm text-muted-foreground">Spot #{spot.spotNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-primary">{spot.pricePerHour} ETH/hour</span>
                </div>
              </div>
              <div className="p-4 pt-0">
                <button
                  className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  disabled={!spot.isAvailable || spot.owner.toLowerCase() === account?.toLowerCase()}
                  onClick={() => onReserve(spot)}
                >
                  {spot.owner.toLowerCase() === account?.toLowerCase()
                    ? "Your Spot"
                    : spot.isAvailable
                      ? "Reserve Now"
                      : "Not Available"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
