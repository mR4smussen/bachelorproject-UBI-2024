// this is combining the initial "parent approx", which had more respect for the sizes (filled the entire tree map better),
// and the bookshelves, which had respect for borders (borders didn't cross each other)
    // This means that the structural information and sizes are somewhat kept (the sizes are still a bit iffy)


// [width, height] for the canvas's
const CANVAS_SIZE_mixed = [1400, 1400]
// CANVAS_SIZE_mixed = [4096, 2160] 
// CANVAS_SIZE_mixed = [6500, 6000]

let TREE_COLOR_mixed = "#34495e"

// global var makes sure we only draw the background once
let BACKGROUND_DRAW_mixed = false

// This adds an outline to leafs and fills them - Not pretty 
let COLOR_LEAFS_mixed = false

// LoD - just for testing
let LAYERS_TO_SHOW = 120

// This should be part of the transformation somehow
let nodes_in_layers = [2, 4, 38, 336, 261, 341, 150, 64, 90, 174, 325, 223, 134, 204, 233, 463, 449, 753, 967, 524, 553, 617, 585, 482, 877, 1513, 1464, 569, 526, 374, 656, 504, 594, 2099, 1128, 1662, 929, 1052, 994, 744, 718, 525, 825, 1052, 1568, 1098, 498, 415, 490, 228, 269, 287, 390, 226, 278, 155, 164, 56, 41, 37, 14, 23, 49, 49, 82, 80, 97, 140, 230, 143, 173, 125, 149, 190, 131, 52, 47, 41, 33, 30, 20, 13, 13, 11, 11, 18, 32, 44, 57, 70, 74, 73, 112, 47, 44, 54, 35, 39, 30, 21, 25, 23, 22, 4, 2, 2, 5, 4, 4, 9, 17, 19, 28, 30, 30, 30, 16, 8, 2, 4];
let total_nodes = 35956

// Canvas properties
let ctx, view_width, view_height, treemap_x, treemap_y

// how to respect sizes (round up or down)
const ROUND_SIZE_UP = false

// independent visualization of a single node
function add_tree_map_node_mixed(node, canvas) {
    
    // Gives som controle over level of detail (LoD)
    if(node.depth > LAYERS_TO_SHOW) {
        return
    }

    // Set the canvas properties once
    if (!BACKGROUND_DRAW_mixed) {
        canvas.width = CANVAS_SIZE_mixed[0];
        canvas.height = CANVAS_SIZE_mixed[1];
        ctx = canvas.getContext("2d")
        view_width = canvas.width
        view_height = canvas.height
        treemap_x = view_width - canvas.width
        treemap_y = view_height - canvas.height
    }

    // draw the background
    if (!BACKGROUND_DRAW_mixed) {
        ctx.fillStyle = TREE_COLOR_mixed;
        ctx.fillRect(treemap_x, treemap_y, view_width, view_height);
        BACKGROUND_DRAW_mixed = true
    }

    // defines the current container - the final container is drawn
    let current_x = treemap_x
    let current_y = treemap_y
    let current_width = view_width
    let current_height = view_height

    // Information about the current/previous splits
    let current_layer_areas = 1
    let current_interval = [0,1]

    // Defines the fraction left of different parts
    let value = 1 // volume of current container compared to the root container
    let value_x = 1 // width of current container compared to the root container
    let value_y = 1 // height of current container compared to the root container

    // The desired volume of the final container compared to the root container
    let node_val = node.interval[1] - node.interval[0] 

    // slice or dice the current container untill we have a volume that somewhat respects the desired volume.
    for (i = 2; i <= node.depth; i++) {
        // the volume of the current container compared to the root container
        let current_val = current_interval[1] - current_interval[0]

        // break to respect the size/value of the node
        if (current_val < node_val && ROUND_SIZE_UP)
            break 

        // Computes how many areas this layer consists of - ratio between areas we need and areas in the previous layer
        current_layer_areas = Math.ceil(nodes_in_layers[i] / current_layer_areas) + 1

        // Computes the beginning of the interval of the current node in relation to the interval of the current container (to respect borders)
        normalized_interval_start = ((node.interval[0] - current_interval[0]) / current_val)

        // Either slice or dice the current container
        // if (i % 2 == 0) { // correct slice n dice - not as pretty as the fair cut
        if (current_width > current_height) { // fair cut
            // Computes the interval size of a single area for this layer
            splits_frac_of_area = (value_x / current_layer_areas) / value_x

            // Divide the container width and value with the amount of new areas we make for this layer
            current_width /= current_layer_areas
            value /= current_layer_areas
            value_x /= current_layer_areas

            // Computes which area of the current layer the current node should be within
            area_nr = Math.floor(normalized_interval_start / splits_frac_of_area)

            // Computes the new start and finish of the current containers interval
            current_interval[0] += value * area_nr
            current_interval[1] -= (current_layer_areas - 1 - area_nr) * value

            // Move the x-border to the x-border of the new container
            current_x += area_nr * current_width
        }
        else {
            // Computes the interval size of a single area for this layer
            splits_frac_of_area = (value_y / current_layer_areas) / value_y

            // Divide the container height and value with the amount of new areas we make for this layer
            current_height /= current_layer_areas
            value /= current_layer_areas
            value_y /= current_layer_areas

            // Computes which area of the current layer the current node should be within
            area_nr = Math.floor(normalized_interval_start / splits_frac_of_area)

            // Computes the new start and finish of the current containers interval
            current_interval[0] += value * area_nr
            current_interval[1] -= (current_layer_areas - 1 - area_nr) * value

            // Move the y-border to the y-border of the new container
            current_y += area_nr * current_height
        }
        // break to respect the size/value of the node
        if (current_val < node_val && !ROUND_SIZE_UP)
            break 
    }

    // Make a border for the current node/container
    ctx.strokeStyle = get_color(node.colorNr, node.depth, true);
    ctx.lineWidth = 2;
    ctx.strokeRect(
        current_x,              // x pos
        current_y,              // y pos
        current_width,          // width
        current_height);        // height    

    // If chosen - we draw a black outline for each leaf and fill them with their colors
    if (node.isLeaf && COLOR_LEAFS_mixed) {
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