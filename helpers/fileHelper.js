const path = require("path");
const videoFileTypes = require("../constants/videoFileTypes");

module.exports = {
	fileIsVideo: file => videoFileTypes.find(f => f == path.extname(file).toLowerCase())
};
