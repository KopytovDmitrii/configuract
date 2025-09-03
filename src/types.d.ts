/**
 * Глобальные TypeScript определения для JS Framework v1.0
 */

declare global {
  interface Window {
    JSFramework: typeof import('./index');
    TodoApp?: any;
  }
}

/**
 * Утилиты для типов
 */
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Required<T, K extends keyof T> = T & {
  [P in K]-?: T[P]
}

/**
 * Производительность и оптимизация
 */
export interface PerformanceMetrics {
  count: number;
  min: number;
  max: number;
  avg: number;
  median?: number;
  p95?: number;
  p99?: number;
}

export interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface VirtualListConfig {
  itemHeight: number;
  containerHeight: number;
  bufferSize?: number;
  overscan?: number;
}

export interface VirtualListResult<T> {
  items: T[];
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
}

/**
 * Расширенные хуки жизненного цикла
 */
export interface ComponentLifecycleHooks {
  beforeCreate?(): void | Promise<void>;
  created?(): void | Promise<void>;
  beforeMount?(): void | Promise<void>;
  mounted?(): void | Promise<void>;
  beforeUpdate?(changedProps: string[], changedState: string[]): void | Promise<void>;
  updated?(changedProps: string[], changedState: string[]): void | Promise<void>;
  beforeDestroy?(): void | Promise<void>;
  destroyed?(): void | Promise<void>;
}

/**
 * Система событий
 */
export interface EventEmitter {
  on<T = any>(event: string, handler: (data: T) => void): () => void;
  off(event: string, handler?: Function): void;
  emit<T = any>(event: string, data?: T): void;
  once<T = any>(event: string, handler: (data: T) => void): () => void;
}

/**
 * Валидация
 */
export interface ValidationRule<T = any> {
  validator: (value: T) => boolean | Promise<boolean>;
  message: string;
  when?: (context: any) => boolean;
}

export interface ValidationSchema {
  [key: string]: ValidationRule | ValidationRule[];
}

export interface ValidationContext {
  value: any;
  field: string;
  parent: any;
  root: any;
}

/**
 * Расширенные директивы
 */
export interface DirectiveHooks {
  beforeMount?(el: HTMLElement, binding: DirectiveBinding): void;
  mounted?(el: HTMLElement, binding: DirectiveBinding): void;
  beforeUpdate?(el: HTMLElement, binding: DirectiveBinding, prevBinding: DirectiveBinding): void;
  updated?(el: HTMLElement, binding: DirectiveBinding, prevBinding: DirectiveBinding): void;
  beforeUnmount?(el: HTMLElement, binding: DirectiveBinding): void;
  unmounted?(el: HTMLElement, binding: DirectiveBinding): void;
}

export interface DirectiveDefinition extends DirectiveHooks {
  name: string;
  deep?: boolean;
  created?(el: HTMLElement, binding: DirectiveBinding): void;
}

/**
 * Роутинг (для будущего плагина)
 */
export interface RouteRecord {
  path: string;
  component: string;
  name?: string;
  meta?: Record<string, any>;
  beforeEnter?: (to: RouteRecord, from: RouteRecord) => boolean | Promise<boolean>;
  children?: RouteRecord[];
}

export interface Router {
  push(path: string | { path: string; query?: Record<string, any> }): void;
  replace(path: string | { path: string; query?: Record<string, any> }): void;
  go(n: number): void;
  back(): void;
  forward(): void;
  getCurrentRoute(): RouteRecord | null;
}

/**
 * Store (для будущего плагина)
 */
export interface StoreOptions<S = any> {
  state: S | (() => S);
  getters?: Record<string, (state: S) => any>;
  mutations?: Record<string, (state: S, payload?: any) => void>;
  actions?: Record<string, (context: ActionContext<S>, payload?: any) => any>;
  modules?: Record<string, StoreOptions>;
}

export interface ActionContext<S = any> {
  state: S;
  commit: (mutation: string, payload?: any) => void;
  dispatch: (action: string, payload?: any) => Promise<any>;
  getters: Record<string, any>;
}

/**
 * Интернационализация
 */
export interface I18nOptions {
  locale: string;
  fallbackLocale?: string;
  messages: Record<string, Record<string, string>>;
  dateTimeFormats?: Record<string, any>;
  numberFormats?: Record<string, any>;
}

export interface I18nInstance {
  locale: string;
  t(key: string, params?: Record<string, any>): string;
  d(value: Date, format?: string): string;
  n(value: number, format?: string): string;
  setLocale(locale: string): void;
}

/**
 * Тестирование
 */
export interface TestUtils {
  mount(component: Component, options?: MountOptions): ComponentWrapper;
  shallowMount(component: Component, options?: MountOptions): ComponentWrapper;
  createLocalVue(): any;
}

export interface MountOptions {
  props?: Record<string, any>;
  data?: Record<string, any>;
  methods?: Record<string, Function>;
  computed?: Record<string, Function>;
  mocks?: Record<string, any>;
  slots?: Record<string, any>;
}

export interface ComponentWrapper {
  vm: ComponentInstance;
  element: HTMLElement;
  find(selector: string): HTMLElement | null;
  findAll(selector: string): HTMLElement[];
  trigger(event: string, data?: any): void;
  setProps(props: Record<string, any>): Promise<void>;
  setData(data: Record<string, any>): Promise<void>;
  destroy(): void;
}

/**
 * DevTools
 */
export interface DevToolsHook {
  emit(event: string, data: any): void;
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
}

export interface DevToolsApi {
  addTimelineLayer(options: TimelineLayerOptions): void;
  addInspector(options: InspectorOptions): void;
  sendInspectorTree(inspectorId: string, tree: InspectorNode[]): void;
  sendInspectorState(inspectorId: string, state: InspectorState): void;
}

export interface TimelineLayerOptions {
  id: string;
  label: string;
  color: string;
}

export interface InspectorOptions {
  id: string;
  label: string;
  icon?: string;
}

export interface InspectorNode {
  id: string;
  label: string;
  children?: InspectorNode[];
  tags?: Array<{ label: string; textColor: string; backgroundColor: string }>;
}

export interface InspectorState {
  [key: string]: any;
}

/**
 * Экспорт модульных определений
 */
export * from './core/types';
export * from './core/computed';
export * from './core/plugin-system';
export * from './core/performance';

/**
 * Глобальная конфигурация фреймворка
 */
export interface GlobalConfig {
  productionTip: boolean;
  devtools: boolean;
  performance: boolean;
  errorHandler?: (error: Error, instance?: ComponentInstance, info?: string) => void;
  warnHandler?: (message: string, instance?: ComponentInstance, trace?: string) => void;
  ignoredElements?: (string | RegExp)[];
  keyCodes?: Record<string, number | number[]>;
}

/**
 * Основной API фреймворка
 */
export interface FrameworkAPI {
  version: string;
  config: GlobalConfig;
  use<T>(plugin: Plugin, options?: T): FrameworkAPI;
  mixin(mixin: ComponentOptions): FrameworkAPI;
  component(id: string, definition?: Component): Component | FrameworkAPI;
  directive(id: string, definition?: DirectiveDefinition): DirectiveDefinition | FrameworkAPI;
  mount(rootContainer: string | HTMLElement): ComponentInstance;
  unmount(): void;
  provide<T>(key: string | symbol, value: T): void;
  runWithContext<T>(fn: () => T): T;
}

/**
 * Composition API (для будущих версий)
 */
export interface CompositionAPI {
  ref<T>(value: T): Ref<T>;
  reactive<T extends object>(target: T): T;
  computed<T>(getter: () => T): ComputedRef<T>;
  watch<T>(source: T | (() => T), callback: (value: T, oldValue: T) => void): () => void;
  watchEffect(effect: () => void): () => void;
  onMounted(hook: () => void): void;
  onUnmounted(hook: () => void): void;
  onUpdated(hook: () => void): void;
}

export interface Ref<T = any> {
  value: T;
}

/**
 * Утилиты для разработки
 */
export interface DevUtils {
  isRef(value: any): value is Ref;
  isReactive(value: any): boolean;
  isReadonly(value: any): boolean;
  isProxy(value: any): boolean;
  toRaw<T>(observed: T): T;
  markRaw<T extends object>(value: T): T;
  shallowRef<T>(value: T): Ref<T>;
  triggerRef(ref: Ref): void;
  unref<T>(ref: T | Ref<T>): T;
  customRef<T>(factory: CustomRefFactory<T>): Ref<T>;
}

export interface CustomRefFactory<T> {
  (track: () => void, trigger: () => void): {
    get(): T;
    set(value: T): void;
  };
}

/**
 * Экспорт типов для внешнего использования
 */
export {
  Component,
  ComponentInstance,
  ElementConfig,
  Plugin,
  DirectiveBinding,
  CustomDirective,
  ComputedRef,
  ReactiveEffect
} from './core/types';