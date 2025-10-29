const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'openTabs') {
    for (const url of request.urls) {
      await chrome.tabs.create({ url: url, active: false });
      await sleep(100); // 100ms delay between opening tabs
    }
  } else if (request.action === 'updateBadge') {
    chrome.action.setBadgeText({ text: request.count });
    chrome.action.setBadgeBackgroundColor({ color: '#FFBF00' });
  }
});