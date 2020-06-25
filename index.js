//Functions
const moveFiles = require("./moveFiles.js");
const convert = require("./convert.js");

//Helpers
const writeLog = require("./helpers/writeLog");
const executeExe = require("./helpers/executeExe");

//Move files to processing folder
async function main() {
	const filesToProcess = await moveFiles();

	//Process files
	if (Object.keys(filesToProcess).length) {
		await convert(filesToProcess);

		//Update video names
		const tvRenameResult = await executeExe("C:\\Program Files (x86)\\TVRename\\TVRename.exe", [
			"/hide",
			"/scan",
			"/ignoremissing",
			"/doall",
			"/quit"
		]);
		console.log(tvRenameResult);
		writeLog("TV Rename Updated", true);

		//Update plex
		const plexResult = await executeExe(
			"C:\\Program Files (x86)\\Plex\\Plex Media Server\\Plex Media Scanner.exe",
			["--scan", "--refresh", "--section", "2"]
		);
		console.log(plexResult);
		writeLog("Plex Updated", true);
	}
}

//Run scripts
main();
