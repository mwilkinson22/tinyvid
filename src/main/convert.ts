//Modules
import { promises as fs } from "fs";
const path = require("path");
const handbrake = require("handbrake-js");
const deleteEmpty = require("delete-empty");

//Constants
import { directories } from "../constants/directories";
const { processDir, convertedDir, destinationDir, filmDestinationDir } = directories;
import { films } from "../index";

//Helpers
import { writeLog } from "../helpers/writeLog";

//Interfaces
import { IFilesToProcess } from "../interfaces/IFilesToProcess";
import { HandbrakeProgress } from "handbrake-js";

export async function convert(filesToProcess: IFilesToProcess): Promise<void> {
	for (const showName in filesToProcess) {
		const episodes = filesToProcess[showName];

		//Set Conversion Output Folder
		const outputFolder = path.resolve(convertedDir, showName);
		try {
			await fs.stat(outputFolder);
		} catch (e) {
			//If the folder doesn't exist, create it
			await fs.mkdir(outputFolder);
		}

		//Loop Episodes
		for (const filename of episodes) {
			//Define full paths for input and output
			const options = {
				input: path.resolve(processDir, showName, filename),
				output: path.resolve(outputFolder, filename),
				"preset-import-file": path.resolve(__dirname, "src", "assets", "handbrake-preset.json")
			};

			//Convert file
			await writeLog(`Converting ${showName} episode '${filename}'`, true);
			await writeLog(`Writing to ${options.output}`);
			await new Promise<void>((resolve, reject) => {
				handbrake
					.spawn(options)
					.on("progress", ({ percentComplete }: HandbrakeProgress) => {
						process.stdout.clearLine(0);
						process.stdout.cursorTo(0);
						process.stdout.write(`${percentComplete}% Complete`);
						if (percentComplete == 100) {
							process.stdout.write("\n");
						}
					})
					.on("error", reject)
					.on("end", () => resolve());
			}).catch(async e => {
				await writeLog(`Error converting ${showName} episode '${filename}'`);
				await writeLog(e, false);
			});

			//Log difference
			const inputStat = await fs.stat(options.input);
			const outputStat = await fs.stat(options.output);
			if (outputStat) {
				//Get sizes
				const oldSize = (inputStat.size / 1048576).toFixed(2);
				const newSize = (outputStat.size / 1048576).toFixed(2);
				const pcOfOriginal = ((outputStat.size / inputStat.size) * 100).toFixed(2);

				//Log difference
				await writeLog(`${oldSize}mb -> ${newSize}mb (${pcOfOriginal}% of original)`);

				//Work out which file to keep
				let fileToMove, fileToDelete;
				if (outputStat.size < inputStat.size) {
					//Successful reduction. Keep the converted one
					fileToMove = options.output;
					fileToDelete = options.input;
				} else {
					//New file is larger, keep the old one
					fileToMove = options.input;
					fileToDelete = options.output;
					await writeLog("Keeping original file");
				}
				console.log("\n");

				//Set Final Destination Folder
				let destinationFolder;
				let destinationFileName;
				if (films[path.basename(fileToMove)]) {
					const film = films[path.basename(fileToMove)];
					destinationFolder = path.resolve(filmDestinationDir, film);
					destinationFileName = `${film}${path.extname(fileToMove)}`;
				} else {
					destinationFolder = path.resolve(destinationDir, showName);
					destinationFileName = path.basename(fileToMove);
				}

				//Ensure destination folder exists
				try {
					await fs.stat(destinationFolder);
				} catch (e) {
					//If the folder doesn't exist, create it
					await fs.mkdir(destinationFolder);
				}

				await fs.rename(fileToMove, path.resolve(destinationFolder, destinationFileName));
				await fs.unlink(fileToDelete);
			}
		}

		//Clear empty folders
		await deleteEmpty(path.resolve(processDir, showName));
		await deleteEmpty(path.resolve(convertedDir, showName));
	}
}
