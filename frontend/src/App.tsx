"use client"

import { useState } from "react"
import { Toaster, toast } from "sonner"
import { Sidebar } from "./components/Sidebar"
import { Header } from "./components/Header"
import { Dashboard } from "./components/Dashboard"
import { ParkingSpotList } from "./components/ParkingSpotList"
import { MyReservations } from "./components/MyReservations"
import { ListParkingForm } from "./components/ListParkingForm"
import { Payments } from "./components/Payments"
import { ReservationModal } from "./components/ReservationModal"
import { QRCodeModal } from "./components/QRCodeModal"
import { WalletProvider } from "./context/WalletContext"
import type { View, ParkingSpot, Reservation } from "./types"

export default function App() {
  return (
    <WalletProvider>
      <ParkChainApp />
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(0.12 0.01 260)",
            border: "1px solid oklch(0.22 0.01 260)",
            color: "oklch(0.95 0 0)",
          },
        }}
      />
    </WalletProvider>
  )
}

function ParkChainApp() {
  const [currentView, setCurrentView] = useState<View>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Modal states
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null)
  const [reservationModalOpen, setReservationModalOpen] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrReservation, setQrReservation] = useState<Reservation | null>(null)

  const handleReserveSpot = (spot: ParkingSpot) => {
    setSelectedSpot(spot)
    setReservationModalOpen(true)
  }

  const handleShowQR = (reservation: Reservation) => {
    setQrReservation(reservation)
    setQrModalOpen(true)
  }

  const handleReservationSuccess = (reservation: Reservation) => {
    setReservationModalOpen(false)
    setQrReservation(reservation)
    setQrModalOpen(true)
    toast.success("Reservation created successfully!")
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6">
          {currentView === "dashboard" && (
            <Dashboard
              onViewSpots={() => setCurrentView("spots")}
              onViewReservations={() => setCurrentView("reservations")}
            />
          )}
          {currentView === "spots" && <ParkingSpotList onReserve={handleReserveSpot} />}
          {currentView === "reservations" && <MyReservations onShowQR={handleShowQR} />}
          {currentView === "list" && <ListParkingForm onSuccess={() => setCurrentView("spots")} />}
          {currentView === "payments" && <Payments />}
        </main>
      </div>

      <ReservationModal
        spot={selectedSpot}
        open={reservationModalOpen}
        onOpenChange={setReservationModalOpen}
        onSuccess={handleReservationSuccess}
      />

      <QRCodeModal reservation={qrReservation} open={qrModalOpen} onOpenChange={setQrModalOpen} />
    </div>
  )
}