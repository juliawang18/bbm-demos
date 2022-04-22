class FunctionPlayer {
    constructor(x, y, ang, midVal, sensitivity) {
        this.x = x;
        this.y = y;
        this.ang = ang;
        this.path = [];
        this.correctPoints = {};
        this.tally = [];
        this.midVal = midVal;
        this.sensitivity = sensitivity;
    }
}