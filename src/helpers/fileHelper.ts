const path = require("path");
import { videoFileTypes } from "../constants/videoFileTypes";

export function fileIsVideo(file: string): boolean {
	return videoFileTypes.includes(path.extname(file).toLowerCase());
}
