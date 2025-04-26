import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import PropertyList from './components/PropertyList';
import PropertyDetails from './components/PropertyDetails';
import Portfolio from './components/Portfolio';
import WalletConnect from './components/WalletConnect';

export default function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (window.arweaveWallet) {
        const address = await window.arweaveWallet.getActiveAddress();
        if (address) {
          setWalletAddress(address);
          setWalletConnected(true);
        }
      }
    } catch (error) {
      console.error('Wallet check failed:', error);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar walletConnected={walletConnected} walletAddress={walletAddress} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={
              <Dashboard 
                walletConnected={walletConnected} 
                walletAddress={walletAddress} 
              />
            } />
            <Route path="/properties" element={
              <PropertyList 
                walletConnected={walletConnected}
              />
            } />
            <Route path="/property/:id" element={
              <PropertyDetails 
                walletConnected={walletConnected}
                walletAddress={walletAddress}
              />
            } />
            <Route path="/portfolio" element={
              <Portfolio 
                walletConnected={walletConnected}
                walletAddress={walletAddress}
              />
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}