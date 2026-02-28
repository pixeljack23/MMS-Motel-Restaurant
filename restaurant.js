let cart = [];

// EXACT MENU FROM YOUR IMAGE
const menu = [
    // BREAKFAST
    { id: 1, name: "Tea (Pot)", price: 100, category: "Breakfast" },
    { id: 2, name: "2 Fried Eggs", price: 120, category: "Breakfast" },
    { id: 3, name: "Sausage", price: 70, category: "Breakfast" },
    { id: 4, name: "Chapati", price: 40, category: "Breakfast" },
    { id: 5, name: "Pancake", price: 50, category: "Breakfast" },
    { id: 6, name: "Toast & Tea", price: 100, category: "Breakfast" },
    { id: 7, name: "Tea + Toast + 2 Eggs", price: 250, category: "Breakfast" },
    { id: 8, name: "Tea + Chapati", price: 200, category: "Breakfast" },
    { id: 9, name: "Tea + 2 Pancakes", price: 250, category: "Breakfast" },
    { id: 10, name: "Two Fried Eggs", price: 100, category: "Breakfast" },
    { id: 11, name: "Omelette", price: 120, category: "Breakfast" },

    // MAIN MEALS
    { id: 12, name: "Beef with Rice", price: 400, category: "Main Meals" },
    { id: 13, name: "Beef with Ugali", price: 400, category: "Main Meals" },
    { id: 14, name: "Beef with Chapati", price: 400, category: "Main Meals" },
    { id: 15, name: "Chicken with Chapati", price: 500, category: "Main Meals" },
    { id: 16, name: "Chicken with Rice", price: 500, category: "Main Meals" },
    { id: 17, name: "Chicken with Ugali", price: 500, category: "Main Meals" }
];

document.addEventListener("DOMContentLoaded", renderMenu);

function renderMenu() {
    const container = document.getElementById("menuList");
    container.innerHTML = "";

    const categories = ["Breakfast", "Main Meals"];

    categories.forEach(category => {
        const title = document.createElement("div");
        title.className = "category-title";
        title.innerText = category;
        container.appendChild(title);

        // gather items in this category
        let items = menu.filter(item => item.category === category);
        // sort breakfast alphabetically for presentation
        if (category === "Breakfast") {
            items.sort((a,b)=>a.name.localeCompare(b.name));
        }
        // for Main Meals, put beef dishes first so they appear directly below heading
        if (category === "Main Meals") {
            items.sort((a,b) => {
                const aBeef = a.name.toLowerCase().includes('beef');
                const bBeef = b.name.toLowerCase().includes('beef');
                if (aBeef && !bBeef) return -1;
                if (bBeef && !aBeef) return 1;
                return 0;
            });
        }

        items.forEach(item => {
            const div = document.createElement("div");
            // use card styling for menu items
            div.className = "menu-item card";
            div.innerHTML = `
                    <h4>${item.name}</h4>
                    <p>Ksh ${item.price}</p>
                `;
            div.onclick = () => addToCart(item);
            container.appendChild(div);
        });
    });
}

function addToCart(item) {
    const existing = cart.find(i => i.id === item.id);

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1
        });
    }

    renderCart();
}

function renderCart() {
    const body = document.getElementById("cartBody");
    body.innerHTML = "";

    let subtotal = 0;

    cart.forEach(item => {
        const total = item.price * item.quantity;
        subtotal += total;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.name}</td>
            <td>
                <button onclick="decreaseQty(${item.id})">-</button>
                ${item.quantity}
                <button onclick="increaseQty(${item.id})">+</button>
            </td>
            <td>${item.price}</td>
            <td>${total}</td>
            <td><button onclick="removeItem(${item.id})">X</button></td>
        `;

        body.appendChild(row);
    });

    const vat = subtotal * 0.16;
    const grandTotal = subtotal + vat;

    document.getElementById("subtotal").innerText = subtotal.toFixed(2);
    document.getElementById("vat").innerText = vat.toFixed(2);
    document.getElementById("grandTotal").innerText = grandTotal.toFixed(2);
}

function increaseQty(id) {
    const item = cart.find(i => i.id === id);
    item.quantity++;
    renderCart();
}

function decreaseQty(id) {
    const item = cart.find(i => i.id === id);
    if (item.quantity > 1) item.quantity--;
    renderCart();
}

function removeItem(id) {
    cart = cart.filter(i => i.id !== id);
    renderCart();
}

function clearCart() {
    cart = [];
    renderCart();
}

function submitOrder() {
    if (cart.length === 0) {
        alert("Cart is empty");
        return;
    }

    const paymentMethod = document.getElementById("paymentMethod").value;

    // Build receipt object and save to localStorage so receipt.html can render it
    const subtotal = parseFloat(document.getElementById("subtotal").innerText) || 0;
    const vat = parseFloat(document.getElementById("vat").innerText) || 0;
    const grandTotal = parseFloat(document.getElementById("grandTotal").innerText) || 0;

    const receipt = {
        id: 'R' + Date.now(),
        type: 'restaurant',
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        subtotal,
        vat,
        grandTotal,
        paymentMethod,
        timestamp: new Date().toISOString(),
        cashier: localStorage.getItem('username') || localStorage.getItem('name') || localStorage.getItem('role') || 'Cashier'
    };

    localStorage.setItem('latestReceipt', JSON.stringify(receipt));

    // clear cart UI and redirect to receipt page for download/print
    clearCart();
    window.location.href = 'receipt.html';
}