//Functions
const checkForFiles = require("./checkForFiles.js");
const moveFiles = require("./moveFiles.js");
const convert = require("./convert.js");

//Helpers
const writeLog = require("./helpers/writeLog");
const executeExe = require("./helpers/executeExe");

//Move files to processing folder
async function main() {
	//Check to see if any files require converting
	const fileCount = await checkForFiles();

	if (fileCount) {
		//Move files and create convert list
		const movedFiles = await moveFiles();

		//Process files
		await convert(movedFiles);

		//Update video names
		const tvRenameResult = await executeExe("C:\\Program Files (x86)\\TVRename\\TVRename.exe", [
			"/hide",
			"/scan",
			"/ignoremissing",
			"/doall",
			"/quit"
		]);
		console.log(tvRenameResult);
		await writeLog("TV Rename Updated", true);

		//Update plex
		const plexResult = await executeExe(
			"C:\\Program Files (x86)\\Plex\\Plex Media Server\\Plex Media Scanner.exe",
			["--scan", "--refresh", "--section", "2"]
		);
		console.log(plexResult);
		await writeLog("Plex Updated", true);
	}
}

//Run scripts
main();
