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
    
    if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
    return res.render('index', { error : "Please select captcha"});
  };
    
    var secretKey = "6LcbuwgUAAAAAHysajJdopn-S-ctHWDHFHaJVcwy";
  // req.connection.remoteAddress will provide IP address of connected user.
  var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
  // Hitting GET request to the URL, Google will respond with success or error scenario.
  request(verificationUrl,function(error,response,body) {
    
    function validUNI (acc) {
        if (acc.split(" ").length > 51) {res.render('index', { error : " Max input 50 UNIPROT Accesion numbers at a time!" })}
       if (acc.search(/[^A-Z,0-9 ]/gm) === -1 ) {console.log('good')}
        else {res.render('index', { error : " Invalid input - Please submit SPACE seperated valid UNIPROT Accession numbers " })}
        
    }
    validUNI(req.body.ACC);

var job = queue.create('grab', {
    ACC : req.body.ACC
}).save();
    job.on('failed', function(errorMessage){
        console.log(errorMessage);
  res.render('index', { error : " Server Error - please try again later. Make sure inputs are valid UNIPROT Accession numbers "});});
    job.on('complete', function(id){
  res.sendFile(path.join(__dirname, '../output.csv'))
    })
})});



module.exports = router;