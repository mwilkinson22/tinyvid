import { spawn } from "child_process";

export function executeExe(fileName: string, params: string[]): Promise<string | Buffer> {
	return new Promise((resolve, reject) => {
		const process = spawn(fileName, params, { windowsVerbatimArguments: true });
		process.on("close", resolve);
		process.on("error", reject);

		// For some reason, not defining a data handler causes TVRename to crash.
		// We may as well log the output.
		process.stdout.on("data", data => console.log(data));
	});
}
