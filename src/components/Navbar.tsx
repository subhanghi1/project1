import { Link } from 'react-router-dom';
import WalletConnect from './WalletConnect';

interface NavbarProps {
  walletConnected: boolean;
  walletAddress: string;
}

export default function Navbar({ walletConnected, walletAddress }: NavbarProps) {
  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-gray-800">
              LandShare
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/properties" className="text-gray-600 hover:text-gray-900">
                Properties
              </Link>
              {walletConnected && (
                <Link to="/portfolio" className="text-gray-600 hover:text-gray-900">
                  My Portfolio
                </Link>
              )}
            </div>
          </div>
          <WalletConnect connected={walletConnected} address={walletAddress} />
        </div>
      </div>
    </nav>
  );
}