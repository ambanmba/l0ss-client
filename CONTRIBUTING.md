# Contributing to L0ss Client

First off, thank you for considering contributing to L0ss Client! 🎉

## Welcome Contributors!

We're excited to have you contribute. L0ss Client is a community project, and we value all contributions - whether it's fixing a typo, improving documentation, reporting a bug, or implementing a new feature.

## Ways to Contribute

### 🐛 Report Bugs
Found a bug? Please [open an issue](https://github.com/ambanmba/l0ss-client/issues/new) with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Browser/OS information

### 💡 Suggest Features
Have an idea? [Open a feature request](https://github.com/ambanmba/l0ss-client/issues/new) with:
- Clear use case
- Why it would be valuable
- Potential implementation approach (optional)

### 📝 Improve Documentation
Documentation improvements are always welcome:
- Fix typos or clarify existing docs
- Add examples
- Translate documentation
- Improve code comments

### 🔧 Submit Pull Requests
Ready to code? Great! Follow the process below.

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)

### Initial Setup

```bash
# Fork the repository on GitHub, then:

# Clone your fork
git clone https://github.com/YOUR_USERNAME/l0ss-client.git
cd l0ss-client

# Add upstream remote
git remote add upstream https://github.com/ambanmba/l0ss-client.git

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

## Development Workflow

### 1. Create a Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/amazing-feature
# or
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add JSDoc comments for functions
- Keep functions small and focused
- Write tests for new features

### 3. Test Your Changes

```bash
# Run tests
npm test

# Manual testing
npm run dev
# Test in multiple browsers
```

### 4. Commit Your Changes

We use conventional commit messages:

```bash
# Good commit messages
git commit -m "feat: add dictionary encoding for CSV"
git commit -m "fix: resolve file type detection bug"
git commit -m "docs: update compression algorithm docs"
git commit -m "refactor: simplify file upload logic"

# Commit types:
# feat: New feature
# fix: Bug fix
# docs: Documentation changes
# refactor: Code refactoring
# test: Adding tests
# chore: Build process, dependencies
```

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/amazing-feature

# Go to GitHub and create a Pull Request
```

## Pull Request Guidelines

### PR Checklist

- [ ] Code follows existing style
- [ ] All tests pass (`npm test`)
- [ ] New features have tests
- [ ] Documentation updated (if needed)
- [ ] Commit messages are clear
- [ ] PR description explains what/why

### PR Description Template

```markdown
## What does this PR do?
Brief description of changes

## Why is this needed?
Explain the motivation

## How was this tested?
Describe testing steps

## Screenshots (if applicable)
Add before/after screenshots
```

## Code Style Guidelines

### JavaScript

```javascript
// Good: Use ES6+ features
const compressFile = async (content, level) => {
  const result = await compress(content);
  return result;
};

// Good: Clear variable names
const originalSize = file.size;
const compressedSize = result.length;

// Good: JSDoc comments
/**
 * Compress JSON content with specified level
 * @param {string} content - JSON content to compress
 * @param {string} level - Compression level (minimal|moderate|aggressive)
 * @returns {Promise<Object>} Compression result
 */
export async function compressJSON(content, level) {
  // ...
}
```

### File Organization

```
src/
  compression/       # Compression engines (one per file type)
  utils/             # Utility functions
  app.js             # Main application logic
```

### Compression Engine Requirements

If adding a new compression engine:

1. **Create new file**: `src/compression/your-type.js`
2. **Export compress function**:
   ```javascript
   export async function compressYourType(content, level, options) {
     // Return { compressed, manifest }
   }
   ```
3. **Export options function**:
   ```javascript
   export function getYourTypeOptions() {
     // Return configuration options
   }
   ```
4. **Add comprehensive JSDoc comments**
5. **Add tests**: `tests/your-type.test.js`
6. **Update file type detector**: `src/utils/file-type-detector.js`
7. **Update README**: Add to supported types table

## Testing

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Visual test UI
```

### Writing Tests

```javascript
import { describe, it, expect } from 'vitest';
import { compressJSON } from '../src/compression/json.js';

describe('JSON Compression', () => {
  it('should compress valid JSON', async () => {
    const input = '{"key": "value"}';
    const result = await compressJSON(input, 'moderate');

    expect(result.compressed).toBeDefined();
    expect(result.manifest).toBeDefined();
  });
});
```

## Project Structure

```
l0ss-client/
├── public/               # Static assets
│   ├── index.html        # Main HTML file
│   ├── manifest.json     # PWA manifest
│   └── service-worker.js # Offline support
├── src/
│   ├── app.js            # Main application
│   ├── compression/      # Compression engines
│   └── utils/            # Utilities
├── styles/               # CSS
├── tests/                # Test files
├── .github/
│   └── workflows/        # GitHub Actions
└── docs/                 # Documentation
```

## Getting Help

- 💬 [GitHub Discussions](https://github.com/ambanmba/l0ss-client/discussions) - Ask questions
- 🐛 [GitHub Issues](https://github.com/ambanmba/l0ss-client/issues) - Report bugs
- 📧 Email: (contact info)

## Code of Conduct

Please be respectful and considerate. We're all here to build something great together.

## Recognition

All contributors will be recognized in:
- GitHub Contributors page
- Release notes
- Annual contributor highlights

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to L0ss Client! 🙌
