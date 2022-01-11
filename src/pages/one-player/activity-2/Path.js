function calcDistanceFromAmp(x, y, midVal, ampA, ampB) {
    if (y < midVal) {
      return dist(x, y, x, ampA);
    }
    return dist(x, y, x, ampB);
}

class Path {
    constructor(brushSize, mid, ampA, ampB) {
        this.pts = [];
        this.userPts = {};
        this.offsets = [];
        this.size = brushSize; // size of brush
        this.spacing = 0.3; // spacing between points; lower value gives you smoother path, but frame rate will drop
        this.hue = 150; // start value
        this.hues = []; // keep track of the hues for each point
        this.midVal = mid;
        this.ampAbove = ampA;
        this.ampBelow = ampB;
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

            let distance = calcDistanceFromAmp(x, y, this.midVal, this.ampAbove, this.ampBelow);

            if (distance > 50) {
                this.hue = 0;
            } else {
                this.hue = 100 - (distance * 2);
            }

            this.hues.push(this.hue);
        }
    }
  
    display() {
        noStroke()
        for (let i = 0; i < this.pts.length; i++) {
            const p = this.pts[i];
            fill(155, this.hues[i], 85);
            ellipse(p.x, p.y, this.size, this.size);
        }
    }
  }