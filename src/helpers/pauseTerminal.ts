export const pauseTerminal = async (msg: string = "Press any key to exit"): Promise<void> => {
	process.stdout.write(msg + "\n");
	process.stdin.setRawMode(true);
	return new Promise(resolve =>
		process.stdin.once("data", () => {
			process.stdin.setRawMode(false);
			resolve();
		})
	);
};
