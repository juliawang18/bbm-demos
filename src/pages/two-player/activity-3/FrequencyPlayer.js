class FrequencyPlayer {
    constructor(x, y, ang, midVal, sensitivity, goalPeriodLength) {
        this.x = x;
        this.y = y;
        this.ang = ang;
        this.midVal = midVal;
        this.sensitivity = sensitivity;

        this.path = [];

        this.currState = "null";
        this.currPeriod = [0];
        this.periods = [];
        this.isPositive = false;
        this.goalPeriodLength = goalPeriodLength;
        
    }
}