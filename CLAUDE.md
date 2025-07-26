# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Extension (Manifest V3) called "nemlig-ai" that serves as an AI shopping assistant for Nemlig.com to help users save time shopping. The extension is currently in early development with basic Chrome extension scaffolding.

## Architecture

The extension follows standard Chrome Extension architecture:

- **manifest.json**: Extension configuration with permissions for `activeTab` and `storage`
- **background.js**: Service worker that handles extension lifecycle events and tab monitoring
- **content.js**: Content script injected into all web pages that can display banner messages
- **popup.html/popup.js**: Extension popup UI with click tracking functionality
- **icons/**: SVG icons in 16px, 48px, and 128px sizes

### Key Components

**Background Service Worker** (`background.js`):
- Tracks extension installation and sets default storage values
- Monitors tab updates across all URLs
- Handles extension icon clicks when popup is not active

**Content Script** (`content.js`):
- Runs on all web pages (`<all_urls>`)
- Listens for messages from popup to display banner notifications
- Creates temporary overlay banners with styling

**Popup Interface** (`popup.html`, `popup.js`):
- 300px width popup with click counter functionality  
- Communicates with active tab's content script
- Persists click data using Chrome storage sync API

## Development Commands

This is a vanilla Chrome extension project node. Development workflow:

1. **Build Project** run npm build
2. **Load Extension**: Load unpacked extension in Chrome Developer Mode from dist folder after succesfull build. If loaded once, skip to step 3.
3. **Reload Extension**: Use Chrome's extension reload button after making changes
4. **Debug**: 
   - Background script: Chrome DevTools > Extensions > Inspect views: background page
   - Content script: Regular DevTools on any webpage
   - Popup: Right-click extension icon > Inspect popup

## Rules

1. Everything the user sees should be in Danish
2. Do not add yourself as co-author on commits
3. Finish all tasks with npm run build

## Current State

The extension has basic Chrome extension functionality but needs development toward its stated goal as an AI shopping assistant for Nemlig.com. The content script currently runs on all URLs but should be targeted specifically to Nemlig.com domains for the shopping assistant functionality.