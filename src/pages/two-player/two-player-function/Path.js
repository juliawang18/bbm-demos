function calcDistance(correctPoint, userPoint) {
    return dist(userPoint[0], userPoint[1], correctPoint[0], correctPoint[1]);
}

class Path {
    constructor(funcPoints, tolerance, brushSize, start) {
        this.pts = [];
        this.userPts = {};
        this.offsets = [];
        this.size = brushSize; // size of brush
        this.spacing = 0.3; // spacing between points; lower value gives you smoother path, but frame rate will drop
        this.hue = 150; // start value
        this.hues = []; // keep track of the hues for each point
        this.tolerance = tolerance;
        this.funcPoints = funcPoints;
        this.startPos = start;
        this.volume = 1;
    }
  
    get lastPt() {
        return this.pts[this.pts.length - 1];
    }

    offsetList() {
        return this.offsets;
    }
  
    addPoint(x, y) {
        if (this.pts.length < 1) {
            this.pts.push(new p5.Vector(x, y));
            this.hues.push(this.hue);
            this.userPts[x] = y;
            return;
        }
    
        this.userPts[x] = y;
    
        let distance = calcDistance([x, this.funcPoints[x]], [x, y]);
        if (x > startPos)  {
            if (distance < this.tolerance) {
                this.offsets.push(1);
            } else {
                this.offsets.push(0);
            }
        }
    
        const nextPt = new p5.Vector(x, y);
        let d = p5.Vector.dist(nextPt, this.lastPt);
    
        while (d > this.spacing) {
            const diff = p5.Vector.sub(nextPt, this.lastPt);
            diff.normalize();
            diff.mult(this.spacing)
            this.pts.push(p5.Vector.add(this.lastPt, diff));
            d -= this.spacing;
            let distance = calcDistance([x, this.funcPoints[x]], [x, y]);
    
            if (distance > 110) {
                this.hue = 0;
                this.volume = 0;
            } else {
                this.hue = 110 - distance; // for each new point, update the hue
                this.volume = 1 - map(distance, 0, 110, 0, 1);
            }
            this.hues.push(this.hue);
        }
    }
  
    display() {
        noStroke();
        colorMode(HSB);
        for (let i = 0; i < this.pts.length; i++) {
            const p = this.pts[i];
            fill(this.hues[i], 100, 100);
            ellipse(p.x, p.y, this.size, this.size);
        }
    }
  }