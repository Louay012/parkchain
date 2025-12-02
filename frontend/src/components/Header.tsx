interface HeaderProps {
  walletAddress: string;
  onConnectWallet: () => void;
}

function Header({ walletAddress, onConnectWallet }: HeaderProps) {
  return (
    <header className="bg-park-dark text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
          </svg>
          <h1 className="text-2xl font-bold">ParkChain</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {walletAddress ? (
            <div className="bg-park-blue px-4 py-2 rounded-lg">
              <span className="text-sm">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="bg-park-blue hover:bg-blue-600 px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
