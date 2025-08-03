# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Extension (Manifest V3) called "Vips AI" that serves as an AI-powered shopping assistant for Nemlig.com. The extension processes grocery lists, uses local AI models to select optimal products, and automatically adds them to the user's Nemlig.com basket.

## Architecture

The extension follows Chrome Extension Manifest V3 architecture with a sophisticated service layer:

- **manifest.json**: Extension configuration with permissions for `storage`, `tabs`, `activeTab` and CSP for WebLLM
- **background.js**: Service worker handling extension lifecycle and tab monitoring
- **content.js/content.css**: Content script for banner notifications with custom styling
- **popup.html/popup.js**: Main UI for grocery list input and AI model management
- **services/**: Core business logic services
- **utils/**: Helper functions for data processing and API utilities
- **icons/**: PNG icons in 16px, 48px, and 128px sizes

### Key Components

**Services Layer**:
- **WebLLMService** (`services/webllm.js`): Manages local AI model initialization and product selection using @mlc-ai/web-llm
- **NemligAPIService** (`services/nemlig-api.js`): Handles Nemlig.com API integration for authentication, product search, and basket operations

**Popup Interface** (`popup.html`, `popup.js`):
- Grocery list input with model selection dropdown
- WebLLM model download and initialization with progress tracking
- Processes lists item-by-item with AI-powered product selection
- Automatic basket integration with status reporting

**Content Script** (`content.js`, `content.css`):
- Displays temporary banner notifications for user feedback
- Styled overlay banners with custom CSS

**Utilities** (`utils/helpers.js`):
- API timestamp and timeslot generation for Nemlig.com requests
- Product data filtering to reduce payload size for AI processing
- Result formatting and status message generation

## Dependencies

**Runtime Dependencies**:
- `@mlc-ai/web-llm`: Local AI model execution in browser
- `progressbar.js`: Model download progress visualization

**Build Dependencies**:
- `parcel`: Build system with WebExtension configuration
- `@parcel/config-webextension`: Parcel plugin for Chrome extensions
- `@types/chrome`: TypeScript definitions for Chrome APIs
- `buffer`, `process`, `url`: Node.js polyfills for browser compatibility

## Development Commands

This project uses Parcel for building with WebExtension configuration:

1. **Build Project**: `npm run build` - Builds extension to `dist/` folder
2. **Load Extension**: Load unpacked extension in Chrome Developer Mode from `dist/` folder after successful build
3. **Reload Extension**: Use Chrome's extension reload button after making changes
4. **Debug**: 
   - Background script: Chrome DevTools > Extensions > Inspect views: background page
   - Content script: Regular DevTools on any webpage
   - Popup: Right-click extension icon > Inspect popup

## Rules

1. Everything the user sees should be in Danish
2. Do not add yourself as co-author on commits
3. Finish all tasks with `npm run build`

## Current State

The extension is a fully functional AI shopping assistant with:
- WebLLM integration for local product selection AI
- Nemlig.com API integration for product search and automatic basket management
- Sophisticated grocery list processing with error handling and status reporting
- Danish language interface optimized for Danish grocery shopping patterns

The AI system uses a specialized prompt for Danish grocery selection, prioritizing exact matches, handling organic ("Øko") preferences, and defaulting to standard/cheapest options for generic requests.