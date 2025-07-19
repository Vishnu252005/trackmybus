import React, { useState, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import TrackingPage from './pages/TrackingPage';
import RoutePage from './pages/RoutePage';
import BookingPage from './pages/BookingPage';
import AssistantPage from './pages/AssistantPage';
import ProfilePage from './pages/ProfilePage';
import { User } from './types';

export const AuthContext = createContext<{
  user: User | null;
  signIn: (email: string) => void;
  signOut: () => void;
}>({
  user: null,
  signIn: () => {},
  signOut: () => {},
});

function App() {
  const [user, setUser] = useState<User | null>(null);

  const signIn = (email: string) => setUser({ email });
  const signOut = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/track" element={<TrackingPage />} />
            <Route path="/routes" element={<RoutePage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;