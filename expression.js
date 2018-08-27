
var outarr = [["expression"]];
var request = require('request');

// get concise_description from wormbase about wormbase ID, y pushes to outarr[y] in 2d array, callback getReagents
function getExpress(WID, y) {
    outarr.push([WID]);
    var reqURL = 'http://api.wormbase.org/rest/widget/gene/' + WID + '/expression';
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
          if (body && body.fields && body.fields.expressed_in && body.fields.expressed_in.data) {
            body.fields.expressed_in.data.map(a => console.log(a.ontology_term.label))
          }
        }
    })
}

getExpress('WBGene00008514',1);
