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
      color = get_color(node.colorNr, node.depth, true)

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
  function get_color(colorNr, depth, lighten) {
    const base_colors = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#34495e", "#d35400", "#c0392b", "#e16c18"];
    const color = base_colors[colorNr % 9];
    if (!lighten)
      return color
    const adjustedColor = lightenColor(color, (depth < 40 ? depth : 40));
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

  function readAndDrawNodesFromFile_sunburst(filePath) {
    let isPaused = false;
    let index = 0;
    let CHUNK_SIZE = 100;

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

  function approx_parent_interval(root_x, root_y, root_width, root_height, parent_interval) {
    value = 1
    value_gone = 0
    x_frac = 1
    y_frac = 1
    current_x = root_x, current_y = root_y
    current_width = root_width, current_height = root_height
    parent_val = parent_interval[1] - parent_interval[0]
    // as long the parent would fit inside a half of the current square...
    while (value / 2 >= parent_val) {
      value /= 2
      // if width > height we split the box in half vertically 
      if (current_width > current_height) {
        x_frac /= 2
        current_width /= 2
        // if the parent is part of the right split, change the x
        if (parent_interval[0] >= value_gone + value) { 
          value_gone += value
          current_x += current_width
        }
      }
      // otherwise we split the box in half horizontally
      else {
        y_frac /= 2
        current_height /= 2
        // if the parent is part of the bottom split, change the y
        if (parent_interval[0] >= value_gone + value) { 
          value_gone += value
          current_y += current_height
        }
      }
    }
    return {
        "x": current_x,
        "y": current_y,
        "width": current_width,
        "height": current_height
      }
  }

  function draw_treemap(filePath) {

    TREE_COLOR = 8

    // upper left corner of the tree map
    treemap_x = x - canvas.width / 4 
    treemap_y = y - canvas.height / 4

    ctx.fillStyle = get_color(TREE_COLOR, 0, true);
    ctx.fillRect(treemap_x, treemap_y, x, y/2);


    // Fetch and process the file
    fetch(filePath)
    .then(response => response.text())
    .then(data => {
      lines = data.split('\n');
      for (const line of lines) {
        node = JSON.parse(line);

        // the root has no parent interval to work with
        if (!node.parent_interval) {
          continue
        }
        let parent_approx = approx_parent_interval(treemap_x, treemap_y, x, y/2, node.parent_interval)
        
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.strokeRect(parent_approx.x + 0.05*node.depth, parent_approx.y + 0.05*node.depth, parent_approx.width - 0.1*node.depth, parent_approx.height - 0.1*node.depth);
        

        if (node.isLeaf) {
          // slice
          ctx.fillStyle = get_color(TREE_COLOR, node.depth, true);
          ctx.lineWidth = 0.5;
          parent_val = node.parent_interval[1] - node.parent_interval[0]
          node_val = node.interval[1] - node.interval[0]
          if (parent_approx.width > parent_approx.height) {
            width_frac_of_parent = ((node_val / parent_val) * parent_approx.width)
            x_rel_to_parent = (((node.interval[0] - node.parent_interval[0]) / parent_val) * parent_approx.width) + parent_approx.x
            ctx.fillRect(x_rel_to_parent + 0.05*(node.depth+1), parent_approx.y + 0.05*(node.depth+1), width_frac_of_parent - 0.1*node.depth, parent_approx.height - 0.1*(node.depth+1));
            ctx.strokeRect(x_rel_to_parent + 0.05*(node.depth+1), parent_approx.y + 0.05*(node.depth+1), width_frac_of_parent - 0.1*node.depth, parent_approx.height - 0.1*(node.depth+1));
          } 
          else { // dice
            height_frac_of_parent = ((node_val / parent_val) * parent_approx.height)
            y_rel_to_parent = (((node.interval[0] - node.parent_interval[0]) / parent_val) * parent_approx.height) + parent_approx.y
            ctx.fillRect(parent_approx.x + 0.05*(node.depth+1), y_rel_to_parent + 0.05*(node.depth+1), parent_approx.width - 0.1*(node.depth+1), height_frac_of_parent - 0.1*(node.depth+1));
            ctx.strokeRect(parent_approx.x + 0.05*(node.depth+1), y_rel_to_parent + 0.05*(node.depth+1), parent_approx.width - 0.1*(node.depth+1), height_frac_of_parent - 0.1*(node.depth+1));
          }
        }
        
        continue
      }
    })
    .catch(error => {
      console.error('Error reading file:', error);
    });
  }


  draw_treemap('transformed_data.txt')
  // readAndDrawNodesFromFile_sunburst('transformed_data.txt');

});
