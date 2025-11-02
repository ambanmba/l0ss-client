/**
 * SVG compression engine with lossy optimizations
 */

/**
 * Compress SVG with specified loss level
 */
export async function compressSVG(content, lossLevel = 'moderate', customOptions = {}) {
  const operations = [];
  const originalSize = content.length;
  let compressed = content;

  switch (lossLevel) {
    case 'minimal':
      compressed = applyMinimalSVGCompression(compressed, operations, customOptions);
      break;
    case 'moderate':
      compressed = applyModerateSVGCompression(compressed, operations, customOptions);
      break;
    case 'aggressive':
      compressed = applyAggressiveSVGCompression(compressed, operations, customOptions);
      break;
    default:
      throw new Error('Invalid loss level');
  }

  return {
    compressed,
    operations,
    originalSize,
    compressedSize: compressed.length
  };
}

/**
 * Minimal SVG compression
 */
function applyMinimalSVGCompression(svg, operations, customOptions) {
  let compressed = svg;

  // Remove XML declaration
  const beforeDecl = compressed.length;
  compressed = compressed.replace(/<\?xml[^?]*\?>\s*/g, '');

  if (compressed.length < beforeDecl) {
    operations.push({
      type: 'remove_xml_declaration',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Remove comments
  if (customOptions.removeComments !== false) {
    const beforeComments = compressed.length;
    compressed = compressed.replace(/<!--[\s\S]*?-->/g, '');

    if (compressed.length < beforeComments) {
      operations.push({
        type: 'remove_comments',
        count: 1,
        reversible: false,
        impact: 'low'
      });
    }
  }

  // Remove metadata and editor data
  if (customOptions.removeMetadata !== false) {
    const beforeMetadata = compressed.length;
    compressed = compressed.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
    compressed = compressed.replace(/<sodipodi:[^>]*>/gi, '');
    compressed = compressed.replace(/<inkscape:[^>]*>/gi, '');

    if (compressed.length < beforeMetadata) {
      operations.push({
        type: 'remove_metadata',
        count: 1,
        reversible: false,
        impact: 'low'
      });
    }
  }

  // Remove DOCTYPE
  const beforeDoctype = compressed.length;
  compressed = compressed.replace(/<!DOCTYPE[^>]*>/gi, '');

  if (compressed.length < beforeDoctype) {
    operations.push({
      type: 'remove_doctype',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Remove whitespace between tags
  const beforeWhitespace = compressed.length;
  compressed = compressed
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (compressed.length < beforeWhitespace) {
    operations.push({
      type: 'remove_whitespace',
      count: beforeWhitespace - compressed.length,
      reversible: false,
      impact: 'low'
    });
  }

  return compressed;
}

/**
 * Moderate SVG compression
 * Inspired by SVGO (https://github.com/svg/svgo) and tdewolff/minify
 */
function applyModerateSVGCompression(svg, operations, customOptions) {
  // First apply minimal compression
  let compressed = applyMinimalSVGCompression(svg, operations, customOptions);

  // Remove empty groups and containers (SVGO technique)
  const beforeEmptyGroups = compressed.length;
  compressed = removeEmptyGroups(compressed);

  if (compressed.length < beforeEmptyGroups) {
    operations.push({
      type: 'remove_empty_groups',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Optimize viewBox and remove redundant width/height (SVGO technique)
  const beforeViewBox = compressed.length;
  compressed = optimizeViewBox(compressed);

  if (compressed.length < beforeViewBox) {
    operations.push({
      type: 'optimize_viewbox',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Remove hidden elements (SVGO removeHiddenElems)
  if (customOptions.removeHidden !== false) {
    const beforeHidden = compressed.length;
    compressed = removeHiddenElements(compressed);

    if (compressed.length < beforeHidden) {
      operations.push({
        type: 'remove_hidden_elements',
        count: 1,
        reversible: false,
        impact: 'medium'
      });
    }
  }

  // Cleanup attributes (SVGO cleanupAttrs)
  const beforeAttrs = compressed.length;
  compressed = cleanupAttributes(compressed);

  if (compressed.length < beforeAttrs) {
    operations.push({
      type: 'cleanup_attributes',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Remove empty attributes (SVGO removeEmptyAttrs)
  const beforeEmptyAttrs = compressed.length;
  compressed = removeEmptyAttributes(compressed);

  if (compressed.length < beforeEmptyAttrs) {
    operations.push({
      type: 'remove_empty_attributes',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  // Collapse groups (SVGO collapseGroups)
  if (customOptions.collapseGroups !== false) {
    const beforeCollapse = compressed.length;
    compressed = collapseGroups(compressed);

    if (compressed.length < beforeCollapse) {
      operations.push({
        type: 'collapse_groups',
        count: 1,
        reversible: true,
        impact: 'low'
      });
    }
  }

  // Convert ellipse to circle when rx === ry (SVGO convertEllipseToCircle)
  if (customOptions.convertEllipseToCircle !== false) {
    const beforeEllipse = compressed.length;
    compressed = convertEllipseToCircle(compressed);

    if (compressed.length < beforeEllipse) {
      operations.push({
        type: 'convert_ellipse_to_circle',
        count: 1,
        reversible: true,
        impact: 'low'
      });
    }
  }

  // Remove useless stroke and fill (SVGO removeUselessStrokeAndFill)
  if (customOptions.removeUselessStrokeAndFill !== false) {
    const beforeStrokeFill = compressed.length;
    compressed = removeUselessStrokeAndFill(compressed);

    if (compressed.length < beforeStrokeFill) {
      operations.push({
        type: 'remove_useless_stroke_fill',
        count: 1,
        reversible: true,
        impact: 'low'
      });
    }
  }

  // Sort attributes alphabetically (SVGO sortAttrs)
  if (customOptions.sortAttrs !== false) {
    const beforeSort = compressed.length;
    compressed = sortAttributes(compressed);

    if (compressed.length < beforeSort) {
      operations.push({
        type: 'sort_attributes',
        count: 1,
        reversible: true,
        impact: 'low'
      });
    }
  }

  // Remove default attribute values
  if (customOptions.removeDefaults !== false) {
    const beforeDefaults = compressed.length;

    // Remove default fill="black"
    compressed = compressed.replace(/\s+fill="black"/g, '');
    compressed = compressed.replace(/\s+fill="#000000"/g, '');
    compressed = compressed.replace(/\s+fill="#000"/g, '');

    // Remove default stroke-width="1"
    compressed = compressed.replace(/\s+stroke-width="1"/g, '');

    // Remove default opacity="1"
    compressed = compressed.replace(/\s+opacity="1"/g, '');
    compressed = compressed.replace(/\s+fill-opacity="1"/g, '');
    compressed = compressed.replace(/\s+stroke-opacity="1"/g, '');

    if (compressed.length < beforeDefaults) {
      operations.push({
        type: 'remove_default_attributes',
        count: 1,
        reversible: true,
        impact: 'low'
      });
    }
  }

  // Optimize path data (SVGO/tdewolff technique)
  if (customOptions.optimizePaths !== false) {
    const beforePaths = compressed.length;
    compressed = optimizePathData(compressed, 2);

    if (compressed.length < beforePaths) {
      operations.push({
        type: 'optimize_path_data',
        decimals: 2,
        count: 1,
        reversible: false,
        impact: 'medium'
      });
    }
  }

  // Round numeric values in coordinates and dimensions
  if (customOptions.roundNumbers !== false) {
    const beforeRounding = compressed.length;
    let roundedCount = 0;

    // Round coordinates and dimensions
    compressed = compressed.replace(/(x|y|width|height|cx|cy|r|rx|ry|x1|y1|x2|y2)="(\d+\.\d{3,})"/g, (match, attr, num) => {
      roundedCount++;
      return `${attr}="${parseFloat(num).toFixed(2)}"`;
    });

    if (compressed.length < beforeRounding && roundedCount > 0) {
      operations.push({
        type: 'round_coordinates',
        decimals: 2,
        count: roundedCount,
        reversible: false,
        impact: 'low'
      });
    }
  }

  // Shorten color codes
  if (customOptions.shortenColors !== false) {
    const beforeColors = compressed.length;

    // #ffffff to #fff
    compressed = compressed.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3');

    // Named colors to hex
    const colorMap = {
      'white': '#fff',
      'black': '#000',
      'red': '#f00',
      'green': '#0f0',
      'blue': '#00f',
      'yellow': '#ff0',
      'cyan': '#0ff',
      'magenta': '#f0f'
    };

    Object.entries(colorMap).forEach(([name, hex]) => {
      const regex = new RegExp(`="${name}"`, 'gi');
      compressed = compressed.replace(regex, `="${hex}"`);
    });

    if (compressed.length < beforeColors) {
      operations.push({
        type: 'shorten_colors',
        count: 1,
        reversible: true,
        impact: 'low'
      });
    }
  }

  // Remove unnecessary namespaces
  const beforeNamespaces = compressed.length;
  compressed = compressed.replace(/\s+xmlns:[a-z]+="[^"]*"/gi, '');

  if (compressed.length < beforeNamespaces) {
    operations.push({
      type: 'remove_unused_namespaces',
      count: 1,
      reversible: true,
      impact: 'low'
    });
  }

  return compressed;
}

/**
 * Aggressive SVG compression
 */
function applyAggressiveSVGCompression(svg, operations, customOptions) {
  // First apply moderate compression
  let compressed = applyModerateSVGCompression(svg, operations, customOptions);

  // Simplify paths (reduce precision more aggressively)
  if (customOptions.simplifyPaths) {
    const beforeSimplify = compressed.length;

    // Round to 1 decimal place instead of 2
    compressed = compressed.replace(/d="([^"]*)"/g, (match, pathData) => {
      const simplified = pathData.replace(/(\d+\.\d+)/g, (num) => {
        return parseFloat(num).toFixed(1);
      });
      return `d="${simplified}"`;
    });

    if (compressed.length < beforeSimplify) {
      operations.push({
        type: 'simplify_paths',
        precision: 1,
        count: 1,
        reversible: false,
        impact: 'high'
      });
    }
  }

  // Remove title and desc elements
  if (customOptions.removeDescriptions !== false) {
    const beforeDesc = compressed.length;
    compressed = compressed.replace(/<title[\s\S]*?<\/title>/gi, '');
    compressed = compressed.replace(/<desc[\s\S]*?<\/desc>/gi, '');

    if (compressed.length < beforeDesc) {
      operations.push({
        type: 'remove_descriptions',
        count: 1,
        reversible: false,
        impact: 'medium'
      });
    }
  }

  // Remove IDs if not referenced
  if (customOptions.removeUnusedIds) {
    const beforeIds = compressed.length;

    // Find all IDs
    const idPattern = /id="([^"]*)"/g;
    const ids = new Set();
    let match;

    while ((match = idPattern.exec(compressed)) !== null) {
      ids.add(match[1]);
    }

    // Find all references
    const referenced = new Set();
    ids.forEach(id => {
      if (compressed.includes(`url(#${id})`) || compressed.includes(`href="#${id}"`)) {
        referenced.add(id);
      }
    });

    // Remove unreferenced IDs
    ids.forEach(id => {
      if (!referenced.has(id)) {
        const regex = new RegExp(`\\s+id="${id}"`, 'g');
        compressed = compressed.replace(regex, '');
      }
    });

    if (compressed.length < beforeIds) {
      operations.push({
        type: 'remove_unused_ids',
        count: ids.size - referenced.size,
        reversible: false,
        impact: 'high'
      });
    }
  }

  // Convert transforms to simpler forms
  if (customOptions.simplifyTransforms) {
    const beforeTransforms = compressed.length;

    // Simplify matrix transforms when possible
    compressed = compressed.replace(/transform="matrix\(1,0,0,1,(\d+\.?\d*),(\d+\.?\d*)\)"/g,
      'transform="translate($1,$2)"');

    // Remove identity transforms
    compressed = compressed.replace(/\s+transform="matrix\(1,0,0,1,0,0\)"/g, '');
    compressed = compressed.replace(/\s+transform="translate\(0,0\)"/g, '');
    compressed = compressed.replace(/\s+transform="scale\(1\)"/g, '');
    compressed = compressed.replace(/\s+transform="rotate\(0\)"/g, '');

    if (compressed.length < beforeTransforms) {
      operations.push({
        type: 'simplify_transforms',
        count: 1,
        reversible: true,
        impact: 'medium'
      });
    }
  }

  return compressed;
}

/**
 * Remove empty groups and containers
 * Inspired by SVGO removeEmptyContainers plugin
 */
function removeEmptyGroups(svg) {
  let result = svg;
  let prevLength;

  // Repeat until no more empty groups are found
  do {
    prevLength = result.length;

    // Remove empty <g> tags
    result = result.replace(/<g[^>]*>\s*<\/g>/g, '');

    // Remove empty <defs> tags
    result = result.replace(/<defs[^>]*>\s*<\/defs>/g, '');

    // Remove empty <clipPath> tags
    result = result.replace(/<clipPath[^>]*>\s*<\/clipPath>/g, '');

    // Remove empty <mask> tags
    result = result.replace(/<mask[^>]*>\s*<\/mask>/g, '');

    // Remove empty <pattern> tags
    result = result.replace(/<pattern[^>]*>\s*<\/pattern>/g, '');

  } while (result.length < prevLength);

  return result;
}

/**
 * Optimize viewBox and remove redundant width/height
 * Inspired by SVGO removeViewBox plugin (inverse - we keep viewBox, remove width/height)
 */
function optimizeViewBox(svg) {
  let result = svg;

  // If viewBox exists and matches width/height, we can remove width/height
  const viewBoxMatch = result.match(/<svg[^>]*viewBox="(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)"/);

  if (viewBoxMatch) {
    const [, x, y, width, height] = viewBoxMatch;

    // If viewBox starts at 0,0, we can potentially simplify
    if (x === '0' && y === '0') {
      // Remove width/height attributes that match viewBox dimensions
      result = result.replace(new RegExp(`\\s+width="${width}"`), '');
      result = result.replace(new RegExp(`\\s+height="${height}"`), '');

      // Also handle px units
      result = result.replace(new RegExp(`\\s+width="${width}px"`), '');
      result = result.replace(new RegExp(`\\s+height="${height}px"`), '');
    }
  }

  return result;
}

/**
 * Optimize path data - shorten and round coordinates
 * Inspired by SVGO cleanupNumericValues and convertPathData plugins
 */
function optimizePathData(svg, precision = 2) {
  return svg.replace(/d="([^"]*)"/g, (match, pathData) => {
    let optimized = pathData;

    // Round numbers to specified precision
    optimized = optimized.replace(/-?\d+\.\d+/g, (num) => {
      const rounded = parseFloat(num).toFixed(precision);
      // Remove trailing zeros after decimal point
      return rounded.replace(/\.?0+$/, '');
    });

    // Remove spaces around command letters
    optimized = optimized.replace(/\s*([MLHVCSQTAZ])\s*/gi, '$1');

    // Remove unnecessary spaces before negative numbers
    optimized = optimized.replace(/\s+-/g, '-');

    // Remove leading zeros (0.5 → .5)
    optimized = optimized.replace(/\b0(\.\d+)/g, '$1');

    // Convert absolute commands to relative where beneficial
    // (This is a simplified version - full implementation would require path parsing)

    // Remove redundant spaces between numbers
    optimized = optimized.replace(/(\d)\s+(\d)/g, '$1 $2');

    return `d="${optimized}"`;
  });
}

/**
 * Remove hidden elements
 * Inspired by SVGO removeHiddenElems plugin
 */
function removeHiddenElements(svg) {
  let result = svg;

  // Remove elements with display="none"
  result = result.replace(/<[^>]+display="none"[^>]*>[\s\S]*?<\/[^>]+>/g, '');
  result = result.replace(/<[^>]+display="none"[^>]*\/>/g, '');

  // Remove elements with visibility="hidden" (unless child has visibility="visible")
  result = result.replace(/<[^>]+visibility="hidden"[^>]*\/>/g, '');

  // Remove elements with opacity="0"
  result = result.replace(/<[^>]+opacity="0"[^>]*\/>/g, '');

  // Remove circles with radius 0
  result = result.replace(/<circle[^>]+r="0"[^>]*\/>/g, '');

  // Remove ellipses with rx or ry of 0
  result = result.replace(/<ellipse[^>]+rx="0"[^>]*\/>/g, '');
  result = result.replace(/<ellipse[^>]+ry="0"[^>]*\/>/g, '');

  // Remove rects with width or height of 0
  result = result.replace(/<rect[^>]+width="0"[^>]*\/>/g, '');
  result = result.replace(/<rect[^>]+height="0"[^>]*\/>/g, '');

  // Remove paths with empty d attribute
  result = result.replace(/<path[^>]+d=""[^>]*\/>/g, '');
  result = result.replace(/<path d=""[^>]*\/>/g, '');

  return result;
}

/**
 * Cleanup attributes - remove newlines and extra spaces
 * Inspired by SVGO cleanupAttrs plugin
 */
function cleanupAttributes(svg) {
  let result = svg;

  // Replace newlines in attributes with single space
  result = result.replace(/="([^"]*)\n([^"]*)"/g, '="$1 $2"');

  // Replace multiple spaces with single space in attribute values
  result = result.replace(/="([^"]*)  +([^"]*)"/g, '="$1 $2"');

  // Trim whitespace from start/end of attribute values
  result = result.replace(/="\s+([^"]*)"/g, '="$1"');
  result = result.replace(/="([^"]*)\s+"/g, '="$1"');

  return result;
}

/**
 * Remove empty attributes
 * Inspired by SVGO removeEmptyAttrs plugin
 */
function removeEmptyAttributes(svg) {
  let result = svg;

  // Remove attributes with empty values (but not empty string which might be valid)
  // Common empty attributes that can be safely removed
  result = result.replace(/\s+class=""/g, '');
  result = result.replace(/\s+id=""/g, '');
  result = result.replace(/\s+style=""/g, '');
  result = result.replace(/\s+transform=""/g, '');
  result = result.replace(/\s+fill=""/g, '');
  result = result.replace(/\s+stroke=""/g, '');

  return result;
}

/**
 * Collapse groups - move group attributes to child elements when beneficial
 * Inspired by SVGO collapseGroups plugin
 */
function collapseGroups(svg) {
  let result = svg;

  // Collapse groups with only one child element
  // This is a simplified version - full implementation would parse the DOM
  // Pattern: <g attr="value"><element /></g> → <element attr="value" />

  // Handle single-child groups with transform
  result = result.replace(/<g transform="([^"]+)">\s*(<[a-z]+[^>]*)\s*\/>\s*<\/g>/gi, (match, transform, element) => {
    // Add transform to element if it doesn't already have one
    if (!element.includes('transform=')) {
      return element.replace(/>/, ` transform="${transform}" />`).replace(/\s+\//, ' /');
    }
    return match;
  });

  // Handle single-child groups with fill
  result = result.replace(/<g fill="([^"]+)">\s*(<[a-z]+[^>]*)\s*\/>\s*<\/g>/gi, (match, fill, element) => {
    if (!element.includes('fill=')) {
      return element.replace(/>/, ` fill="${fill}" />`).replace(/\s+\//, ' /');
    }
    return match;
  });

  // Handle single-child groups with stroke
  result = result.replace(/<g stroke="([^"]+)">\s*(<[a-z]+[^>]*)\s*\/>\s*<\/g>/gi, (match, stroke, element) => {
    if (!element.includes('stroke=')) {
      return element.replace(/>/, ` stroke="${stroke}" />`).replace(/\s+\//, ' /');
    }
    return match;
  });

  return result;
}

/**
 * Convert ellipse to circle when rx === ry
 * Inspired by SVGO convertEllipseToCircle plugin
 */
function convertEllipseToCircle(svg) {
  let result = svg;

  // Match ellipse elements with equal rx and ry
  result = result.replace(/<ellipse([^>]*)rx="([^"]+)"([^>]*)ry="\2"([^>]*)\/>/g, (match, before, r, middle, after) => {
    // Replace ellipse with circle, using rx as the radius
    // Also need to handle cx and cy properly
    const cxMatch = match.match(/cx="([^"]+)"/);
    const cyMatch = match.match(/cy="([^"]+)"/);

    let attrs = before + middle + after;
    // Remove rx and ry from attrs if they exist
    attrs = attrs.replace(/\s*rx="[^"]+"/g, '');
    attrs = attrs.replace(/\s*ry="[^"]+"/g, '');

    return `<circle${attrs} r="${r}" />`;
  });

  // Also handle when ry comes before rx
  result = result.replace(/<ellipse([^>]*)ry="([^"]+)"([^>]*)rx="\2"([^>]*)\/>/g, (match, before, r, middle, after) => {
    let attrs = before + middle + after;
    attrs = attrs.replace(/\s*rx="[^"]+"/g, '');
    attrs = attrs.replace(/\s*ry="[^"]+"/g, '');

    return `<circle${attrs} r="${r}" />`;
  });

  return result;
}

/**
 * Remove useless stroke and fill attributes
 * Inspired by SVGO removeUselessStrokeAndFill plugin
 */
function removeUselessStrokeAndFill(svg) {
  let result = svg;

  // Remove fill="none" and stroke="none" from elements that don't render anyway
  // Remove stroke from elements that can't have strokes (like text, image, etc.)

  // Remove fill="none" from paths/shapes that also have stroke="none"
  result = result.replace(/(<(path|rect|circle|ellipse|polygon|polyline|line)[^>]*)fill="none"([^>]*)stroke="none"([^>]*\/?>)/g,
    (match, before, tag, middle, after) => {
      // If both are none, the element is invisible, but that's caught by removeHiddenElements
      // Just remove the redundant fill="none"
      return before + middle + ' stroke="none"' + after;
    });

  // Remove stroke from non-shape elements
  const nonStrokeElements = ['image', 'text', 'use'];
  nonStrokeElements.forEach(tag => {
    const regex = new RegExp(`(<${tag}[^>]*)\\s+stroke="[^"]*"([^>]*\/?>)`, 'g');
    result = result.replace(regex, '$1$2');
  });

  return result;
}

/**
 * Sort attributes alphabetically for better gzip compression
 * Inspired by SVGO sortAttrs plugin
 * Note: This actually may increase file size slightly but improves gzip compression
 */
function sortAttributes(svg) {
  // This is a simplified version - sorting attributes can help with gzip but may not
  // reduce the raw SVG size. For now, we'll implement a basic version that sorts
  // common attributes in a predictable order for better compression.

  // Since sorting might not always reduce size, and is complex to implement properly
  // without a full XML parser, we'll return the input unchanged for now.
  // A full implementation would parse each element and reorder attributes.

  return svg;
}

/**
 * Get custom options for SVG compression
 */
export function getSVGOptions() {
  return {
    removeComments: {
      default: true,
      impact: 'low',
      description: 'Remove XML comments',
      reversible: false
    },
    removeMetadata: {
      default: true,
      impact: 'low',
      description: 'Remove metadata and editor-specific data',
      reversible: false
    },
    removeDefaults: {
      default: true,
      impact: 'low',
      description: 'Remove default attribute values',
      reversible: true
    },
    removeHidden: {
      default: true,
      impact: 'medium',
      description: 'Remove hidden elements (display:none, opacity:0, etc.)',
      reversible: false
    },
    collapseGroups: {
      default: true,
      impact: 'low',
      description: 'Collapse unnecessary groups',
      reversible: true
    },
    optimizePaths: {
      default: true,
      impact: 'medium',
      description: 'Optimize path data (SVGO technique)',
      reversible: false
    },
    roundNumbers: {
      default: true,
      impact: 'low',
      description: 'Round coordinates to 2 decimals',
      reversible: false
    },
    shortenColors: {
      default: true,
      impact: 'low',
      description: 'Shorten color codes (#ffffff → #fff)',
      reversible: true
    },
    removeDescriptions: {
      default: false,
      impact: 'medium',
      description: 'Remove <title> and <desc> elements',
      reversible: false
    },
    simplifyPaths: {
      default: false,
      impact: 'high',
      description: 'Reduce path precision to 1 decimal place',
      reversible: false
    },
    removeUnusedIds: {
      default: false,
      impact: 'high',
      description: 'Remove IDs that are not referenced',
      reversible: false
    },
    simplifyTransforms: {
      default: false,
      impact: 'medium',
      description: 'Simplify and remove identity transforms',
      reversible: true
    }
  };
}
