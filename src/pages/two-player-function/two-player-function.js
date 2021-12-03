// <------- CONSTANTS TO CHANGE -------> //
let portName1 = "/dev/tty.usbmodem142101";
let portName2 = "/dev/tty.usbmodem142201";
let SPEED = 10;
let SENSITIVITY = 10;
let BRUSH_SIZE = 20;
let TOLERANCE = 40;

// <------- DO NOT TOUCH BELOW -------> //

// serial communication
let serialOne, serialTwo;
let latestDataOne = "waiting for data";
let latestDataTwo = "waiting for data"; 

// declare styles
let backgroundColor; 
let font; 

// global vars
let gameScreen;
let midVal;
let startPos;
let maxFuncVal;
let minFuncal;

// player one
let funcPoints1 = {};
let path1;
let ang1;            // angle of board
let x1;              // xpos of drawing dot
let y1;              // ypos of drawing dot
let midVal1;

// player two
let funcPoints2 = {};
let path2;
let ang2;            // angle of board
let x2;              // xpos of drawing dot
let y2;              // ypos of drawing dot
let midVal2;

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

  // Instantiate our SerialPort object
  serialOne = new p5.SerialPort();
  serialTwo = new p5.SerialPort();

  // Get a list the ports available
  // You should have a callback defined to see the results
  serialOne.list();
  let options = { baudRate: 115200 };

  // Assuming our Arduino is connected, let's open the connection to it
  // Change this to the name of your arduino's serial port
  serialOne.open(portName1, options);
  serialTwo.open(portName2, options);

  // Here are the callbacks that you can register
  // When we connect to the underlying server
  serialOne.on('connected', serverConnected);
  serialTwo.on('connected', serverConnected);

  // When we get a list of serial ports that are available
  serialOne.on('list', gotList);

  // When we some data from the serial port
  serialOne.on('data', gotDataOne);
  serialTwo.on('data', gotDataTwo);

  // When or if we get an error
  serialOne.on('error', gotError);
  serialTwo.on('error', gotError);

  // When our serial port is opened and ready for read/write
  serialOne.on('open', gotOpen);
  serialTwo.on('open', gotOpen);

  serialOne.on('close', gotClose);
  serialTwo.on('close', gotClose);

  // initialize data
  midVal = height / 2;
  startPos = 400;
  gameScreen = 0;

  // player one
  path1 = new Path(funcPoints1, TOLERANCE, BRUSH_SIZE, startPos);
  y1 = midVal - (midVal/2);
  midVal1 = midVal - (midVal/2);
  x1 = 0;

  // player two
  path2 = new Path(funcPoints2, TOLERANCE, BRUSH_SIZE, startPos);
  y2 = midVal + (midVal/2);
  midVal2 = midVal + (midVal/2);
  x2 = 0;

  loadPoints();
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
    point(i, midVal1);
    funcPoints1[i] = midVal1;
  }

  for (let i = 0; i < startPos; i += SPEED) {
    point(i, midVal2);
    funcPoints2[i] = midVal2;
  }

  for (let i = startPos; i < width; i += SPEED) {
    let xPoint = i;
    let yPoint = func((i - startPos) / 100) * 100 + midVal1;
    funcPoints1[xPoint] = yPoint;
  }

  for (let i = startPos; i < width; i += SPEED) {
    let xPoint = i;
    let yPoint = func((i - startPos) / 100) * 100 + midVal2;
    funcPoints2[xPoint] = yPoint;
  }

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

function gotDataOne() {
  let incomingAngle = serialOne.readStringUntil('\n'); 
  if (!incomingAngle) return;           
  incomingAngle = float(incomingAngle);

  // altering incoming angle val to fit interaction
  if (incomingAngle > 0) {
    ang1 = incomingAngle - 90;
  } else {
    ang1 = 270 + incomingAngle;
  }
  // ang1 = incomingAngle + 90;
}

// There is data available to work with from the serial port
function gotDataTwo() {
  let incomingAngle = serialTwo.readStringUntil('\n'); 
  if (!incomingAngle) return;           
  incomingAngle = float(incomingAngle);

  // altering incoming angle val to fit interaction
  // if (incomingAngle > 0) {
  //   ang2 = incomingAngle - 90;
  // } else {
  //   ang2 = 270 + incomingAngle;
  // }
  ang2 = incomingAngle + 90;
}

// <------------- DRAWING FUNCTIONS -------------> //
function initGame() {
  background(backgroundColor);
  drawingFunction(midVal1);
  drawingFunction(midVal2);

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
        drawingFunction(midVal1);
        drawingFunction(midVal2);
      }
  
      // add sensor val to path object
      if (ang1 != undefined) {
        path1.addPoint(x1, y1);
        path1.display();
        path2.addPoint(x2, y2);
        path2.display();
      }
  
      // check if game should end
      if (x1 > width) {
        // clear();
        frameCount = 0;
        noLoop();
  
        let offsets1 = path1.offsetList();
        let offsets2 = path2.offsetList();
  
        let sum1 = 0;
        let sum2 = 0;
        for (let i = 0; i < offsets1.length; i += 1) {
          if (offsets1[i] > 0) {
            sum1 += offsets1[i];
          }
        }
  
        for (let i = 0; i < offsets2.length; i += 1) {
          if (offsets2[i] > 0) {
            sum2 += offsets2[i];
          }
        }
  
        if ((sum1 / offsets1.length) * 100 > 60) {
          winScreen((sum1 / offsets1.length) * 100);
        } else {
          loseScreen((sum1 / offsets1.length) * 100);
        }
  
        if ((sum2 / offsets2.length) * 100 > 60) {
          winScreen((sum2 / offsets2.length) * 100);
        } else {
          loseScreen((sum2 / offsets2.length) * 100);
        }
      }
  
      // increment point - angle based
      y1 = - (ang1 - 90) * SENSITIVITY + midVal1; 
      y2 = - (ang2 - 90) * SENSITIVITY + midVal2; 
  
      if (x1 < startPos) {
        x1 = x1 + 2.5;
        x2 = x2 + 2.5;
      } else {
        x1 = x1 + SPEED;
        x2 = x2 + SPEED;
      }
  
      print(x1, y1, ang1);
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

function drawingFunction(yVal) {
  // set pen
  stroke(0, 0.5);
  strokeWeight(10);

  // divider line
  line(0, midVal, width, midVal);

  // set pen
  stroke(255, 0.5);
  strokeWeight(10);

  // draw line
  for (let i = 0; i < startPos; i += 20) {
    point(i, yVal);
  }

  // draw function
  for (let i = startPos; i < width; i += 20) {
    let xPoint = i;
    let yPoint = func((i - startPos) / 100) * 100 + (yVal);
    point(xPoint, yPoint);
  }

  noStroke();
}

function drawingCount(num) {
  clear();
  background(backgroundColor);
  drawingFunction(midVal1);
  drawingFunction(midVal2);
  
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
  // background("#07A87C");
  // drawingFunction(midVal1);
  // drawingFunction(midVal2);
  // path.display();

  // noStroke();
  // fill('white');
  // textSize(20);
  // textAlign(CENTER);
  // text("WOOO", width / 2, height / 2 - 150);
  // text("You matched " + round(score) + "% of the points on the function!", width / 2, height / 2 - 100);
}

function loseScreen(score) {
  // background("#DA7045");
  // drawingFunction(midVal1);
  // drawingFunction(midVal2);
  // path.display();

  // noStroke();
  // fill('white');
  // textSize(20);
  // textAlign(CENTER);
  // text("TRY AGAIN", width / 2, height / 2 - 150);
  // text("You matched " + round(score) + "% of the points on the function.", width / 2, height / 2 - 100);
}