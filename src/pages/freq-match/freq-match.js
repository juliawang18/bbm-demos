// <------- CONSTANTS TO CHANGE -------> //
let portName = "/dev/tty.usbmodem142101";
let SPEED = 3;
let SENSITIVITY = 15;
let BRUSH_SIZE = 20;
let GOAL_FREQ = 6;
let GRID_SIZE = 12;

// <------- DO NOT TOUCH BELOW -------> //

// serial communication
let serial;
let latestData = "waiting for data";  

// declare styles
let backgroundColor;
let goalColor;
let font;

// declare sounds
let playerOsc;

// notes
let highC = 523.251;
let middleC = 261.63;
let lowerC = 130.813;

// global vars
let gameScreen;
let startDraw = false;

let cycleCount = 0;

let gridIncrement;
let midVal;

let path;

let ang;
let x;
let y;

let currPeriod = [0];
let periods = [];
let isPositive;
let seen = false;
let goalPeriodLength;

let pointsToSave = [];
let fileCount = 0;

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
  serial = new p5.SerialPort();
  serial.list();
  let options = { baudRate: 115200 }; // change the data rate to whatever you wish
  serial.open(portName, options);
  serial.on('connected', serverConnected);
  serial.on('list', gotList);
  serial.on('data', gotData);
  serial.on('error', gotError);
  serial.on('open', gotOpen);
  serial.on('close', gotClose);

  // initialize data
  gameScreen = 0;
  gridIncrement = width / GRID_SIZE;
  midVal = floor((height / gridIncrement) / 2) * gridIncrement;
  goalPeriodLength = width / GOAL_FREQ;
  path = new Path(BRUSH_SIZE);
  y = height / 2;
  x = 0;

  // start sound
  playerOsc = new p5.SinOsc();
  playerOsc.start();
  playerOsc.freq(middleC);
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
  text("Try to make the whole screen green!", width / 2, height / 2);
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
    drawingGrid();
    startDraw = true;
  }

  if (startDraw) {
    if (y > midVal + BRUSH_SIZE/2) {
        if (isPositive) {
            cycleCount += 1;
            isPositive = false;
            currPeriod.push(x);
        }  
    }

    if (y < midVal - BRUSH_SIZE/2) {
        if (!isPositive) {
            cycleCount += 1;
            isPositive = true;
            currPeriod.push(x);
        }  
    }

    if (currPeriod.length == 3) {
        p = sort(currPeriod, 3);
        periods.push(p);
        currPeriod = [];
        currPeriod.push(p[2]);
    }

    // sound adjustment - target amps are +/- one octave from middle C (x-axis)
    let freq = map(y, 0, height, highC, lowerC);
    playerOsc.freq(freq);
  
    // add sensor val to path object
    if (ang != undefined) {
        pointsToSave.push([x,y]);
        displayPeriods(periods);
        path.addPoint(x, y);
        path.display();
    }
  
    // check if game should end
    if (x > width) {
      clear();
      frameCount = 0;
      noLoop();

      save(pointsToSave, "freqData.txt");
      playerOsc.stop();
  
      endScreen(cycleCount);
    }
  
    // increment point - angle based
    y = - (ang - 90) * SENSITIVITY + midVal; 
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
  strokeWeight(5);
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

function displayPeriods(periods) {
    colorMode(HSB);
    for (let i = 0; i < periods.length; i++) {
        p = periods[i]
        w = p[2] - p[0];
        dist = abs(goalPeriodLength - w);
        print(dist);
        fill(115 - dist, 82, 82, 0.5);
        rect((p[0] + p[2])/2, height / 2, w, height);
    }
}

function endScreen() {
  background(backgroundColor);
  drawingGrid();
  displayPeriods(periods);
  path.display();

//   noStroke();
//   fill('white');
//   textSize(20);
//   textAlign(CENTER);
//   text("You found green " + periods.length + " times!", width / 2, 100);
}