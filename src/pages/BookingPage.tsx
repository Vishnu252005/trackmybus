import React, { useState, useContext } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AuthContext } from '../App';

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
    } catch (err: any) {
      setError('Booking failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white dark:bg-gray-800 p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Book a Ticket</h2>
      {success && <div className="mb-4 text-green-600">{success}</div>}
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <form onSubmit={handleBook} className="flex flex-col gap-4">
        <input type="text" value={route} onChange={e => setRoute(e.target.value)} placeholder="Route" className="px-3 py-2 rounded border" required />
        <input type="text" value={busId} onChange={e => setBusId(e.target.value)} placeholder="Bus ID" className="px-3 py-2 rounded border" required />
        <input type="text" value={busName} onChange={e => setBusName(e.target.value)} placeholder="Bus Name" className="px-3 py-2 rounded border" required />
        <input type="text" value={seat} onChange={e => setSeat(e.target.value)} placeholder="Seat" className="px-3 py-2 rounded border" required />
        <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 rounded border" required />
        <input type="text" value={specialNeeds} onChange={e => setSpecialNeeds(e.target.value)} placeholder="Special Needs (optional)" className="px-3 py-2 rounded border" />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={loading}>{loading ? 'Booking...' : 'Book Ticket'}</button>
      </form>
    </div>
  );
};

export default BookingPage;