// Clear all due checkouts (removes old due checkouts from localStorage)
function clearAllDueCheckouts() {
  let bookings = [];
  try {
    bookings = JSON.parse(localStorage.getItem('motelBookings') || '[]');
  } catch (e) {
    console.error('failed to parse motelBookings', e);
  }
  const now = new Date();
  // Remove all bookings that are due checkouts (checkout in past, not checkedOut, or older than 24h)
  const filtered = bookings.filter(b => {
    if (!b.checkOut || !b.checkIn || !b.room || !b.guestName || typeof b.guestName !== 'string' || b.guestName.trim().length < 2) return true;
    // Remove if checkout is in the past and not checkedOut, or if checkout is older than 24h
    const now = new Date();
    const ci = new Date(b.checkIn);
    const co = new Date(b.checkOut);
    if (b.checkedOut) return true;
    if (ci > now) return true;
    // Remove if checkout is in the past and not checkedOut
    if (co <= now) return false;
    // Remove if checkout is older than 24h
    if (now - co > 24 * 60 * 60 * 1000) return false;
    return true;
  });
  localStorage.setItem('motelBookings', JSON.stringify(filtered));
  showDueCheckouts();
  loadStatus();
}
// Floating receipt modal logic
function showReceiptModal(booking) {
  const modal = document.getElementById('receiptModal');
  const details = document.getElementById('receiptDetails');
  if (!modal || !details) return;
  if (!booking) {
    details.innerHTML = '<span style="color:#b91c1c">No recent check-in found.</span>';
    modal.style.display = 'flex';
    return;
  }
  // Format date and time
  const dateObj = new Date(booking.checkIn);
  const dateStr = dateObj.toLocaleDateString('en-GB');
  const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    details.innerHTML = `
      <div class="r-header">PUKORET HOMES</div>
      <div class="r-sub">Guest Management System</div>
      <div class="r-divider"></div>
      <div class="r-section" style="text-align:center;font-weight:bold;">RECEIPT</div>
      <div class="r-section">
        <div class="r-row"><span class="r-label">Date:</span> <span class="r-value">${dateStr}</span></div>
        <div class="r-row"><span class="r-label">Time:</span> <span class="r-value">${timeStr}</span></div>
      </div>
      <div class="r-divider"></div>
      <div class="r-section"><div style="font-weight:bold;">Guest Details:</div>${booking.guestName}</div>
      <div class="r-divider"></div>
      <div class="r-section">
        <div class="r-row"><span class="r-label">Room Number:</span> <span class="r-value">${booking.room}</span></div>
        <div class="r-row"><span class="r-label">Check-In:</span> <span class="r-value">${dateStr}</span></div>
        <div class="r-row"><span class="r-label">Nights:</span> <span class="r-value">${booking.nights}</span></div>
      </div>
      <div class="r-row" style="margin-top:10px;"><span class="r-label">Room Charges:</span> <span class="r-value">KES ${booking.price ? booking.price.toLocaleString(undefined, {minimumFractionDigits:2}) : ''}</span></div>
      <div class="r-total">TOTAL: KES ${booking.price ? booking.price.toLocaleString(undefined, {minimumFractionDigits:2}) : ''}</div>
      <div class="r-divider"></div>
      <div class="r-welcome">Thank you for staying<br>with us!<br><br>PUKORET HOMES</div>
    `;
  modal.style.display = 'flex';
  // Show print and close buttons when receipt is visible
  const printBtn = document.getElementById('printReceiptBtn');
  const closeBtn = document.getElementById('closeReceiptBtn');
  if (printBtn) printBtn.style.display = 'block';
  if (closeBtn) closeBtn.style.display = 'block';
}

function closeReceiptModal() {
  const modal = document.getElementById('receiptModal');
  if (modal) modal.style.display = 'none';
  // Hide print and close buttons when receipt is closed
  const printBtn = document.getElementById('printReceiptBtn');
  const closeBtn = document.getElementById('closeReceiptBtn');
  if (printBtn) printBtn.style.display = 'none';
  if (closeBtn) closeBtn.style.display = 'none';
}

function printReceipt() {
  const modal = document.getElementById('receiptModal');
  if (!modal) return;
  // Only hide print/close buttons in the print window, not main app
  const printContents = modal.querySelector('.modal-content').innerHTML;
  const win = window.open('', '', 'width=600,height=700');
  win.document.write('<html><head><title>Print Receipt</title>');
  win.document.write('<link rel="stylesheet" href="css/style.css">');
  win.document.write('</head><body style="background:#fff;">');
  win.document.write('<div style="max-width:420px;margin:60px auto;">' + printContents + '</div>');
  win.document.write('</body></html>');
  win.document.close();
  win.focus();
  win.print();
  win.close();
  // Automatically close the receipt modal after printing
  closeReceiptModal();
}
// Global variable to track current selected room
let currentRoom = null;
let selectedGuest = null;

// Helper function to get maintenance rooms array
function getMaintenanceRooms() {
  try {
    return JSON.parse(localStorage.getItem('maintenanceRooms') || '[]');
  } catch (e) {
    console.error('failed to parse maintenanceRooms', e);
    return [];
  }
}

// Helper function to save maintenance rooms
function saveMaintenanceRooms(rooms) {
  localStorage.setItem('maintenanceRooms', JSON.stringify(rooms));
}

function renderStatus(bookings) {
  const now = new Date();
  const byRoom = {};
  const maintenanceRooms = getMaintenanceRooms();

  bookings.forEach(b => {
    if (!b.room) return;
    if (!byRoom[b.room]) byRoom[b.room] = [];
    byRoom[b.room].push(b);
  });

  // compute status map for each room seen in bookings
  const statusMap = {};
  Object.keys(byRoom).forEach(room => {
    const recs = byRoom[room];
    let last = recs.reduce((a, c) => {
      const da = new Date(a.checkIn);
      const dc = new Date(c.checkIn);
      return da > dc ? a : c;
    });
    const checkout = new Date(last.checkOut);
    const diffMs = now - checkout;
    let status = 'empty';
    if (now < checkout) {
      status = 'occupied';
    } else if (diffMs <= 24 * 60 * 60 * 1000) {
      status = 'recently checked out';
    }
    statusMap[room] = status;
  });

  // predetermined room numbers 1-17
  const rooms = [];
  for (let r = 1; r <= 17; r++) rooms.push(r.toString());

  // Room prices map
  const roomPrices = {
    '1': 3000,
    '2': 1000,
    '3': 1000,
    '4': 1000,
    '5': 1000,
    '6': 1000,
    '7': 1500,
    '8': 1000,
    '9': 2500,
    '10': 1000,
    '11': 1000,
    '12': 1000,
    '13': 1000,
    '14': 1000,
    '15': 1000,
    '16': 1500,
    '17': 5000
  };

  // count statuses
  const counts = { vacant: 0, occupied: 0, cleaning: 0, maintenance: 0 };
  rooms.forEach(room => {
    if (maintenanceRooms.includes(room)) {
      counts.maintenance++;
    } else {
      const status = statusMap[room] || 'empty';
      if (status === 'empty') counts.vacant++;
      else if (status === 'occupied') counts.occupied++;
      else if (status === 'recently checked out') counts.cleaning++;
    }
  });

  // build summary cards
  const summaryHtml = `
    <div class="summary-card vacant">
      <h4>Available</h4>
      <div class="count">${counts.vacant}</div>
    </div>
    <div class="summary-card occupied">
      <h4>Occupied</h4>
      <div class="count">${counts.occupied}</div>
    </div>
    <div class="summary-card cleaning">
      <h4>Needs Cleaning</h4>
      <div class="count">${counts.cleaning}</div>
    </div>
    <div class="summary-card maintenance">
      <h4>Maintenance</h4>
      <div class="count">${counts.maintenance}</div>
    </div>
  `;
  document.getElementById('summaryCards').innerHTML = summaryHtml;

  // build card markup
  const cards = rooms.map(room => {
    let cls, status, title;
    if (maintenanceRooms.includes(room)) {
      cls = 'maintenance';
      status = 'maintenance';
      title = 'Under Maintenance';
    } else {
      status = statusMap[room] || 'empty';
      cls = status.replace(/ /g, '-');
      title = status;
    }
    // show room number and price
    const price = roomPrices[room] ? `<div style='font-size:0.95em;color:#374151;margin-top:6px;'>Ksh ${roomPrices[room].toLocaleString()}</div>` : '';
    return `<div class="room-card ${cls}" data-room="${room}" onclick="openRoomModal('${room}')" title="${title}">
      <div>Room ${room}</div>
      ${price}
    </div>`;
  });

  return `<div id="roomGrid">${cards.join('')}</div>`;
}

function loadStatus() {
  let bookings = [];
  try {
    bookings = JSON.parse(localStorage.getItem('motelBookings') || '[]');
  } catch (e) {
    console.error('failed to parse motelBookings', e);
  }
  const container = document.getElementById('statusContent');
  container.innerHTML = renderStatus(bookings);
}

// Modal functions
function openRoomModal(room) {
  currentRoom = room;
  let bookings = [];
  try {
    bookings = JSON.parse(localStorage.getItem('motelBookings') || '[]');
  } catch (e) {
    console.error('failed to parse motelBookings', e);
  }

  const maintenanceRooms = getMaintenanceRooms();
  const isUnderMaintenance = maintenanceRooms.includes(room);

  // Get room status
  const now = new Date();
  const roomBookings = bookings.filter(b => b.room === room);
  let status = 'Empty';
  
  if (isUnderMaintenance) {
    status = 'Under Maintenance';
  } else if (roomBookings.length > 0) {
    const lastBooking = roomBookings.reduce((a, c) => {
      const da = new Date(a.checkIn);
      const dc = new Date(c.checkIn);
      return da > dc ? a : c;
    });
    const checkout = new Date(lastBooking.checkOut);
    
    if (now < checkout) {
      status = 'Occupied';
    } else if (now - checkout <= 24 * 60 * 60 * 1000) {
      status = 'Recently Checked Out (Needs Cleaning)';
    } else {
      status = 'Empty';
    }
  }

  document.getElementById('roomNumber').textContent = `Room ${room}`;
  document.getElementById('roomCurrentStatus').textContent = `Current Status: ${status}`;
  
  // button references
  const checkinBtn = document.getElementById('btnCheckin');
  const checkoutBtn = document.getElementById('btnCheckout');
  const cleaningBtn = document.getElementById('btnCleaning');
  const maintenanceBtn = document.getElementById('btnMaintenance');
  const clearBtn = document.getElementById('clearMaintenanceBtn');

  // default hide all then decide
  [checkinBtn, checkoutBtn, cleaningBtn, maintenanceBtn, clearBtn].forEach(b => {
    if (b) b.style.display = 'none';
  });

  if (isUnderMaintenance) {
    clearBtn.style.display = 'block';
  } else {
    // not under maintenance
    if (status === 'Occupied') {
      checkoutBtn.style.display = 'block';
    } else if (status.startsWith('Recently Checked Out')) {
      cleaningBtn.style.display = 'block';
      maintenanceBtn.style.display = 'block';
    } else if (status === 'Empty') {
      checkinBtn.style.display = 'block';
      maintenanceBtn.style.display = 'block';
    } else {
      // fallback show checkin + maintenance
      checkinBtn.style.display = 'block';
      maintenanceBtn.style.display = 'block';
    }
  }
  
  document.getElementById('roomModal').style.display = 'flex';
}

function closeRoomModal() {
  document.getElementById('roomModal').style.display = 'none';
  currentRoom = null;
}

function showCheckInForm() {
  // Show guest search first so user can pick an existing guest or add new
  if (!currentRoom) return;
  showGuestSearch();
}

// -------------------- Guest storage + search --------------------
function getSavedGuests() {
  try {
    return JSON.parse(localStorage.getItem('motelGuests') || '[]');
  } catch (e) {
    console.error('failed to parse motelGuests', e);
    return [];
  }
}

function saveGuestRecord(g) {
  if (!g || !g.name) return;
  const guests = getSavedGuests();
  const exists = guests.find(x => x.name.toLowerCase() === g.name.toLowerCase() && x.idNumber === g.idNumber);
  if (!exists) {
    guests.push(g);
    localStorage.setItem('motelGuests', JSON.stringify(guests));
  }
}

function findGuestsByName(q) {
  if (!q) return [];
  const guests = getSavedGuests();
  q = q.toLowerCase();
  return guests.filter(g => g.name.toLowerCase().includes(q));
}

function showGuestSearch() {
  const modal = document.getElementById('guestSearchModal');
  const input = document.getElementById('guestSearchInput');
  const results = document.getElementById('guestSearchResults');
  if (!modal || !input || !results) return;
  modal.style.display = 'flex';
  input.value = '';
  results.innerHTML = '<div style="color:#888">Type a name to search previous guests...</div>';
  input.focus();

  input.onkeyup = () => {
    const q = input.value.trim();
    const found = findGuestsByName(q);
    if (!q) {
      results.innerHTML = '<div style="color:#888">Type a name to search previous guests...</div>';
      return;
    }
    if (found.length === 0) {
      results.innerHTML = `<div style="padding:8px;color:#374151;">No previous guest found for "${q}".</div>`;
      return;
    }
      // Render as simple clickable divs, no button styling
      results.innerHTML = found.map((g, idx) => `
        <div class="guest-result" data-idx="${idx}" style="padding:10px 8px;cursor:pointer;border-bottom:1px solid #f3f4f6;">
          <strong>${escapeHtml(g.name)}</strong><span style="color:#666;font-size:0.95em;">${g.phone ? ' • ' + escapeHtml(g.phone) : ''}${g.idNumber ? ' • ' + escapeHtml(g.idNumber) : ''}</span>
        </div>
      `).join('');
      // Add event listeners for each result
      Array.from(results.getElementsByClassName('guest-result')).forEach((el) => {
        el.onclick = function() {
          const idx = parseInt(el.getAttribute('data-idx'));
          const guest = found[idx];
          selectGuest(JSON.stringify(JSON.stringify(guest)));
        };
      });
  };
}

function closeGuestSearch() {
  const modal = document.getElementById('guestSearchModal');
  const input = document.getElementById('guestSearchInput');
  const results = document.getElementById('guestSearchResults');
  if (input) {
    input.onkeyup = null;
    input.value = '';
    input.blur();
  }
  if (results) results.innerHTML = '';
  if (modal) modal.style.display = 'none';
}

// called from dynamically created result onclick; gStr is JSON-stringified twice to safely pass through onclick
function selectGuest(gStr) {
  try {
    const g = JSON.parse(JSON.parse(gStr));
    // close search UI first, then open check-in form so the floating box does not overlay
    closeGuestSearch();
    window.setTimeout(() => openCheckInFormWithGuest(g), 120);
  } catch (e) {
    console.error('failed selectGuest parse', e);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"]+/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}

function openCheckInFormWithGuest(guest) {
  // Ensure guest search is closed first so it doesn't overlay the check-in form
  try {
    closeGuestSearch();
  } catch (e) {
    console.warn('closeGuestSearch failed', e);
  }

  // small delay to allow guest search to hide, then open check-in form on top
  window.setTimeout(() => {
    // Initialize the check-in form with today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateString = today.toISOString().split('T')[0];

    document.getElementById('checkInRoomNumber').textContent = `Room ${currentRoom}`;
    // Set room price field
    const roomPrices = {
      '1': 3000, '2': 1000, '3': 1000, '4': 1000, '5': 1000, '6': 1000,
      '7': 1500, '8': 1000, '9': 2500, '10': 1000, '11': 1000, '12': 1000,
      '13': 1000, '14': 1000, '15': 1000, '16': 1500, '17': 5000
    };
    const priceField = document.getElementById('roomPrice');
    if (priceField) priceField.value = `Ksh ${roomPrices[currentRoom] ? roomPrices[currentRoom].toLocaleString() : ''}`;
    document.getElementById('checkInDate').value = dateString;
    document.getElementById('checkInDate').setAttribute('min', dateString);
    document.getElementById('numberOfNights').value = '1';
    updateCheckOutDate();

    if (guest) {
      document.getElementById('guestName').value = guest.name || '';
      document.getElementById('guestPhone').value = guest.phone || '';
      document.getElementById('guestID').value = guest.idNumber || '';
      selectedGuest = guest;
      // Show quick check-in button
      const quickBtn = document.getElementById('quickCheckinBtn');
      if (quickBtn) quickBtn.style.display = 'inline-block';
    } else {
      document.getElementById('guestName').value = '';
      document.getElementById('guestPhone').value = '';
      document.getElementById('guestID').value = '';
      selectedGuest = null;
      // Hide quick check-in button
      const quickBtn = document.getElementById('quickCheckinBtn');
      if (quickBtn) quickBtn.style.display = 'none';
    }

    const checkInModal = document.getElementById('checkInModal');
    if (checkInModal) {
      checkInModal.style.zIndex = 1101;
      checkInModal.style.display = 'flex';
    }
    // ensure guest search overlay is hidden
    const gs = document.getElementById('guestSearchModal');
    if (gs) gs.style.display = 'none';
  }, 120);
}

function quickCheckIn() {
  // Use selectedGuest and current form values for room/number of nights
  if (!selectedGuest || !currentRoom) return;
  const guestName = selectedGuest.name;
  const guestPhone = selectedGuest.phone;
  const guestID = selectedGuest.idNumber;
  const checkOutDateStr = document.getElementById('checkOutDate').value;

  // Parse dates
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const checkInDate = now;
  let checkOutDate = new Date(checkOutDateStr);
  checkOutDate.setHours(0, 0, 0, 0);
  if (checkOutDate <= checkInDate) {
    checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + 1);
  }

  const roomPrices = {
    '1': 3000, '2': 1000, '3': 1000, '4': 1000, '5': 1000, '6': 1000,
    '7': 1500, '8': 1000, '9': 2500, '10': 1000, '11': 1000, '12': 1000,
    '13': 1000, '14': 1000, '15': 1000, '16': 1500, '17': 5000
  };
  const roomPrice = roomPrices[currentRoom] || 0;
  const nights = Math.max(1, parseInt(document.getElementById('numberOfNights').value) || 1);
  const newBooking = {
    room: currentRoom,
    checkIn: checkInDate.toISOString(),
    checkOut: checkOutDate.toISOString(),
    guestName: guestName,
    phone: guestPhone,
    idNumber: guestID,
    price: roomPrice,
    nights: nights,
    notes: 'Quick check-in for existing guest'
  };

  let bookings = [];
  try {
    bookings = JSON.parse(localStorage.getItem('motelBookings') || '[]');
  } catch (e) {
    console.error('failed to parse motelBookings', e);
  }

  bookings.push(newBooking);
  localStorage.setItem('motelBookings', JSON.stringify(bookings));
  saveGuestRecord({ name: guestName, phone: guestPhone, idNumber: guestID });

  loadStatus();
  closeRoomModal();
  closeCheckInForm();
  showReceiptModal(newBooking);
}

function closeCheckInForm() {
  document.getElementById('checkInModal').style.display = 'none';
  selectedGuest = null;
}

function updateCheckOutDate() {
  const checkInDateEl = document.getElementById('checkInDate');
  const numberOfNightsEl = document.getElementById('numberOfNights');
  const checkOutDateEl = document.getElementById('checkOutDate');
  
  if (!checkInDateEl.value || !numberOfNightsEl.value) return;
  
  const checkInDate = new Date(checkInDateEl.value);
  const nights = parseInt(numberOfNightsEl.value) || 1;
  
  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + nights);
  
  const dateString = checkOutDate.toISOString().split('T')[0];
  checkOutDateEl.value = dateString;
}

function submitCheckIn() {
  const guestName = document.getElementById('guestName').value.trim();
  const guestPhone = document.getElementById('guestPhone').value.trim();
  const guestID = document.getElementById('guestID').value.trim();
  const checkOutDateStr = document.getElementById('checkOutDate').value;
  
  // Validation
  if (!guestName) {
    alert('Please enter guest name');
    return;
  }
  if (!guestPhone) {
    alert('Please enter phone number');
    return;
  }
  if (!guestID) {
    alert('Please enter ID number');
    return;
  }
  
  // Parse dates
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const checkInDate = now;
  
  let checkOutDate = new Date(checkOutDateStr);
  checkOutDate.setHours(0, 0, 0, 0);
  // ensure checkout is after checkin (at least one night)
  if (checkOutDate <= checkInDate) {
    checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + 1);
  }
  
  const roomPrices = {
    '1': 3000, '2': 1000, '3': 1000, '4': 1000, '5': 1000, '6': 1000,
    '7': 1500, '8': 1000, '9': 2500, '10': 1000, '11': 1000, '12': 1000,
    '13': 1000, '14': 1000, '15': 1000, '16': 1500, '17': 5000
  };
  const roomPrice = roomPrices[currentRoom] || 0;
  const nights = Math.max(1, parseInt(document.getElementById('numberOfNights').value) || 1);
  const newBooking = {
    room: currentRoom,
    checkIn: checkInDate.toISOString(),
    checkOut: checkOutDate.toISOString(),
    guestName: guestName,
    phone: guestPhone,
    idNumber: guestID,
    price: roomPrice,
    nights: nights,
    notes: 'Checked in from room status page'
  };

  let bookings = [];
  try {
    bookings = JSON.parse(localStorage.getItem('motelBookings') || '[]');
  } catch (e) {
    console.error('failed to parse motelBookings', e);
  }

  bookings.push(newBooking);
  localStorage.setItem('motelBookings', JSON.stringify(bookings));
  // Save guest details to motelGuests (dummy front-end storage)
  saveGuestRecord({ name: guestName, phone: guestPhone, idNumber: guestID });
  
  loadStatus();
  closeRoomModal();
  closeCheckInForm();
  showReceiptModal(newBooking);
}

function checkOut() {
  if (!currentRoom) return;

  let bookings = [];
  try {
    bookings = JSON.parse(localStorage.getItem('motelBookings') || '[]');
  } catch (e) {
    console.error('failed to parse motelBookings', e);
  }

  // Find the latest booking for this room and mark as checked out
  const roomBookings = bookings.filter(b => b.room === currentRoom);
  if (roomBookings.length > 0) {
    const lastBooking = roomBookings.reduce((a, c) => {
      const da = new Date(a.checkIn);
      const dc = new Date(c.checkIn);
      return da > dc ? a : c;
    });

    // Set checkout to now and mark as checked out
    const now = new Date();
    lastBooking.checkOut = now.toISOString();
    lastBooking.checkedOut = true;

    localStorage.setItem('motelBookings', JSON.stringify(bookings));

    loadStatus();
    showDueCheckouts();
    closeRoomModal();
    alert(`Room ${currentRoom} checked out successfully!`);
  } else {
    alert(`No active booking found for room ${currentRoom}`);
  }
}

function markCleaned() {
  if (!currentRoom) return;

  let bookings = [];
  try {
    bookings = JSON.parse(localStorage.getItem('motelBookings') || '[]');
  } catch (e) {
    console.error('failed to parse motelBookings', e);
  }

  // Find the latest booking for this room and mark checkout as more than 24 hours ago
  const roomBookings = bookings.filter(b => b.room === currentRoom);
  if (roomBookings.length > 0) {
    const lastBooking = roomBookings.reduce((a, c) => {
      const da = new Date(a.checkIn);
      const dc = new Date(c.checkIn);
      return da > dc ? a : c;
    });

    // Set checkout to 25 hours ago to remove from orange "needs cleaning" status
    const now = new Date();
    const cleanedTime = new Date(now.getTime() - (25 * 60 * 60 * 1000));
    lastBooking.checkOut = cleanedTime.toISOString();
    
    localStorage.setItem('motelBookings', JSON.stringify(bookings));
    
    loadStatus();
    closeRoomModal();
    alert(`Room ${currentRoom} marked as cleaned!`);
  } else {
    alert(`No booking found for room ${currentRoom}`);
  }
}

function markForMaintenance() {
  if (!currentRoom) return;

  let maintenanceRooms = getMaintenanceRooms();
  
  // Add room to maintenance list if not already there
  if (!maintenanceRooms.includes(currentRoom)) {
    maintenanceRooms.push(currentRoom);
    saveMaintenanceRooms(maintenanceRooms);
    
    loadStatus();
    closeRoomModal();
    alert(`Room ${currentRoom} marked for maintenance!`);
  } else {
    alert(`Room ${currentRoom} is already under maintenance`);
  }
}

function clearMaintenance() {
  if (!currentRoom) return;

  let maintenanceRooms = getMaintenanceRooms();
  
  // Remove room from maintenance list
  maintenanceRooms = maintenanceRooms.filter(room => room !== currentRoom);
  saveMaintenanceRooms(maintenanceRooms);
  
  loadStatus();
  closeRoomModal();
  alert(`Room ${currentRoom} maintenance cleared!`);
}

// Close modal when clicking outside of it
window.addEventListener('click', (e) => {
  const modal = document.getElementById('roomModal');
  if (e.target === modal) {
    closeRoomModal();
  }
  const checkInModal = document.getElementById('checkInModal');
  if (e.target === checkInModal) {
    closeCheckInForm();
  }
});

// Add event listeners for check-in form inputs
window.addEventListener('DOMContentLoaded', () => {
    // Attach event listener for clear due checkouts button
    const clearBtn = document.getElementById('clearDueCheckoutsBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearAllDueCheckouts);
    }
  // Setup check-in form event listeners
  const numberOfNightsEl = document.getElementById('numberOfNights');
  if (numberOfNightsEl) {
    numberOfNightsEl.addEventListener('change', updateCheckOutDate);
    numberOfNightsEl.addEventListener('input', updateCheckOutDate);
  }
  
  const checkInDateEl = document.getElementById('checkInDate');
  if (checkInDateEl) {
    checkInDateEl.addEventListener('change', updateCheckOutDate);
  }
  
  const role = localStorage.getItem('role');
  if (!(role === 'motel' || role === 'hub')) {
    window.location = 'index.html';
    return;
  }
  loadStatus();

    // Show due checkouts on page load
    showDueCheckouts();
});

// if another tab updates bookings, refresh the view
window.addEventListener('storage', (e) => {
  if (e.key === 'motelBookings') {
    loadStatus();
      showDueCheckouts();
  }
});

  // Show due checkouts in the section at the bottom
  function showDueCheckouts() {
    let bookings = [];
    try {
      bookings = JSON.parse(localStorage.getItem('motelBookings') || '[]');
    } catch (e) {
      console.error('failed to parse motelBookings', e);
    }
    const now = new Date();
    // Find bookings where checkout date/time has passed and not checked out
    const due = bookings.filter(b => {
      // Only show if booking has valid guest info, check-in, and check-out
      if (!b.checkOut || !b.checkIn || !b.room || !b.guestName || typeof b.guestName !== 'string' || b.guestName.trim().length < 2) return false;
      if (b.checkedOut) return false;
      // Ignore bookings with check-in in the future
      const ci = new Date(b.checkIn);
      if (ci > now) return false;
      const co = new Date(b.checkOut);
      // Only show if checkout is before now and within last 24h (not cleaned yet)
      return co <= now && (now - co <= 24 * 60 * 60 * 1000);
    });
    const container = document.getElementById('dueCheckoutsList');
    if (!container) return;
    if (due.length === 0) {
      container.innerHTML = '<span style="color:#888">No due checkouts at this time.</span>';
      return;
    }
    container.innerHTML = due.map(b => `
      <div style="padding:10px 0;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <strong>${escapeHtml(b.guestName)}</strong> <span style="color:#666;font-size:0.97em;">(${escapeHtml(b.room)})</span><br>
          <span style="color:#b91c1c;font-size:0.97em;">Due checkout: ${new Date(b.checkOut).toLocaleString()}</span>
        </div>
        <button class="action-btn" style="background:var(--color-danger);color:var(--color-white);padding:4px 14px;border-radius:6px;font-size:0.97em;" onclick="openRoomModal('${b.room}')">View Room</button>
      </div>
    `).join('');
  }