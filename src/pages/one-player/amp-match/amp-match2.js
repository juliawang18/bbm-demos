// <------- CONSTANTS TO CHANGE -------> //
let SPEED = 6;
let SENSITIVITY = 18;
let BRUSH_SIZE = 20;
let GOAL_AMP = 2;
let GRID_SIZE = 12;

// <------- DO NOT TOUCH BELOW -------> //

// serial communication
let portName;
let serial;
let latestData = "waiting for data";

// declare styles
let backgroundColor;
let darkBackgroundColor;
let goalColor;
let gridColor;
let font;

// global vars
let gameScreen;
let startDraw = false;

let ampCount = 0;

let gridIncrement;
let midVal;
let ampAbove;
let ampBelow;
let startPos;

let path;

let ang;
let x;
let y

function preload() {
  // loaders
  loadColors();
  loadFonts();
}

function setup() {
  // visual setup
  createCanvas(window.innerWidth, window.innerHeight);
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
  ampAbove = midVal - GOAL_AMP * gridIncrement;
  ampBelow = midVal + GOAL_AMP * gridIncrement;
  path = new Path(BRUSH_SIZE, midVal, ampAbove, ampBelow);
  y = height / 2;
  x = 0;
}

function draw() {
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
  backgroundColor = color(43, 23, 94);
  goalColor = color(155, 100, 85);
  gridColor = color(209, 80, 38);
  darkBackgroundColor = color(43, 13, 98);
}

// load fonts 
function loadFonts() {
  font = loadFont("../../../assets/fonts/GothamRounded-Bold.otf");
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
  // if (incomingAngle > 0) {
  //   ang = incomingAngle - 90;
  // } else {
  //   ang = 270 + incomingAngle;
  // }
  ang = incomingAngle + 90;
}

// <------------- DRAWING FUNCTIONS -------------> //
function initGame() {
  background(backgroundColor);
  drawGrid();

  // instruction box
  rectMode(CENTER);
  fill(gridColor);
  rect(width / 2, height / 4, width * 0.5, height * 0.2, 10, 10, 10, 10);

  // text
  noStroke();
  textAlign(CENTER);
  textSize(30);
  fill(darkBackgroundColor);
  text("Figure out where green is!", width / 2, height / 4 - 20);
  textSize(20);
  text("(click anywhere to start)", width / 2, height / 4 + 30);
}

function playGame() {
  // draw initial background
  if (frameCount == 1) {
    clear();
    background(backgroundColor);
    drawGrid();
  }

  


  // if (frameCount % 60 == 0 && timer > 0) { // if the frameCount is divisible by 60, then a second has passed. it will stop at 0
  //   timer --;
  // }
  // if (frameCount > 50) {
  //   if (frameCount <= 160) {
  //     drawingCount("3");
  //   } else if (frameCount > 160 && frameCount <= 220) {
  //     drawingCount("2");
  //   } else if (frameCount > 220 && frameCount <= 280) {
  //     drawingCount("1");
  //   } else {
  //     clear();
  //     background(backgroundColor);
  //     drawGrid();
  //   }

  //   if (y > ampBelow) {
  //     if (!reachedAmp) {
  //       ampCount += 1;
  //       reachedAmp = true;
  //     }
  //   }

  //   if (y < ampBelow && y > ampAbove) {
  //     reachedAmp = false;
  //   }

  //   if (y < ampAbove) {
  //     if (!reachedAmp) {
  //       ampCount += 1;
  //       reachedAmp = true;
  //     }
  //   }
  //   // add sensor val to path object
  //   if (ang != undefined) {
  //     path.addPoint(x, y);
  //     path.display();
  //   }

  //   // check if game should end
  //   if (x > width) {
  //     clear();
  //     frameCount = 0;
  //     noLoop();

  //     endScreen(ampCount);
  //   }

  //   // increment point - angle based
  //   y = - (ang - 90) * SENSITIVITY + midVal;
  //   x = x + SPEED;
  // }
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

function drawGrid() {
  // draw rect
  fill(darkBackgroundColor);
  rectMode(CORNER);
  rect(startPos, 0, width - startPos, height); 

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

  setLineDash([20, 20]);
  stroke(goalColor);
  strokeWeight(8);
  line(0, ampAbove, width, ampAbove);
  line(0, ampBelow, width, ampBelow);

  setLineDash([0, 0]);
  // draw mid line
  stroke(gridColor);
  strokeWeight(8);
  line(0, midVal, width, midVal);

  noStroke();
}

function setLineDash(list) {
  drawingContext.setLineDash(list);
}

function drawingCount(num) {
  clear();
  background(backgroundColor);
  drawGrid();

  // draw rect
  fill('rgba(20, 60, 98, 0.2)');
  rectMode(CORNER);
  rect(startPos, 0, width - startPos, height);

  // draw number
  fill(gridColor);
  textAlign(CENTER);
  textSize(100);
  text(num, startPos / 2, height / 2 - 150);
}

function endScreen(ampCount) {
  background(backgroundColor);
  drawGrid();
  path.display();

  noStroke();
  fill('white');
  textSize(20);
  textAlign(CENTER);
  text("You found green " + ampCount + " times!", width / 2, 100);
}