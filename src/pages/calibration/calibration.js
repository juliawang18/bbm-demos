// CONSTANTS TO CHANGE //
let portName = "/dev/tty.usbmodem14201";
let SPEED = 2;
let SENSITIVITY = 7;
let BRUSH_SIZE = 20;
let GOAL_FREQ = 6;
let SLOPE_BASED = false;

// DO NOT TOUCH BELOW //
let serial;
let latestData = "waiting for data";  // you'll use this to write incoming data to the canvas
let funcPoints = {};
let startDraw = false;
let drawGrid = false;
let isPositive;
let fromZero = true;
let FREQ = 0;
let goalPeriodLength = window.innerWidth/GOAL_FREQ;
let path;
let ang;            // Angle
let rad;            // Angle in radians
let x;              // XPos of drawing dot
let y;              // YPos of drawing dot
let interval;
let midVal;
let period = [];
let periods = [];

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    background("#ECECEC");
    interval = window.innerWidth/12;
    midVal = floor(floor(window.innerHeight / interval) / 2) * interval + 80;

    colorMode(HSB, 360, 100, 100);
    path = new Path();

    // Instantiate our SerialPort object
    serial = new p5.SerialPort();
    serial.list(); // list ports
    let options = { baudRate: 115200 };
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

    if (SLOPE_BASED) {
        ang = float(incomingAngle) + 90;
    } else {
        if (incomingAngle > 0) {
            ang = incomingAngle - 90;
          } else {
            ang = 270 + incomingAngle;
          }
    }
}

function draw() {
    textSize(50);
    textAlign(CENTER);
    noStroke();
    fill('white');

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
            background("#ECECEC");
            drawingGrid();
            drawGrid = false;
        }

        if (ang != undefined) {
            colorMode(HSB);
            path.addPoint(x, y);
            path.display();
        }

        if (x > window.innerWidth) {
            noLoop();
        }

        if (SLOPE_BASED) {
            rad = (ang / 180) * PI; // slope mapping
            y = y + SPEED * cos(rad) / sin(rad) * SENSITIVITY;
            x = x + SPEED;
        } else {
            y = - (ang - 90) * SENSITIVITY + midVal; // ang mapping
            x = x + SPEED;
        }
    }

}

function reset() {
    background("#ECECEC");

    path = new Path();

    // initialize point data
    y = height / 2;
    x = 0;

    COUNT = 0;
    frameCount = 0;
    funcPoints = [];
    startDraw = false;
    drawGrid = false;
    fromZero = true;
    periods = [];
    period = [];
    loop();
}

function drawingCount(num) {
    clear();
    background("#ECECEC");
    drawingGrid();
    background('rgba(0,0,0, 0.3)');
    textAlign(CENTER);
    textSize(100);
    text(num, width / 2, height / 2);
}

function drawingGrid() {
    colorMode(RGB);
    stroke(150, 50);
    strokeWeight(2);
    for (let i = 0; i < width; i += interval) {
      line(i, 80, i, height);
    }
    for (let j = 80; j < height; j += interval) {
      line(0, j, width, j);
    }
  
    stroke(200);
    strokeWeight(8);
  
    line(0, midVal, width, midVal);
  
    noStroke();
    fill(150);
    textSize(20);
    textAlign(LEFT);
    xVal = 0;
    yVal = 0;
    for (let i = 0; i < width - interval; i += interval*2) {
      text(xVal, i + 5, midVal + 25);
      xVal += 2;
    }
  
}

class Path {
    constructor() {
        this.pts = [];
        this.size = BRUSH_SIZE; // size of brush
        this.spacing = 1; // spacing between points; lower value gives you smoother path, but frame rate will drop
    }

    get lastPt() {
        return this.pts[this.pts.length - 1];
    }

    addPoint(x, y) {
        if (this.pts.length < 1) {
            this.pts.push(new p5.Vector(x, y));
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
        }
    }

    display() {
        noStroke();
        colorMode(RGB);
        for (let i = 0; i < this.pts.length; i++) {
            const p = this.pts[i];
            fill(150);
            ellipse(p.x, p.y, this.size, this.size);
        }
    }
}