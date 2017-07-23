const exec = require('child_process').exec;

module.exports = function(res){
  return new Promise((resolve, reject)=>{
    exec(`say ${res.result.parameters.msg || "Du hast nichts gesagt! Dummkopf!"}`, ()=>{
      setTimeout(()=>{
        resolve();
      },250);
    });
  });
}