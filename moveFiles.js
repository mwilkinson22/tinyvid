//Dependencies
const fs = require("fs").promises;
const path = require("path");
const deleteEmpty = require("delete-empty");

//File system info
const { downloadDir, processDir } = require("./constants/directories");
const videoFileTypes = require("./constants/videoFileTypes");

//Helpers
const getAllFilesRecursively = require("./getAllFilesRecursively");

module.exports = async () => {
	//Key: Show Name
	//Value: Array of file names
	const filesToProcess = {};

	//Loop through each folder in the download directory
	const tvShows = await fs.readdir(downloadDir);
	for (const showName of tvShows) {
		//Get full directory for downloaded show
		showFolder = path.resolve(downloadDir, showName);
		console.log(showFolder);

		//Ensure we're looking at a folder, not a file;
		const stat = await fs.stat(showFolder);
		if (!stat || !stat.isDirectory()) {
			return true;
		}

		//Get all files recursively within showFolder
		const files = await getAllFilesRecursively(showFolder);
		for (const file of files) {
			const isVideo = videoFileTypes.find(f => f == path.extname(file).toLowerCase());
			if (isVideo) {
				//Set folder in conversion queue
				const queueFolder = processDir + "/" + showName;
				try {
					await fs.stat(queueFolder);
				} catch (e) {
					//If the folder doesn't exist, create it
					await fs.mkdir(queueFolder);
				}
				const newStat = await fs.stat(queueFolder);

				//file is the full path. path.basename gives us just the file name
				const fileName = path.basename(file);

				//Move file
				await fs.rename(file, `${queueFolder}/${fileName}`);

				//Ensure filesToProcess has a value set up for this show
				if (!filesToProcess[showName]) {
					filesToProcess[showName] = [];
				}

				//Add this file to the process queue
				filesToProcess[showName].push(fileName);
			} else if (path.extname(file) !== ".!ut") {
				//Delete non-video, non-ut files
				await fs.unlink(file);
			}
		}

		//Clear out empty directories
		await deleteEmpty(showFolder);
	}

	return filesToProcess;
};
