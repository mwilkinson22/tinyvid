import { execFile } from "child_process";
import { ExecException } from "child_process";

export function executeExe(fileName: string, params: string[]): Promise<string | Buffer> {
	return new Promise((resolve, reject) => {
		execFile(
			fileName,
			params,
			{ windowsVerbatimArguments: true },
			(err: ExecException | null, stdout: string | Buffer, data: string | Buffer) => {
				err ? reject(err) : resolve(data);
			}
		);
	});
}
