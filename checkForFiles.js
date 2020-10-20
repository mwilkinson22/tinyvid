//File system info
const { downloadDir } = require("./constants/directories");

//Helpers
const { fileIsVideo } = require("./helpers/fileHelper");
const getAllFilesRecursively = require("./getAllFilesRecursively");

function printCountdown(time) {
	if (time === 0) {
		process.stdout.write("Beginning Conversion");
	}
	process.stdout.write(
		`Beginning conversion in ${time} ${
			time === 1 ? "second" : "seconds"
		}, close window to cancel`
	);
}

module.exports = async () => {
	//Get all files within download directory
	const allFiles = await getAllFilesRecursively(downloadDir);

	//Create a regex to filter download directory
	//This must match forward and backward slashes, so first we create a
	//string for the RegExp constructor,
	//e.g D:[\\\/]Videos[\\\/]Downloaded[\\\/]
	const regexString = `${downloadDir}/`.split(/[\/]/).join("[\\\\\\/]");

	//Convert it to a RegExp object
	const regex = new RegExp(regexString, "gi");

	//Filter files and format strings
	const filesToConvert = allFiles
		//Only videos
		.filter(fileIsVideo)
		//Remove unnecessary path
		.map(file => file.replace(regex, ""));

	//Print out workload and allow user time to cancel
	if (filesToConvert && filesToConvert.length) {
		//Inform user of file queue
		console.log(
			`${filesToConvert.length} ${
				filesToConvert.length == 1 ? "File" : "Files"
			} ready to convert:`
		);
		filesToConvert.forEach(file => console.log(`\t${file}`));
		console.log(" ");

		//Allow chance to cancel
		await new Promise(res => {
			let secondsToGo = 10;
			printCountdown(secondsToGo);

			//Set an interval
			const interval = setInterval(() => {
				if (secondsToGo <= 0) {
					res();
					clearInterval(interval);
					process.stdout.write("\n\n");
				} else {
					process.stdout.clearLine();
					process.stdout.cursorTo(0);
					printCountdown(--secondsToGo);
				}
			}, 1000);
		});
	}

	//Only proceed if there are files to convert
	return filesToConvert.length;
};
