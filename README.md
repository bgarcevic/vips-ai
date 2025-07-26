# Nemlig AI - Chrome Extension

An AI-powered shopping assistant Chrome extension for Nemlig.com that helps users save time while shopping online.

## Features

- **Local AI Shopping Assistant**: Uses WebLLM to run AI models entirely in your browser
- **Automated Grocery Shopping**: Input a shopping list and the AI finds and adds products to your Nemlig.com basket
- **Smart Product Selection**: AI analyzes product details, prices, and availability to choose the best match for each item
- **Multiple Model Support**: Choose from various local AI models (Llama-3.2-1B-Instruct and others)
- **Danish Language Support**: Fully localized interface in Danish
- **Privacy First**: Completely local and offline - no data is collected, stored, or transmitted

## Installation

### For Users

1. Download the latest release from the [Releases](../../releases) page
2. Extract the ZIP file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the extracted folder

### For Developers

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/nemlai.git
   cd nemlai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## Development

### Project Structure

```
nemlai/
├── manifest.json       # Extension configuration
├── background.js       # Service worker
├── content.js         # Content script for web pages
├── popup.html         # Extension popup UI
├── popup.js           # Popup functionality
├── popup.css          # Popup styling
├── content.css        # Content script styling
├── icons/             # Extension icons (16px, 48px, 128px)
└── dist/              # Built extension files
```

### Development Workflow

1. **Make Changes**: Edit source files as needed
2. **Build**: Run `npm run build` to compile changes
3. **Reload**: Use Chrome's extension reload button
4. **Debug**: 
   - Background script: Extensions page > Inspect views: background page
   - Content script: DevTools on any webpage
   - Popup: Right-click extension icon > Inspect popup

### Architecture

- **Background Service Worker**: Handles extension lifecycle and tab monitoring
- **Content Script**: Injected into web pages for banner display and interaction
- **Popup Interface**: 300px width popup with click tracking functionality
- **Storage**: Uses Chrome sync storage for persistent data

## Permissions

The extension requires the following permissions:
- `activeTab`: Access to the currently active tab
- `storage`: Persistent data storage across sessions

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and ensure they follow the project guidelines
4. Build and test the extension
5. Submit a pull request

### Development Guidelines

- All user-facing text should be in Danish
- Target Nemlig.com domains specifically for shopping features
- Follow Chrome Extension Manifest V3 best practices
- Test thoroughly before submitting changes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:
- Open an issue on [GitHub Issues](../../issues)
- Check existing issues for solutions to common problems

## Roadmap

See our [project roadmap](https://github.com/users/bgarcevic/projects/2/views/1) for upcoming features and development progress.


---

Built with ❤️ and too much caffeine for people who grocery shop in their pajamas 🛒☕
