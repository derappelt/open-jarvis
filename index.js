const fs = require('fs');
const {Detector, Models} = require('snowboy');
const record = require('node-record-lpcm16');
const stream = require('stream');
const player = require('play-sound')();
const exec = require('child_process').exec;
const secrets = require('./secrets');
const apiAiApp = require('apiai')(secrets.apiAiKey);
const speech = require('@google-cloud/speech')({
  projectId: 'jarvis-174310',
  keyFilename: './jarvis_key.json'
});

const csr = new stream.Writable();

const models = new Models();
const hotwords = [{ file: 'res/hey_jarvis.pmdl', hotword: 'hey jarvis' }];
hotwords.forEach(model => {
  models.add({
    file: model.file || 'node_modules/snowboy/resources/snowboy.umdl',
    sensitivity: model.sensitivity || '0.5',
    hotwords: model.hotword || 'default'
  });
});

const opts = {
  models: models,
  resource: 'node_modules/snowboy/resources/common.res',
  audioGain: 2.0,
  language : 'de-DE'
};
let mic = {};
let listening = false;
let talking = false;

function startStreaming(){
  listening = true;
  player.play('res/ding.wav');
  let empty = true;
  const request = {
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: opts.language
    },
    singleUtterance: true,
    interimResults: true
  };
  const recognizeStream = speech.streamingRecognize(request)
  .on('error', console.error)
  .on('data', (data) => {
    if(data.speechEventType === 'END_OF_SINGLE_UTTERANCE'){
      listening = false;
      mic.unpipe(recognizeStream);
      recognizeStream.end();
      if(empty === true){
        player.play('res/dong.wav');
      }
    } else {
      if(data.results[0]){
        empty = false;
        if(data.results[0].isFinal === true){
          let transcript = data.results[0].alternatives[0].transcript;

          let request = apiAiApp.textRequest(transcript, {
            sessionId: '<unique session id>'
          });
          request.on('response', function(response) {
            talking = true;
            let actionString = response.result.action;
            let path = `./actions/${actionString.replace('.', '/')}.js`;
            fs.exists(path, (exists)=>{
              let action = (exists) ? require(path) : require('./actions/default');
              action(response).then(()=>{
                talking = false;
              });
            });
          });
          request.on('error', function(error) {
            console.log(error);
          });
          request.end();
        }
      }
    }
  });
  mic.pipe(recognizeStream);
}

const detector = new Detector(opts);
// detector.on('silence', () => console.log('silence'));
// detector.on('sound', () => console.log('sound'));
detector.on('hotword', (index, hotword) => {
  if(!listening && !talking){
    startStreaming();
  }
});


function start(){
  mic = record.start({
    threshold: 0,
    device: null,
    recordProgram: "rec",
    verbose: false
  });
  mic.pipe(detector);
}

start();
