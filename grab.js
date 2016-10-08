module.exports = function(inputstring, done) {
var request = require('request');
var baby = require('babyparse');
var fs = require('fs');

// program works by making api requests from input array, pushing result to array and calling next api request 
// to add more data, create more api request functions (get functions) 
// aysnc control loop using counter ++ in penultimate callback function, execute final callback 'writecsv' 

// counter is used to track completion of all async operations by using counter++ in callback from final aysnc operation.
var counter = 0;

// example input - replace with actual input from message from web server
var arr = ["Q09308" ,"O17811" ,"P55326" ,"O76565" ,"Q09949" ,"P34399" ,"P34392" ,"Q09531" ,"P34384" ,"P41954" ,"Q09936" ,"P34367" ,"P34361" ,"P34364" ,"Q09278" ,"Q18594" ,"O01975" ,"P34349" ,"O16887" ,"P34327"];
var exampleWID = 'WBGene00015146';
var arrJoined = arr.join(" ");

// headers of output CSV
var headersCSV = ['ACC', 'WID', 'Description','Transgene constructs','Antibodies', 'Cellular Component', 'Biological Process', 'Molecular Function'];

// output array converetd to CSV at end, get functions push elements here about (concise_description)
var outarr = [headersCSV];

// get concise_description from wormbase about wormbase ID, y pushes to outarr[y] in 2d array, callback getReagents
function getDesc(WID, y) {
    var reqURL = 'http://api.wormbase.org/rest/widget/gene/' + WID + '/overview';
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
            console.log('b');
            outarr[y].push(body.fields.concise_description.data.text);
            getReagents(WID, y);
        }
    })
}

// get antibody info from wormbase about reagents (antibodies and constructs), y pushes to outarr[y] in 2d array, callback getGO
function getReagents(WID, y) {
    var reqURL = 'http://api.wormbase.org/rest/widget/gene/' + WID + '/reagents';
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
            console.log('c');
            var labelConstructs = '';
            var abDescs = '';
            for (var key in body.fields.transgene_products.data) {
            labelConstructs += body.fields.transgene_products.data[key].construct.label + ' : ';
            labelConstructs += body.fields.transgene_products.data[key].use_summary + ', ';
            }
            outarr[y].push(labelConstructs.substring(0, labelConstructs.length - 2));
            for (var key in body.fields.antibodies.data) {
            abDescs += body.fields.antibodies.data[key].antibody.label + ' : ';
            abDescs += body.fields.antibodies.data[key].summary + ', '; 
            }
            outarr[y].push(abDescs.substring(0, abDescs.length - 2));
            getGO(WID, y);
        }})
}

// get GO terms from wormbase about wormbase ID, y pushes to outarr[y] in 2d array, callback write csv
function getGO(WID, y) {
    var reqURL = 'http://api.wormbase.org/rest/widget/gene/' + WID + '/gene_ontology';
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
            for (var key in body.fields.gene_ontology_summary.data) {
                console.log('d');
                var terms = '';
                for (var i = 0; i < body.fields.gene_ontology_summary.data[key].length; i++) {
                    terms += body.fields.gene_ontology_summary.data[key][i].term_description[0]['label'] + ', ';
                }
                outarr[y].push(terms.substring(0, terms.length - 2));
            }
            counter++;
            console.log(outarr.length)
            console.log(counter);
            if (counter == outarr.length-1) {
                writeCSV(outarr);
            }
        }
    })
}

//function map protein ACCs joined as space seperated string to WIDs, push WIDs to outarr and callback getDesc
function mapWBID(ACCs) {
    request.get({
            url: 'http://www.uniprot.org/mapping/',
            qs: {
                'from': 'ACC',
                'to': 'WORMBASE_ID',
                'format': 'tab',
                'query': ACCs
            }
        },
        function(error, response, body) {
            if (error) {
                console.log(error);
            }    
            else {
                console.log(body.length);
                if ( body == false || body.length < 9) {console.log('hello');return finished(new Error('no uniprot ids provided'))}
                else {
                console.log(body + 'the body');
                baby.parse(body, {delimiter: "\t",
	newline: "\n", quotes:'false',
                  complete: function(results) {
                     for (i = 1; i < results.data.length - 1; i++) {
                        console.log('a');
                      outarr.push(results.data[i]);
                      outarr[i].push(results.data[i][1]);
                      getDesc(results.data[i][1],i);
                    }
                   }
	           })}
            }}
)};

//write output csv
function writeCSV(arr) {
    console.log('e');
    fs.writeFile('/public/output.csv', baby.unparse(outarr), function(results) {
        finished();
    });
}
    
function finished(err) {
    console.log(err);
    console.log("finished");
    done(err);
}

mapWBID(inputstring);
}
//mapWBID(arrJoined);