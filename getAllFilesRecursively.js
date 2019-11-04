const fs = require("fs").promises;
const path = require("path");

async function getAllFilesRecursively(rootDir) {
	const results = [];

	//Loop all files/folders within rootDir
	const files = await fs.readdir(rootDir);
	for (const fileName of files) {
		//Get the current file
		file = path.resolve(rootDir, fileName);

		const stat = await fs.stat(file);
		if (stat.isDirectory()) {
			//If it's another folder, we run this again
			const nestedResults = await getAllFilesRecursively(file);
			results.push(...nestedResults);
		} else {
			//Otherwise, just add the file to the list
			results.push(file);
		}
	}

	return results;
}

module.exports = getAllFilesRecursively;
