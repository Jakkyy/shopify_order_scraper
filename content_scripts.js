chrome.runtime.onMessage.addListener(async function (request) {
	switch (request.name) {
		case "fetch_shopify_order":
			await fetchShopifyOrder();
			break;
	}
});

const regexShopify =
	/https:\/\/(shopify\.com|[\w-]+\.\w+)+(\/\d+)?\/(account\/orders\/\d+|orders\/[a-zA-Z0-9]+)/;
const fallbackImg =
	"https://cdn.discordapp.com/emojis/838786996281016322.webp?size=96&quality=lossless";

async function fetchShopifyOrder() {
	try {
		const page = window.location.toString();
		const isShopify = regexShopify.test(page);
		console.log("isShopify", isShopify);

		// Get basic order details
		const currency =
			document.querySelector("._19gi7yt19")?.innerText.toLowerCase() ??
			"usd"; // Defaulting to 'usd' if not found
		const brand = document.querySelector("._1x52f9s6")?.innerText ?? "N/A";
		const orderUrl = page;
		const rawOrderTotal = document
			.querySelector("strong")
			?.innerText?.slice(1);
		const orderTotal = rawOrderTotal ? parseFloat(rawOrderTotal) : 1; // Default to 1 if parsing fails
		const totalConverted = (
			await getConversion(currency, orderTotal)
		).toFixed(2);

		// Collect all items
		const allItems = Array.from(
			document.querySelectorAll("._6zbcq54 > div")
		);

		// Track total and items data
		let tot = 0,
			total_quantity = 0;
		let items = [];

		for (const item of allItems) {
			const quantity = parseInt(
				item.querySelector("._1fragemp6 > span:nth-child(2)")
					?.innerText ?? "0"
			);
			const image = item.querySelector("._1h3po424")?.src ?? fallbackImg;
			const name =
				item.querySelector("._1fragemnq > span")?.innerText ?? "N/A";

			const rawSubTotal = parseFloat(
				item
					.querySelector(
						"p span._19gi7yt0._19gi7ytw._19gi7ytv._1fragemnu"
					)
					?.innerText?.slice(1) ?? "1"
			);
			const subTotal = parseFloat(
				await getConversion(currency, rawSubTotal)
			).toFixed(2);

			tot += parseFloat(subTotal); // Add to total
			total_quantity++;

			items.push({ quantity, image, name, subTotal });
		}

		// Calculate fees and log results
		const fees = parseFloat(totalConverted - tot).toFixed(2);
		const feesEach = fees / total_quantity;

		items = items.map((item) => {
			console.log(item.subTotal);
			item.subTotal = (parseFloat(item.subTotal) + feesEach).toFixed(2);
			return item;
		});
		// Detailed order data
		const orderData = {
			brand,
			orderUrl,
			items,
			totalConverted,
			fees,
		};

		console.log(orderData);
		copyTextToClipboard(JSON.stringify(orderData));
	} catch (error) {
		console.error("Error fetching Shopify order:", error);
	}
}

function copyTextToClipboard(text) {
	navigator.clipboard
		.writeText(text)
		.then(() => {
			console.log("Text copied");
			chrome.runtime.sendMessage({
				type: "SHOW_TOAST",
				title: "Success",
				message: "Text successfully copied to your clipboard",
			});
		})
		.catch((error) => {
			console.log("Clipboard API error:", error);

			// If the clipboard API fails and the tab is not focused, try to use fallback method
			if (!document.hasFocus()) {
				try {
					const textarea = document.createElement("textarea");
					textarea.value = text;
					document.body.appendChild(textarea);
					textarea.select();
					document.execCommand("copy");
					document.body.removeChild(textarea);

					console.log("Text copied using fallback method");
					chrome.runtime.sendMessage({
						type: "SHOW_TOAST",
						title: "Success (Fallback)",
						message:
							"Text successfully copied using fallback method.",
					});
				} catch (fallbackError) {
					console.log("Fallback method error:", fallbackError);
					chrome.runtime.sendMessage({
						type: "SHOW_TOAST",
						title: "Error",
						message: "There was an error copying text.",
					});
				}
			} else {
				chrome.runtime.sendMessage({
					type: "SHOW_TOAST",
					title: "Error",
					message: "Tab not focused, unable to copy text.",
				});
			}
		})
		.finally(() => {
			chrome.storage.sync.set({ lastValue: text }).then(() => {
				console.log("New value for last value is set");
			});
		});
}

async function getConversion(currency, total) {
	const defaultCurrency = (await getDataFromStorage("selectedCurrency"))
		.selectedCurrency;

	console.log("currency", currency);
	console.log("total", total);
	//console.log(defaultCurrency);
	const req = await fetch(
		`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${defaultCurrency}.json`
	);
	const res = await req.json();
	const conversionRate = res[defaultCurrency][currency];
	console.log(total, conversionRate);
	return parseFloat(total / conversionRate);
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
function getDataFromStorage(key) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(key, function (result) {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			} else {
				resolve(result);
			}
		});
	});
}
