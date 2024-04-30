let ROOT_INTERVAL_SIZE = 0;
let nodes_in_layers;
let total_area_eval = 0
let total_nodes_eval = 0

class Tree_builder {
    constructor(total_nodes, branch_factor) {
      this.root = null;
      this.branch_factor = branch_factor;
      this.total_nodes = total_nodes;
      this.width = 1;
      this.height = 1;
      this.size = 0;
    }
  
    build_fixed_tree() {
      const tree_nodes = [];
      let leaves_before = [];
      this.root = new TreeNode_builder();
      tree_nodes.push(this.root);
      leaves_before.push(this.root);
      let leaves_after = [];
      while(tree_nodes.length < this.total_nodes - 1) {
        this.height++;
        this.width *= this.branch_factor; // we take the width as just being the total number of nodes that COULD have been in the bottom layer. 
        let leaf_after_idx = tree_nodes.length;
        for (let leaf of leaves_before) {
            if (tree_nodes.length >= this.total_nodes - 1) break;
            for (let idx = leaf_after_idx; idx < leaf_after_idx + this.branch_factor; idx++) {
                if (tree_nodes.length >= this.total_nodes) break;
                if (tree_nodes.length == this.total_nodes-1 && leaf.children.length == 0) break;
                tree_nodes[idx] = new TreeNode_builder();
                leaf.children.push(tree_nodes[idx]);
                leaves_after.push(tree_nodes[idx]);
            }
            leaf_after_idx += this.branch_factor;
        }
        leaves_before = [...leaves_after];
        leaves_after = [];
      }
      this.size = tree_nodes.length;
    }

    build_random_tree(width, height) {

    }
}

class TreeNode_builder {
    constructor() {
        this.children = [];
        this.interval = null;
        this.area = 0;
        this.depth = null;
        this.branchNr = null;
        this.isLeaf = false
    }
  
    assignIntervals(start = 0, depth = 1, branchNr = 0) {
      nodes_in_layers[depth] += 1
      this.depth = depth;
      this.branchNr = branchNr;
        
      if (this.children.length === 0) {
        this.interval = [start, start + 1];
        this.isLeaf = true
        this.area = 1;
        return [start+1, this.area];
      } else {
        // Non-leaf node, assign range [min of child, max of child]
        let currentEnd = start;
        this.children.forEach((child) => {
          let childBranchNr = branchNr
          if (this.depth % 5 == 0 || branchNr == null) {
            childBranchNr = Math.floor(Math.random() * 10);
          }
          // const childBranchNr = Math.floor(Math.random() * 10); // this assigns a random color shared by siblings
          let child_area;
          [currentEnd, child_area] = child.assignIntervals(currentEnd, depth + 1,childBranchNr);
          this.area += child_area;
        });

        this.interval = [start, currentEnd];
        total_area_eval += this.area
        return [currentEnd, this.area];
      }
    }
  
    // defined the intervals as their fraction of the roots interval
    fractionize_interval(parent_interval) {
      const current_start = this.interval[0];
      const current_end = this.interval[1];
      this.interval = [
        current_start / ROOT_INTERVAL_SIZE,
        current_end / ROOT_INTERVAL_SIZE,
      ];
      this.parent_interval = parent_interval
      this.children.forEach((child) => {
        child.fractionize_interval(this.interval);
      });
    }

    tree_to_string_array(tree_height) {
        let res = []
        let random_layer = Math.floor(Math.random() * tree_height) + 1;
        let data = `{"interval":[${this.interval[0]},${this.interval[1]}],"depth":${this.depth},"nodes_in_own_layer":${nodes_in_layers[this.depth]},"random_layer":${random_layer},"nodes_in_random_layer":${nodes_in_layers[random_layer]},"total_layers":${tree_height},"colorNr":${this.branchNr},"isLeaf": ${this.isLeaf}}`
        res.push(data)
        this.children.forEach(child => {
            res.push(...(child.tree_to_string_array(tree_height)))
        })
        return res
    }

  }

// generates a fixed tree with an amount of nodes and a branch factor.
// theese two parameters indirectly decide the height / width of the tree.
function generate_fixed_tree(total_nodes, branch_factor) {
    const tree = new Tree_builder(total_nodes, branch_factor);
    tree.build_fixed_tree();
    nodes_in_layers = Array(tree.height + 1).fill(0)
    tree.root.assignIntervals(); // we add intervals to nodes bottom-up
    ROOT_INTERVAL_SIZE = tree.root.interval[1]; 
    tree.root.fractionize_interval(); // we fractionize the intervals top-down
    let tree_string_array = tree.root.tree_to_string_array(tree.height);



    console.log("tree size:", tree.size)
    console.log("tree height:", tree.height)
    console.log("tree width:", tree.width)

    total_nodes_eval = tree.size;
    return [tree_string_array, tree]
}


function evaluate() {
    // Get the canvas
    const canvas = document.getElementById("sunburstCanvas");
    let [tree_as_string_array, tree] = generate_fixed_tree(50000, 2)
    console.log(`\n~~~~~~~~~~~~ Testing tree of size ${tree.size} with branch factor ${tree.branch_factor} ~~~~~~~~~~~~`)
    stream_data(tree_as_string_array, 100, canvas, add_tree_map_node_mixed_squarified)
    stream_data(tree_as_string_array, 100, canvas, add_tree_map_node_mixed)
    visualize_non_pv_node(canvas.width, canvas.height, 0, 0, tree.root.area, tree.root, total_nodes_eval, total_area_eval)
}
