MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
let google_links = [];
let timeout = false;

setInterval(() => { timeout = false; }, 2000);

chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
	alert(msg.action)

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
				alert("FIRED")
				chrome.storage.local.set({ g: [] })
				chrome.storage.local.get('g_html', function (html) {
					var parser = new DOMParser();
					var htmlDoc = parser.parseFromString( html.g_html, 'text/html');	
					ajax_post("https://192.168.137.154:5000/analyze_raw", {
						type: "search", query: htmlDoc.getElementsByName("q")[0].value, next_url : window.location.href,
						next_html: html.g_html, timestamp: new Date()
					});
				})
			}
			else {
				if (!window.location.href.includes("google.com")) {
					ajax_post("https://192.168.137.154:5000/analyze_raw", {
						type: "unclassified", url: window.location.href,
						html: document.documentElement.innerHTML, timestamp: new Date()
					});
				}

			}
		});
	}

	else if (msg.action == 'get_twitter_articles') {
		setTimeout(() => {
			// ajax_post("https://192.168.137.154:5000/analyze_raw", {
			// 	type: "sn_feed", url: window.location.href,
			// 	posts: document.getElementsByTagName("article")
			// });
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
			// ajax_post("https://192.168.137.157:5000/analyze", {
			// 	type: "sn_message", url: window.location.href,
			// 	messages: temp_arr, timestamp : new Date()
			// });
		}, 1000)
	}

});

function ajax_get(url, callback) {
	var xmlhttp;
	xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			callback(xmlhttp.responseText);
		}
	}
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

function ajax_post(url, data) {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.onload = function () {
		if (xhr.status === 200) {
			console.log(200);
		}
	};
	xhr.send(JSON.stringify(data));
}

var observer = new MutationObserver(function (mutations, observer) {
	if (window.location.href.includes("twitter.com/home") || window.location.href.includes("twitter.com/explore")) {
		if (!timeout) {
			// ajax_post("https://192.168.137.157:5000/analyze", {
			// 	type: "sn_feed", url: window.location.href,
			// 	posts: document.getElementsByTagName("article")
			// });
			timeout = true;
		}
	}
	else if (window.location.href.includes("facebook.com")) {

	}
	else {
		if (!timeout && !window.location.href.includes("google.com")) {
			ajax_post("https://192.168.137.154:5000/analyze_raw", {
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