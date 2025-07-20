import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, Mic, MicOff, Bot, User, MapPin, Users } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, arrayUnion, addDoc, setDoc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import BusCard from '../components/BusCard';
import { AuthContext } from '../App';

// --- Groq API integration ---
// REMOVE: import Groq from 'groq-sdk';
// REMOVE: import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions.js';

const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function fetchGroqChat(messages: {role: string, content: string}[]) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages,
      max_tokens: 512,
      temperature: 0.7,
    }),
  });
  if (!response.ok) {
    throw new Error('Groq API error: ' + response.statusText);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response from Groq';
}

// Add translation helper
async function translateText(text: string, targetLang: string, sourceLang?: string): Promise<string> {
  if (targetLang === 'English') return text;
  // Map dropdown language to LibreTranslate codes
  const langMap: Record<string, string> = {
    English: 'en',
    Hindi: 'hi',
    Tamil: 'ta',
    Malayalam: 'ml',
    Telugu: 'te',
    Kannada: 'kn',
  };
  const to = langMap[targetLang] || 'en';
  const from = sourceLang ? langMap[sourceLang] : 'auto';
  try {
    const res = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: from, target: to, format: 'text' })
    });
    const data = await res.json();
    return data.translatedText || text;
  } catch {
    return text;
  }
}

// Helper to check if user is asking for a bus from X to Y
function parseBusQuery(text: string) {
  // e.g. 'bus from City Center to Airport' or 'buses from X to Y'
  const match = text.match(/bus(?:es)? from ([\w\s]+) to ([\w\s]+)/i);
  if (match) {
    return { from: match[1].trim(), to: match[2].trim() };
  }
  return null;
}

// Helper to check if user is asking for bookings
function isBookingQuery(text: string) {
  // e.g. 'show bookings', 'list all bookings', 'booking for ...'
  return /\b(bookings?|list bookings|show bookings|booking for)\b/i.test(text);
}

// Helper: strict bus query detection (tool-only pattern)
function isBusQuery(text: string) {
  return /\bbus(es)?\b/i.test(text);
}

// Helper: detect 'X to Y' route queries (even if 'bus' is not mentioned)
function isRouteQuery(text: string) {
  // e.g. 'kollam to tenkasi', 'city center to airport'
  return /([\w\s]+) to ([\w\s]+)/i.test(text);
}
function parseRouteQuery(text: string) {
  const match = text.match(/([\w\s]+) to ([\w\s]+)/i);
  if (match) {
    return { from: match[1].trim(), to: match[2].trim() };
  }
  return null;
}

// Type for Firestore bus documents (should match Firestore structure)
type FirestoreBus = {
  id: string;
  name: string;
  start: string;
  end: string;
  capacity: number;
  accessible?: boolean;
};

// Local type for assistant chat messages supporting bus-cards
export type AssistantChatMessage = {
  id: string;
  content?: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'bus-cards';
  buses?: (FirestoreBus & { timings?: any[] })[];
};

// Tool: fetch buses from Firestore (tool-only, never AI)
async function fetchBusesFromFirestore(busQuery?: { from: string; to: string }) {
  const snap = await getDocs(collection(db, 'buses'));
  const buses: FirestoreBus[] = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<FirestoreBus, 'id'>) }));
  let found = buses;
  let reply = '';
  if (busQuery) {
    found = buses.filter(b =>
      b.start && b.end &&
      b.start.toLowerCase().includes(busQuery.from.toLowerCase()) &&
      b.end.toLowerCase().includes(busQuery.to.toLowerCase())
    );
    if (found.length > 0) {
      reply = `Buses from ${busQuery.from} to ${busQuery.to} (Real-time data):\n`;
    } else {
      reply = 'No buses found in your database.';
    }
  } else if (found.length > 0) {
    reply = 'All buses (Real-time data):\n';
  } else {
    reply = 'No buses found in your database.';
  }
  
  for (const b of found) {
    reply += `• ${b.name} (From: ${b.start} To: ${b.end}, Capacity: ${b.capacity}${b.accessible ? ', Wheelchair Accessible' : ''})\n`;
    
    // Fetch real-time timings and booking data
    const timingsSnap = await getDocs(collection(db, 'buses', b.id, 'timings'));
    const timings = timingsSnap.docs.map(t => t.data());
    
    if (timings.length > 0) {
      reply += '   Real-time Timings:\n';
      for (const timing of timings) {
        const timingId = `timing_${timing.time.replace(/:/g, '_')}`;
        
        // Get real-time booking data for this timing
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('busId', '==', b.id),
          where('timingId', '==', timingId),
          where('status', 'in', ['confirmed', 'upcoming'])
        );
        const bookingsSnap = await getDocs(bookingsQuery);
        const bookedSeats = bookingsSnap.docs.map(doc => (doc.data() as any).seat).filter(Boolean);
        const availableSeats = (timing.availableSeats || b.capacity) - bookedSeats.length;
        
        reply += `     ⏰ ${timing.time} - Available: ${availableSeats}/${timing.availableSeats || b.capacity} seats`;
        if (bookedSeats.length > 0) {
          reply += ` (Booked: ${bookedSeats.join(', ')})`;
        }
        reply += '\n';
      }
    } else {
      reply += '   Timings: Not available\n';
    }
  }
  return reply;
}

// Type for Firestore booking documents (should match Firestore structure)
type FirestoreBooking = {
  id: string;
  username?: string;
  email?: string;
  route?: string;
  busName?: string;
  seat?: string;
  date?: string | { seconds: number };
  status?: string;
};

const AssistantPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    {
      id: '1',
      content: "Hello! I'm your AI travel assistant. I can help you book tickets, find routes, track buses, and answer questions about public transport. Try saying something like 'Book a ticket from City Center to Airport' or 'When is the next bus to Downtown?'",
      isUser: false,
      timestamp: new Date(),
      type: 'text',
    }
  ]);
  const [selectedBus, setSelectedBus] = useState<null | (FirestoreBus & { timings?: any[] })>(null);
  const [selectedTiming, setSelectedTiming] = useState<any>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [language, setLanguage] = useState('English');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Refresh booked seats when timing is selected
  useEffect(() => {
    if (selectedBus && selectedTiming) {
      const timingId = `timing_${selectedTiming.time.replace(/:/g, '_')}`;
      fetchBookedSeats(selectedBus.id, timingId);
    }
  }, [selectedBus, selectedTiming]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Handler for Book button (step 1)
  const handleBookBus = (bus: FirestoreBus & { timings?: any[] }) => {
    setSelectedBus(bus);
    setSelectedTiming(null);
    setSelectedSeat(null);
  };
  // Function to fetch booked seats for a specific bus and timing
  const fetchBookedSeats = async (busId: string, timingId: string) => {
    try {
      console.log('Fetching booked seats for bus:', busId, 'timing:', timingId);
      
      // First try to get the timing document
      const timingRef = doc(db, 'buses', busId, 'timings', timingId);
      const timingDoc = await getDoc(timingRef);
      
      if (timingDoc.exists()) {
        const timingData = timingDoc.data();
        const takenSeats = timingData.takenSeats || [];
        console.log('Found taken seats from timing doc:', takenSeats);
        setBookedSeats(takenSeats);
      } else {
        // If timing document doesn't exist, check bookings collection
        console.log('No timing document found, checking bookings collection...');
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('busId', '==', busId),
          where('timingId', '==', timingId)
        );
        const bookingsSnap = await getDocs(bookingsQuery);
        const bookedSeatsFromBookings = bookingsSnap.docs.map(doc => (doc.data() as any).seat).filter(Boolean);
        console.log('Found booked seats from bookings:', bookedSeatsFromBookings);
        setBookedSeats(bookedSeatsFromBookings);
      }
    } catch (error) {
      console.error('Error fetching booked seats:', error);
      setBookedSeats([]);
    }
  };

  // Handler for timing selection (step 2)
  const handleSelectTiming = async (timing: any) => {
    setSelectedTiming(timing);
    setSelectedSeat(null);
    // Fetch booked seats when timing is selected
    if (selectedBus) {
      const timingId = `timing_${timing.time.replace(/:/g, '_')}`;
      await fetchBookedSeats(selectedBus.id, timingId);
    }
  };
  // Handler for seat selection (step 3)
  const handleSelectSeat = async (seat: string) => {
    if (!user) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "You must be signed in to book a seat. Please sign in or sign up.",
        isUser: false,
        timestamp: new Date(),
        type: 'text',
      }]);
      return;
    }
    setSelectedSeat(seat);
    if (!selectedBus || !selectedTiming) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "Error: Bus or timing information is missing. Please try selecting the bus and timing again.",
        isUser: false,
        timestamp: new Date(),
        type: 'text',
      }]);
      return;
    }
    
    try {
      // Check user's current credits
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const currentCredits = userData?.credits || 0;
      const creditReward = 10; // Credits to add when booking a ticket
      
      // Create a consistent timing ID based on the time
      const timingId = `timing_${selectedTiming.time.replace(/:/g, '_')}`;
      
      // Update Firestore: add seat to takenSeats for this timing
      const timingRef = doc(db, 'buses', selectedBus.id, 'timings', timingId);
      
      // First, try to get the current timing document to see if it exists
      try {
        await updateDoc(timingRef, {
          takenSeats: arrayUnion(seat)
        });
      } catch (updateError) {
        // If the document doesn't exist, create it with the seat
        await setDoc(timingRef, {
          time: selectedTiming.time,
          availableSeats: selectedTiming.availableSeats || 0,
          takenSeats: [seat],
          id: timingId
        });
      }
      
      // Create booking document in bookings collection
      const bookingData = {
        userId: user.uid,
        username: user.displayName || user.email || 'User',
        email: user.email || '',
        route: `${selectedBus.start} → ${selectedBus.end}`,
        busName: selectedBus.name,
        seat: seat,
        date: new Date(),
        status: 'confirmed',
        busId: selectedBus.id,
        timingId: timingId,
        timing: selectedTiming.time,
        bookingDate: new Date(),
        creditsEarned: creditReward
      };
      
      await addDoc(collection(db, 'bookings'), bookingData);
      
      // Add credits to user account as reward for booking
      const newCredits = currentCredits + creditReward;
      await updateDoc(doc(db, 'users', user.uid), {
        credits: newCredits
      });
      
      // Refresh booked seats after successful booking
      console.log('Refreshing booked seats after booking seat:', seat);
      await fetchBookedSeats(selectedBus.id, timingId);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: `✅ SUCCESS! Your booking has been confirmed!\n\n🚌 Bus: ${selectedBus.name}\n📍 Route: ${selectedBus.start} → ${selectedBus.end}\n⏰ Time: ${selectedTiming.time}\n💺 Seat: ${seat}\n💰 Credits Earned: +${creditReward}\n💰 Total Credits: ${newCredits}\n\nYour booking has been registered in the system. You can view your bookings anytime by asking "Show my bookings".`,
        isUser: false,
        timestamp: new Date(),
        type: 'text',
      }]);
    } catch (e) {
      console.error('Booking error:', e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: `Booking failed: ${e instanceof Error ? e.message : 'Unknown error'}. Please try again or contact support.`,
        isUser: false,
        timestamp: new Date(),
        type: 'text',
      }]);
    }
    setSelectedBus(null);
    setSelectedTiming(null);
    setSelectedSeat(null);
  };

  // Remove processMessage, replace with Groq API call
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: AssistantChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // --- For any bus or route query, ONLY use Firestore data, NEVER Groq/AI knowledge ---
      if (isBusQuery(inputValue) || isRouteQuery(inputValue)) {
        const busQuery = parseBusQuery(inputValue) || parseRouteQuery(inputValue);
        const snap = await getDocs(collection(db, 'buses'));
        const buses: (FirestoreBus & { timings?: any[] })[] = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<FirestoreBus, 'id'>) }));
        let found = buses;
        if (busQuery) {
          found = buses.filter(b =>
            b.start && b.end &&
            b.start.toLowerCase().includes(busQuery.from.toLowerCase()) &&
            b.end.toLowerCase().includes(busQuery.to.toLowerCase())
          );
        }
        // For each bus, fetch timings and real-time booking data
        const busesWithTimings = await Promise.all(found.map(async (b) => {
          const timingsSnap = await getDocs(collection(db, 'buses', b.id, 'timings'));
          const timings = timingsSnap.docs.map(t => t.data());
          
          // Get real-time booking data for each timing
          const timingsWithBookings = await Promise.all(timings.map(async (timing) => {
            const timingId = `timing_${timing.time.replace(/:/g, '_')}`;
            
            // Get real-time booking data for this timing
            const bookingsQuery = query(
              collection(db, 'bookings'),
              where('busId', '==', b.id),
              where('timingId', '==', timingId),
              where('status', 'in', ['confirmed', 'upcoming'])
            );
            const bookingsSnap = await getDocs(bookingsQuery);
            const bookedSeats = bookingsSnap.docs.map(doc => (doc.data() as any).seat).filter(Boolean);
            const availableSeats = (timing.availableSeats || b.capacity) - bookedSeats.length;
            
            return {
              ...timing,
              bookedSeats,
              availableSeats,
              totalSeats: timing.availableSeats || b.capacity
            };
          }));
          
          return { ...b, timings: timingsWithBookings };
        }));
        if (busesWithTimings.length > 0) {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            isUser: false,
            timestamp: new Date(),
            type: 'bus-cards',
            buses: busesWithTimings,
          }]);
        } else {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            content: 'No buses found in your database for this route.',
            isUser: false,
            timestamp: new Date(),
            type: 'text',
          }]);
        }
        setIsTyping(false);
        return;
      }
      // Check for booking query
      if (isBookingQuery(inputValue)) {
        // Fetch all bookings from Firestore
        const snap = await getDocs(collection(db, 'bookings'));
        const bookings: FirestoreBooking[] = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<FirestoreBooking, 'id'>) }));
        let reply = '';
        if (bookings.length > 0) {
          reply = 'All bookings (from live data):\n' +
            bookings.map(b => `• ${b.username || b.email || 'User'}: ${b.route || '-'} | Bus: ${b.busName || '-'} | Seat: ${b.seat || '-'} | Date: ${b.date ? (typeof b.date === 'string' ? b.date : (b.date && typeof b.date === 'object' && 'seconds' in b.date ? new Date(b.date.seconds * 1000).toLocaleString() : '-')) : '-'} | Status: ${b.status || '-'}`).join('\n');
        } else {
          reply = 'No bookings found.';
        }
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), content: reply, isUser: false, timestamp: new Date() }]);
        setIsTyping(false);
        return;
      }
      // Translate user input if needed
      const translatedInput = await translateText(inputValue, language);
      const groqMessages = [
        { role: 'system', content: `You are an AI travel assistant. Respond in ${language}. Help users with public transport, bus tracking, booking, and schedules.` },
        ...messages.map(m => ({
          role: m.isUser ? 'user' : 'assistant',
          content: m.content || ''
        })),
        { role: 'user', content: translatedInput }
      ];
      const aiContent = await fetchGroqChat(groqMessages);
      // Translate AI output back to English if needed
      let finalContent = aiContent;
      if (language !== 'English') {
        finalContent = await translateText(aiContent, 'English', language);
      }
      const aiResponse: AssistantChatMessage = {
        id: (Date.now() + 1).toString(),
        content: finalContent,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (err: any) {
      const aiResponse: AssistantChatMessage = {
        id: (Date.now() + 1).toString(),
        content: err.message || 'Error contacting Groq API',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const quickPrompts = [
    "Book a ticket from City Center to Airport",
    "Find the next bus to Downtown",
    "What are the ticket prices?",
    "Show me bus schedules",
    "Track buses near me"
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Travel Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get instant help with booking, tracking, and travel information using natural language.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[600px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-2 py-4" style={{ maxHeight: '70vh' }}>
            {messages.map((msg, idx) =>
              msg.type === 'bus-cards' && msg.buses ? (
                <div key={msg.id} className="mb-4">
                  <div className="flex flex-col gap-4">
                    {msg.buses.map((bus: FirestoreBus & { timings?: any[] }) => {
                      // Calculate real-time occupancy from timings
                      const totalBookedSeats = bus.timings?.reduce((total, timing) => 
                        total + (timing.bookedSeats?.length || 0), 0) || 0;
                      const realTimeOccupancy = totalBookedSeats;
                      const occupancyPercentage = (realTimeOccupancy / bus.capacity) * 100;
                      
                      return (
                        <div key={bus.id} className="relative">
                          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
                            <div className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bus {bus.name}</h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{bus.start} → {bus.end}</p>
                                </div>
                                <span className="px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/20">
                                  Real-time
                                </span>
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center space-x-2 text-sm">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-600 dark:text-gray-400">{bus.start}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 text-sm">
                                    <Users className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {realTimeOccupancy}/{bus.capacity} seats booked
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

                                {/* Real-time timings */}
                                {bus.timings && bus.timings.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Real-time Timings:</div>
                                    {bus.timings.map((timing, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                          ⏰ {timing.time}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-xs ${
                                          timing.availableSeats > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                          {timing.availableSeats}/{timing.totalSeats} available
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow font-medium"
                            onClick={() => handleBookBus(bus)}
                          >
                            🎫 Book Now
                          </button>
                        </div>
                                              );
                      })}
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        💡 Click "🎫 Book Now" on any bus to see available seats and make your booking!
                      </p>
                    </div>
                  </div>
              ) : (
                <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} mb-2`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-lg shadow ${msg.isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
                    {msg.content}
                  </div>
                </div>
              )
            )}
            {/* Stepper UI for booking flow */}
            {selectedBus && !selectedTiming && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Select a timing for {selectedBus.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedBus.timings && selectedBus.timings.length > 0 ? (
                    selectedBus.timings.map((timing: any, idx: number) => (
                      <button
                        key={idx}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={() => handleSelectTiming(timing)}
                      >
                        {timing.time} ({timing.availableSeats} seats)
                      </button>
                    ))
                  ) : (
                    <span className="text-gray-500 dark:text-gray-300">No timings available for this bus.</span>
                  )}
                </div>
              </div>
            )}
            {selectedBus && selectedTiming && !selectedSeat && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Select a seat for {selectedBus.name} at {selectedTiming.time}</h3>
                
                {/* Debug Info */}
                <div className="mb-2 text-xs text-gray-500">
                  Booked seats: {bookedSeats.join(', ') || 'None'}
                </div>
                
                {/* Seat Legend */}
                <div className="flex gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-gray-700 dark:text-gray-300">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-gray-700 dark:text-gray-300">Booked</span>
                  </div>
                  {selectedBus.accessible && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-500 rounded border-2 border-yellow-400 relative">
                        <span className="absolute -top-1 -right-1 text-xs">♿</span>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">Wheelchair Accessible</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: Number(selectedBus.capacity) || 40 }, (_, i) => {
                    const seatNum = (i + 1).toString();
                    const taken = bookedSeats.includes(seatNum);
                    const isWheelchairSeat = selectedBus.accessible && (seatNum === '1' || seatNum === '2' || seatNum === '39' || seatNum === '40');
                    
                    // Debug logging for booked seats
                    if (taken) {
                      console.log(`Seat ${seatNum} is booked`);
                    }
                    
                    return (
                      <button
                        key={seatNum}
                        className={`px-3 py-2 rounded font-medium relative ${
                          taken 
                            ? 'bg-red-500 text-white cursor-not-allowed hover:bg-red-600' 
                            : isWheelchairSeat
                            ? 'bg-purple-500 text-white hover:bg-purple-600 border-2 border-yellow-400'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                        onClick={() => !taken && handleSelectSeat(seatNum)}
                        disabled={taken}
                        title={
                          taken 
                            ? `Seat ${seatNum} - Booked` 
                            : isWheelchairSeat 
                            ? `Seat ${seatNum} - Wheelchair Accessible` 
                            : `Seat ${seatNum} - Available`
                        }
                      >
                        {seatNum}
                        {isWheelchairSeat && !taken && (
                          <span className="absolute -top-1 -right-1 text-xs">♿</span>
                        )}
                        {isWheelchairSeat && taken && (
                          <span className="absolute -top-1 -right-1 text-xs">♿</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {/* Cancel Button */}
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => {
                      setSelectedBus(null);
                      setSelectedTiming(null);
                      setSelectedSeat(null);
                      setBookedSeats([]);
                    }}
                    className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-medium"
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(prompt)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Area - sticky at bottom */}
            <div className="flex space-x-4 sticky bottom-0 bg-white dark:bg-gray-800 pt-2 pb-1 z-10">
              <div className="flex justify-end mb-2">
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="px-2 py-1 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 text-sm focus:outline-none"
                  title="Select language"
                  aria-label="Select language"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Kannada">Kannada</option>
                </select>
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  placeholder="Type your message or use voice input..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-12"
                />
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                    isListening 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Start Voice Input'}
                  aria-label={isListening ? 'Stop Listening' : 'Start Voice Input'}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              {isListening ? (
                <span className="text-red-600 dark:text-red-400">🎤 Listening...</span>
              ) : (
                <span>Press and hold the microphone to use voice input</span>
              )}
            </div>
          </div>
        </div>
        <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 text-right">
          {language !== 'English' ? (
            <span>Auto-translation enabled: Your message and AI replies will be translated to and from {language}.</span>
          ) : (
            <span>Type in any language. AI will reply in English.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;