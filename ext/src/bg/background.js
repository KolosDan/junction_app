let google_page = false;
let twitter_page = false;
let facebook_page = false;
let twitter_messages = false;
let gather = true;


function ajax_post(url, data) {
  if (gather) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      if (xhr.status === 200) {
        chrome.storage.local.get(function (data) {
          if (typeof (data["map"]) !== 'undefined' && data["map"] instanceof Array) {
            data["map"].push(JSON.parse(xhr.responseText)['result']);
          } else {
            data["map"] = [JSON.parse(xhr.responseText)['result']];
          }
          chrome.storage.local.set(data);
        });
      }
    };
    xhr.send(JSON.stringify(data));
  }
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.type === "gather") {
      gather = !gather;
    }
    else if (request.type === "chart") {
      chrome.storage.local.get('map', function (data) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', "https://mood.fflab.co/get_charts");
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
          if (xhr.status === 200) {
            chrome.runtime.sendMessage({
              type: "display_charts", data: xhr.response
            });
          }
        };
        xhr.send(JSON.stringify(data));
      })
    }
    else if (request.type === "sent_chart") {
      chrome.storage.local.get('map', function (data) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', "https://mood.fflab.co/get_sentiment_charts");
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
          if (xhr.status === 200) {
            chrome.runtime.sendMessage({
              type: "display_charts", data: xhr.response
            });
          }
        };
        xhr.send(JSON.stringify(data));
      })
    }
    else if (request.type === "sent_recommend") {
      chrome.storage.local.get('map', function (data) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', "https://mood.fflab.co/get_recommendations");
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
          if (xhr.status === 200) {
            chrome.runtime.sendMessage({
              type: "display_recommendations", data: xhr.response
            });
          }
        };
        xhr.send(JSON.stringify(data));
      })
    }
    else if (request.type === "send_email") {
      let htmltosend = "";
      chrome.storage.local.get('map', function (data) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', "https://mood.fflab.co/get_recommendations");
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
          if (xhr.status === 200) {
            htmltosend += JSON.parse(xhr.response)["result"]
            var xhr_email = new XMLHttpRequest();
            xhr_email.open('POST', "https://mood.fflab.co/request_email");
            xhr_email.setRequestHeader('Content-Type', 'application/json');
            xhr_email.onload = function () {

            };
            xhr_email.send(JSON.stringify(htmltosend));
          }
        };
        xhr.send(JSON.stringify(data));
      })

    }
    else {
      ajax_post("https://mood.fflab.co/analyze_raw", request);
    }
  });

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // GOOGLE 

  if (changeInfo.status == "complete" && google_page) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "get_google_links" }, function (response) { });
    });
  }

  else if (changeInfo.status == "complete" && !google_page) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "check_google_link" }, function (response) { });
    });
  }

  else if (google_page && changeInfo.status == "loading" && changeInfo.url) {
    google_page = false;
  }

  // TWITTER

  else if (changeInfo.status == "complete" && twitter_page) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "get_twitter_articles" }, function (response) { });
    });
    twitter_page = false;
  }

  else if (changeInfo.status == "complete" && twitter_messages) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "get_twitter_messages" }, function (response) { });
    });
    twitter_messages = false;
  }

  else if (changeInfo.status == "loading" && changeInfo.url) {

    if (changeInfo.url.includes("google.com/search?")) {
      google_page = true;
    }
    else if (changeInfo.url.includes("twitter.com/home") || changeInfo.url.includes("twitter.com/explore")) {
      twitter_page = true;
    }
    else if (changeInfo.url.includes("twitter.com/messages")) {
      twitter_messages = true;
    }
    else if (changeInfo.url.includes("facebook.com")) {
      facebook_page = true;
    }
  }

});

chrome.tabs.onActivated.addListener(function (tabId, changeInfo, tab) {
  console.log("update")
});