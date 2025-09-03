// Основные классы
export { ConfigValidator } from './core/validator';
export { HTMLRenderer } from './core/renderer';
export { ComponentRenderer } from './core/component-renderer';
export { componentRegistry, registerComponent, getComponent, createComponentInstance } from './core/component-registry';

// Реактивность
export { 
  createReactive, 
  effect, 
  stop, 
  isReactive, 
  toRaw, 
  shallowReactive,
  pauseTracking,
  enableTracking
} from './core/reactive';

// Планировщик
export { 
  scheduler, 
  nextTick, 
  flushSync, 
  scheduleUpdate,
  PriorityScheduler 
} from './core/scheduler';

// Директивы
export { 
  directiveManager,
  IfDirective,
  ForDirective, 
  ShowDirective,
  ModelDirective
} from './core/directives';

// DOM Diffing
export { domDiffer, domPatcher, DOMDiffer, DOMPatcher } from './core/dom-differ';

// Типы
export type { 
  ElementConfig, 
  ElementProps, 
  StyleProperties, 
  ElementChild, 
  EventHandlers,
  ValidationResult,
  ValidationError,
  RenderContext,
  EventListenerRecord,
  RendererOptions,
  RenderStats,
  
  // Компонентная система
  Component,
  ComponentProps,
  PropDefinition,
  ComponentInstance,
  
  // Реактивность
  ReactiveEffect,
  EffectOptions,
  ReactiveProperty,
  ReactiveOptions,
  DebuggerEvent,
  
  // DOM Diffing
  PatchType,
  DOMPatch,
  DiffResult,
  
  // Директивы
  DirectiveContext
} from './core/types';

// Утилиты
export { 
  createElement, 
  isValidHtmlTag, 
  camelToKebab,
  escapeHtml,
  isElementConfig,
  cloneConfig,
  createTextNode,
  combineClasses,
  stylesToString
} from './utils/helpers';

import { ConfigValidator } from './core/validator';
import { ComponentRenderer } from './core/component-renderer';
import { ElementConfig, RendererOptions, Component } from './core/types';
import { createReactive } from './core/reactive';
import { registerComponent } from './core/component-registry';
import { nextTick } from './core/scheduler';

/**
 * Основной класс JS фреймворка с поддержкой компонентов и реактивности
 */
export class JSFramework {
  private renderer: ComponentRenderer;
  private validator: ConfigValidator;
  private mountedElement: HTMLElement | null;
  private globalState: any;

  constructor(options?: RendererOptions) {
    this.renderer = new ComponentRenderer();
    this.validator = new ConfigValidator();
    this.mountedElement = null;
    this.globalState = createReactive({});
  }

  /**
   * Регистрация компонента в фреймворке
   */
  registerComponent(component: Component): void {
    registerComponent(component);
  }

  /**
   * Создание реактивного состояния
   */
  reactive<T extends object>(target: T): T {
    return createReactive(target);
  }

  /**
   * Получение глобального состояния
   */
  getGlobalState(): any {
    return this.globalState;
  }

  /**
   * Ожидание следующего обновления
   */
  nextTick(): Promise<void> {
    return nextTick();
  }

  /**
   * Рендеринг конфигурации в указанный контейнер
   */
  render(config: ElementConfig, container: HTMLElement | string): HTMLElement {
    const containerElement = typeof container === 'string' 
      ? document.querySelector(container) as HTMLElement
      : container;

    if (!containerElement) {
      throw new Error('Контейнер не найден');
    }

    // Валидация конфигурации
    const validationResult = this.validator.validate(config);
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map(e => e.message).join(', ');
      throw new Error(`Ошибка валидации: ${errorMessages}`);
    }

    // Размонтируем предыдущий элемент
    if (this.mountedElement) {
      this.unmount();
    }

    // Рендеринг с поддержкой компонентов
    const element = this.renderer.render(config, containerElement);
    this.mountedElement = element;

    return element;
  }

  /**
   * Размонтирование текущего элемента
   */
  unmount(): void {
    if (this.mountedElement) {
      this.renderer.unmount(this.mountedElement);
      this.mountedElement = null;
    }
  }

  /**
   * Обновление текущего элемента новой конфигурацией
   */
  update(newConfig: ElementConfig): HTMLElement {
    if (!this.mountedElement) {
      throw new Error('Нет смонтированного элемента для обновления');
    }

    // Валидация новой конфигурации
    const validationResult = this.validator.validate(newConfig);
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map(e => e.message).join(', ');
      throw new Error(`Ошибка валидации: ${errorMessages}`);
    }

    // Обновление с поддержкой компонентов
    const newElement = this.renderer.updateElement(this.mountedElement, newConfig);
    this.mountedElement = newElement;

    return newElement;
  }

  /**
   * Получение статистики рендеринга
   */
  getStats() {
    return this.renderer.getStats();
  }

  /**
   * Поиск элемента по ID
   */
  findById(id: string): HTMLElement | null {
    if (!this.mountedElement) {
      return null;
    }
    return this.renderer.findElementById(this.mountedElement, id);
  }

  /**
   * Поиск элементов по классу
   */
  findByClass(className: string): HTMLElement[] {
    if (!this.mountedElement) {
      return [];
    }
    return this.renderer.findElementsByClass(this.mountedElement, className);
  }

  /**
   * Очистка всех ресурсов фреймворка
   */
  cleanup(): void {
    this.unmount();
    this.renderer.cleanup();
    this.validator.reset();
  }

  /**
   * Получение текущего смонтированного элемента
   */
  getMountedElement(): HTMLElement | null {
    return this.mountedElement;
  }
}

// Создание глобального экземпляра для удобства
export const Framework = new JSFramework();

// Экспорт по умолчанию
export default Framework;