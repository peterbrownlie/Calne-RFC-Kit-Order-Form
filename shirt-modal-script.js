let currentCustomItem = null;

// Called from addToBasket() if item is a Playing Shirt
function promptShirtCustomisation(item) {
  currentCustomItem = item;
  document.getElementById("shirtModal").style.display = "block";
  document.getElementById("shirtNumber").value = "";
  document.getElementById("shirtName").value = "";
}

function saveShirtDetails() {
  const number = document.getElementById("shirtNumber").value.trim().toUpperCase();
  const name = document.getElementById("shirtName").value.trim().toUpperCase();

  if (!number || !name) {
    alert("Please enter both number and name.");
    return;
  }

  currentCustomItem.shirtNumber = number;
  currentCustomItem.shirtName = name;
  currentCustomItem.subtotal = currentCustomItem.qty * currentCustomItem.price;

  basketItems.push(currentCustomItem);
  renderBasket();
  currentCustomItem = null;

  closeModal();
}

function closeModal() {
  document.getElementById("shirtModal").style.display = "none";
}

// Called from addToBasket() if item is After-Match Shirt or Playing Shorts
function promptInitialsCustomisation(item) {
  currentCustomItem = item;
  document.getElementById("initialsModal").style.display = "block";
  document.getElementById("itemInitials").value = "";
}

function saveInitialsDetails() {
  const initials = document.getElementById("itemInitials").value.trim().toUpperCase();
  if (initials) {
    currentCustomItem.initials = initials;
  }

  currentCustomItem.subtotal = currentCustomItem.qty * currentCustomItem.price;
  basketItems.push(currentCustomItem);
  renderBasket();

  currentCustomItem = null;
  closeInitialsModal();
}

function closeInitialsModal() {
  document.getElementById("initialsModal").style.display = "none";
}
