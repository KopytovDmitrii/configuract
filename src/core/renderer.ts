import { 
  ElementConfig, 
  ElementProps, 
  StyleProperties, 
  EventHandlers, 
  EventListenerRecord, 
  RenderContext,
  RendererOptions,
  RenderStats
} from './types';

/**
 * Класс для рендеринга HTML элементов из конфигурации
 */
export class HTMLRenderer {
  private eventListeners: Map<HTMLElement, EventListenerRecord[]>;
  private options: RendererOptions;
  private stats: RenderStats;

  constructor(options: RendererOptions = {}) {
    this.eventListeners = new Map();
    this.options = {
      enableValidation: true,
      enableLogging: false,
      ...options
    };
    this.stats = {
      elementsCreated: 0,
      eventsAttached: 0,
      renderTime: 0
    };
  }

  /**
   * Основной метод рендеринга
   */
  render(config: ElementConfig, container: HTMLElement): HTMLElement {
    const startTime = performance.now();
    
    try {
      const element = this.createElement(config);
      container.appendChild(element);
      
      this.stats.renderTime = performance.now() - startTime;
      
      if (this.options.enableLogging) {
        console.log(`Рендеринг завершен за ${this.stats.renderTime.toFixed(2)}мс`);
      }
      
      return element;
    } catch (error) {
      console.error('Ошибка рендеринга:', error);
      throw error;
    }
  }

  /**
   * Создание DOM элемента из конфигурации
   */
  private createElement(config: ElementConfig): HTMLElement {
    // Создание HTML элемента
    const tag = config.tag || 'div';
    const element = document.createElement(tag);
    this.stats.elementsCreated++;

    // Применение свойств
    if (config.props) {
      this.applyProps(element, config.props);
    }

    // Привязка событий
    if (config.events) {
      this.attachEvents(element, config.events);
    }

    // Рендеринг дочерних элементов
    if (config.children) {
      this.renderChildren(element, config.children);
    }

    return element;
  }

  /**
   * Применение свойств к DOM элементу
   */
  private applyProps(element: HTMLElement, props: ElementProps): void {
    for (const [key, value] of Object.entries(props)) {
      switch (key) {
        case 'class':
          element.className = value as string;
          break;
        case 'id':
          element.id = value as string;
          break;
        case 'style':
          this.applyStyles(element, value as StyleProperties);
          break;
        default:
          // Применение обычных HTML атрибутов
          if (value !== undefined && value !== null) {
            element.setAttribute(key, String(value));
          }
          break;
      }
    }
  }

  /**
   * Применение CSS стилей к элементу
   */
  private applyStyles(element: HTMLElement, styles: StyleProperties): void {
    for (const [property, value] of Object.entries(styles)) {
      if (value !== undefined && value !== null) {
        // Преобразование camelCase в kebab-case для CSS свойств
        const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
        element.style.setProperty(cssProperty, String(value));
      }
    }
  }

  /**
   * Привязка обработчиков событий к элементу
   */
  private attachEvents(element: HTMLElement, events: EventHandlers): void {
    const listeners: EventListenerRecord[] = [];

    for (const [eventType, handler] of Object.entries(events)) {
      const listenerRecord: EventListenerRecord = {
        type: eventType,
        handler,
        element
      };

      element.addEventListener(eventType, handler);
      listeners.push(listenerRecord);
      this.stats.eventsAttached++;
    }

    if (listeners.length > 0) {
      this.eventListeners.set(element, listeners);
    }
  }

  /**
   * Рендеринг дочерних элементов
   */
  private renderChildren(parent: HTMLElement, children: any[]): void {
    children.forEach(child => {
      if (typeof child === 'string') {
        // Текстовый узел
        const textNode = document.createTextNode(child);
        parent.appendChild(textNode);
      } else if (child && typeof child === 'object' && child.tag) {
        // Вложенный элемент
        const childElement = this.createElement(child);
        parent.appendChild(childElement);
      } else {
        console.warn('Некорректный дочерний элемент:', child);
      }
    });
  }

  /**
   * Размонтирование элемента с очисткой ресурсов
   */
  unmount(element: HTMLElement): void {
    // Очистка обработчиков событий
    this.cleanupEventListeners(element);

    // Рекурсивная очистка дочерних элементов
    const children = Array.from(element.children);
    children.forEach(child => {
      if (child instanceof HTMLElement) {
        this.unmount(child);
      }
    });

    // Удаление из DOM
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  /**
   * Очистка обработчиков событий для элемента
   */
  private cleanupEventListeners(element: HTMLElement): void {
    const listeners = this.eventListeners.get(element);
    if (listeners) {
      listeners.forEach(({ type, handler }) => {
        element.removeEventListener(type, handler);
      });
      this.eventListeners.delete(element);
    }
  }

  /**
   * Обновление элемента новой конфигурацией
   */
  update(element: HTMLElement, newConfig: ElementConfig): HTMLElement {
    // Простое обновление - полная замена
    const parent = element.parentNode;
    if (!parent) {
      throw new Error('Элемент не имеет родителя для обновления');
    }

    // Создание нового элемента
    const newElement = this.createElement(newConfig);

    // Замена в DOM
    parent.replaceChild(newElement, element);

    // Очистка старого элемента
    this.unmount(element);

    return newElement;
  }

  /**
   * Получение статистики рендеринга
   */
  getStats(): RenderStats {
    return { ...this.stats };
  }

  /**
   * Сброс статистики рендеринга
   */
  resetStats(): void {
    this.stats = {
      elementsCreated: 0,
      eventsAttached: 0,
      renderTime: 0
    };
  }

  /**
   * Получение количества привязанных обработчиков событий
   */
  getEventListenersCount(): number {
    let count = 0;
    this.eventListeners.forEach(listeners => {
      count += listeners.length;
    });
    return count;
  }

  /**
   * Создание контекста рендеринга
   */
  createRenderContext(element: HTMLElement, config: ElementConfig, parent?: RenderContext): RenderContext {
    return {
      element,
      config,
      ...(parent && { parentContext: parent })
    };
  }

  /**
   * Поиск элемента по ID в рендереном дереве
   */
  findElementById(root: HTMLElement, id: string): HTMLElement | null {
    if (root.id === id) {
      return root;
    }

    for (const child of Array.from(root.children)) {
      if (child instanceof HTMLElement) {
        const found = this.findElementById(child, id);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * Поиск элементов по классу в рендереном дереве
   */
  findElementsByClass(root: HTMLElement, className: string): HTMLElement[] {
    const result: HTMLElement[] = [];

    if (root.classList.contains(className)) {
      result.push(root);
    }

    for (const child of Array.from(root.children)) {
      if (child instanceof HTMLElement) {
        result.push(...this.findElementsByClass(child, className));
      }
    }

    return result;
  }

  /**
   * Очистка всех ресурсов рендерера
   */
  cleanup(): void {
    // Очистка всех обработчиков событий
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ type, handler }) => {
        element.removeEventListener(type, handler);
      });
    });

    this.eventListeners.clear();
    this.resetStats();
  }
}