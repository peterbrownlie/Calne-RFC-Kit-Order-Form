
	let currentSection = -1;
	const basketItems = [];	
	let kitAllowanceLimit;
	
	let kitAllowance = 0;
	let kitAllowanceUsed = false;

	// Get from URL or meta tag
	const params = new URLSearchParams(window.location.search);
	const urlAllowance = parseFloat(params.get("kitallowance"));

	if (!isNaN(urlAllowance)) {
		kitAllowanceLimit = urlAllowance;
	} else {
		kitAllowanceLimit = parseFloat(document.querySelector('meta[name="kit-allowance-limit"]').content);
	}

window.addEventListener('DOMContentLoaded', () => {
	const name = params.get('name');
	const email = params.get('email');
	const paymentStatus = params.get("payment");
	
	if (name) {
		document.getElementById('fullName').value = decodeURIComponent(name.replace(/\+/g, ' '));
	}
	
	if (email) {
		document.getElementById('email').value = decodeURIComponent(email);
	}

	const allowanceEls = document.querySelectorAll("#allowanceText, #allowanceTextRepeat");
	allowanceEls.forEach(el => {
		el.textContent = `£${kitAllowanceLimit}`;
	});
	
	if (paymentStatus === "success") {
		const alreadySubmitted = sessionStorage.getItem("hasSubmitted");
		const savedOrder = sessionStorage.getItem("orderData");

		if (alreadySubmitted || !savedOrder) {
			// Prevent duplicate or missing submission
			return;
		}

		const orderData = JSON.parse(savedOrder);

		submitToPowerAutomate(orderData).then((result) => {
		document.getElementById("processingOverlay").style.display = "none";

		if (result.success) {
				sessionStorage.setItem("hasSubmitted", "true");
				showSection("section-order-success");
			} else {
				showFailure(result.error || "Payment succeeded but order submission failed.");
			}
		});
	}
	
	if (paymentStatus === "cancel") {
		sessionStorage.removeItem("hasSubmitted");
		hideAllSections();
		document.getElementById("section-order-failure").style.display = "block";
		if (document.getElementById("basket-panel")) {
			document.getElementById("basket-panel").style.display = "none";
		}
	}
	
	const sections = document.querySelectorAll(".section:not(#start-screen):not(#section-submitted):not(#basket-panel):not(#section-order-success):not(#section-order-failure)");
	const total = sections.length;

	sections.forEach((section, index) => {
		const pageText = `Page ${index + 1} of ${total}`;

		// Insert at the top
		const topIndicator = document.createElement("div");
		topIndicator.className = "top-page-indicator";
		topIndicator.textContent = pageText;
		section.insertBefore(topIndicator, section.firstChild);

		// Append below navigation buttons
		const navButtons = section.querySelector(".button-nav-container");
		if (navButtons) {
		const bottomIndicator = document.createElement("div");
		bottomIndicator.className = "bottom-page-indicator";
		bottomIndicator.textContent = pageText;
		navButtons.appendChild(bottomIndicator);
		}
	});
});


function hideAllSections() {
  const sections = document.querySelectorAll(".section");
  sections.forEach(sec => sec.style.display = "none");
}


function startOrder() {
  const name = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  
  if (!name || !email) {
    alert("Please enter both name and email.");
    return;
  }
  document.getElementById("start-screen").style.display = "none";
  
  checkMembership(name);
  
  navigate(0);
}

function navigate(sectionId) {
  // Hide the current section
  if (typeof currentSection === 'number' && currentSection >= 0) {
    const current = document.getElementById("section-" + currentSection);
    if (current) current.style.display = "none";
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Always hide review section unless navigating to it
  document.getElementById("section-review").style.display = "none";

  // Handle special case for review
  if (sectionId === 'review') {
    document.getElementById("section-review").style.display = "block";
    document.getElementById("reviewName").textContent = document.getElementById("fullName").value;
    document.getElementById("reviewEmail").textContent = document.getElementById("email").value;
    renderBasket();
    renderReviewBasket();

    const basketPanel = document.getElementById("basket-panel");
    if (basketPanel) basketPanel.style.display = "none";

    updateTabActive('review');
    return;
  }

  // Show selected section
  const next = document.getElementById("section-" + sectionId);
  if (next) next.style.display = "block";
  currentSection = sectionId;

  // Show/hide basket depending on section
  const hideBasketOn = ['start', 'review', 'thankyou'];
  const basketPanel = document.getElementById("basket-panel");
  if (basketPanel) {
    basketPanel.style.display = hideBasketOn.includes(sectionId) ? "none" : "block";
  }

  // Update tab highlight
  updateTabActive(sectionId);
}


function updateTabActive(sectionId) {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach((btn, index) => {
    btn.classList.remove("active");

    // Match string ID or numeric index
    if (index === sectionId || btn.dataset.section === sectionId.toString()) {
      btn.classList.add("active");
    }
  });
}



function addToBasket(title, price, qtyId, sizeId) {
  const qty = parseInt(document.getElementById(qtyId).value);
  const size = sizeId === 'No size' ? 'No size' : document.getElementById(sizeId).value;
  const parsedPrice = parseFloat(price.toString().replace(/[^0-9.]/g, ""));
  if (!qty || qty <= 0 || isNaN(parsedPrice)) return;

  const subtotal = qty * parsedPrice;
  const item = { title, size, qty, price: parsedPrice, subtotal };

  // Show initials prompt for certain items
  if (title.includes("After-Match Shirt") || title.includes("Playing Shorts") || title.includes("Performance Kit Bag")) {
    currentCustomItem = item;
    document.getElementById("itemInitials").value = "";
    document.getElementById("initialsModal").style.display = "block";
    return;
  }

  // Show customisation modal for playing shirts
  if (title.includes("Playing Shirt")) {
    promptShirtCustomisation(item); // this handles adding
    return;
  }

  actuallyAddToBasket(item);
  document.getElementById(qtyId).value = 0;
}


function actuallyAddToBasket(item) {
  basketItems.push(item);
  renderBasket();
}






async function checkMembership(name) {
  const response = await fetch("https://defaulta4b11af850d24780929f5875abda53.33.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/5bd7af16846c4dcf9818d2e5e05ca4fe/triggers/manual/paths/invoke/?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=sCgrddXcyMExvzu0e0Dg7uzeQfIG2LxeXKgcOr369Ds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name })
  });

  const result = await response.json();
  const used = parseFloat(result.receivedKit || "0");

  if (result.memberFound && used < kitAllowanceLimit) {
    kitAllowance = kitAllowanceLimit - used;
    kitAllowanceUsed = false;
  } else if (result.memberFound && used >= kitAllowanceLimit) {
    kitAllowance = 0;
    kitAllowanceUsed = true;
  } else {
    kitAllowance = 0;
    kitAllowanceUsed = false;
  }

  renderBasket(); // refresh totals
}



function renderBasket() {
  const basketList = document.getElementById("basketList");
  const subtotalElement = document.getElementById("subtotalAmount");
  const discountElement = document.getElementById("discountAmount");
  const totalElement = document.getElementById("totalAmount");

  basketList.innerHTML = "";
  let subtotal = 0;

  basketItems.forEach((item, index) => {
    const itemTotal = item.qty * item.price;
    subtotal += itemTotal;

    const li = document.createElement("li");
    let itemDetails = `${item.qty} x ${item.title} (${item.size})`;

	if (item.initials) {
	  itemDetails += ` - Initials: ${item.initials.toUpperCase()}`;
	}
	if (item.shirtNumber && item.shirtName) {
	  itemDetails += ` - No: ${item.shirtNumber}, Name: ${item.shirtName.toUpperCase()}`;
	}

	li.innerHTML = `${itemDetails} - £${itemTotal.toFixed(2)} <button onclick="removeFromBasket(${index})">Remove</button>`;
	
	basketList.appendChild(li);
  });

  const discount = Math.min(kitAllowance, subtotal);
  const finalTotal = subtotal - discount;
  
  document.getElementById("kitAllowanceValue").textContent = `£${(kitAllowance).toFixed(2)}`;

  subtotalElement.textContent = subtotal.toFixed(2);
  discountElement.textContent = discount > 0
    ? discount.toFixed(2)
    : kitAllowanceUsed
      ? "Already used"
      : "0.00";

  totalElement.textContent = finalTotal.toFixed(2);
}


function renderReviewBasket() {
  const container = document.getElementById("reviewBasket");
  container.innerHTML = "";

  const submitBtn = document.getElementById("submitOrderBtn");
  if (submitBtn) submitBtn.style.display = "none"; // hide by default

  if (basketItems.length === 0) {
    container.innerHTML = "<p>No items in basket.</p>";
    return;
  }

  const ul = document.createElement("ul");
  let subtotal = 0;

  basketItems.forEach((item, index) => {
    const itemSubtotal = item.qty * item.price;
    subtotal += itemSubtotal;
    const li = document.createElement("li");
    li.innerHTML = `${item.qty} x ${item.title} (${item.size})${item.initials ? ` - Initials: ${item.initials}` : ""}${item.shirtName ? ` - Name: ${item.shirtName}` : ""}${item.shirtNumber ? ` - Number: ${item.shirtNumber}` : ""} - £${itemSubtotal.toFixed(2)} <button onclick="removeFromBasket(${index}); renderReviewBasket(); renderBasket();">Remove</button>`;
    ul.appendChild(li);
  });

  const discount = Math.min(kitAllowance, subtotal);
  const totalToPay = subtotal - discount;

  container.appendChild(ul);

  // Add full total breakdown
  container.innerHTML += `
    <p><strong>Subtotal:</strong> £${subtotal.toFixed(2)}<br/>
    <span style="color: green;"><strong>Club Allowance:</strong> £${discount.toFixed(2)}</span><br/>
    <strong>Total to Pay:</strong> £${totalToPay.toFixed(2)}</p>
  `;

  // Required item logic
  const missingShorts = !basketItems.some(item => item.title.toLowerCase().includes("playing shorts"));
  const missingAftermatch = !basketItems.some(item => item.title.toLowerCase().includes("after-match shirt"));

  if (missingShorts || missingAftermatch) {
    const warningDiv = document.createElement("div");
    warningDiv.className = "review-warning-box";

    if (missingShorts) {
      warningDiv.innerHTML += `
        <p>⚠️ You have not selected <strong>Playing Shorts</strong>.</p>
        <label><input type="checkbox" id="confirmShorts"> I confirm I already own a pair.</label>
      `;
    }

    if (missingAftermatch) {
      warningDiv.innerHTML += `
        <p>⚠️ You have not selected an <strong>Aftermatch Shirt</strong>.</p>
        <label><input type="checkbox" id="confirmAftermatch"> I confirm I already own one.</label>
      `;
    }

    container.appendChild(warningDiv);
  }

  // Recheck confirmation
  setTimeout(() => {
    const confirmShorts = document.getElementById("confirmShorts");
    const confirmAftermatch = document.getElementById("confirmAftermatch");

    function validateConfirmations() {
      const shortsOK = !missingShorts || (confirmShorts && confirmShorts.checked);
      const aftermatchOK = !missingAftermatch || (confirmAftermatch && confirmAftermatch.checked);

      if (shortsOK && aftermatchOK && submitBtn) {
        submitBtn.style.display = "block";
      } else {
        submitBtn.style.display = "none";
      }
    }

    if (confirmShorts) confirmShorts.addEventListener("change", validateConfirmations);
    if (confirmAftermatch) confirmAftermatch.addEventListener("change", validateConfirmations);

    validateConfirmations();
  }, 100); // short delay to allow DOM insert
}




function removeFromBasket(index) {
  basketItems.splice(index, 1);
  renderBasket();
  renderReviewBasket();
}

// bind startOrder after DOM is ready
document.addEventListener("DOMContentLoaded", function() {
	document.getElementById("startButton").onclick = startOrder;
});


function showSection(sectionId) {
  hideAllSections();
  document.getElementById(sectionId).style.display = "block";
}


async function submitOrder() {
	let subtotal = 0;
	const fullName = document.getElementById("fullName").value;
	const email = document.getElementById("email").value;
	const emailSubject = 'Calne RFC Kit Order for ' + fullName;
	let emailBody = '<p><b>Name: </b>' + fullName + '</p>' +
					'<p><b>Email: </b>' + email + '</p>' +
					'<p><b>Order Summary:</b></p><ul>';

	basketItems.forEach((item) => {
		const itemSubtotal = item.qty * item.price;
		subtotal += itemSubtotal;

		emailBody += '<li>' + item.qty + ' x ' + item.title + ' (' + item.size + ')';

		if (item.initials) {
			emailBody += ' - Initials: ' + item.initials;
		}
		if (item.shirtName) {
			emailBody += ' - Name: ' + item.shirtName;
		}
		if (item.shirtNumber) {
			emailBody += ' - Number: ' + item.shirtNumber;  // assuming this is correct
		}

		emailBody += ' - £' + itemSubtotal.toFixed(2) + '</li>';
	});

	const discount = Math.min(kitAllowance, subtotal);
	const totalToPay = subtotal - discount;
	let kitAllowanceUsed = totalToPay > 0 ? 120 : 120- (kitAllowance - subtotal);

	emailBody += '</ul>';
	emailBody += '<p><b>Total Amount: </b>£' + subtotal.toFixed(2) + '</p>';
	emailBody += '<p><b>Kit Allowance: </b>£' + kitAllowance.toFixed(2) + '</p>';
	emailBody += '<p><b>Total To Pay: </b>£' + totalToPay.toFixed(2) + '</p>';

	const orderData = {
		name: fullName,
		email: email,
		basket: basketItems,
		kitAllowance: parseFloat(kitAllowance.toFixed(2)),
		orderTotal: parseFloat(subtotal.toFixed(2)),
		totalToPay: parseFloat(totalToPay.toFixed(2)),
		emailSubject: emailSubject,
		emailBody: emailBody,
		kitAllowanceUsed: parseFloat(kitAllowanceUsed.toFixed(2))
	};

	document.getElementById("processingOverlay").style.display = "flex";


	if (totalToPay > 0) {
		sessionStorage.setItem("orderData", JSON.stringify(orderData));
		await processPayment(totalToPay);
		return;
	}


	try {
		const result = await submitToPowerAutomate(orderData);
		document.getElementById("processingOverlay").style.display = "none";

		if (result.success) {
			sessionStorage.setItem("hasSubmitted", "true");
			showSection("section-order-success");
		} else {
			showFailure(result.error || "An unknown error occurred submitting your order.");
		}
	} catch (e) {
		document.getElementById("processingOverlay").style.display = "none";
		showFailure("Unexpected error submitting your order: " + e.message);
	}
}

async function submitToPowerAutomate(orderData) {
  try {
    const response = await fetch("https://defaulta4b11af850d24780929f5875abda53.33.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/dfeda9bf405e4d0d8efd7538e758e4f1/triggers/manual/paths/invoke/?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=NKtmKfuxQPD-pR5ooN1hRWbUV2uDc7hDF3PsmpDxW8c", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return { success: false, error: "Power Automate submission failed: " + errorText };
    }
  } catch (error) {
    return { success: false, error: "Error submitting to Power Automate: " + error.message };
  }
}

async function processPayment(totalAmount) {
  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!fullName || !email) {
    showFailure("Missing name or email. Please check and try again.");
    return;
  }

  // Show loading screen
  document.getElementById("processingOverlay").style.display = "flex";

  try {
    const response = await fetch("https://stripe-backend-h7ot.onrender.com/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: parseFloat(totalAmount).toFixed(2),
        name: fullName,
        email: email
      })
    });

    const result = await response.json();

    if (response.ok && result.url) {
      // Redirect to Stripe Checkout
      window.location.href = result.url;
    } else {
      // Show custom failure section with explanation
      const message = result?.error || "Unable to redirect to payment. Please try again.";
      showFailure(message);
    }
  } catch (err) {
    console.error("Stripe Error:", err);
    showFailure("A network error occurred while starting payment. Please try again later.");
  }
}


function showFailure(message) {
  hideAllSections();
  const section = document.getElementById("section-order-failure");
  const messageContainer = section.querySelector(".error-message");

  if (messageContainer) {
    messageContainer.textContent = message;
  }

  section.style.display = "block";
  document.getElementById("processingOverlay").style.display = "none";
}

function startNewOrder() {
  sessionStorage.clear();
  window.history.replaceState(null, "", window.location.pathname);
  location.reload();
}


  

