class AmplitudePlayer {
    constructor(x, y, ang, midVal, sensitivity, goalAmp, gridIncrement) {
        this.x = x;
        this.y = y;
        this.ang = ang;
        this.midVal = midVal;
        this.sensitivity = sensitivity;

        this.path = [];

        this.goalAmp = goalAmp;
        this.ampCount = 0;
        this.reachedAmp = false;
        this.exitTop = false;
        this.allowGreen = true;

        this.ampAbove = midVal - (goalAmp * gridIncrement);
        this.ampBelow = midVal + (goalAmp * gridIncrement);
    }
}