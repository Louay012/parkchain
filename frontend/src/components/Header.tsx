"use client"

import { useWallet } from "../context/WalletContext"
import { Menu, Wallet, LogOut, Copy, ExternalLink, AlertTriangle, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { useState, useRef, useEffect } from "react"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { account, balance, isConnecting, isCorrectNetwork, connectWallet, disconnectWallet, switchNetwork } =
    useWallet()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account)
      toast.success("Address copied to clipboard")
    }
    setDropdownOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="rounded-lg p-2 hover:bg-secondary lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <p className="hidden text-sm text-muted-foreground sm:block">Decentralized Parking Platform</p>
      </div>

      <div className="flex items-center gap-3">
        {account && !isCorrectNetwork && (
          <button
            onClick={switchNetwork}
            className="flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Wrong Network</span>
          </button>
        )}

        {account ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-border bg-transparent px-3 py-2 hover:bg-secondary"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                <Wallet className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="hidden font-mono text-sm sm:inline">{truncateAddress(account)}</span>
              <span className="hidden rounded bg-secondary px-2 py-0.5 text-xs md:inline">
                {Number.parseFloat(balance).toFixed(4)} ETH
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-card p-1 shadow-lg">
                <div className="px-3 py-2">
                  <p className="text-xs text-muted-foreground">Connected Wallet</p>
                  <p className="font-mono text-sm">{truncateAddress(account)}</p>
                </div>
                <div className="h-px bg-border" />
                <button
                  onClick={copyAddress}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-secondary"
                >
                  <Copy className="h-4 w-4" />
                  Copy Address
                </button>
                <a
                  href={`https://etherscan.io/address/${account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-secondary"
                  onClick={() => setDropdownOpen(false)}
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Explorer
                </a>
                <div className="h-px bg-border" />
                <button
                  onClick={ () => {
                    disconnectWallet()
                    setDropdownOpen(false)
                    
                  }}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-destructive hover:bg-secondary"
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={async() =>{ 
              connectWallet()
              if (window.ethereum) {
                      await window.ethereum.request({
                        method: 'wallet_requestPermissions',
                        params: [{ eth_accounts: {} }]
                      });
                    }
            }}
            disabled={isConnecting}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Wallet className="h-4 w-4" />
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  )
}
