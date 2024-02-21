document.addEventListener("DOMContentLoaded", () => {
  // Get the canvas
  const canvas = document.getElementById("sunburstCanvas");
  const ctx = canvas.getContext("2d");

  // This can be changed to scale the entire chart
  LAYER_SIZE = 30

  // the ratio between 1 value in an interval and 1 degree on the circle.
  RATIO = 2 * Math.PI

  // center position 
  let x = canvas.width / 2
  let y = canvas.height / 2

  // Function that draws a single 
  function drawNode(node) {

    // default color for first three layers. 
    let color = "green"

    // Gets a color based on the branch (from the third layer, and then the lightness is chosen by the depth)
    if (node.colorNr)
      color = get_color(node.colorNr, node.depth)

    // the root node just draws a circle
    if (node.status == "root") {

      // draw a circle
      ctx.beginPath();
      ctx.arc(x, y, LAYER_SIZE, 0, 2 * Math.PI);
      ctx.fillStyle = "black";
      ctx.fill();
      ctx.lineWidth = 0.01; // outline width
      ctx.strokeStyle = "#000"; // outline color
      ctx.stroke();

      return
    }


    // Non-root nodes draws semi donuts
    ctx.beginPath()
    ctx.fillStyle = color;
    // we draw two arcs spanning the nodes interval (normalized with the ratio), one layer-width apart and fill in the space 
    ctx.arc(x, y, 2 * LAYER_SIZE + (LAYER_SIZE * (node.depth - 1)), node.interval[0] * RATIO, node.interval[1] * RATIO, false); // outer 
    ctx.arc(x, y, 1 * LAYER_SIZE + (LAYER_SIZE * (node.depth - 1)), node.interval[1] * RATIO, node.interval[0] * RATIO, true); // inner 
    ctx.fill();
    // the outline width is based on the interval size
    ctx.lineWidth = Math.max((node.interval[1] * RATIO - node.interval[0] * RATIO), 0.5);
    ctx.strokeStyle = "#000"; // outline color
    ctx.stroke();
  }

  // Returns a color based on the branch and depth
  function get_color(colorNr, depth) {
    const base_colors = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#34495e", "#d35400", "#c0392b", "#7f8c8d"];
    const color = base_colors[colorNr % 9];
    const adjustedColor = lightenColor(color, depth);
    return adjustedColor;
  }

  // Function to lighten a color
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

  function readAndDrawNodesFromFile(filePath) {
    let isPaused = false;
    let index = 0;
    let CHUNK_SIZE = 1000;

    const drawNextNode = () => {
      if (index < lines.length && !isPaused) {
        setTimeout(() => {
        const chunk = lines.slice(index, index + CHUNK_SIZE)
        chunk.forEach(line => {
          try {
            const object = JSON.parse(line);
            drawNode(object);
          } catch (error) {
            console.error('Error parsing line:', line);
          }
        })
        index = index + CHUNK_SIZE;
        drawNextNode(); 
        }, 0) // just makes sure we handle a chunk at a time, otherwise the async form of JS will mess it up
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
