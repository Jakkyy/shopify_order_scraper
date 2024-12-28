chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === "SHOW_TOAST") {
		chrome.notifications.create({
			type: "basic",
			iconUrl: "uTestLogoNav.png",
			title: message.title || "Notification",
			message: message.message || "No message provided.",
		});
		sendResponse({ success: true });
	}
});
