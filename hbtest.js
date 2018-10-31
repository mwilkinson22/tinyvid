const hbjs = require('handbrake-js')


hbjs.exec({ "Z": __dirname + '\\handbrake-preset.json' }, function(err, stdout, stderr){
  if (err) throw err
  console.log(stdout)
})