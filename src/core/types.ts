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
 * Обработчики событий DOM и кастомных событий фреймворка
 */
export interface EventHandlers {
  // DOM события
  click?: (event: Event) => void;
  input?: (event: Event) => void;
  change?: (event: Event) => void;
  submit?: (event: Event) => void;
  keydown?: (event: Event) => void;
  keyup?: (event: Event) => void;
  mousedown?: (event: Event) => void;
  mouseup?: (event: Event) => void;
  mouseover?: (event: Event) => void;
  mouseout?: (event: Event) => void;
  focus?: (event: Event) => void;
  blur?: (event: Event) => void;
  
  // Кастомные события фреймворка
  mounted?: (element: HTMLElement) => void;
  unmounted?: (element: HTMLElement) => void;
  
  // Любые другие события
  [eventType: string]: ((event: Event) => void) | ((element: HTMLElement) => void) | undefined;
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
 * Определение компонента с расширенными хуками жизненного цикла
 */
export interface Component {
  /** Имя компонента */
  name: string;
  /** Определение свойств */
  props?: ComponentProps;
  /** Фабрика локального состояния */
  state?: () => Record<string, any>;
  /** Computed свойства компонента */
  computed?: Record<string, () => any>;
  /** Методы компонента */
  methods?: Record<string, Function>;
  /** Функция рендеринга */
  render(props: any, state: any, computed?: any): ElementConfig;
  
  // Хуки жизненного цикла
  /** Вызывается при создании экземпляра компонента */
  beforeCreate?(): void;
  /** Вызывается после создания экземпляра */
  created?(): void;
  /** Вызывается перед монтированием в DOM */
  beforeMount?(): void;
  /** Вызывается после монтирования в DOM */
  mounted?(): void;
  /** Вызывается перед обновлением */
  beforeUpdate?(changedProps: string[], changedState: string[]): void;
  /** Вызывается после обновления */
  updated?(changedProps: string[], changedState: string[]): void;
  /** Вызывается перед размонтированием */
  beforeDestroy?(): void;
  /** Вызывается после размонтирования */
  destroyed?(): void;
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
 * Экземпляр компонента с расширенной функциональностью
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
  /** Computed свойства */
  computed: Record<string, any>;
  /** DOM элемент */
  element: HTMLElement | null;
  /** Смонтирован ли компонент */
  mounted: boolean;
  /** Отслеживаемые зависимости */
  dependencies: Set<string>;
  /** Дочерние компоненты */
  children: ComponentInstance[];
  /** Родительский компонент */
  parent: ComponentInstance | null;
  /** Контекст плагинов */
  pluginContext: Record<string, any>;
  /** Очистка ресурсов */
  cleanup: (() => void)[];
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
// СИСТЕМА ПЛАГИНОВ
// ===========================================

/**
 * Интерфейс плагина для фреймворка
 */
export interface Plugin {
  /** Название плагина */
  name: string;
  /** Версия плагина */
  version?: string;
  /** Функция установки плагина */
  install: (framework: any, options?: any) => void;
  /** Зависимости плагина */
  dependencies?: string[];
}

/**
 * Опции для системы плагинов
 */
export interface PluginOptions {
  [key: string]: any;
}

/**
 * Контекст плагина
 */
export interface PluginContext {
  /** Экземпляр фреймворка */
  framework: any;
  /** Опции плагина */
  options: PluginOptions;
  /** Глобальные свойства */
  globalProperties: Record<string, any>;
  /** Пользовательские директивы */
  directives: Map<string, CustomDirective>;
}

/**
 * Пользовательская директива
 */
export interface CustomDirective {
  /** Название директивы */
  name: string;
  /** Привязка директивы к элементу */
  bind?(el: HTMLElement, binding: DirectiveBinding, vnode?: any): void;
  /** Вставка элемента в DOM */
  inserted?(el: HTMLElement, binding: DirectiveBinding, vnode?: any): void;
  /** Обновление директивы */
  update?(el: HTMLElement, binding: DirectiveBinding, vnode?: any, oldVnode?: any): void;
  /** Обновление компонента */
  componentUpdated?(el: HTMLElement, binding: DirectiveBinding, vnode?: any, oldVnode?: any): void;
  /** Отвязка директивы */
  unbind?(el: HTMLElement, binding: DirectiveBinding, vnode?: any): void;
}

/**
 * Привязка директивы
 */
export interface DirectiveBinding {
  /** Имя директивы */
  name: string;
  /** Значение директивы */
  value: any;
  /** Предыдущее значение */
  oldValue: any;
  /** Выражение в виде строки */
  expression: string;
  /** Аргумент директивы */
  arg?: string;
  /** Модификаторы */
  modifiers: Record<string, boolean>;
}

// ===========================================
// COMPUTED СВОЙСТВА
// ===========================================

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
  /** Computed свойства */
  computed?: Record<string, any>;
}