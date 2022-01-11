// <------- CONSTANTS TO CHANGE -------> //
let portName = "/dev/tty.usbmodem144301";
let SPEED = 5;
let SENSITIVITY = 15;
let BRUSH_SIZE = 20;
let GOAL_FREQ = 2;
let GRID_SIZE = 12;

// <------- DO NOT TOUCH BELOW -------> //

// serial communication
let serial;
let latestData = "waiting for data";  

// declare styles
let backgroundColor;
let goalColor;
let font;

// declare sounds
let playerOsc;

// notes
let highC = 523.251;
let middleC = 261.63;
let lowerC = 130.813;

// global vars
let gameScreen;
let startDraw = false;

let freqCount = 0;

let gridIncrement;
let midVal;

let path;

let ang;
let x;
let y;

let pointsToSave = [];

function preload() {
  // loaders
  loadColors();
  loadFonts();
}

function setup() {
  // visual setup
  createCanvas(window.innerWidth, window.innerHeight);
  background(backgroundColor);
  textFont(font);

  // Instantiate our SerialPort object
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
  midVal = floor((height / gridIncrement) / 2) * gridIncrement;
  path = new Path(BRUSH_SIZE);
  y = height / 2;
  x = 0;

  // start sound
  playerOsc = new p5.SinOsc();
//   playerOsc.start();
//   playerOsc.freq(middleC);
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
  backgroundColor = color(0, 0, 20);
}

// load fonts 
function loadFonts() {
  font = loadFont("../../assets/fonts/Whyte-Medium.otf");
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
  drawingGrid();

  // instruction box
  rectMode(CENTER);
  fill(255);
  stroke(0);
  strokeWeight(5);
  rect(width / 2, height / 2, width * 0.6, height * 0.4, 10, 10, 10, 10);
  
  // text
  noStroke();
  textAlign(CENTER);
  textSize(30);
  fill(0);
  text("Get used to rocking!", width / 2, height / 2 - 25);
  textSize(20);
  text("(click anywhere to start)", width / 2, height / 2 + 75);
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
    drawingGrid();
    startDraw = true;
  }

  if (startDraw) {
    // sound adjustment - target amps are +/- one octave from middle C (x-axis)
    // let freq = map(y, ampAbove, ampBelow, highC, lowerC);
    // playerOsc.freq(freq);
  
    // add sensor val to path object
    if (ang != undefined) {
      pointsToSave.push([x,y]);
      path.addPoint(x, y);
      path.display();
    }
  
    // check if game should end
    if (x > width) {
      frameCount = 0;
      noLoop();

      save(pointsToSave, "calibration.txt");
    //   playerOsc.stop();
    }
  
    // increment point - angle based
    y = - (ang - 90) * SENSITIVITY + midVal; 
    x = x + SPEED;
  }
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
  stroke(255, 0.4);
  strokeWeight(3);

  // draw vertical grid lines
  for (let i = gridIncrement; i < width; i += gridIncrement) {
    line(i, 0, i, height);
  }

  // draw horiz. grid lines
  for (let i = gridIncrement; i < height; i += gridIncrement) {
    line(0, i, width, i);
  }

  // draw mid line
  stroke(255, 1);
  strokeWeight(5);
  line(0, midVal, width, midVal);

  noStroke();
}

function drawingCount(num) {
  clear();
  background(backgroundColor);
  drawingGrid();

  // draw number
  fill(255);
  textAlign(CENTER);
  textSize(100);
  text(num, width / 2, height / 2 - 100);
}