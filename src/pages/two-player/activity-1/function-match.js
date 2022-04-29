// <------- CONSTANTS TO CHANGE -------> //
let SENSITIVITY_P1 = 10;
let SENSITIVITY_P2 = 13;

let SPEED = 3;
let BRUSH_SIZE = 20;

// player1 function
function func1(x) {
  return sin(x);
}

// player2 function
function func2(x) {
  return sin(x);
}

// <------- DO NOT TOUCH BELOW -------> //

// serial communication
let env;
let serialP1, serialP2;
let latestDataP1 = "waiting for data";
let latestDataP2 = "waiting for data";

//  styles
let backgroundColor;
let darkBackgroundColor;
let lineColors;
let modalColor;
let font;

// global vars 
let gameScreen;
let timer;

let startPos;
let midVal;

// players
let P1;
let P2;

function preload() {
  // loaders
  loadColors();
  loadFonts();
}

function setup() {
  // visual setup
  createCanvas(window.innerWidth, window.innerHeight);
  textFont(font);

  // instantiate our serialport object
  env = new Env();
  serialP1 = new p5.SerialPort();
  serialP2 = new p5.SerialPort();

  serialP1.list();
  let options = { baudRate: 115200 }; // change the data rate to whatever you wish

  serialP1.open(env.player1, options);
  serialP2.open(env.player2, options);

  // player 1 serial check
  serialP1.on('connected', serverConnected);
  serialP1.on('list', gotList);
  serialP1.on('data', gotP1Data);
  serialP1.on('error', gotError);
  serialP1.on('open', gotOpen);
  serialP1.on('close', gotClose);

  // player 2 serial check
  serialP2.on('connected', serverConnected);
  serialP2.on('list', gotList);
  serialP2.on('data', gotP2Data);
  serialP2.on('error', gotError);
  serialP2.on('open', gotOpen);
  serialP2.on('close', gotClose);

  // initialize data
  gameScreen = 0;
  timer = 3;

  startPos = 400;
  midVal = height / 2;

  P1 = new FunctionPlayer(0, midVal * 0.5, 90, midVal * 0.5, SENSITIVITY_P1);
  P2 = new FunctionPlayer(0, midVal * 1.5, 90, midVal * 1.5, SENSITIVITY_P2);

  loadCorrectPoints();
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

function loadCorrectPoints() {
  // P1
  for (let i = 0; i < width; i += SPEED) {
    let xPoint = i;
    let yPoint = func1((i - startPos) / 100) * 100 + P1.midVal;
    P1.correctPoints[xPoint] = yPoint;
  }

  // P2
  for (let j = 0; j < width; j += SPEED) {
    let xPoint = j;
    let yPoint = func2((j - startPos) / 100) * 100 + P2.midVal;
    P2.correctPoints[xPoint] = yPoint;
  }
}


// <------------- SETUP FUNCTIONS -------------> //
function serverConnected() {
  print("Connected to Server");
}

function gotList(thelist) {
  print("List of Serial Ports:");
  for (let i = 0; i < thelist.length; i++) {
    print(i + " " + thelist[i]);
  }
}

function gotOpen() {
  print("Serial Port is Open");
}

function gotClose() {
  print("Serial Port is Closed");
  latestData = "Serial Port is Closed";
}

function gotError(theerror) {
  print(theerror);
}

function gotP1Data(serial) {
  let incomingAngle = serialP1.readStringUntil('\n');
  if (!incomingAngle) return;
  incomingAngle = float(incomingAngle);

  // altering incoming angle val to fit interaction
  if (incomingAngle > 0) {
    P1.ang = incomingAngle - 90;
  } else if (incomingAngle == 0) {
    P1.ang = 0;
  } else {
    P1.ang = 270 + incomingAngle;
  }
  // ang1 = incomingAngle + 90;
}

function gotP2Data(serial) {
  let incomingAngle = serialP2.readStringUntil('\n');
  if (!incomingAngle) return;
  incomingAngle = float(incomingAngle);

  // altering incoming angle val to fit interaction
  if (incomingAngle > 0) {
    P2.ang = incomingAngle - 90;
  } else if (incomingAngle == 0) {
    P2.ang = 0;
  } else {
    P2.ang = 270 + incomingAngle;
  }
  // ang1 = incomingAngle + 90;
}

// <------------- DRAWING FUNCTIONS -------------> //
function initGame() {
  background(backgroundColor);
  drawFunctions();

  // instruction box
  rectMode(CENTER);
  fill(modalColor);
  rect(width / 2, height / 4, width * 0.5, height * 0.2, 10, 10, 10, 10);

  // text
  noStroke();
  textAlign(CENTER);
  textSize(width  * 0.018);
  fill(backgroundColor);
  text("Figure out how to draw green the whole time!", width / 2, height / 4 - 20);
  textSize(width  * 0.01);
  text("(click anywhere to start)", width / 2, height / 4 + 30);
}

function playGame() {
  // draw initial background
  if (frameCount == 1) {
    clear();
    background(backgroundColor);
    drawFunctions();
  }

  // countdown
  drawingCountdown(timer);

  // decrement timer
  if (frameCount % 22 == 0 && timer > -1) { 
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
  drawPoint(P1);
  drawPoint(P2);

  // end 
  if (P1.x > width) {
    noLoop();
    endScreen();
    save(P1.path, "funcDataP1.txt");
    save(P2.path, "funcDataP2.txt");
  }

  incrementPosition(P1);
  incrementPosition(P2);

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
  fill(backgroundColor);
  rectMode(CENTER);
  rect(startPos / 2, height / 2, 200, 150);
}

function drawingCountdown(input) {
  // draw number
  fill(modalColor);
  textAlign(CENTER);
  textSize(100);
  text(input, startPos / 2, height / 2);
}

function setLineDash(list) {
  drawingContext.setLineDash(list);
}

function drawFunctions() {
  // draw line
  setLineDash([2, 10]);
  stroke(255, 0.5);
  strokeWeight(3);
  line(startPos, 0, startPos, height);

  // set pen
  stroke(255, 0.3);
  strokeWeight(10);

  // draw functions
  for (let i = 0; i < width; i += 20) {
    if (i > startPos) {
      stroke(255, 1);
    }
    let xPoint = i;
    let yPoint = func1((i - startPos) / 100) * 100 + P1.midVal;
    point(xPoint, yPoint);
  }

  // set pen
  stroke(255, 0.3);
  strokeWeight(10);

  for (let j = 0; j < width; j += 20) {
    if (j > startPos) {
      stroke(255, 1);
    }
    let xPoint = j;
    let yPoint = func2((j - startPos) / 100) * 100 + P2.midVal;
    point(xPoint, yPoint);
  }

  noStroke();
}

function drawPoint(player) {
  let dist = abs(player.correctPoints[player.x] - player.y); 

  console.log(dist);

  if (dist < 100) { 
    let index = round(dist/10);
    if (player.x >= startPos) {
      if (index < 5) {
        player.tally.push(1);
      } else {
        player.tally.push(0);
      }
    }
    fill(lineColors[index]);

  } else {
    fill(lineColors[9]);
    player.tally.push(0);
  }

  ellipse(player.x, player.y, BRUSH_SIZE);
}

function incrementPosition(player) {
  player.x = player.x + SPEED;
  if (player.ang) {
    player.y = lerp(player.y, - (player.ang - 90) * player.sensitivity + player.midVal, 0.05);
  }

  player.path.push([player.x, player.y]);
}

function endScreen() {
  // modal
  noStroke();
  fill(darkBackgroundColor);
  rectMode(CORNER);
  rect(0, 0, startPos, height);

  // score calc
  let scoreP1 = calculateScore(P1);
  let scoreP2 = calculateScore(P2);

  // display text
  fill(modalColor);
  textAlign(CENTER);
  textSize(20);
  text("You got", startPos / 2, P1.midVal - 90);
  text("You got", startPos / 2, P2.midVal - 90);
  textSize(100);
  text(scoreP1 + "%", startPos / 2, P1.midVal + 20);
  text(scoreP2 + "%", startPos / 2, P2.midVal + 20);
  textSize(20);
  text("green!", startPos / 2, P1.midVal + 70);
  text("green!", startPos / 2, P2.midVal + 70);
}

function calculateScore(player) {
  let score;
  if (player.tally.length == 0) {
    score = 0;
  } else {
    const reducer = (previousValue, currentValue) => previousValue + currentValue;
    score = round((player.tally.reduce(reducer) / player.tally.length) * 100);
  }
  return score;
}