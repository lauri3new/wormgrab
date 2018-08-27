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
    console.log(inputGene);
    validUNI(req.body.ACC);
              function validUNI (str) {
        if (str.split(" ").length > 51) {res.render('index', { error : " Max input 50 UNIPROT Accesion numbers at a time!" })}
       if (str.search(/[^A-Z,0-9 ]/gm) === -1 ) {
           console.log('grabcalled');

         }};
    grab(req.body.ACC, res, () => {
      res.sendFile('../output.csv');
    });
});

router.post('/ok', function(req, res, next) {
    console.log(req.body['g-recaptcha-response']);
});



module.exports = router;
