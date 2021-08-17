// CONSTANTS TO CHANGE //
let portName = "/dev/tty.usbmodem142101"; 
let SPEED = 20;
let SENSITIVITY = 3;
let BRUSH_SIZE = 20;
let SLOPE_BASED = true;

function func(x) {
  return sin(x);
}

// DO NOT TOUCH BELOW //
let serial;
let latestData = "waiting for data";  // you'll use this to write incoming data to the canvas
let funcPoints = {};
let offsets = [];
let startDraw = false;
let drawFunction = false;
let time;
let path;
let ang;            // Angle
let rad;            // Angle in radians
let x;              // XPos of drawing dot
let y;              // YPos of drawing dot

function setup() {
  createCanvas(1000, 600);
  background("#272433");

  colorMode(HSB, 360, 100, 100);
  path = new Path();
  time = second();

  // Instantiate our SerialPort object
  serial = new p5.SerialPort();
  serial.list(); // list ports
  let options = { baudRate: 115200}; 
  serial.open(portName, options);
  serial.on('connected', serverConnected);
  serial.on('list', gotList);
  serial.on('data', gotData);
  serial.on('error', gotError);
  serial.on('open', gotOpen);
  serial.on('close', gotClose);

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
  
  if (SLOPE_BASED) {
    ang = float(incomingAngle) + 90;
  } else {
    if (incomingAngle > 0) {
      ang = incomingAngle - 90;
    } else {
      ang = incomingAngle + 270;
    }
  }
}

function draw() {
  // console.log(x, y);
  // console.log(ang);
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
    drawFunction = true;
  }

  if (startDraw) {
    if (drawFunction == true) {
      background("#272433");
      for (let i = 0; i < width; i+=SPEED) {
        let xPoint = i;
        let yPoint= func(i/100) * 100 + (height/2);
    
        colorMode(RGB);
        stroke(255, 255, 255, 50);
        strokeWeight(10);
        point(xPoint, yPoint);
  
        funcPoints[xPoint] = yPoint;
      }
      colorMode(HSB);
      drawFunction = false;
    }

    if (ang != undefined) {
      console.log("STILL DRAWING");
      path.addPoint(x, y);
      path.display();
    }

    if (x > 1000) {
      clear();
      frameCount = 0;
      noLoop();

      let sum = 0;
      for (let i = 0; i < offsets.length; i+=1) {
        if (offsets[i] > 0) {
          sum += offsets[i];
        }
      }
    }
    
    if (SLOPE_BASED) {
      rad = (ang/180) * PI; // slope mapping
      y = y + SPEED * cos(rad)/sin(rad) * SENSITIVITY;
      x = x + SPEED;
    } else {
      y = - (ang - 90) * SENSITIVITY + 300; // ang mapping
      x = x + SPEED;
    }
  }
  
}

function calcDistance(correctPoint, userPoint) {
  return dist(userPoint[0], userPoint[1], correctPoint[0], correctPoint[1]);
}

class Path {
  constructor() {
    this.pts = [];
    this.userPts = {}
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
      this.userPts[x] = y;
      return;
    }

    this.userPts[x] = y;

    let distance = calcDistance([x, funcPoints[x]], [x, y]);
    offsets.push(distance);

    const nextPt = new p5.Vector(x, y);
    let d = p5.Vector.dist(nextPt, this.lastPt);

    while (d > this.spacing) {
      const diff = p5.Vector.sub(nextPt, this.lastPt);
      diff.normalize();
      diff.mult(this.spacing)
      this.pts.push(p5.Vector.add(this.lastPt, diff));
      d -= this.spacing;
      let distance = calcDistance([x, funcPoints[x]], [x, y]);
      
      if (distance > 150) {
        this.hue = 255;
      } else {
        this.hue = (distance * 1.5) % 255; // for each new point, update the hue
      }
      this.hues.push(this.hue);
    }
  }

  display() {
    noStroke()
    for (let i = 0; i < this.pts.length; i++) {
      const p = this.pts[i];
      colorMode(RGB);
      fill(this.hues[i], 136, 86);
      ellipse(p.x, p.y, this.size, this.size);
    }
  }
}