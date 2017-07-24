const knowledgeGraphKey = require('../secrets').knowledgeGraphKey;
const exec = require('child_process').exec;
const rp = require('request-promise-native');

module.exports = function (res) {
  return new Promise((resolve, reject) => {
    var options = {
      uri: 'https://kgsearch.googleapis.com/v1/entities:search',
      qs: {
        query: res.result.parameters.query,
        key: knowledgeGraphKey,
        languages: 'de',
        limit: 1,
        indent: 'True'
      },
      json: true
    };

    rp(options)
      .then(function (result) {
        exec(`say ${result.itemListElement[0].result.detailedDescription.articleBody}`, () => {
          setTimeout(() => {
            resolve();
          }, 250);
        });
      })
      .catch(function (err) {
        console.log(err);
        reject(err);
      });
  });
}