import path from "path";
import { settings } from "../config/settings";
const { priorityShows } = settings;

export const sortPriorityShows = (a: string, b: string) => {
	//Get the show name for each file
	const aShow = a.split(path.sep)[0];
	const bShow = b.split(path.sep)[0];

	//Get a numeric priority, default to the array length if none is found.
	const aPriority = priorityShows.includes(aShow) ? priorityShows.indexOf(aShow) : priorityShows.length;
	const bPriority = priorityShows.includes(bShow) ? priorityShows.indexOf(bShow) : priorityShows.length;

	if (aPriority < bPriority) {
		return -1;
	} else if (aPriority > bPriority) {
		return 1;
	} else {
		return a.localeCompare(b);
	}
};
