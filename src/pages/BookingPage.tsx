import React, { useState, useContext } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AuthContext } from '../App';
import { Calendar, MapPin, Bus, User, Clock, Heart } from 'lucide-react';

const BookingPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [route, setRoute] = useState('City Center → Airport');
  const [busId, setBusId] = useState('bus1');
  const [busName, setBusName] = useState('B101');
  const [seat, setSeat] = useState('12A');
  const [date, setDate] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setError('You must be logged in.');
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        username: user.displayName || '',
        email: user.email || '',
        route,
        busId,
        busName,
        seat,
        date: new Date(date),
        status: 'upcoming',
        createdAt: serverTimestamp(),
        specialNeeds,
      });
      setSuccess('Booking successful!');
      // Reset form after successful booking
      setRoute('City Center → Airport');
      setBusId('bus1');
      setBusName('B101');
      setSeat('12A');
      setDate('');
      setSpecialNeeds('');
    } catch (err: any) {
      setError('Booking failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Book Your Ticket
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Secure your seat with our easy booking system
          </p>
        </div>

        {/* Booking Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    {success}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleBook} className="space-y-6">
            {/* Route Selection */}
            <div>
              <label htmlFor="route" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="inline h-4 w-4 mr-2" />
                Route
              </label>
              <input
                id="route"
                type="text"
                value={route}
                onChange={e => setRoute(e.target.value)}
                placeholder="Enter route (e.g., City Center → Airport)"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                required
              />
            </div>

            {/* Bus Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="busId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Bus className="inline h-4 w-4 mr-2" />
                  Bus ID
                </label>
                <input
                  id="busId"
                  type="text"
                  value={busId}
                  onChange={e => setBusId(e.target.value)}
                  placeholder="Enter bus ID"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="busName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Bus className="inline h-4 w-4 mr-2" />
                  Bus Name
                </label>
                <input
                  id="busName"
                  type="text"
                  value={busName}
                  onChange={e => setBusName(e.target.value)}
                  placeholder="Enter bus name"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Seat and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="seat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="inline h-4 w-4 mr-2" />
                  Seat Number
                </label>
                <input
                  id="seat"
                  type="text"
                  value={seat}
                  onChange={e => setSeat(e.target.value)}
                  placeholder="Enter seat number"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  Date & Time
                </label>
                <input
                  id="date"
                  type="datetime-local"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  required
                />
              </div>
            </div>

            {/* Special Needs */}
            <div>
              <label htmlFor="specialNeeds" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Heart className="inline h-4 w-4 mr-2" />
                Special Needs (Optional)
              </label>
              <textarea
                id="specialNeeds"
                value={specialNeeds}
                onChange={e => setSpecialNeeds(e.target.value)}
                placeholder="Any special requirements or accessibility needs..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5" />
                    <span>Book Ticket</span>
                  </>
                )}
              </button>
            </div>
      </form>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2">📋 <strong>Booking Information:</strong></p>
              <ul className="space-y-1 text-xs">
                <li>• Tickets are non-refundable within 24 hours of departure</li>
                <li>• Please arrive 15 minutes before departure time</li>
                <li>• Valid ID required for boarding</li>
                <li>• Contact support for any special assistance needs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;