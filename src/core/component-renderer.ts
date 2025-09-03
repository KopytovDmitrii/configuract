import { 
  ElementConfig, 
  ElementProps, 
  EventHandlers, 
  ComponentInstance,
  DirectiveContext,
  RenderStats
} from './types';
import { componentRegistry } from './component-registry';
import { effect } from './reactive';
import { scheduler } from './scheduler';
import { directiveManager } from './directives';

/**
 * Расширенный рендерер с поддержкой компонентов и реактивности
 */
export class ComponentRenderer {
  private mountedInstances = new Map<HTMLElement, ComponentInstance>();
  private instanceElements = new Map<string, HTMLElement>();
  private stats: RenderStats = {
    elementsCreated: 0,
    eventsAttached: 0,
    renderTime: 0
  };

  /**
   * Основной метод рендеринга
   */
  render(config: ElementConfig, container: HTMLElement): HTMLElement {
    const startTime = performance.now();
    
    try {
      // Очищаем контейнер
      this.clearContainer(container);
      
      // Рендерим конфигурацию
      const element = this.renderConfig(config);
      container.appendChild(element);
      
      this.stats.renderTime = performance.now() - startTime;
      return element;
    } catch (error) {
      console.error('Ошибка рендеринга:', error);
      throw error;
    }
  }

  /**
   * Рендеринг конфигурации (элемент или компонент)
   */
  private renderConfig(config: ElementConfig, parentInstance?: ComponentInstance): HTMLElement {
    // Проверяем, является ли это компонентом
    if (config.component) {
      return this.renderComponent(config, parentInstance);
    } else {
      return this.renderElement(config, parentInstance);
    }
  }

  /**
   * Рендеринг компонента
   */
  private renderComponent(config: ElementConfig, parentInstance?: ComponentInstance): HTMLElement {
    const componentName = config.component!;
    
    // Создаем экземпляр компонента
    const instance = componentRegistry.createInstance(componentName, config.props);
    
    // Устанавливаем родительскую связь
    if (parentInstance) {
      instance.parent = parentInstance;
      parentInstance.children.push(instance);
    }

    // Создаем контекст для директив
    const directiveContext: DirectiveContext = {
      state: instance.state,
      props: instance.props,
      instance
    };

    // Создаем реактивный эффект для перерендеринга
    effect(() => {
      try {
        // Получаем конфигурацию от компонента
        const componentConfig = instance.component.render(instance.props, instance.state);
        
        // Обрабатываем директивы
        const processedConfigs = directiveManager.processDirectives(componentConfig, directiveContext);
        
        if (processedConfigs.length === 0) {
          // Компонент скрыт директивой
          if (instance.element) {
            this.unmountComponent(instance);
          }
          return;
        }

        // Рендерим первый результат (в большинстве случаев будет только один)
        const newElement = this.renderElement(processedConfigs[0], instance);
        
        if (instance.element) {
          // Обновляем существующий элемент
          if (instance.element.parentNode) {
            instance.element.parentNode.replaceChild(newElement, instance.element);
          }
          instance.element = newElement;
        } else {
          // Первый рендер
          instance.element = newElement;
          this.instanceElements.set(instance.id, newElement);
          this.mountedInstances.set(newElement, instance);
          
          // Вызываем хук onMount
          componentRegistry.mountInstance(instance, newElement);
        }
      } catch (error) {
        console.error('Ошибка при рендеринге компонента:', error);
      }
    }, {
      scheduler: (effect) => scheduler.schedule(effect)
    });

    // Возвращаем элемент (он будет создан в эффекте)
    return instance.element || this.createPlaceholder();
  }

  /**
   * Рендеринг обычного элемента
   */
  private renderElement(config: ElementConfig, parentInstance?: ComponentInstance): HTMLElement {
    // Создаем контекст для директив
    const directiveContext: DirectiveContext = {
      state: parentInstance?.state || {},
      props: parentInstance?.props || {},
      instance: parentInstance || undefined
    };

    // Обрабатываем директивы
    const processedConfigs = directiveManager.processDirectives(config, directiveContext);
    
    if (processedConfigs.length === 0) {
      return this.createPlaceholder();
    }

    // Для простоты берем первый результат
    const processedConfig = processedConfigs[0];
    
    // Создаем HTML элемент
    const element = document.createElement(processedConfig.tag || 'div');
    this.stats.elementsCreated++;

    // Применяем свойства
    if (processedConfig.props) {
      this.applyProps(element, processedConfig.props);
    }

    // Привязываем события
    if (processedConfig.events) {
      this.attachEvents(element, processedConfig.events);
    }

    // Рендерим дочерние элементы
    if (processedConfig.children) {
      this.renderChildren(element, processedConfig.children, parentInstance);
    }

    return element;
  }

  /**
   * Рендеринг дочерних элементов
   */
  private renderChildren(
    parent: HTMLElement, 
    children: any[], 
    parentInstance?: ComponentInstance
  ): void {
    children.forEach(child => {
      if (typeof child === 'string') {
        // Текстовый узел
        const textNode = document.createTextNode(child);
        parent.appendChild(textNode);
      } else if (child && typeof child === 'object') {
        // Вложенный элемент или компонент
        const childElement = this.renderConfig(child, parentInstance);
        parent.appendChild(childElement);
      }
    });
  }

  /**
   * Применение свойств к элементу
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
          this.applyStyles(element, value as any);
          break;
        default:
          if (value !== undefined && value !== null) {
            element.setAttribute(key, String(value));
          }
          break;
      }
    }
  }

  /**
   * Применение стилей
   */
  private applyStyles(element: HTMLElement, styles: any): void {
    if (typeof styles === 'object') {
      for (const [property, value] of Object.entries(styles)) {
        if (value !== undefined && value !== null) {
          const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
          element.style.setProperty(cssProperty, String(value));
        }
      }
    } else if (typeof styles === 'string') {
      element.style.cssText = styles;
    }
  }

  /**
   * Привязка обработчиков событий
   */
  private attachEvents(element: HTMLElement, events: EventHandlers): void {
    for (const [eventType, handler] of Object.entries(events)) {
      element.addEventListener(eventType, handler);
      this.stats.eventsAttached++;
    }
  }

  /**
   * Размонтирование компонента
   */
  private unmountComponent(instance: ComponentInstance): void {
    if (instance.element) {
      // Удаляем элемент из DOM
      if (instance.element.parentNode) {
        instance.element.parentNode.removeChild(instance.element);
      }

      // Очищаем ссылки
      this.mountedInstances.delete(instance.element);
      this.instanceElements.delete(instance.id);
      
      // Размонтируем через реестр
      componentRegistry.unmountInstance(instance);
    }
  }

  /**
   * Создание элемента-заглушки
   */
  private createPlaceholder(): HTMLElement {
    const placeholder = document.createElement('span');
    placeholder.style.display = 'none';
    placeholder.setAttribute('data-placeholder', 'true');
    return placeholder;
  }

  /**
   * Очистка контейнера
   */
  private clearContainer(container: HTMLElement): void {
    // Размонтируем все компоненты в контейнере
    const instances = Array.from(this.mountedInstances.entries())
      .filter(([element]) => container.contains(element))
      .map(([, instance]) => instance);

    instances.forEach(instance => {
      componentRegistry.destroyInstance(instance.id);
    });

    // Очищаем содержимое
    container.innerHTML = '';
  }

  /**
   * Обновление существующего элемента новой конфигурацией
   */
  updateElement(element: HTMLElement, newConfig: ElementConfig): HTMLElement {
    const instance = this.mountedInstances.get(element);
    
    if (instance) {
      // Обновляем компонент
      if (newConfig.props) {
        componentRegistry.updateInstanceProps(instance, newConfig.props);
      }
      return instance.element || element;
    } else {
      // Обновляем обычный элемент
      const newElement = this.renderConfig(newConfig);
      if (element.parentNode) {
        element.parentNode.replaceChild(newElement, element);
      }
      return newElement;
    }
  }

  /**
   * Размонтирование элемента
   */
  unmount(element: HTMLElement): void {
    const instance = this.mountedInstances.get(element);
    
    if (instance) {
      // Размонтируем компонент
      componentRegistry.destroyInstance(instance.id);
    } else {
      // Удаляем обычный элемент
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
  }

  /**
   * Поиск компонента по элементу
   */
  getComponentInstance(element: HTMLElement): ComponentInstance | undefined {
    return this.mountedInstances.get(element);
  }

  /**
   * Получение статистики
   */
  getStats(): RenderStats {
    return { ...this.stats };
  }

  /**
   * Очистка всех ресурсов
   */
  cleanup(): void {
    // Размонтируем все компоненты
    this.mountedInstances.forEach(instance => {
      componentRegistry.destroyInstance(instance.id);
    });

    this.mountedInstances.clear();
    this.instanceElements.clear();
    
    // Сбрасываем статистику
    this.stats = {
      elementsCreated: 0,
      eventsAttached: 0,
      renderTime: 0
    };
  }

  /**
   * Принудительное обновление всех компонентов
   */
  forceUpdate(): void {
    scheduler.flushSync();
  }

  /**
   * Поиск элемента по ID
   */
  findElementById(element: HTMLElement, id: string): HTMLElement | null {
    return element.querySelector(`#${id}`);
  }

  /**
   * Поиск элементов по классу
   */
  findElementsByClass(element: HTMLElement, className: string): HTMLElement[] {
    return Array.from(element.querySelectorAll(`.${className}`));
  }
}