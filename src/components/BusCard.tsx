import React from 'react';
import { MapPin, Clock, Users } from 'lucide-react';
import { Bus } from '../types';

interface BusCardProps {
  bus: Bus;
  onClick?: () => void;
}

const BusCard: React.FC<BusCardProps> = ({ bus, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-time': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'delayed': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'early': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const occupancyPercentage = (bus.occupancy / bus.capacity) * 100;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bus {bus.number}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{bus.route}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bus.status)}`}>
            {bus.status.charAt(0).toUpperCase() + bus.status.slice(1)}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">{bus.currentLocation.address}</span>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              ETA: {bus.eta} min • {bus.distance} km away
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {bus.occupancy}/{bus.capacity} seats
              </span>
            </div>
            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  occupancyPercentage > 80 ? 'bg-red-500' : 
                  occupancyPercentage > 50 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusCard;