// <------- CONSTANTS TO CHANGE -------> //
let SPEED = 10;
let SENSITIVITY = 4;
let BRUSH_SIZE = 20;
let GOAL_FREQ = 6;
let GRID_SIZE = 12;

// <------- DO NOT TOUCH BELOW -------> //

// serial communication
let portName;
let serial;
let latestData = "waiting for data";

// declare styles
let backgroundColor;
let darkBackgroundColor;
let greatColor;
let okayColor;
let badColor;
let gridColor;
let font;

// notes
let midTone;
let highTone;
let lowTone;
let toneCount;
let successTone;
let unsuccessTone;

// global vars
let gameScreen;
let startPos;

let gridIncrement;
let midVal;

let path;

let ang;
let x;
let y;

let currState;

let currPeriod = [0];
let periods = [];
let isPositive;
let seen = false;
let goalPeriodLength;

let pointsToSave = [];
let fileCount = 0;

function preload() {
  // loaders
  loadColors();
  loadFonts();
  loadSounds();
}

function setup() {
  // visual setup
  createCanvas(window.innerWidth, window.innerHeight);
  background(backgroundColor);
  textFont(font);

  // Instantiate our SerialPort object
  portName = new Env().port;
  serial = new p5.SerialPort();
  serial.list();
  let options = { baudRate: 115200 }; // change the data rate to whatever you wish
  serial.open(portName, options);
  serial.on('connected', serverConnected);
  serial.on('list', gotList);
  serial.on('data', gotData);
  serial.on('error', gotError);
  serial.on('open', gotOpen);
  serial.on('close', gotClose);

  // initialize data
  gameScreen = 0;
  gridIncrement = width / GRID_SIZE;
  startPos = gridIncrement * 3;
  midVal = floor((height / gridIncrement) / 2) * gridIncrement;
  goalPeriodLength = width / GOAL_FREQ;
  path = new Path(BRUSH_SIZE);
  y = height / 2;
  x = 0;

  toneCount = 0;

}

function draw() {
  background(backgroundColor);

  if (gameScreen == 0) {
    initGame();
  } else if (gameScreen == 1) {
    playGame();
  }

}

// <------------- PRELOAD FUNCTIONS -------------> //
// load colors 
function loadColors() {
  colorMode(HSB, 360, 100, 100);
  backgroundColor = color(15, 55, 94);
  darkBackgroundColor = color(16, 53, 100);
  gridColor = color(43, 13, 98);
  greatColor = color(136, 51, 66);
  okayColor = color(38, 75, 95);
  badColor = color(18, 81, 91);
}

// load fonts 
function loadFonts() {
  font = loadFont("../../../assets/fonts/GothamRounded-Bold.otf");
}

function loadSounds() {
  soundFormats('wav', 'ogg');
  midTone = loadSound('sound/Frequency_Matching_v1.a_Wood_Block_Counter-003');
  highTone = loadSound('sound/Frequency_Matching_v1.a_Wood_Block_Counter-002');
  lowTone = loadSound('sound/Frequency_Matching_v1.a_Wood_Block_Counter-001');
  successTone = loadSound('sound/Frequency_Matching_v1.a_Success_Chord');
  unsuccessTone = loadSound('sound/Frequency_Matching_v1.a_Unsuccessful_Chord');
}

// <------------- SETUP FUNCTIONS -------------> //
// we are connected and ready to go
function serverConnected() {
  print("Connected to Server");
}

// got the list of ports
function gotList(thelist) {
  print("List of Serial Ports:");
  for (let i = 0; i < thelist.length; i++) {
    print(i + " " + thelist[i]);
  }
}

// connected to our serial device
function gotOpen() {
  print("Serial Port is Open");
}

function gotClose() {
  print("Serial Port is Closed");
  latestData = "Serial Port is Closed";
}

// if there is an error, log it
function gotError(theerror) {
  print(theerror);
}

// there is data available to work with from the serial port
function gotData() {
  let incomingAngle = serial.readStringUntil('\n');
  if (!incomingAngle) return;
  incomingAngle = float(incomingAngle);

  // altering incoming angle val to fit interaction
  if (incomingAngle > 0) {
    ang = incomingAngle - 90;
  } else {
    ang = 270 + incomingAngle;
  }
  // ang = incomingAngle + 90;
}

// <------------- DRAWING FUNCTIONS -------------> //
function initGame() {
  background(backgroundColor);
  drawingPlayArea();
  drawingGrid();

  // instruction box
  rectMode(CENTER);
  fill(gridColor);
  rect(width / 2, height / 4, width * 0.5, height * 0.2, 10, 10, 10, 10);

  // text
  noStroke();
  textAlign(CENTER);
  textSize(30);
  fill(backgroundColor);
  text("Try to make the whole screen green!", width / 2, height / 4 - 20);
  textSize(20);
  text("(click anywhere to start)", width / 2, height / 4 + 30);
}

function playGame() {

  if (frameCount > 100) {
    if (frameCount <= 160) {
      drawingCount("3");
    } else if (frameCount > 160 && frameCount <= 220) {
      drawingCount("2");
    } else if (frameCount > 220 && frameCount <= 280) {
      drawingCount("1");
    } else {
      clear();
      background(backgroundColor);
      drawingPlayArea();
    }
    // passes midline
    if (y > midVal + BRUSH_SIZE / 2) {
      if (isPositive) {
        isPositive = false;
        currPeriod.push(x);
        midTone.play();
        toneCount = 0;
      }
    }

    // passes midline
    if (y < midVal - BRUSH_SIZE / 2) {
      if (!isPositive) {
        isPositive = true;
        currPeriod.push(x);
        midTone.play();
        toneCount = 0;
      }
    }

    // lower bound
    if (path.lastPt()) {
      if (path.lastPt().y > y) {
        if (currState == "increasing" && toneCount == 0) {
          lowTone.play();
          toneCount = 1;
        }
        currState = "decreasing";
      }

      // upper bound
      if (path.lastPt().y < y) {
        if (currState == "decreasing" && toneCount == 0) {
          highTone.play();
          toneCount = 1;
        }
        currState = "increasing";
      }
    }

    if (currPeriod.length == 3) {
      p = sort(currPeriod, 3);
      periods.push(p);
      currPeriod = [];
      currPeriod.push(p[2]);

      let w = p[2] - p[0];
      let dist = abs(goalPeriodLength - w);

      if (dist > 20) {
        console.log("bad");
        unsuccessTone.play();
      } else {
        console.log("good");
        successTone.play();
      }
    }

    // add sensor val to path object
    if (ang != undefined) {
      pointsToSave.push([x, y]);
      displayPeriods(periods);
      path.addPoint(x, y);
      path.display();
    }

    drawingGrid();
    // check if game should end
    if (x > width) {
      clear();
      frameCount = 0;
      noLoop();

      // save(pointsToSave, "freqData.txt");

      endScreen();
    }

    // increment point - angle based
    y = - (ang - 90) * SENSITIVITY + midVal;
    x = x + SPEED;
  }

}

// <------------- HELPER FUNCTIONS FOR DRAWING -------------> //

function mousePressed() {
  if (gameScreen == 0) {
    startGame();
  }
}

function startGame() {
  gameScreen = 1;
  frameCount = 0;
}

function drawingGrid() {
  // set pen
  stroke(gridColor);
  setLineDash([5, 5]);
  strokeWeight(1);

  // draw vertical grid lines
  for (let i = gridIncrement; i < width; i += gridIncrement) {
    line(i, 0, i, height);
  }

  // draw horiz. grid lines
  for (let i = gridIncrement; i < height; i += gridIncrement) {
    line(0, i, width, i);
  }

  setLineDash([0, 0]);
  // draw mid line
  stroke(gridColor);
  strokeWeight(8);
  line(0, midVal, width, midVal);

  noStroke();
}

function drawingPlayArea() {
  // draw rect
  noStroke();
  fill(darkBackgroundColor);
  rectMode(CORNER);
  rect(startPos, 0, width - startPos, height);
}

function setLineDash(list) {
  drawingContext.setLineDash(list);
}

function drawingCount(num) {
  clear();
  background(backgroundColor);

  // draw rect
  noStroke();
  fill('rgba(255,255,255, 0.2)');
  rectMode(CORNER);
  rect(startPos, 0, width - startPos, height);

  // draw number
  fill(gridColor);
  textAlign(CENTER);
  textSize(100);
  text(num, startPos / 2, height / 2 - 150);
}

function displayPeriods(periods) {
  for (let i = 0; i < periods.length; i++) {
    p = periods[i]
    w = p[2] - p[0];
    dist = abs(goalPeriodLength - w);

    if (dist > 100) {
      fill(badColor);
    } else if (dist <= 100 && dist > 50) {
      fill(okayColor);
    } else {
      fill(greatColor);
    }
    rectMode(CENTER);
    rect((p[0] + p[2]) / 2, height / 2, w, height);
  }
}

function endScreen() {
  // graphics
  background(backgroundColor);
  drawingPlayArea();
  displayPeriods(periods);
  drawingGrid();
  path.display();

  // draw modal
  noStroke();
  fill(backgroundColor);
  rectMode(CORNER);
  rect(0, 0, startPos, height);

  // score calc
  periodCount = 0;
  for (let i = 0; i < periods.length; i++) {
    p = periods[i]
    if (p[0] > startPos) {
      periodCount += 1;
    } 
  }

  // score display
  fill(gridColor);
  textAlign(CENTER);
  textSize(30);
  text("You got", startPos / 2, height / 2 - 100);
  textSize(100);
  text(periodCount, startPos / 2, height / 2);
  textSize(30);
  text("greens!", startPos / 2, height / 2 + 100);

}