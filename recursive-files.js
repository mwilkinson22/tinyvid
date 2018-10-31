modules.export = function(dir){
	let results = [];
	fs.readdirSync(dir).forEach(function(file){
		file = path.resolve(dir, file);
		
		if(fs.statSync(file).isDirectory()){
			//Directory
			results = results.concat(recursiveFiles(file));
		} else {
			//File
			results.push(file);
		}
	})
	return results;
}