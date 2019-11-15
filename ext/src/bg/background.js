let google_page = false;
let twitter_page = false;
let facebook_page = false;
let twitter_messages = false;

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