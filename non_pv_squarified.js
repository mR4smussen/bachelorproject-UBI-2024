// this switches the layout on/off
let ON = true;

// const CANVAS_SIZE_nopv = [1500, 1000] // the ratio of the example from the paper
const CANVAS_SIZE_nopv = [2000, 1000] 
// const CANVAS_SIZE_nopv = [1000, 2000] 
// const CANVAS_SIZE_nopv = [1000, 1000] 

// for the evaluation
let total_amount_nopv = 0
let avg_ratio_nopv = 0
let avg_weighted_ratio_nopv = 0
let total_area = 0

class TreeNode {
  constructor() {
    this.children = [];
    this.branchNr = null
    this.area = 0
    this.depth = 1 // only used for the evaluation, not neccesary for the original squarified algorithm
  }

  set_area(branchNr = 0) {
        this.branchNr = branchNr;
        this.children.forEach((child) => {
            child.depth = this.depth + 1
            let childBranchNr = branchNr
            if (this.depth % 5 == 0 || branchNr == null) {
                childBranchNr = Math.floor(Math.random() * 10);
            }
            let child_area = child.set_area(childBranchNr)
            this.area += child_area
        })
        if (!this.area) 
            this.area = 1
        
        total_area += this.area
        return this.area
    }

    // TODO - make the recursive function which draws the children of this node, and calls this functon on each child.
    visualize_children(width, height, x, y, parent_area) {
        // the area of the canvas is not equal to the value/area of the root, hence we need to normalize the heights and widths of rectangles
        let normalization_factor = (height * width) / parent_area
        let children_visualized = 0
        while(children_visualized < this.children.length) { // while we haven't visualize each child
            let direction = (height < width ? "Vertical" : "Horizontal") // decide which direction we stack rectangles in
            let current_stack_size = 0 // let's raise this number untill we get a worse ratio
            let current_stack_area = 0 // the combined area of the current stack is used for calculating the width / height of the stack
            let current_ratio = Infinity // we stack nodes as long as the ratio is geting better than the current ratio
            let nodes_in_stack = [] // list of the nodes in the current stack
            while (current_stack_size < this.children.length - children_visualized) { // we can only stack as many children as there are children left to visualize
                // we keep track of the area of the current stack
                current_stack_area += this.children[current_stack_size + children_visualized].area
                if (direction == "Vertical") {
                    let width_current_stack = (current_stack_area / height) * normalization_factor
                    nodes_in_stack = this.children.slice(children_visualized, children_visualized + current_stack_size + 1)
                    let worst_ratio_this_stack = 1 // we start with the perfect ratio
                    nodes_in_stack.forEach(node => {
                        let node_height = (node.area / width_current_stack) * normalization_factor
                        let node_ratio = node_height / width_current_stack
                        if (Math.abs(node_ratio - 1) > Math.abs(worst_ratio_this_stack - 1)) {
                            worst_ratio_this_stack = node_ratio
                        }
                    })
                    if (Math.abs(worst_ratio_this_stack - 1) > Math.abs(current_ratio - 1)) {
                        current_stack_area -= this.children[current_stack_size + children_visualized].area
                        nodes_in_stack = this.children.slice(children_visualized, children_visualized + current_stack_size)
                        break
                    }
                    current_ratio = worst_ratio_this_stack
                    current_stack_size++
                } else {
                    let height_current_stack = (current_stack_area / width) * normalization_factor
                    nodes_in_stack = this.children.slice(children_visualized, children_visualized + current_stack_size + 1)
                    let worst_ratio_this_stack = 1 // we start with the perfect ratio
                    nodes_in_stack.forEach(node => {
                        let node_width = (node.area / height_current_stack) * normalization_factor
                        let node_ratio = node_width / height_current_stack
                        if (Math.abs(node_ratio - 1) > Math.abs(worst_ratio_this_stack - 1)) {
                            worst_ratio_this_stack = node_ratio
                        }
                    })
                    if (Math.abs(worst_ratio_this_stack - 1) > Math.abs(current_ratio - 1)) {
                        // let's use the previous stack
                        current_stack_area -= this.children[current_stack_size + children_visualized].area
                        nodes_in_stack = this.children.slice(children_visualized, children_visualized + current_stack_size)
                        break
                    }
                    current_ratio = worst_ratio_this_stack
                    current_stack_size++
                }
            }
            if (direction == "Vertical") {
                let stack_width = (current_stack_area / height) * normalization_factor
                let next_node_y = y
                width -= stack_width
                nodes_in_stack.forEach(node => {
                    let node_height = (node.area / stack_width) * normalization_factor

                        if (node.children.length == 0) {
                            ctx.fillStyle = get_color(node.branchNr, node.depth, true);
                            ctx.fillRect(
                                x,              
                                next_node_y,             
                                stack_width,         
                                node_height);
                        }
                        
                        ctx.strokeStyle = "black";
                        ctx.lineWidth = 0.5
                        ctx.strokeRect( 
                            x,              
                            next_node_y,             
                            stack_width,         
                            node_height);

                    node.visualize_children(stack_width, node_height, x, next_node_y, node.area)
                    next_node_y += node_height

                    // Evaluation
                    total_amount_nopv++
                    avg_ratio_nopv += node_height > stack_width ? node_height / stack_width : stack_width / node_height
                    avg_weighted_ratio_nopv += (node_height > stack_width ? node_height / stack_width : stack_width / node_height)*node.area
                })
                x += stack_width
            } else {
                let stack_height = (current_stack_area / width) * normalization_factor
                let next_node_x = x
                height -= stack_height
                nodes_in_stack.forEach(node => {
                    let node_width = (node.area / stack_height) * normalization_factor

                    if (node.children.length == 0) {
                        ctx.fillStyle = get_color(node.branchNr, node.depth, true);
                        ctx.fillRect(
                            next_node_x,              
                            y,             
                            node_width,         
                            stack_height);
                    }

                    ctx.strokeStyle = "black";
                    ctx.lineWidth = 0.5
                    ctx.strokeRect( 
                        next_node_x,              
                        y,             
                        node_width,         
                        stack_height);
                    
                    node.visualize_children(node_width, stack_height, next_node_x, y, node.area)
                    next_node_x += node_width

                    // for evaluation
                    total_amount_nopv++
                    avg_ratio_nopv += stack_height > node_width ? stack_height / node_width : node_width / stack_height
                    avg_weighted_ratio_nopv += (stack_height > node_width ? stack_height / node_width : node_width / stack_height)*node.area
                })
                y += stack_height
            }

            children_visualized += current_stack_size
        }
    }
}

class Tree {
    constructor() {
      this.root = null;
    }
  
    buildTree(connections) {
        const nodes = {};
        connections.forEach(({source, target}) => {
            if (!nodes[source]) {
                nodes[source] = new TreeNode(source);
                if (source == 1)
                    this.root = nodes[source]
            }

            if (!nodes[target]) 
                nodes[target] = new TreeNode(target);
    
            nodes[source].children.push(nodes[target]);
        });
    }
}

// could be put into utils (we are using it in two places)
function extractLinksFromJsonFile(filePath) {
    return new Promise((resolve, reject) => {
    fetch(filePath)
        .then(response => response.text())
        .then(data => {
            // Use regular expressions to find the section you want to keep
            const match = data.match(/"links": \[([\s\S]*?)\]/);
            if (match) {
            const linksSection = match[1];
            try {
                const linksArray = JSON.parse(`[${linksSection}]`);
                resolve(linksArray);
            } catch (error) {
                console.error("Error parsing links section:", error);
                reject(error);
            }
            } else {
                console.error("Links section not found in the file.");
                reject(new Error("Links section not found"));
            }
        });
    });
}

if (ON) {
    const canvas = document.getElementById("sunburstCanvas");
    ctx = canvas.getContext("2d");

    // Set the canvas properties once
    canvas.width = CANVAS_SIZE_nopv[0];
    canvas.height = CANVAS_SIZE_nopv[1];
    view_width = canvas.width
    view_height = canvas.height
    treemap_x = 0
    treemap_y = 0
    

    const filePath = "./treeoflife.json";
    extractLinksFromJsonFile(filePath)
      .then((connections) => {
        const tree = new Tree();
        console.log("building the tree...")
        tree.buildTree(connections); // we build the tree top-down
        tree.root.set_area()
        tree.root.visualize_children(canvas.width, canvas.height, 0, 0, tree.root.area)
        console.log(`mean aspect ratio: 1:${(avg_ratio_nopv / total_amount_nopv).toFixed(3)}`)
        console.log(`weighted mean aspect ratio: 1:${(avg_weighted_ratio_nopv / total_area).toFixed(3)}`)
        console.log(tree)
    })
}

