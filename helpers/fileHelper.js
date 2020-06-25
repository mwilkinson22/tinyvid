const path = require("path");
const videoFileTypes = "../constants/videoFileTypes";

module.exports = {
	fileIsVideo: file => videoFileTypes.find(f => f == path.extname(file).toLowerCase())
};
