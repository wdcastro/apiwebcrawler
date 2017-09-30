var request = require('request');
var fs = require('fs');

var sessionId = null;
var firstRun = true;


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
  var addresslist = {
    'william': '4 Moreau Drive',
    'qbit' : '16/386 Wanneroo Rd, Westminster WA 6061',
    'ausnet' : '254 Scarborough Beach Rd., Doubleview WA 6018'
  }

  addressArray = Object.keys(addresslist);

  addressArray.forEach(function(listItem,index){

    //TODO: check for 3/741 etc unit addresses and parse them correctly do i really ned to? the search engine should parse it to the right one anyway

    var address = sanitize(addresslist[addressArray[index]]);
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
  console.log("Checking for client: "+clientName+" at address: "+addressText);
  var requestForm = {'addressId':addressId, 'sessionId': sessionId};

  var csvData = "";
  console.log("Using sessionId: "+sessionId);

  request.post({url: 'https://signup.iinet.net.au/api/servicequalification', form: requestForm}, function(error, response, body){
      console.log("Error: "+error);

      var data = JSON.parse(body).availability;

      if(firstRun){ //print the keys if first entry
        csvData += "Client Name, Client Address,";
        for(var key in data){
          csvData += key+",";
        }
        csvData += "\r\n";
        firstRun = false;
      }

      console.log(clientName+": "+addressText);
      csvData += "\""+clientName+"\","+"\""+addressText+"\",";

      for (var key in data) {
        console.log(key+' -> '+data[key]);

        csvData += data[key]+",";
      }

      csvData += "\r\n";

      console.log("-------------------------------------------------------------");
      fs.appendFile("test.txt", csvData, 'utf8', function(){
        console.log("file write finished");
      });
  });
}

function sanitize(value){
  return value.replace("<","%3C").replace(">","%3E").replace("\"","%22").replace("\'","%27").replace("@","%40");
}

console.log("Server started");

startNewSession();
