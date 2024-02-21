const fs = require("fs");

let ROOT_INTERVAL_SIZE = 0;

class TreeNode {
  constructor() {
    this.children = [];
    this.interval = null;
    this.depth = null;
    this.branchNr = null;
  }

  assignIntervals(start = 0, depth = 1, branchNr = null) {
    this.depth = depth;

    this.branchNr = branchNr;

    if (this.children.length === 0) {
      // Leaf node, assign range [start, start+1]
      this.interval = [start, start + 1];
      return this.interval;
    } else {
      // Non-leaf node, assign range [min of child, max of child]
      let currentEnd = start;
      this.children.forEach((child, index) => {
        const childBranchNr = Math.floor(Math.random() * 10); // this assigns a random color shared by siblings
        currentEnd = child.assignIntervals(currentEnd, depth + 1,childBranchNr)[1];
      });
      this.interval = [start, currentEnd];
      return [start, currentEnd];
    }
  }

  // defined the intervals as their fraction of the roots interval
  fractionize_interval() {
    const current_start = this.interval[0];
    const current_end = this.interval[1];
    this.interval = [
      current_start / ROOT_INTERVAL_SIZE,
      current_end / ROOT_INTERVAL_SIZE,
    ];
    this.children.forEach((child) => {
      child.fractionize_interval();
    });
  }
}

class Tree {
  constructor() {
    this.root = null;
  }

  buildTree(connections) {
    const nodes = {};

    connections.forEach(({ source, target }) => {
      if (!nodes[source]) {
        nodes[source] = new TreeNode(source);
      }

      if (!nodes[target]) {
        nodes[target] = new TreeNode(target);
      }

      nodes[source].children.push(nodes[target]);
    });

    // the node which is not the child of another node is the root
    const rootCandidates = Object.values(nodes).filter(
      (node) => !Object.values(nodes).some((n) => n.children.includes(node))
    );
    if (rootCandidates.length === 1) {
      this.root = rootCandidates[0];
      return this.root;
    } else {
      throw new Error("The tree should have exactly one root.");
    }
  }
}

// this is very specialized to the treeoflife.json file we have
function extractLinksFromJsonFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading file:", err);
        reject(err);
        return;
      }

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

const filePath = "./treeoflife.json";
extractLinksFromJsonFile(filePath)
  .then((connections) => {
    const tree = new Tree();
    tree.buildTree(connections); // we build the tree top-down
    tree.root.assignIntervals(); // we add intervals to nodes bottom-up
    ROOT_INTERVAL_SIZE = tree.root.interval[1]; 
    tree.root.fractionize_interval(); // we fractionize the intervals top-down

    // Printing the nodes to a file
    function printInfoToFile(node, filename) {
      data = "";
      if (node.depth === 1) {
        data = `{"status":"root","interval":[${node.interval[0]},${node.interval[1]}],"depth":${node.depth},"colorNr":${node.branchNr}}\n`;
      } else {
        data = `{"interval":[${node.interval[0]},${node.interval[1]}],"depth":${node.depth},"colorNr":${node.branchNr}}\n`;
      }

      fs.appendFileSync(filename, data);

      node.children.forEach((child) => {
        printInfoToFile(child, filename);
      });
    }

    const outputFileName = "transformed_data.txt";

    fs.writeFileSync(outputFileName, "");
    printInfoToFile(tree.root, outputFileName);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
