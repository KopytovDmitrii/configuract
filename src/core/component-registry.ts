import { Component, ComponentInstance, PropDefinition } from './types';
import { createReactive } from './reactive';

/**
 * Реестр компонентов фреймворка
 */
class ComponentRegistry {
  private components = new Map<string, Component>();
  private instances = new Map<string, ComponentInstance>();
  private instanceCounter = 0;

  /**
   * Регистрация компонента
   */
  register(component: Component): void {
    if (!component.name) {
      throw new Error('Компонент должен иметь имя');
    }

    if (this.components.has(component.name)) {
      console.warn(`Компонент "${component.name}" уже зарегистрирован. Перезаписываем.`);
    }

    // Валидация компонента
    this.validateComponent(component);

    this.components.set(component.name, component);
  }

  /**
   * Получение компонента по имени
   */
  get(name: string): Component | undefined {
    return this.components.get(name);
  }

  /**
   * Проверка существования компонента
   */
  has(name: string): boolean {
    return this.components.has(name);
  }

  /**
   * Удаление компонента из реестра
   */
  unregister(name: string): boolean {
    // Проверяем, нет ли активных экземпляров
    const activeInstances = Array.from(this.instances.values())
      .filter(instance => instance.component.name === name && instance.mounted);

    if (activeInstances.length > 0) {
      console.warn(
        `Попытка удаления компонента "${name}" с ${activeInstances.length} активными экземплярами`
      );
      return false;
    }

    return this.components.delete(name);
  }

  /**
   * Создание экземпляра компонента с полной поддержкой жизненного цикла
   */
  createInstance(componentName: string, props: any = {}): ComponentInstance {
    const component = this.get(componentName);
    if (!component) {
      throw new Error(`Компонент "${componentName}" не найден`);
    }

    // Генерируем уникальный ID
    const id = this.generateInstanceId();

    // Валидируем и обрабатываем props
    const validatedProps = this.validateAndNormalizeProps(props, component.props);

    // Вызываем хук beforeCreate
    try {
      component.beforeCreate?.();
    } catch (error) {
      console.error(`Ошибка в хуке beforeCreate компонента "${componentName}":`, error);
    }

    // Создаем локальное состояние
    const localState = component.state ? component.state() : {};
    const reactiveState = createReactive(localState);

    // Создаем computed свойства
    const computedProperties: Record<string, any> = {};
    if (component.computed) {
      for (const [key, getter] of Object.entries(component.computed)) {
        try {
          // Создаем простую реализацию computed для прямого вызова
          Object.defineProperty(computedProperties, key, {
            get() {
              return getter.call({ 
                state: reactiveState, 
                props: validatedProps,
                computed: computedProperties
              });
            },
            enumerable: true,
            configurable: true
          });
        } catch (error) {
          console.warn(`Ошибка при создании computed свойства "${key}":`, error);
          computedProperties[key] = undefined;
        }
      }
    }

    // Создаем экземпляр
    const instance: ComponentInstance = {
      id,
      component,
      props: validatedProps,
      state: reactiveState,
      computed: computedProperties,
      element: null,
      mounted: false,
      dependencies: new Set(),
      children: [],
      parent: null,
      pluginContext: {},
      cleanup: []
    };

    // Сохраняем экземпляр
    this.instances.set(id, instance);

    // Вызываем хук created
    try {
      component.created?.call(instance);
    } catch (error) {
      console.error(`Ошибка в хуке created компонента "${componentName}":`, error);
    }

    return instance;
  }

  /**
   * Получение экземпляра по ID
   */
  getInstance(id: string): ComponentInstance | undefined {
    return this.instances.get(id);
  }

  /**
   * Удаление экземпляра
   */
  destroyInstance(id: string): boolean {
    const instance = this.instances.get(id);
    if (!instance) {
      return false;
    }

    // Размонтируем если смонтирован
    if (instance.mounted && instance.element) {
      this.unmountInstance(instance);
    }

    // Вызываем хук destroyed
    try {
      instance.component.destroyed?.call(instance);
    } catch (error) {
      console.error(`Ошибка в хуке destroyed компонента "${instance.component.name}":`, error);
    }

    // Очищаем ссылки
    instance.dependencies.clear();
    instance.children.forEach(child => {
      child.parent = null;
    });

    return this.instances.delete(id);
  }

  /**
   * Монтирование экземпляра с полным жизненным циклом
   */
  mountInstance(instance: ComponentInstance, element: HTMLElement): void {
    if (instance.mounted) {
      console.warn(`Экземпляр ${instance.id} уже смонтирован`);
      return;
    }

    // Вызываем хук beforeMount
    try {
      instance.component.beforeMount?.call(instance);
    } catch (error) {
      console.error(`Ошибка в хуке beforeMount компонента "${instance.component.name}":`, error);
    }

    instance.element = element;
    instance.mounted = true;

    // Вызываем хук mounted
    try {
      instance.component.mounted?.call(instance);
    } catch (error) {
      console.error(`Ошибка в хуке mounted компонента "${instance.component.name}":`, error);
    }
  }

  /**
   * Размонтирование экземпляра с вызовом хуков
   */
  unmountInstance(instance: ComponentInstance): void {
    if (!instance.mounted) {
      return;
    }

    // Вызываем хук beforeDestroy
    try {
      instance.component.beforeDestroy?.call(instance);
    } catch (error) {
      console.error(`Ошибка в хуке beforeDestroy компонента "${instance.component.name}":`, error);
    }

    // Размонтируем дочерние компоненты
    instance.children.forEach(child => {
      this.unmountInstance(child);
    });

    // Очищаем ресурсы
    instance.cleanup.forEach(cleanupFn => {
      try {
        cleanupFn();
      } catch (error) {
        console.error('Ошибка при очистке ресурсов:', error);
      }
    });

    instance.element = null;
    instance.mounted = false;

    // Вызываем хук destroyed
    try {
      instance.component.destroyed?.call(instance);
    } catch (error) {
      console.error(`Ошибка в хуке destroyed компонента "${instance.component.name}":`, error);
    }
  }

  /**
   * Обновление props экземпляра с хуками жизненного цикла
   */
  updateInstanceProps(instance: ComponentInstance, newProps: any): void {
    const component = instance.component;
    const validatedProps = this.validateAndNormalizeProps(newProps, component.props);
    
    // Определяем изменившиеся props
    const changedProps: string[] = [];
    for (const key in validatedProps) {
      if (instance.props[key] !== validatedProps[key]) {
        changedProps.push(key);
      }
    }

    if (changedProps.length === 0) {
      return; // Ничего не изменилось
    }

    // Вызываем хук beforeUpdate
    try {
      component.beforeUpdate?.call(instance, changedProps, []);
    } catch (error) {
      console.error(`Ошибка в хуке beforeUpdate компонента "${component.name}":`, error);
    }

    // Обновляем props
    instance.props = validatedProps;

    // Вызываем хук updated
    try {
      component.updated?.call(instance, changedProps, []);
    } catch (error) {
      console.error(`Ошибка в хуке updated компонента "${component.name}":`, error);
    }
  }

  /**
   * Получение всех экземпляров компонента
   */
  getInstancesByComponent(componentName: string): ComponentInstance[] {
    return Array.from(this.instances.values())
      .filter(instance => instance.component.name === componentName);
  }

  /**
   * Получение всех смонтированных экземпляров
   */
  getMountedInstances(): ComponentInstance[] {
    return Array.from(this.instances.values())
      .filter(instance => instance.mounted);
  }

  /**
   * Очистка всех экземпляров
   */
  clearInstances(): void {
    // Размонтируем все экземпляры
    Array.from(this.instances.values()).forEach(instance => {
      this.destroyInstance(instance.id);
    });
  }

  /**
   * Очистка всего реестра
   */
  clear(): void {
    this.clearInstances();
    this.components.clear();
  }

  /**
   * Получение списка всех зарегистрированных компонентов
   */
  getRegisteredComponents(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * Получение статистики
   */
  getStats() {
    const mountedCount = this.getMountedInstances().length;
    return {
      registeredComponents: this.components.size,
      totalInstances: this.instances.size,
      mountedInstances: mountedCount,
      unmountedInstances: this.instances.size - mountedCount
    };
  }

  /**
   * Валидация определения компонента
   */
  private validateComponent(component: Component): void {
    if (typeof component.render !== 'function') {
      throw new Error(`Компонент "${component.name}" должен иметь функцию render`);
    }

    if (component.props) {
      for (const [propName, propDef] of Object.entries(component.props)) {
        if (!this.isValidPropDefinition(propDef)) {
          throw new Error(
            `Некорректное определение свойства "${propName}" в компоненте "${component.name}"`
          );
        }
      }
    }
  }

  /**
   * Проверка корректности определения свойства
   */
  private isValidPropDefinition(propDef: PropDefinition): boolean {
    const validTypes = ['string', 'number', 'boolean', 'object', 'array', 'function'];
    return validTypes.includes(propDef.type);
  }

  /**
   * Валидация и нормализация props
   */
  private validateAndNormalizeProps(props: any, propDefinitions?: any): any {
    if (!propDefinitions) {
      return props || {};
    }

    const result: any = {};

    // Обрабатываем каждое определение свойства
    for (const [propName, propDef] of Object.entries(propDefinitions as Record<string, PropDefinition>)) {
      const value = props[propName];

      // Проверяем обязательные свойства
      if (propDef.required && (value === undefined || value === null)) {
        throw new Error(`Обязательное свойство "${propName}" не передано`);
      }

      // Используем значение по умолчанию
      if (value === undefined) {
        result[propName] = propDef.default;
        continue;
      }

      // Валидация типа
      if (!this.validatePropType(value, propDef.type)) {
        throw new Error(
          `Свойство "${propName}" должно быть типа ${propDef.type}, получено ${typeof value}`
        );
      }

      // Кастомная валидация
      if (propDef.validator && !propDef.validator(value)) {
        throw new Error(`Свойство "${propName}" не прошло кастомную валидацию`);
      }

      result[propName] = value;
    }

    return result;
  }

  /**
   * Валидация типа свойства
   */
  private validatePropType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'function':
        return typeof value === 'function';
      case 'object':
        return value !== null && typeof value === 'object' && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Генерация уникального ID для экземпляра
   */
  private generateInstanceId(): string {
    return `component_${++this.instanceCounter}_${Date.now()}`;
  }
}

/**
 * Глобальный экземпляр реестра компонентов
 */
export const componentRegistry = new ComponentRegistry();

/**
 * Удобные функции для работы с реестром
 */

/**
 * Регистрация компонента
 */
export function registerComponent(component: Component): void {
  componentRegistry.register(component);
}

/**
 * Получение компонента
 */
export function getComponent(name: string): Component | undefined {
  return componentRegistry.get(name);
}

/**
 * Создание экземпляра компонента
 */
export function createComponentInstance(name: string, props?: any): ComponentInstance {
  return componentRegistry.createInstance(name, props);
}