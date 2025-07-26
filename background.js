// Background service worker
console.log('Background script loaded');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed:', details.reason);
    
    if (details.reason === 'install') {
        // Set default values
        chrome.storage.sync.set({
            clickCount: 0,
            installDate: new Date().toISOString()
        });
    }
});

// Listen for tab updates (optional)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        console.log('Tab updated:', tab.url);
    }
});

// Handle extension icon click (if no popup is defined)
chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked on:', tab.url);
});