// <------- CONSTANTS TO CHANGE -------> //
let SENSITIVITY_P1 = 10;
let SENSITIVITY_P2 = 12;

let GOAL_FREQ_P1 = 6;
let GOAL_FREQ_P2 = 6;

let SPEED = 3;

let BRUSH_SIZE = 20;
let GRID_SIZE = 12;

// <------- DO NOT TOUCH BELOW -------> //

// serial communication
let env;
let serialP1, serialP2;
let latestDataP1 = "waiting for data";
let latestDataP2 = "waiting for data";

// notes
let midTone;
let highTone;
let lowTone;
let toneCount;
let successTone;
let unsuccessTone;

//  styles
let backgroundColor;
let darkBackgroundColor;
let gridColor;
let greatColor;
let okayColor;
let badColor;
let font;

// global vars 
let gameScreen;
let timer;

let startPos;
let midVal;
let gridIncrement;

// players
let P1;
let P2;

function preload() {
  // loaders
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
  startPos = gridIncrement * 4;
  midVal = round((height / gridIncrement) / 2) * gridIncrement;

  // x, y, ang, midVal, sensitivity, goalPeriodLength
  P1 = new FrequencyPlayer(0, midVal * 0.5, 90, midVal * 0.5, SENSITIVITY_P1, width/GOAL_FREQ_P1);
  P2 = new FrequencyPlayer(0, midVal * 1.5, 90, midVal * 1.5, SENSITIVITY_P2, width/GOAL_FREQ_P2);
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
  gridColor = color(209, 80, 38);
  greatColor = color(136, 51, 66);
  okayColor = color(38, 75, 95);
  badColor = color(18, 81, 91);
}

function loadFonts() {
  font = loadFont("../../../assets/fonts/GothamRounded-Bold.otf");
}

function loadSounds() {
  soundFormats('wav', 'ogg');
  midTone = loadSound('sound/Frequency_Matching_v1.a_Wood_Block_Counter-003');
  highTone = loadSound('sound/Frequency_Matching_v1.a_Wood_Block_Counter-002');
  lowTone = loadSound('sound/Frequency_Matching_v1.a_Wood_Block_Counter-001');
  successTone = loadSound('sound/Frequency_Matching_v1.a_Success_Chord');
  unsuccessTone = loadSound('sound/Frequency_Matching_v1.a_Unsuccessful_Chord');
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
  drawGrid(true);

  // instruction box
  rectMode(CENTER);
  fill(gridColor);
  rect(width / 2, height / 4, width * 0.5, height * 0.2, 10, 10, 10, 10);

  // text
  noStroke();
  textAlign(CENTER);
  textSize(width  * 0.018);
  fill(backgroundColor);
  text("Try to make the whole screen green!", width / 2, height / 4 - 20);
  textSize(width  * 0.01);
  text("(click anywhere to start)", width / 2, height / 4 + 30);
}

function playGame() {
  // draw initial background
  if (frameCount == 1) {
    clear();
    background(backgroundColor);
    drawGrid(true);
  }

  // countdown
  // drawingCountdown(timer);

  // // decrement timer
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

  displayPeriods();

  // end 
  if (P1.x > width) {
    noLoop();
    endScreen();
    save(P1.path, "freqDataP1.txt");
    save(P2.path, "freqDataP2.txt");
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
  fill(darkBackgroundColor);
  textAlign(CENTER);
  textSize(100);
  text(input, startPos / 2, height / 2);
}

function setLineDash(list) {
  drawingContext.setLineDash(list);
}

function displayPeriods() {
  clear();
  background(backgroundColor);

  for (let i = 0; i < P1.periods.length; i++) {
    p = P1.periods[i]
    w = p[2] - p[0];
    dist = abs(P1.goalPeriodLength - w);

    if (dist > 100) {
      fill(badColor);
    } else if (dist <= 110 && dist > 40) {
      fill(okayColor);
    } else {
      fill(greatColor);
    }
    rectMode(CENTER);
    rect((p[0] + p[2]) / 2, P1.midVal, w, height / 2);

    // line
    stroke(gridColor);
    strokeWeight(3);
    line(p[2], 0, p[2], midVal)
    noStroke();
  }

  for (let j = 0; j < P2.periods.length; j++) {
    p = P2.periods[j]
    w = p[2] - p[0];
    dist = abs(P2.goalPeriodLength - w);

    if (dist > 100) {
      fill(badColor);
    } else if (dist <= 110 && dist > 40) {
      fill(okayColor);
    } else {
      fill(greatColor);
    }
    rectMode(CENTER);
    rect((p[0] + p[2]) / 2, P2.midVal, w, height / 2);

    // line
    stroke(gridColor);
    strokeWeight(3);
    line(p[2], midVal, p[2], height)
    noStroke();
  }

  drawGrid(false);
  displayPath(P1);
  displayPath(P2);
}

function getLastPt(path) {
  return path[path.length - 2];
}

function displayPath(player) {
  fill(gridColor);
  for (let i = 0; i < player.path.length; i += 1) {
    ellipse(player.path[i][0], player.path[i][1], BRUSH_SIZE);
  }
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
  // passes midline
  if (player.y > player.midVal + BRUSH_SIZE / 2) {
    if (player.isPositive) {
      player.isPositive = false;
      player.currPeriod.push(player.x);
    }
  }

  // passes midline
  if (player.y < player.midVal - BRUSH_SIZE / 2) {
    if (!player.isPositive) {
      player.isPositive = true;
      player.currPeriod.push(player.x);
    }
  }

  // lower bound
  lastPt = getLastPt(player.path);
  if (lastPt) {
    if (lastPt[1] > player.y) {
      if (player.currState == "increasing" && player.toneCount == 0) {
        lowTone.play();
        player.toneCount = 1;
      }
      player.currState = "decreasing";
    }

    // upper bound
    if (lastPt[1] < player.y) {
      if (player.currState == "decreasing" && player.toneCount == 0) {
        highTone.play();
        player.toneCount = 1;
      }
      player.currState = "increasing";
    }
  }

  if (player.currPeriod.length == 3) {
    p = sort(player.currPeriod, 3);
    player.periods.push(p);
    player.currPeriod = [];
    player.currPeriod.push(p[2]);

    let w = p[2] - p[0];
    let dist = abs(player.goalPeriodLength - w);

    if (dist > 40) {
      unsuccessTone.play();
    } else {
      successTone.play();
    }
  }
}

function drawPoint(player) {
  fill(gridColor);
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
  fill(gridColor);
  textAlign(CENTER);
  textSize(20);
  text("You found green", startPos / 2, P1.midVal - 90);
  text("You found green", startPos / 2, P2.midVal - 90);
  textSize(100);
  text(scoreP1, startPos / 2, P1.midVal + 20);
  text(scoreP2, startPos / 2, P2.midVal + 20);
  textSize(20);
  text("times!", startPos / 2, P1.midVal + 70);
  text("times!", startPos / 2, P2.midVal + 70);
}

function calculateScore(player) {
  let score = 0;
  for (let i = 0; i < player.periods.length; i++) {
    p = player.periods[i]
    w = p[2] - p[0];
    dist = abs(player.goalPeriodLength - w);
    if (p[0] > startPos && dist <= 40) {
      score += 1;
    } 
  }
  return score;
}