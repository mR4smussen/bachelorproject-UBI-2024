// keeps track of how many views has been drawn
views_drawn = 0

// used to determine when to draw a new view
last_drawn_at = 0
ten_percentages = []

// the percentage of all nodes we want in each view
p = 0.1

// queues used for odd and even view numbers
// so the first p% of the nodes go in even_queue (because they are part of the view number 0),
// and the next p% go in the odd queue, and so on... 
even_queue = []
odd_queue = []

// keeps the amount of nodes we have seen in a layer (index "i" is layer "i")
nodes_in_layers_ctr = []
// keeps how much of the interval we have seen of a specific layer
interval_of_layers = []

// keeps the amount of different layers we have seen 
// kept in a set, so we can just add each layer we see and have no duplicates
layers_seen = new Set();

// keeps track of how many nodes we have seen in total (used for the german tank problem)
total_node_amount = 0;

// estimates for how many layers the data has and how many nodes for each layers
// the different visualizations are based on these estimates
total_layers_approx = 0
total_nodes_in_layers_approx = []

// [width, height] for the canvas's
CANVAS_SIZE = [4096, 2160]
// CANVAS_SIZE = [6500, 6000]

TREE_COLOR = "#34495e"

BACKGROUND_DRAW = false

// modifications
COLOR_LEAFS = false
STACK_VIEWS = true

// this just adds a node to one of the queues
function add_tree_map_mult_view_node(node, canvas) {
    if (node.interval[1] - node.interval[0] >= 0.005 || true) {
        if (views_drawn % 2 == 0) {
            even_queue.push(node)
        } else {
            odd_queue.push(node)
        }

        if (nodes_in_layers_ctr[node.depth]) {
            nodes_in_layers_ctr[node.depth] += 1;
            interval_of_layers[node.depth] += node.interval[1] - node.interval[0];
        } else {
            layers_seen.add(node.depth)
            nodes_in_layers_ctr[node.depth] = 1;
            interval_of_layers[node.depth] = node.interval[1] - node.interval[0];
        }
        total_node_amount += 1
    }
}

// Here we approximate the size of the layers and the amount of layers to get an idea of how much data we have in total
// and if we are more than (views_drawn + 1)*p% through the data we start visualizing the next view
function check_tree_map_mult_view() {

    // finds the highest layer number (used for the german tank problem)
    highest_layer_number = 0
    layers_seen.forEach (function(layer_number) {
        if (layer_number > highest_layer_number)
            highest_layer_number = layer_number
    })

    // german tank problem (højeste tal + gennemsnitlige mellemrum i sekvensen, minus 1)
    // we might not even need this approximation
    total_layers_approx = highest_layer_number + highest_layer_number / layers_seen.size - 1


    total_nodes_in_layers_approx[1] = 1 // we expect a unique root
    for (i = 2; i <= total_layers_approx; i++) {
        if (nodes_in_layers_ctr[i]) {
            child_parent_ratio = nodes_in_layers_ctr[i] / (nodes_in_layers_ctr[i-1] ? nodes_in_layers_ctr[i-1] : 1) // this could be better than just "1" as default
            total_nodes_in_layers_approx[i] = Math.ceil(child_parent_ratio * total_nodes_in_layers_approx[i-1])
        } else {
            // if we haven't seen a node in this layer - just copy from the parent for now 
            total_nodes_in_layers_approx[i] = total_nodes_in_layers_approx[i-1] 
        }
    }

    total_nodes_approx = 0
    for (i = 1; i <  total_nodes_in_layers_approx.length; i++) {
        total_nodes_approx += total_nodes_in_layers_approx[i]
    }

    next_10p = last_drawn_at + (total_nodes_approx * (0.1 * (views_drawn+1)))

    sum_of_10p = 0
    for (i = 1; i <  ten_percentages.length; i++) {
        sum_of_10p += ten_percentages[i]
    }

    mean_of_10p = 0
    if (sum_of_10p)
        mean_of_10p = sum_of_10p / ten_percentages.length

    // if (total_node_amount > next_10p) {
    // if (total_node_amount > (36000*(0.1*(views_drawn + 1)))) {
    if (views_drawn % 2 == 0 ? even_queue.length : odd_queue.length > 3600) {
        views_drawn++;
        setTimeout(() => {
            ten_percentages.push(next_10p)
            last_drawn_at = total_node_amount
            if (views_drawn-1 % 2 == 0 && even_queue.length > 3600) {
                draw_next_view(even_queue, total_nodes_in_layers_approx)
                even_queue = []
            } else if(odd_queue.length > 3600) {
                draw_next_view(odd_queue, total_nodes_in_layers_approx)
                odd_queue = []
            }
        }, 0)
    // }  else if (total_node_amount > last_drawn_at + mean_of_10p && mean_of_10p > 0) {
    }  else if (false) {
        views_drawn++;
        last_drawn_at = total_node_amount
        ten_percentages.push(total_node_amount)
        setTimeout(() => {
            if (views_drawn-1 % 2 == 0) {
                draw_next_view(even_queue, total_nodes_in_layers_approx)
                even_queue = []
            } else {
                draw_next_view(odd_queue, total_nodes_in_layers_approx)
                odd_queue = []
            }
            
        }, 0)
    }
}

function draw_next_view(nodes, layer_size_approximations) {

    const canvas = document.getElementById("sunburstCanvas");
    if (canvas)
        canvas.parentNode.removeChild(canvas)
    // Create a div element
    const view_div = document.createElement('div');
    view_div.classList.add('canvas-container');

    // Create a canvas element
    const view_canvas = document.createElement('canvas');
    view_canvas.width = CANVAS_SIZE[0];
    view_canvas.height = CANVAS_SIZE[1];

    // Append the canvas to the div
    view_div.appendChild(view_canvas);

    if (STACK_VIEWS) {
        view_div.style.position = 'absolute';
        view_div.style.left = 0 + 'px';
        view_div.style.top = 0 + 'px';
    }

    // Append the div to the body of the page
    document.body.appendChild(view_div);

    const ctx = view_canvas.getContext("2d");

    const view_width = view_canvas.width
    const view_height = view_canvas.height

    treemap_x = view_width - view_canvas.width
    treemap_y = view_height - view_canvas.height

    if (!BACKGROUND_DRAW) {
        ctx.fillStyle = TREE_COLOR;
        ctx.fillRect(treemap_x, treemap_y, view_width, view_height);
        if (STACK_VIEWS)
            BACKGROUND_DRAW = true
    }


    nodes.forEach((node) => {
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
            if (!current_val)
                break // makes sure we don't divide by 0 when the value becomes too small

            current_layer_areas = Math.ceil(layer_size_approximations[i] / current_layer_areas) + 1

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
        ctx.lineWidth = 5;

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
             
    })
}
