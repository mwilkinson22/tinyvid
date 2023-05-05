//Modules
import { promises as fs } from "fs";

//Functions
import { checkForFiles } from "./main/checkForFiles.js";
import { moveFiles } from "./main/moveFiles.js";
import { convert } from "./main/convert.js";

//Config
import { settings } from "./config/settings";

//Helpers
import { writeLog } from "./helpers/writeLog";
import { executeExe } from "./helpers/executeExe";
import { getHandbrakeConfigPath } from "./helpers/getHandbrakeConfigPath";
import { pauseTerminal } from "./helpers/pauseTerminal";

//Keep track of film titles
export const films: Record<string, string> = {};

//Move files to processing folder
async function main() {
	//Check to see if any files require converting
	const fileCount = await checkForFiles();

	if (fileCount) {
		//Ensure we have a handbrake config
		try {
			await fs.stat(getHandbrakeConfigPath());
		} catch (e) {
			await writeLog("Error, could not locate Handbrake Config file.", true);
			await pauseTerminal();
			return process.exit();
		}

		//Move files and create convert list
		const movedFiles = await moveFiles();

		//Process files
		await convert(movedFiles);

		if (settings.updateMediaLibraries) {
			//Update video names
			await writeLog("Running TV Rename", true);
			await executeExe("C:\\Program Files (x86)\\TVRename\\TVRename.exe", [
				"/hide",
				"/recentscan",
				"/ignoremissing",
				"/doall",
				"/quit"
			]);
			await writeLog("TV Rename Complete");

			//Update plex
			await updatePlex(2);
			if (Object.values(films).length) {
				await updatePlex(4);
			}
			await writeLog("Plex Updated", true);
		}
	}
}

async function updatePlex(section: number) {
	return executeExe("C:\\Program Files (x86)\\Plex\\Plex Media Server\\Plex Media Scanner.exe", [
		"--scan",
		"--refresh",
		"--section",
		section.toString()
	]);
}

//Run scripts
main().then(() => console.log("Done"));
