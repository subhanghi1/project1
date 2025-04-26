import { useState } from 'react';

interface WalletConnectProps {
  connected: boolean;
  address: string;
}

export default function WalletConnect({ connected, address }: WalletConnectProps) {
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    try {
      setConnecting(true);
      await window.arweaveWallet.connect([
        'ACCESS_ADDRESS',
        'SIGN_TRANSACTION',
        'ACCESS_PUBLIC_KEY'
      ]);
      window.location.reload();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await window.arweaveWallet.disconnect();
      window.location.reload();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  if (connected) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={disconnectWallet}
          className="px-4 py-2 text-sm text-red-600 hover:text-red-700"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={connecting}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}