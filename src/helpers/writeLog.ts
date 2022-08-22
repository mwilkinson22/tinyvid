import { promises as fs } from "fs";
const path = require("path");
import { directories } from "../config/directories";

export async function writeLog(msg: string, withDivider: boolean = false): Promise<void> {
	const log = path.resolve(directories.rootDir, "log.txt");

	//Ensure log exists
	try {
		await fs.stat(log);
	} catch (e) {
		//If the folder doesn't exist, create it
		await fs.writeFile(log, "");
	}

	if (withDivider) {
		await fs.appendFile(log, "/--------------------------------------------------------------------/\n");
	}

	console.log(msg);
	await fs.appendFile(log, `${new Date().toLocaleString()} ${msg}\n`);
}
