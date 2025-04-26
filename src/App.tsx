import { useState, useEffect } from 'react';
import { dryrun, message, createDataItemSigner } from '@permaweb/aoconnect';
import { motion } from 'framer-motion';

interface Property {
  id: string;
  owner: string;
  total_shares: number;
  available_shares: number;
  price_per_share: number;
  details: {
    location: string;
    area: string;
    description: string;
  };
}

interface UserShare {
  property_id: string;
  shares: number;
  property_details: Property;
}

const PROCESS_ID = 'qeEU7Tiwm2qqK_akYG8N66IYrYhsbnpXXMvMLaLmPto';

export default function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [userShares, setUserShares] = useState<UserShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [shareQuantity, setShareQuantity] = useState(1);
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    checkWalletConnection();
    fetchProperties();
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (window.arweaveWallet) {
        await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION']);
        setWalletConnected(true);
        fetchUserShares();
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
    }
  };

  const fetchProperties = async () => {
    try {
      const result = await dryrun({
        process: PROCESS_ID,
        tags: [{ name: 'Action', value: 'GetProperties' }]
      });
      
      if (result.Messages?.[0]?.Data) {
        setProperties(JSON.parse(result.Messages[0].Data));
      }
    } catch (err) {
      setError('Failed to fetch properties');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserShares = async () => {
    if (!walletConnected) return;
    
    try {
      const result = await dryrun({
        process: PROCESS_ID,
        tags: [{ name: 'Action', value: 'GetUserShares' }]
      });
      
      if (result.Messages?.[0]?.Data) {
        setUserShares(JSON.parse(result.Messages[0].Data));
      }
    } catch (err) {
      console.error('Failed to fetch user shares:', err);
    }
  };

  const handleBuyShares = async (property: Property) => {
    if (!walletConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      const signer = createDataItemSigner(window.arweaveWallet);
      await message({
        process: PROCESS_ID,
        tags: [
          { name: 'Action', value: 'BuyShares' },
          { name: 'property_id', value: property.id },
          { name: 'quantity', value: shareQuantity.toString() }
        ],
        signer
      });

      await fetchProperties();
      await fetchUserShares();
      setError('');
    } catch (err) {
      setError('Transaction failed');
      console.error(err);
    }
  };

  const connectWallet = async () => {
    await checkWalletConnection();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-900">Fractional Land Ownership</h1>
        {!walletConnected ? (
          <button
            onClick={connectWallet}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Connect Wallet
          </button>
        ) : (
          <span className="text-green-600 font-semibold">Wallet Connected</span>
        )}
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <motion.div
            key={property.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{property.details.location}</h2>
              <p className="text-gray-600 mb-4">{property.details.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Area:</span>
                  <span className="font-semibold">{property.details.area}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Shares:</span>
                  <span className="font-semibold">{property.available_shares} / {property.total_shares}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Price per Share:</span>
                  <span className="font-semibold">${property.price_per_share.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="1"
                    max={property.available_shares}
                    value={shareQuantity}
                    onChange={(e) => setShareQuantity(parseInt(e.target.value))}
                    className="w-24 px-3 py-2 border rounded-md"
                  />
                  <button
                    onClick={() => handleBuyShares(property)}
                    disabled={!walletConnected || property.available_shares === 0}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    Buy Shares
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {walletConnected && userShares.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Property Shares</h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares Owned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userShares.map((share) => (
                  <tr key={share.property_id}>
                    <td className="px-6 py-4 whitespace-nowrap">{share.property_details.details.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{share.shares}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${(share.shares * share.property_details.price_per_share).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
