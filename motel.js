function parseDateISO(s){
  try{ return new Date(s); }catch(e){return null}
}

// fixed room pricing
const DEFAULT_ROOM_PRICE = 2000; // change as needed
const ALL_ROOMS = Array.from({length: 16}, (_,i)=> (200 + i).toString());

function getBookings() {
  try { return JSON.parse(localStorage.getItem('motelBookings') || '[]'); }
  catch { return []; }
}

function populateRoomSelector() {
  const select = document.getElementById('roomSelect');
  const now = new Date();
  const bookings = getBookings();
  // compute occupied set (checkout in future)
  const occupied = new Set();
  bookings.forEach(b => {
    if (!b.room) return;
    const co = new Date(b.checkOut);
    if (now < co) occupied.add(b.room);
  });
  select.innerHTML = '';
  ALL_ROOMS.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.text = r;
    if (occupied.has(r)) {
      opt.disabled = true;
      opt.text += ' (occupied)';
    }
    select.appendChild(opt);
  });
}

function populateCheckOutSelector() {
  const select = document.getElementById('checkOutRoom');
  const now = new Date();
  const bookings = getBookings();
  // build list of rooms currently occupied
  const occupied = {};
  bookings.forEach(b => {
    if (!b.room) return;
    const co = new Date(b.checkOut);
    if (now < co) {
      occupied[b.room] = b;
    }
  });
  select.innerHTML = '';
  Object.keys(occupied).forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.text = r + ' - ' + (occupied[r].guest || 'No name');
    select.appendChild(opt);
  });
  if (Object.keys(occupied).length === 0) {
    const opt = document.createElement('option');
    opt.text = 'No occupied rooms';
    opt.disabled = true;
    select.appendChild(opt);
  }
}


function diffNights(startISO, endISO){
  const a = parseDateISO(startISO);
  const b = parseDateISO(endISO);
  if(!a || !b || isNaN(a)||isNaN(b)) return 0;
  const diff = Math.max(0, Math.ceil((b - a) / (1000 * 60 * 60 * 24)));
  return diff || 1; // at least 1 night
}

function checkIn(){
  const guest = document.getElementById('guestName').value || '';
  const phone = document.getElementById('phone').value || '';
  const room = document.getElementById('roomSelect').value || '';
  const roomPrice = DEFAULT_ROOM_PRICE;
  const inAt = document.getElementById('checkIn').value || '';
  const outAt = document.getElementById('checkOut').value || '';
  const paymentMethod = document.getElementById('paymentMethod').value || 'Cash';

  const nights = diffNights(inAt, outAt);
  const total = +(nights * roomPrice).toFixed(2);

  const receipt = {
    id: 'M' + Date.now(),
    type: 'motel',
    guest,
    phone,
    room,
    checkIn: inAt,
    checkOut: outAt,
    nights,
    roomPrice,
    total,
    paymentMethod,
    timestamp: new Date().toISOString(),
    cashier: localStorage.getItem('username') || localStorage.getItem('name') || localStorage.getItem('role') || 'Cashier'
  };

  localStorage.setItem('latestReceipt', JSON.stringify(receipt));

  // keep a list of motel bookings for status tracking
  try {
    const list = JSON.parse(localStorage.getItem('motelBookings') || '[]');
    list.push(receipt);
    localStorage.setItem('motelBookings', JSON.stringify(list));
  } catch (e) {
    console.error('failed to update motelBookings', e);
  }

  // after booking update both selectors
  populateRoomSelector();
  populateCheckOutSelector();

  // redirect to receipt for printing/downloading
  window.location.href = 'receipt.html';
}

function checkOutGuest() {
  const roomId = document.getElementById('checkOutRoom').value || '';
  if (!roomId) {
    alert('Please select a room');
    return;
  }

  const bookings = getBookings();
  const now = new Date();
  let updated = false;

  // find and update the active booking for this room
  bookings.forEach(b => {
    if (b.room === roomId) {
      const co = new Date(b.checkOut);
      if (now < co) {
        // this is the active booking; mark as checked out now
        b.checkOut = now.toISOString();
        updated = true;
      }
    }
  });

  if (!updated) {
    alert('No active booking found for this room');
    return;
  }

  try {
    localStorage.setItem('motelBookings', JSON.stringify(bookings));
  } catch (e) {
    console.error('failed to update motelBookings', e);
    return;
  }

  // after booking check-out, update checkout selector and trigger refreshes
  populateRoomSelector();
  populateCheckOutSelector();

  // trigger storage event for other tabs
  window.dispatchEvent(new Event('storage'));

  alert('Guest checked out from room ' + roomId);
}

function showCheckInForm() {
  document.getElementById('checkInSection').style.display = 'block';
  document.getElementById('checkOutSection').style.display = 'none';
}

function showCheckOutForm() {
  document.getElementById('checkInSection').style.display = 'none';
  document.getElementById('checkOutSection').style.display = 'block';
  populateCheckOutSelector();
}

function initMoelCards() {
  const grid = document.getElementById('motelGrid');
  
  const checkInCard = document.createElement('a');
  checkInCard.className = 'motel-card checkin';
  checkInCard.href = '#';
  checkInCard.innerText = 'Check In';
  checkInCard.onclick = (e) => { e.preventDefault(); showCheckInForm(); };
  grid.appendChild(checkInCard);

  const checkOutCard = document.createElement('a');
  checkOutCard.className = 'motel-card checkout';
  checkOutCard.href = '#';
  checkOutCard.innerText = 'Check Out';
  checkOutCard.onclick = (e) => { e.preventDefault(); showCheckOutForm(); };
  grid.appendChild(checkOutCard);

  // show check-in form by default
  showCheckInForm();
}

// populate room list when the motel page loads
window.addEventListener('DOMContentLoaded', () => {
  initMoelCards();
  populateRoomSelector();
  populateCheckOutSelector();
});

function resetAllData() {
  if (confirm('Are you sure you want to reset all motel bookings? This cannot be undone.')) {
    try {
      localStorage.removeItem('motelBookings');
      alert('All booking data has been cleared. All rooms are now unoccupied.');
      // refresh the page to update selectors
      location.reload();
    } catch (e) {
      console.error('failed to reset motelBookings', e);
      alert('Error resetting data');
    }
  }
}