var express = require('express');
var router = express.Router();
var kue = require('kue')
var queue = kue.createQueue();
var path = require('path');
var request = require('request');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/', function(req, res, next) {
   var ACCs = req.body.ACC;
    validUNI(req.body.ACC);
              function validUNI (str) {
        if (str.split(" ").length > 51) {res.render('index', { error : " Max input 50 UNIPROT Accesion numbers at a time!" })}
       if (str.search(/[^A-Z,0-9 ]/gm) === -1 ) {
           var job = queue.create('grab', {
    ACC : str
}).save();
    job.on('failed', function(errorMessage){
        console.log(errorMessage);
  res.render('index', { error : " Server Error - please try again later. Make sure inputs are valid UNIPROT Accession numbers "});});
    job.on('complete', function(id){
  res.sendFile(path.join(__dirname, '../output.csv'))
    })
}
        else {res.render('index', { error : " Invalid input - Please submit SPACE seperated valid UNIPROT Accession numbers " })};
}});



module.exports = router;

