document.addEventListener("DOMContentLoaded", () => {
  // Get the canvas
  const canvas = document.getElementById("sunburstCanvas");
  const ctx = canvas.getContext("2d");

  const DATA_FILE = "transformed_data copy.txt"

  // the amount of data the client receives at a time
  var CHUNK_SIZE = 100;
  // pick a chart type: 0 = sunburst, 1 = tree map parent approx, 2 = tree map bookshelves, 3 = icicle, 4 = tree map mix. 5 = squarified
  const CHART_TYPE = 5

  fetch(DATA_FILE)
    .then(response => response.text())
    .then(data => {
      lines = data.split('\n');
      switch (CHART_TYPE) {
        case 0:
          stream_data(lines, CHUNK_SIZE, canvas, draw_sunburst)
          break
        case 1:
          stream_data(lines, CHUNK_SIZE, canvas, draw_tree_map_parrent_approx)
          break
        case 2:
          stream_data(lines, CHUNK_SIZE, canvas, add_tree_map_mult_view_node, check_tree_map_mult_view)
          break
        case 3:
          if (canvas)
            canvas.parentNode.removeChild(canvas)
          stream_data(lines, CHUNK_SIZE, canvas, add_icicle)
          break
        case 4:
          stream_data(lines, CHUNK_SIZE, canvas, add_tree_map_node_mixed)
          break
        case 5:
          stream_data(lines, CHUNK_SIZE, canvas, add_tree_map_node_mixed_squarified)
          break
        default:
          console.log(`chart type can not be ${CHART_TYPE} - either pick 0 (sunburst) or 1 (tree map)`)
      }
    })
    .catch(error => {
      console.error('Error reading file:', error);
    });

});
