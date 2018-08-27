var express = require('express');
var router = express.Router();
var path = require('path');
var request = require('request');
var grab = require('../grab');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/', function(req, res, next) {
   var ACCs = req.body.ACC;
    var inputGene = req.body.igene;
    if (ACCs === 'undefined' || inputGene === 'undefined') {
      {res.render('index', { error : " Please provide bait and prey accessions" })}
    }
    if (ACCs.split(" ").length > 51) {res.render('index', { error : " Max input 50 UNIPROT Accesion numbers at a time!" })}
    validUNI(ACCs);
    validUNI(inputGene);
      function validUNI (str) {
       if (str.search(/[^A-Z,0-9 ]/gm) !== -1 ) {
        res.render('index', { error : "Please enter valid uniprot accession Ids" });
         }};
    grab(req.body.igene, req.body.ACC, res, () => {
      res.sendFile(path.join(__dirname, '../output.csv'));
    });
});

router.post('/ok', function(req, res, next) {
    console.log(req.body['g-recaptcha-response']);
});



module.exports = router;
