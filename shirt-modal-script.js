
// Show modal when specific shirts are added
function promptShirtCustomisation(itemName) {
  if (itemName.toLowerCase().includes("playing shirt")) {
    document.getElementById("shirtModal").style.display = "block";
    window.currentShirtItem = itemName;
  }
}

// Close modal
function closeModal() {
  document.getElementById("shirtModal").style.display = "none";
}

// Save entered details
function saveShirtDetails() {
  const number = document.getElementById("shirtNumber").value.trim();
  const name = document.getElementById("shirtName").value.trim();

  if (!number) {
    alert("Please enter a shirt number.");
    return;
  }

  const customisation = {
    number,
    name
  };

  console.log("Customisation for:", window.currentShirtItem, customisation);
  closeModal();
}

let currentCustomItem = null;

function promptInitialsCustomisation(itemName) {
  currentCustomItem = basketItems[basketItems.length - 1]; // last added
  document.getElementById("initialsModal").style.display = "block";
}

function closeInitialsModal() {
  document.getElementById("initialsModal").style.display = "none";
}

function saveInitialsDetails() {
  const initials = document.getElementById("itemInitials").value.trim();
  if (initials) {
    currentCustomItem.initials = initials;
  }
  document.getElementById("initialsModal").style.display = "none";
  actuallyAddToBasket(currentCustomItem);
  currentCustomItem = null;
}



