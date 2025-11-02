# L0ss Client 🗜️

> Open-source lossy compression tools that run 100% in your browser

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**[✨ Try it now →](https://client.l0ss.com)**

## ✨ Features

- 🔒 **100% Privacy**: Files never leave your device - all processing happens in your browser
- 📴 **Works Offline**: Progressive Web App with full offline support
- 🚀 **Fast**: Client-side processing with no server round-trips
- 🎯 **11 File Types**: JSON, CSV, JavaScript, HTML, CSS, SQL, XML, YAML, SVG, Markdown, Text
- 🎛️ **Configurable**: 3 compression levels + custom options
- 📱 **Cross-Platform**: Works on Windows, macOS, Linux, iOS, Android
- 💾 **Install as App**: Can be installed as a native-like desktop/mobile app
- 🆓 **Free & Open Source**: MIT License

## 📊 Compression Results

| File Type | Typical Reduction | Example |
|-----------|------------------|---------|
| JSON | 30-58% | 4.7 KB → 2.0 KB (58% smaller) |
| JavaScript | 35-68% | 4.7 KB → 1.5 KB (68% smaller) |
| CSV | 20-50% | 2.8 KB → 2.2 KB (21% smaller) |
| SQL | 35-70% | 5.1 KB → 1.5 KB (70% smaller) |
| SVG | 60-79% | 2.2 KB → 0.5 KB (79% smaller) |
| HTML | 35-45% | 4.4 KB → 2.4 KB (45% smaller) |
| CSS | 35-48% | Various optimizations |

## 🚀 Quick Start

### Option 1: Use Online (No Installation)

Visit **[https://client.l0ss.com](https://client.l0ss.com)** in any modern browser.

### Option 2: Install as Desktop/Mobile App

1. Visit the URL above
2. Click the "Install App" button in your browser
3. L0ss Client will be installed as a native-like app
4. Works offline after installation!

### Option 3: Run Locally

```bash
# Clone the repository
git clone https://github.com/ambanmba/l0ss-client.git
cd l0ss-client

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🛠️ How It Works

L0ss Client uses intelligent lossy compression techniques tailored for each file type:

### JSON Compression
- Frequency-based key compression (long keys → short codes)
- Value deduplication
- Precision reduction for numbers
- Null/empty field removal

**Example:**
```json
// Before (1012 bytes)
{"firstName": "John", "lastName": "Doe", "emailAddress": "john@example.com"}

// After (465 bytes) - 54% reduction
{"0": "John", "1": "Doe", "2": "john@example.com"}
```

### CSV Compression
- Dictionary encoding (repeated strings → integer codes)
- Delta encoding (store differences for sequential data)
- Low-variance column removal
- Statistical sampling

### JavaScript Compression
- Comment removal
- Whitespace optimization
- Variable name shortening
- Boolean/undefined literals (true → !0, undefined → void 0)

### SQL Compression
- Alias shortening (user_table → a)
- Keyword optimization
- Statement combining
- Optional keyword removal

### SVG Compression
- SVGO-inspired path optimization
- Precision reduction
- Attribute removal
- ID/class minification

### And more...
See the [Algorithm Documentation](docs/algorithms.md) for detailed explanations.

## 📖 Supported File Types

| Type | Extensions | Key Features |
|------|-----------|-------------|
| JSON | `.json` | Key compression, deduplication |
| CSV | `.csv` | Dictionary encoding, delta encoding |
| JavaScript | `.js`, `.mjs` | Minification, AST optimization |
| HTML | `.html`, `.htm` | Tag optimization, attribute removal |
| CSS | `.css` | CSSO techniques, structural optimization |
| SQL | `.sql` | Query optimization, alias shortening |
| XML | `.xml` | Element removal, namespace stripping |
| YAML | `.yaml`, `.yml` | Format optimization, inline conversion |
| SVG | `.svg` | SVGO plugins, path optimization |
| Markdown | `.md` | Link simplification, image removal |
| Text | `.txt` | Line normalization, whitespace reduction |

## 🔧 Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
npm install
npm run dev
```

### Testing
```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:ui       # Visual test UI
```

### Building
```bash
npm run build         # Build for production
npm run preview       # Preview production build
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. 🐛 **Report bugs** - Open an issue with details
2. 💡 **Suggest features** - Share your ideas
3. 📝 **Improve docs** - Fix typos, add examples
4. 🔧 **Submit PRs** - Fix bugs or add features

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

This means you can:
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Private use

## 🙏 Acknowledgments

L0ss Client is inspired by excellent open-source projects:

- **[SVGO](https://github.com/svg/svgo)** - SVG optimization techniques
- **[tdewolff/minify](https://github.com/tdewolff/minify)** - HTML/JS/CSS minification
- **[CSSO](https://github.com/css/csso)** - CSS structural optimization
- **[BtrBlocks](https://www.cs.cit.tum.de/dis/research/btrblocks/)** - Dictionary encoding research
- **[Gorilla](https://github.com/facebookarchive/beringei)** - Delta encoding techniques

## 🔗 Related Projects

- **[L0ss Web](https://l0ss.com)** - Server-side version with file sharing and API
- **[Compression Algorithms](docs/algorithms.md)** - Detailed technical documentation

## 🌟 Star History

If you find L0ss Client useful, please consider giving it a star on GitHub!

## 📮 Contact

- **Issues**: [GitHub Issues](https://github.com/ambanmba/l0ss-client/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ambanmba/l0ss-client/discussions)

---

Made with ❤️ by the L0ss community
