// <------- CONSTANTS TO CHANGE -------> //
let SPEED = 2;
let SENSITIVITY = 14;
let BRUSH_SIZE = 20;
let GRID_SIZE = 8;

// <------- DO NOT TOUCH BELOW -------> //

// serial communication
let env;
let serial1, serial2;
let latestDataP1 = "waiting for data";
let latestDataP2 = "waiting for data";

//  styles
let backgroundColor;
let darkBackgroundColor;
let gridColor;
let playerOneColor;
let playerTwoColor;
let sumColor;
let font;

let sound;

// global vars 
let gameScreen;
let correctPoints = {};
let timer;

let gridIncrement;
let startPos;
let midVal;

let ang1;
let x1;
let y1;
let path1 = [];

let ang2;
let x2;
let y2;
let path2 = [];

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
  serial1 = new p5.SerialPort();
  serial2 = new p5.SerialPort();

  serial1.list();
  let options = { baudRate: 115200 }; // change the data rate to whatever you wish
  
  serial1.open(env.player1, options);
  serial2.open(env.player2, options);

  // player 1 serial check
  serial1.on('connected', serverConnected);
  serial1.on('list', gotList);
  serial1.on('data', gotData1);
  serial1.on('error', gotError);
  serial1.on('open', gotOpen);
  serial1.on('close', gotClose);

  // player 2 serial check
  serial2.on('connected', serverConnected);
  serial2.on('list', gotList);
  serial2.on('data', gotData2);
  serial2.on('error', gotError);
  serial2.on('open', gotOpen);
  serial2.on('close', gotClose);

  // initialize data
  gameScreen = 0;
  timer = 3;

  gridIncrement = height / GRID_SIZE;
  startPos = gridIncrement * 3;
  midVal = floor((height / gridIncrement) / 2) * gridIncrement;

  x1 = 0;
  y1 = midVal;
  ang1 = 90;

  x2 = 0;
  y2 = midVal;
  ang2 = 90;

  // sound.play();
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
  playerOneColor = color(26, 66, 93);
  playerTwoColor = color(206, 93, 89);
  sumColor = color(0, 0, 0);
}

function loadFonts() {
  font = loadFont("../../../assets/fonts/GothamRounded-Bold.otf");
}

function loadSounds() {
  soundFormats('wav', 'ogg');
  sound = loadSound('Function_Matching_v2_Loop');
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

function gotData1() {
  // there is data available to work with from the serial port
  let incomingAngle = serial1.readStringUntil('\n');
  if (!incomingAngle) return;
  incomingAngle = float(incomingAngle);

  // altering incoming angle val to fit interaction
  if (incomingAngle > 0) {
    curAng = incomingAngle - 90;
  } else {
    curAng = 270 + incomingAngle;
  }

  if (ang1) {
    if (abs(curAng - ang1) < 100) {
      ang1 = curAng;
    }
  }
}

function gotData2() {
  // there is data available to work with from the serial port
  let incomingAngle = serial2.readStringUntil('\n');
  if (!incomingAngle) return;
  incomingAngle = float(incomingAngle);

  // altering incoming angle val to fit interaction
  if (incomingAngle > 0) {
    curAng = incomingAngle - 90;
  } else {
    curAng = 270 + incomingAngle;
  }

  if (ang2) {
    if (abs(curAng - ang2) < 100) {
      ang2 = curAng;
    }
  }
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
  textSize(width  * 0.018);
  fill(backgroundColor);
  text("What you draw together will create a line!", width / 2, height / 4 - 20);
  textSize(width  * 0.01);
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

  fill(playerOneColor);

  // player1 point
  ellipse(x1, y1, BRUSH_SIZE);

  // player2 point
  fill(playerTwoColor);
  ellipse(x2, y2, BRUSH_SIZE);

  // sum point
  newY = map(y1, 0, height, -midVal, midVal)
  fill(sumColor);
  ellipse(x2, y2 + newY, BRUSH_SIZE);

  // // adjust sound
  // let dist = abs(correctPoints[x1] - (y2 + newY + 50));

  // if (dist < 100) { 
  //   outputVolume(1 - dist/100);
  // } else {
  //   outputVolume(0);
  // }

  // end 
  if (x1 > width) {
    // sound.stop();
    noLoop();
    save(path1, "funcAddDataP1.txt");
    save(path2, "funcAddDataP2.txt");
  }

  path1.push([x1,  y1]);
  path2.push([x2,  y2]);

  x1 = x1 + SPEED;
  if (ang1) {
    y1 = lerp(y1, - (ang1 - 90) * SENSITIVITY + midVal, 0.05);
  }

  x2 = x2 + SPEED;
  if (ang2) {
    y2 = lerp(y2, - (ang2 - 90) * SENSITIVITY + midVal, 0.05);
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
  rect(startPos / 2, height / 2 - gridIncrement * 2.5, 130, 100);
}

function drawingCountdown(input) {
  // draw number
  fill(gridColor);
  textAlign(CENTER);
  textSize(70);
  text(input, startPos / 2, height / 2 - gridIncrement * 2.5);
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

function setLineDash(list) {
  drawingContext.setLineDash(list);
}