import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, MapPin, Calendar, MessageCircle, Clock, Star, Shield } from 'lucide-react';
import MapSimulation from '../components/MapSimulation';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: Clock,
      title: 'Real-time Tracking',
      description: 'Track buses live with accurate ETAs and location updates.'
    },
    {
      icon: MapPin,
      title: 'Smart Routes',
      description: 'Find the fastest routes with real-time traffic data.'
    },
    {
      icon: Calendar,
      title: 'Easy Booking',
      description: 'Book tickets in seconds with seat selection and confirmation.'
    },
    {
      icon: MessageCircle,
      title: 'AI Assistant',
      description: 'Get help with voice commands and natural language queries.'
    }
  ];

  const stats = [
    { number: '50K+', label: 'Daily Passengers' },
    { number: '200+', label: 'Bus Routes' },
    { number: '99.9%', label: 'Uptime' },
    { number: '4.8★', label: 'User Rating' }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Smart Public Transport at Your
                  <span className="block text-yellow-300">Fingertips</span>
                </h1>
                <p className="text-xl md:text-2xl text-blue-100 max-w-2xl">
                  Track buses in real-time, find optimal routes, and book tickets effortlessly with our AI-powered platform.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/track"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-300 transition-colors shadow-lg"
                >
                  <Bus className="mr-2 h-5 w-5" />
                  Track Now
                </Link>
                <Link
                  to="/book"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold border-2 border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition-colors"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Book Tickets
                </Link>
              </div>

              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-400" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span>4.8/5 Rating</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <MapSimulation className="h-96" />
              <div className="absolute -top-4 -right-4 bg-green-500 text-white p-3 rounded-full animate-pulse">
                <Bus className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-400 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Track My Bus?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Experience the future of public transportation with cutting-edge technology and user-friendly design.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Commute?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of satisfied users who've made their daily travel smarter and more efficient.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/track"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Start Tracking
            </Link>
            <Link
              to="/assistant"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold border-2 border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition-colors"
            >
              Try AI Assistant
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;