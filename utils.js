function get_color(colorNr, depth, lighten) {
    const base_colors = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#ff00ea", "#d35400", "#c0392b", "#e16c18"];
    const color = base_colors[colorNr % 9];
    if (!lighten)
      return color
    const adjustedColor = lightenColor(color, (depth < 40 ? depth : 40));
    return adjustedColor;
}

function lightenColor(hexColor, lightness) {
    scale = 2 // adjust how much the colors change with depth
    // Remove the '#' character if present
    hexColor = hexColor.replace(/^#/, '');

    // Convert hex to RGB
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);

    // Adjust lightness
    const adjustedR = Math.min(255, r + lightness * scale);
    const adjustedG = Math.min(255, g + lightness * scale);
    const adjustedB = Math.min(255, b + lightness * scale);

    // Convert back to hex
    const newHexColor = `#${Math.round(adjustedR).toString(16).padStart(2, '0')}${Math.round(adjustedG).toString(16).padStart(2, '0')}${Math.round(adjustedB).toString(16).padStart(2, '0')}`;

    return newHexColor;
}