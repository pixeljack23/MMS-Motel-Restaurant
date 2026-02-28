// simple client-only PIN login
// recognizes three PINs mapped to roles
function login() {
    const pin = document.getElementById("pin").value.trim();
    let role = null;

    if (pin === "3333") role = "admin";
    else if (pin === "1111") role = "motel";
    else if (pin === "2222") role = "restaurant";
    else if (pin === "0000") role = "hub"; // test hub / european

    if (!role) {
        alert("Invalid PIN. Use 0000 (hub), 1111, 2222 or 3333.");
        return;
    }

    localStorage.setItem("role", role);
    localStorage.setItem("pin", pin);
    window.location = "status.html";
}

function logout() {
    localStorage.clear();
    window.location = "index.html";
}