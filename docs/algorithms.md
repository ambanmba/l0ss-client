# Compression Algorithms

L0ss Client uses intelligent **lossy compression** techniques tailored for each file type. Unlike traditional lossless minifiers that only remove whitespace and comments, our algorithms intelligently remove actual data to achieve significantly higher compression ratios (10-90% reduction).

## Table of Contents

- [Overview](#overview)
- [Compression Levels](#compression-levels)
- [JSON Compression](#json-compression)
- [CSV Compression](#csv-compression)
- [JavaScript Compression](#javascript-compression)
- [HTML Compression](#html-compression)
- [CSS Compression](#css-compression)
- [SQL Compression](#sql-compression)
- [XML Compression](#xml-compression)
- [YAML Compression](#yaml-compression)
- [SVG Compression](#svg-compression)
- [Markdown Compression](#markdown-compression)
- [Text Compression](#text-compression)

---

## Overview

### What is Lossy Compression?

**Lossy compression** permanently removes data from files to achieve higher compression ratios. While this means the original file cannot be perfectly restored, the compressed version retains the essential information needed for most use cases.

### Use Cases

- **Development & Testing**: Smaller test datasets, faster iteration
- **Prototyping**: Quickly create minimal viable examples
- **Legacy Code**: Reduce bloat from old codebases
- **Education**: Simplified examples for learning
- **Archival**: Compress old files you rarely need

### Safety Levels

All compression operations include:
- ✅ Clear indication of what was removed
- ✅ Compression level selection (minimal/moderate/aggressive)
- ✅ Preview before committing to compression
- ✅ Download original and compressed versions

---

## Compression Levels

### Minimal (10-30% reduction)
Safe, reversible optimizations:
- Remove whitespace, formatting, comments
- Normalize values (true → 1, false → 0)
- Round numbers to standard precision
- **Best for**: Maximum safety, light optimization

### Moderate (30-60% reduction) - Recommended
Balanced approach:
- All minimal optimizations
- Remove low-priority fields
- Deduplicate similar values
- Simplify nested structures
- **Best for**: Most development and testing scenarios

### Aggressive (60-90% reduction)
Maximum compression:
- All moderate optimizations
- Remove all optional fields
- Extreme value deduplication
- Maximum data sampling
- **Best for**: Extreme size reduction for prototyping

---

## JSON Compression

### Algorithm

JSON compression uses frequency-based key compression inspired by jsonschema-key-compression, compress-json, and json-deduper.

### Techniques

#### 1. Frequency-Based Key Compression (Moderate/Aggressive)

Replace long, frequently-used keys with short codes:

**Algorithm**:
1. Count frequency of all keys in the JSON structure
2. Calculate byte savings: `(keyLength - codeLength) × frequency`
3. Sort keys by savings potential (highest first)
4. Assign shortest codes to most valuable keys (Base62: 0-9, a-z, A-Z)

**Example**:
```json
// Before (1012 bytes)
{
  "firstName": "John",
  "lastName": "Doe",
  "emailAddress": "john@example.com",
  "phoneNumber": "555-1234",
  "firstName": "Jane",
  "lastName": "Smith",
  "emailAddress": "jane@example.com",
  "phoneNumber": "555-5678"
}

// After (465 bytes) - 54% reduction
{
  "0": "John",
  "1": "Doe",
  "2": "john@example.com",
  "3": "555-1234",
  "0": "Jane",
  "1": "Smith",
  "2": "jane@example.com",
  "3": "555-5678"
}
```

**Mapping**: `0=firstName`, `1=lastName`, `2=emailAddress`, `3=phoneNumber`

#### 2. Null/Empty Removal (Moderate)
- Remove `null` values
- Remove empty arrays `[]`
- Remove empty objects `{}`

#### 3. Precision Reduction (Moderate/Aggressive)
- Round numbers to 2 decimal places (moderate)
- Round to integers (aggressive)

**Example**:
```json
// Before
{"price": 19.99999, "tax": 1.575}

// After (moderate)
{"price": 20.00, "tax": 1.58}

// After (aggressive)
{"price": 20, "tax": 2}
```

#### 4. Value Deduplication (Moderate)
Remove duplicate values in arrays:
```json
// Before
{"ids": [1, 2, 2, 3, 3, 3, 4]}

// After
{"ids": [1, 2, 3, 4]}
```

#### 5. String Truncation (Aggressive)
Truncate long strings to 100 characters:
```json
// Before
{"description": "Very long description that continues for many characters..."}

// After
{"description": "Very long description that continues for many chara..."}
```

---

## CSV Compression

### Algorithm

CSV compression uses multiple specialized techniques for tabular data, inspired by BtrBlocks (SIGMOD 2023), Gorilla time-series database (Facebook), and SAP HANA dictionary compression.

### Techniques

#### 1. Dictionary Encoding (Moderate)

Replace repeated string values with integer codes.

**Best for**: Countries, statuses, types, product categories

**Algorithm**:
1. Identify string columns (non-numeric)
2. Calculate repetition rate: `unique values / total values`
3. Apply if unique < 80% of total (significant repetition)
4. Build dictionary: unique values → codes (0, 1, 2, ...)
5. Replace all values with codes
6. Add (D) suffix to column header

**Example**:
```csv
// Before (1130 bytes)
order_id,customer_name,country,product_category,status,payment_method
1001,Alice Smith,USA,Electronics,Shipped,Credit Card
1002,Bob Johnson,Canada,Clothing,Pending,PayPal
1003,Carol White,USA,Electronics,Delivered,Credit Card
1004,David Brown,Mexico,Home & Garden,Shipped,Debit Card

// After (597 bytes) - 47% reduction
order_id(Δ),customer_name,country(D),product_category(D),status(D),payment_method(D)
1001,Alice Smith,2,1,2,0
+1.00,Bob Johnson,0,0,1,2
+1.00,Carol White,2,1,0,0
+1.00,David Brown,1,2,2,1
```

**Dictionaries**:
- country: `{0: "Canada", 1: "Mexico", 2: "USA"}`
- product_category: `{0: "Clothing", 1: "Electronics", 2: "Home & Garden"}`
- status: `{0: "Delivered", 1: "Pending", 2: "Shipped"}`
- payment_method: `{0: "Credit Card", 1: "Debit Card", 2: "PayPal"}`

**References**:
- [BtrBlocks: Efficient Columnar Compression for Data Lakes](https://www.cs.cit.tum.de/fileadmin/w00cfj/dis/papers/btrblocks.pdf) (SIGMOD 2023)
- [SAP HANA Dictionary Compression](https://help.sap.com/docs/SAP_HANA_PLATFORM/6b94445c94ae495c83a19646e7c3fd56/bd9017c8bb571014ae7ef8e7c3a6b6d1.html) (10-100x compression)

#### 2. Delta Encoding (Moderate)

Store differences between consecutive values instead of absolute values.

**Best for**: Timestamps, sensor readings, sequential IDs

**Algorithm**:
1. Identify numeric columns with variance
2. Store first value as-is (base/reference)
3. Store subsequent values as deltas: `value[N] - value[N-1]`
4. Format with sign prefix: `+5.00` or `-2.00`
5. Add (Δ) suffix to column header

**Example**:
```csv
// Before
timestamp,temperature,pressure
1635724800,20.5,1013.2
1635728400,21.2,1013.5
1635732000,22.1,1014.1
1635735600,23.5,1015.2

// After (delta encoding applied)
timestamp(Δ),temperature(Δ),pressure(Δ)
1635724800,20.5,1013.2
+3600.00,+0.70,+0.30
+3600.00,+0.90,+0.60
+3600.00,+1.40,+1.10
```

**Benefits**: Smaller numbers = fewer digits = less storage

**Reversibility**: Fully reversible via cumulative sum:
```
Original = [base, base+delta1, base+delta1+delta2, ...]
```

**References**:
- [Gorilla Time-Series Database](https://github.com/facebookarchive/beringei) (Facebook, achieves 12x compression)
- [Effective Compression Using Frame-of-Reference and Delta Coding](https://lemire.me/blog/2012/02/08/effective-compression-using-frame-of-reference-and-delta-coding/) (Daniel Lemire, 2012)
- [The Design of Fast Delta Encoding for Delta Compression](https://dl.acm.org/doi/10.1145/3456287) (ACM TOS, 2024)

#### 3. Low-Variance Column Removal (Moderate)
Remove columns where all values are identical:
```csv
// Before
name,city,country
John,NYC,USA
Jane,LA,USA
Bob,Chicago,USA

// After (country column removed)
name,city
John,NYC
Jane,LA
Bob,Chicago
```

#### 4. Text Truncation (Moderate)
Truncate non-numeric fields longer than 50 characters:
```csv
// Before
description
"This is a very long description that contains detailed information about the product..."

// After
description
"This is a very long description that contains d..."
```

#### 5. Row Sampling (Aggressive)
Keep every nth row (default: every 5th):
```csv
// Before (100 rows)
// After (20 rows) - 80% reduction
```

#### 6. Statistical Outlier Removal (Aggressive)
Remove rows with values >2 standard deviations from mean in numeric columns.

#### 7. Column Limiting (Aggressive)
Keep only first N columns (default: 5):
```csv
// Before (20 columns)
// After (5 columns) - 75% reduction
```

---

## JavaScript Compression

### Algorithm

JavaScript compression uses AST-aware minification and code transformation techniques.

### Techniques

#### 1. Comment Removal (Minimal)
- Remove single-line comments (`//`)
- Remove multi-line comments (`/* */`)
- Preserve JSDoc if needed

#### 2. Whitespace Optimization (Minimal)
- Remove unnecessary whitespace
- Preserve semantic whitespace
- Compact statements

#### 3. Variable Name Shortening (Moderate)
```javascript
// Before
function calculateTotalPrice(items) {
  let totalPrice = 0;
  for (let item of items) {
    totalPrice += item.price;
  }
  return totalPrice;
}

// After
function a(b){let c=0;for(let d of b){c+=d.price}return c}
```

#### 4. Boolean/Undefined Literals (Moderate)
- `true` → `!0`
- `false` → `!1`
- `undefined` → `void 0`
- `Infinity` → `1/0`

#### 5. Number Literal Optimization (Moderate)
- `1.0` → `1`
- `0.5` → `.5`
- `1000000` → `1e6`

#### 6. Function/Code Removal (Aggressive)
Remove:
- `console.log()` statements
- `debugger` statements
- Dead code detection

**Example Compression**:
```javascript
// Before (6,169 bytes)
/**
 * Shopping Cart System
 * Manages product cart operations
 */
class ShoppingCart {
  constructor() {
    this.items = [];
    console.log('Cart initialized');
  }

  addItem(product, quantity) {
    console.log(`Adding ${quantity} of ${product.name}`);
    this.items.push({ product, quantity });
  }
}

// After (2,291 bytes) - 62.86% reduction
class ShoppingCart{constructor(){this.items=[]}addItem(a,b){this.items.push({product:a,quantity:b})}}
```

---

## HTML Compression

### Algorithm

HTML compression uses DOM-aware optimization and attribute removal techniques.

### Techniques

#### 1. DOCTYPE Optimization (Minimal)
```html
<!-- Before -->
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">

<!-- After -->
<!DOCTYPE html>
```

#### 2. Attribute Removal (Moderate)
Remove redundant attributes:
- `type="text/javascript"` on `<script>`
- `type="text/css"` on `<style>`
- Explicit boolean values: `disabled="disabled"` → `disabled`

#### 3. Whitespace Collapse (Minimal)
- Remove whitespace between tags
- Preserve text node whitespace
- Collapse multiple spaces to one

#### 4. Comment Removal (Minimal)
Remove HTML comments (except conditional comments for IE)

#### 5. Optional Tag Removal (Aggressive)
Remove optional closing tags:
- `</li>`, `</p>`, `</td>`, `</tr>`, etc.

**Example**:
```html
<!-- Before (4.35 KB) -->
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN">
<html>
<head>
  <script type="text/javascript" src="app.js"></script>
  <style type="text/css">
    body { margin: 0; }
  </style>
</head>
<body>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</body>
</html>

<!-- After (2.83 KB) - 35% reduction -->
<!DOCTYPE html><html><head><script src="app.js"></script><style>body{margin:0}</style></head><body><ul><li>Item 1<li>Item 2</ul></body></html>
```

---

## CSS Compression

### Algorithm

CSS compression uses CSSO-inspired structural optimization techniques.

### Techniques

#### 1. Property Removal (Moderate)
Remove low-priority properties:
- `cursor`, `outline`, `resize`
- Vendor prefixes (`-webkit-`, `-moz-`, `-ms-`)

#### 2. Color Optimization (Minimal)
- `#ffffff` → `#fff`
- `rgb(255, 255, 255)` → `#fff`
- `rgba(0, 0, 0, 1)` → `#000`

#### 3. Zero Value Optimization (Minimal)
- `0px` → `0`
- `0em` → `0`
- `0%` → `0` (except in specific contexts)

#### 4. Selector Simplification (Aggressive)
```css
/* Before */
div.container > div.row > div.column { }

/* After */
.column { }
```

#### 5. Duplicate Rule Merging (Moderate)
```css
/* Before */
.a { color: red; }
.b { color: red; }

/* After */
.a, .b { color: red; }
```

**References**:
- [CSSO - CSS Optimizer](https://github.com/css/csso)

---

## SQL Compression

### Algorithm

SQL compression uses query optimization and alias shortening techniques.

### Techniques

#### 1. Alias Shortening (Moderate)
```sql
-- Before
SELECT user_table.name, order_table.total
FROM users AS user_table
LEFT OUTER JOIN orders AS order_table

-- After
SELECT a.name,b.total
FROM users AS a
LEFT JOIN orders AS b
```

#### 2. Optional Keyword Removal (Moderate)
- `LEFT OUTER JOIN` → `LEFT JOIN`
- `public.table_name` → `table_name`
- Remove `CASCADE`, `RESTRICT`

#### 3. INSERT Statement Combining (Moderate)
```sql
-- Before
INSERT INTO users (id, name) VALUES (1, 'John');
INSERT INTO users (id, name) VALUES (2, 'Jane');

-- After
INSERT INTO users VALUES(1,'John'),(2,'Jane');
```

#### 4. Schema Changes Removal (Aggressive)
Remove DDL statements:
- `CREATE TABLE`, `DROP TABLE`, `ALTER TABLE`
- Keep only data manipulation (INSERT, UPDATE, SELECT, DELETE)

#### 5. Transaction Removal (Aggressive)
Remove transaction control:
- `BEGIN TRANSACTION`
- `COMMIT`
- `ROLLBACK`

#### 6. Constraint Removal (Aggressive)
Remove constraints:
- `PRIMARY KEY`
- `FOREIGN KEY`
- `UNIQUE`
- `CHECK`

**Example**:
```sql
-- Before (1562 bytes)
CREATE TABLE users (id INTEGER PRIMARY KEY, username VARCHAR(50) NOT NULL);
BEGIN TRANSACTION;
INSERT INTO users (id, username) VALUES (1, 'john_doe');
INSERT INTO users (id, username) VALUES (2, 'jane_smith');
SELECT u.username FROM public.users AS user_table LEFT OUTER JOIN orders;
COMMIT;

-- After Moderate (784 bytes, 49.8% reduction)
insert into users values(1,'john_doe'),(2,'jane_smith');
select a.username from users as a left join orders;

-- After Aggressive (462 bytes, 70.4% reduction)
insert into users values(1,'john_doe'),(2,'jane_smith');
select a.username from users as a left join orders;
```

---

## XML Compression

### Algorithm

XML compression uses element/attribute optimization and namespace handling.

### Techniques

#### 1. Declaration Removal (Moderate)
```xml
<!-- Before -->
<?xml version="1.0" encoding="UTF-8"?>

<!-- After -->
(removed)
```

#### 2. CDATA Section Removal (Moderate)
```xml
<!-- Before -->
<![CDATA[Some text content]]>

<!-- After -->
Some text content
```

#### 3. Empty Element Removal (Moderate)
```xml
<!-- Before -->
<element></element>

<!-- After -->
(removed)
```

#### 4. Boolean Attribute Collapse (Moderate)
```xml
<!-- Before -->
<input disabled="disabled" readonly="readonly"/>

<!-- After -->
<input disabled readonly/>
```

#### 5. Tag Name Shortening (Aggressive)
```xml
<!-- Before -->
<very-long-tag-name>
  <another-lengthy-element>
  </another-lengthy-element>
</very-long-tag-name>

<!-- After -->
<t0>
  <t1>
  </t1>
</t0>
```

---

## YAML Compression

### Algorithm

YAML compression uses format optimization and inline conversion.

### Techniques

#### 1. Document Marker Removal (Moderate)
```yaml
# Before
---
key: value
...

# After
key: value
```

#### 2. Quote Removal (Moderate)
```yaml
# Before
name: "John Doe"
city: 'New York'

# After
name: John Doe
city: New York
```

#### 3. Null Value Shortening (Moderate)
```yaml
# Before
value: null

# After
value: ~
```

#### 4. Flow Style Conversion (Moderate)
```yaml
# Before
items:
  - item1
  - item2
  - item3

# After
items: [item1, item2, item3]
```

---

## SVG Compression

### Algorithm

SVG compression uses SVGO-inspired path optimization and precision reduction.

### Techniques

#### 1. Path Optimization (Moderate)
- Remove unnecessary path commands
- Convert absolute to relative coordinates
- Merge adjacent commands

```svg
<!-- Before -->
<path d="M 10 10 L 20 20 L 30 20 L 30 10 Z"/>

<!-- After -->
<path d="M10 10l10 10h10v-10z"/>
```

#### 2. Precision Reduction (Moderate)
```svg
<!-- Before -->
<circle cx="10.123456" cy="20.789012" r="5.555555"/>

<!-- After -->
<circle cx="10.12" cy="20.79" r="5.56"/>
```

#### 3. Attribute Removal (Moderate)
Remove default/redundant attributes:
- `fill="black"` (default)
- `stroke-width="1"` (default)
- `xmlns` namespace declarations

#### 4. ID/Class Minification (Aggressive)
```svg
<!-- Before -->
<g id="very-descriptive-layer-name">
  <rect class="primary-background-rectangle"/>
</g>

<!-- After -->
<g id="a">
  <rect class="b"/>
</g>
```

**References**:
- [SVGO - SVG Optimizer](https://github.com/svg/svgo)

---

## Markdown Compression

### Algorithm

Markdown compression uses link simplification and content reduction.

### Techniques

#### 1. Link Simplification (Moderate)
```markdown
<!-- Before -->
[Click here to visit our website](https://example.com)

<!-- After -->
[Link](https://example.com)
```

#### 2. Image Removal (Aggressive)
```markdown
<!-- Before -->
![Alt text](image.png)

<!-- After -->
(removed)
```

#### 3. Heading Level Reduction (Aggressive)
```markdown
<!-- Before -->
#### Fourth Level Heading

<!-- After -->
## Second Level Heading
```

#### 4. List Compaction (Moderate)
```markdown
<!-- Before -->
- Item 1

- Item 2

- Item 3

<!-- After -->
- Item 1
- Item 2
- Item 3
```

---

## Text Compression

### Algorithm

Text compression uses line removal and whitespace normalization.

### Techniques

#### 1. Empty Line Removal (Minimal)
```
Before:
Line 1

Line 2


Line 3

After:
Line 1
Line 2
Line 3
```

#### 2. Whitespace Normalization (Minimal)
- Multiple spaces → single space
- Tab → space
- Trailing whitespace removal

#### 3. Line Sampling (Aggressive)
Keep every nth line (default: every 3rd)

---

## Recovery & Reversibility

### What Can Be Recovered?

**Fully Reversible Operations**:
- Dictionary encoding (lookup table preserved)
- Delta encoding (cumulative sum restores original)
- Whitespace removal (can be re-formatted)

**Partially Reversible**:
- Key compression (mapping table available)
- Alias shortening (mapping preserved)

**Non-Reversible**:
- Precision reduction (data lost)
- Row/column removal (data lost)
- Text truncation (data lost)

### Best Practices

1. **Always download the original** before compressing
2. **Test on sample data** first
3. **Use minimal level** for important files
4. **Use aggressive level** only for prototyping/testing
5. **Keep compression reports** for reference

---

## References

### Academic Papers
- **BtrBlocks**: [Efficient Columnar Compression for Data Lakes](https://www.cs.cit.tum.de/fileadmin/w00cfj/dis/papers/btrblocks.pdf) (SIGMOD 2023)
- **Delta Encoding**: [The Design of Fast Delta Encoding](https://dl.acm.org/doi/10.1145/3456287) (ACM TOS 2024)
- **Frame-of-Reference**: [Effective Compression Using Delta Coding](https://lemire.me/blog/2012/02/08/effective-compression-using-frame-of-reference-and-delta-coding/) (Daniel Lemire, 2012)

### Open Source Projects
- **SVGO**: [SVG Optimization](https://github.com/svg/svgo)
- **CSSO**: [CSS Structural Optimization](https://github.com/css/csso)
- **Gorilla**: [Time-Series Database](https://github.com/facebookarchive/beringei)
- **tdewolff/minify**: [HTML/JS/CSS Minification](https://github.com/tdewolff/minify)

### Industry References
- **SAP HANA**: [Dictionary Compression](https://help.sap.com/docs/SAP_HANA_PLATFORM/6b94445c94ae495c83a19646e7c3fd56/bd9017c8bb571014ae7ef8e7c3a6b6d1.html)
- **Wikipedia**: [Dictionary Coder](https://en.wikipedia.org/wiki/Dictionary_coder), [Delta Encoding](https://en.wikipedia.org/wiki/Delta_encoding)

---

## License

This documentation is part of L0ss Client, released under the MIT License.

For questions or contributions, visit: https://github.com/ambanmba/l0ss-client
