function get_color(colorNr, depth, lighten) {
    // const base_colors = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#ff00ea", "#d35400", "#c0392b", "#e16c18"];
    const base_colors = ["#69ef7b", "#830c6f", "#c5df72", "#155392", "#05cfc0", "#1c35b7", "#fc99d5", "#368741", "#5eb3ea"];
    // const base_colors = ["#2d3155", "#543786", "#a7b5fe", "#d4dff0", "#7bb8c0", "#ffebad", "#feb737"]
    
    
    const color = base_colors[colorNr % 7];
    if (!lighten)
      return color
    const adjustedColor = lightenColor(color, (depth < 40 ? depth : 40));
    return adjustedColor;
}

function lightenColor(hexColor, lightness) {
    scale = 1 // adjust how much the colors change with depth
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

// Factorial and combination (choose) are used for the coupon problem
function factorial(n) {
  if (n === 0 || n === 1) {
      return 1;
  } else {
      return n * factorial(n - 1);
  }
}

function combination(n, k) {
  return factorial(n) / (factorial(k) * factorial(n - k));    
}

// outputs probability of seeing all r layers after we see n nodes
function coupon_problem(r, n) {
  let sum = 0
  for (j = 0; j <= r; j++) {
      sum += (-1)**j * combination(r, j) * (1-(j / r))**n
  }
  return sum
}