type TaskCallback = () => void;

interface Task {
  id: string;
  callback: TaskCallback;
  priority: number; //数字越小优先级越高
  remaining: number; //剩余执行次数-1表示无限
  interval: number; //执行间隔ms
  lastRun: number;
  createdAt: number;
}

class TaskScheduler {
  private tasks: Map<string, Task> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private readonly defaultTaskInterval: number = 5000; //任务间隔
  private checkInterval: number = 250; //检查间隔


  addTask(
      callback: TaskCallback,
      priority: number = 0,
      maxExecutions: number = -1,
      intervalMs?: number,
  ): string {
    const id = this.generateId();
    const now = Date.now();
    const task: Task = {
      id,
      callback,
      priority,
      remaining: maxExecutions === -1 ? -1 : maxExecutions,
      interval: intervalMs ?? this.defaultTaskInterval,
      lastRun: now,
      createdAt: now,
    };
    this.tasks.set(id, task);
    return id;
  }

  cancelTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  getTasks(): Task[] {
    return Array.from(this.tasks.values()).sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.createdAt - b.createdAt;
    });
  }

  start(intervalMs: number = this.checkInterval): void {
    if (this.intervalId !== null) return;
    this.checkInterval = intervalMs;
    this.intervalId = setInterval(() => this.runTasks(), this.checkInterval);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  runOnce(): void {
    this.runTasks();
  }

  private runTasks(): void {
    const now = Date.now();
    const dueTasks: Task[] = [];
    for (const task of this.tasks.values())
      if (now - task.lastRun >= task.interval)
        dueTasks.push(task);
    dueTasks.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.createdAt - b.createdAt;
    });
    for (const task of dueTasks) {
      if (!this.tasks.has(task.id)) continue;
      try {
        task.callback();
        task.lastRun = Date.now();
        if (task.remaining > 0) {
          task.remaining--;
          if (task.remaining === 0)
            this.tasks.delete(task.id);
        }
      } catch (error) {
        console.error(`任务 ${task.id} 执行出错:`, error);
        task.lastRun = Date.now();
      }
    }
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const scheduler = new TaskScheduler();