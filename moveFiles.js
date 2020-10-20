//Dependencies
const fs = require("fs").promises;
const path = require("path");
const deleteEmpty = require("delete-empty");

//File system info
const { downloadDir, processDir } = require("./constants/directories");

//Helpers
const { fileIsVideo } = require("./helpers/fileHelper");
const writeLog = require("./helpers/writeLog");
const getAllFilesRecursively = require("./getAllFilesRecursively");

module.exports = async () => {
	//Key: Show Name
	//Value: Array of file names
	const filesToProcess = {};

	//Loop through each folder in the download directory
	const tvShows = await fs.readdir(downloadDir);
	for (const showName of tvShows) {
		//Get full directory for downloaded show
		const showFolder = path.resolve(downloadDir, showName);

		//Ensure we're looking at a folder, not a file;
		const stat = await fs.stat(showFolder);
		if (!stat || !stat.isDirectory()) {
			continue;
		}

		//Get all files recursively within showFolder
		const files = await getAllFilesRecursively(showFolder);

		//Ensure there are no incomplete files
		const incompleteFiles = files.filter(f => f.split(".").pop() === "!ut");
		if (incompleteFiles.length) {
			continue;
		}

		for (const file of files) {
			if (fileIsVideo(file)) {
				//Set folder in conversion queue
				const queueFolder = processDir + "/" + showName;
				try {
					await fs.stat(queueFolder);
				} catch (e) {
					//If the folder doesn't exist, create it
					await fs.mkdir(queueFolder);
				}

				//file is the full path. path.basename gives us just the file name
				const fileName = path.basename(file);

				//Move file
				let error;
				try {
					await fs.rename(file, `${queueFolder}/${fileName}`);
				} catch (e) {
					error = e;
				}

				if (error) {
					await writeLog(`Error moving ${fileName}`, true);
					await writeLog(e);
				} else {
					//Ensure filesToProcess has a value set up for this show
					if (!filesToProcess[showName]) {
						filesToProcess[showName] = [];
					}

					//Add this file to the process queue
					filesToProcess[showName].push(fileName);
				}
			} else {
				await fs.unlink(file);
			}
		}

		//Clear out empty directories
		await deleteEmpty(showFolder);
	}

	return filesToProcess;
};
