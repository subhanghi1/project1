import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { dryrun, message, createDataItemSigner } from '@permaweb/aoconnect';
import { motion } from 'framer-motion';

interface PropertyDetailsProps {
  walletConnected: boolean;
  walletAddress: string;
}

interface Property {
  id: string;
  name: string;
  location: string;
  description: string;
  price: number;
  totalShares: number;
  availableShares: number;
  imageUrl: string;
  documents: string[];
  amenities: string[];
}

const PROCESS_ID = 'qeEU7Tiwm2qqK_akYG8N66IYrYhsbnpXXMvMLaLmPto';

export default function PropertyDetails({ walletConnected, walletAddress }: PropertyDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareQuantity, setShareQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (id) fetchPropertyDetails(id);
  }, [id]);

  const fetchPropertyDetails = async (propertyId: string) => {
    try {
      const result = await dryrun({
        process: PROCESS_ID,
        tags: [
          { name: 'Action', value: 'GetProperty' },
          { name: 'PropertyId', value: propertyId }
        ]
      });

      if (result.Messages?.[0]?.Data) {
        setProperty(JSON.parse(result.Messages[0].Data));
      }
    } catch (err) {
      setError('Failed to fetch property details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!walletConnected || !property) return;

    try {
      setPurchasing(true);
      const signer = createDataItemSigner(window.arweaveWallet);
      
      await message({
        process: PROCESS_ID,
        tags: [
          { name: 'Action', value: 'PurchaseShares' },
          { name: 'PropertyId', value: property.id },
          { name: 'Quantity', value: shareQuantity.toString() }
        ],
        signer
      });

      await fetchPropertyDetails(property.id);
      setError('');
    } catch (err) {
      setError('Failed to purchase shares');
      console.error(err);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center text-gray-600 p-4">
        Property not found
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg overflow-hidden"
      >
        <img
          src={property.imageUrl}
          alt={property.name}
          className="w-full h-96 object-cover"
        />
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">{property.name}</h1>
          <p className="text-gray-600 mb-6">{property.location}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Property Details</h2>
              <p className="text-gray-600 mb-4">{property.description}</p>
              
              <h3 className="font-semibold mb-2">Amenities</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4">
                {property.amenities.map((amenity, index) => (
                  <li key={index}>{amenity}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Investment Details</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per Share</span>
                  <span className="font-semibold">${property.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Shares</span>
                  <span className="font-semibold">
                    {property.availableShares} / {property.totalShares}
                  </span>
                </div>
                
                {walletConnected && property.availableShares > 0 && (
                  <div className="mt-6">
                    <label className="block text-gray-600 mb-2">Purchase Shares</label>
                    <div className="flex space-x-4">
                      <input
                        type="number"
                        min="1"
                        max={property.availableShares}
                        value={shareQuantity}
                        onChange={(e) => setShareQuantity(parseInt(e.target.value))}
                        className="w-24 px-3 py-2 border rounded-md"
                      />
                      <button
                        onClick={handlePurchase}
                        disabled={purchasing}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                      >
                        {purchasing ? 'Processing...' : 'Purchase'}
                      </button>
                    </div>
                  </div>
                )}
                
                {!walletConnected && (
                  <div className="text-center text-gray-600 mt-4">
                    Connect your wallet to purchase shares
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {property.documents.map((doc, index) => (
                <a
                  key={index}
                  href={doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Document {index + 1}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}