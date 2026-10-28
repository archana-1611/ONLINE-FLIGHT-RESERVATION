/**
 * SkyWings Airline Reservation System - Application Logic & State Engine
 * Handles Flight Search, Interactive Cabin Seat Selection, Payment Gateway,
 * PNR Status Tracker, E-Ticket & Boarding Pass Generator, Cancellation with Refund Engine,
 * Customer Feedback, Admin Operations Dashboard & Reports.
 */

// Global Application State
const AppState = {
  currentUser: null,
  currentRole: 'customer', // 'customer' or 'administrator'
  activeView: 'search',
  searchQuery: {
    origin: 'DXB',
    destination: 'JFK',
    date: '',
    travelClass: 'economy',
    passengers: 1,
    tripType: 'oneway'
  },
  selectedFlight: null,
  selectedSeats: [],
  cabinClass: 'economy',
  bookingAddons: {
    meal: 'Complimentary Airline Meal (Standard)',
    mealFee: 0,
    baggage: 'Standard 23kg Allowance',
    baggageFee: 0,
    insurance: true,
    insuranceFee: 29,
    priority: true,
    priorityFee: 19
  },
  pendingBooking: null,
  currentPrintBooking: null,
  filters: {
    maxPrice: 3000,
    stops: ['nonstop', '1stop'],
    airlines: []
  },
  sortBy: 'price-asc'
};

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initCurrentUser();
  initDateDefaults();
  initNavigation();
  initSearchForm();
  initFilters();
  initCabinSeatMap();
  initPaymentGateway();
  initStatusTracker();
  initMyTickets();
  initCancellationEngine();
  initFeedbackSystem();
  initAdminDashboard();
  initAuthSystem();

  // Initial render of flight results
  renderFlightResults();
});

/* ==========================================================================
   User & Auth State Initialization
   ========================================================================== */
function initCurrentUser() {
  const user = DB.getCurrentUser();
  if (user) {
    AppState.currentUser = user;
    AppState.currentRole = user.role;
  } else {
    // Default demo passenger
    const defaultUser = DB.getUsers().find(u => u.role === 'customer') || {
      id: 'USR-01',
      name: 'Alexander Wright',
      email: 'passenger@example.com',
      role: 'customer'
    };
    AppState.currentUser = defaultUser;
    AppState.currentRole = 'customer';
    DB.setCurrentUser(defaultUser);
  }
  updateUserBadge();
}

function updateUserBadge() {
  const nameEl = document.getElementById('nav-user-name');
  const roleEl = document.getElementById('nav-user-role');
  const avatarEl = document.getElementById('user-avatar-initials');
  const authBtnLabel = document.getElementById('auth-btn-label');

  if (AppState.currentUser) {
    nameEl.textContent = AppState.currentUser.name;
    const initials = AppState.currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    avatarEl.textContent = initials;

    if (AppState.currentRole === 'administrator') {
      roleEl.textContent = 'Admin';
      roleEl.className = 'role-pill admin';
      authBtnLabel.textContent = 'Switch Account';
    } else {
      roleEl.textContent = 'Passenger';
      roleEl.className = 'role-pill customer';
      authBtnLabel.textContent = 'Switch Account';
    }
  }
}

function initDateDefaults() {
  const dateInput = document.getElementById('search-date');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    dateInput.value = dateStr;
    dateInput.min = new Date().toISOString().split('T')[0];
    AppState.searchQuery.date = dateStr;
  }
}

/* ==========================================================================
   Navigation & View Routing
   ========================================================================== */
function initNavigation() {
  // Nav buttons
  document.querySelectorAll('.nav-link-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.currentTarget.dataset.view;
      if (view) {
        navigateTo(view);
      }
    });
  });

  // Logo button
  document.getElementById('brand-logo-btn').addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('search');
  });

  // Handle URL hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`view-${hash}`)) {
      navigateTo(hash, false);
    }
  });

  // Initial hash check
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && document.getElementById(`view-${initialHash}`)) {
    navigateTo(initialHash, false);
  }
}

function navigateTo(viewName, updateHash = true) {
  // Check if admin access required
  if (viewName === 'admin' && AppState.currentRole !== 'administrator') {
    showToast('Administrator privileges required. Please authenticate.', 'info');
    openAuthModal('admin');
    return;
  }

  // Hide all views
  document.querySelectorAll('.page-view').forEach(view => {
    view.style.display = 'none';
    view.classList.remove('active');
  });

  // Show target view
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.style.display = 'block';
    targetView.classList.add('active');
    AppState.activeView = viewName;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update active nav button
    document.querySelectorAll('.nav-link-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    if (updateHash) {
      window.location.hash = viewName;
    }

    // Refresh view-specific content
    if (viewName === 'my-tickets') {
      renderMyTickets();
    } else if (viewName === 'cancel-ticket') {
      populateCancellationDropdown();
    } else if (viewName === 'feedback') {
      renderFeedbackReviews();
    } else if (viewName === 'admin') {
      refreshAdminDashboard();
    }
  }
}

/* ==========================================================================
   Flight Search & Filtering Engine
   ========================================================================== */
function initSearchForm() {
  const form = document.getElementById('flight-search-form');
  const swapBtn = document.getElementById('btn-swap-airports');
  const originSelect = document.getElementById('search-origin');
  const destSelect = document.getElementById('search-destination');
  const classSelect = document.getElementById('search-class');
  const passengersSelect = document.getElementById('search-passengers');

  // Swap origin and destination
  swapBtn.addEventListener('click', () => {
    const temp = originSelect.value;
    originSelect.value = destSelect.value;
    destSelect.value = temp;
  });

  // Handle Search Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (originSelect.value === destSelect.value) {
      showToast('Origin and Destination airports cannot be the same!', 'error');
      return;
    }

    AppState.searchQuery.origin = originSelect.value;
    AppState.searchQuery.destination = destSelect.value;
    AppState.searchQuery.date = document.getElementById('search-date').value;
    AppState.searchQuery.travelClass = classSelect.value;
    AppState.searchQuery.passengers = parseInt(passengersSelect.value, 10);
    AppState.cabinClass = classSelect.value;

    showToast(`Searching flights from ${originSelect.value} to ${destSelect.value}...`, 'info');
    renderFlightResults();

    // Smooth scroll to results
    document.getElementById('results-area').scrollIntoView({ behavior: 'smooth' });
  });

  // Class select change
  classSelect.addEventListener('change', (e) => {
    AppState.cabinClass = e.target.value;
    renderFlightResults();
  });
}

function initFilters() {
  const priceSlider = document.getElementById('price-range');
  const priceVal = document.getElementById('price-slider-val');
  const sortSelect = document.getElementById('sort-select');
  const resetBtn = document.getElementById('btn-reset-filters');

  // Populate airlines filter checklist dynamically
  const flights = DB.getFlights();
  const airlinesSet = new Set(flights.map(f => f.airline));
  const container = document.getElementById('airlines-filter-list');
  container.innerHTML = '';

  airlinesSet.forEach(airline => {
    const label = document.createElement('label');
    label.className = 'check-item';
    label.innerHTML = `
      <span><input type="checkbox" name="filterAirline" value="${airline}" checked> ${airline}</span>
    `;
    container.appendChild(label);
  });

  // Price slider listener
  priceSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    priceVal.textContent = `$${val.toLocaleString()}`;
    AppState.filters.maxPrice = val;
    renderFlightResults();
  });

  // Stops filter checkboxes
  document.querySelectorAll('input[name="filterStop"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const selected = Array.from(document.querySelectorAll('input[name="filterStop"]:checked')).map(i => i.value);
      AppState.filters.stops = selected;
      renderFlightResults();
    });
  });

  // Airlines filter checkboxes
  container.addEventListener('change', () => {
    const selected = Array.from(document.querySelectorAll('input[name="filterAirline"]:checked')).map(i => i.value);
    AppState.filters.airlines = selected;
    renderFlightResults();
  });

  // Sort dropdown
  sortSelect.addEventListener('change', (e) => {
    AppState.sortBy = e.target.value;
    renderFlightResults();
  });

  // Reset Filters
  resetBtn.addEventListener('click', () => {
    priceSlider.value = 3000;
    priceVal.textContent = '$3,000';
    AppState.filters.maxPrice = 3000;

    document.querySelectorAll('input[name="filterStop"]').forEach(i => i.checked = true);
    AppState.filters.stops = ['nonstop', '1stop'];

    document.querySelectorAll('input[name="filterAirline"]').forEach(i => i.checked = true);
    AppState.filters.airlines = [];

    sortSelect.value = 'price-asc';
    AppState.sortBy = 'price-asc';

    renderFlightResults();
    showToast('Filters reset to default.', 'info');
  });
}

function renderFlightResults() {
  const container = document.getElementById('flights-list-container');
  const countEl = document.getElementById('results-count-num');
  const allFlights = DB.getFlights();

  // Filter flights by search query and sidebar filters
  let filtered = allFlights.filter(f => {
    // If specific origin/destination searched, prioritize matching
    const matchRoute = (f.origin === AppState.searchQuery.origin && f.destination === AppState.searchQuery.destination);
    
    // Stop filter
    const isNonstop = f.stops.toLowerCase().includes('non-stop');
    const stopMatches = (isNonstop && AppState.filters.stops.includes('nonstop')) || 
                        (!isNonstop && AppState.filters.stops.includes('1stop'));

    // Airline filter
    const airlineMatches = AppState.filters.airlines.length === 0 || AppState.filters.airlines.includes(f.airline);

    // Price filter based on current cabin class
    const fare = f.pricing[AppState.cabinClass] || f.pricing.economy;
    const priceMatches = fare <= AppState.filters.maxPrice;

    return matchRoute && stopMatches && airlineMatches && priceMatches;
  });

  // If strict route search has 0 results, show alternative or connected flights
  if (filtered.length === 0) {
    filtered = allFlights.filter(f => {
      const fare = f.pricing[AppState.cabinClass] || f.pricing.economy;
      return fare <= AppState.filters.maxPrice;
    });
  }

  // Sorting
  filtered.sort((a, b) => {
    const fareA = a.pricing[AppState.cabinClass] || a.pricing.economy;
    const fareB = b.pricing[AppState.cabinClass] || b.pricing.economy;

    if (AppState.sortBy === 'price-asc') return fareA - fareB;
    if (AppState.sortBy === 'departure') return a.departureTime.localeCompare(b.departureTime);
    if (AppState.sortBy === 'duration') return parseInt(a.duration) - parseInt(b.duration);
    return 0;
  });

  countEl.textContent = `${filtered.length} flight${filtered.length === 1 ? '' : 's'} available`;

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-panel" style="padding: 3rem; text-align: center;">
        <h3>No Flights Found</h3>
        <p style="margin-top: 8px;">Try adjusting your price range or stop filters to view more flights.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(flight => {
    const originAirport = AIRPORTS.find(a => a.code === flight.origin) || { city: flight.origin };
    const destAirport = AIRPORTS.find(a => a.code === flight.destination) || { city: flight.destination };
    const fare = flight.pricing[AppState.cabinClass] || flight.pricing.economy;
    const bookedCount = flight.seats.booked ? flight.seats.booked.length : 0;
    const remainingSeats = flight.seats.total - bookedCount;

    const card = document.createElement('div');
    card.className = 'glass-panel flight-card';
    card.innerHTML = `
      <!-- Airline & Aircraft -->
      <div class="airline-info">
        <div class="airline-brand">
          <span class="airline-icon">${flight.logo || '✈️'}</span>
          <span>${flight.airline}</span>
        </div>
        <div class="flight-code">${flight.flightNumber}</div>
        <div class="aircraft-type">${flight.aircraft}</div>
        <div style="font-size: 0.72rem; color: var(--accent-gold); margin-top: 4px;">Terminal ${flight.terminal || 'T1'} • Gate ${flight.gate || 'G1'}</div>
      </div>

      <!-- Route Timings -->
      <div class="flight-journey">
        <div class="journey-node">
          <div class="node-time">${flight.departureTime}</div>
          <div class="node-code">${flight.origin}</div>
          <div class="node-city">${originAirport.city}</div>
        </div>

        <div class="journey-middle">
          <div class="duration-tag">${flight.duration}</div>
          <div class="journey-path">
            <div class="path-dot"></div>
            <div class="path-dot"></div>
          </div>
          <div class="stops-tag">${flight.stops}</div>
        </div>

        <div class="journey-node">
          <div class="node-time">${flight.arrivalTime}</div>
          <div class="node-code">${flight.destination}</div>
          <div class="node-city">${destAirport.city}</div>
        </div>
      </div>

      <!-- Pricing & Select CTA -->
      <div class="flight-booking-cta">
        <div class="fare-price-wrap">
          <span class="fare-currency">$</span>
          <span class="fare-amount">${fare}</span>
          <span class="fare-note">per passenger (${capitalize(AppState.cabinClass)})</span>
        </div>
        <div class="seat-avail-indicator">
          🔥 ${remainingSeats} seats left
        </div>
        <button class="btn btn-primary btn-sm btn-select-flight" data-flight-id="${flight.id}" style="margin-top: 6px; width: 100%;">
          Select & Book
        </button>
      </div>
    `;

    // Attach click handler to book button
    card.querySelector('.btn-select-flight').addEventListener('click', () => {
      startBookingFlow(flight);
    });

    container.appendChild(card);
  });
}

/* ==========================================================================
   Aircraft Fuselage & Interactive Seat Map Selection
   ========================================================================== */
function startBookingFlow(flight) {
  AppState.selectedFlight = flight;
  AppState.selectedSeats = [];
  
  // Render header info
  const headerContainer = document.getElementById('booking-flight-header');
  const originAirport = AIRPORTS.find(a => a.code === flight.origin) || { city: flight.origin, name: flight.origin };
  const destAirport = AIRPORTS.find(a => a.code === flight.destination) || { city: flight.destination, name: flight.destination };

  headerContainer.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="font-size: 2rem;">${flight.logo || '✈️'}</span>
        <div>
          <h2 style="font-size: 1.4rem;">${flight.airline} • ${flight.flightNumber}</h2>
          <p style="font-size: 0.85rem;">${flight.aircraft} • Departure: ${AppState.searchQuery.date || 'Tomorrow'}</p>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 24px;">
        <div style="text-align: right;">
          <div style="font-size: 1.25rem; font-weight: 800; color: #fff;">${flight.departureTime}</div>
          <div style="font-size: 0.85rem; color: var(--accent-cyan); font-weight: 700;">${flight.origin} (${originAirport.city})</div>
        </div>
        <div style="font-size: 1.2rem; color: var(--text-dim);">➔</div>
        <div>
          <div style="font-size: 1.25rem; font-weight: 800; color: #fff;">${flight.arrivalTime}</div>
          <div style="font-size: 0.85rem; color: var(--accent-cyan); font-weight: 700;">${flight.destination} (${destAirport.city})</div>
        </div>
      </div>

      <div style="padding: 6px 16px; background: rgba(0, 229, 255, 0.1); border: 1px solid rgba(0, 229, 255, 0.3); border-radius: 20px;">
        <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); display: block;">Passengers</span>
        <span style="font-weight: 800; color: #fff;">${AppState.searchQuery.passengers} Traveler(s)</span>
      </div>
    </div>
  `;

  // Render cabin seat map
  renderFuselageSeats();
  updateFareSummary();

  // Navigate to book ticket view
  navigateTo('book-ticket');
}

function initCabinSeatMap() {
  // Back to search button
  document.getElementById('btn-back-to-search').addEventListener('click', () => {
    navigateTo('search');
  });

  // Cabin Class tabs in seat map
  const cabinTabs = document.querySelectorAll('#cabin-class-selector .cabin-tab');
  cabinTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      cabinTabs.forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      AppState.cabinClass = e.currentTarget.dataset.class;
      updateFareSummary();
    });
  });

  // Add-on input listeners
  document.getElementById('addon-meal').addEventListener('change', (e) => {
    const val = e.target.value;
    let fee = 0;
    if (val.includes('$25')) fee = 25;
    else if (val.includes('$15')) fee = 15;
    else if (val.includes('$18')) fee = 18;
    else if (val.includes('$20')) fee = 20;

    AppState.bookingAddons.meal = val;
    AppState.bookingAddons.mealFee = fee;
    updateFareSummary();
  });

  document.getElementById('addon-baggage').addEventListener('change', (e) => {
    const val = e.target.value;
    let fee = 0;
    if (val.includes('$45')) fee = 45;
    else if (val.includes('$75')) fee = 75;

    AppState.bookingAddons.baggage = val;
    AppState.bookingAddons.baggageFee = fee;
    updateFareSummary();
  });

  document.getElementById('addon-insurance').addEventListener('change', (e) => {
    AppState.bookingAddons.insurance = e.target.checked;
    AppState.bookingAddons.insuranceFee = e.target.checked ? 29 : 0;
    updateFareSummary();
  });

  document.getElementById('addon-priority').addEventListener('change', (e) => {
    AppState.bookingAddons.priority = e.target.checked;
    AppState.bookingAddons.priorityFee = e.target.checked ? 19 : 0;
    updateFareSummary();
  });

  // Proceed to payment button
  document.getElementById('btn-proceed-to-payment').addEventListener('click', () => {
    validateAndProceedToPayment();
  });
}

function renderFuselageSeats() {
  const container = document.getElementById('cabin-seat-grid');
  if (!container || !AppState.selectedFlight) return;

  const bookedSeats = AppState.selectedFlight.seats.booked || [];
  container.innerHTML = '';

  // Section 1: First Class (Rows 1 - 2, 1-2-1 layout)
  const fcTitle = document.createElement('div');
  fcTitle.className = 'cabin-section-title';
  fcTitle.textContent = 'First Class Private Suites';
  container.appendChild(fcTitle);

  for (let r = 1; r <= 2; r++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'seat-row';
    rowDiv.innerHTML = `
      <span class="row-num-tag">${r}</span>
      ${createSeatButton(`${r}A`, 'first', bookedSeats)}
      <div class="aisle-gap"></div>
      ${createSeatButton(`${r}B`, 'first', bookedSeats)}
      ${createSeatButton(`${r}C`, 'first', bookedSeats)}
      <div class="aisle-gap"></div>
      ${createSeatButton(`${r}D`, 'first', bookedSeats)}
    `;
    container.appendChild(rowDiv);
  }

  // Section 2: Business Class (Rows 4 - 6, 2-2-2 layout)
  const bcTitle = document.createElement('div');
  bcTitle.className = 'cabin-section-title';
  bcTitle.textContent = 'Business Class Recliners';
  container.appendChild(bcTitle);

  for (let r = 4; r <= 6; r++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'seat-row';
    rowDiv.innerHTML = `
      <span class="row-num-tag">${r}</span>
      ${createSeatButton(`${r}A`, 'business', bookedSeats)}
      ${createSeatButton(`${r}B`, 'business', bookedSeats)}
      <div class="aisle-gap"></div>
      ${createSeatButton(`${r}C`, 'business', bookedSeats)}
      ${createSeatButton(`${r}D`, 'business', bookedSeats)}
      <div class="aisle-gap"></div>
      ${createSeatButton(`${r}E`, 'business', bookedSeats)}
      ${createSeatButton(`${r}F`, 'business', bookedSeats)}
    `;
    container.appendChild(rowDiv);
  }

  // Section 3: Economy Class (Rows 10 - 18, 3-3-3 layout)
  const ecTitle = document.createElement('div');
  ecTitle.className = 'cabin-section-title';
  ecTitle.textContent = 'Main Cabin & Extra Legroom';
  container.appendChild(ecTitle);

  for (let r = 10; r <= 18; r++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'seat-row';
    rowDiv.innerHTML = `
      <span class="row-num-tag">${r}</span>
      ${createSeatButton(`${r}A`, 'economy', bookedSeats)}
      ${createSeatButton(`${r}B`, 'economy', bookedSeats)}
      ${createSeatButton(`${r}C`, 'economy', bookedSeats)}
      <div class="aisle-gap"></div>
      ${createSeatButton(`${r}D`, 'economy', bookedSeats)}
      ${createSeatButton(`${r}E`, 'economy', bookedSeats)}
      ${createSeatButton(`${r}F`, 'economy', bookedSeats)}
      <div class="aisle-gap"></div>
      ${createSeatButton(`${r}G`, 'economy', bookedSeats)}
      ${createSeatButton(`${r}H`, 'economy', bookedSeats)}
      ${createSeatButton(`${r}J`, 'economy', bookedSeats)}
    `;
    container.appendChild(rowDiv);
  }

  // Attach click listeners to all seats
  container.querySelectorAll('.seat:not(.occupied)').forEach(seatBtn => {
    seatBtn.addEventListener('click', (e) => {
      const seatCode = e.currentTarget.dataset.seat;
      toggleSeatSelection(seatCode, e.currentTarget);
    });
  });
}

function createSeatButton(seatCode, seatClass, bookedSeats) {
  const isBooked = bookedSeats.includes(seatCode);
  const isSelected = AppState.selectedSeats.includes(seatCode);

  let classes = `seat ${seatClass}-class`;
  if (isBooked) classes += ' occupied';
  if (isSelected) classes += ' selected';

  return `
    <button type="button" class="${classes}" data-seat="${seatCode}" data-class="${seatClass}" ${isBooked ? 'disabled' : ''} title="${seatCode} (${capitalize(seatClass)})">
      ${seatCode.slice(-1)}
    </button>
  `;
}

function toggleSeatSelection(seatCode, el) {
  const maxSeats = AppState.searchQuery.passengers || 1;

  if (AppState.selectedSeats.includes(seatCode)) {
    // Deselect
    AppState.selectedSeats = AppState.selectedSeats.filter(s => s !== seatCode);
    el.classList.remove('selected');
  } else {
    // Select
    if (AppState.selectedSeats.length >= maxSeats) {
      showToast(`You have selected the maximum ${maxSeats} seat(s) for your passengers.`, 'info');
      return;
    }
    AppState.selectedSeats.push(seatCode);
    el.classList.add('selected');
  }

  updateFareSummary();
}

function updateFareSummary() {
  if (!AppState.selectedFlight) return;

  const baseFarePerPassenger = AppState.selectedFlight.pricing[AppState.cabinClass] || AppState.selectedFlight.pricing.economy;
  const numPassengers = AppState.searchQuery.passengers || 1;
  const totalBaseFare = baseFarePerPassenger * numPassengers;

  // Calculate seat fees
  let totalSeatFee = 0;
  AppState.selectedSeats.forEach(seatCode => {
    const rowNum = parseInt(seatCode, 10);
    if (rowNum <= 2) totalSeatFee += 150; // First suite surcharge
    else if (rowNum <= 6) totalSeatFee += 50; // Business surcharge
    else if (rowNum === 10 || rowNum === 14) totalSeatFee += 25; // Extra legroom
    else totalSeatFee += 0;
  });

  const totalAddonsFee = AppState.bookingAddons.mealFee + 
                         AppState.bookingAddons.baggageFee + 
                         AppState.bookingAddons.insuranceFee + 
                         AppState.bookingAddons.priorityFee;

  const taxesFee = 65 * numPassengers;
  const grandTotal = totalBaseFare + totalSeatFee + totalAddonsFee + taxesFee;

  // DOM updates
  document.getElementById('summary-selected-seats').textContent = 
    AppState.selectedSeats.length > 0 ? AppState.selectedSeats.join(', ') : 'None selected (Please choose on map)';
  document.getElementById('calc-base-fare').textContent = `$${totalBaseFare.toLocaleString()}`;
  document.getElementById('calc-seat-fee').textContent = `$${totalSeatFee.toLocaleString()}`;
  document.getElementById('calc-addons-fee').textContent = `$${totalAddonsFee.toLocaleString()}`;
  document.getElementById('calc-taxes-fee').textContent = `$${taxesFee.toLocaleString()}`;
  document.getElementById('calc-total-fare').textContent = `$${grandTotal.toLocaleString()}`;

  // Store for payment
  AppState.currentCalculatedFare = {
    baseFare: totalBaseFare,
    seatFee: totalSeatFee,
    addonsFee: totalAddonsFee,
    taxes: taxesFee,
    totalPaid: grandTotal
  };
}

function validateAndProceedToPayment() {
  const reqSeats = AppState.searchQuery.passengers || 1;
  if (AppState.selectedSeats.length < reqSeats) {
    showToast(`Please select ${reqSeats} seat(s) on the cabin seat map before proceeding.`, 'error');
    return;
  }

  const name = document.getElementById('passenger-fullname').value.trim();
  const email = document.getElementById('passenger-email').value.trim();
  const phone = document.getElementById('passenger-phone').value.trim();
  const passport = document.getElementById('passenger-passport').value.trim();

  if (!name || !email || !phone || !passport) {
    showToast('Please complete all passenger contact and passport details.', 'error');
    return;
  }

  // Construct pending booking
  AppState.pendingBooking = {
    flight: AppState.selectedFlight,
    cabinClass: AppState.cabinClass,
    seats: [...AppState.selectedSeats],
    passenger: {
      fullName: name,
      email: email,
      phone: phone,
      gender: document.getElementById('passenger-gender').value,
      age: parseInt(document.getElementById('passenger-age').value, 10),
      passport: passport
    },
    addons: {
      meal: AppState.bookingAddons.meal,
      baggage: AppState.bookingAddons.baggage,
      insurance: AppState.bookingAddons.insurance,
      priority: AppState.bookingAddons.priority
    },
    fareBreakdown: { ...AppState.currentCalculatedFare }
  };

  // Populate payment view summary
  setupPaymentView();
  navigateTo('payment');
}

/* ==========================================================================
   Payment Gateway Interface
   ========================================================================== */
function initPaymentGateway() {
  document.getElementById('btn-back-to-booking').addEventListener('click', () => {
    navigateTo('book-ticket');
  });

  // Payment tab switching
  const payTabs = document.querySelectorAll('.pay-tab-btn');
  payTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      payTabs.forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');

      const method = e.currentTarget.dataset.payMethod;
      document.querySelectorAll('.pay-panel').forEach(p => p.style.display = 'none');
      document.getElementById(`pay-panel-${method}`).style.display = 'block';
    });
  });

  // Credit Card Input formatting & dynamic preview
  const cardNumInput = document.getElementById('card-number-input');
  const cardHolderInput = document.getElementById('card-holder-input');
  const cardExpiryInput = document.getElementById('card-expiry-input');

  cardNumInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    e.target.value = formatted.substring(0, 19);
    document.getElementById('preview-card-number').textContent = formatted || '•••• •••• •••• 4242';
  });

  cardHolderInput.addEventListener('input', (e) => {
    document.getElementById('preview-card-holder').textContent = e.target.value || 'Card Holder';
  });

  cardExpiryInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
    e.target.value = val.substring(0, 5);
    document.getElementById('preview-card-expiry').textContent = val || '12/28';
  });

  // Card Payment submit
  document.getElementById('payment-card-form').addEventListener('submit', (e) => {
    e.preventDefault();
    processSuccessfulPayment('Credit Card', cardNumInput.value.slice(-4));
  });

  // UPI Simulation button
  document.getElementById('btn-simulate-upi-pay').addEventListener('click', () => {
    processSuccessfulPayment('UPI / QR Code', 'UPI-TXN');
  });

  // Net Banking Simulation button
  document.getElementById('btn-simulate-netbanking-pay').addEventListener('click', () => {
    const bank = document.getElementById('bank-select').value;
    processSuccessfulPayment(`Net Banking (${bank})`, 'NET-TXN');
  });
}

window.simulateWalletPay = function(walletName) {
  processSuccessfulPayment(walletName, 'WALLET');
};

function setupPaymentView() {
  if (!AppState.pendingBooking) return;

  const total = AppState.pendingBooking.fareBreakdown.totalPaid;
  document.getElementById('pay-button-amount').textContent = total.toLocaleString();

  const container = document.getElementById('payment-itinerary-details');
  const flight = AppState.pendingBooking.flight;
  const originAirport = AIRPORTS.find(a => a.code === flight.origin) || { city: flight.origin };
  const destAirport = AIRPORTS.find(a => a.code === flight.destination) || { city: flight.destination };

  container.innerHTML = `
    <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem; margin-bottom: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 700; color: #fff;">${flight.airline}</span>
        <span style="font-family: var(--font-mono); color: var(--accent-cyan); font-weight: 700;">${flight.flightNumber}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
        <span>${flight.origin} (${originAirport.city})</span>
        <span style="color: var(--text-dim);">➔</span>
        <span>${flight.destination} (${destAirport.city})</span>
      </div>
    </div>

    <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 6px; margin-bottom: 1.25rem;">
      <div><strong>Passenger:</strong> ${AppState.pendingBooking.passenger.fullName}</div>
      <div><strong>Class:</strong> ${capitalize(AppState.pendingBooking.cabinClass)} Class</div>
      <div><strong>Reserved Seat(s):</strong> <span style="color: var(--accent-cyan); font-weight: 700;">${AppState.pendingBooking.seats.join(', ')}</span></div>
      <div><strong>Departure Date:</strong> ${AppState.searchQuery.date || 'Tomorrow'} at ${flight.departureTime}</div>
    </div>

    <div style="background: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: var(--radius-md); padding: 12px; text-align: center;">
      <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); display: block;">Total Amount to Charge</span>
      <span style="font-size: 1.8rem; font-weight: 800; color: #ffffff; font-family: var(--font-display);">$${total.toLocaleString()}</span>
    </div>
  `;
}

function processSuccessfulPayment(paymentMethod, cardLast4) {
  const submitBtn = document.getElementById('btn-submit-payment');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>⏳</span> Authorizing with Bank Gateway...`;
  }

  showToast('Connecting with secure banking gateway...', 'info');

  setTimeout(() => {
    // Generate unique PNR and Ticket number
    const pnr = 'SKYW-' + Math.floor(1000 + Math.random() * 9000);
    const ticketNo = '098-' + Math.floor(1000000000 + Math.random() * 9000000000);
    const txnId = 'TXN-' + Math.floor(100000000 + Math.random() * 900000000);

    const flight = AppState.pendingBooking.flight;
    const originAirport = AIRPORTS.find(a => a.code === flight.origin) || { city: flight.origin };
    const destAirport = AIRPORTS.find(a => a.code === flight.destination) || { city: flight.destination };

    const newBooking = {
      pnr: pnr,
      ticketNumber: ticketNo,
      flightId: flight.id,
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      aircraft: flight.aircraft,
      origin: flight.origin,
      originCity: originAirport.city,
      destination: flight.destination,
      destinationCity: destAirport.city,
      travelDate: AppState.searchQuery.date || '2026-10-30',
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      flightClass: AppState.pendingBooking.cabinClass,
      cabinClassLabel: capitalize(AppState.pendingBooking.cabinClass) + ' Class',
      passenger: { ...AppState.pendingBooking.passenger },
      seats: [...AppState.pendingBooking.seats],
      addons: { ...AppState.pendingBooking.addons },
      fareBreakdown: { ...AppState.pendingBooking.fareBreakdown },
      payment: {
        method: paymentMethod,
        cardLast4: cardLast4,
        transactionId: txnId,
        status: 'Paid',
        timestamp: new Date().toLocaleString()
      },
      bookingStatus: 'Confirmed',
      terminal: flight.terminal || 'T3',
      gate: flight.gate || 'A14',
      boardingGroup: 'Group 2',
      boardingTime: calculateBoardingTime(flight.departureTime)
    };

    // Save booking to DB
    const bookings = DB.getBookings();
    bookings.unshift(newBooking);
    DB.saveBookings(bookings);

    // Update flight seat inventory in DB
    const flights = DB.getFlights();
    const flightObj = flights.find(f => f.id === flight.id);
    if (flightObj) {
      if (!flightObj.seats.booked) flightObj.seats.booked = [];
      flightObj.seats.booked.push(...AppState.pendingBooking.seats);
      DB.saveFlights(flights);
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>⚡</span> Authorize & Pay`;
    }

    showToast(`Payment Approved! PNR ${pnr} has been confirmed.`, 'success');

    // Display Boarding Pass
    renderBoardingPass(newBooking);
    navigateTo('print-ticket');
  }, 1200);
}

/* ==========================================================================
   PNR & Flight Status Tracker
   ========================================================================== */
function initStatusTracker() {
  const form = document.getElementById('pnr-lookup-form');
  const input = document.getElementById('pnr-input');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    lookupPNR(input.value.trim());
  });

  // Demo buttons
  document.querySelectorAll('.demo-pnr-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pnr = e.currentTarget.dataset.pnr;
      input.value = pnr;
      lookupPNR(pnr);
    });
  });
}

function lookupPNR(pnrCode) {
  const code = pnrCode.toUpperCase();
  const bookings = DB.getBookings();
  const booking = bookings.find(b => b.pnr.toUpperCase() === code);

  const container = document.getElementById('status-result-area');

  if (!booking) {
    container.innerHTML = `
      <div class="glass-panel" style="padding: 2.5rem; text-align: center;">
        <span style="font-size: 3rem;">⚠️</span>
        <h3 style="margin-top: 10px;">PNR "${code}" Not Found</h3>
        <p style="margin-top: 6px;">Please verify your booking reference or try one of our demo reservations above.</p>
      </div>
    `;
    showToast(`PNR "${code}" was not found.`, 'error');
    return;
  }

  showToast(`Booking retrieved for PNR ${booking.pnr}.`, 'success');

  // Determine Stepper Status
  const isCancelled = booking.bookingStatus === 'Cancelled';
  let step1Class = 'step-node completed';
  let step2Class = 'step-node completed';
  let step3Class = 'step-node active';
  let step4Class = 'step-node';
  let step5Class = 'step-node';

  if (booking.bookingStatus === 'Check-In Open') {
    step2Class = 'step-node active';
    step3Class = 'step-node';
  } else if (booking.bookingStatus === 'Boarding') {
    step3Class = 'step-node completed';
    step4Class = 'step-node active';
  } else if (isCancelled) {
    step1Class = 'step-node';
    step2Class = 'step-node';
    step3Class = 'step-node';
  }

  container.innerHTML = `
    <div class="glass-panel" style="padding: 2.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-dim); letter-spacing: 1px;">Booking Reference (PNR)</span>
          <h2 style="font-family: var(--font-mono); color: var(--accent-cyan); font-size: 2rem;">${booking.pnr}</h2>
        </div>

        <div style="text-align: right;">
          <span class="status-pill ${isCancelled ? 'cancelled' : 'confirmed'}">
            ● ${booking.bookingStatus}
          </span>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Ticket: ${booking.ticketNumber}</div>
        </div>
      </div>

      <!-- Live Journey Stepper -->
      ${!isCancelled ? `
        <div class="pnr-stepper">
          <div class="${step1Class}">
            <div class="step-circle">✓</div>
            <span class="step-label">Booking Confirmed</span>
          </div>
          <div class="${step2Class}">
            <div class="step-circle">🧳</div>
            <span class="step-label">Web Check-in</span>
          </div>
          <div class="${step3Class}">
            <div class="step-circle">🚪</div>
            <span class="step-label">Gate Assigned (${booking.gate || 'A14'})</span>
          </div>
          <div class="${step4Class}">
            <div class="step-circle">🛫</div>
            <span class="step-label">Boarding</span>
          </div>
          <div class="${step5Class}">
            <div class="step-circle">✈️</div>
            <span class="step-label">In Flight</span>
          </div>
        </div>
      ` : `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 1.25rem; margin: 1.5rem 0; color: #fca5a5;">
          <strong>⚠️ Ticket Cancelled:</strong> This booking has been cancelled and seats released. Refund was processed to the original payment source.
        </div>
      `}

      <!-- Flight Telemetry Details -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; background: rgba(14, 23, 46, 0.8); border: 1px solid var(--border-card); border-radius: var(--radius-md); padding: 1.5rem; margin-bottom: 2rem;">
        <div>
          <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-dim); display: block;">Airline & Flight</span>
          <span style="font-weight: 700; color: #fff;">${booking.airline} (${booking.flightNumber})</span>
        </div>
        <div>
          <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-dim); display: block;">Route & Date</span>
          <span style="font-weight: 700; color: #fff;">${booking.origin} ➔ ${booking.destination} (${booking.travelDate})</span>
        </div>
        <div>
          <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-dim); display: block;">Terminal & Gate</span>
          <span style="font-weight: 700; color: var(--accent-gold);">${booking.terminal || 'T3'} • Gate ${booking.gate || 'A14'}</span>
        </div>
        <div>
          <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-dim); display: block;">Assigned Seat(s)</span>
          <span style="font-weight: 800; color: var(--accent-cyan); font-family: var(--font-mono);">${booking.seats.join(', ')}</span>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div style="display: flex; gap: 12px; justify-content: flex-end; flex-wrap: wrap;">
        ${!isCancelled ? `
          <button class="btn btn-outline" onclick="triggerWebCheckIn('${booking.pnr}')">
            <span>✅</span> Complete Web Check-In
          </button>
          <button class="btn btn-primary" onclick="viewBoardingPassFromPNR('${booking.pnr}')">
            <span>🖨️</span> Print Boarding Pass
          </button>
          <button class="btn btn-danger btn-sm" onclick="startCancellationForPNR('${booking.pnr}')">
            <span>❌</span> Cancel Reservation
          </button>
        ` : `
          <button class="btn btn-primary" onclick="navigateTo('search')">
            Book New Flight
          </button>
        `}
      </div>
    </div>
  `;
}

window.triggerWebCheckIn = function(pnr) {
  const bookings = DB.getBookings();
  const booking = bookings.find(b => b.pnr === pnr);
  if (booking) {
    booking.bookingStatus = 'Checked-In';
    DB.saveBookings(bookings);
    showToast(`Web Check-In completed for ${pnr}! Gate pass ready.`, 'success');
    lookupPNR(pnr);
  }
};

window.viewBoardingPassFromPNR = function(pnr) {
  const bookings = DB.getBookings();
  const booking = bookings.find(b => b.pnr === pnr);
  if (booking) {
    renderBoardingPass(booking);
    navigateTo('print-ticket');
  }
};

window.startCancellationForPNR = function(pnr) {
  navigateTo('cancel-ticket');
  const select = document.getElementById('cancel-booking-select');
  if (select) {
    select.value = pnr;
    renderCancelPreview(pnr);
  }
};

/* ==========================================================================
   Boarding Pass & Official E-Ticket Layout Generator
   ========================================================================== */
function renderBoardingPass(booking) {
  AppState.currentPrintBooking = booking;
  const container = document.getElementById('printable-boarding-pass-container');

  const originAirport = AIRPORTS.find(a => a.code === booking.origin) || { city: booking.originCity || booking.origin };
  const destAirport = AIRPORTS.find(a => a.code === booking.destination) || { city: booking.destinationCity || booking.destination };

  container.innerHTML = `
    <div class="boarding-pass-card">
      <!-- Main Pass Body -->
      <div class="pass-main-body">
        <div class="pass-header">
          <div class="pass-airline-brand">
            <span style="font-size: 1.8rem;">✈️</span>
            <div>
              <h3 style="font-size: 1.25rem; font-weight: 800;">${booking.airline.toUpperCase()}</h3>
              <span style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px;">Official E-Ticket & Boarding Pass</span>
            </div>
          </div>
          <span class="pass-badge">${booking.cabinClassLabel || 'Economy Class'}</span>
        </div>

        <!-- Route Codes -->
        <div class="pass-route-strip">
          <div class="pass-city-block">
            <div class="pass-code">${booking.origin}</div>
            <div class="pass-city-name">${originAirport.city}</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #fff; margin-top: 4px;">${booking.departureTime}</div>
          </div>

          <div class="pass-plane-mid">
            <span class="pass-flight-pill">${booking.flightNumber}</span>
            <div style="width: 140px; height: 2px; background: rgba(255,255,255,0.2); position: relative; margin: 8px 0;">
              <span style="position: absolute; top: -10px; left: 45%; color: var(--accent-cyan); font-size: 1rem;">✈</span>
            </div>
            <span style="font-size: 0.75rem; color: var(--text-dim);">${booking.aircraft || 'Airbus A350'}</span>
          </div>

          <div class="pass-city-block right">
            <div class="pass-code">${booking.destination}</div>
            <div class="pass-city-name">${destAirport.city}</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #fff; margin-top: 4px;">${booking.arrivalTime}</div>
          </div>
        </div>

        <!-- Passenger Details Grid -->
        <div class="pass-grid-info">
          <div class="pass-info-box">
            <label>Passenger Name</label>
            <span>${booking.passenger.fullName}</span>
          </div>
          <div class="pass-info-box">
            <label>Date of Travel</label>
            <span>${booking.travelDate}</span>
          </div>
          <div class="pass-info-box">
            <label>Gate / Terminal</label>
            <span style="color: var(--accent-gold);">${booking.gate || 'A14'} • ${booking.terminal || 'T3'}</span>
          </div>
          <div class="pass-info-box">
            <label>Boarding Group</label>
            <span style="color: var(--accent-cyan);">${booking.boardingGroup || 'Group 2'}</span>
          </div>
        </div>

        <div class="pass-grid-info">
          <div class="pass-info-box">
            <label>Assigned Seat(s)</label>
            <span style="font-family: var(--font-mono); font-size: 1.35rem; color: var(--accent-cyan); font-weight: 900;">${booking.seats.join(', ')}</span>
          </div>
          <div class="pass-info-box">
            <label>Boarding Time</label>
            <span>${booking.boardingTime || '07:45'}</span>
          </div>
          <div class="pass-info-box">
            <label>Baggage Allowance</label>
            <span>${booking.addons ? booking.addons.baggage : 'Standard 23kg'}</span>
          </div>
          <div class="pass-info-box">
            <label>Special Meal</label>
            <span>${booking.addons ? booking.addons.meal.split('-')[0].substring(0, 15) : 'Standard'}</span>
          </div>
        </div>

        <!-- Vector Barcode -->
        <div class="barcode-svg-wrap">
          <svg width="100%" height="40" viewBox="0 0 320 40">
            <rect x="0" y="0" width="4" height="40" fill="#000"/>
            <rect x="8" y="0" width="2" height="40" fill="#000"/>
            <rect x="14" y="0" width="6" height="40" fill="#000"/>
            <rect x="24" y="0" width="2" height="40" fill="#000"/>
            <rect x="30" y="0" width="4" height="40" fill="#000"/>
            <rect x="38" y="0" width="8" height="40" fill="#000"/>
            <rect x="50" y="0" width="2" height="40" fill="#000"/>
            <rect x="56" y="0" width="4" height="40" fill="#000"/>
            <rect x="64" y="0" width="6" height="40" fill="#000"/>
            <rect x="74" y="0" width="2" height="40" fill="#000"/>
            <rect x="80" y="0" width="6" height="40" fill="#000"/>
            <rect x="90" y="0" width="4" height="40" fill="#000"/>
            <rect x="98" y="0" width="2" height="40" fill="#000"/>
            <rect x="104" y="0" width="8" height="40" fill="#000"/>
            <rect x="116" y="0" width="4" height="40" fill="#000"/>
            <rect x="124" y="0" width="2" height="40" fill="#000"/>
            <rect x="130" y="0" width="6" height="40" fill="#000"/>
            <rect x="140" y="0" width="2" height="40" fill="#000"/>
            <rect x="146" y="0" width="8" height="40" fill="#000"/>
            <rect x="158" y="0" width="4" height="40" fill="#000"/>
            <rect x="166" y="0" width="6" height="40" fill="#000"/>
            <rect x="176" y="0" width="2" height="40" fill="#000"/>
            <rect x="182" y="0" width="4" height="40" fill="#000"/>
            <rect x="190" y="0" width="8" height="40" fill="#000"/>
            <rect x="202" y="0" width="4" height="40" fill="#000"/>
            <rect x="210" y="0" width="2" height="40" fill="#000"/>
            <rect x="216" y="0" width="6" height="40" fill="#000"/>
            <rect x="226" y="0" width="4" height="40" fill="#000"/>
            <rect x="234" y="0" width="8" height="40" fill="#000"/>
            <rect x="246" y="0" width="2" height="40" fill="#000"/>
            <rect x="252" y="0" width="4" height="40" fill="#000"/>
            <rect x="260" y="0" width="6" height="40" fill="#000"/>
            <rect x="270" y="0" width="2" height="40" fill="#000"/>
            <rect x="276" y="0" width="8" height="40" fill="#000"/>
            <rect x="288" y="0" width="4" height="40" fill="#000"/>
            <rect x="296" y="0" width="6" height="40" fill="#000"/>
            <rect x="306" y="0" width="2" height="40" fill="#000"/>
            <rect x="312" y="0" width="8" height="40" fill="#000"/>
          </svg>
        </div>
      </div>

      <!-- Perforated Tear-off Boarding Stub -->
      <div class="pass-stub">
        <div class="stub-header">
          <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-dim);">Flight PNR</span>
          <span class="stub-pnr">${booking.pnr}</span>
          <span style="font-size: 0.8rem; font-weight: 700; color: #fff;">${booking.passenger.fullName}</span>
        </div>

        <!-- Vector QR Code representation -->
        <div class="stub-qr">
          <svg width="110" height="110" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="#ffffff"/>
            <rect x="10" y="10" width="24" height="24" fill="#000000"/>
            <rect x="14" y="14" width="16" height="16" fill="#ffffff"/>
            <rect x="18" y="18" width="8" height="8" fill="#000000"/>
            <rect x="66" y="10" width="24" height="24" fill="#000000"/>
            <rect x="70" y="14" width="16" height="16" fill="#ffffff"/>
            <rect x="74" y="18" width="8" height="8" fill="#000000"/>
            <rect x="10" y="66" width="24" height="24" fill="#000000"/>
            <rect x="14" y="70" width="16" height="16" fill="#ffffff"/>
            <rect x="18" y="74" width="8" height="8" fill="#000000"/>
            <rect x="40" y="20" width="8" height="14" fill="#000000"/>
            <rect x="40" y="44" width="20" height="20" fill="#000000"/>
            <rect x="45" y="49" width="10" height="10" fill="#ffffff"/>
            <rect x="68" y="44" width="16" height="8" fill="#000000"/>
            <rect x="44" y="72" width="20" height="12" fill="#000000"/>
          </svg>
        </div>

        <div>
          <div style="font-size: 0.75rem; color: var(--text-dim);">SEAT</div>
          <div style="font-family: var(--font-mono); font-size: 1.5rem; font-weight: 900; color: var(--accent-cyan);">${booking.seats.join(', ')}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Gate closes 15m prior to takeoff</div>
        </div>
      </div>
    </div>
  `;

  // Attach Print trigger
  document.getElementById('btn-trigger-print').onclick = () => {
    window.print();
  };

  // Email Ticket simulation
  document.getElementById('btn-email-ticket').onclick = () => {
    showToast(`Boarding Pass & Tax Invoice emailed to ${booking.passenger.email}!`, 'success');
  };

  // Back button
  document.getElementById('btn-back-from-print').onclick = () => {
    navigateTo('my-tickets');
  };
}

/* ==========================================================================
   My Tickets & Reservation Management
   ========================================================================== */
function initMyTickets() {
  document.getElementById('btn-book-another-flight').addEventListener('click', () => {
    navigateTo('search');
  });

  const filterTabs = document.querySelectorAll('#my-tickets-tabs .cabin-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      filterTabs.forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      renderMyTickets(e.currentTarget.dataset.filter);
    });
  });
}

function renderMyTickets(statusFilter = 'all') {
  const container = document.getElementById('my-tickets-list-container');
  const allBookings = DB.getBookings();

  let filtered = allBookings;
  if (statusFilter === 'confirmed') {
    filtered = allBookings.filter(b => b.bookingStatus !== 'Cancelled');
  } else if (statusFilter === 'cancelled') {
    filtered = allBookings.filter(b => b.bookingStatus === 'Cancelled');
  }

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-panel" style="padding: 3rem; text-align: center;">
        <span style="font-size: 3rem;">🎫</span>
        <h3 style="margin-top: 10px;">No Bookings Found</h3>
        <p style="margin-top: 6px;">You don't have any bookings matching this filter. Book a flight to see your itinerary here!</p>
        <button class="btn btn-primary" onclick="navigateTo('search')" style="margin-top: 1.25rem;">
          Search Available Flights
        </button>
      </div>
    `;
    return;
  }

  filtered.forEach(booking => {
    const isCancelled = booking.bookingStatus === 'Cancelled';
    const card = document.createElement('div');
    card.className = 'glass-panel';
    card.style.padding = '1.75rem';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem; margin-bottom: 1rem; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 1.5rem;">✈️</span>
          <div>
            <h4 style="font-size: 1.15rem;">${booking.airline} (${booking.flightNumber})</h4>
            <span style="font-size: 0.8rem; color: var(--text-dim);">${booking.aircraft || 'Airbus'}</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="status-pill ${isCancelled ? 'cancelled' : 'confirmed'}">
            ● ${booking.bookingStatus}
          </span>
          <span style="font-family: var(--font-mono); font-weight: 800; color: var(--accent-cyan); font-size: 1.1rem;">${booking.pnr}</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px; align-items: center; margin-bottom: 1.25rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; font-size: 1.1rem; font-weight: 700; color: #fff;">
            <span>${booking.origin}</span>
            <span style="color: var(--accent-cyan);">➔</span>
            <span>${booking.destination}</span>
          </div>
          <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">
            Travel Date: ${booking.travelDate} • Departure: ${booking.departureTime}
          </div>
        </div>

        <div>
          <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Passenger & Seat</div>
          <div style="font-weight: 700; color: #fff;">${booking.passenger.fullName}</div>
          <div style="font-family: var(--font-mono); color: var(--accent-cyan); font-weight: 700;">Seat ${booking.seats.join(', ')} (${capitalize(booking.flightClass)})</div>
        </div>

        <div style="text-align: right;">
          <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Fare Paid</div>
          <div style="font-size: 1.3rem; font-weight: 800; color: #fff;">$${booking.fareBreakdown.totalPaid.toLocaleString()}</div>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-subtle); padding-top: 1rem; flex-wrap: wrap;">
        ${!isCancelled ? `
          <button class="btn btn-outline btn-sm" onclick="viewBoardingPassFromPNR('${booking.pnr}')">
            <span>🖨️</span> Print Boarding Pass
          </button>
          <button class="btn btn-secondary btn-sm" onclick="lookupPNR('${booking.pnr}'); navigateTo('status');">
            <span>🛰️</span> Live Status
          </button>
          <button class="btn btn-danger btn-sm" onclick="startCancellationForPNR('${booking.pnr}')">
            <span>❌</span> Cancel Ticket
          </button>
        ` : `
          <span style="font-size: 0.85rem; color: #f87171; align-self: center;">Ticket Cancelled & Refund Credited</span>
        `}
      </div>
    `;

    container.appendChild(card);
  });
}

/* ==========================================================================
   Cancellation Engine & Transparent Refund Calculator
   ========================================================================== */
function initCancellationEngine() {
  const select = document.getElementById('cancel-booking-select');
  const confirmBtn = document.getElementById('btn-confirm-cancel-ticket');

  select.addEventListener('change', (e) => {
    renderCancelPreview(e.target.value);
  });

  confirmBtn.addEventListener('click', () => {
    const pnr = select.value;
    if (!pnr) {
      showToast('Please select a valid booking to cancel.', 'error');
      return;
    }

    if (confirm(`Are you sure you want to cancel booking PNR ${pnr}? This will release your reserved seats and issue a refund.`)) {
      executeTicketCancellation(pnr);
    }
  });
}

function populateCancellationDropdown() {
  const select = document.getElementById('cancel-booking-select');
  const bookings = DB.getBookings().filter(b => b.bookingStatus !== 'Cancelled');

  select.innerHTML = '';

  if (bookings.length === 0) {
    select.innerHTML = '<option value="">No Active Confirmed Bookings Available</option>';
    document.getElementById('cancel-ticket-preview').innerHTML = `
      <p style="text-align: center; color: var(--text-dim);">There are currently no active reservations eligible for cancellation.</p>
    `;
    document.getElementById('refund-original-fare').textContent = '$0';
    document.getElementById('refund-net-total').textContent = '$0';
    document.getElementById('btn-confirm-cancel-ticket').disabled = true;
    return;
  }

  document.getElementById('btn-confirm-cancel-ticket').disabled = false;

  bookings.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.pnr;
    opt.textContent = `${b.pnr} - ${b.airline} (${b.origin} ➔ ${b.destination}) - ${b.passenger.fullName}`;
    select.appendChild(opt);
  });

  // Render initial selection
  renderCancelPreview(select.value);
}

function renderCancelPreview(pnr) {
  const bookings = DB.getBookings();
  const booking = bookings.find(b => b.pnr === pnr);
  const previewContainer = document.getElementById('cancel-ticket-preview');

  if (!booking) {
    previewContainer.innerHTML = '<p>Select a booking above to view details.</p>';
    return;
  }

  previewContainer.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <h4 style="color: #fff;">${booking.airline} (${booking.flightNumber}) • PNR: ${booking.pnr}</h4>
      <span class="status-pill confirmed">● ${booking.bookingStatus}</span>
    </div>
    <div style="font-size: 0.85rem; color: var(--text-muted); display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      <div>Route: <strong>${booking.origin} ➔ ${booking.destination}</strong></div>
      <div>Date: <strong>${booking.travelDate}</strong></div>
      <div>Passenger: <strong>${booking.passenger.fullName}</strong></div>
      <div>Seats: <strong>${booking.seats.join(', ')}</strong></div>
    </div>
  `;

  // Transparent Refund Calculation
  const totalPaid = booking.fareBreakdown.totalPaid;
  const standardPenalty = 75; // $75 cancellation fee
  const taxRefund = 65; // $65 taxes refunded
  const netRefund = Math.max(0, totalPaid - standardPenalty);

  document.getElementById('refund-original-fare').textContent = `$${totalPaid.toLocaleString()}`;
  document.getElementById('refund-deduction').textContent = `-$${standardPenalty}`;
  document.getElementById('refund-tax-amount').textContent = `+$${taxRefund} (Included in base)`;
  document.getElementById('refund-net-total').textContent = `$${netRefund.toLocaleString()}`;

  AppState.activeCancellationRefund = netRefund;
}

function executeTicketCancellation(pnr) {
  const bookings = DB.getBookings();
  const booking = bookings.find(b => b.pnr === pnr);

  if (!booking) return;

  // Update status to cancelled
  booking.bookingStatus = 'Cancelled';
  DB.saveBookings(bookings);

  // Release seats back into flight inventory
  const flights = DB.getFlights();
  const flight = flights.find(f => f.id === booking.flightId || f.flightNumber === booking.flightNumber);
  if (flight && flight.seats && flight.seats.booked) {
    flight.seats.booked = flight.seats.booked.filter(s => !booking.seats.includes(s));
    DB.saveFlights(flights);
  }

  showToast(`Ticket ${pnr} successfully cancelled! Refund of $${AppState.activeCancellationRefund || 0} initiated.`, 'success');

  // Refresh
  populateCancellationDropdown();
}

/* ==========================================================================
   Customer Feedback & Community Reviews
   ========================================================================== */
function initFeedbackSystem() {
  const starContainer = document.getElementById('star-rating-selector');
  const ratingValInput = document.getElementById('fb-rating-val');
  const stars = starContainer.querySelectorAll('.star-icon');

  stars.forEach(star => {
    star.addEventListener('click', (e) => {
      const rating = parseInt(e.currentTarget.dataset.rating, 10);
      ratingValInput.value = rating;
      updateStarDisplay(rating);
    });

    star.addEventListener('mouseenter', (e) => {
      const rating = parseInt(e.currentTarget.dataset.rating, 10);
      updateStarDisplay(rating);
    });
  });

  starContainer.addEventListener('mouseleave', () => {
    updateStarDisplay(parseInt(ratingValInput.value, 10));
  });

  // Handle Form Submit
  document.getElementById('feedback-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('fb-fullname').value.trim();
    const flight = document.getElementById('fb-flight').value.trim();
    const category = document.getElementById('fb-category').value;
    const rating = parseInt(ratingValInput.value, 10);
    const comments = document.getElementById('fb-comments').value.trim();

    if (!comments) {
      showToast('Please provide your detailed review comments.', 'error');
      return;
    }

    const newFeedback = {
      id: 'FB-' + Date.now().toString().slice(-4),
      name: name,
      flight: flight,
      rating: rating,
      category: category,
      date: new Date().toISOString().split('T')[0],
      comment: comments,
      verified: true
    };

    const feedbacks = DB.getFeedbacks();
    feedbacks.unshift(newFeedback);
    DB.saveFeedbacks(feedbacks);

    showToast('Thank you! Your feedback has been verified and published.', 'success');
    document.getElementById('fb-comments').value = '';
    renderFeedbackReviews();
  });

  renderFeedbackReviews();
}

function updateStarDisplay(rating) {
  const stars = document.querySelectorAll('#star-rating-selector .star-icon');
  stars.forEach((s, idx) => {
    s.style.opacity = idx < rating ? '1' : '0.25';
  });
}

function renderFeedbackReviews() {
  const container = document.getElementById('feedback-reviews-feed');
  const feedbacks = DB.getFeedbacks();

  container.innerHTML = '';

  feedbacks.forEach(fb => {
    const card = document.createElement('div');
    card.className = 'glass-panel';
    card.style.padding = '1.25rem 1.5rem';

    let starsHtml = '★'.repeat(fb.rating) + '☆'.repeat(5 - fb.rating);

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div>
          <span style="font-weight: 700; color: #fff;">${fb.name}</span>
          ${fb.verified ? '<span style="font-size: 0.72rem; color: var(--status-confirmed); margin-left: 6px;">✓ Verified Traveler</span>' : ''}
        </div>
        <span style="color: var(--accent-gold); font-size: 1.1rem; letter-spacing: 2px;">${starsHtml}</span>
      </div>

      <div style="font-size: 0.78rem; color: var(--accent-cyan); margin-bottom: 6px;">
        ${fb.flight || 'SkyWings Flight'} • <span style="color: var(--text-dim);">${fb.category}</span>
      </div>

      <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5;">"${fb.comment}"</p>

      <div style="text-align: right; font-size: 0.72rem; color: var(--text-dim); margin-top: 6px;">
        ${fb.date}
      </div>
    `;

    container.appendChild(card);
  });
}

/* ==========================================================================
   Admin Operations Center, Flight Scheduler & Reports
   ========================================================================== */
function initAdminDashboard() {
  // Admin Subpanel switching
  const tabs = document.querySelectorAll('#admin-nav-tabs .admin-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');

      const panel = e.currentTarget.dataset.adminPanel;
      document.querySelectorAll('.admin-subpanel').forEach(p => p.style.display = 'none');
      document.getElementById(`admin-panel-${panel}`).style.display = 'block';

      if (panel === 'inventory') {
        renderAdminInventory();
      } else if (panel === 'users') {
        renderAdminUsers();
      } else if (panel === 'reports') {
        renderAdminAnalytics();
      }
    });
  });

  // Modal: Add Flight
  document.getElementById('btn-open-add-flight-modal').addEventListener('click', () => {
    document.getElementById('add-flight-modal').classList.add('active');
  });

  document.getElementById('btn-close-add-flight-modal').addEventListener('click', () => {
    document.getElementById('add-flight-modal').classList.remove('active');
  });

  document.getElementById('form-add-flight').addEventListener('submit', (e) => {
    e.preventDefault();
    addNewFlightSchedule();
  });

  // Export CSV Report
  document.getElementById('btn-export-admin-csv').addEventListener('click', () => {
    exportAdminCSVReport();
  });
}

function refreshAdminDashboard() {
  const flights = DB.getFlights();
  const bookings = DB.getBookings();

  // Calculate Metrics
  const confirmedBookings = bookings.filter(b => b.bookingStatus !== 'Cancelled');
  const totalRevenue = confirmedBookings.reduce((acc, b) => acc + (b.fareBreakdown ? b.fareBreakdown.totalPaid : 0), 0);
  
  let totalCapacity = 0;
  let totalBooked = 0;
  flights.forEach(f => {
    totalCapacity += (f.seats.total || 120);
    totalBooked += (f.seats.booked ? f.seats.booked.length : 0);
  });
  const occupancyRate = totalCapacity > 0 ? ((totalBooked / totalCapacity) * 100).toFixed(1) : 0;

  document.getElementById('admin-kpi-revenue').textContent = `$${totalRevenue.toLocaleString()}`;
  document.getElementById('admin-kpi-bookings').textContent = confirmedBookings.length.toLocaleString();
  document.getElementById('admin-kpi-flights').textContent = flights.length;
  document.getElementById('admin-kpi-occupancy').textContent = `${occupancyRate}%`;

  // Render Flights Table
  renderAdminFlightsTable();
}

function renderAdminFlightsTable() {
  const tbody = document.getElementById('admin-flights-tbody');
  const flights = DB.getFlights();
  tbody.innerHTML = '';

  flights.forEach(f => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-cyan);">${f.flightNumber}</td>
      <td><strong>${f.airline}</strong></td>
      <td>${f.origin} ➔ ${f.destination} (${f.stops})</td>
      <td>${f.departureTime} - ${f.arrivalTime} (${f.duration})</td>
      <td style="font-size: 0.82rem; color: var(--text-dim);">${f.aircraft}</td>
      <td style="font-weight: 700;">$${f.pricing.economy}</td>
      <td>
        <select class="input-box" style="padding: 4px 8px; font-size: 0.78rem;" onchange="updateFlightStatus('${f.id}', this.value)">
          <option value="On Time" ${f.status === 'On Time' ? 'selected' : ''}>On Time</option>
          <option value="Delayed" ${f.status === 'Delayed' ? 'selected' : ''}>Delayed</option>
          <option value="Boarding" ${f.status === 'Boarding' ? 'selected' : ''}>Boarding</option>
          <option value="Gate Open" ${f.status === 'Gate Open' ? 'selected' : ''}>Gate Open</option>
          <option value="Cancelled" ${f.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteFlightSchedule('${f.id}')" title="Delete flight">
          🗑️
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.updateFlightStatus = function(flightId, newStatus) {
  const flights = DB.getFlights();
  const f = flights.find(x => x.id === flightId);
  if (f) {
    f.status = newStatus;
    DB.saveFlights(flights);
    showToast(`Flight ${f.flightNumber} status updated to "${newStatus}".`, 'success');
  }
};

window.deleteFlightSchedule = function(flightId) {
  if (confirm('Are you sure you want to remove this flight schedule?')) {
    let flights = DB.getFlights();
    flights = flights.filter(f => f.id !== flightId);
    DB.saveFlights(flights);
    showToast('Flight schedule deleted.', 'info');
    refreshAdminDashboard();
  }
};

function addNewFlightSchedule() {
  const number = document.getElementById('af-number').value.trim();
  const airline = document.getElementById('af-airline').value.trim();
  const origin = document.getElementById('af-origin').value;
  const dest = document.getElementById('af-destination').value;
  const dept = document.getElementById('af-dept-time').value;
  const arr = document.getElementById('af-arr-time').value;
  const aircraft = document.getElementById('af-aircraft').value.trim();
  const fare = parseInt(document.getElementById('af-fare').value, 10);
  const stops = document.getElementById('af-stops').value;

  if (origin === dest) {
    showToast('Origin and Destination cannot be the same airport.', 'error');
    return;
  }

  const newFlight = {
    id: 'FL-' + Date.now().toString().slice(-4),
    flightNumber: number.toUpperCase(),
    airline: airline,
    airlineCode: number.slice(0, 2).toUpperCase(),
    logo: '✈️',
    aircraft: aircraft,
    origin: origin,
    destination: dest,
    departureTime: dept,
    arrivalTime: arr,
    duration: '7h 30m',
    stops: stops,
    pricing: {
      economy: fare,
      premium: Math.round(fare * 1.6),
      business: Math.round(fare * 3.2),
      first: Math.round(fare * 6.0)
    },
    seats: {
      total: 120,
      booked: []
    },
    status: 'On Time',
    terminal: 'T1',
    gate: 'B12'
  };

  const flights = DB.getFlights();
  flights.unshift(newFlight);
  DB.saveFlights(flights);

  showToast(`New flight ${newFlight.flightNumber} scheduled successfully!`, 'success');
  document.getElementById('add-flight-modal').classList.remove('active');
  refreshAdminDashboard();
}

function renderAdminInventory() {
  const select = document.getElementById('admin-inventory-flight-select');
  const flights = DB.getFlights();
  select.innerHTML = '';

  flights.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.textContent = `${f.flightNumber} (${f.origin} ➔ ${f.destination}) - ${f.airline}`;
    select.appendChild(opt);
  });

  select.onchange = () => {
    displayFlightInventory(select.value);
  };

  if (flights.length > 0) {
    displayFlightInventory(flights[0].id);
  }
}

function displayFlightInventory(flightId) {
  const flights = DB.getFlights();
  const flight = flights.find(f => f.id === flightId);
  const container = document.getElementById('admin-inventory-display');

  if (!flight) return;

  const total = flight.seats.total || 120;
  const booked = flight.seats.booked || [];
  const percent = ((booked.length / total) * 100).toFixed(1);

  container.innerHTML = `
    <div style="background: rgba(14, 23, 46, 0.8); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.5rem; margin-top: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div>
          <h4>${flight.airline} • ${flight.flightNumber} (${flight.aircraft})</h4>
          <p>Route: ${flight.origin} ➔ ${flight.destination} | Status: <span style="color: var(--accent-cyan); font-weight: 700;">${flight.status}</span></p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-gold);">${percent}% Occupancy</div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${booked.length} of ${total} seats booked</span>
        </div>
      </div>

      <h5 style="margin-bottom: 8px; color: var(--text-muted);">Currently Occupied / Reserved Seat Coordinates:</h5>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${booked.length > 0 ? booked.map(s => `
          <span class="seat-chip" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #f87171;">
            Seat ${s}
          </span>
        `).join('') : '<span style="color: var(--status-confirmed);">No seats currently reserved. Full cabin available!</span>'}
      </div>
    </div>
  `;
}

function renderAdminUsers() {
  const tbody = document.getElementById('admin-users-tbody');
  const users = DB.getUsers();
  tbody.innerHTML = '';

  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family: var(--font-mono); color: var(--accent-cyan);">${u.id}</td>
      <td><strong>${u.name}</strong></td>
      <td>${u.email}</td>
      <td><span class="role-pill ${u.role}">${u.role}</span></td>
      <td>${u.phone || 'N/A'}</td>
      <td style="color: var(--text-dim);">${u.registeredAt || '2026-01-01'}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAdminAnalytics() {
  const routesContainer = document.getElementById('admin-top-routes-list');
  const fleetContainer = document.getElementById('admin-fleet-utilization');
  const bookings = DB.getBookings().filter(b => b.bookingStatus !== 'Cancelled');

  // Aggregate by corridor
  const routeCounts = {};
  bookings.forEach(b => {
    const corridor = `${b.origin} ➔ ${b.destination}`;
    routeCounts[corridor] = (routeCounts[corridor] || 0) + 1;
  });

  routesContainer.innerHTML = '';
  Object.keys(routeCounts).forEach(corridor => {
    const count = routeCounts[corridor];
    const item = document.createElement('div');
    item.style.cssText = 'display: flex; justify-content: space-between; padding: 10px 14px; background: rgba(14, 23, 46, 0.7); border-radius: 8px; border: 1px solid var(--border-subtle);';
    item.innerHTML = `
      <span style="font-weight: 700; color: #fff;">${corridor}</span>
      <span style="color: var(--accent-cyan); font-weight: 700;">${count} Bookings (${Math.round((count / bookings.length) * 100)}% of traffic)</span>
    `;
    routesContainer.appendChild(item);
  });

  fleetContainer.innerHTML = `
    <div style="padding: 12px; background: rgba(14, 23, 46, 0.7); border-radius: 8px; border: 1px solid var(--border-subtle); margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>Boeing 777 & 787 Fleet</span>
        <span style="color: var(--status-confirmed); font-weight: 700;">91.2% Load Factor</span>
      </div>
      <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
        <div style="width: 91.2%; height: 100%; background: var(--status-confirmed);"></div>
      </div>
    </div>

    <div style="padding: 12px; background: rgba(14, 23, 46, 0.7); border-radius: 8px; border: 1px solid var(--border-subtle);">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>Airbus A350 & A380 Fleet</span>
        <span style="color: var(--accent-cyan); font-weight: 700;">85.8% Load Factor</span>
      </div>
      <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
        <div style="width: 85.8%; height: 100%; background: var(--accent-cyan);"></div>
      </div>
    </div>
  `;
}

function exportAdminCSVReport() {
  const bookings = DB.getBookings();
  let csv = 'PNR,Ticket Number,Flight,Route,Travel Date,Passenger,Class,Seats,Total Paid,Status\n';

  bookings.forEach(b => {
    csv += `"${b.pnr}","${b.ticketNumber}","${b.flightNumber}","${b.origin} -> ${b.destination}","${b.travelDate}","${b.passenger.fullName}","${b.flightClass}","${b.seats.join(';')}","${b.fareBreakdown.totalPaid}","${b.bookingStatus}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', `SkyWings_Operations_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  showToast('Admin Operations Report exported as CSV!', 'success');
}

/* ==========================================================================
   Authentication, Login & Forgot Password System
   ========================================================================= */
function initAuthSystem() {
  const modal = document.getElementById('auth-modal');
  const openBtn = document.getElementById('btn-open-auth');
  const closeBtn = document.getElementById('btn-close-auth-modal');

  openBtn.addEventListener('click', () => {
    openAuthModal('login');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Auth tabs
  const authTabs = document.querySelectorAll('#auth-tabs .cabin-tab');
  authTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      authTabs.forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');

      const tabName = e.currentTarget.dataset.authTab;
      document.querySelectorAll('#auth-modal form').forEach(f => f.style.display = 'none');
      document.getElementById(`form-${tabName === 'admin' ? 'admin' : (tabName === 'forgot' ? 'forgot' : 'customer')}-${tabName === 'register' ? 'register' : (tabName === 'forgot' ? 'password' : 'login')}`).style.display = 'block';
    });
  });

  // Customer Login Submit
  document.getElementById('form-customer-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value.trim();

    const users = DB.getUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);

    if (found) {
      AppState.currentUser = found;
      AppState.currentRole = found.role;
      DB.setCurrentUser(found);
      updateUserBadge();
      modal.classList.remove('active');
      showToast(`Welcome back, ${found.name}! Signed in as Passenger.`, 'success');
    } else {
      showToast('Invalid email or password. Please check credentials.', 'error');
    }
  });

  // Customer Register Submit
  document.getElementById('form-customer-register').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-fullname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const pass = document.getElementById('reg-password').value.trim();

    const users = DB.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      showToast('An account with this email already exists.', 'error');
      return;
    }

    const newUser = {
      id: 'USR-' + Date.now().toString().slice(-4),
      name: name,
      email: email,
      phone: phone,
      password: pass,
      role: 'customer',
      registeredAt: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    DB.saveUsers(users);

    AppState.currentUser = newUser;
    AppState.currentRole = 'customer';
    DB.setCurrentUser(newUser);
    updateUserBadge();

    modal.classList.remove('active');
    showToast(`Account created! Welcome to SkyWings, ${name}.`, 'success');
  });

  // Admin Login Submit
  document.getElementById('form-admin-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value.trim();
    const pass = document.getElementById('admin-password').value.trim();

    if (email === 'admin@skywings.com' && pass === 'admin123') {
      const adminUser = {
        id: 'ADM-01',
        name: 'Chief Admin (Flight Ops)',
        email: 'admin@skywings.com',
        role: 'administrator'
      };
      AppState.currentUser = adminUser;
      AppState.currentRole = 'administrator';
      DB.setCurrentUser(adminUser);
      updateUserBadge();
      modal.classList.remove('active');
      showToast('Authenticated successfully as Flight Operations Administrator!', 'success');
      navigateTo('admin');
    } else {
      showToast('Invalid administrator credentials.', 'error');
    }
  });

  // Quick fill admin credentials button
  document.getElementById('btn-quick-fill-admin').addEventListener('click', () => {
    document.getElementById('admin-email').value = 'admin@skywings.com';
    document.getElementById('admin-password').value = 'admin123';
  });

  // Forgot Password Flow
  const sendOtpBtn = document.getElementById('btn-send-otp');
  const verifyResetBtn = document.getElementById('btn-verify-reset-pass');
  const otpGroup = document.getElementById('otp-input-group');

  sendOtpBtn.addEventListener('click', () => {
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) {
      showToast('Please enter your registered email address.', 'error');
      return;
    }

    showToast(`Security OTP generated! Demo Code: 894215`, 'info');
    otpGroup.style.display = 'block';
    sendOtpBtn.style.display = 'none';
    verifyResetBtn.style.display = 'block';
    document.getElementById('forgot-otp').value = '894215';
  });

  verifyResetBtn.addEventListener('click', () => {
    const otp = document.getElementById('forgot-otp').value.trim();
    const newPass = document.getElementById('forgot-new-pass').value.trim();
    const email = document.getElementById('forgot-email').value.trim();

    if (otp !== '894215') {
      showToast('Invalid security OTP code.', 'error');
      return;
    }

    if (!newPass || newPass.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    // Update password in DB
    const users = DB.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      user.password = newPass;
      DB.saveUsers(users);
      showToast('Password successfully reset! Please log in.', 'success');
      openAuthModal('login');
    } else {
      showToast('Password updated successfully for demo session.', 'success');
      openAuthModal('login');
    }
  });
}

function openAuthModal(defaultTab = 'login') {
  const modal = document.getElementById('auth-modal');
  modal.classList.add('active');

  const authTabs = document.querySelectorAll('#auth-tabs .cabin-tab');
  authTabs.forEach(t => t.classList.toggle('active', t.dataset.authTab === defaultTab));

  document.querySelectorAll('#auth-modal form').forEach(f => f.style.display = 'none');
  if (defaultTab === 'admin') {
    document.getElementById('form-admin-login').style.display = 'block';
  } else if (defaultTab === 'register') {
    document.getElementById('form-customer-register').style.display = 'block';
  } else if (defaultTab === 'forgot') {
    document.getElementById('form-forgot-password').style.display = 'block';
  } else {
    document.getElementById('form-customer-login').style.display = 'block';
  }
}

/* ==========================================================================
   Utility Functions & Toast Notifications
   ========================================================================== */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 400);
  }, 4000);
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function calculateBoardingTime(departureTime) {
  if (!departureTime) return '07:45';
  const parts = departureTime.split(':');
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);

  m -= 45;
  if (m < 0) {
    m += 60;
    h -= 1;
    if (h < 0) h += 24;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
