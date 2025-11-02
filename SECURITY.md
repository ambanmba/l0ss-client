# Security Policy

## Our Security Commitment

L0ss Client is designed with security and privacy as core principles:

- **100% Client-Side**: Files never leave your device
- **No Tracking**: Zero analytics or telemetry
- **No Network Calls**: Runs completely offline after first load
- **Open Source**: Fully auditable code
- **No Dependencies**: Zero runtime dependencies reduces attack surface

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

### 1. Do NOT Open a Public Issue

Security vulnerabilities should not be disclosed publicly until a fix is available.

### 2. Report Privately

**Email:** security@l0ss.com (preferred)

**Or use GitHub Security Advisories:**
https://github.com/ambanmba/l0ss-client/security/advisories/new

### 3. Include Details

Please provide:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

### 4. Response Timeline

- **48 hours**: Initial response acknowledging receipt
- **7 days**: Assessment and initial fix (if possible)
- **14 days**: Public disclosure (after fix is deployed)

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✅ Yes    |
| Older   | ❌ No     |

We only support the latest version. Please update to the latest version before reporting issues.

## Security Features

### Client-Side Processing
- All compression happens in your browser
- Files are never uploaded to any server
- No data leaves your device

### Offline Capability
- Progressive Web App with Service Worker
- Works without internet connection
- No external API calls required

### No External Dependencies
- Zero runtime dependencies
- Reduces supply chain attack risk
- Easy to audit (no node_modules to review)

### Content Security Policy
- Strict CSP headers
- No inline scripts execution
- Safe from XSS attacks

### Open Source
- All code is public and auditable
- Community can review security
- Transparent development

## Security Best Practices

### For Users
1. **Use HTTPS**: Always access via HTTPS (GitHub Pages provides this)
2. **Update Regularly**: Clear cache to get latest security updates
3. **Sensitive Data**: Even though files don't leave your device, be cautious with sensitive data
4. **Verify Source**: Only use official deployment at `client.l0ss.com`

### For Contributors
1. **No External APIs**: Don't add code that makes network requests
2. **No User Tracking**: Don't add analytics or telemetry
3. **Validate Input**: Always validate and sanitize user input
4. **Avoid Dependencies**: Minimize runtime dependencies
5. **Code Review**: All PRs require review before merge

## Known Limitations

### Browser Security
L0ss Client relies on browser security:
- Modern browsers only (ES6+ required)
- Service Workers require HTTPS
- File API permissions required

### Local Storage
- IndexedDB may store temporary data
- Clear browser cache to remove all data

## Disclosure Policy

We follow responsible disclosure:

1. **Private Report**: Vulnerability reported privately
2. **Assessment**: We assess and develop fix
3. **Fix Deployed**: Security patch deployed
4. **Public Disclosure**: After 14 days or when fix is deployed
5. **Credit**: Reporter credited (if desired)

## Security Updates

Security updates are released as needed:
- Critical: Within 48 hours
- High: Within 7 days
- Medium: Within 30 days
- Low: Next regular release

## Contact

- **Security Issues**: security@l0ss.com
- **General Issues**: https://github.com/ambanmba/l0ss-client/issues

## Hall of Fame

We thank these security researchers for responsible disclosure:

*(No vulnerabilities reported yet)*

---

Thank you for helping keep L0ss Client secure! 🔒
