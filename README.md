# ONLINE-FLIGHT-RESERVATION

## SkyWings Global Airlines - Online Flight Reservation & Management System
**Course / Lab Project:** Internet Programming (IP EXP 5)  
**System Architecture:** Responsive Web-Based Single-Page Application (SPA) with LocalStorage Persistence Engine & Node.js HTTP Server  
**Live Local Server:** `http://localhost:3000`

---

## ✈️ System Overview
The **SkyWings Airline Reservation System** is a modern, responsive web application designed to consolidate flight schedules, seat inventories, passenger reservations, and flight fares. It provides real-time seat availability and booking capabilities for both individual passengers and travel agents, accompanied by an executive administration portal for flight operations, inventory management, and financial reporting.

---

## 🌟 Key Modules & Implemented Pages

### 1. 🔍 Search Flight Page (`#view-search`)
- **Trip Types:** One-Way, Round-Trip, Multi-City options.
- **Airport Hubs:** Major international airports (JFK, LHR, DXB, SIN, DEL, BOM, HND, CDG, SYD, FRA) with an instant Airport Swap button.
- **Travel Classes:** Economy Class, Premium Economy, Business Class, and First Class Suites.
- **Dynamic Filters:**
  - Real-time Price Range Slider ($100 – $6,000).
  - Flight Stops Filter (Non-Stop vs 1-Stop Connections).
  - Airline Checklist (Emirates, Singapore Airlines, British Airways, Air India, Delta, Qatar Airways, Lufthansa, ANA, Qantas).
  - Sort Options (Lowest Price, Fastest Flight, Earliest Departure).
- **Flight Results Cards:** Displays real-time seat availability, live remaining seats urgency badge, flight duration path, aircraft type, terminal, gate, and instant "Select & Book" trigger.

### 2. 💺 Book Ticket & Interactive Cabin Seat Map Page (`#view-book-ticket`)
- **Interactive Aircraft Fuselage Map:**
  - True-to-life aircraft layout with Cockpit, Wings, Emergency Exits, and Aisle spacing.
  - Three Cabin Zones: First Class Suites (1-2-1), Business Class (2-2-2), and Main Cabin Economy (3-3-3).
  - Real-time seat status: Available, Selected (cyan glow), and Occupied/Booked.
  - Automatic seat selection limit matching the number of passengers requested.
- **Passenger Details Form:**
  - Full legal name (as per passport), gender, age, passport/Govt ID number, email, and phone number.
- **In-Flight Services & Add-Ons:**
  - Gourmet Meal Selection (Standard, Chef's Grilled Salmon, Asian Vegetarian, Halal Gourmet, Gluten-Free).
  - Extra Checked Baggage (+15kg, +25kg).
  - Comprehensive Travel Protection Insurance toggle.
  - Priority Check-In & Boarding pass toggle.
- **Live Fare Calculator:**
  - Real-time breakdown of Base Fare, Seat Surcharge, Travel Add-ons, and Airport Security Taxes.

### 3. 💳 Ticket Payment Page (`#view-payment`)
- **Security Guarantee:** 256-Bit SSL Encrypted & PCI-DSS compliant badge.
- **Interactive 3D Virtual Credit Card:**
  - Real-time card preview mirroring user inputs (Card Number with 4-digit auto-spacing, Cardholder Name, Expiry MM/YY, CVV).
- **Multiple Payment Channels:**
  1. **Credit / Debit Cards:** VISA, MasterCard, Amex.
  2. **UPI / Dynamic QR Code:** Scannable vector QR code with instant simulation button.
  3. **Net Banking:** Popular banking institutions (HDFC, SBI, ICICI, Chase, HSBC, Citi, Barclays).
  4. **Digital Wallets:** Apple Pay (TouchID/FaceID), PayPal, Google Pay.
- **Realistic Transaction Simulation:** Bank handshake loader -> 3D Secure verification -> instant confirmation -> PNR & E-Ticket issuance.

### 4. 🛰️ View Booking Status Page (PNR Tracker) (`#view-status`)
- **PNR Lookup:** Search any booking by 9-character reference (e.g., `SKYW-9824`).
- **Interactive Demo Quick-Select Buttons:** One-click testing for sample bookings.
- **Live Journey Progress Stepper:**
  - 1. Ticket Confirmed
  - 2. Web Check-In Completed
  - 3. Gate & Terminal Assigned
  - 4. Boarding Started
  - 5. Departed / In Flight
- **Flight Telemetry:** Gate, Terminal, Departure Countdown, Assigned Seats, and Baggage Belt.
- **Quick Actions:** "Complete Web Check-In", "Print Official Boarding Pass", "Cancel Reservation".

### 5. 🎫 My Ticket / Travel Itinerary Dashboard (`#view-my-tickets`)
- **Personal Booking Center:** Displays all confirmed and historical trips.
- **Filter Tabs:** All Bookings, Active / Confirmed, Cancelled Bookings.
- **Card Actions:** View Boarding Pass, Check Live Telemetry, or initiate Cancellation.

### 6. 🖨️ Print Ticket / Official Boarding Pass (`#view-print-ticket`)
- **Boarding Pass & E-Ticket Layout:**
  - Perforated tear-off stub styling.
  - Dual Origin / Destination airport codes, flight number, aircraft model.
  - Passenger name, seat, boarding group, boarding time, terminal, gate.
  - High-resolution SVG Barcode and QR Code.
- **Browser Native Print (`@media print`):**
  - Triggers `window.print()` with CSS styles optimized for paper tickets (hides nav, footer, buttons, and backgrounds).
- **Email E-Ticket:** Simulates immediate email dispatch of PDF copy and tax invoice.

### 7. ❌ Cancel Ticket Page & Refund Calculator (`#view-cancel-ticket`)
- **Active Booking Selector:** Pick from confirmed reservations.
- **Transparent Refund Calculator:**
  - Original Total Paid.
  - Airline Standard Cancellation Penalty (-$75).
  - 100% Tax & User Development Fee Refund (+$65).
  - Calculated Net Refund Credit.
- **Automated Seat Inventory Release:** Once cancelled, reserved seats are immediately returned to the flight's available seat inventory in the database.

### 8. 💬 Customer Feedback & Community Reviews (`#view-feedback`)
- **Interactive Feedback Form:**
  - 5-Star rating picker with visual glow on hover.
  - Categories: Booking Experience, Cabin Comfort, Crew Service, Punctuality, Food & Beverage.
  - Detailed traveler comments.
- **Live Community Review Feed:** Displays verified passenger testimonials with star ratings, flight route tags, and timestamps.

### 9. 📊 Administrator Portal & Operations Report (`#view-admin`)
- **Executive Operations KPI Cards:**
  - Total Revenue Generated ($).
  - Total Confirmed Bookings.
  - Active Scheduled Routes.
  - Fleet Load Factor / Occupancy Percentage (%).
- **Flight Schedules Management:**
  - View all active flight schedules with route, timing, aircraft, base fare, and status.
  - Live status updater dropdown (On Time, Delayed, Boarding, Gate Open, Cancelled).
  - Ability to delete/cancel scheduled flights.
  - **Add New Flight Schedule Modal:** Add custom flights with flight number, airline, airports, timings, aircraft model, and base fare.
- **Real-Time Seat Inventory Inspection:**
  - Select any flight to view total capacity, booked seat count, percentage occupancy, and specific occupied seat codes.
- **Passenger & User Account Roster:**
  - Complete list of registered passenger accounts and flight dispatch administrators.
- **Revenue & Route Performance Analytics:**
  - Top flight corridors by passenger traffic.
  - Fleet capacity utilization breakdown.
- **CSV Data Export:** "Export Report (CSV)" generates a real `.csv` file for offline spreadsheet analysis.

### 10. 🔐 Administrator Login & Forgot Password System
- **Dual Authentication Modal:**
  - **Passenger Login & Register:** Create or access traveler accounts.
  - **Administrator Portal Login:** Restricted access for flight dispatch operations.
  - **Forgot Password Flow:** Enter registered email -> receive security OTP (`894215`) -> verify OTP -> reset account password.

---

## 🔑 Demo Credentials for Testing

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@skywings.com` | `admin123` | Full access to Admin Report, Flight Schedules, Seat Inventory, User Accounts |
| **Passenger** | `passenger@example.com` | `user123` | Flight Booking, Seat Selection, Payment, My Tickets, Cancellation, Feedback |

> 💡 *Note: You can also use the "Quick Fill Demo Admin Credentials" button inside the login modal for one-click authentication.*

---

## 🛠️ Technology Stack
- **HTML5:** Semantic architecture, accessible modals, SVG barcodes & QR codes.
- **CSS3 (Vanilla CSS):** Custom aviation design system, glassmorphism blur effects, CSS variables, flexbox/grid responsive layouts, and `@media print` rules.
- **JavaScript (Vanilla ES6+):** Pure client-side logic engine, state management, interactive seat map generator, payment simulation, and `localStorage` persistence.
- **Node.js:** Lightweight, zero-dependency static file server (`server.js`).

---

## 🚀 Running the Project
1. Start the HTTP server:
   ```bash
   node server.js
   ```
2. Open your web browser and navigate to:
   ```
   http://localhost:3000/
   ```
