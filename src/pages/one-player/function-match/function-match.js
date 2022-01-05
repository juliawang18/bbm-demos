// <------- CONSTANTS TO CHANGE -------> //
let SPEED = 3;
let SENSITIVITY = 8;
let BRUSH_SIZE = 20;
let TOLERANCE = 40;

// <------- DO NOT TOUCH BELOW -------> //

// serial communication
let serial;
let latestData = "waiting for data";  

// declare styles
let backgroundColor; 
let textColor;
let modalColor;
let font; 

// global vars
let funcPoints = {};
let gameScreen;
let path;
let ang;            // angle of board
let x;              // xpos of drawing dot
let y;              // ypos of drawing dot
let midVal;
let startPos;

let pointsToSave = [];
let sound;

// function being matched
function func(x) {
  return sin(x);
}

function preload() {
  // loaders
  loadColors();
  loadFonts();
  loadSounds();
}

function setup() {
  // visual setup
  createCanvas(window.innerWidth, window.innerHeight);
  background(backgroundColor);
  textFont(font);

  // instantiate our SerialPort object
  portName = new Env().port;
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
  sound.play();
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
  backgroundColor = color(31, 77, 93);
  textColor = color(209, 80, 38);
  modalColor = color(43, 13, 98);
}

// load fonts 
function loadFonts() {
  font = loadFont("../../../assets/fonts/GothamRounded-Bold.otf");
}

// load sound file
function loadSounds() {
  soundFormats('wav', 'ogg');
  sound = loadSound('Function_Matching_v2_Loop');
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
  drawingFunction();

  // instruction box
  rectMode(CENTER);
  fill(modalColor);
  rect(width / 2, height / 4, width * 0.6, height * 0.2, 10, 10, 10, 10);
  
  // text
  noStroke();
  textAlign(CENTER);
  textSize(30);
  fill(textColor);
  text("Figure out how to draw green the whole time!", width / 2, height / 4 - 20);
  textSize(20);
  text("(click anywhere to start)", width / 2, height / 4 + 30);
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
      drawingFunction();
    }

    // add sensor val to path object
    if (ang != undefined) {
      pointsToSave.push([x,y]);
      path.addPoint(x, y);
      path.display();
      if (path.volume) {
        print(path.volume);
        outputVolume(path.volume);
      }
    }

    // check if game should end
    if (x > width) {
      clear();
      frameCount = 0;
      noLoop();
      sound.stop();

      // save(pointsToSave, "funcData.txt");

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
  stroke(255, 0.2);
  strokeWeight(10);

  // draw function
  for (let i = 0; i < width; i += 20) {
    if (i > startPos) {
      stroke(255, 0.9);
    }
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
  fill('rgba(255,255,255, 0.3)');
  rectMode(CORNER);
  rect(startPos, 0, width - startPos, height);

  // draw number
  fill(modalColor);
  textAlign(CENTER);
  textSize(100);
  text(num, startPos / 2, height / 2 - 150);
}

function winScreen(score) {
  background("#07A87C");
  drawingFunction();
  path.display();

  noStroke();
  fill('white');
  textSize(20);
  textAlign(CENTER);
  text("AMAZING!", width / 2, height / 5);
  text("You matched " + round(score) + "% of the points on the function!", width / 2, height / 5 - 70);
}

function loseScreen(score) {
  background("#DA7045");
  drawingFunction();
  path.display();

  noStroke();
  fill('white');
  textSize(20);
  textAlign(CENTER);
  text("TRY AGAIN", width / 2, height / 5);
  text("You matched " + round(score) + "% of the points on the function.", width / 2, height / 5 - 70);
}