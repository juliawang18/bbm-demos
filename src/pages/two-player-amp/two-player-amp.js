// <------- CONSTANTS TO CHANGE -------> //
let portName1 = "/dev/tty.usbmodem144301";
let portName2 = "/dev/tty.usbmodem144201";
let SPEED = 10;
let SENSITIVITY1 = 10;
let SENSITIVITY2 = 10;
let BRUSH_SIZE = 20;
let GOAL_AMP = 1.5;
let GRID_SIZE = 15;

// <------- DO NOT TOUCH BELOW -------> //

// serial communication
let serialOne, serialTwo;
let latestDataOne = "waiting for data";
let latestDataTwo = "waiting for data"; 

// declare styles
let backgroundColor;
let goalColor;
let font;

// global vars
let gameScreen;
let startDraw = false;
let gridIncrement;
let midVal;

// player one
let ampCount1 = 0;
let reachedAmp1;
let ampAbove1;
let ampBelow1;
let midVal1;
let path1;
let ang1;
let x1;
let y1;

// player two
let ampCount2 = 0;
let reachedAmp2;
let ampAbove2;
let ampBelow2;
let midVal2;
let path2;
let ang2;
let x2;
let y2;


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
  gameScreen = 0;
  gridIncrement = width / GRID_SIZE;
  midVal = floor((height / gridIncrement) / 2) * gridIncrement;

  // player one
  midVal1 = midVal - (midVal/2);
  ampAbove1 = midVal1 - GOAL_AMP * gridIncrement;
  ampBelow1 = midVal1 + GOAL_AMP * gridIncrement;
  path1 = new Path(BRUSH_SIZE, midVal1, ampAbove1, ampBelow1);
  y1 = midVal1;
  x1 = 0;

  // player two
  midVal2 = midVal + (midVal/2);
  ampAbove2 = midVal2 - GOAL_AMP * gridIncrement;
  ampBelow2 = midVal2 + GOAL_AMP * gridIncrement;
  path2 = new Path(BRUSH_SIZE, midVal2, ampAbove2, ampBelow2);
  y2 = midVal2;
  x2 = 0;
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
  backgroundColor = color(41, 78, 100);
  goalColor = color(155, 100, 85);
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
      drawingGrid();
      startDraw = true;
    }

    if (startDraw) {
      if (y1 > ampBelow1) {
        if (!reachedAmp1) {
          ampCount1 += 1;
          reachedAmp1 = true;
        }
      }
    
      if (y1 < ampBelow1 && y1 > ampAbove1) {
        reachedAmp1 = false;
      }
    
      if (y1 < ampAbove1) {
        if (!reachedAmp1) {
          ampCount1 += 1;
          reachedAmp1 = true;
        }
      }

      // player two
      if (y2 > ampBelow2) {
        if (!reachedAmp2) {
          ampCount2 += 1;
          reachedAmp2 = true;
        }
      }
    
      if (y2 < ampBelow2 && y2 > ampAbove2) {
        reachedAmp2 = false;
      }
    
      if (y2 < ampAbove2) {
        if (!reachedAmp2) {
          ampCount2 += 1;
          reachedAmp2 = true;
        }
      }
    
      // add sensor val to path object
      if (ang1 != undefined) {
        path1.addPoint(x1, y1);
        path2.addPoint(x2, y2);
        path1.display();
        path2.display();
      }
    
      // check if game should end
      if (x1 > width) {
        clear();
        frameCount = 0;
        noLoop();
    
        endScreen(ampCount1, ampCount2);
      }
    
      // increment point - angle based
      y1 = - (ang1 - 90) * SENSITIVITY1 + midVal1; 
      x1 = x1 + SPEED;

      y2 = - (ang2 - 90) * SENSITIVITY2 + midVal2; 
      x2 = x2 + SPEED;

      // y1 = map(y1, 0, height, 0, midVal);
      // y2 = map(y2, 0, height, midVal, height);
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
  stroke(255, 0.5);
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
  stroke(0, 1);
  strokeWeight(10);
  line(0, midVal, width, midVal);

  // draw mid of players
  stroke(255, 1);
  strokeWeight(5);
  line(0, midVal1, width, midVal1);
  line(0, midVal2, width, midVal2);

  // draw goal amp lines
  stroke(goalColor);
  strokeWeight(5);
  line(0, ampAbove1, width, ampAbove1);
  line(0, ampBelow1, width, ampBelow1);

  line(0, ampAbove2, width, ampAbove2);
  line(0, ampBelow2, width, ampBelow2);

  noStroke();
}

function drawingCount(num) {
  clear();
  background(backgroundColor);
  drawingGrid();

  // draw number
  fill(0);
  textAlign(CENTER);
  textSize(100);
  text(num, width / 2, height / 2 - 100);
}

function endScreen(ampCount1, ampCount2) {
  background(backgroundColor);
  drawingGrid();
  path1.display();
  path2.display();

  noStroke();
  fill('black');
  textSize(25);
  textAlign(CENTER);
  text("You found green " + ampCount1 + " times!", width / 2, midVal1);
  text("You found green " + ampCount2 + " times!", width / 2, midVal2);

}