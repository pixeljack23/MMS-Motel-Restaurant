function formatCurrency(n){ return (typeof n === 'number')? n.toFixed(2) : n; }

function renderReceipt(){
  const raw = localStorage.getItem('latestReceipt');
  if(!raw){
    document.getElementById('receiptBody').innerHTML = '<p>No receipt found.</p>';
    return;
  }
  const r = JSON.parse(raw);
  document.getElementById('r_id').innerText = r.id || '';
  document.getElementById('r_date').innerText = (r.timestamp)? new Date(r.timestamp).toLocaleString() : '';

  const root = document.getElementById('receiptBody');
  root.innerHTML = '';

  if(r.type === 'restaurant'){
    const info = document.createElement('div');
    info.innerHTML = `
      <p class="muted">Payment: ${r.paymentMethod}</p>
      <p class="muted">Cashier: ${r.cashier || 'Cashier'}</p>
    `;
    root.appendChild(info);

    const table = document.createElement('table');
    table.innerHTML = `
      <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');
    r.items.forEach(it => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${it.name}</td><td>${it.quantity}</td><td>${formatCurrency(it.price)}</td><td>${formatCurrency(it.price * it.quantity)}</td>`;
      tbody.appendChild(tr);
    });
    root.appendChild(table);

    const summary = document.createElement('div');
    summary.innerHTML = `
      <p class="muted">Subtotal: Ksh ${formatCurrency(r.subtotal)}</p>
      <p class="muted">VAT: Ksh ${formatCurrency(r.vat)}</p>
      <h3>Total: Ksh ${formatCurrency(r.grandTotal)}</h3>
    `;
    root.appendChild(summary);
  } else if(r.type === 'motel'){
    const info = document.createElement('div');
    info.innerHTML = `
      <p>Guest: ${r.guest}</p>
      <p>Phone: ${r.phone}</p>
      <p>Room: ${r.room}</p>
      <p>Check-in: ${r.checkIn}</p>
      <p>Check-out: ${r.checkOut}</p>
      <p>Nights: ${r.nights}</p>
      <p>Room price: Ksh ${formatCurrency(r.roomPrice)}</p>
      <h3>Total: Ksh ${formatCurrency(r.total)}</h3>
      <p class="muted">Payment: ${r.paymentMethod}</p>
      <p class="muted">Cashier: ${r.cashier || 'Cashier'}</p>
    `;
    root.appendChild(info);
  } else {
    root.innerHTML = '<p>Unsupported receipt type.</p>';
  }
}

function initReceiptPage(){
  renderReceipt();
  document.getElementById('printBtn').addEventListener('click', ()=>{
    window.print();
  });
  document.getElementById('backBtn').addEventListener('click', ()=>{
    // navigate back to home
    window.location.href = 'index.html';
  });
}

window.addEventListener('DOMContentLoaded', initReceiptPage);
