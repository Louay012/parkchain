"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { ethers } from "ethers"
import { toast } from "sonner"
import { NETWORK } from "../lib/contracts"

interface WalletContextType {
  account: string | null
  balance: string
  chainId: number | null
  isConnecting: boolean
  isCorrectNetwork: boolean
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchNetwork: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState("0")
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)

  const isCorrectNetwork = chainId === NETWORK.CHAIN_ID

  const updateBalance = useCallback(async (address: string, prov: ethers.BrowserProvider) => {
    try {
      const bal = await prov.getBalance(address)
      setBalance(ethers.formatEther(bal))
    } catch (error) {
      console.error("Failed to fetch balance:", error)
      setBalance("0")
    }
  }, [])

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not found")
      return
    }

    try {
      console.log("Attempting to switch to chain:", NETWORK.CHAIN_ID)
      const chainIdHex = `0x${NETWORK.CHAIN_ID.toString(16)}`
      
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      })
      
      // Wait for chain to actually switch
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Switched to Hardhat network")
    } catch (error: any) {
      console.error("Switch network error:", error.code, error.message)
      
      if (error.code === 4902) {
        try {
          console.log("Network not found, adding it...")
          const chainIdHex = `0x${NETWORK.CHAIN_ID.toString(16)}`
          
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chainIdHex,
                chainName: NETWORK.NAME,
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: [NETWORK.RPC_URL],
                blockExplorerUrls: [],
              },
            ],
          })
          
          // Wait for network to be added
          await new Promise((resolve) => setTimeout(resolve, 1000))
          toast.success("Hardhat network added successfully")
        } catch (addError) {
          console.error("Failed to add network:", addError)
          toast.error("Failed to add Hardhat network")
        }
      } else {
        console.error("Failed to switch network:", error)
        toast.error("Failed to switch network. Please switch manually in MetaMask.")
      }
    }
  }, [])

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast.error("MetaMask not detected. Please install MetaMask.")
      return
    }

    setIsConnecting(true)
    try {
      const prov = new ethers.BrowserProvider(window.ethereum)
      const accounts = await prov.send("eth_requestAccounts", [])
      const network = await prov.getNetwork()
      const sign = await prov.getSigner()

      setProvider(prov)
      setSigner(sign)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))
      
      console.log("Connected account:", accounts[0])
      console.log("Current chain ID:", Number(network.chainId))
      console.log("Expected chain ID:", NETWORK.CHAIN_ID)

      // Update balance
      await updateBalance(accounts[0], prov)

      // Switch network if needed
      if (Number(network.chainId) !== NETWORK.CHAIN_ID) {
        console.log("Wrong network, switching...")
        await switchNetwork()
        // Wait and reconnect to get updated network
        await new Promise((resolve) => setTimeout(resolve, 2000))
        const newNetwork = await prov.getNetwork()
        setChainId(Number(newNetwork.chainId))
      }

      toast.success("Wallet connected successfully!")
    } catch (error: any) {
      console.error("Failed to connect wallet:", error)
      toast.error(error.message || "Failed to connect wallet")
      setIsConnecting(false)
    } finally {
      setIsConnecting(false)
    }
  }, [updateBalance, switchNetwork])

  const disconnectWallet = useCallback(() => {
    setAccount(null)
    setBalance("0")
    setChainId(null)
    setProvider(null)
    setSigner(null)
    toast.info("Wallet disconnected")
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("Accounts changed:", accounts)
      if (accounts.length === 0) {
        disconnectWallet()
      } else if (accounts[0] !== account) {
        setAccount(accounts[0])
        if (provider) {
          updateBalance(accounts[0], provider)
        }
      }
    }

    const handleChainChanged = (chainIdHex: string) => {
      console.log("Chain changed to:", chainIdHex)
      const newChainId = Number.parseInt(chainIdHex, 16)
      setChainId(newChainId)
      
      if (newChainId !== NETWORK.CHAIN_ID) {
        toast.error("You are on the wrong network. Please switch to Hardhat.")
      } else {
        toast.success("Switched to correct network!")
      }
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged)
    window.ethereum.on("chainChanged", handleChainChanged)

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged)
      window.ethereum?.removeListener("chainChanged", handleChainChanged)
    }
  }, [account, provider, disconnectWallet, updateBalance])

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === "undefined" || !window.ethereum) return

      try {
        const prov = new ethers.BrowserProvider(window.ethereum)
        const accounts = await prov.listAccounts()

        if (accounts.length > 0) {
          const network = await prov.getNetwork()
          const sign = await prov.getSigner()

          console.log("Auto-connecting to:", accounts[0].address, "Chain ID:", Number(network.chainId))

          setProvider(prov)
          setSigner(sign)
          setAccount(accounts[0].address)
          setChainId(Number(network.chainId))
          await updateBalance(accounts[0].address, prov)
        }
      } catch (error) {
        console.error("Auto-connect failed:", error)
      }
    }

    checkConnection()
  }, [updateBalance])

  return (
    <WalletContext.Provider
      value={{
        account,
        balance,
        chainId,
        isConnecting,
        isCorrectNetwork,
        provider,
        signer,
        connectWallet,
        disconnectWallet,
        switchNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}