const exec = require('child_process').exec;

module.exports = function(res){
  return new Promise((resolve, reject)=>{
    exec('spotify play', ()=>{
      resolve();
    });
  });
}