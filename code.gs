// Noah Linton
// Developed for FRC4039-MakeShift Robotics 

// sheetID: 1yF1G-1NP5eI_XkJdSNXQk6bC841P6SPHnyVnMiU_xns
var sheetID = '1y1lXcTZz5t0fQ-7TknDwHR6yEqVgJ_olaBAg65JGcfQ';

// Notes:
// Poor Scouting Data cases:
// - robot completely missed (5/6 robots scouted)
// - wrong team number entered, but the correct robot was watched
// - two scouters watched the same robot (double entry) - flag in a different colour
// - any combination of the above

// Meeting Notes:
// having keywords for commenting
// rehearse scouting rotation and uploading
// lesson on good comments


//ToDo's:
/*
 - add constants section such that variable names can be updated easily each year
 - fix schedule logic so that if we are prescouting an event that we are not in, it does not break (currently commented out)

*/


//Custom menu at top of page
function onOpen(e) {
  SpreadsheetApp.getUi()
      .createMenu('Scouting Functions')
      .addItem('1. Start of Day', 'startOfDay')
      .addItem('2. Through out day', 'throughoutDay')
      .addSeparator()
      .addSubMenu(SpreadsheetApp.getUi().createMenu('Advanced (dont use)')
          .addItem('Clear QC Sheet', 'clearQC')
          .addItem('Get TBA Schedule', 'getTBASchedule')
          .addItem('QC Data', 'qcScout')
          .addItem('Get List of Matches', 'get4039Matches')
          )
      .addToUi();
}

//=========================================================

function startOfDay(){
  clearQC();
  getTBASchedule();
  get4039Matches();
}

function throughoutDay(){
  clearQC();
  getTBASchedule();
  qcScout();
}


//======================= Useful Functions ==================================
// clear 'QC' sheet data - except the headers. This also maintains the conditional formatting
function clearQC(){
  var sheet = SpreadsheetApp.openById(sheetID).getSheetByName('QC');
  sheet.getRange("A3:G").clear();
  sheet.getRange("H3:T").clearContent();
}


//Sends a request to The Blue Alliance API with the passed query and returns the data as a parsed JSON object String
function getData(query){
  var baseUrl = 'https://www.thebluealliance.com/api/v3';
  var key = '?X-TBA-Auth-Key=oJmQcyPfa1C9HDI6pRMDtHNt9RGhvcPSRg8f46e7aTLGmvr17xlceTAmsWMeA9ZI';
  
  var url = baseUrl+query+key;
  
  //Logger.log(url); // this link is helpful for testing with REST API Client
  
  var response = UrlFetchApp.fetch(url, {'muteHttpExceptions': true});
  var json = response.getContentText();
  var data = JSON.parse(json);
  
  return data;
}

// pulls event key from QC sheet to be used in TBA API Calls
function getEventKey(){
  return SpreadsheetApp.openById(sheetID).getSheetByName('QC').getRange("A1").getValue();
}

//=========================================================

//======================= Main Functions ==================================

// Calls TBA API for event schedule, displays in sheet called QC
function getTBASchedule(){
  clearQC(); //clear match schedule and formatting, and clears the summary of data, but does NOT clear the conditional formatting
  var eventKey = getEventKey(); // get event key from QC sheet A1
  var query = "/event/" + eventKey + "/matches/simple"; 
  var data = getData(query);
  //var insights = getInsights();
  var matches = [];
  var match = [];
  var countMatches = 0;

  //commented out March 21, 2024 Thursday before Northbay because this function requires editing a protected cell in dashboard that causes problems when running rest of function with student google account.
  //get4039Matches(eventKey); // get the list of our matches for the event, and put them off to the right to be used in the dashboard
  
  // create schedule array 
  for(var matchIter = 0; matchIter<=data.length-1; matchIter++){
    if(data[matchIter].comp_level == "qm"){
      countMatches++;
      // add match number to start of row
      match.push(data[matchIter].match_number);
      
      // add each blue team to the array
      for(var blue = 0; blue <= 2; blue++){
        match.push(data[matchIter].alliances.blue.team_keys[blue].substring(3));
      }
      // add each red team to the array
      for(var red = 0; red <= 2; red++){
        match.push(data[matchIter].alliances.red.team_keys[red].substring(3));
      }
      
      // Add which alliance wasa predicted to win the match to the end of the list 
      //match.push(insights[data[matchIter].match_number-1]);
      match.push(" ");

      // Add which alliance won the match to the end of the list 
      //match.push(data[matchIter].winning_alliance);
      match.push(" ");
      
      
      //add to the main array, and clear inner array
      matches.push(match);
      match = [];
    }
  }
  // print array results to the spreadsheet.
  SpreadsheetApp.openById(sheetID).getSheetByName('QC').getRange(3, 1, countMatches, 9).setValues(matches).sort([{column: 1, ascending: true}]);
}

//=========================================================

// qcScout() checks the event schedule created by getTBASchedule(eventKey) against our scouted data, and formats the background colour accordingly
function qcScout(){
  var schedule = [];
  var scoutedData = [];

  //copyData(); //Used for hybrid data. See instructions at defintion for implementation

  schedule = SpreadsheetApp.openById(sheetID).getSheetByName('QC').getRange("A3:H").getValues(); // get the schedule that is already in the QC Sheet

  SpreadsheetApp.openById(sheetID).getSheetByName('ScoutedData').sort(3, true); //sort scouted data by match first
  scoutedData = SpreadsheetApp.openById(sheetID).getSheetByName('ScoutedData').getRange("C2:D").getValues(); //get the scouted data from the data sheet

  Logger.log(scoutedData);
  
  var sheetQC = SpreadsheetApp.openById(sheetID).getSheetByName('QC');
  
  var team = 0;
  var matchNumber = 0;
  var match = 0;
  //var insights = getInsights(); // need to move this such that it does not use internet
  var numMatches = 0;
  var badMatches = [];
  
  while(schedule[match][0] != ""){ // loop through all of the matches listed in the schedule
    numMatches += 1;
    matchNumber = schedule[match][0]; // get match number from schedule array
    for(var teamIter = 1; teamIter < 7; teamIter++){ // loops through all 6 teams in each match
      team = schedule[match][teamIter]
      for(var a = 0; a < scoutedData.length; a ++){ // loop through all scouted data. 
        if(scoutedData[a][0] == matchNumber && scoutedData[a][1] == team){ // if match numbers match AND team numbers match set background to green
          sheetQC.getRange(match+3, teamIter+1).setBackground('#41fc03');
          break;
        }else{} // TODO: record the match number, and the teamNumber in "bad" lists, which we can go through at a later point to look deeper at those matches
      }
    }

    /*
    // check if insights matches the true result of the match. // moved so qcScout does not need internet
    if(insights[match] != schedule[match][7]){
      sheetQC.getRange(match+3, 8).setBackground('red'); // set background to red if it does not match the prediction
    }
    */
    match += 1;
  }
  
  // show data on a per match basis beside the schedule to easily identify wrong data
  match = 0;
  var row = 0;
  var col = 0;
  while(scoutedData[match][0] != ""){
    sheetQC.getRange(row+3, col+11).setValue(scoutedData[match][1]); // set value of team number
    if(scoutedData[match][0] != scoutedData[match+1][0]){ // if the match # does not match the next number, go to the next line
      row += 1;
      col = 0;
    }else{
      col +=1
    }
    match += 1;
  }
  
  // TODO: use a function to deep dive into "bad matches" - count of how many teams per match
     // check for 6 teams per match scouted
     // check for unique teams

}

//=========================================================

function copyData(){ //used for hybrid scouting to merge to sheets together. Not currently implemented. If we want this, create 3 sheets (remote, in person, combined). Use query in combined, then this script copies the data to Scouted Data sheet.
  SpreadsheetApp.openById(sheetID).getSheetByName('ScoutedData').getRange("A2:U1700").clear();
  combinedData = SpreadsheetApp.openById(sheetID).getSheetByName('CombinedData').getRange("A2:U1700").getValues();
  SpreadsheetApp.openById(sheetID).getSheetByName('ScoutedData').getRange("A2:U1700").setValues(combinedData);

}



//=========================================================

// getInsights() returns an array of match predictions from TBA
function getInsights(){
  var eventKey = getEventKey();
  var query = "/event/" + eventKey + "/predictions"; 
  var insightsData = getData(query);
  var insights = [];
  var i = 0;
  var keys = Object.keys(insightsData["match_predictions"]["qual"]); // gets list of all the objects in 'qual' which should be all of the matches

 
  for(var matchNumber = 1; matchNumber <= keys.length; matchNumber++){ 
    insights.push(insightsData["match_predictions"]["qual"][eventKey+"_qm"+matchNumber]["winning_alliance"]);
    
  }

  return insights;
}

//=========================================================

// gets TBA data based on the Event Key used on the QC sheet
function getMatchAPIData(){
  var eventKey = getEventKey();
  var query = "/event/" + eventKey + "/matches";
  var rawMatchData = getData(query);
  //Logger.log(rawMatchData);
  
  var matchArray = [];
  var matchData = [];
  
  for (var match = 0; match < rawMatchData.length; match++){
    if (rawMatchData[match].comp_level == "qm" && rawMatchData[match].score_breakdown != null){ // only get data from qualification matches
      Logger.log(match);
      matchData.push(rawMatchData[match].match_number);
      matchData.push(rawMatchData[match].alliances.red.team_keys[0].substring(3));
      matchData.push(rawMatchData[match].score_breakdown.red.initLineRobot1);
      matchData.push(rawMatchData[match].score_breakdown.red.endgameRobot1);
      matchArray.push(matchData); // adds array to main array
      matchData = [];
      matchData.push(rawMatchData[match].match_number);
      matchData.push(rawMatchData[match].alliances.red.team_keys[1].substring(3));
      matchData.push(rawMatchData[match].score_breakdown.red.initLineRobot2);
      matchData.push(rawMatchData[match].score_breakdown.red.endgameRobot2);
      matchArray.push(matchData); // adds array to main array
      matchData = [];
      matchData.push(rawMatchData[match].match_number);
      matchData.push(rawMatchData[match].alliances.red.team_keys[2].substring(3));
      matchData.push(rawMatchData[match].score_breakdown.red.initLineRobot3);
      matchData.push(rawMatchData[match].score_breakdown.red.endgameRobot3);
      matchArray.push(matchData); // adds array to main array
      matchData = [];
      matchData.push(rawMatchData[match].match_number);
      matchData.push(rawMatchData[match].alliances.blue.team_keys[0].substring(3));
      matchData.push(rawMatchData[match].score_breakdown.blue.initLineRobot1);
      matchData.push(rawMatchData[match].score_breakdown.blue.endgameRobot1);
      matchArray.push(matchData); // adds array to main array
      matchData = [];
      matchData.push(rawMatchData[match].match_number);
      matchData.push(rawMatchData[match].alliances.blue.team_keys[1].substring(3));
      matchData.push(rawMatchData[match].score_breakdown.blue.initLineRobot2);
      matchData.push(rawMatchData[match].score_breakdown.blue.endgameRobot2);
      matchArray.push(matchData); // adds array to main array
      matchData = [];
      matchData.push(rawMatchData[match].match_number);
      matchData.push(rawMatchData[match].alliances.blue.team_keys[2].substring(3));
      matchData.push(rawMatchData[match].score_breakdown.blue.initLineRobot3);
      matchData.push(rawMatchData[match].score_breakdown.blue.endgameRobot3);
      matchArray.push(matchData); // adds array to main array
      matchData = [];
      //matchData.push(" "); //creates a space
      //matchData.push(rawMatchData[match].score_breakdown.blue.autoCellsInner);
      //matchData.push(rawMatchData[match].score_breakdown.blue.teleopCellsInner);
    }
  }

  var numCols = matchArray[0].length;
  var numRows = matchArray.length;
  SpreadsheetApp.openById(sheetID).getSheetByName('TBA Data').getRange(2, 1, numRows, numCols).clear();
  SpreadsheetApp.openById(sheetID).getSheetByName('TBA Data').getRange(2, 1, numRows, numCols).setValues(matchArray).sort([{column: 1, ascending: true}]);
}

//=========================================================

// get4039Matches() prints a list of 4039 matches for the event listed in QC sheet. Called when getting TBA schedule
function get4039Matches(eventKey){
  //var eventKey = '2024onnob';
  var eventKey = getEventKey(); // get event key from QC sheet A1
  var query = '/team/frc4039/event/'+ eventKey+'/matches/keys';
  var matchListData = getData(query);
  var matchListOuter = [];
  var matchList = [];
  var numRows = matchListData.length;
  
  Logger.log(matchListData);
  if (numRows == 0){
    SpreadsheetApp.openById(sheetID).getSheetByName('4039 PreMatch Dashboard').getRange("M2:M").clear();
    SpreadsheetApp.openById(sheetID).getSheetByName('4039 PreMatch Dashboard').getRange(2, 13, 1, 1).setValue("No matches for 4039 found");
  }else{
    numRows = 0;
    for(var match in matchListData){
      if (matchListData[match].indexOf('qm') != -1){
        var index = matchListData[match].indexOf('qm');
        matchList.push(matchListData[match].substring(index+2));
        matchListOuter.push(matchList);
        matchList = [];
        numRows++;
      }
    } 
    SpreadsheetApp.openById(sheetID).getSheetByName('4039 PreMatch Dashboard').getRange("M2:M").clear();
    SpreadsheetApp.openById(sheetID).getSheetByName('4039 PreMatch Dashboard').getRange(2, 13, numRows, 1).setValues(matchListOuter).sort([  {column: 13, ascending: true}]);

  }  
}

//=========================================================

//get list of team at event.

// put list in a sheet.

// sarah to write comments in the box beside the team number

//comments to appear on pre-match dashboard

function teamList(){
  var eventKey = getEventKey();
  var query = "/event/" + eventKey + "/teams";
  var rawData = getData(query);
  var teams = [];

  for (var team = 0; team < rawData.length; team++){
    teams.push([rawData[team].team_number]);
  }

Logger.log(teams);
  SpreadsheetApp.openById(sheetID).getSheetByName('Sarahs Comments').getRange(2, 1, rawData.length, 2).clear();
  SpreadsheetApp.openById(sheetID).getSheetByName('Sarahs Comments').getRange(2, 1, rawData.length, 1).setValues(teams).sort([{column: 1, ascending: true}]);

//SpreadsheetApp.openById(sheetID).getSheetByName('Sarahs Comments').getRange().setValues()


}







//=========================================================
//=========================================================
//=========================================================
//=========================================================
//=========================================================















//get links to matches - work in progress
// TODO: make this work
function getMatchLinks(teamNumber){
  //return teamNumber;
  
  //var eventKey = getEventKey();
  var eventKey = '2020onto1'; 
  //var teamNumber = '4039'; // comment this out!!
  var query = '/team/frc'+teamNumber+'/event/'+ eventKey+'/matches/keys';
  var matchKeys = getData(query);
  var matchLinks = [];
  
  //Logger.log(matchKeys);
  if(matchKeys.length > 0){
     for(var match in matchKeys){
       matchLinks.push('https://www.thebluealliance.com/match/'+matchKeys[match]);
     }
    //Logger.log(matchLinks);
    return(matchLinks);
  }
  else{
    //Logger.log("team not found");
    return "team not found";
  }

}



function testThing(){
  var formID = SpreadsheetApp.openById(sheetID).getSheetByName('QC').getRange("E1").getValue();
  var url = 'https://kc.kobotoolbox.org/api/v1/data/' + formID +'?format=json';
  Logger.log(url);
  
}



//MakeShift Stats
// get highest MakeShift alliance score - offseason (used for celebration dinner)

// loop through each year
// get list of events from each year
// loop through each event
// loop through all matches
// find what alliance 4039 is on
// find the alliance score of that match
// check that score against the current high score 

// log the highest score, and some information about 

function getAll4039MatchesEver(){
  var highscore = {
    "score": 0,
    "matchKey": ""
  };
  var query = '/team/frc4039/events/keys';
  var eventKeys = getData(query);
  var matchData = [];
  var innerMatchData = [];
  var blue1 ="";
  var blue2 ="";
  var blue3 ="";
  var red1 ="";
  var red2 ="";
  var red3 ="";
  var blueScore = 0;
  var redScore = 0;
  var winningAlliance = "";
  var winAgainst = [];
  var winWith = [];
  var loseAgainst = [];
  var loseWith = [];
  
  for (var key in eventKeys){
    //Logger.log(eventKeys[key]);
    var query2 = '/team/frc4039/event/'+eventKeys[key]+'/matches/simple';
    var matches = getData(query2);
    for(var match in matches){
      
      //set values 
      blue1 = matches[match]["alliances"]["blue"]["team_keys"][0];
      blue2 = matches[match]["alliances"]["blue"]["team_keys"][1];
      blue3 = matches[match]["alliances"]["blue"]["team_keys"][2];
      red1 = matches[match]["alliances"]["red"]["team_keys"][0];
      red2 = matches[match]["alliances"]["red"]["team_keys"][1];
      red3 = matches[match]["alliances"]["red"]["team_keys"][2];
      blueScore = matches[match]["alliances"]["blue"]["score"];
      redScore = matches[match]["alliances"]["red"]["score"];
      
      winningAlliance = matches[match]["winning_alliance"];
      
      // push values into array
      innerMatchData.push(matches[match]["key"]);
      innerMatchData.push(blue1);
      innerMatchData.push(blue2);
      innerMatchData.push(blue3);
      innerMatchData.push(blueScore);
      innerMatchData.push(red1);
      innerMatchData.push(red2);
      innerMatchData.push(red3);
      innerMatchData.push(redScore);
      
      //reset array for next row
      matchData.push(innerMatchData);
      innerMatchData = [];
      
      // check which alliance 4039 was on and check and update highscore
      if( blue1 == 'frc4039' || blue2 == 'frc4039' || blue3 == 'frc4039'){
        // we are blue
        if (blueScore > highscore.score){
          highscore.score = blueScore;
          highscore.matchKey = matches[match]["key"];
        }
        // if winning_alliance == blue -> update win against, win with
        //else -> update lose against, lose with
        
        if (winningAlliance == "blue"){
          winAgainst.push([red1]);
          winAgainst.push([red2]);
          winAgainst.push([red3]);
          if(blue1 != 'frc4039'){winWith.push([blue1]);}
          if(blue2 != 'frc4039'){winWith.push([blue2]);}
          if(blue3 != 'frc4039'){winWith.push([blue3]);}
        }else{
          loseAgainst.push([red1]);
          loseAgainst.push([red2]);
          loseAgainst.push([red3]);
          if(blue1 != 'frc4039'){loseWith.push([blue1]);}
          if(blue2 != 'frc4039'){loseWith.push([blue2]);}
          if(blue3 != 'frc4039'){loseWith.push([blue3]);}
        }
        
      }else if( red1 == 'frc4039' || red2 == 'frc4039' || red3 == 'frc4039') {
        // we are red
        if(redScore > highscore.score){
          highscore.score = redScore;
          highscore.matchKey = matches[match]["key"];
        }
        if (winningAlliance == "red"){
          winAgainst.push([blue1]);
          winAgainst.push([blue2]);
          winAgainst.push([blue3]);
          if(red1 != 'frc4039'){winWith.push([red1]);}
          if(red2 != 'frc4039'){winWith.push([red2]);}
          if(red3 != 'frc4039'){winWith.push([red3]);}
        }else{
          loseAgainst.push([blue1]);
          loseAgainst.push([blue2]);
          loseAgainst.push([blue3]);
          if(red1 != 'frc4039'){loseWith.push([red1]);}
          if(red2 != 'frc4039'){loseWith.push([red2]);}
          if(red3 != 'frc4039'){loseWith.push([red3]);}
        }
      }
      
    }
  }
  
  var numRows = matchData.length;
  var numCols = matchData[0].length;
  
  SpreadsheetApp.openById(sheetID).getSheetByName('MakeShift Stats').getRange(2, 1, numRows, numCols).clear();
  SpreadsheetApp.openById(sheetID).getSheetByName('MakeShift Stats').getRange(2, 1, numRows, numCols).setValues(matchData);//.sort([{column: 12, ascending: true}]);
  Logger.log(highscore);
  
  Logger.log(winWith);
  
  SpreadsheetApp.openById(sheetID).getSheetByName('MakeShift Stats').getRange(2, numCols+2, winWith.length, 1).setValues(winWith);
  SpreadsheetApp.openById(sheetID).getSheetByName('MakeShift Stats').getRange(2, numCols+3, winAgainst.length, 1).setValues(winAgainst);
  SpreadsheetApp.openById(sheetID).getSheetByName('MakeShift Stats').getRange(2, numCols+4, loseWith.length, 1).setValues(loseWith);
  SpreadsheetApp.openById(sheetID).getSheetByName('MakeShift Stats').getRange(2, numCols+5, loseAgainst.length, 1).setValues(loseAgainst);
}






// takes a list of badMatches and scouted data, and returns information about each match
function investigateMatches(badMatches, scoutedData){ // badMatches is a list of integers, scoutedData is all our data from the spreadsheet
  // loop through each match in badMatches
      // get scoutedData for that match
      // count number of entries (should be 6), else throw a flag (print to spreadsheet?)
      // check number of unique teams (should also be 6), else throw a different flag (print to spreadsheet?)
}
















