// Content script - runs on web pages
console.log('My Extension content script loaded!');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'highlight') {
        // Add a simple highlight effect to the page
        const banner = document.createElement('div');
        banner.textContent = request.message;
        banner.className = 'nemlai-banner';
        
        document.body.appendChild(banner);
        
        // Remove the banner after 3 seconds
        setTimeout(() => {
            if (banner.parentNode) {
                banner.parentNode.removeChild(banner);
            }
        }, 3000);
        
        sendResponse({success: true});
    }
});