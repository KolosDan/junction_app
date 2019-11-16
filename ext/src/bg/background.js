let google_page = false;
let twitter_page = false;
let facebook_page = false;
let twitter_messages = false;


function ajax_post(url, data) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function () {
    if (xhr.status === 200) {
      chrome.storage.local.get(function(data) {
        if(typeof(data["map"]) !== 'undefined' && data["map"] instanceof Array) { 
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

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    ajax_post("https://192.168.137.154:5000/analyze_raw", request);
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