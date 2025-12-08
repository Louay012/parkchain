"use client"

import type React from "react"
import { useState } from "react"
import { ethers } from "ethers"
import { useWallet } from "../context/WalletContext"
import { CONTRACTS, PARKING_TOKEN_ABI } from "../lib/contracts"
import { MapPin, Hash, DollarSign, ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ListParkingFormProps {
  onSuccess: () => void
}

export function ListParkingForm({ onSuccess }: ListParkingFormProps) {
  const { signer, account } = useWallet()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    location: "",
    spotNumber: "",
    pricePerHour: "",
    imageURI: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.location.trim()) newErrors.location = "Location is required"
    if (!formData.spotNumber.trim()) newErrors.spotNumber = "Spot number is required"
    if (!formData.pricePerHour || Number.parseFloat(formData.pricePerHour) <= 0)
      newErrors.pricePerHour = "Price must be greater than 0"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!signer || !account) {
      toast.error("Please connect your wallet")
      return
    }

    if (!validateForm()) return

    setLoading(true)
    try {
      const contract = new ethers.Contract(CONTRACTS.PARKING_TOKEN, PARKING_TOKEN_ABI, signer)
      const priceInWei = ethers.parseEther(formData.pricePerHour)

      const tx = await contract.mintParkingSpot(
        account,
        formData.location,
        formData.spotNumber,
        priceInWei,
        formData.imageURI || "",
      )

      toast.info("Transaction submitted. Waiting for confirmation...")
      await tx.wait()

      toast.success("Parking spot listed successfully!")
      setFormData({ location: "", spotNumber: "", pricePerHour: "", imageURI: "" })
      onSuccess()
    } catch (error: any) {
      console.error("Failed to list parking spot:", error)
      toast.error(error.reason || "Failed to list parking spot")
    } finally {
      setLoading(false)
    }
  }

  if (!signer || !account) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
          <p className="text-muted-foreground">Please connect your wallet to list a parking spot</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">List a Parking Spot</h1>
        <p className="text-muted-foreground">Mint your parking spot as an NFT and start earning ETH</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold">Spot Details</h3>
        <p className="mt-1 text-sm text-muted-foreground">Provide information about your parking spot</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="location"
                type="text"
                placeholder="e.g., Downtown Parking Garage"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="spotNumber" className="text-sm font-medium">
              Spot Number
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="spotNumber"
                type="text"
                placeholder="e.g., A-123"
                value={formData.spotNumber}
                onChange={(e) => setFormData({ ...formData, spotNumber: e.target.value })}
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {errors.spotNumber && <p className="text-sm text-destructive">{errors.spotNumber}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="pricePerHour" className="text-sm font-medium">
              Price per Hour (ETH)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="pricePerHour"
                type="number"
                step="0.001"
                min="0"
                placeholder="e.g., 0.01"
                value={formData.pricePerHour}
                onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {errors.pricePerHour && <p className="text-sm text-destructive">{errors.pricePerHour}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="imageURI" className="text-sm font-medium">
              Image URL (Optional)
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="imageURI"
                type="text"
                placeholder="https://example.com/image.jpg"
                value={formData.imageURI}
                onChange={(e) => setFormData({ ...formData, imageURI: e.target.value })}
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Minting NFT...
              </>
            ) : (
              "List Parking Spot"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
