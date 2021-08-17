// CONSTANTS TO CHANGE //
let portName = "/dev/tty.usbmodem142101"; 
let SPEED = 2;
let SENSITIVITY = 3;
let BRUSH_SIZE = 20;
let GOAL_AMP = 200;

// DO NOT TOUCH BELOW //
let serial;
let latestData = "waiting for data";  // you'll use this to write incoming data to the canvas
let funcPoints = [];
let startDraw = false;
let drawGrid = false;
let path;
let ang;            // Angle
let rad;            // Angle in radians
let x;              // XPos of drawing dot
let y;              // YPos of drawing dot
let amplitudes = [];

function setup() {
  createCanvas(1000, 600);
  background("#272433");

  colorMode(HSB, 360, 100, 100);
  path = new Path();

  // console.log(funcPoints.length);

  // Instantiate our SerialPort object
  serial = new p5.SerialPort();

  // Get a list the ports available
  // You should have a callback defined to see the results
  serial.list();

  // Assuming our Arduino is connected, let's open the connection to it
  // Change this to the name of your arduino's serial port
  let options = { baudRate: 115200}; // change the data rate to whatever you wish
  serial.open(portName, options);

  // Here are the callbacks that you can register
  // When we connect to the underlying server
  serial.on('connected', serverConnected);

  // When we get a list of serial ports that are available
  serial.on('list', gotList);
  // OR
  //serial.onList(gotList);

  // When we some data from the serial port
  serial.on('data', gotData);
  // OR
  //serial.onData(gotData);

  // When or if we get an error
  serial.on('error', gotError);
  // OR
  //serial.onError(gotError);

  // When our serial port is opened and ready for read/write
  serial.on('open', gotOpen);
  // OR
  //serial.onOpen(gotOpen);

  serial.on('close', gotClose);

  // Callback to get the raw data, as it comes in for handling yourself
  // serial.on('rawdata', gotRawData);
  // OR
  //serial.onRawData(gotRawData);

  // initialize point data
  y = height/2;
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

function gotClose(){
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

// We got raw from the serial port
function gotRawData(thedata) {
  print("gotRawData " + thedata);
}

function draw() {
  textSize(50);
  textAlign(CENTER);
  noStroke();
  fill('white');
  
  if (frameCount == 50) {
    background("#272433");
    text("3", width / 2, height / 2);
  } else if (frameCount == 100) {
    background("#272433");
    text("2", width / 2, height / 2);
  } else if (frameCount == 150) {
    background("#272433");
    text("1", width / 2, height / 2);
  } else if (frameCount > 200) {
    startDraw = true;
    drawGrid = true;
  }

  if (startDraw) {
    if (drawGrid == true) {
      background("#272433");
      drawingGrid();
      drawGrid = false;
    }

    if (x > 1000) {
      frameCount = 0;
      noLoop();
    }

    colorMode(HSB);
    if (ang != undefined) {
        drawHeader(y);
        path.addPoint(x, y);
        path.display();
    }
    
    // increment point x and y
    y = - (ang - 90) * SENSITIVITY + 300; // ang mapping
    x = x + SPEED;
  }
  
}

function drawingGrid() {
    colorMode(RGB);
    stroke(255, 50);
    strokeWeight(2);
    for(let i = 80; i < width; i+=80) {
      line(i, 0, i, height);
    }
    for(let j = 60; j < height; j+=80) {
      line(0, j, width, j);
    }
    
    stroke(255);
    strokeWeight(2);
    line(0, 300, width, 300);

    colorMode(HSB);
    var yBelow = 300 + GOAL_AMP;
    var yAbove = 300 - GOAL_AMP;

    stroke((yBelow - 180) % 360, 100, 100);
    strokeWeight(2);
    line(0, yBelow, width, yBelow);

    stroke((yAbove - 180) % 360, 100, 100);
    strokeWeight(2);
    line(0, yAbove, width, yAbove);
  }
  

function drawHeader(y) {
    fill("#272433");
    noStroke();
    rect(0, 0, 1000, 60);
    
    noStroke();
    fill('white');
    textSize(20);
    textAlign(CENTER); 
    text("Y-POS: " + Math.round(((300-y) * 100) / 100), 400, 37);
    text("GOAL AMP: " + GOAL_AMP, 550, 37);
}

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
      this.hue = (y - 180) % 360; // for each new point, update the hue
      this.hues.push(this.hue);
    }
  }

  display() {
    noStroke()
    for (let i = 0; i < this.pts.length; i++) {
      const p = this.pts[i];
      fill(this.hues[i], 100, 100)
      ellipse(p.x, p.y, this.size, this.size);
    }
  }
}