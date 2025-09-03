import { ElementConfig, ElementChild, DirectiveContext } from './types';

/**
 * Базовый класс для директив
 */
abstract class BaseDirective {
  abstract name: string;
  abstract process(config: ElementConfig, context: DirectiveContext): ElementConfig | ElementConfig[] | null;
}

/**
 * Директива условного рендеринга v-if
 */
class IfDirective extends BaseDirective {
  name = 'if';

  process(config: ElementConfig, context: DirectiveContext): ElementConfig | null {
    if (!config.if) {
      return config;
    }

    const condition = this.evaluateExpression(config.if, context);
    
    if (condition) {
      // Удаляем директиву из конфига и возвращаем элемент
      const { if: _, ...cleanConfig } = config;
      return cleanConfig;
    }

    return null; // Элемент не рендерится
  }

  /**
   * Безопасная оценка выражения
   */
  private evaluateExpression(expression: string, context: DirectiveContext): boolean {
    try {
      // Создаем функцию с доступом к state и props
      const func = new Function('state', 'props', `
        with(state) {
          with(props) {
            return ${expression};
          }
        }
      `);
      
      return Boolean(func(context.state, context.props));
    } catch (error) {
      console.warn('Ошибка в выражении v-if:', expression, error);
      return false;
    }
  }
}

/**
 * Директива рендеринга списков v-for
 */
class ForDirective extends BaseDirective {
  name = 'for';

  process(config: ElementConfig, context: DirectiveContext): ElementConfig[] {
    if (!config.for || !config.template) {
      return [config];
    }

    const { items, itemName, indexName } = this.parseForExpression(config.for);
    const itemsArray = this.evaluateExpression(items, context);

    if (!Array.isArray(itemsArray)) {
      console.warn('v-for требует массив:', items);
      return [];
    }

    return itemsArray.map((item, index) => {
      const itemContext: DirectiveContext = {
        ...context,
        state: {
          ...context.state,
          [itemName]: item,
          ...(indexName ? { [indexName]: index } : { [`${itemName}Index`]: index })
        }
      };

      // Обрабатываем шаблон для каждого элемента
      const processedTemplate = this.processTemplate(config.template!, itemContext);
      
      return {
        ...processedTemplate,
        key: config.key 
          ? this.evaluateExpression(String(config.key), itemContext) 
          : index
      };
    });
  }

  /**
   * Парсинг выражения v-for
   */
  private parseForExpression(expression: string): { 
    items: string, 
    itemName: string, 
    indexName?: string 
  } {
    // Поддерживаем синтаксис: "item in items" и "(item, index) in items"
    const withParentheses = expression.match(/\((\w+),\s*(\w+)\)\s+in\s+(.+)/);
    if (withParentheses) {
      return { 
        itemName: withParentheses[1], 
        indexName: withParentheses[2],
        items: withParentheses[3] 
      };
    }

    const simple = expression.match(/(\w+)\s+in\s+(.+)/);
    if (simple) {
      return { 
        itemName: simple[1], 
        items: simple[2] 
      };
    }

    throw new Error(`Неверный синтаксис v-for: "${expression}". Используйте: "item in items" или "(item, index) in items"`);
  }

  /**
   * Обработка шаблона для элемента списка
   */
  private processTemplate(template: ElementConfig, context: DirectiveContext): ElementConfig {
    // Рекурсивно обрабатываем шаблон, заменяя выражения
    const processedTemplate = JSON.parse(JSON.stringify(template));
    
    // Обрабатываем содержимое (дочерние элементы)
    if (processedTemplate.children) {
      processedTemplate.children = processedTemplate.children.map((child: ElementChild) => {
        if (typeof child === 'string') {
          return this.interpolateString(child, context);
        }
        return this.processTemplate(child, context);
      });
    }

    // Обрабатываем свойства
    if (processedTemplate.props) {
      Object.keys(processedTemplate.props).forEach(key => {
        const value = processedTemplate.props[key];
        if (typeof value === 'string') {
          processedTemplate.props[key] = this.interpolateString(value, context);
        }
      });
    }

    return processedTemplate;
  }

  /**
   * Интерполяция строк с выражениями {{}}
   */
  private interpolateString(str: string, context: DirectiveContext): string {
    return str.replace(/\{\{(.+?)\}\}/g, (match, expression) => {
      try {
        const result = this.evaluateExpression(expression.trim(), context);
        return String(result);
      } catch (error) {
        console.warn('Ошибка в интерполяции:', expression, error);
        return match;
      }
    });
  }

  /**
   * Оценка выражения
   */
  private evaluateExpression(expression: string, context: DirectiveContext): any {
    try {
      const func = new Function('state', 'props', `
        with(state) {
          with(props) {
            return ${expression};
          }
        }
      `);
      
      return func(context.state, context.props);
    } catch (error) {
      console.warn('Ошибка в выражении v-for:', expression, error);
      return null;
    }
  }
}

/**
 * Директива показа/скрытия элемента v-show
 */
class ShowDirective extends BaseDirective {
  name = 'show';

  process(config: ElementConfig, context: DirectiveContext): ElementConfig {
    if (config.show === undefined) {
      return config;
    }

    const shouldShow = typeof config.show === 'boolean' 
      ? config.show 
      : this.evaluateExpression(String(config.show), context);

    // Модифицируем стили для показа/скрытия
    const processedConfig = { ...config };
    
    if (!processedConfig.props) {
      processedConfig.props = {};
    }

    if (!processedConfig.props.style) {
      processedConfig.props.style = {};
    }

    if (typeof processedConfig.props.style === 'object') {
      processedConfig.props.style.display = shouldShow ? '' : 'none';
    }

    // Удаляем директиву из конфига
    const { show: _, ...cleanConfig } = processedConfig;
    return cleanConfig;
  }

  private evaluateExpression(expression: string, context: DirectiveContext): boolean {
    try {
      const func = new Function('state', 'props', `
        with(state) {
          with(props) {
            return ${expression};
          }
        }
      `);
      
      return Boolean(func(context.state, context.props));
    } catch (error) {
      console.warn('Ошибка в выражении v-show:', expression, error);
      return false;
    }
  }
}

/**
 * Директива двунаправленной привязки данных v-model
 * Поддерживает все основные типы форм: input, textarea, select
 */
class ModelDirective extends BaseDirective {
  name = 'model';
  private static modelBindings = new Map<HTMLElement, { path: string; context: DirectiveContext }>();

  process(config: ElementConfig, context: DirectiveContext): ElementConfig {
    if (!config.model) {
      return config;
    }

    const processedConfig = { ...config };
    
    // Инициализируем props и events если их нет
    if (!processedConfig.props) {
      processedConfig.props = {};
    }
    if (!processedConfig.events) {
      processedConfig.events = {};
    }

    // Определяем значение и обработчик в зависимости от типа элемента
    const tag = config.tag?.toLowerCase();
    
    switch (tag) {
      case 'input':
        this.handleInputModel(processedConfig, context);
        break;
      case 'textarea':
        this.handleTextareaModel(processedConfig, context);
        break;
      case 'select':
        this.handleSelectModel(processedConfig, context);
        break;
      default:
        console.warn(`v-model не поддерживается для элемента ${tag}`);
    }

    // Добавляем обработчик для отслеживания элемента после рендеринга
    const originalMounted = processedConfig.events?.mounted;
    processedConfig.events = processedConfig.events || {};
    processedConfig.events.mounted = (element: HTMLElement) => {
      // Сохраняем привязку для последующих обновлений
      ModelDirective.modelBindings.set(element, {
        path: config.model!,
        context
      });
      
      if (originalMounted) {
        originalMounted(element);
      }
    };

    // Удаляем директиву из конфига
    const { model: _, ...cleanConfig } = processedConfig;
    return cleanConfig;
  }

  /**
   * Обработка v-model для input
   */
  private handleInputModel(config: ElementConfig, context: DirectiveContext): void {
    const propertyPath = config.model!;
    const currentValue = this.getPropertyValue(propertyPath, context);
    const inputType = config.props?.type || 'text';

    switch (inputType) {
      case 'checkbox':
        config.props!.checked = currentValue;
        config.events!.change = (event: Event) => {
          const target = event.target as HTMLInputElement;
          this.setPropertyValue(propertyPath, target.checked, context);
        };
        break;
      
      case 'radio':
        config.props!.checked = currentValue === config.props?.value;
        config.events!.change = (event: Event) => {
          const target = event.target as HTMLInputElement;
          if (target.checked) {
            this.setPropertyValue(propertyPath, target.value, context);
          }
        };
        break;
      
      default:
        config.props!.value = currentValue;
        config.events!.input = (event: Event) => {
          const target = event.target as HTMLInputElement;
          this.setPropertyValue(propertyPath, target.value, context);
        };
    }
  }

  /**
   * Обработка v-model для textarea
   */
  private handleTextareaModel(config: ElementConfig, context: DirectiveContext): void {
    const propertyPath = config.model!;
    const currentValue = this.getPropertyValue(propertyPath, context);

    config.props!.value = currentValue;
    config.events!.input = (event: Event) => {
      const target = event.target as HTMLTextAreaElement;
      this.setPropertyValue(propertyPath, target.value, context);
    };
  }

  /**
   * Обработка v-model для select
   */
  private handleSelectModel(config: ElementConfig, context: DirectiveContext): void {
    const propertyPath = config.model!;
    const currentValue = this.getPropertyValue(propertyPath, context);

    config.props!.value = currentValue;
    config.events!.change = (event: Event) => {
      const target = event.target as HTMLSelectElement;
      this.setPropertyValue(propertyPath, target.value, context);
    };
  }

  /**
   * Получение значения свойства по пути
   */
  private getPropertyValue(path: string, context: DirectiveContext): any {
    try {
      const func = new Function('state', 'props', `
        with(state) {
          with(props) {
            return ${path};
          }
        }
      `);
      
      return func(context.state, context.props);
    } catch (error) {
      console.warn('Ошибка при получении значения v-model:', path, error);
      return '';
    }
  }

  /**
   * Установка значения свойства по пути с поддержкой реактивности
   */
  private setPropertyValue(path: string, value: any, context: DirectiveContext): void {
    try {
      // Поддерживаем различные пути: property, nested.property, array[0].property
      const pathParts = this.parsePath(path);
      let obj = context.state;
      
      // Навигируемся до последнего объекта
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (part.type === 'property') {
          obj = obj[part.key];
        } else if (part.type === 'index') {
          obj = obj[part.key];
        }
      }
      
      // Устанавливаем значение
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart.type === 'property') {
        obj[lastPart.key] = value;
      } else if (lastPart.type === 'index') {
        obj[lastPart.key] = value;
      }
      
      // Запускаем обновление интерфейса через планировщик
      this.triggerUpdate(context);
      
    } catch (error) {
      console.warn('Ошибка при установке значения v-model:', path, error);
    }
  }
  
  /**
   * Парсинг пути для поддержки сложных выражений
   */
  private parsePath(path: string): Array<{ type: 'property' | 'index'; key: string | number }> {
    const parts: Array<{ type: 'property' | 'index'; key: string | number }> = [];
    
    // Упрощенный парсер для основных случаев
    const segments = path.split('.');
    
    for (const segment of segments) {
      const arrayMatch = segment.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        parts.push({ type: 'property', key: arrayMatch[1] });
        parts.push({ type: 'index', key: parseInt(arrayMatch[2]) });
      } else {
        parts.push({ type: 'property', key: segment });
      }
    }
    
    return parts;
  }
  
  /**
   * Запуск обновления через планировщик
   */
  private triggerUpdate(context: DirectiveContext): void {
    // Импортируем планировщик динамически чтобы избежать циклических зависимостей
    import('./scheduler').then(({ scheduler }) => {
      scheduler.scheduleUpdate(() => {
        // Обновление будет обработано планировщиком
      });
    }).catch(error => {
      console.warn('Ошибка при запуске обновления:', error);
    });
  }
  
  /**
   * Статический метод для обновления всех привязанных элементов
   */
  static updateBoundElements(): void {
    for (const [element, binding] of ModelDirective.modelBindings) {
      try {
        const currentValue = new ModelDirective().getPropertyValue(binding.path, binding.context);
        
        if (element instanceof HTMLInputElement) {
          if (element.type === 'checkbox' || element.type === 'radio') {
            element.checked = element.type === 'checkbox' ? currentValue : (currentValue === element.value);
          } else {
            element.value = String(currentValue || '');
          }
        } else if (element instanceof HTMLTextAreaElement) {
          element.value = String(currentValue || '');
        } else if (element instanceof HTMLSelectElement) {
          element.value = String(currentValue || '');
        }
      } catch (error) {
        console.warn('Ошибка при обновлении привязанного элемента:', error);
      }
    }
  }
}

/**
 * Менеджер директив
 */
export class DirectiveManager {
  private directives = new Map<string, BaseDirective>();

  constructor() {
    // Регистрируем встроенные директивы
    this.register(new IfDirective());
    this.register(new ForDirective());
    this.register(new ShowDirective());
    this.register(new ModelDirective());
  }

  /**
   * Регистрация новой директивы
   */
  register(directive: BaseDirective): void {
    this.directives.set(directive.name, directive);
  }

  /**
   * Обработка всех директив в конфигурации
   */
  processDirectives(config: ElementConfig, context: DirectiveContext): ElementConfig[] {
    let results: ElementConfig[] = [config];

    // Обрабатываем директивы в определенном порядке
    const directiveOrder = ['if', 'for', 'show', 'model'];

    for (const directiveName of directiveOrder) {
      const directive = this.directives.get(directiveName);
      if (!directive) continue;

      const newResults: ElementConfig[] = [];

      for (const configItem of results) {
        const processed = directive.process(configItem, context);
        
        if (processed) {
          if (Array.isArray(processed)) {
            newResults.push(...processed);
          } else {
            newResults.push(processed);
          }
        }
      }

      results = newResults;
    }

    return results;
  }

  /**
   * Проверка наличия директив в конфигурации
   */
  hasDirectives(config: ElementConfig): boolean {
    return !!(config.if || config.for || config.show !== undefined || config.model);
  }
}

/**
 * Глобальный экземпляр менеджера директив
 */
export const directiveManager = new DirectiveManager();

// Экспорт отдельных директив для прямого использования
export { IfDirective, ForDirective, ShowDirective, ModelDirective };