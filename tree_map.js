BACKGROUND_DRAWN = false

function draw_tree_map(node, canvas) {

    const x = canvas.width / 2
    const y = canvas.height / 2

    const ctx = canvas.getContext("2d");

    TREE_COLOR = 7

    // upper left corner of the tree map
    treemap_x = x - canvas.width / 4 
    treemap_y = y - canvas.height / 4

    // draw background
    if (!BACKGROUND_DRAWN) {
        ctx.fillStyle = get_color(TREE_COLOR, 0, true);
        ctx.fillRect(treemap_x, treemap_y, x, y/2);
        BACKGROUND_DRAWN = true
    }
    

    // the root has no parent interval to work with
    if (!node.parent_interval) {
        return 
    }
    let parent_approx = approx_parent_interval(treemap_x, treemap_y, x, y/2, node.parent_interval)
    
    // draw borders
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(
        parent_approx.x + 0.05*node.depth,                // x pos
        parent_approx.y + 0.05*node.depth,                // y pos
        parent_approx.width - 0.1*node.depth,             // width
        parent_approx.height - 0.1*node.depth);           // height
    

    if (node.isLeaf) {
        ctx.fillStyle = get_color(TREE_COLOR, node.depth, true);
        ctx.lineWidth = 0.5;
        parent_val = node.parent_interval[1] - node.parent_interval[0]
        node_val = node.interval[1] - node.interval[0]
        if (parent_approx.width > parent_approx.height) { // slice
            width_frac_of_parent = ((node_val / parent_val) * parent_approx.width)
            x_rel_to_parent = (((node.interval[0] - node.parent_interval[0]) / parent_val) * parent_approx.width) + parent_approx.x
            ctx.fillRect(
                x_rel_to_parent + 0.05*(node.depth+1),        // x pos
                parent_approx.y + 0.05*(node.depth+1),        // y pos
                width_frac_of_parent - 0.1*node.depth,        // width
                parent_approx.height - 0.1*(node.depth+1));   // height
            ctx.strokeRect(
                x_rel_to_parent + 0.05*(node.depth+1),        // x pos
                parent_approx.y + 0.05*(node.depth+1),        // y pos
                width_frac_of_parent - 0.1*node.depth,        // width
                parent_approx.height - 0.1*(node.depth+1));   // height
        } 
        else { // dice
            height_frac_of_parent = ((node_val / parent_val) * parent_approx.height)
            y_rel_to_parent = (((node.interval[0] - node.parent_interval[0]) / parent_val) * parent_approx.height) + parent_approx.y
            ctx.fillRect(
                parent_approx.x + 0.05*(node.depth+1),        // x pos
                y_rel_to_parent + 0.05*(node.depth+1),        // y pos 
                parent_approx.width - 0.1*(node.depth+1),     // width
                height_frac_of_parent - 0.1*(node.depth+1));  // height
            ctx.strokeRect(
                parent_approx.x + 0.05*(node.depth+1),        // x pos
                y_rel_to_parent + 0.05*(node.depth+1),        // y pos
                parent_approx.width - 0.1*(node.depth+1),     // width
                height_frac_of_parent - 0.1*(node.depth+1));  // height
        }
    }
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