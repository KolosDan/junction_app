MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
let google_links = [];
let timeout = false;
// chrome.storage.local.set({ map: [] })

setInterval(() => { timeout = false; }, 2000);

setInterval(() => { chrome.storage.local.get('map', function (html) { console.log(html) }) }, 5000);

// setInterval(() => { chrome.storage.local.get('settings', function (html) { console.log(html) }) }, 5000);

chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {

	if (msg.action == 'get_google_links') {
		for (var i = 0; i < document.links.length; i++) {
			google_links.push(document.links[i].href);
		}
		chrome.storage.local.set({ g: google_links })
		chrome.storage.local.set({ g_html: document.documentElement.innerHTML })
	}
	else if (msg.action == 'check_google_link') {
		chrome.storage.local.get('g', function (result) {
			if (result.g.includes(window.location.href)) {
				chrome.storage.local.set({ g: [] })
				chrome.storage.local.get('g_html', function (html) {
					var parser = new DOMParser();
					var htmlDoc = parser.parseFromString(html.g_html, 'text/html');
					chrome.runtime.sendMessage({
						type: "search", query: htmlDoc.getElementsByName("q")[0].value, next_url: window.location.href,
						next_html: html.g_html, timestamp: new Date()
					});
				})
			}
			else {
				if (!window.location.href.includes("google.com")) {
					chrome.runtime.sendMessage({
						type: "unclassified", url: window.location.href,
						html: document.documentElement.innerHTML, timestamp: new Date()
					});
				}

			}
		});
	}

	else if (msg.action == 'get_twitter_articles') {
		setTimeout(() => {
			console.log(document.getElementsByTagName("article"))
			chrome.runtime.sendMessage({
				type: "sn_feed", url: window.location.href,
				posts: document.getElementsByTagName("article"), timestamp: new Date()
			});
		}, 1000)

	}

	else if (msg.action == 'get_twitter_messages') {
		let temp_arr = [];
		setTimeout(() => {
			let divs = document.getElementsByTagName("div");
			for (var i = 0; i < divs.length; ++i) {
				if (divs[i].getAttribute('data-testid') == "conversation") {
					temp_arr.push(divs[i]);
				}
			}
			// chrome.runtime.sendMessage( {
			// 	type: "sn_message", url: window.location.href,
			// 	messages: temp_arr, timestamp : new Date()
			// });
		}, 1000)
	}

});


var observer = new MutationObserver(function (mutations, observer) {
	if (window.location.href.includes("twitter.com/home") || window.location.href.includes("twitter.com/explore")) {
		if (!timeout) {
			let feed = document.getElementsByTagName("article");
			for (let i = 0; i < feed.length; i++) {
				chrome.runtime.sendMessage({
					type: "sn_feed", url: window.location.href,
					post: feed[i].innerHTML, timestamp: new Date()
				});
			}
			timeout = true;
		}
	}
	else if (window.location.href.includes("facebook.com/messages/t/")) {
		if (!timeout) {
			let messages = document.getElementsByClassName("_3oh- _58nk");
			for (let i = 0; i < messages.length; i++) {
				chrome.runtime.sendMessage({
					type: "sn_messages", url: window.location.href,
					message: messages[i].innerText, timestamp: new Date()
				});
			}
			timeout = true;
		}
	}
	else {
		if (!timeout && !window.location.href.includes("google.com")) {
			chrome.runtime.sendMessage({
				type: "unclassified", url: window.location.href,
				html: document.documentElement.innerHTML, timestamp: new Date()
			});
			timeout = true;
		}
	}
});

observer.observe(document, {
	subtree: true,
	attributes: true
});