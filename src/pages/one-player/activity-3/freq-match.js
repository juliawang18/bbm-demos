// <------- CONSTANTS TO CHANGE -------> //
let SPEED = 5;
let SENSITIVITY = 40;
let BRUSH_SIZE = 20;
let GRID_SIZE = 12;

let GOAL_FREQ = 6;

// <------- DO NOT TOUCH BELOW -------> //

// serial communication
let env;
let serial;
let latestData = "waiting for data";

// styles
let backgroundColor;
let darkBackgroundColor;
let gridColor;
let greatColor;
let okayColor;
let badColor;
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
let timer;

let gridIncrement;
let midVal;
let startPos;

let ang;
let x;
let y;
let path;

let currState;

let currPeriod = [0];
let periods = [];
let isPositive;

// freq related
let goalPeriodLength;

function preload() {
  loadColors();
  loadFonts();
  loadSounds();
}

function setup() {
  // visual setup
  createCanvas(window.innerWidth, window.innerHeight);
  textFont(font);

  // instantiate our serialport object
  env = new Env();
  serial = new p5.SerialPort();
  serial.list();
  let options = { baudRate: 115200 }; // change the data rate to whatever you wish
  serial.open(env.player1, options);
  serial.on('connected', serverConnected);
  serial.on('list', gotList);
  serial.on('data', gotData);
  serial.on('error', gotError);
  serial.on('open', gotOpen);
  serial.on('close', gotClose);

  // initialize data
  gameScreen = 0;
  timer = 3;

  gridIncrement = width / GRID_SIZE;
  startPos = gridIncrement * 3;
  midVal = round((height / gridIncrement) / 2) * gridIncrement;

  goalPeriodLength = width / GOAL_FREQ;

  x = 0;
  y = midVal;

  toneCount = 0;

  path = [];
}

function draw() {
  if (gameScreen == 0) {
    initGame();
  } else if (gameScreen == 1) {
    playGame();
  } 

}

// <------------- PRELOAD FUNCTIONS -------------> //
function loadColors() {
  colorMode(HSB, 360, 100, 100);
  backgroundColor = color(0, 0, 100);
  darkBackgroundColor = color(0, 0, 95);
  gridColor = color(209, 80, 38);
  greatColor = color(136, 51, 66);
  okayColor = color(38, 75, 95);
  badColor = color(18, 81, 91);
}

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
function serverConnected() {
  // we are connected and ready to go
  print("Connected to Server");
}

function gotList(thelist) {
  // got the list of ports
  print("List of Serial Ports:");
  for (let i = 0; i < thelist.length; i++) {
    print(i + " " + thelist[i]);
  }
}

function gotOpen() {
  // connected to our serial device
  print("Serial Port is Open");
}

function gotClose() {
  print("Serial Port is Closed");
  latestData = "Serial Port is Closed";
}

function gotError(theerror) {
  // if there is an error, log it
  print(theerror);
}

function gotData() {
  // there is data available to work with from the serial port
  let incomingAngle = serial.readStringUntil('\n');
  if (!incomingAngle) return;
  incomingAngle = float(incomingAngle);

  // altering incoming angle val to fit interaction
  if (incomingAngle > 0) {
    ang = incomingAngle - 90;
  } else if (incomingAngle == 0) {
    ang = 0;
  } else {
    ang = 270 + incomingAngle;
  }
}

// <------------- DRAWING FUNCTIONS -------------> //
function initGame() {
  background(backgroundColor);
  drawGrid(true);

  // instruction box
  rectMode(CENTER);
  fill(gridColor);
  rect(width / 2, height / 4, width * 0.5, height * 0.2, 10, 10, 10, 10);

  // text
  noStroke();
  textAlign(CENTER);
  textSize(width  * 0.018);
  fill(backgroundColor);
  text("Try to make the whole screen green!", width / 2, height / 4 - 20);
  textSize(width  * 0.01);
  text("(click anywhere to start)", width / 2, height / 4 + 30);
}

function playGame() {
  // draw initial background
  if (frameCount == 1) {
    clear();
    background(backgroundColor);
    drawGrid(true);
  }

  // countdown
  drawingCountdown(timer);

  // decrement timer
  if (frameCount % 30 == 0 && timer > -1) { 
    timer--;
    coverNumber();
  }

  if (timer == 0) {
    coverNumber();
    drawingCountdown("Go!");
  }

  if (timer == -1) {
    coverNumber();
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
  lastPt = getLastPt(path);
  if (lastPt) {
    if (lastPt[1] > y) {
      if (currState == "increasing" && toneCount == 0) {
        lowTone.play();
        toneCount = 1;
      }
      currState = "decreasing";
    }

    // upper bound
    if (lastPt[1] < y) {
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

    if (dist > 40) {
      unsuccessTone.play();
    } else {
      successTone.play();
    }
  }

  fill(gridColor);
  ellipse(x, y, BRUSH_SIZE);

  displayPeriods(periods);

  // end 
  if (x > width) {
    noLoop();
    endScreen();
    save(path, "freqData.txt");
  }

  x = x + SPEED;
  if (ang) {
    y = lerp(y, - (ang - 90) * SENSITIVITY + midVal, 0.05);
  }

  path.push([x, y]);
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

function coverNumber() {
  fill(darkBackgroundColor);
  rectMode(CENTER);
  rect(startPos / 2, height / 2 - 120, 130, 100);
}

function drawingCountdown(input) {
  // draw number
  fill(gridColor);
  textAlign(CENTER);
  textSize(70);
  text(input, startPos / 2, height / 2);
}

function displayPeriods(periods) {
  for (let i = 0; i < periods.length; i++) {
    p = periods[i]
    w = p[2] - p[0];
    dist = abs(goalPeriodLength - w);

    if (dist > 100) {
      fill(badColor);
    } else if (dist <= 100 && dist > 30) {
      fill(okayColor);
    } else {
      fill(greatColor);
    }
    rectMode(CENTER);
    rect((p[0] + p[2]) / 2, height / 2, w, height);

    // line
    stroke(255, 0.5);
    strokeWeight(10);
    line(p[2], 0, p[2], height)
    noStroke();
  }
}

function displayPath() {
  fill(gridColor);
  for (let i = 0; i < path.length; i += 1) {
    ellipse(path[i][0], path[i][1], BRUSH_SIZE);
  }
}

function getLastPt(path) {
  return path[path.length - 2];
}

function drawGrid(drawInitial) {
  // draw rect
  if (drawInitial) {
    fill(darkBackgroundColor);
    rectMode(CORNER);
    rect(0, 0, startPos, height); 
  }

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

  // draw line
  strokeWeight(3);
  line(startPos, 0, startPos, height);

  // draw mid line
  setLineDash([0, 0]);
  stroke(gridColor);
  strokeWeight(3);
  line(0, midVal, width, midVal);

  noStroke();
}

function setLineDash(list) {
  drawingContext.setLineDash(list);
}

function displayPeriods(periods) {
  clear();
  background(backgroundColor)

  for (let i = 0; i < periods.length; i++) {
    p = periods[i]
    w = p[2] - p[0];
    dist = abs(goalPeriodLength - w);

    if (dist > 100) {
      fill(badColor);
    } else if (dist <= 110 && dist > 40) {
      fill(okayColor);
    } else {
      fill(greatColor);
    }
    rectMode(CENTER);
    rect((p[0] + p[2]) / 2, height / 2, w, height);

    // line
    stroke(gridColor);
    strokeWeight(3);
    line(p[2], 0, p[2], height)
    noStroke();
  }

  drawGrid(false);
  displayPath();
}

function endScreen() {
  // modal
  noStroke();
  fill(darkBackgroundColor);
  rectMode(CORNER);
  rect(0, 0, startPos, height);

  // score calc
  let score = 0;
  for (let i = 0; i < periods.length; i++) {
    p = periods[i]
    w = p[2] - p[0];
    dist = abs(goalPeriodLength - w);
    if (p[0] > startPos && dist <= 40) {
      score += 1;
    } 
  }
  
  // display text
  fill(gridColor);
  textAlign(CENTER);
  textSize(20);
  text("You found green", startPos / 2, height / 3 - 50);
  textSize(100);
  text(score, startPos / 2, height / 3 + 70);
  textSize(20);
  text("times!", startPos / 2, height / 3 + 140);
}