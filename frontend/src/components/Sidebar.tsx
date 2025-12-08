"use client"

import { cn } from "../lib/utils"
import type { View } from "../types"
import { LayoutDashboard, Car, CalendarClock, PlusCircle, Receipt, ChevronLeft, ChevronRight } from "lucide-react"

interface SidebarProps {
  currentView: View
  setCurrentView: (view: View) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const navItems = [
  { id: "dashboard" as View, label: "Home", icon: LayoutDashboard },
  { id: "spots" as View, label: "Parking Spots", icon: Car },
  { id: "reservations" as View, label: "My Reservations", icon: CalendarClock },
  { id: "list" as View, label: "List Spot", icon: PlusCircle },
  { id: "payments" as View, label: "Payments", icon: Receipt },
]

export function Sidebar({ currentView, setCurrentView, isOpen, setIsOpen }: SidebarProps) {
  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-card transition-all duration-300",
        isOpen ? "w-64" : "w-16",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Car className="h-5 w-5 text-primary-foreground" />
        </div>
        {isOpen && <span className="font-semibold text-lg tracking-tight">ParkChain</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {isOpen && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Collapse Button */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  )
}
