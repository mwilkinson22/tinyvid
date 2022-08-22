//Modules
import { promises as fs } from "fs";
const path = require("path");
const deleteEmpty = require("delete-empty");

//File system info
import { directories } from "../config/directories";
const { downloadDir, processDir } = directories;
import { films } from "../index";

//Interface
import { IFilesToProcess } from "../interfaces/IFilesToProcess";

//Helpers
import { fileIsVideo } from "../helpers/fileHelper";
import { writeLog } from "../helpers/writeLog";
import { getAllFilesRecursively } from "../helpers/getAllFilesRecursively";

export async function moveFiles(): Promise<IFilesToProcess> {
	//Key: Show Name
	//Value: Array of file names
	const filesToProcess: IFilesToProcess = {};

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
				let error = false;
				try {
					await fs.rename(file, `${queueFolder}/${fileName}`);
				} catch (e) {
					error = true;
					await writeLog(`Error moving ${fileName}`, true);
					await writeLog(e);
				}

				if (!error) {
					//Ensure filesToProcess has a value set up for this show
					if (!filesToProcess[showName]) {
						filesToProcess[showName] = [];
					}

					//Add this file to the process queue
					filesToProcess[showName].push(fileName);
				}

				//Update film log if necessary.
				if (showName === "Films") {
					films[fileName] = path
						// Get a relative path, i.e. convert D:/Downloads/Films/MyMovie/My.Movie.1080p.xrip to /MyMovie/My.Movie.1080p.xrip
						.relative(showFolder, file)
						// Split this into an array by folder separators
						.split(path.sep)
						// Find the first folder that's not an empty string
						.find((str: string) => str.length);
				}
			} else {
				await fs.unlink(file);
			}
		}

		//Clear out empty directories
		try {
			await deleteEmpty(showFolder);
		} catch (e) {
			await writeLog(`Error deleting ${showFolder} - ${e.toString()}`);
		}
	}

	return filesToProcess;
}
