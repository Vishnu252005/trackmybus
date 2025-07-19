export interface Bus {
  id: string;
  number: string;
  route: string;
  currentLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  destination: string;
  eta: number; // minutes
  distance: number; // km
  capacity: number;
  occupancy: number;
  status: 'on-time' | 'delayed' | 'early';
}

export interface Route {
  id: string;
  name: string;
  from: string;
  to: string;
  distance: number;
  duration: number;
  price: number;
  buses: string[];
}

export interface Ticket {
  id: string;
  routeId: string;
  busNumber: string;
  passengerName: string;
  passengerEmail: string;
  seatNumber: string;
  date: string;
  time: string;
  price: number;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface User {
  email: string;
}