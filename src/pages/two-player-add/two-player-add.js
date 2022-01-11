// <------- CONSTANTS TO CHANGE -------> //
let portName1 = "/dev/tty.usbmodem144301";
let portName2 = "/dev/tty.usbmodem142201";
let SPEED = 3;
let SENSITIVITY1 = 10;
let SENSITIVITY2 = 10;
let BRUSH_SIZE = 20;
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

// final path
let path3;

// player one
let path1;
let ang1;
let x1;
let y1;

// player two
let path2;
let ang2;
let x2;
let y2;

function preload() {
  // loaders
  loadColors();
  loadFonts();
  // loadSounds();
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
  path1 = new Path(BRUSH_SIZE);
  y1 = midVal;
  x1 = 0;

  // player two
  path2 = new Path(BRUSH_SIZE);
  y2 = midVal;
  x2 = 0;

  // final path 
  path3 = new Path(BRUSH_SIZE);

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
  backgroundColor = color(41, 0, 80);
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


// there is data available to work with from the serial port
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
  text("[insert prompt here]", width / 2, height / 2);
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

      // add sensor val to path object
      if (ang1 != undefined || ang2 != undefined) {
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
    
        // endScreen(cycleCount);
      }
    
      // increment point - angle based
      y1 = - (ang1 - 90) * SENSITIVITY1 + midVal; 
      x1 = x1 + SPEED;

      y2 = - (ang2 - 90) * SENSITIVITY2 + midVal; 
      x2 = x2 + SPEED;
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
  stroke(255, 1);
  strokeWeight(8);
  line(0, midVal, width, midVal);

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

function endScreen() {
  background(backgroundColor);
  drawingGrid();
  path1.display();
  path2.display();

//   noStroke();
//   fill('white');
//   textSize(20);
//   textAlign(CENTER);
//   text("You found green " + periods.length + " times!", width / 2, 100);
}