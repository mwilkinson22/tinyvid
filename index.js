//Dependencies
const fs = require('fs');
const path = require('path');
const deleteEmpty = require('delete-empty');
const handbrake = require('handbrake-js');

//File system info
const { downloadDir, processDir, destDir } = require('./directories');
const videoFileTypes = ['.mkv', '.avi', '.mp4', '.bat', '.ico'];
const files_to_process = {};

//Handbrake info

//Function
const recusriveFiles = require('./recursive-files');

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
if(Object.keys(files_to_process).length){	
	for(show in files_to_process){
		const showDestFolder = destFolder + '/' + show;
		
		//Ensure target directory exists
		if(!fs.existsSync(showDestFolder))
			fs.mkdirSync(showDestFolder);
		
		files_to_process[show].forEach(function(fileName){
			const options = {
				"input": processDir + '/' show + '/' + fileName,
				"output": showDestFolder + '/' + fileName,
				"preset-import-file": '\handbrake-preset.json'
			}
			handbrake.exec(options, function(err, stdout, stderr){
			  if (err)
				  throw err
			  
			  console.log(stdout)
			})
		})
		
		//Call TV-Rename
		//Update Plex
	}
}