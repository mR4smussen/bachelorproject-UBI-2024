BACKGROUND_DRAWN = false

function draw_tree_map_parrent_approx(node, canvas, draw_background = false) {

    const x = canvas.width / 2
    const y = canvas.height / 2

    const ctx = canvas.getContext("2d");

    TREE_COLOR = 6

    // upper left corner of the tree map
    treemap_x = x - canvas.width / 4 
    treemap_y = y - canvas.height / 4

    // draw background
    if (!BACKGROUND_DRAWN || draw_background) {
        ctx.fillStyle = get_color(TREE_COLOR, 0, true);
        ctx.fillRect(treemap_x, treemap_y, x, y/2);
        BACKGROUND_DRAWN = true
    }
    

    // the root has no parent interval to work with
    if (!node.parent_interval) {
        return 
    }
    let parent_approx = approx_parent_interval(treemap_x, treemap_y, x, y/2, node.parent_interval, node)
    
    // draw borders
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(
        parent_approx.x + 0.05*node.depth,                // x pos
        parent_approx.y + 0.05*node.depth,                // y pos
        parent_approx.width - 0.1*node.depth,             // width
        parent_approx.height - 0.1*node.depth);           // height
    

    if (node.isLeaf & false) {
        ctx.fillStyle = get_color(node.colorNr, node.depth, true);
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
    } else {
        ctx.strokeStyle = get_color(node.colorNr, node.depth, true);
        ctx.lineWidth = 2;
        parent_val = node.parent_interval[1] - node.parent_interval[0]
        node_val = node.interval[1] - node.interval[0]
        if (parent_approx.width > parent_approx.height) { // slice
            width_frac_of_parent = ((node_val / parent_val) * parent_approx.width)
            x_rel_to_parent = (((node.interval[0] - node.parent_interval[0]) / parent_val) * parent_approx.width) + parent_approx.x
            ctx.strokeRect(
                x_rel_to_parent + 0.05*(node.depth+1),        // x pos
                parent_approx.y + 0.05*(node.depth+1),        // y pos
                width_frac_of_parent - 0.1*node.depth,        // width
                parent_approx.height - 0.1*(node.depth+1));   // height
            ctx.strokeStyle = "black";
            ctx.lineWidth = 0.1;
            ctx.strokeRect(
                x_rel_to_parent + 0.05*(node.depth+1),        // x pos
                parent_approx.y + 0.05*(node.depth+1),        // y pos
                width_frac_of_parent - 0.1*node.depth,        // width
                parent_approx.height - 0.1*(node.depth+1));   // height
        } 
        
        else { // dice
            height_frac_of_parent = ((node_val / parent_val) * parent_approx.height)
            y_rel_to_parent = (((node.interval[0] - node.parent_interval[0]) / parent_val) * parent_approx.height) + parent_approx.y
            ctx.strokeRect(
                parent_approx.x + 0.05*(node.depth+1),        // x pos
                y_rel_to_parent + 0.05*(node.depth+1),        // y pos
                parent_approx.width - 0.1*(node.depth+1),     // width
                height_frac_of_parent - 0.1*(node.depth+1));  // height
            ctx.strokeStyle = "black";
            ctx.lineWidth = 0.1;
            ctx.strokeRect(
                parent_approx.x + 0.05*(node.depth+1),        // x pos
                y_rel_to_parent + 0.05*(node.depth+1),        // y pos
                parent_approx.width - 0.1*(node.depth+1),     // width
                height_frac_of_parent - 0.1*(node.depth+1));  // height
        }
    }
}


function approx_parent_interval(root_x, root_y, root_width, root_height, parent_interval, node) {
    value = 1
    value_gone = 0
    x_frac = 1
    y_frac = 1
    current_x = root_x, current_y = root_y
    current_width = root_width, current_height = root_height
    parent_val = parent_interval[1] - parent_interval[0]
    // as long the parent would fit inside a half of the current square...
    last_split = current_width > current_height ? "horizontal" : "vertical"
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
            last_split = "horizontal"
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
            last_split = "vertical"
        }
    }

    // node_val = node.interval[1] - node.interval[0]
    // if (current_width > current_height) {
    //     width_frac_of_box = ((node_val / value) * current_width)
    //     current_width = width_frac_of_box
    //     current_x = current_x + node.interval[0] - ((current_x - root_x) * value)
    //     // current_x = current_x + (node.interval[0] * value * width_frac_of_box)
    // } else {
    //     height_frac_of_box = ((node_val / value) * current_height)
    //     current_height = height_frac_of_box
    //     current_y = current_y + node.interval[0] - ((current_y - root_y) * value)
    //     // current_y = current_y + (node.interval[0] *  value * height_frac_of_box)
    // }

    return {
        "x": current_x,
        "y": current_y,
        "width": current_width,
        "height": current_height
    }
}