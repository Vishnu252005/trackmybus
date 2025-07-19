import React, { useState } from 'react';
import { Calendar, Clock, User, CreditCard, MapPin, Check } from 'lucide-react';
import { mockRoutes, mockSeats } from '../data/mockData';
import { Route, Ticket } from '../types';

const BookingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedSeat, setSelectedSeat] = useState('');
  const [passengerDetails, setPassengerDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [bookedTicket, setBookedTicket] = useState<Ticket | null>(null);

  const timeSlots = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30'];

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
    setStep(2);
  };

  const handleTimeSelect = () => {
    if (selectedDate && selectedTime) {
      setStep(3);
    }
  };

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeat(seatId);
    setStep(4);
  };

  const handleBooking = () => {
    if (!selectedRoute || !passengerDetails.name || !passengerDetails.email) return;

    const ticket: Ticket = {
      id: `TKT-${Date.now()}`,
      routeId: selectedRoute.id,
      busNumber: selectedRoute.buses[0],
      passengerName: passengerDetails.name,
      passengerEmail: passengerDetails.email,
      seatNumber: selectedSeat,
      date: selectedDate,
      time: selectedTime,
      price: selectedRoute.price,
      status: 'confirmed'
    };

    // Save to localStorage
    const existingTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    localStorage.setItem('tickets', JSON.stringify([...existingTickets, ticket]));

    setBookedTicket(ticket);
    setStep(5);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Select Route
            </h2>
            <div className="grid gap-4">
              {mockRoutes.map((route) => (
                <div
                  key={route.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleRouteSelect(route)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {route.name}
                    </h3>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                      ${route.price}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{route.distance} km</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{route.duration} min</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Select Date & Time
            </h2>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Travel Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Departure Time
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        selectedTime === time
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleTimeSelect}
                disabled={!selectedDate || !selectedTime}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Continue to Seat Selection
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Select Seat
            </h2>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="mb-6">
                <div className="text-center mb-4">
                  <div className="inline-block bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Driver</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                  {mockSeats.map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => seat.available && handleSeatSelect(seat.id)}
                      disabled={!seat.available}
                      className={`aspect-square rounded-lg border-2 font-medium text-sm transition-colors ${
                        selectedSeat === seat.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : seat.available
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 cursor-not-allowed'
                      }`}
                    >
                      {seat.id}
                    </button>
                  ))}
                </div>

                <div className="flex justify-center space-x-6 mt-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">Available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">Occupied</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-600 border border-blue-600 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">Selected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Passenger Details
            </h2>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={passengerDetails.name}
                    onChange={(e) => setPassengerDetails({ ...passengerDetails, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={passengerDetails.email}
                    onChange={(e) => setPassengerDetails({ ...passengerDetails, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={passengerDetails.phone}
                    onChange={(e) => setPassengerDetails({ ...passengerDetails, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Booking Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Route:</span>
                    <span className="text-gray-900 dark:text-white">{selectedRoute?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date & Time:</span>
                    <span className="text-gray-900 dark:text-white">{selectedDate} at {selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Seat:</span>
                    <span className="text-gray-900 dark:text-white">{selectedSeat}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-gray-900 dark:text-white">${selectedRoute?.price}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={!passengerDetails.name || !passengerDetails.email}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <CreditCard className="h-5 w-5" />
                <span>Complete Booking</span>
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Booking Confirmed!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your ticket has been booked successfully. A confirmation email has been sent to {bookedTicket?.passengerEmail}.
              </p>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Ticket Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Ticket ID:</span>
                    <span className="font-mono text-gray-900 dark:text-white">{bookedTicket?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Route:</span>
                    <span className="text-gray-900 dark:text-white">{selectedRoute?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Bus:</span>
                    <span className="text-gray-900 dark:text-white">{bookedTicket?.busNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date & Time:</span>
                    <span className="text-gray-900 dark:text-white">{bookedTicket?.date} at {bookedTicket?.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Seat:</span>
                    <span className="text-gray-900 dark:text-white">{bookedTicket?.seatNumber}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => window.print()}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Print Ticket
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedRoute(null);
                    setSelectedDate('');
                    setSelectedTime('');
                    setSelectedSeat('');
                    setPassengerDetails({ name: '', email: '', phone: '' });
                    setBookedTicket(null);
                  }}
                  className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Book Another Ticket
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Book Your Ticket
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Simple and secure ticket booking in just a few steps.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNumber < step
                      ? 'bg-green-600 text-white'
                      : stepNumber === step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {stepNumber < step ? <Check className="h-4 w-4" /> : stepNumber}
                </div>
                {stepNumber < 5 && (
                  <div
                    className={`w-full h-1 mx-2 ${
                      stepNumber < step ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
            <span>Route</span>
            <span>Date & Time</span>
            <span>Seat</span>
            <span>Details</span>
            <span>Confirm</span>
          </div>
        </div>

        {renderStep()}
      </div>
    </div>
  );
};

export default BookingPage;