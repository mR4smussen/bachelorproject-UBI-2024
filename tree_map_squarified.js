// this is combining the initial "parent approx", which had more respect for the sizes (filled the entire tree map better),
// and the bookshelves, which had respect for borders (borders didn't cross each other), we we try to make the ratios square with the squarified algorithm


// [width, height] for the canvas's
const CANVAS_SIZE_sq = [1400, 1400]
// CANVAS_SIZE_sq = [4096, 2160] 
// CANVAS_SIZE_sq = [6500, 6000]

let TREE_COLOR_sq = "#34495e"

// global var makes sure we only draw the background once
let BACKGROUND_DRAW_sq = false

// This adds an outline to leafs and fills them - Not pretty 
let COLOR_LEAFS_sq = false

// LoD - just for testing
let LAYERS_TO_SHOW_sq = 150

// This should be part of the transformation somehow
let nodes_in_layers__sq = [2, 4, 38, 336, 261, 341, 150, 64, 90, 174, 325, 223, 134, 204, 233, 463, 449, 753, 967, 524, 553, 617, 585, 482, 877, 1513, 1464, 569, 526, 374, 656, 504, 594, 2099, 1128, 1662, 929, 1052, 994, 744, 718, 525, 825, 1052, 1568, 1098, 498, 415, 490, 228, 269, 287, 390, 226, 278, 155, 164, 56, 41, 37, 14, 23, 49, 49, 82, 80, 97, 140, 230, 143, 173, 125, 149, 190, 131, 52, 47, 41, 33, 30, 20, 13, 13, 11, 11, 18, 32, 44, 57, 70, 74, 73, 112, 47, 44, 54, 35, 39, 30, 21, 25, 23, 22, 4, 2, 2, 5, 4, 4, 9, 17, 19, 28, 30, 30, 30, 16, 8, 2, 4];
let total_nodes__sq = 35956

// Canvas properties already declared in tree_map_mix
// let ctx, view_width, view_height, treemap_x, treemap_y

// how to respect sizes (round up or down)
const ROUND_SIZE_UP_sq = false

nodes_in_layers__sq = [1, 10, 19, 3];


const MAKE_SQ = false

// used to print the average ratio
let seen = 0
let avg_ratio = 0
let undefined_ratios = 0

function add_tree_map_node_mixed_squarified(node, canvas) {
    // Gives som controle over level of detail (LoD)
    if(node.depth > LAYERS_TO_SHOW_sq) {
        return
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

    setTimeout(() => {
        let i = 1
        let current_interval = [0,1]
        let prev_layer_areas = 1
        let next_height = view_height
        let next_width = view_width
        let next_x = treemap_x
        let next_y = treemap_y
        let prev_area_val = 1
        let ratio
        let next_value = 1
        while (node.interval[1] - node.interval[0] < next_value && i < node.depth) {
            [next_x, next_y, next_width, next_height, next_value, prev_layer_areas, current_interval, prev_area_val, ratio] = 
            compute_next_container(node.interval, nodes_in_layers__sq[i], current_interval, prev_layer_areas, next_height, next_width, next_x, next_y, prev_area_val)
            
            // console.log(next_x, next_y, next_width, next_height, next_value, current_interval)
            i++
        }
        // console.log("drawing a", next_width, "x", next_height, "sq at (", next_x, ",", next_y, ")")
        
           
        // console.log(ratio)
        if (Math.abs(ratio - 1) < 1 || !MAKE_SQ) {
            ctx.strokeStyle = get_color(node.colorNr, node.depth, true);
            ctx.lineWidth = 1;
            ctx.strokeRect(
                next_x,              // x pos
                next_y,              // y pos
                next_width,          // width
                next_height);        // height 
        }

        // print the average ratio
        seen++
        if (seen != 35956) {
            if (ratio)
                avg_ratio += ratio
            else 
                undefined_ratios++
        } else {
            console.log(`average ratio: 1:${(avg_ratio / (seen- undefined_ratios)).toFixed(3)}`)
        }
    }, 0)
}

// Finds the next container based on the current container
function compute_next_container(node_interval, 
                                layer_size,
                                container_interval, 
                                current_layer_areas,
                                container_height,
                                container_width,
                                container_x,
                                container_y,
                                prev_area_val) {


    
    let container_value = +(container_interval[1] - container_interval[0]).toFixed(15)

    // Computes how many areas this layer consists of - ratio between areas we need and areas in the previous layer
    let this_layer_areas = Math.ceil(layer_size / current_layer_areas)
    // console.log("areas:", this_layer_areas  )

    let area_value = prev_area_val / this_layer_areas
    // console.log("avalue:", area_value)

    // Computes the beginning of the interval of the current node in relation to the interval of the current container (to respect borders)
    let normalized_interval_start = ((node_interval[0] - container_interval[0]) / container_value) // tofixed?
    // console.log("node int0, cont. int0, cont. val:", node_interval[0], container_interval[0], container_value)
    // console.log("norm int:", normalized_interval_start)

    // Computes the interval fraction of a single area for this layer
    let splits_frac_of_area = 1 / this_layer_areas

    // Computes which area of the current layer the current node should be within
    let area_nr = Math.floor(+(normalized_interval_start / splits_frac_of_area).toFixed(10)) + 1 // tofixed?
    // if (area_nr < 1)
    //     area_nr = 1
    // console.log("non-rounded area:", (+(normalized_interval_start / splits_frac_of_area).toFixed(10)) + 1)
    // console.log("area nr:", area_nr, "out of total areas:", this_layer_areas)
    // console.log("areas this layer:", this_layer_areas)

    // The desired volume of the final container compared to the root container
    let node_val = node_interval[1] - node_interval[0] 

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
                height_current_stack = ((1/this_layer_areas) / (width_current_stack / container_width)) * container_height
                let next_ratio = height_current_stack / width_current_stack
                if (Math.abs(next_ratio - 1) > Math.abs(current_ratio - 1)) { // if the ratio got worse -> use the previous stack
                    k-- // we want the previous amount in the stack
                    break
                }
                current_ratio = next_ratio
                k++
            }
            if (stacked + k >= area_nr) { // if we have stacked more than the area nr we are looking for -> we know what container to return
                let nr_in_this_stack = (area_nr) - stacked
                // console.log("(vert.) area_nr, stacked, nr_in_this_stack:", area_nr, stacked, nr_in_this_stack)
                let next_y = current_y
                let width_prev_stack = (k > 0 ? current_width / k : current_width)
                let height_prev_stack = ((1/this_layer_areas) / (width_prev_stack / container_width)) * container_height
                let next_x = current_x + (width_prev_stack * (nr_in_this_stack-1))
                let next_width = width_prev_stack
                let next_height = height_prev_stack
                let next_value = area_value
                current_interval[0] = +(current_interval[0] + area_value * (nr_in_this_stack-1)).toFixed(15)
                // console.log("area val:", area_value)
                // console.log("setting current int0:", +(current_interval[0] + area_value * (nr_in_this_stack-1)).toFixed(15))
                current_interval[1] = current_interval[0] + next_value
                // console.log("returning vertically split", next_x, next_y, next_width, next_height)
                return [next_x, next_y, next_width, next_height, next_value, this_layer_areas, current_interval, area_value, current_ratio]
            }
            // if the area we are looking for was not in the previous stack:
            stacked += k
            let width_prev_stack = (k > 0 ? current_width / k : current_width)
            let height_prev_stack = ((1/this_layer_areas) / (width_prev_stack / container_width)) * container_height
            current_height -= height_prev_stack
            current_y += height_prev_stack
            current_interval[0] += (area_value * k) // remove the part we just stacked-up from the interval
        } else { // see how many we can stack Horizontally
            while (k < this_layer_areas - stacked) { // while there are more areas to stack in this layer
                // compute the ratio of each area in the stack if we added another area
                height_current_stack = current_height / k
                width_current_stack = ((1/this_layer_areas) / (height_current_stack / container_height)) * container_width
                let next_ratio = height_current_stack / width_current_stack
                if (Math.abs(next_ratio - 1) > Math.abs(current_ratio - 1)) { // if the ratio got worse -> use the previous stack
                    k-- // we want the previous amount in the stack
                    break
                }
                current_ratio = next_ratio
                k++
            }
            if (stacked + k >= area_nr) { // if we have stacked more than the area nr we are looking for -> we know what container to return
                let nr_in_this_stack = (area_nr) - stacked
                // console.log("area_nr, stacked, nr_in_this_stack:", area_nr, stacked, nr_in_this_stack)
                let next_x = current_x
                let height_prev_stack = (k > 0 ? current_height / k : current_height)
                let width_prev_stack = ((1/this_layer_areas) / (height_prev_stack / container_height)) * container_width
                let next_y = current_y + (height_prev_stack * (nr_in_this_stack-1))
                // console.log("xd:", nr_in_this_stack, current_y)
                let next_width = width_prev_stack
                let next_height = height_prev_stack
                let next_value = area_value
                current_interval[0] = +(current_interval[0] + area_value * (nr_in_this_stack-1)).toFixed(15)
                current_interval[1] = current_interval[0] + next_value
                // console.log(next_y)
                // console.log("returning horizontal split", next_x, next_y, next_width, next_height, current_interval[0])
                return [next_x, next_y, next_width, next_height, next_value, this_layer_areas, current_interval, area_value, current_ratio]
            }
            // if the area we are looking for was not in the previous stack:
            stacked += k
            // TODO - move all the prev. stuf to the break section
            let height_prev_stack = (k > 0 ? current_height / k : current_height)
            let width_prev_stack = (area_value / (height_prev_stack / container_height)) * container_width
            current_width -= width_prev_stack
            current_x += width_prev_stack
            current_interval[0] += (area_value * (k)) // remove the part we just stacked-up from the interval
        }    
    }
}