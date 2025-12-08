"use client"

import { useState, useEffect } from "react"
import { Download, Copy, Check, X } from "lucide-react"
import { toast } from "sonner"
import type { Reservation } from "../types"
import QRCode from "qrcode"

interface QRCodeModalProps {
  reservation: Reservation | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRCodeModal({ reservation, open, onOpenChange }: QRCodeModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open && reservation) {
      generateQRCode()
    }
  }, [open, reservation])

  const generateQRCode = async () => {
    if (!reservation) return

    setLoading(true)
    try {
      const qrData = JSON.stringify({
        reservationId: reservation.id,
        spotId: reservation.spotId,
        user: reservation.user,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        location: reservation.spotDetails?.location,
        spotNumber: reservation.spotDetails?.spotNumber,
      })

      const url = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: { dark: "#22c55e", light: "#0a0a0b" },
      })

      setQrCodeUrl(url)
    } catch (error) {
      console.error("Failed to generate QR code:", error)
      toast.error("Failed to generate QR code")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!qrCodeUrl) return
    const link = document.createElement("a")
    link.download = `parkchain-reservation-${reservation?.id}.png`
    link.href = qrCodeUrl
    link.click()
    toast.success("QR code downloaded")
  }

  const handleCopy = async () => {
    if (!reservation) return
    const text = `ParkChain Reservation #${reservation.id}
Location: ${reservation.spotDetails?.location || "N/A"}
Spot: #${reservation.spotDetails?.spotNumber || reservation.spotId}
Valid until: ${new Date(reservation.endTime * 1000).toLocaleString()}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Reservation details copied")
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleString()

  if (!open || !reservation) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-lg p-1 hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold">Reservation QR Code</h2>
        <p className="mt-1 text-sm text-muted-foreground">Show this QR code when you arrive at the parking spot</p>

        <div className="mt-6 flex flex-col items-center space-y-4">
          {/* QR Code */}
          <div className="rounded-lg border border-border bg-background p-4">
            {loading ? (
              <div className="flex h-64 w-64 animate-pulse items-center justify-center rounded bg-muted" />
            ) : qrCodeUrl ? (
              <img src={qrCodeUrl || "/placeholder.svg"} alt="Reservation QR Code" className="h-64 w-64" />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center text-muted-foreground">
                Failed to generate QR code
              </div>
            )}
          </div>

          {/* Reservation Details */}
          <div className="w-full space-y-2 rounded-lg border border-border bg-muted/50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reservation ID</span>
              <span className="font-mono">#{reservation.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span>{reservation.spotDetails?.location || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Spot</span>
              <span>#{reservation.spotDetails?.spotNumber || reservation.spotId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valid Until</span>
              <span>{formatTime(reservation.endTime)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex w-full gap-2">
            <button
              onClick={handleCopy}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-transparent py-2 text-sm hover:bg-secondary"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy Details"}
            </button>
            <button
              onClick={handleDownload}
              disabled={!qrCodeUrl}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
