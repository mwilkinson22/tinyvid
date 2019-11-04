const fs = require("fs").promises;
const path = require("path");
const { rootDir } = require("../constants/directories");

module.exports = async (msg, withDivider = false) => {
	const log = path.resolve(rootDir, "log.txt");

	//Ensure log exists
	try {
		await fs.stat(log);
	} catch (e) {
		//If the folder doesn't exist, create it
		await fs.writeFile(log, "");
	}

	if (withDivider) {
		await fs.appendFile(
			log,
			"/--------------------------------------------------------------------/\n"
		);
	}

	console.log(msg);
	await fs.appendFile(log, `${new Date().toLocaleString()} ${msg}\n`);
};
