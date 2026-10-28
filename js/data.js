/**
 * SkyWings Flight Reservation System - Seed Data & Persistence Engine
 * Initial flight schedules, airports, test bookings, and feedback database.
 */

const STORAGE_KEYS = {
  FLIGHTS: 'skywings_flights_v2',
  BOOKINGS: 'skywings_bookings_v2',
  USERS: 'skywings_users_v2',
  FEEDBACKS: 'skywings_feedbacks_v2',
  CURRENT_USER: 'skywings_current_user_v2'
};

// Major International & Domestic Airports
const AIRPORTS = [
  { code: 'JFK', city: 'New York', name: 'John F. Kennedy Intl Airport', country: 'United States' },
  { code: 'LHR', city: 'London', name: 'Heathrow Airport', country: 'United Kingdom' },
  { code: 'DXB', city: 'Dubai', name: 'Dubai International Airport', country: 'United Arab Emirates' },
  { code: 'SIN', city: 'Singapore', name: 'Changi Airport', country: 'Singapore' },
  { code: 'DEL', city: 'New Delhi', name: 'Indira Gandhi Intl Airport', country: 'India' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Intl Airport', country: 'India' },
  { code: 'HND', city: 'Tokyo', name: 'Haneda Airport', country: 'Japan' },
  { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle Airport', country: 'France' },
  { code: 'SYD', city: 'Sydney', name: 'Kingsford Smith Airport', country: 'Australia' },
  { code: 'FRA', city: 'Frankfurt', name: 'Frankfurt am Main Airport', country: 'Germany' }
];

// Seed Flight Schedules
const INITIAL_FLIGHTS = [
  {
    id: 'FL-101',
    flightNumber: 'EK-201',
    airline: 'Emirates',
    airlineCode: 'EK',
    logo: '✈️',
    aircraft: 'Airbus A380-800',
    origin: 'DXB',
    destination: 'JFK',
    departureTime: '08:30',
    arrivalTime: '14:25',
    duration: '13h 55m',
    stops: 'Non-stop',
    pricing: {
      economy: 680,
      premium: 1120,
      business: 2450,
      first: 5200
    },
    seats: {
      total: 120,
      booked: ['1A', '1B', '4C', '12A', '12B', '15F', '18C', '20D']
    },
    status: 'On Time',
    terminal: 'T3',
    gate: 'A14'
  },
  {
    id: 'FL-102',
    flightNumber: 'SQ-322',
    airline: 'Singapore Airlines',
    airlineCode: 'SQ',
    logo: '🛫',
    aircraft: 'Boeing 777-300ER',
    origin: 'SIN',
    destination: 'LHR',
    departureTime: '23:30',
    arrivalTime: '05:55',
    duration: '13h 25m',
    stops: 'Non-stop',
    pricing: {
      economy: 720,
      premium: 1250,
      business: 2890,
      first: 5800
    },
    seats: {
      total: 120,
      booked: ['2A', '3B', '10C', '14A', '14B', '22E']
    },
    status: 'Boarding',
    terminal: 'T2',
    gate: 'B07'
  },
  {
    id: 'FL-103',
    flightNumber: 'BA-117',
    airline: 'British Airways',
    airlineCode: 'BA',
    logo: '✈️',
    aircraft: 'Boeing 787-9 Dreamliner',
    origin: 'LHR',
    destination: 'JFK',
    departureTime: '11:15',
    arrivalTime: '14:10',
    duration: '7h 55m',
    stops: 'Non-stop',
    pricing: {
      economy: 540,
      premium: 890,
      business: 1950,
      first: 4200
    },
    seats: {
      total: 120,
      booked: ['1D', '5B', '11C', '19A', '23C']
    },
    status: 'On Time',
    terminal: 'T5',
    gate: 'C33'
  },
  {
    id: 'FL-104',
    flightNumber: 'AI-101',
    airline: 'Air India',
    airlineCode: 'AI',
    logo: '🛩️',
    aircraft: 'Boeing 777-200LR',
    origin: 'DEL',
    destination: 'JFK',
    departureTime: '02:20',
    arrivalTime: '07:35',
    duration: '14h 45m',
    stops: 'Non-stop',
    pricing: {
      economy: 610,
      premium: 980,
      business: 2150,
      first: 4500
    },
    seats: {
      total: 120,
      booked: ['1A', '2B', '6C', '12F', '16A', '25B']
    },
    status: 'On Time',
    terminal: 'T3',
    gate: '18A'
  },
  {
    id: 'FL-105',
    flightNumber: 'DL-408',
    airline: 'Delta Air Lines',
    airlineCode: 'DL',
    logo: '✈️',
    aircraft: 'Airbus A350-900',
    origin: 'JFK',
    destination: 'CDG',
    departureTime: '17:40',
    arrivalTime: '06:55',
    duration: '7h 15m',
    stops: 'Non-stop',
    pricing: {
      economy: 580,
      premium: 940,
      business: 2100,
      first: 4100
    },
    seats: {
      total: 120,
      booked: ['3A', '7C', '15A', '15B', '20F']
    },
    status: 'On Time',
    terminal: 'T4',
    gate: 'B22'
  },
  {
    id: 'FL-106',
    flightNumber: 'QR-908',
    airline: 'Qatar Airways',
    airlineCode: 'QR',
    logo: '🛫',
    aircraft: 'Airbus A350-1000',
    origin: 'DXB',
    destination: 'LHR',
    departureTime: '06:45',
    arrivalTime: '11:20',
    duration: '7h 35m',
    stops: '1 Stop (DOH)',
    pricing: {
      economy: 490,
      premium: 820,
      business: 1850,
      first: 3950
    },
    seats: {
      total: 120,
      booked: ['1B', '4A', '10F', '18A', '19B']
    },
    status: 'Scheduled',
    terminal: 'T1',
    gate: 'D04'
  },
  {
    id: 'FL-107',
    flightNumber: 'NH-842',
    airline: 'All Nippon Airways',
    airlineCode: 'NH',
    logo: '✈️',
    aircraft: 'Boeing 787-8 Dreamliner',
    origin: 'HND',
    destination: 'SIN',
    departureTime: '10:50',
    arrivalTime: '17:15',
    duration: '7h 25m',
    stops: 'Non-stop',
    pricing: {
      economy: 460,
      premium: 780,
      business: 1680,
      first: 3600
    },
    seats: {
      total: 120,
      booked: ['2C', '8B', '14D', '21A']
    },
    status: 'Gate Open',
    terminal: 'T3',
    gate: '114'
  },
  {
    id: 'FL-108',
    flightNumber: 'LH-760',
    airline: 'Lufthansa',
    airlineCode: 'LH',
    logo: '🛩️',
    aircraft: 'Airbus A350-900',
    origin: 'FRA',
    destination: 'DEL',
    departureTime: '13:40',
    arrivalTime: '01:20',
    duration: '7h 10m',
    stops: 'Non-stop',
    pricing: {
      economy: 510,
      premium: 890,
      business: 1920,
      first: 4100
    },
    seats: {
      total: 120,
      booked: ['1A', '5D', '12C', '16E', '24C']
    },
    status: 'On Time',
    terminal: 'T1',
    gate: 'Z18'
  },
  {
    id: 'FL-109',
    flightNumber: 'QF-001',
    airline: 'Qantas Airways',
    airlineCode: 'QF',
    logo: '🛫',
    aircraft: 'Boeing 787-9 Dreamliner',
    origin: 'SYD',
    destination: 'SIN',
    departureTime: '15:20',
    arrivalTime: '21:40',
    duration: '8h 20m',
    stops: 'Non-stop',
    pricing: {
      economy: 530,
      premium: 910,
      business: 2020,
      first: 4300
    },
    seats: {
      total: 120,
      booked: ['3C', '9A', '17B', '22A']
    },
    status: 'Scheduled',
    terminal: 'T1',
    gate: '32'
  },
  {
    id: 'FL-110',
    flightNumber: 'AI-308',
    airline: 'Air India',
    airlineCode: 'AI',
    logo: '🛩️',
    aircraft: 'Airbus A321neo',
    origin: 'DEL',
    destination: 'BOM',
    departureTime: '09:00',
    arrivalTime: '11:15',
    duration: '2h 15m',
    stops: 'Non-stop',
    pricing: {
      economy: 95,
      premium: 160,
      business: 380,
      first: 750
    },
    seats: {
      total: 120,
      booked: ['1B', '2A', '12B', '14F', '19C']
    },
    status: 'On Time',
    terminal: 'T3',
    gate: '22'
  }
];

// Seed Pre-existing Bookings for testing PNR lookup, cancellation, and ticket printing
const INITIAL_BOOKINGS = [
  {
    pnr: 'SKYW-9824',
    ticketNumber: '098-2940294821',
    flightId: 'FL-101',
    flightNumber: 'EK-201',
    airline: 'Emirates',
    aircraft: 'Airbus A380-800',
    origin: 'DXB',
    originCity: 'Dubai',
    destination: 'JFK',
    destinationCity: 'New York',
    travelDate: '2026-10-30',
    departureTime: '08:30',
    arrivalTime: '14:25',
    flightClass: 'business',
    cabinClassLabel: 'Business Class',
    passenger: {
      fullName: 'Alexander Wright',
      email: 'passenger@example.com',
      phone: '+1 (555) 234-5678',
      gender: 'Male',
      age: 34,
      passport: 'US-92847291'
    },
    seats: ['12A'],
    addons: {
      meal: 'Chef Special - Grilled Herb Salmon',
      baggage: 'Extra 15kg Allowance',
      insurance: true,
      priorityBoarding: true
    },
    fareBreakdown: {
      baseFare: 2450,
      seatFee: 45,
      taxes: 180,
      addonsFee: 95,
      totalPaid: 2770
    },
    payment: {
      method: 'Credit Card',
      cardLast4: '4242',
      transactionId: 'TXN-982490182',
      status: 'Paid',
      timestamp: '2026-10-25 10:14 AM'
    },
    bookingStatus: 'Confirmed', // Confirmed, Checked-In, Cancelled
    terminal: 'T3',
    gate: 'A14',
    boardingGroup: 'Group 2',
    boardingTime: '07:45'
  },
  {
    pnr: 'SKYW-4110',
    ticketNumber: '098-7749102931',
    flightId: 'FL-102',
    flightNumber: 'SQ-322',
    airline: 'Singapore Airlines',
    aircraft: 'Boeing 777-300ER',
    origin: 'SIN',
    originCity: 'Singapore',
    destination: 'LHR',
    destinationCity: 'London',
    travelDate: '2026-11-02',
    departureTime: '23:30',
    arrivalTime: '05:55',
    flightClass: 'economy',
    cabinClassLabel: 'Economy Class',
    passenger: {
      fullName: 'Elena Rostova',
      email: 'elena.rostova@traveler.org',
      phone: '+44 7911 123456',
      gender: 'Female',
      age: 28,
      passport: 'GB-83726194'
    },
    seats: ['22E'],
    addons: {
      meal: 'Asian Vegetarian Delight',
      baggage: 'Standard 23kg',
      insurance: true,
      priorityBoarding: false
    },
    fareBreakdown: {
      baseFare: 720,
      seatFee: 0,
      taxes: 75,
      addonsFee: 25,
      totalPaid: 820
    },
    payment: {
      method: 'Apple Pay',
      cardLast4: '8812',
      transactionId: 'TXN-411029813',
      status: 'Paid',
      timestamp: '2026-10-26 14:32 PM'
    },
    bookingStatus: 'Check-In Open',
    terminal: 'T2',
    gate: 'B07',
    boardingGroup: 'Group 4',
    boardingTime: '22:45'
  },
  {
    pnr: 'SKYW-7721',
    ticketNumber: '098-1093847291',
    flightId: 'FL-104',
    flightNumber: 'AI-101',
    airline: 'Air India',
    aircraft: 'Boeing 777-200LR',
    origin: 'DEL',
    originCity: 'New Delhi',
    destination: 'JFK',
    destinationCity: 'New York',
    travelDate: '2026-11-10',
    departureTime: '02:20',
    arrivalTime: '07:35',
    flightClass: 'first',
    cabinClassLabel: 'First Class Suite',
    passenger: {
      fullName: 'Marcus Sterling',
      email: 'marcus.sterling@corp.com',
      phone: '+1 312 555 0199',
      gender: 'Male',
      age: 46,
      passport: 'US-77182934'
    },
    seats: ['1A'],
    addons: {
      meal: 'Royal Maharajah Fine Dining',
      baggage: 'Complimentary 2x32kg',
      insurance: true,
      priorityBoarding: true
    },
    fareBreakdown: {
      baseFare: 4500,
      seatFee: 0,
      taxes: 350,
      addonsFee: 0,
      totalPaid: 4850
    },
    payment: {
      method: 'Net Banking',
      cardLast4: 'N/A',
      transactionId: 'TXN-772109485',
      status: 'Paid',
      timestamp: '2026-10-26 16:50 PM'
    },
    bookingStatus: 'Confirmed',
    terminal: 'T3',
    gate: '18A',
    boardingGroup: 'Group 1',
    boardingTime: '01:35'
  }
];

// Seed Users for Authentication
const INITIAL_USERS = [
  {
    id: 'USR-01',
    name: 'Alexander Wright',
    email: 'passenger@example.com',
    password: 'user123',
    phone: '+1 (555) 234-5678',
    role: 'customer',
    registeredAt: '2026-01-15'
  },
  {
    id: 'ADM-01',
    name: 'Chief Admin (Flight Ops)',
    email: 'admin@skywings.com',
    password: 'admin123',
    phone: '+1 (800) 759-9464',
    role: 'administrator',
    registeredAt: '2025-11-01'
  }
];

// Seed Customer Feedbacks
const INITIAL_FEEDBACKS = [
  {
    id: 'FB-01',
    name: 'Samantha Brooks',
    flight: 'EK-201 (DXB → JFK)',
    rating: 5,
    category: 'Booking & In-Flight Experience',
    date: '2026-10-24',
    comment: 'The booking process was lightning fast and selecting seats directly on the interactive cabin map made family seating effortless. Superb customer service!',
    verified: true
  },
  {
    id: 'FB-02',
    name: 'David K. Tanaka',
    flight: 'SQ-322 (SIN → LHR)',
    rating: 5,
    category: 'Punctuality & Service',
    date: '2026-10-22',
    comment: 'Instant PNR confirmation and clean printable boarding pass. Singapore Airlines service was flawless as always. Highly recommend SkyWings!',
    verified: true
  },
  {
    id: 'FB-03',
    name: 'Aisha Al-Mansoor',
    flight: 'QR-908 (DXB → LHR)',
    rating: 4,
    category: 'Payment & Ease of Use',
    date: '2026-10-20',
    comment: 'Multiple payment options including UPI & cards made checkout hassle-free. The cancellation policy and real-time refund breakdown are very transparent.',
    verified: true
  }
];

// Initialize LocalStorage Data if not present
function initializeDatabase() {
  if (!localStorage.getItem(STORAGE_KEYS.FLIGHTS)) {
    localStorage.setItem(STORAGE_KEYS.FLIGHTS, JSON.stringify(INITIAL_FLIGHTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FEEDBACKS)) {
    localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(INITIAL_FEEDBACKS));
  }
}

// Data Access Helpers
const DB = {
  getFlights() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FLIGHTS)) || INITIAL_FLIGHTS;
  },
  saveFlights(flights) {
    localStorage.setItem(STORAGE_KEYS.FLIGHTS, JSON.stringify(flights));
  },
  getBookings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS)) || INITIAL_BOOKINGS;
  },
  saveBookings(bookings) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  },
  getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || INITIAL_USERS;
  },
  saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },
  getFeedbacks() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FEEDBACKS)) || INITIAL_FEEDBACKS;
  },
  saveFeedbacks(feedbacks) {
    localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(feedbacks));
  },
  getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  },
  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },
  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.FLIGHTS, JSON.stringify(INITIAL_FLIGHTS));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(INITIAL_FEEDBACKS));
  }
};

// Run initialization immediately
initializeDatabase();
