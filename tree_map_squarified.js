// this is combining the initial "parent approx", which had more respect for the sizes (filled the entire tree map better),
// and the bookshelves, which had respect for borders (borders didn't cross each other), we we try to make the ratios square with the squarified algorithm


// [width, height] for the canvas's
// const CANVAS_SIZE_sq = [1400, 1400]
const CANVAS_SIZE_sq = [2000, 1000] // good average ratio
// CANVAS_SIZE_sq = [4096, 2160] 
// CANVAS_SIZE_sq = [6500, 6000]

// let TREE_COLOR_sq = "#34495e"
let TREE_COLOR_sq = "#dbdbdb"

// global var makes sure we only draw the background once
let BACKGROUND_DRAW_sq = false

// This adds an outline to leafs and fills them - Not pretty 
let COLOR_LEAFS_sq = false

// LoD - just for testing
let LoD_sq = 120

// how to respect sizes (round up or down)
const ROUND_SIZE_UP_sq = true

const value_threshhold = 0.0005
// const value_threshhold = 0.5
const USE_THRESHHOLD = false

// for sequencing
let node_queue_sq = []
let queue_drawn_sq = false
let coupon_threshold_sq = Infinity
let ACCURACY_sq = 0.9
let threshold_set_sq = false
let nodes_received_sq = 0
let nodes_in_layers_sq
let total_nodes_sq = Infinity

// for evaluation
let seen = 0
let avg_ratio = 0
let weighted_avg_ratio = 0
let undefined_ratios = 0
let mean_area_error = 0
let weighted_mean_area_error = 0
let nodes_visualized = 0

// for eval.
let last_area_number = 0 
let ancestor_area_number = [] // keeps track of which area number a node should pick
let last_node_layer = 0
let estimations_made = 0
let estimations_error_size = 0
let weighted_estimations_error_size = 0
let total_wanted_value = 0
let total_area_drawn = 0

// for eval when running multiple tests
is_running_multiple_tests_sq = false
current_variance_sq = 0
let amounts_of_variances_sq = new Map()
let mean_ar_for_variances_sq = new Map()
let weighted_mean_ar_for_variances_sq = new Map()
let mean_area_error_for_variances_sq = new Map()
let weighted_mean_area_error_for_variances_sq = new Map()
let mean_estimation_error_for_variances_sq = new Map()
let weighted_mean_estimation_error_for_variances_sq = new Map()
let SD_ar_for_variances_sq = new Map() // maps each variance to a list of the means, so that we can compute the SD
let SD_weighted_ar_for_variances_sq = new Map()
let SD_area_for_variances_sq = new Map() // maps each variance to a list of the area errors, so that we can compute the SD
let SD_weighted_area_for_variances_sq = new Map()
let SD_estimation_for_variances_sq = new Map() // maps each variance to a list of the estimation errors, so that we can compute the SD
let SD_weighted_estimation_for_variances_sq = new Map()

// used only for testing / screenshots
const STOP_AFTER_PERC_SQ = 1

function add_tree_map_node_mixed_squarified(node, canvas) {

    let urlParams = new URLSearchParams(window.location.search);
    let guarantee_perc = urlParams.get('guarantee_perc');
    let guarantee_num = urlParams.get('guarantee_num');
    if (guarantee_perc != "") 
        ACCURACY_sq = parseInt(guarantee_perc) / 100
    if (guarantee_num && !threshold_set_sq) {
        threshold_set_sq = true
        nodes_in_layers_sq = Array(node.total_layers + 1).fill(1)
        ancestor_area_number = Array(node.total_layers + 1).fill(1)
        coupon_threshold_sq = guarantee_num
        console.log("Setting the threshold of how many we need to see to", coupon_threshold_sq)
    }
    else if (!threshold_set_sq) {
        threshold_set_sq = true
        nodes_in_layers_sq = Array(node.total_layers + 1).fill(1)
        ancestor_area_number = Array(node.total_layers + 1).fill(1)

        // use coupon problem to set the threshhold of how many nodes we need to see before we start to empty the queue and draw the rest of the nodes.
        // 100.000 is just a hardcoded value above of how many nodes we have (we have 36.000)
        for (i = node.total_layers; i <= 100000; i++) {
            if (coupon_problem(node.total_layers, i) >= ACCURACY_sq) {
                coupon_threshold_sq = i
                    // console.log(`We need to see ${i} nodes before we draw any of them.`)
                    // console.log(`This gives us >${ACCURACY_sq*100}% chance of having seen all layers`)
                break;
            }
        }
    }
    
    // Set the canvas properties once
    if (!BACKGROUND_DRAW_sq) {
        canvas.width = CANVAS_SIZE_sq[0];
        canvas.height = CANVAS_SIZE_sq[1];
        ctx = canvas.getContext("2d")
        view_width = canvas.width
        view_height = canvas.height
        treemap_x = 0
        treemap_y = 0
    }

    // draw the background
    if (!BACKGROUND_DRAW_sq) {
        ctx.fillStyle = TREE_COLOR_sq;
        ctx.fillRect(treemap_x, treemap_y, view_width, view_height);
        BACKGROUND_DRAW_sq = true
    }

    if (nodes_received_sq >= coupon_threshold_sq) {
        draw_node_sq(node)
        if (!queue_drawn_sq) {
            queue_drawn_sq = true
            total_nodes_sq = nodes_in_layers_sq.reduce((accumulator, currentValue) => currentValue != 1 ? accumulator + currentValue : accumulator, 1);
            node_queue_sq.forEach(node => draw_node_sq(node))
        }
    } else {
        nodes_received_sq++
        node_queue_sq.push(node)
        nodes_in_layers_sq[node.depth] = node.nodes_in_own_layer
        nodes_in_layers_sq[node.random_layer] = node.nodes_in_random_layer
    }
}

function draw_node_sq(node) {
    // Gives some controle over level of detail (LoD)
    if(node.depth > LoD_sq) {
        return
    }

    last_area_number = 1
    if (nodes_in_layers_sq[node.depth] != 1 || node.depth == 1 ) nodes_visualized++
    else {
        seen++
        return
    } 
    if (nodes_visualized > total_nodes_sq * STOP_AFTER_PERC_SQ) return 
    setTimeout(() => {
        seen++
        let i = 1
        let current_interval = [0,1]
        let prev_layer_areas = 1
        let next_height = view_height
        let next_width = view_width
        let next_x = treemap_x
        let next_y = treemap_y
        let prev_area_val = 1
        let ratio = view_height / view_width
        let next_value = 1

        // locate where to draw this node
        while (node.interval[1] - node.interval[0] < next_value && i < node.depth) {
            if (nodes_in_layers_sq[i] == 1 && i != 1) {
                i++
                continue
            }
            [next_x, next_y, next_width, next_height, next_value, prev_layer_areas, current_interval, prev_area_val, ratio] = 
            compute_next_container(node.interval, nodes_in_layers_sq[i], current_interval, prev_layer_areas, next_height, next_width, next_x, next_y, prev_area_val, i)
            i++
        }

        // for eval.
        if (node.depth <= last_node_layer) {
            for (let i = node.depth; i <= node.total_layers; i++) {
                ancestor_area_number[i] = 1
            }
        }
        last_node_layer = node.depth
        if (i < node.depth) {
            ancestor_area_number[node.depth] = last_area_number
        }

        // draw the nodes
        if (node.interval[1] - node.interval[0] > value_threshhold || !USE_THRESHHOLD) {
            ctx.strokeStyle = get_color(node.colorNr, node.depth, true);
            // ctx.strokeStyle = "black";
            ctx.lineWidth = 10 * (Math.min(0.2, 10 / node.depth));
            ctx.strokeRect(
                next_x,              // x pos
                next_y,              // y pos
                next_width,          // width
                next_height);        // height 

            ctx.strokeStyle = "black";
            // ctx.lineWidth = 0.5;
            ctx.lineWidth = 8 * (Math.min(0.2, 10 / node.depth));
            ctx.strokeRect( 
                next_x,              // x pos
                next_y,              // y pos
                next_width,          // width
                next_height);        // height 
        }

        // print some evaluation stats
        drawn_value = (next_width * next_height) / (view_width * view_height)
        total_area_drawn += drawn_value
        wanted_value = node.interval[1] - node.interval[0]
        total_wanted_value += wanted_value
        if (wanted_value > drawn_value) {
            mean_area_error += wanted_value / drawn_value - 1
            weighted_mean_area_error += (wanted_value / drawn_value - 1) * wanted_value
        } else {
            mean_area_error += drawn_value / wanted_value - 1
            weighted_mean_area_error += (drawn_value / wanted_value - 1) * wanted_value  
        }

        // fill used for good example graph
        if (node.isLeaf && node.depth > 8) {
            ctx.fillStyle = get_color(node.colorNr, node.depth, true);
            ctx.fillRect(
                next_x,              // x pos
                next_y,              // y pos
                next_width,          // width
                next_height);        // height 
        }

        if (ratio < Infinity) avg_ratio += ratio 
        else undefined_ratios++
        
        weighted_avg_ratio += (next_height > next_width ? 
                                next_height / next_width : 
                                next_width / next_height) * drawn_value

        // for eval:
            // nodes in first 20 layers: 5735
            // nodes in first 40 layers: 23659
            // nodes in first 60 layers: 32979
            // nodes in first 80 layers: 34857
            // nodes in first 100 layers: 35675
            // nodes in all 120 layers: 35960
        if (seen == total_nodes_sq) {
            if (is_running_multiple_tests_sq) {
                let rounded_variance = Math.round(current_variance_sq); 
                if (!amounts_of_variances_sq.get(rounded_variance)) {
                    amounts_of_variances_sq.set(rounded_variance, 0);
                    mean_area_error_for_variances_sq.set(rounded_variance, 0);
                    weighted_mean_area_error_for_variances_sq.set(rounded_variance, 0);
                    mean_estimation_error_for_variances_sq.set(rounded_variance, 0);
                    weighted_mean_estimation_error_for_variances_sq.set(rounded_variance, 0);
                    mean_ar_for_variances_sq.set(rounded_variance, 0);
                    weighted_mean_ar_for_variances_sq.set(rounded_variance, 0);
                }
                
                amounts_of_variances_sq.set(rounded_variance, amounts_of_variances_sq.get(rounded_variance) + 1)
                mean_area_error_for_variances_sq.set(rounded_variance, 
                    mean_area_error_for_variances_sq.get(rounded_variance) + (mean_area_error / seen))
                weighted_mean_area_error_for_variances_sq.set(rounded_variance, 
                    weighted_mean_area_error_for_variances_sq.get(rounded_variance) + (weighted_mean_area_error / total_wanted_value))
    
                mean_estimation_error_for_variances_sq.set(rounded_variance, 
                    mean_estimation_error_for_variances_sq.get(rounded_variance) + (estimations_error_size / estimations_made))
                weighted_mean_estimation_error_for_variances_sq.set(rounded_variance, 
                    weighted_mean_estimation_error_for_variances_sq.get(rounded_variance) + (weighted_estimations_error_size / estimations_made))
    
                mean_ar_for_variances_sq.set(rounded_variance, 
                    mean_ar_for_variances_sq.get(rounded_variance) + (avg_ratio / (seen - undefined_ratios)))
                weighted_mean_ar_for_variances_sq.set(rounded_variance, 
                    weighted_mean_ar_for_variances_sq.get(rounded_variance) + (weighted_avg_ratio / total_area_drawn))
                
                // SD for the AR
                if (SD_ar_for_variances_sq.get(rounded_variance)) {
                    let SD_ar_list = SD_ar_for_variances_sq.get(rounded_variance)
                    SD_ar_list.push(avg_ratio / (seen - undefined_ratios))
                    SD_ar_for_variances_sq.set(rounded_variance, SD_ar_list)
                } else 
                    SD_ar_for_variances_sq.set(rounded_variance, [avg_ratio / (seen - undefined_ratios)])
                

                // SD for the weighted AR
                if (SD_weighted_ar_for_variances_sq.get(rounded_variance)) {
                    let SD_weighted_ar_list = SD_weighted_ar_for_variances_sq.get(rounded_variance)
                    SD_weighted_ar_list.push(weighted_avg_ratio / total_area_drawn)
                    SD_weighted_ar_for_variances_sq.set(rounded_variance, SD_weighted_ar_list)
                } else 
                    SD_weighted_ar_for_variances_sq.set(rounded_variance, [weighted_avg_ratio / total_area_drawn])

                // SD for the area
                if (SD_area_for_variances_sq.get(rounded_variance)) {
                    let SD_area_list = SD_area_for_variances_sq.get(rounded_variance)
                    SD_area_list.push(mean_area_error / seen)
                    SD_area_for_variances_sq.set(rounded_variance, SD_area_list)
                } else 
                    SD_area_for_variances_sq.set(rounded_variance, [mean_area_error / seen])

                // SD for the weighted area
                if (SD_weighted_area_for_variances_sq.get(rounded_variance)) {
                    let SD_weighted_area_list = SD_weighted_area_for_variances_sq.get(rounded_variance)
                    SD_weighted_area_list.push(weighted_mean_area_error / total_wanted_value)
                    SD_weighted_area_for_variances_sq.set(rounded_variance, SD_weighted_area_list)
                } else 
                    SD_weighted_area_for_variances_sq.set(rounded_variance, [weighted_mean_area_error / total_wanted_value])

                // SD for the estimation
                if (SD_estimation_for_variances_sq.get(rounded_variance)) {
                    let SD_estimation_list = SD_estimation_for_variances_sq.get(rounded_variance)
                    SD_estimation_list.push(estimations_error_size / estimations_made)
                    SD_estimation_for_variances_sq.set(rounded_variance, SD_estimation_list)
                } else 
                    SD_estimation_for_variances_sq.set(rounded_variance, [estimations_error_size / estimations_made])

                // SD for the weighted estimation
                if (SD_weighted_estimation_for_variances_sq.get(rounded_variance)) {
                    let SD_weighted_estimation_list = SD_weighted_estimation_for_variances_sq.get(rounded_variance)
                    SD_weighted_estimation_list.push(weighted_estimations_error_size / estimations_made)
                    SD_estimation_for_variances_sq.set(rounded_variance, SD_weighted_estimation_list)
                } else 
                    SD_weighted_estimation_for_variances_sq.set(rounded_variance, [weighted_estimations_error_size / estimations_made])

                console.log(`\n********** PRINTING STATS FOR THE PROGRESSIVE SQUARIFIED TECHNIQUE **********`)
                for (let [key, value] of amounts_of_variances_sq) {
                    
                    let mean_ar = mean_ar_for_variances_sq.get(key) / value
                    let sd_ar = SD_ar_for_variances_sq.get(key).reduce((sum, ar) => { return sum + (ar - mean_ar) ** 2 }, 0) / value;
                    sd_ar = Math.sqrt(sd_ar)

                    let mean_weighted_ar = weighted_mean_ar_for_variances_sq.get(key) / value
                    let sd_weighted_ar = SD_weighted_ar_for_variances_sq.get(key).reduce((sum, weighted_ar) => { return sum + (weighted_ar - mean_weighted_ar) ** 2 }, 0) / value;
                    sd_weighted_ar = Math.sqrt(sd_weighted_ar)

                    let mean_area = mean_area_error_for_variances_sq.get(key) / value
                    let sd_area = SD_area_for_variances_sq.get(key).reduce((sum, area) => { return sum + (area - mean_area) ** 2 }, 0) / value;
                    sd_area = Math.sqrt(sd_area)

                    let mean_weighted_area = weighted_mean_area_error_for_variances_sq.get(key) / value
                    let sd_weighted_area = SD_weighted_area_for_variances_sq.get(key).reduce((sum, weighted_area) => { return sum + (weighted_area - mean_weighted_area) ** 2 }, 0) / value;
                    sd_weighted_area = Math.sqrt(sd_weighted_area)

                    let mean_estimation = mean_estimation_error_for_variances_sq.get(key) / value
                    let sd_estimation = SD_estimation_for_variances_sq.get(key).reduce((sum, estimation) => { return sum + (estimation - mean_estimation) ** 2 }, 0) / value;
                    sd_estimation = Math.sqrt(sd_estimation)

                    let mean_weighted_estimation = weighted_mean_estimation_error_for_variances_sq.get(key) / value
                    let sd_weighted_estimation = SD_estimation_for_variances_sq.get(key).reduce((sum, weighted_estimation) => { return sum + (weighted_estimation - mean_weighted_estimation) ** 2 }, 0) / value;
                    sd_weighted_estimation = Math.sqrt(sd_weighted_estimation)
                    
                    console.log("variance:", key, "amount:", value)
                    
                    console.log("mean area error for variance: " + key + " is " + mean_area);
                    console.log("mean weighted area error for variance: " + key + " is " + mean_weighted_area);
                    console.log("standard deviation for area for variance: " + key + " is " + sd_area)
                    console.log("standard deviation for weighted area for variance: " + key + " is " + sd_weighted_area)

                    console.log("mean estimation error for variance: " + key + " is " + mean_estimation);
                    console.log("mean weighted estimation error for variance: " + key + " is " + mean_weighted_estimation)
                    console.log("standard deviation for estimation error for variance: " + key + " is " + sd_estimation)
                    console.log("standard deviation for weighted estimation error for variance: " + key + " is " + sd_weighted_estimation)
                    

                    console.log("mean AR for variance: " + key + " is " + mean_ar);
                    console.log("mean weighted AR for variance: " + key + " is " + mean_weighted_ar);
                    console.log("standard deviation for AR for variance: " + key + " is " + sd_ar)
                    console.log("standard deviation for weighted AR for variance: " + key + " is " + sd_weighted_ar)
                }

            } else {
                console.log(`\n********** Squarified ESTIMATION for ${seen} nodes **********`)
                // mean area error: avg. of drawn_area vs correct_area
                // weighted mean area error: mean area error weighted with the correct size, so errors for large squares weight more.
                console.log(`mean area: 1:${(mean_area_error / seen).toFixed(3)}`)
                console.log(`weighted mean area: 1:${(weighted_mean_area_error / total_wanted_value).toFixed(3)}`)

                // mean estimation error: We estimate which container to pick when doing logically traversal. This is the avg. of how far off the correct pick we are 
                // weighted mean estimation error: -||-, but divided by how many areas the layer has
                console.log(`mean estimation error: ${(estimations_error_size / estimations_made).toFixed(3)}`)
                console.log(`weighted mean estimation error: ${(weighted_estimations_error_size / estimations_made).toFixed(3)}`)

                // mean aspect ratio: the avg. ratio (the long side divided by the short side) of each rectangle
                // weighted mean aspect ratio: -||-, but multiplied by how large of a portion of the entire canvas the rectangles takes up.
                console.log(`mean aspect ratio 1:${(avg_ratio / (seen - undefined_ratios)).toFixed(3)}`)
                console.log(`weighted mean aspect ratio 1:${(weighted_avg_ratio / total_area_drawn).toFixed(3)}`)

                console.log(`*************************************************`)
            }

            // reset values so we can run the visualization again
            node_queue_sq = []
            queue_drawn_sq = false
            coupon_threshold_sq = Infinity
            threshold_set_sq = false
            nodes_received_sq = 0
            seen = 0
            avg_ratio = 0
            weighted_avg_ratio = 0
            undefined_ratios = 0
            mean_area_error = 0
            weighted_mean_area_error = 0
            nodes_visualized = 0
            last_area_number = 0 
            ancestor_area_number = [] 
            last_node_layer = 0
            estimations_made = 0
            estimations_error_size = 0
            weighted_estimations_error_size = 0
            total_wanted_value = 0
            total_area_drawn = 0

        }
    }, 0)
}

// Finds the next container based on the current container
function compute_next_container(node_interval, layer_size, container_interval, current_layer_areas, container_height, container_width, container_x, container_y, prev_area_val, current_layer_depth = 0) {

    let container_value = +(container_interval[1] - container_interval[0]).toFixed(15)

    // Computes how many areas this layer consists of - ratio between areas we need and areas in the previous layer
    let this_layer_areas = Math.ceil(layer_size / current_layer_areas)

    let mean_node_value = 1/this_layer_areas

    let area_value = prev_area_val / this_layer_areas

    // Computes the beginning of the interval of the current node in relation to the interval of the current container (to respect borders)
    let normalized_interval_start = ((node_interval[0] - container_interval[0]) / container_value) // tofixed?

    // Computes the interval fraction of a single area for this layer
    let splits_frac_of_area = 1 / this_layer_areas

    // Computes which area of the current layer the current node should be within
    let area_nr = Math.floor(+(normalized_interval_start / splits_frac_of_area).toFixed(10)) + 1 // tofixed?

    // for eval.
    last_area_number = area_nr
    estimations_made++
    if (ancestor_area_number[current_layer_depth] != area_nr) {
        // area_nr_errors++
        estimations_error_size += Math.abs(ancestor_area_number[current_layer_depth] - area_nr)
        weighted_estimations_error_size += Math.abs(ancestor_area_number[current_layer_depth] - area_nr) / this_layer_areas
    }

    // The desired volume of the final container compared to the root container
    let stacked = 0
    let current_height = container_height
    let current_width = container_width
    let current_x = container_x
    let current_y = container_y
    let current_interval = container_interval

    let height_current_stack
    let width_current_stack
    let current_direction

    while (stacked <= area_nr - 1) { // while the area we are looking for lies in one of the next stacks
        current_direction = (current_height < current_width ? "Vertical" : "Horizontal")
        let k = 1
        let current_ratio = Infinity
        if (current_direction == "Vertical") { // see how many we can stack vetically
            while (k < this_layer_areas - stacked) { // while there are more areas to stack in this layer
                // compute the ratio of each area in the stack if we added another area
                width_current_stack = current_width / k
                value_of_stack_width = width_current_stack / container_width
                height_current_stack = (mean_node_value / value_of_stack_width) * container_height
                let next_ratio = height_current_stack > width_current_stack ? height_current_stack / width_current_stack : width_current_stack / height_current_stack
                if (Math.abs(next_ratio - 1) > Math.abs(current_ratio - 1) && k >= 2) { // if the ratio got worse -> use the previous stack
                    k-- // we want the previous amount in the stack
                    break
                }
                current_ratio = next_ratio
                k++
            }
            if (stacked + k >= area_nr) { // if we have stacked more than the area nr we are looking for -> we know what container to return
                let nr_in_this_stack = area_nr - stacked
                current_width = current_width / k
                current_height = ((1/this_layer_areas) / (current_width / container_width)) * container_height
                current_x = current_x + (current_width * (nr_in_this_stack-1))
                current_interval[0] = +((current_interval[0] + area_value * (nr_in_this_stack-1)).toFixed(15))
                current_interval[1] = current_interval[0] + area_value
                return [current_x, current_y, current_width, current_height, area_value, this_layer_areas, current_interval, area_value, current_ratio]
            }
            // if the area we are looking for was not in the previous stack:
            stacked += k
            let width_prev_stack = current_width / k
            let height_prev_stack = ((1/this_layer_areas) / (width_prev_stack / container_width)) * container_height
            current_height -= height_prev_stack
            current_y += height_prev_stack
            current_interval[0] += (area_value * k) // remove the part we just stacked-up from the interval
        } else { // see how many we can stack Horizontally
            while (k < this_layer_areas - stacked) { // while there are more areas to stack in this layer
                // compute the ratio of each area in the stack if we added another area
                // the height is just the container height divided between each node
                height_current_stack = current_height / k
                // we divide the value of the container between the nodes 
                value_of_stack_height = height_current_stack / container_height
                width_current_stack = (mean_node_value / value_of_stack_height) * container_width
                let next_ratio = height_current_stack > width_current_stack ? height_current_stack / width_current_stack : width_current_stack / height_current_stack
                if (Math.abs(next_ratio - 1) > Math.abs(current_ratio - 1) && k >= 2) { // if the ratio got worse -> use the previous stack
                    k-- // we want the previous stack
                    break
                }
                current_ratio = next_ratio
                k++
            }
            if (stacked + k >= area_nr) { // if we have stacked more than the area nr we are looking for -> we know what container to return
                let nr_in_this_stack = area_nr - stacked
                current_height /= k
                current_width = ((1/this_layer_areas) / (current_height / container_height)) * container_width
                current_y = current_y + (current_height * (nr_in_this_stack-1))
                current_interval[0] = +((current_interval[0] + area_value * (nr_in_this_stack-1)).toFixed(15))
                current_interval[1] = current_interval[0] + area_value
                return [current_x, current_y, current_width, current_height, area_value, this_layer_areas, current_interval, area_value, current_ratio]
            }
            // if the area we are looking for was not in the previous stack:
            stacked += k
            let height_prev_stack = current_height / k
            let width_prev_stack = ((1/this_layer_areas) / (height_prev_stack / container_height)) * container_width
            current_width -= width_prev_stack
            current_x += width_prev_stack
            current_interval[0] += (area_value * k) // remove the part we just stacked-up from the interval
        }    
    }
}