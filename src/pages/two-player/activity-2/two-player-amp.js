// <------- CONSTANTS TO CHANGE -------> //
let SENSITIVITY_P1 = 10;
let SENSITIVITY_P2 = 13;

let GOAL_AMP_P1 = 2;
let GOAL_AMP_P2 = 2;

let SPEED = 2;
let BRUSH_SIZE = 20;
let GRID_SIZE = 16; // height

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
let gridColor;
let font;

// global vars 
let gameScreen;
let timer;

let gridIncrement;
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

  gridIncrement = height / GRID_SIZE;
  startPos = gridIncrement * 6;
  midVal = round((height / gridIncrement) / 2) * gridIncrement;

  // x, y, ang, midVal, sensitivity, goalAmp, gridIncrement
  P1 = new AmplitudePlayer(0, midVal * 0.5, 90, midVal * 0.5, SENSITIVITY_P1, GOAL_AMP_P1, gridIncrement);
  P2 = new AmplitudePlayer(0, midVal * 1.5, 90, midVal * 1.5, SENSITIVITY_P2, GOAL_AMP_P2, gridIncrement);
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
  backgroundColor = color(43, 13, 98);
  darkBackgroundColor = color(43, 23, 94);
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
  gridColor = color(209, 80, 38);
}

function loadFonts() {
  font = loadFont("../../../assets/fonts/GothamRounded-Bold.otf");
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
  drawGrid();

  // instruction box
  rectMode(CENTER);
  fill(gridColor);
  rect(width / 2, height / 4, width * 0.5, height * 0.2, 10, 10, 10, 10);

  // text
  noStroke();
  textAlign(CENTER);
  textSize(25);
  fill(backgroundColor);
  text("Find as many green stars as possible!", width / 2, height / 4 - 20);
  textSize(20);
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
  // drawingCountdown(timer);

  // decrement timer
  // if (frameCount % 30 == 0 && timer > -1) {
  //   timer--;
  //   coverNumber();
  // }

  // if (timer == 0) {
  //   coverNumber();
  //   drawingCountdown("Go!");
  // }

  // if (timer == -1) {
  //   coverNumber();
  // }

  navigate(P1);
  navigate(P2);

  // adjust sound, color, tally score
  drawPoint(P1);
  drawPoint(P2);

  // end 
  if (P1.x > width) {
    noLoop();
    endScreen();
    save(P1.path, "ampDataP1.txt");
    save(P2.path, "ampDataP2.txt");
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

  // draw line
  strokeWeight(3);
  line(startPos, 0, startPos, height);

  // draw mid line
  setLineDash([5, 30]);
  stroke(gridColor);
  strokeWeight(8);
  line(0, midVal, width, midVal);

  // draw player mid lines
  setLineDash([0, 0]);
  stroke(gridColor);
  strokeWeight(8);
  line(0, P1.midVal, width, P1.midVal);
  line(0, P2.midVal, width, P2.midVal);

  noStroke();
}

function navigate(player) {
  if (player.y < player.ampBelow && player.y > player.ampAbove) {
    if (player.y < player.midVal + 20 && player.y > player.midVal - 20) {
      player.allowGreen = true;
    }
    player.reachedAmp = false;
  }

  if (player.y > player.ampBelow) {
    if (!player.reachedAmp) {
      if (player.x > startPos - 20 && player.allowGreen) {
        player.ampCount += 1;
      }
      player.reachedAmp = true;
      player.exitTop = true;
      if (player.allowGreen) {
        drawStar(player.x, player.y);
      }

      player.allowGreen = false;
    }
  }

  if (player.y < player.ampAbove) {
    if (!player.reachedAmp) {
      if (player.x > startPos - 20 && player.allowGreen) {
        player.ampCount += 1;
      }
      player.reachedAmp = true;
      player.exitTop = false;
      if (player.allowGreen) {
        drawStar(player.x, player.y);
      }
      player.allowGreen = false;
    }
  }
}

function drawPoint(player) {
  let dist;

  if (player.y > player.midVal) {
    dist = abs(player.ampBelow - player.y);
  } else {
    dist = abs(player.ampAbove - player.y);
  }

  if (!player.allowGreen) {
    fill(lineColors[10]);
  } else {
    if (dist < 50) {
      let index = round(dist / 5); // tolerance divded by 10
      fill(lineColors[index]);
    } else {
      fill(lineColors[10]);
    }
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

function star(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

function drawStar(x, y) {
  stroke(gridColor);
  strokeWeight(3);
  fill(lineColors[0])
  star(x, y, 20, 40, 5);
  noStroke();
}

function endScreen() {
  // modal
  noStroke();
  fill(darkBackgroundColor);
  rectMode(CORNER);
  rect(0, 0, startPos, height);

  // display text
  fill(gridColor);
  textAlign(CENTER);
  textSize(20);
  text("You found", startPos / 2, P1.midVal - 90);
  text("You found", startPos / 2, P2.midVal - 90);
  textSize(100);
  text(P1.ampCount, startPos / 2, P1.midVal + 20);
  text(P2.ampCount, startPos / 2, P2.midVal + 20);
  textSize(20);
  text("green stars!", startPos / 2, P1.midVal + 70);
  text("green stars!", startPos / 2, P2.midVal + 70);
}