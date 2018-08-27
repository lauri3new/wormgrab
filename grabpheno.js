
var outarr = [["phenotypes"]];
var request = require('request');

// get concise_description from wormbase about wormbase ID, y pushes to outarr[y] in 2d array, callback getReagents
function getPheno(WID, y) {
    outarr.push([WID]);
    var reqURL = 'http://api.wormbase.org/rest/widget/gene/' + WID + '/phenotype';
    request.get({
        url: reqURL,
        json: true,
        headers: {
            'Content-Type': 'Content-Type:application/json'
        }
    }, function(error, response, body) {
        if (error) {
            console.log(error);
        } else {
          for (var i = 0; i < body.fields.phenotype.data.length; i++) {
            outarr[y].push(body.fields.phenotype.data[i].phenotype.label);
            outarr[y].push(Object.keys(body.fields.phenotype.data[i].evidence).join(""));
          }
          console.log(outarr);
        }
    })
}

getPheno('WBGene00015146',1);
