// flag for running the balanced (true) or unbalanced (false) tests
let RUN_BALANCED_TESTS = false

let ROOT_INTERVAL_SIZE = 0;
let nodes_in_layers;
let total_area_eval = 0
let total_nodes_eval = 0

// for finding the tree variance
let nodes_children = [] // list of how many children each node has

// Clear potential intervals
const interval_id = window.setInterval(function(){}, Number.MAX_SAFE_INTEGER);
for (let i = 1; i < interval_id; i++) {
  window.clearInterval(i);
}

class Tree_builder {
    constructor(total_nodes, branch_factor) {
      this.root = null;
      this.branch_factor = branch_factor;
      this.total_nodes = total_nodes;
      this.width = 1;
      this.height = 1;
      this.size = 0;
    }
  
    build_balanced_tree() {
      total_area_eval = 0;
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

    // builds a tree where each node has a `leaf_chance` chance of being a leaf
    // and then an even probability to have between 2 and `max_children` children.   
    build_unbalanced_tree(leaf_chance, max_children) {
      total_area_eval = 0;
      const tree_nodes = [];
      let leaves_before = [];
      this.root = new TreeNode_builder();
      tree_nodes.push(this.root);
      leaves_before.push(this.root);
      let leaves_after = [];
      // while we can add another layer
      while(tree_nodes.length < this.total_nodes - 1) {
        this.height++; 
        let leaf_after_idx = tree_nodes.length;
        for (let leaf of leaves_before) {
          if (tree_nodes.length >= this.total_nodes - 1) break;
          let is_leaf = Math.random() < leaf_chance
          if (is_leaf && leaves_after.length > 0) continue; // we don't add children to this leaf (only if the next layer is not empty...)
          let amount_of_children = Math.floor(Math.random() * (max_children - 1)) + 2;
          let children_count = 0;
          for (let idx = leaf_after_idx; idx < leaf_after_idx + amount_of_children; idx++) {
            if (tree_nodes.length >= this.total_nodes) break;
            
            if (tree_nodes.length == this.total_nodes-1 && leaf.children.length == 0) break;
            tree_nodes[idx] = new TreeNode_builder();
            leaf.children.push(tree_nodes[idx]);
            leaves_after.push(tree_nodes[idx]);
            children_count++;
          }
          nodes_children.push(children_count)
          leaf_after_idx += amount_of_children;
        }
        leaves_before = [...leaves_after];
        leaves_after = [];
      }
      this.size = tree_nodes.length;
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

// generates a balanced tree with an amount of nodes and a branch factor.
// theese two parameters indirectly decide the height / width of the tree.
function generate_balanced_tree(total_nodes, branch_factor) {
    const tree = new Tree_builder(total_nodes, branch_factor);
    tree.build_balanced_tree();
    nodes_in_layers = Array(tree.height + 1).fill(0)
    tree.root.assignIntervals(); // we add intervals to nodes bottom-up
    ROOT_INTERVAL_SIZE = tree.root.interval[1]; 
    tree.root.fractionize_interval(); // we fractionize the intervals top-down
    let tree_string_array = tree.root.tree_to_string_array(tree.height);



    // console.log("tree size:", tree.size)
    // console.log("tree height:", tree.height)
    // console.log("tree width:", tree.width)

    total_nodes_eval = tree.size;
    return [tree_string_array, tree]
}

// generates an unbalanced tree with an amount of nodes
function generate_unbalanced_tree(total_nodes, leaf_chance, max_children) {
  const tree = new Tree_builder(total_nodes, 0);
  tree.build_unbalanced_tree(leaf_chance, max_children);
  nodes_in_layers = Array(tree.height + 1).fill(0)
  tree.root.assignIntervals(); // we add intervals to nodes bottom-up
  ROOT_INTERVAL_SIZE = tree.root.interval[1]; 
  tree.root.fractionize_interval(); // we fractionize the intervals top-down
  let tree_string_array = tree.root.tree_to_string_array(tree.height);

  // console.log("tree size:", tree.size)
  // console.log("tree height:", tree.height)

  total_nodes_eval = tree.size;
  return [tree_string_array, tree]
}


function evaluate() {
  // unbalanced tree test
  function run_unbalanced_test() {
    // 0-0.5 probability for a node to be a leaf
    // each node can have between 2-(random between 2 and 9) children
    let [unbalanced_tree_as_string_array, unbalanced_tree] = generate_unbalanced_tree(50000, Math.random() / 2, Math.floor(Math.random() * (10 - 1)) + 3)

    let nodes_not_in_final_layer = nodes_in_layers.slice(1, -1).reduce((sum, layer_size) => { return sum + layer_size },0);

    while (nodes_children.length < nodes_not_in_final_layer) nodes_children.push(0)

    let avg_children_amount = nodes_children.reduce((sum, children_amount) => { return sum + children_amount },0) / nodes_children.length;
    
    // variance = 1 / n sum((x - mean)^2)
    let variance = nodes_children.reduce((sum, children_amount) => { return sum + (children_amount - avg_children_amount) ** 2 },0) / nodes_children.length;
    nodes_children = []
    current_variance_sq = variance
    current_variance_mix = variance
    current_variance_nopv = variance
    stream_data(unbalanced_tree_as_string_array, 100, canvas, add_tree_map_node_mixed_squarified)
    stream_data(unbalanced_tree_as_string_array, 100, canvas, add_tree_map_node_mixed)
    visualize_non_pv_node(canvas.width, canvas.height, 0, 0, unbalanced_tree.root.area, unbalanced_tree.root, total_nodes_eval, total_area_eval)
  }

  if (RUN_BALANCED_TESTS) {
    // balanced tree test
    const canvas = document.getElementById("sunburstCanvas");
    let [balanced_tree_as_string_array, balanced_tree] = generate_balanced_tree(50000, 2)
    console.log(`\n~~~~~~~~~~~~ Testing tree of size ${balanced_tree.size} with branch factor ${balanced_tree.branch_factor} ~~~~~~~~~~~~`)
    stream_data(balanced_tree_as_string_array, 100, canvas, add_tree_map_node_mixed_squarified)
    stream_data(balanced_tree_as_string_array, 100, canvas, add_tree_map_node_mixed)
    visualize_non_pv_node(canvas.width, canvas.height, 0, 0, balanced_tree.root.area, balanced_tree.root, total_nodes_eval, total_area_eval)
  } else {
    let count = 0;
    let times = 150;
    let delay = 60000; // 60s
    is_running_multiple_tests_sq = true;
    is_running_multiple_tests_mix = true;
    is_running_multiple_tests_nopv = true;
    run_unbalanced_test();
    let interval = setInterval(() => { 
      run_unbalanced_test();
      count++;
      if (count === times) {
          console.log("\n************************************************************")
          console.log("****************** RUNNING LAST ITERATION ******************")
          console.log("************************************************************")
          clearInterval(interval);
      } else 
        console.log("\n************ RUNNING ITERATION " + (count + 1) + " ************")

    }, delay);
  }
}

// evaluate();
