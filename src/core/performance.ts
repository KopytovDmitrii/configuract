/**
 * Модуль оптимизации производительности JS фреймворка
 */

/**
 * Кеш для мемоизированных функций
 */
const memoCache = new Map();

/**
 * Мемоизация функций для улучшения производительности
 */
export function memoize<T extends (...args: any[]) => any>(fn: T, keyGenerator?: (...args: Parameters<T>) => string): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Ограничиваем размер кеша
    if (cache.size > 1000) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
}

/**
 * Debounce функция для ограничения частоты вызовов
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle функция для ограничения частоты вызовов
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Оптимизатор рендеринга компонентов
 */
export class ComponentOptimizer {
  private static instance: ComponentOptimizer;
  private renderCache = new Map<string, any>();
  private performanceMetrics = new Map<string, number[]>();
  
  static getInstance(): ComponentOptimizer {
    if (!ComponentOptimizer.instance) {
      ComponentOptimizer.instance = new ComponentOptimizer();
    }
    return ComponentOptimizer.instance;
  }
  
  /**
   * Кеширование результатов рендеринга
   */
  cacheRender(componentId: string, props: any, result: any): void {
    const key = this.generateCacheKey(componentId, props);
    this.renderCache.set(key, {
      result,
      timestamp: Date.now()
    });
    
    // Очистка старого кеша
    this.cleanupCache();
  }
  
  /**
   * Получение кешированного результата
   */
  getCachedRender(componentId: string, props: any): any {
    const key = this.generateCacheKey(componentId, props);
    const cached = this.renderCache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < 5000) { // 5 секунд TTL
      return cached.result;
    }
    
    return null;
  }
  
  /**
   * Измерение производительности рендеринга
   */
  measureRenderTime(componentName: string, renderFn: () => any): any {
    const start = performance.now();
    const result = renderFn();
    const end = performance.now();
    
    this.recordMetric(componentName, end - start);
    
    return result;
  }
  
  /**
   * Получение метрик производительности
   */
  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: any = {};
    
    for (const [component, times] of this.performanceMetrics) {
      result[component] = {
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        count: times.length
      };
    }
    
    return result;
  }
  
  private generateCacheKey(componentId: string, props: any): string {
    return `${componentId}:${JSON.stringify(props)}`;
  }
  
  private recordMetric(componentName: string, time: number): void {
    if (!this.performanceMetrics.has(componentName)) {
      this.performanceMetrics.set(componentName, []);
    }
    
    const times = this.performanceMetrics.get(componentName)!;
    times.push(time);
    
    // Ограничиваем количество записей
    if (times.length > 100) {
      times.shift();
    }
  }
  
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.renderCache) {
      if (now - cached.timestamp > 10000) { // 10 секунд
        this.renderCache.delete(key);
      }
    }
  }
}

/**
 * Оптимизация DOM операций
 */
export class DOMOptimizer {
  private static batchedUpdates: (() => void)[] = [];
  private static isScheduled = false;
  
  /**
   * Батчинг DOM обновлений
   */
  static batchUpdate(updateFn: () => void): void {
    this.batchedUpdates.push(updateFn);
    
    if (!this.isScheduled) {
      this.isScheduled = true;
      requestAnimationFrame(() => {
        this.flushUpdates();
      });
    }
  }
  
  /**
   * Выполнение всех накопленных обновлений
   */
  private static flushUpdates(): void {
    const updates = [...this.batchedUpdates];
    this.batchedUpdates.length = 0;
    this.isScheduled = false;
    
    updates.forEach(update => {
      try {
        update();
      } catch (error) {
        console.error('Ошибка в батчированном обновлении:', error);
      }
    });
  }
  
  /**
   * Виртуализация списков для больших наборов данных
   */
  static createVirtualList(items: any[], itemHeight: number, containerHeight: number) {
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // +2 для буфера
    let scrollTop = 0;
    
    return {
      getVisibleItems() {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleCount, items.length);
        
        return {
          items: items.slice(startIndex, endIndex),
          startIndex,
          endIndex,
          totalHeight: items.length * itemHeight,
          offsetY: startIndex * itemHeight
        };
      },
      
      updateScrollTop(newScrollTop: number) {
        scrollTop = newScrollTop;
      }
    };
  }
}

/**
 * Менеджер памяти для предотвращения утечек
 */
export class MemoryManager {
  private static cleanupFunctions: (() => void)[] = [];
  
  /**
   * Регистрация функции очистки
   */
  static registerCleanup(cleanupFn: () => void): void {
    this.cleanupFunctions.push(cleanupFn);
  }
  
  /**
   * Выполнение всех функций очистки
   */
  static cleanup(): void {
    this.cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Ошибка при очистке памяти:', error);
      }
    });
    this.cleanupFunctions.length = 0;
  }
  
  /**
   * Мониторинг использования памяти
   */
  static getMemoryUsage(): any {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }
  
  /**
   * Принудительная сборка мусора (если доступна)
   */
  static forceGC(): void {
    if ('gc' in window) {
      (window as any).gc();
    }
  }
}

/**
 * Анализатор производительности
 */
export class PerformanceAnalyzer {
  private static metrics = new Map<string, number[]>();
  
  /**
   * Измерение времени выполнения
   */
  static measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.recordTime(name, end - start);
    
    return result;
  }
  
  /**
   * Запись времени выполнения
   */
  static recordTime(name: string, time: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const times = this.metrics.get(name)!;
    times.push(time);
    
    // Ограничиваем размер массива
    if (times.length > 1000) {
      times.shift();
    }
  }
  
  /**
   * Получение отчета о производительности
   */
  static getReport(): Record<string, any> {
    const report: any = {};
    
    for (const [name, times] of this.metrics) {
      const sorted = [...times].sort((a, b) => a - b);
      
      report[name] = {
        count: times.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: times.reduce((sum, time) => sum + time, 0) / times.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      };
    }
    
    return report;
  }
  
  /**
   * Очистка метрик
   */
  static clearMetrics(): void {
    this.metrics.clear();
  }
}

/**
 * Экспорт всех оптимизаций
 */
export default {
  memoize,
  debounce,
  throttle,
  ComponentOptimizer,
  DOMOptimizer,
  MemoryManager,
  PerformanceAnalyzer
};