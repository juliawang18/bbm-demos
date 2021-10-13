// <------- CONSTANTS TO CHANGE -------> //
let portName = "/dev/tty.usbmodem142101";
let SPEED = 5;
let SENSITIVITY = 15;
let BRUSH_SIZE = 20;
let TOLERANCE = 40;

// <------- DO NOT TOUCH BELOW -------> //

// serial communication
let serial;
let latestData = "waiting for data";  

// declare styles
let backgroundColor; 
let font; 

// declare sound
let playerOsc;
let functionOsc;

// notes
let highC = 523.251;
let middleC = 261.63;
let lowerC = 130.813;

// global vars
let funcPoints = {};
let gameScreen;
let path;
let ang;            // angle of board
let x;              // xpos of drawing dot
let y;              // ypos of drawing dot
let midVal;
let startPos;
let maxFuncVal;
let minFuncal;

// function being matched
function func(x) {
  return sin(x);
}

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

  // instantiate our SerialPort object
  serial = new p5.SerialPort();
  serial.list();
  let options = { baudRate: 115200 };
  serial.open(portName, options);
  serial.on('connected', serverConnected);
  serial.on('list', gotList);
  serial.on('data', gotData);
  serial.on('error', gotError);
  serial.on('open', gotOpen);
  serial.on('close', gotClose);

  // initialize data
  midVal = height / 2;
  startPos = 400;
  path = new Path(funcPoints, TOLERANCE, BRUSH_SIZE, startPos);
  gameScreen = 0;
  y = height / 2;
  x = 0;

  loadPoints();

  // start sound
  playerOsc = new p5.SinOsc();
  playerOsc.start();
  playerOsc.freq(middleC);

  functionOsc = new p5.SinOsc();
  playerOsc.start();
  playerOsc.freq(lowerC);
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
  backgroundColor = color(219, 75, 75);
}

// load fonts 
function loadFonts() {
  font = loadFont("../../assets/fonts/Whyte-Medium.otf");
}

// capture correct points 
function loadPoints() {
  for (let i = 0; i < startPos; i += SPEED) {
    point(i, midVal);
    funcPoints[i] = midVal;
  }

  for (let i = startPos; i < width; i += SPEED) {
    let xPoint = i;
    let yPoint = func((i - startPos) / 100) * 100 + (height / 2);
    funcPoints[xPoint] = yPoint;
  }

  maxFuncVal = max(funcPoints);
  minFuncal= min(funcPoints);
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
  drawingFunction();

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
  text("Instructions:", width / 2, height / 2 - 50);
  text("Figure out how to draw green the whole time!", width / 2, height / 2);
  textSize(20);
  text("(click anywhere to start)", width / 2, height / 2 + 75);
}

function playGame() {

    if (frameCount <= 50) {
      drawingCount("3");
    } else if (frameCount > 50 && frameCount <= 100) {
      drawingCount("2");
    } else if (frameCount > 100 && frameCount <= 150) {
      drawingCount("1");
    } else {
      clear();
      background(backgroundColor);
      drawingFunction();
    }

    // sound adjustment - function is base tone, haromny only when overlapping
    let offset = abs(funcPoints[x] - y);
    let offSetFreq = map(offset, 0, 500, 0, highC - middleC);
    playerOsc.freq(middleC + offSetFreq);
    functionOsc.freq(lowerC);

    // add sensor val to path object
    if (ang != undefined) {
      path.addPoint(x, y);
      path.display();
    }

    // check if game should end
    if (x > width) {
      clear();
      frameCount = 0;
      noLoop();
      playerOsc.stop();
      functionOsc.stop();

      let offsets = path.offsetList();

      let sum = 0;
      for (let i = 0; i < offsets.length; i += 1) {
        if (offsets[i] > 0) {
          sum += offsets[i];
        }
      }

      if ((sum / offsets.length) * 100 > 60) {
        winScreen((sum / offsets.length) * 100);
      } else {
        loseScreen((sum / offsets.length) * 100);
      }
    }

    // increment point - angle based
    y = - (ang - 90) * SENSITIVITY + midVal; 

    if (x < startPos) {
      x = x + 2.5;
    } else {
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

function drawingFunction() {
  // set pen
  stroke(255, 0.5);
  strokeWeight(10);

  // draw line
  for (let i = 0; i < startPos; i += 20) {
    point(i, midVal);
  }

  // draw function
  for (let i = startPos; i < width; i += 20) {
    let xPoint = i;
    let yPoint = func((i - startPos) / 100) * 100 + (height / 2);
    point(xPoint, yPoint);
  }

  noStroke();
}

function drawingCount(num) {
  clear();
  background(backgroundColor);
  drawingFunction();
  
  // draw rect
  fill('rgba(0,0,0, 0.4)');
  rectMode(CORNER);
  rect(startPos, 0, width - startPos, height);

  // draw number
  fill(0);
  textAlign(CENTER);
  textSize(100);
  text(num, startPos / 2, height / 2 - 100);
}

function winScreen(score) {
  background("#07A87C");
  drawingFunction();
  path.display();

  noStroke();
  fill('white');
  textSize(20);
  textAlign(CENTER);
  text("WOOO", width / 2, height / 2 - 150);
  text("You matched " + round(score) + "% of the points on the function!", width / 2, height / 2 - 100);
}

function loseScreen(score) {
  background("#DA7045");
  drawingFunction();
  path.display();

  noStroke();
  fill('white');
  textSize(20);
  textAlign(CENTER);
  text("TRY AGAIN", width / 2, height / 2 - 150);
  text("You matched " + round(score) + "% of the points on the function.", width / 2, height / 2 - 100);
}