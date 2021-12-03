// <------- CONSTANTS TO CHANGE -------> //
let portName1 = "/dev/tty.usbmodem142101";
let portName2 = "/dev/tty.usbmodem142201";
let SPEED = 5;
let SENSITIVITY1 = 15;
let SENSITIVITY2 = 15;
let BRUSH_SIZE = 20;
let GOAL_FREQ = 6;
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

// notes
let midTone;
let highTone;
let lowTone;
let toneCount1;
let toneCount2;
let successTone;
let unsuccessTone;

// global vars
let gameScreen;
let startDraw = false;
let gridIncrement;
let midVal;

// player one
let midVal1;
let cycleCount1 = 0;
let path1;
let ang1;
let x1;
let y1;
let currState1;
let currPeriod1 = [0];
let periods1 = [];
let isPositive1;

// player two
let midVal2;
let cycleCount2 = 0;
let path2;
let ang2;
let x2;
let y2;
let currState2;
let currPeriod2 = [0];
let periods2 = [];
let isPositive2;

let goalPeriodLength;

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
  goalPeriodLength = width / GOAL_FREQ;

  // player one 
  midVal1 = midVal - (midVal/2);
  path1 = new Path(BRUSH_SIZE);
  y1 = midVal1;
  x1 = 0;

  // player two
  midVal2 = midVal + (midVal/2);
  path2 = new Path(BRUSH_SIZE);
  y2 = midVal2;
  x2 = 0;

  toneCount = 0;

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

function loadSounds() {
  soundFormats('wav', 'ogg');
  midTone = loadSound('sound/Frequency_Matching_v1.a_Wood_Block_Counter-003');
  highTone = loadSound('sound/Frequency_Matching_v1.a_Wood_Block_Counter-002');
  lowTone = loadSound('sound/Frequency_Matching_v1.a_Wood_Block_Counter-001');
  successTone = loadSound('sound/Frequency_Matching_v1.a_Success_Chord');
  unsuccessTone = loadSound('sound/Frequency_Matching_v1.a_Unsuccessful_Chord');
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
  text("Try to make the whole screen green!", width / 2, height / 2);
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
      // passes midline
      if (y1 > midVal1 + BRUSH_SIZE/2) {
          if (isPositive1) {
              cycleCount1 += 1;
              isPositive1 = false;
              currPeriod1.push(x1);
              // midTone.play();
              // toneCount1 = 0;
          }  
      }

      if (y2 > midVal2 + BRUSH_SIZE/2) {
        if (isPositive2) {
            cycleCount2 += 1;
            isPositive2 = false;
            currPeriod2.push(x2);
            // midTone.play();
            // toneCount2 = 0;
        }  
    }

      // passes midline
      if (y1 < midVal1 - BRUSH_SIZE/2) {
          if (!isPositive1) {
              cycleCount1 += 1;
              isPositive1 = true;
              currPeriod1.push(x1);
              // midTone.play();
              // toneCount1 = 0;
          }  
      }

      if (y2 < midVal2 - BRUSH_SIZE/2) {
        if (!isPositive2) {
            cycleCount2 += 1;
            isPositive2 = true;
            currPeriod2.push(x2);
            // midTone.play();
            // toneCount2 = 0;
        }  
    }

      // lower bound
      if (path1.lastPt()) {
        // console.log(path.lastPt().y);
        if (path1.lastPt().y > y1) {
          if (currState1 == "increasing" && toneCount1 == 0) {
            lowTone.play();
            toneCount1 = 1;
            // console.log("high");
          }
          currState1 = "decreasing";
        }
    
        // upper bound
        if (path1.lastPt().y < y1) {
          if (currState1 == "decreasing" && toneCount1 == 0) {
            highTone.play();
            toneCount1 = 1;
            // console.log("low");
          }
          currState1 = "increasing";
        }

      }

      if (path2.lastPt()) {
        // console.log(path.lastPt().y);
        if (path2.lastPt().y > y2) {
          if (currState2 == "increasing" && toneCount2 == 0) {
            // lowTone.play();
            toneCount2 = 1;
            // console.log("high");
          }
          currState2 = "decreasing";
        }
    
        // upper bound
        if (path2.lastPt().y < y2) {
          if (currState2 == "decreasing" && toneCount2 == 0) {
            // highTone.play();
            toneCount2 = 1;
            // console.log("low");
          }
          currState2 = "increasing";
        }
      }

      if (currPeriod1.length == 3) {
          let p = sort(currPeriod1, 3);
          periods1.push(p);
          currPeriod1 = [];
          currPeriod1.push(p[2]);

          let w = p[2] - p[0];
          let dist = abs(goalPeriodLength - w);

          // if (dist > 20) {
          //   console.log("bad");
          //   unsuccessTone.play();
          // } else {
          //   console.log("good");
          //   successTone.play();
          // }
      }

      if (currPeriod2.length == 3) {
        let p = sort(currPeriod2, 3);
        periods2.push(p);
        currPeriod2 = [];
        currPeriod2.push(p[2]);

        let w = p[2] - p[0];
        let dist = abs(goalPeriodLength - w);

        // if (dist > 20) {
        //   console.log("bad");
        //   unsuccessTone.play();
        // } else {
        //   console.log("good");
        //   successTone.play();
        // }
    }

      // add sensor val to path object
      if (ang1 != undefined || ang2 != undefined) {

          displayPeriods(periods1, 1);
          displayPeriods(periods2, 2);
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
      y1 = - (ang1 - 90) * SENSITIVITY1 + midVal1; 
      x1 = x1 + SPEED;

      y2 = - (ang2 - 90) * SENSITIVITY2 + midVal2; 
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
  strokeWeight(5);
  line(0, midVal1, width, midVal1);
  line(0, midVal2, width, midVal2);

  stroke(0, 1);
  strokeWeight(10);
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

function displayPeriods(periods, player) {
    colorMode(HSB);
    if (player == 1) {
      for (let i = 0; i < periods.length; i++) {
        p = periods[i];
        w = p[2] - p[0];
        dist = abs(goalPeriodLength - w);
        fill(115 - dist, 82, 82, 0.5);
        rect((p[0] + p[2])/2, midVal / 2, w, midVal);
      }
    } else {
      for (let i = 0; i < periods.length; i++) {
        p = periods[i]
        w = p[2] - p[0];
        dist = abs(goalPeriodLength - w);
        fill(115 - dist, 82, 82, 0.5);
        rect((p[0] + p[2])/2, (height+midVal)/2, w, height-midVal);
      }
    }
}

function endScreen() {
  background(backgroundColor);
  drawingGrid();
  displayPeriods(periods1, 1);
  displayPeriods(periods2, 2);
  path1.display();
  path2.display();

//   noStroke();
//   fill('white');
//   textSize(20);
//   textAlign(CENTER);
//   text("You found green " + periods.length + " times!", width / 2, 100);
}