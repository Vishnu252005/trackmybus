import { Bus, Route } from '../types';

export const mockBuses: Bus[] = [
  {
    id: '1',
    number: 'B101',
    route: 'City Center - Airport',
    currentLocation: {
      lat: 40.7128,
      lng: -74.0060,
      address: 'Times Square, NYC'
    },
    destination: 'JFK Airport',
    eta: 15,
    distance: 2.3,
    capacity: 50,
    occupancy: 32,
    status: 'on-time'
  },
  {
    id: '2',
    number: 'B205',
    route: 'Downtown - University',
    currentLocation: {
      lat: 40.7589,
      lng: -73.9851,
      address: 'Central Park West'
    },
    destination: 'Columbia University',
    eta: 8,
    distance: 1.7,
    capacity: 45,
    occupancy: 28,
    status: 'early'
  },
  {
    id: '3',
    number: 'B312',
    route: 'Mall - Residential',
    currentLocation: {
      lat: 40.6892,
      lng: -74.0445,
      address: 'Brooklyn Bridge'
    },
    destination: 'Residential Area',
    eta: 22,
    distance: 4.1,
    capacity: 40,
    occupancy: 35,
    status: 'delayed'
  }
];

export const mockRoutes: Route[] = [
  {
    id: '1',
    name: 'City Center to Airport',
    from: 'City Center',
    to: 'JFK Airport',
    distance: 25.4,
    duration: 45,
    price: 12.50,
    buses: ['B101', 'B102', 'B103']
  },
  {
    id: '2',
    name: 'Downtown Express',
    from: 'Downtown',
    to: 'University District',
    distance: 8.2,
    duration: 18,
    price: 4.75,
    buses: ['B205', 'B206']
  },
  {
    id: '3',
    name: 'Mall Shuttle',
    from: 'Shopping Mall',
    to: 'Residential Area',
    distance: 12.1,
    duration: 28,
    price: 6.25,
    buses: ['B312', 'B313', 'B314']
  }
];

export const mockSeats = [
  { id: 'A1', available: true }, { id: 'A2', available: false }, { id: 'A3', available: true }, { id: 'A4', available: true },
  { id: 'B1', available: true }, { id: 'B2', available: true }, { id: 'B3', available: false }, { id: 'B4', available: true },
  { id: 'C1', available: false }, { id: 'C2', available: true }, { id: 'C3', available: true }, { id: 'C4', available: false },
  { id: 'D1', available: true }, { id: 'D2', available: true }, { id: 'D3', available: true }, { id: 'D4', available: true },
];