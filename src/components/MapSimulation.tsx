import React, { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Bus } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface MapSimulationProps {
  buses?: Bus[];
  route?: { from: string; to: string };
  className?: string;
}

const MapSimulation: React.FC<MapSimulationProps> = ({ buses, route, className = '' }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
        <LoadingSpinner text="Loading map..." />
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 rounded-lg relative overflow-hidden ${className}`}>
      {/* Simulated map background */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 400 300">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Simulated roads */}
          <path d="M0,150 Q100,100 200,150 T400,150" stroke="currentColor" strokeWidth="3" fill="none" />
          <path d="M200,0 L200,300" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M0,100 L400,100" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </div>

      {/* Route line */}
      {route && (
        <div className="absolute inset-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-full shadow-md">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">{route.from}</span>
          </div>
          <div className="flex-1 mx-4 border-t-2 border-dashed border-blue-500" />
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-full shadow-md">
            <MapPin className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">{route.to}</span>
          </div>
        </div>
      )}

      {/* Bus markers */}
      {buses && buses.map((bus, index) => (
        <div
          key={bus.id}
          className="absolute bg-blue-600 text-white p-2 rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${30 + (index * 25)}%`,
            top: `${40 + (index * 15)}%`,
          }}
        >
          <Navigation className="h-4 w-4" />
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-md">
            <span className="text-xs font-medium text-gray-900 dark:text-white">{bus.number}</span>
          </div>
        </div>
      ))}

      {!buses && !route && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">Interactive Map View</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapSimulation;