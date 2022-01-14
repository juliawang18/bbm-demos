// <------- CONSTANTS TO CHANGE -------> //
let SPEED = 3;
let SENSITIVITY = 10;
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
let lineColors;
let modalColor;
let font;

// global vars 
let gameScreen;
let timer;
let correctPoints = {};
let tally = [];

let startPos;
let midVal;

let ang;
let x;
let y

let sound;

// function being matched
function func(x) {
  return sin(x);
}

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

  startPos = 400;
  midVal = height / 2;

  x = 0;
  y = height / 2;

  loadCorrectPoints();
  sound.play();
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
  backgroundColor = color(31, 77, 93);
  darkBackgroundColor = color(18, 81, 91);
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
}

function loadFonts() {
  font = loadFont("../../../assets/fonts/GothamRounded-Bold.otf");
}

function loadSounds() {
  soundFormats('wav', 'ogg');
  sound = loadSound('Function_Matching_v2_Loop');
}

function loadCorrectPoints() {
  for (let i = 0; i < width; i += SPEED) {
    let xPoint = i;
    let yPoint = func((i - startPos) / 100) * 100 + (height / 2);
    correctPoints[xPoint] = yPoint;
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
  drawFunction();

  // instruction box
  rectMode(CENTER);
  fill(modalColor);
  rect(width / 2, height / 4, width * 0.5, height * 0.2, 10, 10, 10, 10);

  // text
  noStroke();
  textAlign(CENTER);
  textSize(30);
  fill(backgroundColor);
  text("Figure out how to draw blue the whole time!", width / 2, height / 4 - 20);
  textSize(20);
  text("(click anywhere to start)", width / 2, height / 4 + 30);
}

function playGame() {
  // draw initial background
  if (frameCount == 1) {
    clear();
    background(backgroundColor);
    drawFunction();
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

  // adjust sound, color, tally score
  let dist = abs(correctPoints[x] - y);

  if (dist < 100) { 
    let index = 10 - round(dist/10);
    if (x >= startPos) {
      if (index > 5) {
        tally.push(1);
      } else {
        tally.push(0);
      }
    }
    fill(lineColors[index]);
    outputVolume(1 - dist/100);
  } else {
    fill(lineColors[0]);
    outputVolume(0);
    tally.push(0);
  }

  ellipse(x, y, BRUSH_SIZE);

  // end 
  if (x > width) {
    sound.stop();
    noLoop();
    endScreen();
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

function setLineDash(list) {
  drawingContext.setLineDash(list);
}

function coverNumber() {
  fill(backgroundColor);
  rectMode(CENTER);
  rect(startPos / 2, height / 2 - 180, 200, 150);
}

function drawingCountdown(input) {
  // draw number
  fill(modalColor);
  textAlign(CENTER);
  textSize(100);
  text(input, startPos / 2, height / 2 - 150);
}

function drawFunction() {
  // draw line
  setLineDash([2, 10]);
  stroke(255, 0.5);
  strokeWeight(3);
  line(startPos, 0, startPos, height);

  // set pen
  stroke(255, 0.3);
  strokeWeight(10);

  // draw function
  for (let i = 0; i < width; i += 20) {
    if (i > startPos) {
      stroke(255, 1);
    }
    let xPoint = i;
    let yPoint = func((i - startPos) / 100) * 100 + (height / 2);
    point(xPoint, yPoint);
  }

  noStroke();
}

function endScreen() {
  // modal
  noStroke();
  fill(darkBackgroundColor);
  rectMode(CORNER);
  rect(0, 0, startPos, height);

  // score calc
  let score;
  if (tally.length == 0) {
    score = 0;
  } else {
    const reducer = (previousValue, currentValue) => previousValue + currentValue;
    score = round((tally.reduce(reducer) / tally.length) * 100);
  }
  
  // display text
  fill(modalColor);
  textAlign(CENTER);
  textSize(20);
  text("You got", startPos / 2, height / 3 - 50);
  textSize(100);
  text(score + "%", startPos / 2, height / 3 + 70);
  textSize(20);
  text("points of the function.", startPos / 2, height / 3 + 140);
}