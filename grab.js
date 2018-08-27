//module.exports = function(inputstring , igene , done) {
var request = require('request');
var baby = require('babyparse');
var fs = require('fs');
var path = require('path');

// program works by making api requests from input array, pushing result to array and calling next api request
// to add more data, create more api request functions (get functions)
// aysnc control loop using counter ++ in penultimate callback function, execute final callback 'writecsv'

// counter is used to track completion of all async operations by using counter++ in callback from final aysnc operation.


// example input - replace with actual input from message from web server
//var arr = ["Q09308" ,"O17811" ,"P55326" ,"O76565" ,"Q09949" ,"P34399" ,"P34392" ,"Q09531" ,"P34384" ,"P41954" ,"Q09936" ,"P34367" //,"P34361" ,"P34364" ,"Q09278" ,"Q18594" ,"O01975" ,"P34349" ,"O16887" ,"P34327"];
//var exampleWID = 'WBGene00015146';
//var arrJoined = arr.join(" ");

function grab(ACCs) {

var counter = 0;
  var poi = "P34308";
  var igene = "clp-1";

  // headers of output CSV
  var headersCSV = ['ACC', 'WID', 'Gene', 'Description', 'Family', 'HS orthologs', 'Transgene constructs','Antibodies','Phenotypes','PMID hits no.', 'PMID hits', 'Homology PMID hits no.','homology PMID hits', 'Cellular Component', 'Biological Process', 'Molecular Function'];

  // output array converetd to CSV at end, get functions push elements here about (concise_description)
  var outarr = [headersCSV];
  var searcharr = [['POI family name', 'POI homologous proteins'], [ 'CaLpain',
      'CAPN1',
      'CAPN11',
      'CAPN3',
      'capn8',
      'CAPN2',
      'capn9' ]];


console.log('accecions',ACCs);

//function map protein ACCs joined as space seperated string to WIDs, push WIDs to outarr and callback getDesc
function mapWBID(ACCs) {
    console.log('helo');
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
                console.log(error + ' mapWBID');
            }
            else {
                console.log(body.length);
                if ( body == false || body.length < 9) {console.log('hello');return finished(new Error('no uniprot ids provided'))}
                else {
                baby.parse(body, {delimiter: "\t",
	newline: "\n", quotes:'false',
                  complete: function(results) {
                     for (i = 1; i < results.data.length - 1; i++) {
                      outarr.push(results.data[i]);
                        searcharr.push([]);
                        console.log(results.data[i][1]);
                      getDesc(results.data[i][1],i);
                    }
                   }
	           })}
            }}
)};


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
            console.log(error + ' getDesc');
        } else {
                    outarr[y].push(body.fields.name.data.label);
           outarr[y].push(body.fields.concise_description.data.text);
            var family = "";
            if (body.fields.gene_class.data !== null) {
            searcharr[y+1].push("(" + body.fields.gene_class.data.description.split(" ").join("+AND+").replace(/\n/g,"") + ")");
            family += body.fields.gene_class.data.description;
            }
            outarr[y].push(family);
            getHomology(WID, y);
        }
    })
}

// get concise_description from wormbase about wormbase ID, y pushes to outarr[y] in 2d array, callback getReagents
function getHomology(WID, y) {
    var reqURL = 'http://api.wormbase.org/rest/widget/gene/' + WID + '/homology';
    request.get({
        url: reqURL,
        json: true,
        headers: {
            'Content-Type': 'Content-Type:application/json'
        }
    }, function(error, response, body) {
        if (error) {
            console.log(error + ' getHomology');
        } else {
            var orthologs = "";
            if (body.fields.nematode_orthologs.data) {
            for (i = 0; i < body.fields.nematode_orthologs.data.length; i++) {
                if (body.fields.nematode_orthologs.data[i].ortholog.taxonomy == 'h_sapiens') {
            searcharr[y+1].push(body.fields.nematode_orthologs.data[i].ortholog.label);
            orthologs += body.fields.nematode_orthologs.data[i].ortholog.label + ", ";
                }
            }
          }
        outarr[y].push(orthologs.substring(0, orthologs.length - 2));
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
            console.log(error + ' getReagents');
        } else {
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
            getPheno(WID,y);
        }})
}

// get concise_description from wormbase about wormbase ID, y pushes to outarr[y] in 2d array, callback getReagents
function getPheno(WID, y) {
    // outarr.push([WID]);
    console.log('helo getpheno')
    var reqURL = 'http://api.wormbase.org/rest/widget/gene/' + WID + '/phenotype';
    request.get({
        url: reqURL,
        json: true,
        headers: {
            'Content-Type': 'Content-Type:application/json'
        }
    }, function(error, response, body) {
        if (error) {
            console.log(error + ' getPheno');
        } else {
          if ( body.fields.phenotype && body.fields.phenotype.data) {
          var innarr =[];
          for (var i = 0; i < body.fields.phenotype.data.length; i++) {
            innarr.push(Object.keys(body.fields.phenotype.data[i].evidence).join(""));
            innarr.push(body.fields.phenotype.data[i].phenotype.label + '. ');
          }
          outarr[y].push(innarr.join(" "));
          searchPub(WID,igene,y);
        }
        else {
          outarr[y].push('');
          searchPub(WID,igene,y);
        }
        }
    })
}

//pubmed search get pmids with Igene and gene in them
function searchPub(WID,igene,y) {
    var reqURL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?&db=pubmed&retmode=json&term=' + outarr[y][2] + '+AND+' + igene ;
    console.log('req url ' + reqURL);
    request.get({
        url: reqURL,
        json: true,
        headers: {
            'Content-Type': 'Content-Type:application/json'
        }
    }, function(error, response, body) {
        if (error) {
            console.log(error + ' searchPub');
        } else {
            console.log(body);
            if (body && body.esearchresult && body.esearchresult.idlist) {
              outarr[y].push(body.esearchresult.idlist.length);
              outarr[y].push(body.esearchresult.idlist.join());
            }
            else {
              outarr[y].push(0);
              outarr[y].push('Na');
            }
            setTimeout(() => {searchPubHom(WID,searcharr,y);}, 5000);
        }
    })
}

//pubmed search get pmids with Igene and gene in them
function searchPubHom(WID,arr,y) {
                if (typeof searcharr[y + 1] == 'undefined' ) {
                outarr[y].push("0");
            outarr[y].push("0");
                setTimeout(() => {getGO(WID, y);}, 5000);
                    }
    else if (arr[y + 1] == ' ' || searcharr[y + 1] == '') {
                outarr[y].push("0");
            outarr[y].push("0");
                setTimeout(() => {getGO(WID, y);}, 5000);
                    }
    else {

    var reqURL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?&db=pubmed&retmode=json&term=(' + arr[1].join("+OR+") + ")+AND+("  + arr[y+1].join("+OR+") + ")" ;
    console.log('im being called', reqURL);
    request.get({
        url: reqURL,
        json: true,
        headers: {
            'Content-Type': 'Content-Type:application/json'
        }
    }, function(error, response, body) {
        if (error) {
            console.log(error + ' searchPubHom');
        } else {
            outarr[y].push(body.esearchresult.idlist.length);
            outarr[y].push(body.esearchresult.idlist.join(", "));
            setTimeout(() => {getGO(WID, y);}, 5000);
            }
        }
    )
}
}

// get GO terms from wormbase about wormbase ID, y pushes to outarr[y] in 2d array
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
            console.log(error + 'getGO');
        } else {
            var cc = " ";
            var bp = " ";
            var mf = " ";
            for (var key in body.fields.gene_ontology_summary.data) {
                var terms = "";
                console.log("key is " + key)
                for (var i = 0; i < body.fields.gene_ontology_summary.data[key].length; i++) {
                    terms += body.fields.gene_ontology_summary.data[key][i].term_description[0]['label'] + ', ';
                }
                if (key == "Biological_process") {bp += terms}
                if (key == "Molecular_function") {mf += terms}
                if (key == "Cellular_component") {cc += terms}
                }
            outarr[y].push(cc);
            outarr[y].push(bp);
            outarr[y].push(mf);
               counter++;
            console.log(counter);
            if (counter == outarr.length-1) {
                 writeCSV(outarr);
            }

        }
    })
}


//write output csv
function writeCSV(arr) {
    fs.writeFile('output.csv', baby.unparse(outarr), function(results) {
        finished();
        console.log(searcharr);
        //console.log(outarr);
    });
}

function finished(err) {
    console.log(err);
    console.log("finished");
    //done(err);
}

mapWBID(ACCs);
}

module.exports = grab;

let ttest = 'P34308 Q19132 G5EDP6 O17766 O01884 Q9NET7 Q9TZH8 Q9XVI1 H2L0K4 G5ED43 Q9U2X0 Q21557 P54813 O17397 Q23179 W6RY92 Q18486 Q93595 Q3HKC4 O76566 H2L0N0 O61196 Q9N5G1 I2HA81 Q93934 Q9N3C2 Q9U3Q6 Q95QH4 Q7Z2A5 Q9GYM4 Q23155 P90790 Q17572 Q23457 P90904 Q965R9 Q18070 P34666 Q9U2Y2 Q9U1Q2 Q9N4G7 Q21443 G5EF84 Q09289 Q8MXQ7 P91270 G5EE80 G5EFL1 Q09285 P91079 Q2HQK3 Q9XUR4 O44511 Q9UAT3 H2KMK6 H2L048 O17387 B6VQ73 Q7JPQ6 G5EBN9 Q95NM6 O16266';
let sainte = 'P34308 Q19132 B7WN92 Q9N5G1 O01884 P90904 Q9U376 Q3HKC4 O45228 Q23179 Q20757 Q965R9 I2HA92 Q95XN1 Q22028 Q95YA9 O76566 H2L0N0 P91270 I2HAJ8 Q95QS3 Q9TZH8 O17766 Q21484 Q9XUR4 Q7JPQ6 Q4W4Z2 O61521 O61196 G5EDP6 Q94379 P34666 Q93934 Q7K6X4 O02658 Q18486 P34438 O01761 H2L046 G5EFZ1 Q9U3Q6 H2KYN0 Q9NET7 Q95QH4 Q9GYR8 G5ED43 G5EBU3 Q95XI6 Q27535 P90787 Q93546 Q9U1Q2 G5ECJ8 Q03601 I2HA81 A8WFI3 Q9XVI1 Q09967 G5EF84 Q09EE6 H2L0K4 H1ZUX7 Q21917';
let shared = 'P34308, Q9N5G1,P91270,Q9XUR4, O01884, G5EDP6, Q23179, Q9TZH8, Q9NET7, Q18486, Q9XVI1, H2L0N0, Q93934, Q9U3Q6, G5EF84, Q9U1Q2'
let nsaf = 'P34308 Q9N5G1 P91270 Q9XUR4 Q9GYR8 G5EBU3 O02345 P30639 A4UVL1 O16487 Q17439 Q18668 O01884 P83387 G5EDP6 Q19076 Q23594 P34706 Q86D00 G5EDK1 Q23179 Q9TZH8 Q9NET7 Q18486 Q9XVI1 H2L0N0 W6RY92 Q21557 G5EF72 Q17572 Q9N3C2 Q7Z2A5 Q93934 Q23457 Q23155 Q9N4G7 Q9U3Q6 Q9U2Y2 Q18070 G5EEF0 Q09289 G5EF84 Q9U1Q2 Q9GYM4 Q18407 O44471 P90790 H2KMK6 G5EFL1 Q20623 Q21443 G5EE80 Q09285 Q2HQK3 Q9XVD2 G5EBW5 P46502 O16568 O17387 Q9UAT3 B6VQ73 G5EBN9 Q9BPN8 O44511';
let actual = 'P34308 Q19132 Q9N5G1 O01884 P90904 Q3HKC4 Q23179 Q965R9 O76566 H2L0N0 P91270 Q9TZH8 O17766 Q9XUR4 Q7JPQ6 O61196 G5EDP6 P34666 Q93934 Q7K6X4 Q18486 Q9U3Q6 H2KYN0 Q9NET7 Q95QH4 Q9GYR8 G5ED43 G5EBU3 Q9U1Q2 I2HA81 Q9XVI1 Q9N4G7 Q09EE6 G5EF84 H2L0K4 Q09289 H1ZUX7 Q9UAT3 Q9N3C2 Q9U2X0 Q9U2Y2 P54813 O17397 Q93595 H2KMK6 W6RY92 Q8MXQ7 O16487 A4UVL1 P30639 O02345 P46502 Q2HQK3 Q7Z2A5 O16266 Q21557 Q21443 Q17439'
grab(actual);
// mapWBID("Q3HKC4");
// mapWBID("Q19132 O01884 G5EEL1 Q9TZH8 O76566 Q8IU00 Q20757 V6CJI0 Q95YA9 I2HA92 Q23179 Q9N5G1 H2L046 Q9U376 B7WN92 Q19663 P91013 Q95Q18 Q3HKC4 O45228 O17766 P90904 O61196 Q9N3C2 H2L0N0 Q9U3Q6 Q95QH4 Q93934 P34666 Q9N4E2 Q8I4L0");
//}
//mapWBID(arrJoined);
