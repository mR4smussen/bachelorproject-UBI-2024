document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("sunburstCanvas");
    const ctx = canvas.getContext("2d");
  
    LAYER_SIZE = 100
    ROOT_INTERVAL = (0, 0)
    RATIO = 0
    
    let x = canvas.width / 2
    let y = canvas.height / 2

    function drawNode(node, root_interval) {


      let color = "red"
      if (node.branchNr)
        color = get_color(node.branchNr, node.depth)


      if (node.status == "root") {

        ROOT_INTERVAL = node.interval
        RATIO = (2*Math.PI) / (ROOT_INTERVAL[1] - ROOT_INTERVAL[0])

        ctx.beginPath();
        ctx.arc(x, y, LAYER_SIZE, 0, 2*Math.PI);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.lineWidth = 0.01; // Increased line width for outline
        ctx.strokeStyle = "#000"; // Stroke color for outline
        ctx.stroke();

        return 
      }

      if (ROOT_INTERVAL == [0,0]) {
        console.error("expected first node to be the root node")
        return
      }

      ctx.beginPath()
      ctx.fillStyle = color;
      ctx.arc(x, y, 2 * LAYER_SIZE + (LAYER_SIZE*(node.depth-1)), node.interval[0]*RATIO, node.interval[1]*RATIO, false); // outer 
      ctx.arc(x, y, 1 * LAYER_SIZE + (LAYER_SIZE*(node.depth-1)), node.interval[1]*RATIO, node.interval[0]*RATIO, true); // inner 
      ctx.fill();
      ctx.lineWidth = (node.interval[1]*RATIO - node.interval[0]*RATIO) * (5 * node.depth); // Increased line width for outline
      ctx.strokeStyle = "#000"; // Stroke color for outline
      ctx.stroke();
    }

  function get_color(base_color, lightnessFactor) {
    const base_colors = [ "#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#34495e", "#d35400", "#c0392b", "#7f8c8d" ];
    const color = base_colors[base_color];
    const adjustedColor = lightenColor(color, lightnessFactor);
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
                drawNode(object, ROOT_INTERVAL);
                index++;

                if (index % 30 === 0) {
                    setTimeout(drawNextNode, 0); // Delay every tenth node (adjust delay as needed)
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
  