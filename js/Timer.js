class Timer {
    constructor() {
        this.startTime = null;
        this.pauseTime = null;
        this.totalPausedTime = 0;
        this.active = false;
        this.paused = false;
    }

    start() {
        if (!this.active) {
            this.startTime = Date.now();
            this.totalPausedTime = 0;
            this.active = true;
            this.paused = false;
        } else if (this.paused) {
            // Resume from paused state
            this.totalPausedTime += (Date.now() - this.pauseTime);
            this.paused = false;
        }
    }

    stop() {
        if (this.active) {
            this.active = false;
            this.paused = false;
            return this.getElapsedTime();
        }
        return 0;
    }

    pause() {
        if (this.active && !this.paused) {
            this.pauseTime = Date.now();
            this.paused = true;
        }
    }

    isActive() {
        return this.active;
    }

    isPaused() {
        return this.paused;
    }

    getElapsedTime() {
        if (!this.active) return 0;
        
        if (this.paused) {
            return this.pauseTime - this.startTime - this.totalPausedTime;
        }
        
        return Date.now() - this.startTime - this.totalPausedTime;
    }
}