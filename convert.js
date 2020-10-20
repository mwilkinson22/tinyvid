//Modules
const fs = require("fs").promises;
const path = require("path");
const handbrake = require("handbrake-js");
const deleteEmpty = require("delete-empty");

//Constants
const { processDir, convertedDir, destinationDir } = require("./constants/directories");

//Helpers
const writeLog = require("./helpers/writeLog");

module.exports = async filesToProcess => {
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

		//Set Final Destination Folder
		const destinationFolder = path.resolve(destinationDir, showName);
		try {
			await fs.stat(destinationFolder);
		} catch (e) {
			//If the folder doesn't exist, create it
			await fs.mkdir(destinationFolder);
		}

		//Loop Episodes
		for (const filename of episodes) {
			//Define full paths for input and output
			const options = {
				input: path.resolve(processDir, showName, filename),
				output: path.resolve(outputFolder, filename),
				"preset-import-file": path.resolve(__dirname, "handbrake-preset.json")
			};

			//Convert file
			await writeLog(`Converting ${showName} episode '${filename}'`, true);
			await writeLog(`Writing to ${options.output}`);
			await new Promise((resolve, reject) => {
				handbrake
					.spawn(options)
					.on("progress", ({ percentComplete }) => {
						process.stdout.clearLine();
						process.stdout.cursorTo(0);
						process.stdout.write(`${percentComplete}% Complete`);
						if (percentComplete == 100) {
							process.stdout.write("\n");
						}
					})
					.on("error", reject)
					.on("end", resolve);
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

				await fs.rename(
					fileToMove,
					path.resolve(destinationFolder, path.basename(fileToMove))
				);
				await fs.unlink(fileToDelete);
			}
		}

		//Clear empty folders
		await deleteEmpty(path.resolve(processDir, showName));
		await deleteEmpty(path.resolve(convertedDir, showName));
	}
};
