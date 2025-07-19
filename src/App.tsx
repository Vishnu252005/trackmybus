import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import TrackingPage from './pages/TrackingPage';
import RoutePage from './pages/RoutePage';
import BookingPage from './pages/BookingPage';
import AssistantPage from './pages/AssistantPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/track" element={<TrackingPage />} />
          <Route path="/routes" element={<RoutePage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;