//Modules
import { promises as fs } from "fs";

//Functions
import { checkForFiles } from "./main/checkForFiles.js";
import { moveFiles } from "./main/moveFiles.js";
import { convert } from "./main/convert.js";

//Helpers
import { writeLog } from "./helpers/writeLog";
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
	}
}

//Run scripts
main().then(() => console.log("Done"));
