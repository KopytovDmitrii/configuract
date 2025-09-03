/**
 * Основная конфигурация элемента DOM или компонента
 */
export interface ElementConfig {
  /** HTML тег элемента */
  tag?: string;
  /** Имя компонента */
  component?: string;
  /** Свойства элемента или компонента */
  props?: ElementProps;
  /** Дочерние элементы */
  children?: ElementChild[];
  /** Обработчики событий */
  events?: EventHandlers;
  
  // Директивы
  /** Условное отображение */
  if?: string;
  /** Рендеринг списков */
  for?: string;
  /** Шаблон для v-for */
  template?: ElementConfig;
  /** Двунаправленная привязка данных */
  model?: string;
  /** Показать/скрыть элемент */
  show?: boolean;
  
  /** Ключ для оптимизации списков */
  key?: string | number;
  /** Слоты для композиции компонентов */
  slots?: Record<string, ElementChild[]>;
}

/**
 * Свойства элемента DOM
 */
export interface ElementProps {
  /** CSS класс */
  class?: string;
  /** Уникальный идентификатор */
  id?: string;
  /** Стили элемента */
  style?: StyleProperties;
  /** Любые другие HTML атрибуты */
  [key: string]: any;
}

/**
 * CSS стили элемента
 */
export interface StyleProperties {
  [property: string]: string | number;
}

/**
 * Дочерний элемент может быть строкой (текст) или другой конфигурацией элемента
 */
export type ElementChild = ElementConfig | string;

/**
 * Обработчики событий DOM
 */
export interface EventHandlers {
  [eventType: string]: (event: Event) => void;
}

/**
 * Результат валидации конфигурации
 */
export interface ValidationResult {
  /** Является ли конфигурация валидной */
  isValid: boolean;
  /** Ошибки валидации */
  errors: ValidationError[];
}

/**
 * Ошибка валидации
 */
export interface ValidationError {
  /** Поле с ошибкой */
  field: string;
  /** Описание ошибки */
  message: string;
  /** Путь к полю в иерархии объекта */
  path?: string;
}

/**
 * Контекст рендеринга элемента
 */
export interface RenderContext {
  /** DOM элемент */
  element: HTMLElement;
  /** Конфигурация элемента */
  config: ElementConfig;
  /** Родительский контекст (если есть) */
  parentContext?: RenderContext;
}

/**
 * Запись о привязанном обработчике событий
 */
export interface EventListenerRecord {
  /** Тип события */
  type: string;
  /** Функция-обработчик */
  handler: (event: Event) => void;
  /** DOM элемент */
  element: HTMLElement;
}

/**
 * Опции рендерера
 */
export interface RendererOptions {
  /** Включить валидацию перед рендерингом */
  enableValidation?: boolean;
  /** Логировать предупреждения */
  enableLogging?: boolean;
}

/**
 * Статистика рендеринга
 */
export interface RenderStats {
  /** Количество созданных элементов */
  elementsCreated: number;
  /** Количество привязанных событий */
  eventsAttached: number;
  /** Время рендеринга в миллисекундах */
  renderTime: number;
}

// ===========================================
// КОМПОНЕНТНАЯ СИСТЕМА
// ===========================================

/**
 * Определение компонента
 */
export interface Component {
  /** Имя компонента */
  name: string;
  /** Определение свойств */
  props?: ComponentProps;
  /** Фабрика локального состояния */
  state?: () => Record<string, any>;
  /** Функция рендеринга */
  render(props: any, state: any): ElementConfig;
  
  // Хуки жизненного цикла
  /** Вызывается при создании компонента */
  onCreate?(): void;
  /** Вызывается после монтирования в DOM */
  onMount?(): void;
  /** Вызывается при обновлении */
  onUpdate?(changedProps: string[], changedState: string[]): void;
  /** Вызывается перед размонтированием */
  onDestroy?(): void;
}

/**
 * Определение свойств компонента
 */
export interface ComponentProps {
  [key: string]: PropDefinition;
}

/**
 * Определение одного свойства
 */
export interface PropDefinition {
  /** Тип свойства */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function';
  /** Значение по умолчанию */
  default?: any;
  /** Обязательное свойство */
  required?: boolean;
  /** Кастомный валидатор */
  validator?: (value: any) => boolean;
}

/**
 * Экземпляр компонента
 */
export interface ComponentInstance {
  /** Уникальный идентификатор */
  id: string;
  /** Определение компонента */
  component: Component;
  /** Текущие свойства */
  props: any;
  /** Локальное состояние */
  state: any;
  /** DOM элемент */
  element: HTMLElement | null;
  /** Смонтирован ли компонент */
  mounted: boolean;
  /** Отслеживаемые зависимости */
  dependencies: Set<string>;
  /** Родительские компоненты */
  children: ComponentInstance[];
  /** Родительский компонент */
  parent: ComponentInstance | null;
}

// ===========================================
// РЕАКТИВНОСТЬ
// ===========================================

/**
 * Реактивный эффект
 */
export interface ReactiveEffect {
  /** Функция эффекта */
  fn: Function;
  /** Активный ли эффект */
  active: boolean;
  /** Зависимости эффекта */
  deps: Set<ReactiveProperty>;
  /** Опции эффекта */
  options?: EffectOptions;
}

/**
 * Опции реактивного эффекта
 */
export interface EffectOptions {
  /** Отложенное выполнение */
  lazy?: boolean;
  /** Планировщик */
  scheduler?: (effect: ReactiveEffect) => void;
}

/**
 * Реактивное свойство
 */
export interface ReactiveProperty {
  /** Ключ свойства */
  key: string;
  /** Наблюдатели */
  effects: Set<ReactiveEffect>;
}

/**
 * Опции реактивности
 */
export interface ReactiveOptions {
  /** Глубина реактивности */
  deep?: boolean;
  /** Отладочные имена */
  debuggerOptions?: {
    onTrack?: (event: DebuggerEvent) => void;
    onTrigger?: (event: DebuggerEvent) => void;
  };
}

/**
 * Отладочное событие
 */
export interface DebuggerEvent {
  /** Тип события */
  type: 'get' | 'set' | 'add' | 'delete' | 'clear';
  /** Целевой объект */
  target: object;
  /** Ключ свойства */
  key?: string | symbol;
  /** Новое значение */
  newValue?: any;
  /** Старое значение */
  oldValue?: any;
}

// ===========================================
// DOM DIFFING
// ===========================================

/**
 * Типы патчей для DOM
 */
export type PatchType = 
  | 'REPLACE'     // Полная замена элемента
  | 'ADD'         // Добавление элемента
  | 'REMOVE'      // Удаление элемента
  | 'UPDATE'      // Обновление элемента
  | 'TEXT_UPDATE' // Обновление текста
  | 'PROPS'       // Обновление свойств
  | 'MOVE';       // Перемещение элемента

/**
 * Патч для обновления DOM
 */
export interface DOMPatch {
  /** Тип патча */
  type: PatchType;
  /** Индекс элемента */
  index?: number;
  /** Новая конфигурация */
  newConfig?: ElementConfig;
  /** Старая конфигурация */
  oldConfig?: ElementConfig;
  /** Новый текст */
  text?: string;
  /** Вложенные патчи */
  patches?: DOMPatch[];
  /** Новые свойства */
  props?: Record<string, any>;
  /** Новая позиция */
  newIndex?: number;
}

/**
 * Результат сравнения
 */
export interface DiffResult {
  /** Патчи для применения */
  patches: DOMPatch[];
}

// ===========================================
// ДИРЕКТИВЫ
// ===========================================

/**
 * Контекст рендеринга для директив
 */
export interface DirectiveContext {
  /** Текущее состояние */
  state: any;
  /** Свойства компонента */
  props: any;
  /** Экземпляр компонента */
  instance?: ComponentInstance;
}