import { promises as fs } from "fs";
const path = require("path");
import { videoFileTypes } from "../constants/videoFileTypes";

export function fileIsVideo(file: string): boolean {
	const isVideo = videoFileTypes.includes(path.extname(file).toLowerCase());
	const isSample = file.toLowerCase().includes("sample");
	return isVideo && !isSample;
}

//Creates a nested folder if it doesn't exist
export async function createFolder(folderPath: string): Promise<void> {
	await fs.mkdir(folderPath, { recursive: true });
}
