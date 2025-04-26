import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dryrun } from '@permaweb/aoconnect';
import { motion } from 'framer-motion';

interface Property {
  id: string;
  name: string;
  location: string;
  price: number;
  totalShares: number;
  availableShares: number;
  imageUrl: string;
}

interface PropertyListProps {
  walletConnected: boolean;
}

const PROCESS_ID = 'qeEU7Tiwm2qqK_akYG8N66IYrYhsbnpXXMvMLaLmPto';

export default function PropertyList({ walletConnected }: PropertyListProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Available Properties</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <motion.div
            key={property.id}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <img
              src={property.imageUrl}
              alt={property.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{property.name}</h2>
              <p className="text-gray-600 mb-4">{property.location}</p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Price per Share</span>
                <span className="font-semibold">${property.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-600">Available Shares</span>
                <span className="font-semibold">
                  {property.availableShares} / {property.totalShares}
                </span>
              </div>
              <Link
                to={`/property/${property.id}`}
                className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                View Details
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}