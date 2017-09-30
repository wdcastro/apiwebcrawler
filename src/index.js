var request = require('request');
var fs = require('fs');

var sessionId = null;
var firstRun = true;

var clientListObject = {};

function loadAddressesToSearch(){

  //load from query
  /*
  var options = {
    url: '',
    headers: {
      'Authorization': "Basic "+privkeyB64+"=="+pubkB64
    }
  }

  request.post(options, function (error, response, body){
    var data = JSON.parse(body);
    for(key in data){
      clientListObject[data[key].name] = data[key].address;
    }
    startNewSession();
  });
  */


  //loading from a file
  /*
  fs.readFile('customers.txt', 'utf8', function (err,data) {

    if (err) {
      return console.log(err);
    }
    var addressArray = data.split("\n");
    for(item in addressArray){
      var stringArray = addressArray[item].split(",");
      //console.log(stringArray);
      clientListObject[stringArray[0]] = stringArray[1];
      //console.log(clientListObject);
    }
    startNewSession();
  });*/
}

function startNewSession(){

  console.log("Starting session...");
  requestform = { 'resellerUsername':null, 'tisp':'iiNet'};

  request.post({url:'https://signup.iinet.net.au/api/session', form: requestform}, function(error, response, body){
    if(error != null){

      console.log("Error:", error);

    }
    //console.log("response:", response);

    sessionId = JSON.parse(body).id;
    console.log("Session started: "+sessionId);
    getAddressID();
  })
}

function getAddressID(){ //TODO: add file variable
  console.log("Getting address ID");

  var addressArray = Object.keys(clientListObject);

  addressArray.forEach(function(listItem,index){

    //TODO: check for 3/741 etc unit addresses and parse them correctly do i really ned to? the search engine should parse it to the right one anyway

    var address = sanitize(clientListObject[addressArray[index]]);
    console.log("Getting address for client: "+addressArray[index]+" at address: "+address);
    request.get({url:'https://signup.iinet.net.au/api/address?search='+address}, function(error,response,body){
      if(error != null){
        console.log("Error: " + error);
      } else {
        var entry = JSON.parse(body);
        console.log("Address Text: "+entry[0].text);
        console.log("Address ID: "+entry[0].id);
        checkAvailability(addressArray[index],entry[0].text,entry[0].id);
      }
    });
  });
}

function checkAvailability(clientName, addressText, addressId){
  var requestForm = {'addressId':addressId, 'sessionId': sessionId};

  var csvData = "";
  console.log("Using sessionId: "+sessionId);

  request.post({url: 'https://signup.iinet.net.au/api/servicequalification', form: requestForm}, function(error, response, body){
      console.log("Error: "+error);

      var data = JSON.parse(body).availability;

      if(firstRun){ //print the keys if first entry
        csvData += "Client Name, Client Address,";
        for(var key in data){
          csvData += csvSanitize(key)+",";
        }
        csvData += "\r\n";
        firstRun = false;
      }

      console.log(clientName+": "+addressText);
      csvData += "\""+csvSanitize(clientName)+"\","+"\""+csvSanitize(addressText)+"\",";

      for (var key in data) {
        console.log(key+' -> '+data[key]);

        csvData += csvSanitize(data[key])+",";
      }

      csvData += "\r\n";

      console.log("-------------------------------------------------------------");
      fs.appendFile("test.txt", csvData, 'utf8', function(){
        console.log("file write finished");
      });
  });
}

function sanitize(value){
  return value.toString().replace(/</g,"%3C").replace(/>/g,"%3E").replace(/\"/g,"%22").replace(/\'/g,"%27").replace(/@/g,"%40");
}

function csvSanitize(value){
  return value.toString().replace(/\"/g,"").replace(/\'/g,"").replace(/,/g,"");
}

console.log("Server started");

loadAddressesToSearch();
//startNewSession();
