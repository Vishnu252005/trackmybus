import React, { useState, useEffect } from 'react';
import { MapPin, Clock, DollarSign, Navigation, Route } from 'lucide-react';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Route as RouteType } from '../types';
import MapSimulation from '../components/MapSimulation';
import LoadingSpinner from '../components/LoadingSpinner';

// Firestore route type
type FirestoreRoute = {
  id: string;
  name: string;
  from: string;
  to: string;
  distance: number;
  duration: number;
  price: number;
  buses: string[];
};

const RoutePage: React.FC = () => {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [allRoutes, setAllRoutes] = useState<RouteType[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  // Convert Firestore route to Route type
  const convertFirestoreRouteToRoute = (firestoreRoute: FirestoreRoute): RouteType => {
    return {
      id: firestoreRoute.id,
      name: firestoreRoute.name,
      from: firestoreRoute.from,
      to: firestoreRoute.to,
      distance: firestoreRoute.distance,
      duration: firestoreRoute.duration,
      price: firestoreRoute.price,
      buses: firestoreRoute.buses
    };
  };

  // Fetch routes from Firestore
  const fetchRoutesFromFirestore = async () => {
    try {
      setLoading(true);
      const routesQuery = query(collection(db, 'routes'));
      const snapshot = await getDocs(routesQuery);
      
      const firestoreRoutes: FirestoreRoute[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<FirestoreRoute, 'id'>)
      }));

      const convertedRoutes = firestoreRoutes.map(convertFirestoreRouteToRoute);
      setAllRoutes(convertedRoutes);
      setRoutes(convertedRoutes);
      console.log('Fetched routes from Firestore:', convertedRoutes.length);
    } catch (error) {
      console.error('Error fetching routes:', error);
      // Fallback to mock data if Firestore fails
      const mockRoutes = [
        {
          id: '1',
          name: 'Kollam → Thiruvananthapuram',
          from: 'Kollam',
          to: 'Thiruvananthapuram',
          distance: 65,
          duration: 90,
          price: 120,
          buses: ['101', '102', '103']
        },
        {
          id: '2',
          name: 'Kochi → Kozhikode',
          from: 'Kochi',
          to: 'Kozhikode',
          distance: 120,
          duration: 150,
          price: 180,
          buses: ['201', '202']
        },
        {
          id: '3',
          name: 'Thrissur → Palakkad',
          from: 'Thrissur',
          to: 'Palakkad',
          distance: 45,
          duration: 60,
          price: 80,
          buses: ['301', '302', '303']
        }
      ];
      setAllRoutes(mockRoutes);
      setRoutes(mockRoutes);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time listener
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'routes'),
      (snapshot) => {
        const firestoreRoutes: FirestoreRoute[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<FirestoreRoute, 'id'>)
        }));

        const convertedRoutes = firestoreRoutes.map(convertFirestoreRouteToRoute);
        setAllRoutes(convertedRoutes);
        console.log('Real-time route update:', convertedRoutes.length, 'routes');
      },
      (error) => {
        console.error('Real-time listener error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchRoutesFromFirestore();
  }, []);

  const handleSearch = () => {
    if (!fromLocation || !toLocation) return;

    setSearching(true);
    // Filter routes based on search criteria
    setTimeout(() => {
      const filteredRoutes = allRoutes.filter(route =>
        route.from.toLowerCase().includes(fromLocation.toLowerCase()) ||
        route.to.toLowerCase().includes(toLocation.toLowerCase()) ||
        route.name.toLowerCase().includes(fromLocation.toLowerCase()) ||
        route.name.toLowerCase().includes(toLocation.toLowerCase())
      );
      setRoutes(filteredRoutes);
      setSearching(false);
    }, 1000);
  };

  const swapLocations = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading routes..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Route Finder
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find the best routes with real-time traffic data and shortest paths.
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="grid md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  placeholder="Enter starting location"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={swapLocations}
                aria-label="Swap locations"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Route className="h-5 w-5 text-gray-500 dark:text-gray-400 transform rotate-90" />
              </button>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  placeholder="Enter destination"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={!fromLocation || !toLocation || searching}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {searching ? <LoadingSpinner size="sm" /> : 'Find Routes'}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Routes List */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Available Routes ({routes.length})
            </h2>
            
            {searching ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Finding best routes..." />
              </div>
            ) : (
              <div className="space-y-4">
                {routes.map((route) => (
                  <div
                    key={route.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow cursor-pointer transition-shadow border-2 ${
                      selectedRoute?.id === route.id
                        ? 'border-blue-500 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedRoute(route)}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {route.name}
                        </h3>
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-sm font-medium">
                          ₹{route.price}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">{route.duration} min</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Navigation className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">{route.distance} km</span>
                          </div>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          Buses: {route.buses.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {routes.length === 0 && !searching && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No routes found. Try searching for different locations.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Map and Route Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedRoute ? selectedRoute.name : 'Route Map'}
                </h2>
              </div>
              <div className="p-6">
                <MapSimulation
                  route={selectedRoute ? { from: selectedRoute.from, to: selectedRoute.to } : undefined}
                  className="h-80"
                />
              </div>
            </div>

            {/* Route Details */}
            {selectedRoute && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Route Details
                </h3>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedRoute.duration} min
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                      <Navigation className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Distance</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedRoute.distance} km
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
                      <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        ₹{selectedRoute.price}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Available Buses</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoute.buses.map((bus) => (
                      <span
                        key={bus}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium"
                      >
                        {bus}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <button className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Book This Route
                  </button>
                  <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                    Track Buses
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutePage;