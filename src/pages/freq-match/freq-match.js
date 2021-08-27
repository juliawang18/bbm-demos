// CONSTANTS TO CHANGE //
let portName = "/dev/tty.usbmodem142101";
let SPEED = 3;
let SENSITIVITY = 3;
let BRUSH_SIZE = 20;
let GOAL_FREQ = 5;
let SLOPE_BASED = false;

// DO NOT TOUCH BELOW //
let serial;
let latestData = "waiting for data";  // you'll use this to write incoming data to the canvas
let funcPoints = {};
let offsets = [];
let startDraw = false;
let drawGrid = false;
let isPositive;
let FREQ = 0;
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
    button.style('background-color', "#0055FF");
    button.style('border-radius', "50px");
    button.style('border', "none");
    button.style('color', "white");
    button.style('width', "100px");
    button.style('margin', "auto");
    button.style('margin-top', "30px");
    button.style('padding', "20px");
    button.style('cursor', "pointer");
    button.style('text-align', "center");
    button.style('font-size', "16px");
    button.style('font-family', "'Comfortaa', cursive");

    // initialize point data
    y = height / 2;
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
            ang = incomingAngle + 270;
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
            background("#272433");
            drawingGrid();
            drawGrid = false;
        }

        if (ang != undefined) {
            drawHeader(y);
            colorMode(HSB);
            path.addPoint(x, y);
            path.display();
        }

        if (y > 300) {
            if (!isPositive) {
                FREQ += 1;
                isPositive = true;
            }
        }

        if (y < 300) {
            if (isPositive) {
                FREQ += 1;
                isPositive = false;
            }
        }

        if (x > 1000) {
            showResults(FREQ/2);
            noLoop();
        }

        if (SLOPE_BASED) {
            rad = (ang / 180) * PI; // slope mapping
            y = y + SPEED * cos(rad) / sin(rad) * SENSITIVITY;
            x = x + SPEED;
        } else {
            y = - (ang - 90) * SENSITIVITY + 300; // ang mapping
            x = x + SPEED;
        }
    }

}

function reset() {
    background("#272433");

    colorMode(HSB, 360, 100, 100);
    path = new Path();

    // initialize point data
    y = height / 2;
    x = 0;

    COUNT = 0;
    frameCount = 0;
    funcPoints = [];
    startDraw = false;
    drawGrid = false;
    loop();
}

function showResults(count) {
    clear();
    background("#272433");
    drawingGrid();
    background('rgba(0,0,0, 0.7)');

    colorMode(HSB);
    path.display();

    fill("white");
    textAlign(CENTER);
    textSize(100);
    text(count, width / 2, 100);
    textSize(20);
    text("CYCLES PER SCREEN!", width / 2, 140);
}

function drawingCount(num) {
    clear();
    background("#272433");
    drawingGrid();
    background('rgba(0,0,0, 0.7)');
    textAlign(CENTER);
    textSize(100);
    text(num, width / 2, height / 2);
}

function drawingGrid() {
    colorMode(RGB);
    stroke(255, 50);
    strokeWeight(2);
    for (let i = 100; i < width; i += 100) {
        line(i, 0, i, height);
    }
    for (let j = 100; j < height; j += 100) {
        line(0, j, width, j);
    }

    stroke(255);
    strokeWeight(2);
    line(0, 300, width, 300);

    noStroke();
    fill('white');
    textSize(20);
    textAlign(LEFT);
    for (let i = 100; i < width; i += 200) {
        text(i / 100 - 5, i, height / 2 + 20);
    }
    for (let j = 100; j < height; j += 400) {
        text(-j / 100 + 3, width / 2, j);
    }
}

function drawHeader(y) {
    fill("#272433");
    noStroke();
    rect(0, 0, 1000, 60);

    noStroke();
    fill('white');
    textSize(20);
    textAlign(CENTER);
    text("CURR FREQ: " + FREQ / 2 + "cycles/sec", 350, 37);
    text("GOAL FREQ: " + GOAL_FREQ + "cycles/sec", 650, 37);
}

class Path {
    constructor() {
        this.pts = [];
        this.size = BRUSH_SIZE; // size of brush
        this.spacing = 1; // spacing between points; lower value gives you smoother path, but frame rate will drop
        this.hue = random(360); // start value
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
            this.hue = (this.hue + 1) % 360; // for each new point, update the hue
            this.hues.push(this.hue);
        }
    }

    display() {
        noStroke()
        for (let i = 0; i < this.pts.length; i++) {
            const p = this.pts[i];
            fill(this.hues[i], 100, 100);
            ellipse(p.x, p.y, this.size, this.size);
        }
    }
}