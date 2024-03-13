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

// this just adds a node to one of the queues
function add_tree_map_mult_view_node(node, canvas) {

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
    for (i = 2; i <= highest_layer_number; i++) {
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

    if (total_node_amount > next_10p) {
        ten_percentages.push(next_10p)
        views_drawn++;
        last_drawn_at = total_node_amount
        console.log("draw view:", views_drawn, "after", total_node_amount, "nodes")
    }  else if (total_node_amount > last_drawn_at + mean_of_10p && mean_of_10p > 0) {
        views_drawn++;
        last_drawn_at = total_node_amount
        ten_percentages.push(total_node_amount)
        console.log("draw view:", views_drawn, "after", total_node_amount, "nodes")
    }


    // const x = canvas.width / 2
    // const y = canvas.height / 2
    // const ctx = canvas.getContext("2d");

    // TREE_COLOR = 6

    // // upper left corner of the tree map
    // treemap_x = x - canvas.width / 4 
    // treemap_y = y - canvas.height / 4

    // // draw background
    // if (!BACKGROUND_DRAWN) {
    //     ctx.fillStyle = get_color(TREE_COLOR, 0, true);
    //     ctx.fillRect(treemap_x, treemap_y, x, y/2);
    //     BACKGROUND_DRAWN = true
    // }

}
