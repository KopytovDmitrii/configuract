import { ElementConfig, ValidationResult, ValidationError, ElementProps, EventHandlers } from './types';

/**
 * Класс для валидации конфигурации элементов
 */
export class ConfigValidator {
  private validHtmlTags: Set<string>;
  private usedIds: Set<string>;

  constructor() {
    // Основные HTML теги, поддерживаемые фреймворком
    this.validHtmlTags = new Set([
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'button', 'input', 'form', 'label', 'textarea', 'select', 'option',
      'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
      'header', 'footer', 'main', 'section', 'article', 'nav',
      'strong', 'em', 'small', 'br', 'hr'
    ]);
    this.usedIds = new Set();
  }

  /**
   * Сбросить состояние валидатора (список использованных ID)
   */
  reset(): void {
    this.usedIds.clear();
  }

  /**
   * Валидация конфигурации элемента
   */
  validate(config: ElementConfig, path = ''): ValidationResult {
    const errors: ValidationError[] = [];

    // Валидация основной структуры
    if (!config || typeof config !== 'object') {
      errors.push({
        field: 'config',
        message: 'Конфигурация должна быть объектом',
        path,
      });
      return { isValid: false, errors };
    }

    // Валидация тега
    this.validateTag(config, errors, path);

    // Валидация свойств
    if (config.props) {
      this.validateProps(config.props, errors, path);
    }

    // Валидация дочерних элементов
    if (config.children) {
      this.validateChildren(config.children, errors, path);
    }

    // Валидация событий
    if (config.events) {
      this.validateEvents(config.events, errors, path);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Валидация HTML тега или компонента
   */
  private validateTag(config: ElementConfig, errors: ValidationError[], path: string): void {
    // Для компонентов поле tag не требуется, проверяем наличие component
    if (config.component) {
      // Это компонент - валидируем имя компонента
      if (typeof config.component !== 'string') {
        errors.push({
          field: 'component',
          message: 'Имя компонента должно быть строкой',
          path,
        });
      }
      return; // Для компонентов не требуется tag
    }
    
    // Для обычных элементов требуется tag
    if (!config.tag) {
      errors.push({
        field: 'tag',
        message: 'Поле tag является обязательным для элементов (или укажите component для компонентов)',
        path,
      });
      return;
    }

    if (typeof config.tag !== 'string') {
      errors.push({
        field: 'tag',
        message: 'Поле tag должно быть строкой',
        path,
      });
      return;
    }

    if (!this.validHtmlTags.has(config.tag.toLowerCase())) {
      errors.push({
        field: 'tag',
        message: `Неподдерживаемый HTML тег: ${config.tag}`,
        path,
      });
    }
  }

  /**
   * Валидация свойств элемента
   */
  private validateProps(props: ElementProps, errors: ValidationError[], path: string): void {
    if (typeof props !== 'object' || props === null) {
      errors.push({
        field: 'props',
        message: 'Свойства должны быть объектом',
        path,
      });
      return;
    }

    // Валидация класса
    if (props.class !== undefined) {
      if (typeof props.class !== 'string') {
        errors.push({
          field: 'props.class',
          message: 'Класс должен быть строкой',
          path,
        });
      }
    }

    // Валидация ID
    if (props.id !== undefined) {
      if (typeof props.id !== 'string') {
        errors.push({
          field: 'props.id',
          message: 'ID должен быть строкой',
          path,
        });
      } else {
        // Проверка на уникальность ID
        if (this.usedIds.has(props.id)) {
          errors.push({
            field: 'props.id',
            message: `Дублирующийся ID: ${props.id}`,
            path,
          });
        } else {
          this.usedIds.add(props.id);
        }
      }
    }

    // Валидация стилей
    if (props.style !== undefined) {
      if (typeof props.style !== 'object' || props.style === null) {
        errors.push({
          field: 'props.style',
          message: 'Стили должны быть объектом',
          path,
        });
      } else {
        this.validateStyles(props.style, errors, path);
      }
    }
  }

  /**
   * Валидация CSS стилей
   */
  private validateStyles(style: any, errors: ValidationError[], path: string): void {
    for (const [property, value] of Object.entries(style)) {
      if (typeof value !== 'string' && typeof value !== 'number') {
        errors.push({
          field: `props.style.${property}`,
          message: `Значение стиля должно быть строкой или числом, получено: ${typeof value}`,
          path,
        });
      }
    }
  }

  /**
   * Валидация дочерних элементов
   */
  private validateChildren(children: any, errors: ValidationError[], path: string): void {
    if (!Array.isArray(children)) {
      errors.push({
        field: 'children',
        message: 'Дочерние элементы должны быть массивом',
        path,
      });
      return;
    }

    children.forEach((child, index) => {
      const childPath = path ? `${path}.children[${index}]` : `children[${index}]`;

      if (typeof child === 'string') {
        // Текстовый узел - валидация не требуется
        return;
      }

      if (typeof child === 'object' && child !== null) {
        // Рекурсивная валидация дочернего элемента
        const childResult = this.validate(child, childPath);
        errors.push(...childResult.errors);
      } else {
        errors.push({
          field: 'children',
          message: `Дочерний элемент должен быть строкой или объектом конфигурации, получено: ${typeof child}`,
          path: childPath,
        });
      }
    });
  }

  /**
   * Валидация обработчиков событий
   */
  private validateEvents(events: EventHandlers, errors: ValidationError[], path: string): void {
    if (typeof events !== 'object' || events === null) {
      errors.push({
        field: 'events',
        message: 'События должны быть объектом',
        path,
      });
      return;
    }

    for (const [eventType, handler] of Object.entries(events)) {
      if (typeof handler !== 'function') {
        errors.push({
          field: `events.${eventType}`,
          message: `Обработчик события должен быть функцией, получено: ${typeof handler}`,
          path,
        });
      }

      // Проверка на валидные типы событий DOM
      if (!this.isValidEventType(eventType)) {
        errors.push({
          field: `events.${eventType}`,
          message: `Неподдерживаемый тип события: ${eventType}`,
          path,
        });
      }
    }
  }

  /**
   * Проверка валидности типа события DOM
   */
  private isValidEventType(eventType: string): boolean {
    const validDOMEvents = [
      'click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout',
      'mousemove', 'mouseenter', 'mouseleave',
      'keydown', 'keyup', 'keypress',
      'focus', 'blur', 'change', 'input', 'submit', 'reset',
      'load', 'unload', 'resize', 'scroll',
      'touchstart', 'touchend', 'touchmove', 'touchcancel'
    ];
    
    // Кастомные события фреймворка
    const customFrameworkEvents = [
      'mounted', 'unmounted'
    ];
    
    return validDOMEvents.includes(eventType) || customFrameworkEvents.includes(eventType);
  }

  /**
   * Получить список поддерживаемых HTML тегов
   */
  getSupportedTags(): string[] {
    return Array.from(this.validHtmlTags);
  }

  /**
   * Добавить поддержку нового HTML тега
   */
  addSupportedTag(tag: string): void {
    this.validHtmlTags.add(tag.toLowerCase());
  }

  /**
   * Удалить поддержку HTML тега
   */
  removeSupportedTag(tag: string): void {
    this.validHtmlTags.delete(tag.toLowerCase());
  }
}