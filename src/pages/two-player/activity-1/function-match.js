// <------- CONSTANTS TO CHANGE -------> //
let SPEED = 6;
let SENSITIVITY = 9;
let BRUSH_SIZE = 20;

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
let player1;
let player2;

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
  serialP1.on('data', gotData);
  serialP1.on('error', gotError);
  serialP1.on('open', gotOpen);
  serialP1.on('close', gotClose);

  // player 2 serial check
  serialP2.on('connected', serverConnected);
  serialP2.on('list', gotList);
  serialP2.on('data', gotData);
  serialP2.on('error', gotError);
  serialP2.on('open', gotOpen);
  serialP2.on('close', gotClose);

  // initialize data
  gameScreen = 0;
  timer = 3;

  startPos = 400;
  midVal = height / 2;

  player1 = new Player();
  player2 = new Player();

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
  font = loadFont("../../../assets/fonts/GothamRounded-Book.otf");
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

function gotData(serial) {
  let incomingAngle = serial.readStringUntil('\n'); 
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

// <------------- DRAWING FUNCTIONS -------------> //
function initGame() {
  background(backgroundColor);
  drawingFunction(midVal1, func1);
  drawingFunction(midVal2, func2);

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
  text("Figure out how to draw blue the whole time!", width / 2, height / 2);
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
        drawingFunction(midVal1, func1);
        drawingFunction(midVal2, func2);
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
        clear();
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
          winScreen((sum1 / offsets1.length) * 100, 1);
        } else {
          loseScreen((sum1 / offsets1.length) * 100, 1);
        }
  
        if ((sum2 / offsets2.length) * 100 > 60) {
          winScreen((sum2 / offsets2.length) * 100, 2);
        } else {
          loseScreen((sum2 / offsets2.length) * 100, 2);
        }
      }
  
      // increment point - angle based
      y1 = - (ang1 - 90) * SENSITIVITY + midVal1; 
      y2 = - (ang2 - 90) * SENSITIVITY + midVal2; 

      // y1 = map(y1, 0, height, 0, midVal);
      // y2 = map(y2, 0, height, midVal, height);
  
      if (x1 < startPos) {
        x1 = x1 + 2.5;
        x2 = x2 + 2.5;
      } else {
        x1 = x1 + SPEED;
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

function drawingFunction(yVal, func) {
  // set pen
  stroke(0, 0.5);
  strokeWeight(10);

  // divider line
  line(0, midVal, width, midVal);

  // set pen
  stroke(255, 0.5);
  strokeWeight(10);

  // draw line
  // for (let i = 0; i < startPos; i += 20) {
  //   point(i, yVal);
  // }

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
  drawingFunction(midVal1, func1);
  drawingFunction(midVal2, func2);
  
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

function winScreen(score, num) {
  if (num == 1) {
    fill('#07A87C');
    rect(0, 0, width, midVal);
    drawingFunction(midVal1, func1);
    path1.display();

    noStroke();
    fill('white');
    textSize(20);
    textAlign(CENTER);
    text("You matched " + round(score) + "% of the points on the function!", width / 2, midVal1);

  } else {
    fill('#07A87C');
    rect(0, midVal, width, height);
    drawingFunction(midVal2, func2);
    path2.display();

    noStroke();
    fill('white');
    textSize(20);
    textAlign(CENTER);
    text("You matched " + round(score) + "% of the points on the function!", width / 2, midVal2);

  }
}

function loseScreen(score, num) {
  if (num == 1) {
    fill('#DA7045');
    rect(0, 0, width, midVal);
    drawingFunction(midVal1, func1);
    path1.display();

    noStroke();
    fill('white');
    textSize(20);
    textAlign(CENTER);
    text("You matched " + round(score) + "% of the points on the function.", width / 2, midVal1);

  } else {
    fill('#DA7045');
    rect(0, midVal, width, height);
    drawingFunction(midVal2, func2);
    path2.display();

    noStroke();
    fill('white');
    textSize(20);
    textAlign(CENTER);
    text("You matched " + round(score) + "% of the points on the function.", width / 2, midVal2);

  }
}