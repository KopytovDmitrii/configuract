import { effect, stop, ReactiveEffect } from './reactive';
import { scheduler } from './scheduler';
import { EffectOptions } from './types';

/**
 * Вспомогательная функция для запуска эффекта
 */
function runEffect(effect: ReactiveEffect): any {
  if (!effect.active) {
    return effect.fn();
  }
  return effect.fn();
}

/**
 * Интерфейс для computed свойства
 */
export interface ComputedRef<T = any> {
  readonly value: T;
  readonly dirty: boolean;
  readonly effect: ReactiveEffect;
}

/**
 * Опции для computed свойства
 */
export interface ComputedOptions {
  /** Функция для получения значения */
  get: () => any;
  /** Функция для установки значения (опционально) */
  set?: (value: any) => void;
  /** Включить отладку */
  debug?: boolean;
}

/**
 * Внутренняя реализация computed свойства
 */
class ComputedRefImpl<T> implements ComputedRef<T> {
  private _value!: T;
  private _dirty = true;
  private _effect: ReactiveEffect;
  private _setter?: (value: any) => void;

  constructor(getter: () => T, setter?: (value: any) => void) {
    this._setter = setter;
    
    // Создаем эффект который будет отслеживать зависимости
    this._effect = effect(() => getter(), {
      lazy: true,
      scheduler: () => {
        // Когда зависимости изменяются, помечаем как "грязное"
        if (!this._dirty) {
          this._dirty = true;
          // Уведомляем о изменении computed свойства
          this.triggerUpdate();
        }
      }
    });
  }

  get value(): T {
    // Если значение "грязное", пересчитываем его
    if (this._dirty) {
      this._value = runEffect(this._effect);
      this._dirty = false;
    }
    return this._value;
  }

  set value(newValue: T) {
    if (this._setter) {
      this._setter(newValue);
    } else {
      console.warn('Computed свойство доступно только для чтения');
    }
  }

  get dirty(): boolean {
    return this._dirty;
  }

  get effect(): ReactiveEffect {
    return this._effect;
  }

  /**
   * Принудительное обновление computed свойства
   */
  invalidate(): void {
    this._dirty = true;
    this.triggerUpdate();
  }

  /**
   * Уведомление об изменении computed свойства
   */
  private triggerUpdate(): void {
    scheduler.scheduleUpdate(() => {
      // Обновление будет обработано планировщиком
    });
  }

  /**
   * Остановка отслеживания зависимостей
   */
  stop(): void {
    stop(this._effect);
  }
}

/**
 * Создание computed свойства с функцией-геттером
 */
export function computed<T>(getter: () => T): ComputedRef<T>;

/**
 * Создание computed свойства с геттером и сеттером
 */
export function computed<T>(options: ComputedOptions): ComputedRef<T>;

/**
 * Реализация функции computed
 */
export function computed<T>(getterOrOptions: (() => T) | ComputedOptions): ComputedRef<T> {
  let getter: () => T;
  let setter: ((value: T) => void) | undefined;

  if (typeof getterOrOptions === 'function') {
    getter = getterOrOptions;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter);
}

/**
 * Проверка является ли объект computed свойством
 */
export function isComputedRef(r: any): r is ComputedRef {
  return !!(r && r._effect && typeof r.value !== 'undefined');
}

/**
 * Менеджер для управления computed свойствами
 */
export class ComputedManager {
  private computedRefs = new Set<ComputedRefImpl<any>>();

  /**
   * Регистрация computed свойства для управления
   */
  register(computedRef: ComputedRefImpl<any>): void {
    this.computedRefs.add(computedRef);
  }

  /**
   * Удаление computed свойства из управления
   */
  unregister(computedRef: ComputedRefImpl<any>): void {
    this.computedRefs.delete(computedRef);
    computedRef.stop();
  }

  /**
   * Принудительная валидация всех computed свойств
   */
  invalidateAll(): void {
    for (const computedRef of this.computedRefs) {
      computedRef.invalidate();
    }
  }

  /**
   * Получение статистики computed свойств
   */
  getStats(): { total: number; dirty: number; clean: number } {
    let dirty = 0;
    let clean = 0;
    
    for (const computedRef of this.computedRefs) {
      if (computedRef.dirty) {
        dirty++;
      } else {
        clean++;
      }
    }

    return {
      total: this.computedRefs.size,
      dirty,
      clean
    };
  }

  /**
   * Очистка всех computed свойств
   */
  cleanup(): void {
    for (const computedRef of this.computedRefs) {
      computedRef.stop();
    }
    this.computedRefs.clear();
  }
}

/**
 * Глобальный экземпляр менеджера computed свойств
 */
export const computedManager = new ComputedManager();

/**
 * Хелпер для создания computed свойства внутри компонента
 */
export function useComputed<T>(getter: () => T, deps?: any[]): ComputedRef<T> {
  const computedRef = computed(getter);
  computedManager.register(computedRef as ComputedRefImpl<T>);
  return computedRef;
}

/**
 * Хелпер для создания вычисляемого свойства с кешированием на основе зависимостей
 */
export function memo<T>(fn: () => T, deps: any[]): () => T {
  let cachedValue: T;
  let cachedDeps: any[] = [];
  let isInitialized = false;

  return () => {
    const hasChanged = !isInitialized || deps.some((dep, index) => dep !== cachedDeps[index]);
    
    if (hasChanged) {
      cachedValue = fn();
      cachedDeps = [...deps];
      isInitialized = true;
    }
    
    return cachedValue;
  };
}

/**
 * Создание computed свойства для компонента с автоматической очисткой
 */
export function createComponentComputed<T>(
  getter: () => T,
  onDestroy?: () => void
): ComputedRef<T> & { destroy: () => void } {
  const computedRef = computed(getter) as ComputedRefImpl<T>;
  computedManager.register(computedRef);

  return {
    get value() { return computedRef.value; },
    get dirty() { return computedRef.dirty; },
    get effect() { return computedRef.effect; },
    
    destroy() {
      computedManager.unregister(computedRef);
      if (onDestroy) {
        onDestroy();
      }
    }
  };
}