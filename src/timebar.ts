import { gameConfig } from "./data.ts";

type OnCycleComplete = () => void;
export class ProgressBar {
    private readonly container: HTMLElement;
    private segments: HTMLElement[] = [];
    private readonly totalCycleSeconds: number;
    private readonly segmentSeconds: number;
    private readonly onCycleComplete?: OnCycleComplete;
    private completedSegments: number = 0;
    private accumulatedTime: number = 0;

    constructor(totalSeconds: number = gameConfig.DAY_SECOND, segmentCount: number = 5,onComplete?:OnCycleComplete) {
        this.totalCycleSeconds = totalSeconds;
        this.segmentSeconds = totalSeconds / segmentCount;
        this.onCycleComplete = onComplete;
        this.container = document.querySelector('.progress-bar-container')!;
        this.container.innerHTML = '';
        for (let i = 0; i < segmentCount; i++) {
            const seg = document.createElement('div');
            seg.className = 'progress-segment';
            this.container.appendChild(seg);
            this.segments.push(seg);
        }
        this.reset();
    }

    private reset(): void {
        this.completedSegments = 0;
        this.segments.forEach(seg => seg.classList.remove('active'));
    }

    public update(deltaSeconds: number): void {
        if (deltaSeconds <= 0) return;
        this.accumulatedTime += deltaSeconds;
        let newActiveCount = Math.floor(this.accumulatedTime / this.segmentSeconds)+1;
        if (this.accumulatedTime >= this.totalCycleSeconds) {
            this.accumulatedTime -= this.totalCycleSeconds;
            if (this.onCycleComplete)   this.onCycleComplete();
        }
        const maxSegments = this.segments.length;
        if (newActiveCount > maxSegments)   newActiveCount = maxSegments;
        if (newActiveCount !== this.completedSegments) {
            this.completedSegments = newActiveCount;
            this.applyActiveState();
        }
    }
    private applyActiveState(): void {
        this.segments.forEach((seg, idx) => {
            if (idx < this.completedSegments)
                seg.classList.add('active');
             else
                seg.classList.remove('active');
        });
    }
}