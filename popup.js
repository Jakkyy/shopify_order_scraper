async function sendMessage(message) {
	return chrome.tabs.query(
		{ currentWindow: true, active: true },
		async function (tabs) {
			var activeTab = tabs[0];
			chrome.tabs.sendMessage(activeTab.id, {
				name: message,
			});
		}
	);
}
document.addEventListener("DOMContentLoaded", async function () {
	console.log("ciao");
	initializeDefaultCurrency();

	const currencySelect = document.getElementById("currencies");
	if (currencySelect) {
		// Set the dropdown value to the stored currency
		getDataFromStorage("selectedCurrency", function (storedCurrency) {
			if (storedCurrency) {
				console.log(storedCurrency);
				currencySelect.value = storedCurrency.selectedCurrency; // Set the value based on storage
			}
		});

		// Listen for changes in the dropdown (user selects a new currency)
		currencySelect.addEventListener("change", handleCurrencyChange);
	}

	document
		.getElementById("fetchShopifyOrder")
		.addEventListener("click", () => sendMessage("fetch_shopify_order"));
	document
		.getElementById("copyButton")
		.addEventListener("click", function () {
			var input = document.getElementById("copyInput");
			input.select();
			console.log(input);
			document.execCommand("copy");

			chrome.runtime.sendMessage({
				type: "SHOW_TOAST",
				title: "Success",
				message: "Text successfully copied to your clipboard",
			});
		});
});

chrome.storage.sync.get(["lastValue"], function (result) {
	if (result.lastValue) {
		document.getElementById("copyInput").value = result.lastValue;
	}
});

function handleCurrencyChange(event) {
	const selectedCurrency = event.target.value;
	console.log(selectedCurrency);
	setDataInStorage("selectedCurrency", selectedCurrency); // Save selected currency in storage
	console.log("Currency changed to " + selectedCurrency);
}

function initializeDefaultCurrency() {
	const defaultCurrency = "eur"; // Default value for the currency

	// Check if currency is already set
	getDataFromStorage("selectedCurrency", function (storedCurrency) {
		if (!storedCurrency) {
			// If no currency is set, initialize it with the default value
			setDataInStorage("selectedCurrency", defaultCurrency);
			console.log("Default currency initialized to " + defaultCurrency);
		} else {
			console.log("Currency already set to " + storedCurrency);
		}
	});
}

function setDataInStorage(key, value) {
	chrome.storage.local.set({ [key]: value }, function () {
		console.log("Value is set to " + value);
		// Optionally send a message to display toast or alert
		chrome.runtime.sendMessage({
			type: "SHOW_TOAST",
			title: "Success",
			message: `Data saved to Chrome storage: ${key}`,
		});
	});
}

// Get data from Chrome Storage
function getDataFromStorage(key, callback) {
	chrome.storage.local.get(key, function (result) {
		callback(result);
	});
}
