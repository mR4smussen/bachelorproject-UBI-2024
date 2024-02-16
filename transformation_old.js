const fs = require('fs');

class IntervalTree {

    static branchCounter = 0;

    constructor(start, end, depth) {
        this.start = start;
        this.end = end;
        this.interval = [start, end];
        this.depth = depth;
        this.left = null;
        this.right = null;
        this.branchNr = null;
    }

    insertConnection(connection, branchNr) {
        const { source, target } = connection;
        connection.branchNr = branchNr;
        if (this.start === this.end - 1) {
            // Leaf node, store connection
            if (this.interval[0] === source && this.interval[1] === target) {
                if (!this.connections) {
                    this.connections = [];
                }
                this.connections.push(connection);
            }
            return;
        }

        const mid = Math.floor((this.start + this.end) / 2);

        if (target <= mid) {
            if (!this.left) {
                this.left = new IntervalTree(this.start, mid, this.depth + 1);
            }
            this.left.insertConnection(connection);
        } else {
            if (!this.right) {
                this.right = new IntervalTree(mid, this.end, this.depth + 1);
            }
            this.right.insertConnection(connection);
        }
    }

    traverseAndOutputToFile(filePath) {
        const result = [];
        this._traverseAndOutput(this, result);

        // Convert the result array to a string
        const resultString = result.map(({ interval, depth, branchNr }) => {
            if (depth === 0) {
                return JSON.stringify({ status: "root", interval, depth, branchNr });
            } else {
                return JSON.stringify({ interval, depth, branchNr });
            }
        }).join('\n');        
        

        // Write the result to the file
        fs.writeFileSync(filePath, resultString);

        console.log(`Traversal result has been written to ${filePath}`);
    }

    _traverseAndOutput(node, result, branchNr = null) {
        if (node) {
            if (node.depth === 3) {
                // Assign a unique branchNr for nodes at depth 3
                node.branchNr = this.getNextBranchNr();
            } else {
                // Use the branchNr from the parent for other depths
                node.branchNr = branchNr;
            }

            result.push({ interval: node.interval, depth: node.depth, branchNr: node.branchNr });

            this._traverseAndOutput(node.left, result, node.branchNr);  // Propagate the branchNr to the left child
            this._traverseAndOutput(node.right, result, node.branchNr); // Propagate null to the right child
        }
    }

    getNextBranchNr() {
        // Use a counter to get a unique branchNr for nodes at depth 3
        if (!IntervalTree.branchCounter) {
            IntervalTree.branchCounter = 1;
        } else {
            IntervalTree.branchCounter++;
        }
        return IntervalTree.branchCounter;
    }
}


function extractLinksFromJsonFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                reject(err);
                return;
            }

            // Use regular expressions to find the section you want to keep
            const match = data.match(/"links": \[([\s\S]*?)\]/);
            if (match) {
                const linksSection = match[1]; // Use the captured content
                try {
                    const linksArray = JSON.parse(`[${linksSection}]`);
                    resolve(linksArray);
                } catch (error) {
                    console.error('Error parsing links section:', error);
                    reject(error);
                }
            } else {
                console.error('Links section not found in the file.');
                reject(new Error('Links section not found'));
            }
        });
    });
}

// Example usage
const filePath = './treeoflife.json';
extractLinksFromJsonFile(filePath)
    .then(connections => {

        console.log(connections)

        // const intervalTree = new IntervalTree(0, connections.length, 0);
        // connections.forEach(connection => intervalTree.insertConnection(connection));

        // // Specify the file path where you want to save the traversal result
        // const outputFilePath = 'transformed_data.txt';

        // // Traverse the tree and output the result to the file
        // intervalTree.traverseAndOutputToFile(outputFilePath);
    })
    .catch(error => {
        // Handle errors
        console.error('Error:', error);
    });