const path = require("path");
import { videoFileTypes } from "../constants/videoFileTypes";

export function fileIsVideo(file: string): boolean {
	const isVideo = videoFileTypes.includes(path.extname(file).toLowerCase());
	const isSample = file.toLowerCase().includes("sample");
	return isVideo && !isSample;
}
