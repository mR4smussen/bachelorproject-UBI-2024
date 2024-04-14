function draw_sunburst(node, canvas) {

    const ctx = canvas.getContext("2d");

    const LAYER_SIZE = 20

    // the ratio between 1 value in an interval and 1 degree on the circle.
    const RATIO = 2 * Math.PI
  
    // center position 
    const x = canvas.width / 2
    const y = canvas.height / 2

    let color

    if (node.colorNr)
        color = get_color(node.colorNr, node.depth, true)

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