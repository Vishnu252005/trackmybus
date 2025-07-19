import React, { useState, useEffect } from 'react';
import { RefreshCw, Filter, Search } from 'lucide-react';
import { mockBuses } from '../data/mockData';
import { Bus } from '../types';
import BusCard from '../components/BusCard';
import MapSimulation from '../components/MapSimulation';
import LoadingSpinner from '../components/LoadingSpinner';

const TrackingPage: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [filteredBuses, setFilteredBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setBuses(mockBuses);
      setFilteredBuses(mockBuses);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let filtered = buses.filter(bus =>
      bus.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.currentLocation.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(bus => bus.status === statusFilter);
    }

    setFilteredBuses(filtered);
  }, [buses, searchTerm, statusFilter]);

  const refreshData = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setBuses([...mockBuses]);
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading bus locations..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Real-time Bus Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track all buses in real-time with live location updates and ETAs.
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by bus number, route, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="on-time">On Time</option>
                  <option value="delayed">Delayed</option>
                  <option value="early">Early</option>
                </select>
              </div>
            </div>

            <button
              onClick={refreshData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Bus List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Active Buses ({filteredBuses.length})
            </h2>
            {filteredBuses.map((bus) => (
              <BusCard
                key={bus.id}
                bus={bus}
                onClick={() => setSelectedBus(bus)}
              />
            ))}
            {filteredBuses.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No buses found matching your criteria.
              </div>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedBus ? `Bus ${selectedBus.number} - ${selectedBus.route}` : 'Live Map View'}
                </h2>
                {selectedBus && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Currently at: {selectedBus.currentLocation.address}
                  </p>
                )}
              </div>
              <div className="p-6">
                <MapSimulation
                  buses={selectedBus ? [selectedBus] : filteredBuses}
                  className="h-96"
                />
              </div>
            </div>

            {/* Bus Details */}
            {selectedBus && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Bus Details
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Route:</span>
                      <p className="text-gray-900 dark:text-white">{selectedBus.route}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Destination:</span>
                      <p className="text-gray-900 dark:text-white">{selectedBus.destination}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Location:</span>
                      <p className="text-gray-900 dark:text-white">{selectedBus.currentLocation.address}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">ETA:</span>
                      <p className="text-gray-900 dark:text-white">{selectedBus.eta} minutes</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Distance:</span>
                      <p className="text-gray-900 dark:text-white">{selectedBus.distance} km</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Occupancy:</span>
                      <p className="text-gray-900 dark:text-white">
                        {selectedBus.occupancy}/{selectedBus.capacity} passengers
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;