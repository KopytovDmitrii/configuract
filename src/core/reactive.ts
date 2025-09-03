import { 
  ReactiveEffect, 
  ReactiveProperty, 
  ReactiveOptions,
  EffectOptions,
  DebuggerEvent 
} from './types';

/**
 * Активный эффект в данный момент
 */
let activeEffect: ReactiveEffect | undefined;

/**
 * Стек активных эффектов
 */
const effectStack: ReactiveEffect[] = [];

/**
 * WeakMap для отслеживания реактивных объектов
 */
const targetMap = new WeakMap<object, Map<string | symbol, ReactiveProperty>>();

/**
 * WeakMap для хранения оригинальных объектов
 */
const reactiveMap = new WeakMap<object, object>();
const originalMap = new WeakMap<object, object>();

/**
 * Создание реактивного Proxy объекта
 */
export function createReactive<T extends object>(
  target: T, 
  options: ReactiveOptions = {}
): T {
  // Проверяем, не является ли объект уже реактивным
  if (reactiveMap.has(target)) {
    return reactiveMap.get(target) as T;
  }

  // Создаем Proxy
  const proxy = new Proxy(target, {
    get(obj: T, prop: string | symbol, receiver: any): any {
      // Отслеживание доступа к свойству
      track(target, prop);
      
      const value = Reflect.get(obj, prop, receiver);
      
      // Рекурсивная реактивность для вложенных объектов
      if (options.deep !== false && typeof value === 'object' && value !== null) {
        return createReactive(value, options);
      }
      
      // Отладочная информация
      if (options.debuggerOptions?.onTrack) {
        options.debuggerOptions.onTrack({
          type: 'get',
          target: obj,
          key: prop,
          newValue: value
        });
      }
      
      return value;
    },
    
    set(obj: T, prop: string | symbol, value: any, receiver: any): boolean {
      const oldValue = (obj as any)[prop];
      const hadKey = Object.prototype.hasOwnProperty.call(obj, prop);
      const result = Reflect.set(obj, prop, value, receiver);
      
      // Уведомление об изменении только если значение действительно изменилось
      if (!hadKey) {
        // Новое свойство
        trigger(target, prop, 'add', value, oldValue);
      } else if (oldValue !== value) {
        // Изменение существующего свойства
        trigger(target, prop, 'set', value, oldValue);
      }
      
      // Отладочная информация
      if (options.debuggerOptions?.onTrigger) {
        options.debuggerOptions.onTrigger({
          type: hadKey ? 'set' : 'add',
          target: obj,
          key: prop,
          newValue: value,
          oldValue
        });
      }
      
      return result;
    },
    
    deleteProperty(obj: T, prop: string | symbol): boolean {
      const hadKey = Object.prototype.hasOwnProperty.call(obj, prop);
      const oldValue = (obj as any)[prop];
      const result = Reflect.deleteProperty(obj, prop);
      
      if (result && hadKey) {
        trigger(target, prop, 'delete', undefined, oldValue);
        
        // Отладочная информация
        if (options.debuggerOptions?.onTrigger) {
          options.debuggerOptions.onTrigger({
            type: 'delete',
            target: obj,
            key: prop,
            oldValue
          });
        }
      }
      
      return result;
    }
  });
  
  // Сохраняем связь между оригиналом и прокси
  reactiveMap.set(target, proxy);
  originalMap.set(proxy, target);
  
  return proxy;
}

/**
 * Отслеживание доступа к свойству
 */
function track(target: object, key: string | symbol): void {
  if (!activeEffect || !shouldTrack) {
    return;
  }
  
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = { key: String(key), effects: new Set() }));
  }
  
  // Добавляем текущий эффект к наблюдателям
  dep.effects.add(activeEffect);
  activeEffect.deps.add(dep);
}

/**
 * Уведомление об изменении свойства
 */
function trigger(
  target: object, 
  key: string | symbol, 
  type: 'set' | 'add' | 'delete' | 'clear',
  newValue?: any,
  oldValue?: any
): void {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  
  const effects = new Set<ReactiveEffect>();
  
  // Собираем все эффекты для данного ключа
  const dep = depsMap.get(key);
  if (dep) {
    dep.effects.forEach(effect => {
      if (effect !== activeEffect) {
        effects.add(effect);
      }
    });
  }
  
  // Для операций с массивами также триггерим length
  if (type === 'add' || type === 'delete') {
    if (Array.isArray(target)) {
      const lengthDep = depsMap.get('length');
      if (lengthDep) {
        lengthDep.effects.forEach(effect => {
          if (effect !== activeEffect) {
            effects.add(effect);
          }
        });
      }
    }
  }
  
  // Запускаем все собранные эффекты
  effects.forEach(effect => {
    if (effect.options?.scheduler) {
      effect.options.scheduler(effect);
    } else {
      effect.fn();
    }
  });
}

/**
 * Флаг разрешения отслеживания
 */
let shouldTrack = true;

/**
 * Приостановка отслеживания
 */
export function pauseTracking(): void {
  shouldTrack = false;
}

/**
 * Возобновление отслеживания
 */
export function enableTracking(): void {
  shouldTrack = true;
}

/**
 * Создание реактивного эффекта
 */
export function effect(
  fn: Function, 
  options: EffectOptions = {}
): ReactiveEffect {
  const effectFn: ReactiveEffect = {
    fn,
    active: true,
    deps: new Set(),
    options
  };
  
  if (!options.lazy) {
    runEffect(effectFn);
  }
  
  return effectFn;
}

/**
 * Запуск реактивного эффекта
 */
function runEffect(effect: ReactiveEffect): any {
  if (!effect.active) {
    return effect.fn();
  }
  
  // Очищаем старые зависимости
  cleanupEffect(effect);
  
  try {
    // Устанавливаем активный эффект
    effectStack.push(effect);
    activeEffect = effect;
    
    return effect.fn();
  } finally {
    // Восстанавливаем предыдущий активный эффект
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
  }
}

/**
 * Очистка зависимостей эффекта
 */
function cleanupEffect(effect: ReactiveEffect): void {
  effect.deps.forEach(dep => {
    dep.effects.delete(effect);
  });
  effect.deps.clear();
}

/**
 * Остановка реактивного эффекта
 */
export function stop(effect: ReactiveEffect): void {
  if (effect.active) {
    cleanupEffect(effect);
    effect.active = false;
  }
}

/**
 * Проверка, является ли объект реактивным
 */
export function isReactive(value: any): boolean {
  return originalMap.has(value);
}

/**
 * Получение оригинального объекта из реактивного
 */
export function toRaw<T>(observed: T): T {
  const original = originalMap.get(observed as any);
  return original ? original as T : observed;
}

/**
 * Создание shallow реактивного объекта (только первый уровень)
 */
export function shallowReactive<T extends object>(target: T): T {
  return createReactive(target, { deep: false });
}

/**
 * Проверка, изменилось ли значение
 */
export function hasChanged(value: any, oldValue: any): boolean {
  return !Object.is(value, oldValue);
}

// Экспортируем типы для совместимости
export type { ReactiveEffect, EffectOptions } from './types';