//Modules
import { promises as fs } from "fs";
const path = require("path");
const handbrake = require("handbrake-js");
const deleteEmpty = require("delete-empty");

//Constants
import { directories } from "../config/directories";
const { processDir, convertedDir, destinationDir, filmDestinationDir } = directories;
import { films } from "../index";

//Config
import { settings } from "../config/settings";

//Helpers
import { writeLog } from "../helpers/writeLog";
import { updatePlex } from "../helpers/updatePlex";

//Interfaces
import { IFilesToProcess } from "../interfaces/IFilesToProcess";
import { HandbrakeOptions, HandbrakeProgress } from "handbrake-js";
import { getHandbrakeConfigPath } from "../helpers/getHandbrakeConfigPath";
import { executeExe } from "../helpers/executeExe";

export async function convert(filesToProcess: IFilesToProcess): Promise<void> {
	let totalFiles = 0;
	let currentFile = 1;
	let tvRenameHasScanned = false;

	for (const showName in filesToProcess) {
		totalFiles += filesToProcess[showName].length;
	}
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
			const inputFile = path.resolve(processDir, showName, filename);
			const outputFile = path.resolve(outputFolder, filename);
			const options: HandbrakeOptions = {
				input: inputFile,
				output: outputFile,
				"preset-import-file": getHandbrakeConfigPath()
			};

			if (settings.showsThatKeepAllLanauages.includes(showName)) {
				options["all-audio"] = true;
			} else {
				options["audio-lang-list"] = "eng";
			}

			//Convert file
			await writeLog(`Converting file ${currentFile++}/${totalFiles}: ${showName} episode '${filename}'`, true);
			await writeLog(`Writing to ${outputFile}`);
			let lastEta = "";
			const startTime = Date.now();
			await new Promise<void>((resolve, reject) => {
				handbrake
					.spawn(options)
					.on("progress", ({ percentComplete, eta }: HandbrakeProgress) => {
						// Update ETA
						if (eta && eta.length) {
							lastEta = eta;
						}

						// Update elapsed time string
						const difference: number = Date.now() - startTime;
						const timeComponents = [];

						const hours = Math.floor(difference / 3600 / 1000) % 60;
						if (hours) {
							timeComponents.push(`${hours}h`);
						}
						const minutes = Math.floor(difference / 60 / 1000) % 60;
						if (hours || minutes) {
							timeComponents.push(`${minutes < 10 ? "0" : ""}${minutes}m`);
						}
						const seconds = Math.floor(difference / 1000) % 60;
						timeComponents.push(`${seconds < 10 ? "0" : ""}${seconds}s`);

						// Set full output string
						const outputStringComponents = [
							`${percentComplete}% Complete.`,
							timeComponents.join(" ") + " elapsed.",
							lastEta.length && percentComplete < 100 ? `Approx. time remaining: ${lastEta}` : ""
						].join(". ");

						process.stdout.clearLine(0);
						process.stdout.cursorTo(0);
						process.stdout.write(outputStringComponents);
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
			const inputStat = await fs.stat(inputFile);
			const outputStat = await fs.stat(outputFile);
			if (outputStat) {
				//Get sizes
				const oldSize = (inputStat.size / 1048576).toFixed(2);
				const newSize = (outputStat.size / 1048576).toFixed(2);
				const pcOfOriginal = ((outputStat.size / inputStat.size) * 100).toFixed(2);

				//Log difference
				await writeLog(`${oldSize}mb -> ${newSize}mb (${pcOfOriginal}% of original)`);

				//Work out which file to keep
				let fileToMove: string;
				let fileToDelete: string;
				if (outputStat.size < inputStat.size) {
					//Successful reduction. Keep the converted one
					fileToMove = outputFile;
					fileToDelete = inputFile;
				} else {
					//New file is larger, keep the old one
					fileToMove = inputFile;
					fileToDelete = outputFile;
					await writeLog("Keeping original file");
				}
				console.log("\n");

				//Set Final Destination Folder
				let destinationFolder;
				let destinationFileName;
				const isFilm = films[path.basename(fileToMove)] != null;
				if (isFilm) {
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

				if (settings.updateMediaLibraries) {
					if (!isFilm) {
						//Update video names
						const tvRenameArguments = ["/hide", "/ignoremissing", "/doall", "/quit"];

						if (!tvRenameHasScanned) {
							tvRenameArguments.unshift("/recentscan");
							tvRenameHasScanned = true;
						}

						executeExe("C:\\Program Files (x86)\\TVRename\\TVRename.exe", tvRenameArguments);
					}
					//Update plex
					updatePlex(isFilm ? 4 : 2);
				}
			}
		}

		//Clear empty folders
		await deleteEmpty(path.resolve(processDir, showName));
		await deleteEmpty(path.resolve(convertedDir, showName));
	}
}
