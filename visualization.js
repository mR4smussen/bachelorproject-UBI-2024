document.addEventListener("DOMContentLoaded", () => {
  // Get the canvas
  const canvas = document.getElementById("sunburstCanvas");
  const ctx = canvas.getContext("2d");

  // This can be changed to scale the entire chart
  LAYER_SIZE = 100

  // the ratio between 1 value in an interval and 1 degree on the circle.
  RATIO = 0 
  
  // center position 
  let x = canvas.width / 2 
  let y = canvas.height / 2

  // Function that draws a single 
  function drawNode(node) {

    // default color for first three layers. 
    let color = "red" 
    
    // Gets a color based on the branch (from the third layer, and then the lightness is chosen by the depth)
    if (node.branchNr)
      color = get_color(node.branchNr, node.depth)

    // the root node just draws a circle
    if (node.status == "root") {

      // The ratio is the entire circles degrees devided between the roots interval
      RATIO = (2*Math.PI) / (node.interval[1] - node.interval[0])

      // draw a circle
      ctx.beginPath();
      ctx.arc(x, y, LAYER_SIZE, 0, 2*Math.PI);
      ctx.fillStyle = "black";
      ctx.fill();
      ctx.lineWidth = 0.01; // outline width
      ctx.strokeStyle = "#000"; // outline color
      ctx.stroke();

      return 
    }

    if (RATIO == 0) {
      console.error("expected first node to be the root node")
      return
    }

    // Non-root nodes draws semi donuts
    ctx.beginPath()
    ctx.fillStyle = color; 
    // we draw two arcs spanning the nodes interval (normalized with the ratio), one layer-width apart and fill in the space 
    ctx.arc(x, y, 2 * LAYER_SIZE + (LAYER_SIZE*(node.depth-1)), node.interval[0]*RATIO, node.interval[1]*RATIO, false); // outer 
    ctx.arc(x, y, 1 * LAYER_SIZE + (LAYER_SIZE*(node.depth-1)), node.interval[1]*RATIO, node.interval[0]*RATIO, true); // inner 
    ctx.fill();
    // the outline width is based on the interval size and the depth (so small intervals and deep nodes have lin outlines)
    ctx.lineWidth = (node.interval[1]*RATIO - node.interval[0]*RATIO) * (5 * node.depth); 
    ctx.strokeStyle = "#000"; // outline color
    ctx.stroke();
  }

  // Returns a color based on the branch and depth
  function get_color(branchNr, depth) {
    const base_colors = [ "#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#34495e", "#d35400", "#c0392b", "#7f8c8d" ];
    const color = base_colors[branchNr];
    const adjustedColor = lightenColor(color, depth);
    return adjustedColor;
  }

  // Function to lighten a color
  function lightenColor(hexColor, lightness) {
    scale = 10 // adjust how much the colors change with depth
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

  function readAndDrawNodesFromFile(filePath) {
    let isPaused = false;
    let index = 0;

    const drawNextNode = () => {
      if (index < lines.length && !isPaused) {
        const line = lines[index];
        try {
          const object = JSON.parse(line);
          drawNode(object);
          index++;

          if (index % 30 === 0) {
              setTimeout(drawNextNode, 0); 
          } else {
              drawNextNode(); // Continue without delay
          }
        } catch (error) {
          console.error('Error parsing line:', line);
          index++;
          drawNextNode(); // Continue with the next node
        }
      }
    };

    // Listen for keypress events
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        isPaused = !isPaused;
        if (!isPaused) {
          // Resume the visualization
          drawNextNode();
        }
      }
    });

    // Fetch and process the file
    fetch(filePath)
      .then(response => response.text())
      .then(data => {
        lines = data.split('\n');
        drawNextNode();
      })
      .catch(error => {
        console.error('Error reading file:', error);
    });
}


  readAndDrawNodesFromFile('transformed_data.txt');
    
});
  