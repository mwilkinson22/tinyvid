import { executeExe } from "./executeExe";

export async function updatePlex(section: number) {
	return executeExe("C:\\Program Files (x86)\\Plex\\Plex Media Server\\Plex Media Scanner.exe", [
		"--scan",
		"--refresh",
		"--section",
		section.toString()
	]);
}
