import React from 'react';

interface HeaderProps {
  walletAddress: string;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
}

const Header: React.FC<HeaderProps> = ({ walletAddress, onConnectWallet, onDisconnectWallet }) => {
  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">🅿️ ParkChain</h1>
        <div className="flex items-center gap-4">
          {walletAddress ? (
            <>
              <span className="text-sm bg-blue-700 px-3 py-1 rounded">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <button
                onClick={onDisconnectWallet}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-semibold transition"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={onConnectWallet}
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded font-semibold transition"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;