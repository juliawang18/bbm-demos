// CONSTANTS TO CHANGE //
let portName = "/dev/tty.usbmodem142101";
let SPEED = 5;
let SENSITIVITY = 3;
let BRUSH_SIZE = 20;
let GOAL_AMP_TEXT = 2;

// DO NOT TOUCH BELOW //
let serial;
let latestData = "waiting for data";  // you'll use this to write incoming data to the canvas
let funcPoints = [];
let startDraw = false;
let drawGrid = false;
let reachedAmp;
let COUNT = 0;
let path;
let ang;            // Angle
let rad;            // Angle in radians
let x;              // XPos of drawing dot
let y;              // YPos of drawing dot
let interval;
let midVal;
let GOAL_AMP

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  background("#F4705F");

  colorMode(HSB, 360, 100, 100);
  path = new Path();

  interval = window.innerWidth/12;
  midVal = floor(floor(window.innerHeight / interval) / 2) * interval + 80;
  GOAL_AMP = GOAL_AMP_TEXT * interval;

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

  var button = createButton("restart");
  button.mousePressed(reset);
  button.style('position', "absolute");
  button.style('right', "10px");
  button.style('top', "10px");
  button.style('background-color', "#0055FF");
  button.style('border-radius', "50px");
  button.style('border', "none");
  button.style('color', "white");
  button.style('width', "100px");
  button.style('margin', "auto");
  button.style('padding', "20px");
  button.style('cursor', "pointer");
  button.style('text-align', "center");
  button.style('font-size', "16px");
  button.style('font-family', "'Quicksand', san-serif");

  // initialize point data
  y = midVal;
  x = 0;
}

// We are connected and ready to go
function serverConnected() {
  print("Connected to Server");
}

// Got the list of ports
function gotList(thelist) {
  print("List of Serial Ports:");
  // theList is an array of their names
  for (let i = 0; i < thelist.length; i++) {
    // Display in the console
    print(i + " " + thelist[i]);
  }
}

// Connected to our serial device
function gotOpen() {
  print("Serial Port is Open");
}

function gotClose() {
  print("Serial Port is Closed");
  latestData = "Serial Port is Closed";
}

// Ut oh, here is an error, let's log it
function gotError(theerror) {
  print(theerror);
}

// There is data available to work with from the serial port
function gotData() {
  let incomingAngle = serial.readStringUntil('\n');  // read the incoming string 
  if (!incomingAngle) return;             // if the string is empty, do no more
  incomingAngle = float(incomingAngle);

  if (incomingAngle > 0) {
    ang = incomingAngle - 90;
  } else {
    ang = incomingAngle + 270;
  }
}

function draw() {

  if (frameCount == 50) {
    drawingCount("3");
  } else if (frameCount == 100) {
    drawingCount("2");
  } else if (frameCount == 150) {
    drawingCount("1");
  } else if (frameCount > 200) {
    startDraw = true;
    drawGrid = true;
  }

  if (startDraw) {
    if (drawGrid == true) {
      background("#F4705F");
      drawingGrid();
      drawGrid = false;
    }

    if (y > height / 2 + GOAL_AMP) {
      if (!reachedAmp) {
        COUNT += 1;
        reachedAmp = true;
      }
    }

    if (y < height / 2 + GOAL_AMP && y > height / 2 - GOAL_AMP) {
      reachedAmp = false;
    }

    if (y < height / 2 - GOAL_AMP) {
      if (!reachedAmp) {
        COUNT += 1;
        reachedAmp = true;
      }
    }

    colorMode(HSB);
    if (ang != undefined) {
      path.addPoint(x, y);
      path.display();
    }

    // increment point x and y
    y = - (ang - 90) * SENSITIVITY + midVal; // ang mapping
    x = x + SPEED;

    if (x > window.innerWidth) {
      showResults(COUNT);
      noLoop();
    }
  }

}

function reset() {
  background("#F4705F");

  colorMode(HSB, 360, 100, 100);
  path = new Path();

  // initialize point data
  y = midVal;
  x = 0;

  COUNT = 0;
  frameCount = 0;
  funcPoints = [];
  startDraw = false;
  drawGrid = false;
  loop();
}

function showResults(count) {
  fill("white");
  textAlign(CENTER);
  textSize(20);
  text("YOU'VE REACH THE AMPLITUDE", width / 2, height / 2 - 100);
  textSize(100);
  text(count, width / 2, height / 2);
  textSize(20);
  text("TIMES", width / 2, height / 2 + 40);
}

function drawingCount(num) {
  clear();
  background("#F4705F");
  drawingGrid();
  background('rgba(0,0,0, 0.3)');
  textAlign(CENTER);
  textSize(100);
  text(num, width / 2, height / 2);
}

function drawingGrid() {
  colorMode(HSB);
  var yBelow = midVal + GOAL_AMP;
  var yAbove = midVal - GOAL_AMP;
  console.log(GOAL_AMP);

  stroke(222, 59, 62);
  strokeWeight(5);
  line(0, yBelow, width, yBelow);

  stroke(222, 59, 62);
  strokeWeight(5);
  line(0, yAbove, width, yAbove);

  colorMode(RGB);
  stroke(255, 50);
  strokeWeight(2);
  for (let i = 0; i < width; i += interval) {
    line(i, 80, i, height);
  }
  for (let j = 80; j < height; j += interval) {
    line(0, j, width, j);
  }

  stroke(255);
  strokeWeight(8);

  line(0, midVal, width, midVal);

  noStroke();
  fill('white');
  textSize(20);
  textAlign(LEFT);
  xVal = 0;
  yVal = 0;
  for (let i = 0; i < width - interval; i += interval*2) {
    text(xVal, i, midVal + 25);
    xVal += 2;
  }
  for (let j = 80 + interval; j < height; j += interval*2) {
    text(-yVal + 2, width / 2 + 5, j - 10);
    yVal += 2;
  }

}

// function drawHeader(y) {
//   fill("#272433");
//   noStroke();
//   rect(0, 0, 1000, 60);

//   noStroke();
//   fill('white');
//   textSize(20);
//   textAlign(CENTER);
//   text("Y-POS: " + Math.round(((300 - y) * 100) / 100), 400, 37);
//   text("GOAL AMP: " + GOAL_AMP_TEXT, 550, 37);
// }

class Path {
  constructor() {
    this.pts = [];
    this.size = BRUSH_SIZE; // size of brush
    this.spacing = 0.3; // spacing between points; lower value gives you smoother path, but frame rate will drop
    this.hue = 150; // start value
    this.hues = []; // keep track of the hues for each point
  }

  get lastPt() {
    return this.pts[this.pts.length - 1];
  }

  addPoint(x, y) {
    if (this.pts.length < 1) {
      this.pts.push(new p5.Vector(x, y));
      this.hues.push(this.hue);
      return;
    }

    const nextPt = new p5.Vector(x, y);
    let d = p5.Vector.dist(nextPt, this.lastPt);

    while (d > this.spacing) {
      const diff = p5.Vector.sub(nextPt, this.lastPt);
      diff.normalize();
      diff.mult(this.spacing)
      this.pts.push(p5.Vector.add(this.lastPt, diff));
      d -= this.spacing;

      if (y > height / 2 + GOAL_AMP || y < height / 2 - GOAL_AMP) {
        this.hue = 222;
      } else {
        // between 170 - 222
        this.hue = (abs(y - midVal) * (52/(GOAL_AMP))) + 170;
      }
      this.hues.push(this.hue);
    }
  }

  display() {
    noStroke()
    for (let i = 0; i < this.pts.length; i++) {
      const p = this.pts[i];
      fill(this.hues[i], 59, 62);
      ellipse(p.x, p.y, this.size, this.size);
    }
  }
}