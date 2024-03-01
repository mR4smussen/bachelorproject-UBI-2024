document.addEventListener("DOMContentLoaded", () => {
  // Get the canvas
  const canvas = document.getElementById("sunburstCanvas");
  const ctx = canvas.getContext("2d");

  const DATA_FILE = "transformed_data.txt"

  // the amount of data the client receives at a time
  var CHUNK_SIZE = 100;
  // pick a chart type: 0 = sunburst, 1 = tree map
  const CHART_TYPE = 1

  fetch(DATA_FILE)
    .then(response => response.text())
    .then(data => {
      lines = data.split('\n');
      switch (CHART_TYPE) {
        case 0:
          console.log("test")
          stream_data(lines, CHUNK_SIZE, canvas, draw_sunburst)
          break
        case 1:
          stream_data(lines, CHUNK_SIZE, canvas, draw_tree_map)
          break
        default:
          console.log(`chart type can not be ${CHART_TYPE} - either pick be 0 (sunburst) or 1 (tree map)`)
      }
    })
    .catch(error => {
      console.error('Error reading file:', error);
    });

});
