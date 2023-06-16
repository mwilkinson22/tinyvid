//File system info
import { directories } from "../config/directories";
const { downloadDir } = directories;

//Helpers
import { fileIsVideo } from "../helpers/fileHelper";
import { sortPriorityShows } from "../helpers/sortPriorityShows";
import { getAllFilesRecursively } from "../helpers/getAllFilesRecursively";

function printCountdown(seconds: number) {
	if (seconds === 0) {
		process.stdout.write("Beginning conversion");
		process.stdin.destroy();
	} else {
		process.stdout.write(
			`Beginning conversion in ${seconds} ${
				seconds === 1 ? "second" : "seconds"
			}, close window to cancel, or press enter to begin conversion.`
		);
	}
}

export async function checkForFiles(): Promise<number> {
	//Get all files within download directory
	const allFiles: string[] = await getAllFilesRecursively(downloadDir);

	//Create a regex to filter download directory
	//This must match forward and backward slashes, so first we create a
	//string for the RegExp constructor,
	//e.g D:[\\\/]Videos[\\\/]Downloaded[\\\/]
	const regexString = `${downloadDir}/`.split(/[\\/]/).join("[\\\\\\/]");

	//Convert it to a RegExp object
	const regex = new RegExp(regexString, "gi");

	//Filter files and format strings
	const filesToConvert = allFiles
		//Only videos
		.filter(file => fileIsVideo(file))
		//Remove unnecessary path
		.map(file => file.replace(regex, ""))
		//Sort By Priority
		.sort(sortPriorityShows);

	//Print out workload and allow user time to cancel
	if (filesToConvert && filesToConvert.length) {
		//Inform user of file queue
		console.log(`${filesToConvert.length} ${filesToConvert.length == 1 ? "File" : "Files"} ready to convert:`);
		filesToConvert.forEach(file => console.log(`\t${file}`));
		console.log(" ");

		//Allow chance to cancel
		await new Promise<void>(res => {
			let secondsToGo = 10;
			printCountdown(secondsToGo);

			//Set an interval
			const interval = setInterval(() => {
				if (secondsToGo <= 0) {
					res();
					clearInterval(interval);
					process.stdout.write("\n\n");
				} else {
					process.stdout.clearLine(1);
					process.stdout.cursorTo(0);
					printCountdown(--secondsToGo);
				}
			}, 1000);

			process.stdin.on("data", () => {
				secondsToGo = 0;
				process.stdout.clearLine(1);
				printCountdown(0);
			});
		});
	}

	//Only proceed if there are files to convert
	return filesToConvert.length;
}
