class Path {
    constructor(brushSize) {
        this.pts = [];
        this.size = brushSize; // size of brush
        this.spacing = 1;
    }
  
    lastPt() {
        return this.pts[this.pts.length - 1];
    }
  
    addPoint(x, y) {
        if (this.pts.length < 1) {
            this.pts.push(new p5.Vector(x, y));
            return;
        }

        const nextPt = new p5.Vector(x, y);
        let d = p5.Vector.dist(nextPt, this.lastPt());

        while (d > this.spacing) {
            const diff = p5.Vector.sub(nextPt, this.lastPt());
            diff.normalize();
            diff.mult(this.spacing)
            this.pts.push(p5.Vector.add(this.lastPt(), diff));
            d -= this.spacing;
        }
    }
  
    display() {
        noStroke()
        for (let i = 0; i < this.pts.length; i++) {
            const p = this.pts[i];
            fill(255);
            ellipse(p.x, p.y, this.size, this.size);
        }
    }
  }