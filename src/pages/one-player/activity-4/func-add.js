// <------- CONSTANTS TO CHANGE -------> //
let SPEED = 3;
let SENSITIVITY = 18;
let BRUSH_SIZE = 20;
let GRID_SIZE = 12;

// <------- DO NOT TOUCH BELOW -------> //

// serial communication
let env;
let serial;
let latestData = "waiting for data";

//  styles
let backgroundColor;
let darkBackgroundColor;
let gridColor;
let playerOneColor;
let playerTwoColor;
let sumColor;
let font;

// global vars 
let gameScreen;
let timer;

let basePoints = {};

let gridIncrement;
let startPos;
let midVal;

let ang;
let x;
let y;

// function being added to
function func(x) {
  return sin(x);
}

function preload() {
  loadColors();
  loadFonts();
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
  midVal = floor((height / gridIncrement) / 2) * gridIncrement;

  loadBasePoints();

  x = 0;
  y = midVal;
  ang = 90;
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
  gridColor = color(0, 0, 50);
  playerOneColor = color(37, 56, 100);
  playerTwoColor = color(177, 93, 56);
  sumColor = color(93, 77, 70);
}

function loadFonts() {
  font = loadFont("../../../assets/fonts/GothamRounded-Bold.otf");
}

function loadBasePoints() {
  for (let i = 0; i < width; i += SPEED) {
    let xPoint = i;
    let yPoint = func((i - startPos) / 100) * 100 + (height / 2);
    basePoints[xPoint] = yPoint;
  }
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
    curAng = incomingAngle - 90;
  } else {
    curAng = 270 + incomingAngle;
  }

  if (ang) {
    if (abs(curAng - ang) < 100) {
      ang = curAng;
    }
  }
  // ang = incomingAngle + 90;
}

// <------------- DRAWING FUNCTIONS -------------> //
function initGame() {
  background(backgroundColor);
  drawGrid();
  drawFunction();

  // instruction box
  rectMode(CENTER);
  fill(gridColor);
  rect(width / 2, height / 4, width * 0.5, height * 0.2, 10, 10, 10, 10);

  // text
  noStroke();
  textAlign(CENTER);
  textSize(30);
  fill(backgroundColor);
  text("What you draw together will create a line!", width / 2, height / 4 - 20);
  textSize(20);
  text("(click anywhere to start)", width / 2, height / 4 + 30);
}

function playGame() {
  // draw initial background
  if (frameCount == 1) {
    clear();
    background(backgroundColor);
    drawGrid();
    drawFunction();
  }

  // countdown
  drawingCountdown(timer);

  // decrement timer
  if (frameCount % 40 == 0 && timer > -1) { 
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

  // player point
  fill(playerOneColor);
  ellipse(x, y, BRUSH_SIZE);

  // sum point
  fill(sumColor);

  newY = map(y, 0, height, -midVal, midVal)
  ellipse(x, newY + basePoints[x]+ 10, BRUSH_SIZE); // TODO: 25 is magic number 

  // end 
  if (x > width) {
    noLoop();
  }

  x = x + SPEED;
  if (ang) {
    y = lerp(y, - (ang - 90) * SENSITIVITY + midVal, 0.05);
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

function coverNumber() {
  fill(darkBackgroundColor);
  rectMode(CENTER);
  rect(startPos / 2, height / 2 - 320, 130, 100);
}

function drawingCountdown(input) {
  // draw number
  fill(gridColor);
  textAlign(CENTER);
  textSize(70);
  text(input, startPos / 2, height / 2 - 300);
}

function drawGrid() {
  // draw rect
  fill(darkBackgroundColor);
  rectMode(CORNER);
  rect(0, 0, startPos, height); 

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

  // draw mid line
  setLineDash([0, 0]);
  stroke(gridColor);
  strokeWeight(8);
  line(0, midVal, width, midVal);

  noStroke();
}

function drawFunction() {
  // set pen
  stroke(playerTwoColor);
  strokeWeight(BRUSH_SIZE);

  // draw function
  for (let i = 0; i < width; i += 30) {
    // if (i > startPos) {
    //   stroke(255, 1);
    // }
    let xPoint = i;
    let yPoint = func((i - startPos) / 100) * 100 + (height / 2);
    point(xPoint, yPoint);
  }

  noStroke();
}

function setLineDash(list) {
  drawingContext.setLineDash(list);
}