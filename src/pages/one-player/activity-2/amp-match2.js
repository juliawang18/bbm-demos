// <------- CONSTANTS TO CHANGE -------> //
let SPEED = 5;
let SENSITIVITY = 18;
let BRUSH_SIZE = 20;
let GOAL_AMP = 2;
let GRID_SIZE = 12;

// <------- DO NOT TOUCH BELOW -------> //

// serial communication
let env;
let serial;
let latestData = "waiting for data";

//  styles
let backgroundColor;
let darkBackgroundColor;
let goalColor;
let gridColor;
let font;

// global vars 
let gameScreen;
let timer;

let ampCount = 0;

let gridIncrement;
let midVal;
let ampAbove;
let ampBelow;
let startPos;

let ang;
let x;
let y

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
  serial.open(env.port, options);
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
  ampAbove = midVal - GOAL_AMP * gridIncrement;
  ampBelow = midVal + GOAL_AMP * gridIncrement;

  x = 0;
  y = height / 2;
}

function draw() {
  // console.log(frameRate());
  if (gameScreen == 0) {
    initGame();
  } else if (gameScreen == 1) {
    initCountdown();
  } else if (gameScreen == 2) {
    playGame();
  }

}

// <------------- PRELOAD FUNCTIONS -------------> //
function loadColors() {
  colorMode(HSB, 360, 100, 100);
  backgroundColor = color(43, 13, 98);
  darkBackgroundColor = color(43, 23, 94); 
  goalColor = color(155, 100, 85);
  gridColor = color(209, 80, 38);
}

function loadFonts() {
  font = loadFont("../../../assets/fonts/GothamRounded-Bold.otf");
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
  fill(backgroundColor);
  text("Figure out where green is!", width / 2, height / 4 - 20);
  textSize(20);
  text("(click anywhere to start)", width / 2, height / 4 + 30);
}

function initCountdown() {
  drawingCountdown(timer);

  // decrement timer
  if (frameCount % 60 == 0 && timer > -1) { 
    timer --;
  }

  if (timer == 0) {
    drawingCountdown("Go!");
  }

  if (timer == -1) {
    gameScreen = 2;
    frameCount = 0;
  }

}

function playGame() {
  // draw initial background
  if (frameCount == 1) {
    clear();
    background(backgroundColor);
    drawGrid();
  }

  fill(gridColor);
  ellipse(x, y, BRUSH_SIZE);

  if (x > width) {
    noLoop();
  }

  x = x + 5;
  y = lerp(y, - (ang - 90) * SENSITIVITY + midVal, 0.05);

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

function drawingCountdown(input) {
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
  text(input, startPos / 2, height / 2 - 150);
}

function endScreen(ampCount) {
  background(backgroundColor);
  drawGrid();

  noStroke();
  fill('white');
  textSize(20);
  textAlign(CENTER);
  text("You found green " + ampCount + " times!", width / 2, 100);
}