// we can visualize the amount we can store in memory "correctly" this way.
    // the structural information is kept, but the size is still a bit iffy

// hvis ikke vi skulle lave en approximering (dvs. noder indeholder info omkring hvor mange i hvert lag samt hvor mange totalt.)
// kan vi placerer alle i samme view (uden overlap?)


// [width, height] for the canvas's
// CANVAS_SIZE = [1000, 1000]
CANVAS_SIZE = [4096, 2160]
// CANVAS_SIZE = [6500, 6000]

TREE_COLOR = "#34495e"

BACKGROUND_DRAW = false

// modifications
COLOR_LEAFS = false

// Just for testing
LAYERS_TO_SHOW = 120

// This should be part of the transformation if it works
nodes_in_layers = [2, 4, 38, 336, 261, 341, 150, 64, 90, 174, 325, 223, 134, 204, 233, 463, 449, 753, 967, 524, 553, 617, 585, 482, 877, 1513, 1464, 569, 526, 374, 656, 504, 594, 2099, 1128, 1662, 929, 1052, 994, 744, 718, 525, 825, 1052, 1568, 1098, 498, 415, 490, 228, 269, 287, 390, 226, 278, 155, 164, 56, 41, 37, 14, 23, 49, 49, 82, 80, 97, 140, 230, 143, 173, 125, 149, 190, 131, 52, 47, 41, 33, 30, 20, 13, 13, 11, 11, 18, 32, 44, 57, 70, 74, 73, 112, 47, 44, 54, 35, 39, 30, 21, 25, 23, 22, 4, 2, 2, 5, 4, 4, 9, 17, 19, 28, 30, 30, 30, 16, 8, 2, 4];
total_nodes = 35956


// this just adds a node to one of the queues
function add_tree_map_node_mixed(node, canvas) {
    if(node.depth > LAYERS_TO_SHOW) {
        return
    }
    if (!BACKGROUND_DRAW) {
        canvas.width = CANVAS_SIZE[0];
        canvas.height = CANVAS_SIZE[1];
    }

    const ctx = canvas.getContext("2d");

    const view_width = canvas.width
    const view_height = canvas.height

    treemap_x = view_width - canvas.width
    treemap_y = view_height - canvas.height

    if (!BACKGROUND_DRAW) {
        ctx.fillStyle = TREE_COLOR;
        ctx.fillRect(treemap_x, treemap_y, view_width, view_height);
        BACKGROUND_DRAW = true
    }
    current_x = treemap_x
    current_y = treemap_y
    current_width = view_width
    current_height = view_height
    current_layer_areas = 1
    current_interval = [0,1]

    value = 1        
    value_x = 1
    value_y = 1
    node_val = node.interval[1] - node.interval[0]

    for (i = 2; i <= node.depth; i++) {
        current_val = current_interval[1] - current_interval[0]
        if (!current_val || current_val < node_val)
            break // break to respect the size/value of the node

        current_layer_areas = Math.ceil(nodes_in_layers[i] / current_layer_areas) + 1

        if (current_width > current_height) {
            node_frac_of_area = ((node.interval[0] - current_interval[0]) / current_val)

            splits_frac_of_area = (value_x / current_layer_areas) / value_x

            current_width /= current_layer_areas
            
            split_nr = Math.floor(node_frac_of_area / splits_frac_of_area)
            value /= current_layer_areas
            current_interval[0] += value * split_nr
            current_interval[1] -= (current_layer_areas - 1 - split_nr) * value
            value_x /= current_layer_areas

            current_x += split_nr * current_width
        }
        else {
            node_frac_of_area = ((node.interval[0] - current_interval[0]) / current_val)
            splits_frac_of_area = (value_y / current_layer_areas) / value_y

            current_height /= current_layer_areas
            
            split_nr = Math.floor(node_frac_of_area / splits_frac_of_area)

            value /= current_layer_areas
            current_interval[0] += value * split_nr
            current_interval[1] -= (current_layer_areas - 1 - split_nr) * value
            value_y /= current_layer_areas

            current_y += split_nr * current_height
        }
    }

    ctx.strokeStyle = get_color(node.colorNr, node.depth, true);
    ctx.lineWidth = 2;

    ctx.strokeRect(
        current_x,              // x pos
        current_y,              // y pos
        current_width,          // width
        current_height);        // height    

    if (node.isLeaf && COLOR_LEAFS) {
        ctx.fillStyle = get_color(node.colorNr, node.depth, true);
        ctx.fillRect(
            current_x,              // x pos
            current_y,              // y pos
            current_width,          // width
            current_height);        // height   

        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.strokeRect( 
            current_x,              // x pos
            current_y,              // y pos
            current_width,          // width
            current_height);        // height  
    }  
    
}