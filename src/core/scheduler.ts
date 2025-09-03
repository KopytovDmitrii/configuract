import { ReactiveEffect } from './types';

/**
 * Очередь обновлений для предотвращения избыточных рендеров
 */
class UpdateScheduler {
  private updateQueue = new Set<Function>();
  private isFlushPending = false;
  private isFlushActive = false;
  private currentFlushPromise: Promise<void> | null = null;
  
  /**
   * Планирование выполнения эффекта
   */
  schedule(effect: ReactiveEffect | Function): void {
    const fn = typeof effect === 'function' ? effect : effect.fn;
    
    // Добавляем в очередь
    this.updateQueue.add(fn);
    
    // Запускаем flush если еще не запущен
    if (!this.isFlushPending && !this.isFlushActive) {
      this.isFlushPending = true;
      this.currentFlushPromise = this.scheduleFlush();
    }
  }
  
  /**
   * Планирование обновления (алиас для schedule)
   */
  scheduleUpdate(fn: Function): void {
    this.schedule(fn);
  }
  
  /**
   * Планирование выполнения flush через requestAnimationFrame
   */
  private scheduleFlush(): Promise<void> {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        this.flushUpdates();
        resolve();
      });
    });
  }
  
  /**
   * Выполнение всех запланированных обновлений
   */
  private flushUpdates(): void {
    if (this.isFlushActive) {
      return;
    }
    
    this.isFlushActive = true;
    this.isFlushPending = false;
    
    try {
      // Получаем копию очереди и очищаем оригинал
      const effects = Array.from(this.updateQueue);
      this.updateQueue.clear();
      
      // Выполняем все обновления в одном батче
      for (const effect of effects) {
        try {
          effect();
        } catch (error) {
          console.error('Ошибка при выполнении запланированного эффекта:', error);
          // Продолжаем выполнение остальных эффектов
        }
      }
      
      // Если во время выполнения появились новые эффекты, планируем следующий flush
      if (this.updateQueue.size > 0 && !this.isFlushPending) {
        this.isFlushPending = true;
        this.currentFlushPromise = this.scheduleFlush();
      }
    } finally {
      this.isFlushActive = false;
      if (this.updateQueue.size === 0) {
        this.currentFlushPromise = null;
      }
    }
  }
  
  /**
   * Ожидание завершения всех запланированных обновлений
   */
  async nextTick(): Promise<void> {
    if (this.currentFlushPromise) {
      await this.currentFlushPromise;
    }
    
    // Если после ожидания снова появились задачи, ждем их тоже
    if (this.currentFlushPromise) {
      await this.nextTick();
    }
  }
  
  /**
   * Немедленное выполнение всех запланированных обновлений
   */
  flushSync(): void {
    if (this.updateQueue.size > 0) {
      this.flushUpdates();
    }
  }
  
  /**
   * Очистка планировщика
   */
  clear(): void {
    this.updateQueue.clear();
    this.isFlushPending = false;
    this.isFlushActive = false;
    this.currentFlushPromise = null;
  }
  
  /**
   * Получение размера очереди (для отладки)
   */
  getQueueSize(): number {
    return this.updateQueue.size;
  }
  
  /**
   * Проверка активности планировщика
   */
  isActive(): boolean {
    return this.isFlushActive || this.isFlushPending;
  }
}

/**
 * Глобальный экземпляр планировщика
 */
export const scheduler = new UpdateScheduler();

/**
 * Удобные функции для работы с планировщиком
 */

/**
 * Планирование выполнения функции в следующем кадре
 */
export function nextTick(): Promise<void>;
export function nextTick(callback: () => void): void;
export function nextTick(callback?: () => void): Promise<void> | void {
  if (callback) {
    scheduler.nextTick().then(callback);
  } else {
    return scheduler.nextTick();
  }
}

/**
 * Немедленное выполнение всех запланированных обновлений
 */
export function flushSync(): void {
  scheduler.flushSync();
}

/**
 * Планирование выполнения функции
 */
export function scheduleUpdate(fn: Function): void {
  scheduler.schedule(fn);
}

/**
 * Создание планировщика с приоритетами
 */
export class PriorityScheduler {
  private highPriorityQueue: Function[] = [];
  private normalPriorityQueue: Function[] = [];
  private lowPriorityQueue: Function[] = [];
  private isFlushPending = false;
  
  /**
   * Планирование с приоритетом
   */
  schedule(fn: Function, priority: 'high' | 'normal' | 'low' = 'normal'): void {
    switch (priority) {
      case 'high':
        this.highPriorityQueue.push(fn);
        break;
      case 'low':
        this.lowPriorityQueue.push(fn);
        break;
      default:
        this.normalPriorityQueue.push(fn);
    }
    
    if (!this.isFlushPending) {
      this.isFlushPending = true;
      requestAnimationFrame(() => this.flush());
    }
  }
  
  /**
   * Выполнение очередей по приоритету
   */
  private flush(): void {
    this.isFlushPending = false;
    
    // Сначала выполняем высокий приоритет
    this.executeQueue(this.highPriorityQueue);
    
    // Затем обычный приоритет  
    this.executeQueue(this.normalPriorityQueue);
    
    // В конце низкий приоритет (с ограничением времени)
    this.executeQueueWithTimeSlicing(this.lowPriorityQueue);
  }
  
  /**
   * Выполнение очереди
   */
  private executeQueue(queue: Function[]): void {
    while (queue.length > 0) {
      const fn = queue.shift()!;
      try {
        fn();
      } catch (error) {
        console.error('Ошибка при выполнении задачи:', error);
      }
    }
  }
  
  /**
   * Выполнение очереди с ограничением времени
   */
  private executeQueueWithTimeSlicing(queue: Function[]): void {
    const startTime = performance.now();
    const timeSlice = 5; // 5мс на выполнение низкоприоритетных задач
    
    while (queue.length > 0 && (performance.now() - startTime) < timeSlice) {
      const fn = queue.shift()!;
      try {
        fn();
      } catch (error) {
        console.error('Ошибка при выполнении задачи:', error);
      }
    }
    
    // Если остались задачи, планируем их на следующий кадр
    if (queue.length > 0 && !this.isFlushPending) {
      this.isFlushPending = true;
      requestAnimationFrame(() => this.flush());
    }
  }
}