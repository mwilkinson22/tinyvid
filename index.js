//Dependencies
const fs = require('fs');
const path = require('path');
const deleteEmpty = require('delete-empty');

//File system info
const rootDir = require('./root-dir');
const downloadDir = rootDir + "test_fs/";
const processDir = rootDir + "test_fs2/";
const videoFileTypes = ['.mkv', '.avi', '.mp4', '.bat', '.ico'];
const files_to_process = {};

function recursiveFiles(dir){
	const results = [];
	fs.readdirSync(dir).forEach(function(file){
		file = path.resolve(dir, file);
		
		if(fs.statSync(file).isDirectory()){
			//Directory
			results = results.concat(recursiveCheck(file, getFolders));
		} else {
			//File
			results.push(file);
		}
	})
	return results;
}

//Move files to processing folder
fs.readdirSync(downloadDir).forEach(function(showFolder){
	showFolder = path.resolve(downloadDir, showFolder);
	const stat = fs.statSync(showFolder)
	
	//Skip files in root directory
	if(!stat || !stat.isDirectory())
		return true;
	
	//Get Show Name by folder
	let showName = path.relative(downloadDir, showFolder);
			
	//Recursively run through all files
	recursiveFiles(downloadDir).forEach(function(file){
		if(videoFileTypes.indexOf(path.extname(file).toLowerCase()) > -1){
			console.log(file);
			//Set key variables
			const showProcessFolder = processDir + showName;
			const fileName = path.basename(file);
			const newFile = showProcessFolder + "/" + fileName;
			//Ensure target destination exists
			if(!fs.existsSync(showProcessFolder))
				fs.mkdirSync(showProcessFolder);
			
			//Move file
			fs.renameSync(file, newFile);
			
			//Update files_to_process
			if(!files_to_process.hasOwnProperty(showName))
				files_to_process[showName] = [];
			files_to_process[showName].push(path.basename(file))
		} else if(path.extname(file) !== '.!ut'){
			//Delete non-video, non-ut files
			//fs.unlinkSync(file)
		} 
	})
	
	//Clear out empty directories
	deleteEmpty(showFolder);
})


//Process files
//tbd