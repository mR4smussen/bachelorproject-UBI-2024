// this is combining the initial "parent approx", which had more respect for the sizes (filled the entire tree map better),
// and the bookshelves, which had respect for borders (borders didn't cross each other)
    // This means that the structural information and sizes are somewhat kept (the sizes are still a bit iffy)


// [width, height] for the canvas's
const CANVAS_SIZE_mixed = [1400, 1400]
// const CANVAS_SIZE_mixed = [2000, 1000]
// CANVAS_SIZE_mixed = [4096, 2160] 
// CANVAS_SIZE_mixed = [6500, 6000]

let TREE_COLOR_mixed = "#34495e"

// global var makes sure we only draw the background once
let BACKGROUND_DRAW_mixed = false

// This adds an outline to leafs and fills them - Not pretty 
let COLOR_LEAFS_mixed = false

// LoD - just for testing
let LAYERS_TO_SHOW = 120

// Canvas properties
let ctx, view_width, view_height, treemap_x, treemap_y

// how to respect sizes (round up or down)
const ROUND_SIZE_UP = true

// used for sequencing
let node_queue = []
let queue_drawn = false
let coupon_threshold = Infinity
const ACCURACY = 0.9
let threshold_set = false
let nodes_received = 0
let nodes_in_layers_mix

// independent visualization of a single node
function add_tree_map_node_mixed(node, canvas) {

    if (!threshold_set) {
        threshold_set = true
        nodes_in_layers_mix = Array(120).fill(1)

        // use coupon problem to set the threshhold of how many nodes we need to see before we start to empty the queue and draw the rest of the nodes.
        // 100.000 is just a hardcoded value above of how many nodes we have (we have 36.000)
        for (i = node.total_layers; i <= 100000; i++) {
            if (coupon_problem(node.total_layers, i) >= ACCURACY) {
                coupon_threshold = i
                console.log(`We need to see ${i} nodes before we draw any of them.`)
                console.log(`This gives us >${ACCURACY*100}% chance of having seen all layers`)
                break;
            }
        }
    }
    
    // Gives some controle over level of detail (LoD)
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

    if (nodes_received >= coupon_threshold) {
        draw_node_mix(node)
        if (!queue_drawn) {
            queue_drawn = true
            node_queue.forEach(node => draw_node_mix(node))
        }
    } else {
        nodes_received++
        node_queue.push(node)
        nodes_in_layers_mix[node.depth] = node.nodes_in_own_layer
        nodes_in_layers_mix[node.random_layer] = node.nodes_in_random_layer
    }
}

function draw_node_mix(node) {

    if (nodes_in_layers_mix[node.depth] == 1 && node.depth != 1 ) return 

    // defines the current container - the final container is drawn
    let current_x = treemap_x
    let current_y = treemap_y
    let current_width = view_width
    let current_height = view_height

    // Information about the current/previous splits
    let current_layer_areas = 1
    let current_interval = [0,1]

    // volume of current container compared to the root container
    let value = 1

    // The desired volume of the final container compared to the root container
    let node_val = node.interval[1] - node.interval[0] 

    // slice or dice the current container untill we have a volume that somewhat respects the desired volume.
    for (i = 3; i <= node.depth; i++) {
        if (nodes_in_layers_mix[i] == 1 && i != 1) {
            i++
            continue
        }
        // the volume of the current container compared to the root container
        let current_val = current_interval[1] - current_interval[0]

        // break to respect the size/value of the node
        if (current_val < node_val && ROUND_SIZE_UP)
            break 

        // Computes how many areas this layer consists of - ratio between areas we need and areas in the previous layer
        current_layer_areas = Math.ceil(nodes_in_layers_mix[i] / current_layer_areas) + 1

        // Computes the interval fraction of a single area for this layer
        let splits_frac_of_area = 1 / current_layer_areas

        // Computes the beginning of the interval of the current node in relation to the interval of the current container (to respect borders)
        let normalized_interval_start = ((node.interval[0] - current_interval[0]) / current_val)

        // Either slice or dice the current container
        // if (i % 2 == 0) { // correct slice n dice - not as pretty as the fair cut
        if (current_width > current_height) { // fair cut
            // Divide the container width and value with the amount of new areas we make for this layer
            current_width /= current_layer_areas
            value /= current_layer_areas

            // Computes which area of the current layer the current node should be within
            let area_nr = Math.floor(normalized_interval_start / splits_frac_of_area)

            // Computes the new start and finish of the current containers interval
            current_interval[0] += value * area_nr
            current_interval[1] -= (current_layer_areas - 1 - area_nr) * value

            // Move the x-border to the x-border of the new container
            current_x += area_nr * current_width
        }
        else {
            // Divide the container height and value with the amount of new areas we make for this layer
            current_height /= current_layer_areas
            value /= current_layer_areas

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