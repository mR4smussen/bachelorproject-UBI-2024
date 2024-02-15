const fs = require('fs');

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
    .then(linksArray => {
        // Use the linksArray wherever you need it
        console.log(linksArray);
    })
    .catch(error => {
        // Handle errors
        console.error('Error:', error);
    });
