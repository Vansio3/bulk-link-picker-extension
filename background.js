chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openTabs') {
    request.urls.forEach(url => {
      chrome.tabs.create({ url: url, active: false });
    });
  } else if (request.action === 'updateBadge') {
    chrome.action.setBadgeText({ text: request.count });
    chrome.action.setBadgeBackgroundColor({ color: '#007bff' });
  }
});