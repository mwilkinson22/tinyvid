const { execFile } = require("child_process");

module.exports = (fileName, params, path) => {
	let promise = new Promise((resolve, reject) => {
		execFile(fileName, params, { cwd: path, windowsVerbatimArguments: true }, (err, data) => {
			err ? reject(err) : resolve(data);
		});
	});
	return promise;
};
