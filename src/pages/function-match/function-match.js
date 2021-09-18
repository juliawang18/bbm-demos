// CONSTANTS TO CHANGE //
let portName = "/dev/tty.usbmodem14201";
let SPEED = 5;
let SENSITIVITY = 15;
let BRUSH_SIZE = 20;
let SLOPE_BASED = false;
let TOLERANCE = 40;

// DO NOT TOUCH BELOW //
let serial;
let latestData = "waiting for data";  // you'll use this to write incoming data to the canvas
let funcPoints = {};
let offsets = [];
let startDraw = false;
let drawFunction = false;
let gameScreen = 0;
let path;
let ang;            // Angle
let rad;            // Angle in radians
let x;              // XPos of drawing dot
let y;              // YPos of drawing dot
let goodImg, badImg;
let midVal;

let a = 1;
let k = 1; 
let c = 0; 

function func(x) {
  return a * sin(k * (x + c));
}

function setup() {
  midVal = window.innerHeight / 2;
  createCanvas(window.innerWidth, window.innerHeight);
  background("#11141D");

  colorMode(HSB, 360, 100, 100);
  path = new Path();

  goodImg = loadImage("assets/good1.png");
  badImg = loadImage("assets/notsogood3.png");
  funcImg = loadImage("assets/function.png");
  aAddButton = loadImage("assets/add.png");
  kAddButton = loadImage("assets/add.png");
  cAddButton = loadImage("assets/add.png");
  aSubButton = loadImage("assets/sub.png");
  kSubButton = loadImage("assets/sub.png");
  cSubButton = loadImage("assets/sub.png");

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
    ang = -float(incomingAngle) + 90;
  } else {
    if (incomingAngle > 0) {
      ang = incomingAngle - 90;
    } else {
      ang = 270 + incomingAngle;
    }
  }
}

function draw() {

  if (gameScreen == 0) {
    initGame();

  } else if (gameScreen == 1) {
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
      drawFunction = true;
    }

    if (startDraw) {
      if (drawFunction == true) {
        background("#11141D");
        for (let i = 0; i < width; i += SPEED) {
          let xPoint = i;
          let yPoint = func(i / 100) * 100 + (height / 2);

          colorMode(RGB);
          stroke(255, 255, 255, 150);
          strokeWeight(10);
          point(xPoint, yPoint);

          funcPoints[xPoint] = yPoint;
        }
        colorMode(HSB);
        drawFunction = false;
      }

      if (ang != undefined) {
        path.addPoint(x, y);
        path.display();
      }

      if (x > window.innerWidth) {
        clear();
        frameCount = 0;
        noLoop();

        let sum = 0;
        for (let i = 0; i < offsets.length; i += 1) {
          if (offsets[i] > 0) {
            sum += offsets[i];
          }
        }

        if ((sum / offsets.length) * 100 > 60) {
          drawHappyEnding((sum / offsets.length) * 100);
        } else {
          drawSadEnding((sum / offsets.length) * 100);
        }
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

}

function drawingFunction() {
  colorMode(RGB);
  for (let i = 0; i < width; i += SPEED) {
    let xPoint = i;
    let yPoint = func(i / 100) * 100 + (height / 2);

    stroke(255, 255, 255, 150);
    strokeWeight(10);
    point(xPoint, yPoint);

    funcPoints[xPoint] = yPoint;
  }
  noStroke();
}

function drawingFunctionNoPoint() {
  colorMode(RGB);
  for (let i = 0; i < width; i += SPEED) {
    let xPoint = i;
    let yPoint = func(i / 100) * 100 + (height / 2);

    stroke(255, 255, 255, 150);
    strokeWeight(10);
    point(xPoint, yPoint);
  }
  noStroke();
}

function drawingCount(num) {
  clear();
  background("#11141D");
  drawingFunction();
  background('rgba(0,0,0, 0.3)');
  textAlign(CENTER);
  textSize(100);
  text(num, width / 2, height / 2);
}

// function drawFunction() {
//   textAlign(CENTER);
//   textSize(100);
//   text(str(a) + "sin(" + str(k) + (x + c)), width / 2, height / 2);
// }

function mousePressed() {
  if (gameScreen == 0) {
    startGame();
  }
}

function startGame() {
  gameScreen = 1;
  frameCount = 0;
}

function initGame() {
  background("#11141D");
  background('rgba(0,0,0, 0.2)');
  drawingFunction();
  textAlign(CENTER);
  textSize(30);
  fill(255);
  text("Figure out how to draw green the whole time!", width / 2, height / 2 - 100);
  // imageMode(CENTER);
  // image(funcImg, window.innerWidth / 2, window.innerHeight / 2, window.innerWidth * 0.4, window.innerHeight * 0.1);
  // textSize(40);
  // text(str(a), window.innerWidth * 0.325, window.innerHeight / 2 + 15);
  // text(str(k), window.innerWidth * 0.49, window.innerHeight / 2 + 15);
  // text(str(c), window.innerWidth * 0.64, window.innerHeight / 2 + 15);
  textSize(20);
  text("(click anywhere to start)", width / 2, height / 2 + 150);
  // createButtons();
}

function reset() {
  background("#11141D");

  path = new Path();

  // initialize point data  
  y = height / 2;
  x = 0;

  COUNT = 0;
  frameCount = 0;
  funcPoints = {};
  offsets = [];
  startDraw = false;
  drawFunction = false; 
  loop();
}

function drawHappyEnding(sum) {
  background("#07A87C");
  drawingFunctionNoPoint();
  path.display();

  noStroke();
  fill('white');
  textSize(20);
  textAlign(CENTER);
  text("WOOO", width / 2, height / 2 - 150);
  text("You matched " + round(sum) + "% of the points on the function!", width / 2, height / 2 - 100);

  imageMode(CENTER);
  image(goodImg, window.innerWidth / 2, window.innerHeight - (badImg.height / 4), window.innerWidth * 0.8, window.innerHeight * 0.3);
}

function drawSadEnding(sum) {
  background("#DA7045");
  drawingFunctionNoPoint();
  path.display();

  noStroke();
  fill('white');
  textSize(20);
  textAlign(CENTER);
  text("TRY AGAIN", width / 2, height / 2 - 150);
  text("You matched " + round(sum) + "% of the points on the function.", width / 2, height / 2 - 100);

  imageMode(CENTER);
  image(badImg, window.innerWidth / 2, window.innerHeight - (badImg.height / 4), window.innerWidth * 0.8, window.innerHeight * 0.3);
}

function calcDistance(correctPoint, userPoint) {
  return dist(userPoint[0], userPoint[1], correctPoint[0], correctPoint[1]);
}

function createButtons() {
  image(aAddButton, window.innerWidth * 0.312, window.innerHeight * 0.6, window.innerWidth * 0.025, window.innerHeight * 0.05);
  image(kAddButton, window.innerWidth / 2, window.innerHeight * 0.6, window.innerWidth * 0.025, window.innerHeight * 0.05);
  image(cAddButton, window.innerWidth / 2, window.innerHeight * 0.6, window.innerWidth * 0.025, window.innerHeight * 0.05);
  image(aSubButton, window.innerWidth * 0.33, window.innerHeight * 0.57, window.innerWidth * 0.025, window.innerHeight * 0.05);
  image(kSubButton, window.innerWidth / 2, window.innerHeight * 0.6, window.innerWidth * 0.025, window.innerHeight * 0.05);
  image(cSubButton, window.innerWidth / 2, window.innerHeight * 0.6, window.innerWidth * 0.025, window.innerHeight * 0.05);
  // aAddButton.position(0.72 * window.innerWidth, 0.175 * window.innerHeight).mousePressed(function(){ a+=1;});
  // kAddButton.position(0.78 * window.innerWidth, 0.175 * window.innerHeight).mousePressed(function(){ k+=1;});
  // cAddButton.position(0.72 * window.innerWidth, 0.280 * window.innerHeight).mousePressed(function(){ c+=1;});
  // aSubButton.position(0.78 * window.innerWidth, 0.280 * window.innerHeight).mousePressed(function(){ a-=1; });
  // kSubButton.position(0.72 * window.innerWidth, 0.385 * window.innerHeight).mousePressed(function(){ k-=1; });
  // cSubButton.position(0.72 * window.innerWidth, 0.385 * window.innerHeight).mousePressed(function(){ c-=1; });
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
    if (distance < TOLERANCE) {
      offsets.push(1);
    } else {
      offsets.push(0);
    }

    const nextPt = new p5.Vector(x, y);
    let d = p5.Vector.dist(nextPt, this.lastPt);

    while (d > this.spacing) {
      const diff = p5.Vector.sub(nextPt, this.lastPt);
      diff.normalize();
      diff.mult(this.spacing)
      this.pts.push(p5.Vector.add(this.lastPt, diff));
      d -= this.spacing;
      let distance = calcDistance([x, funcPoints[x]], [x, y]);

      if (distance > 110) {
        this.hue = 0;
      } else {
        this.hue = 110 - distance; // for each new point, update the hue
      }
      this.hues.push(this.hue);
    }
  }

  display() {
    noStroke()
    for (let i = 0; i < this.pts.length; i++) {
      const p = this.pts[i];
      colorMode(HSB);
      fill(this.hues[i], 100, 100);
      ellipse(p.x, p.y, this.size, this.size);
    }
  }
}