//Modules
const fs = require("fs").promises;
const path = require("path");
const handbrake = require("handbrake-js");
const deleteEmpty = require("delete-empty");

//Constants
const { processDir, destinationDir } = require("./constants/directories");

//Helpers
const writeLog = require("./helpers/writeLog");

module.exports = async filesToProcess => {
	for (const showName in filesToProcess) {
		const episodes = filesToProcess[showName];

		//Set Output Folder
		const outputFolder = path.resolve(destinationDir, showName);
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
				const oldSize = (inputStat.size / 1048576).toFixed(2);
				const newSize = (outputStat.size / 1048576).toFixed(2);
				const pcOfOriginal = ((outputStat.size / inputStat.size) * 100).toFixed(2);
				await writeLog(`${oldSize}mb -> ${newSize}mb (${pcOfOriginal}% of original)`);

				// If the output file exists, we can delete the original
				await fs.unlink(options.input);
			}
		}
		await deleteEmpty(path.resolve(processDir, showName));
	}
};
