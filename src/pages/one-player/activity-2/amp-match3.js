// <------- CONSTANTS TO CHANGE -------> //
let SPEED = 4;
let SENSITIVITY = 18;
let BRUSH_SIZE = 20;
let GOAL_AMP = 2;
let GRID_SIZE = 11;

// <------- DO NOT TOUCH BELOW -------> //

// serial communication
let env;
let serial;
let latestData = "waiting for data";

//  styles
let backgroundColor;
let darkBackgroundColor; 
let lineColors;
let modalColor;
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
let ys

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
  y = midVal;
}

function draw() {
  // console.log(frameRate());
  if (gameScreen == 0) {
    initGame();
  } else if (gameScreen == 1) {
    playGame();
  } 

}

// <------------- PRELOAD FUNCTIONS -------------> //
function loadColors() {
  colorMode(HSB, 360, 100, 100);
  backgroundColor = color(43, 13, 98);
  darkBackgroundColor = color(43, 23, 94);
  lineColors = [
    color(136, 51, 66),
    color(141, 51, 62),
    color(146, 52, 58),
    color(152, 53, 54),
    color(160, 54, 49),
    color(167, 55, 45),
    color(178, 56, 40),
    color(188, 61, 40),
    color(197, 68, 39),
    color(203, 74, 39),
    color(209, 80, 38)
  ];
  modalColor = color(43, 13, 98);
  gridColor = color(209, 80, 38);
}

function loadFonts() {
  font = loadFont("../../../assets/fonts/GothamRounded-Bold.otf");
}

function loadSounds() {
  // soundFormats('wav', 'ogg');
  // sound = loadSound('Function_Matching_v2_Loop');
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

function playGame() {
  // draw initial background
  if (frameCount == 1) {
    clear();
    background(backgroundColor);
    drawGrid();
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

  if (y > ampBelow) {
    if (!reachedAmp) {
      ampCount += 1;
      reachedAmp = true;
    }
  }

  if (y < ampBelow && y > ampAbove) {
    reachedAmp = false;
  }

  if (y < ampAbove) {
    if (!reachedAmp) {
      ampCount += 1;
      reachedAmp = true;
    }
  }

  // adjust color
  let dist;
  if (y > midVal) {
    dist = abs(ampBelow - y);
  } else {
    dist = abs(ampAbove - y);
  }

  if (dist < 100) { 
    let index = round(dist/10);
    fill(lineColors[index]);
  } else {
    fill(lineColors[10]);
  }

  ellipse(x, y, BRUSH_SIZE);

  // end 
  if (x > width) {
    noLoop();
    endScreen();
  }

  x = x + SPEED;
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
  text(input, startPos / 2, height / 2 - 100);
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

  // draw line
  strokeWeight(3);
  line(startPos, 0, startPos, height);

  // draw mid line
  setLineDash([0, 0]);
  stroke(gridColor);
  strokeWeight(8);
  line(0, midVal, width, midVal);

  noStroke();
}

function setLineDash(list) {
  drawingContext.setLineDash(list);
}

function endScreen() {
  // modal
  noStroke();
  fill(darkBackgroundColor);
  rectMode(CORNER);
  rect(0, 0, startPos, height);

  // score calc
  let score = 0;
  
  // display text
  fill(gridColor);
  textAlign(CENTER);
  textSize(20);
  text("You found green", startPos / 2, height / 3 - 50);
  textSize(100);
  text(ampCount, startPos / 2, height / 3 + 70);
  textSize(20);
  text("times!", startPos / 2, height / 3 + 140);
}