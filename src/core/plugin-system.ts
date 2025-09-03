import { Plugin, PluginOptions, PluginContext, CustomDirective } from './types';

/**
 * Менеджер плагинов для фреймворка
 */
class PluginManager {
  private plugins = new Map<string, Plugin>();
  private installedPlugins = new Set<string>();
  private globalProperties = new Map<string, any>();
  private customDirectives = new Map<string, CustomDirective>();
  private frameworkInstance: any;

  constructor(framework: any) {
    this.frameworkInstance = framework;
  }

  /**
   * Установка плагина
   */
  use(plugin: Plugin, options?: PluginOptions): this {
    // Проверяем, не установлен ли уже плагин
    if (this.installedPlugins.has(plugin.name)) {
      console.warn(`Плагин "${plugin.name}" уже установлен`);
      return this;
    }

    // Проверяем зависимости
    if (plugin.dependencies) {
      for (const dependency of plugin.dependencies) {
        if (!this.installedPlugins.has(dependency)) {
          throw new Error(`Плагин "${plugin.name}" требует зависимость "${dependency}"`);
        }
      }
    }

    // Создаем контекст для плагина
    const context: PluginContext = {
      framework: this.frameworkInstance,
      options: options || {},
      globalProperties: Object.fromEntries(this.globalProperties),
      directives: this.customDirectives
    };

    try {
      // Вызываем функцию установки плагина
      plugin.install(this.frameworkInstance, context);
      
      // Регистрируем плагин как установленный
      this.plugins.set(plugin.name, plugin);
      this.installedPlugins.add(plugin.name);
      
      console.log(`Плагин "${plugin.name}" успешно установлен`);
    } catch (error) {
      console.error(`Ошибка при установке плагина "${plugin.name}":`, error);
      throw error;
    }

    return this;
  }

  /**
   * Удаление плагина (если это поддерживается)
   */
  uninstall(pluginName: string): boolean {
    if (!this.installedPlugins.has(pluginName)) {
      console.warn(`Плагин "${pluginName}" не установлен`);
      return false;
    }

    const plugin = this.plugins.get(pluginName);
    if (plugin && typeof (plugin as any).uninstall === 'function') {
      try {
        (plugin as any).uninstall(this.frameworkInstance);
        this.plugins.delete(pluginName);
        this.installedPlugins.delete(pluginName);
        console.log(`Плагин "${pluginName}" удален`);
        return true;
      } catch (error) {
        console.error(`Ошибка при удалении плагина "${pluginName}":`, error);
        return false;
      }
    }

    console.warn(`Плагин "${pluginName}" не поддерживает удаление`);
    return false;
  }

  /**
   * Проверка установки плагина
   */
  hasPlugin(pluginName: string): boolean {
    return this.installedPlugins.has(pluginName);
  }

  /**
   * Получение списка установленных плагинов
   */
  getInstalledPlugins(): string[] {
    return Array.from(this.installedPlugins);
  }

  /**
   * Добавление глобального свойства
   */
  addGlobalProperty(name: string, value: any): void {
    this.globalProperties.set(name, value);
  }

  /**
   * Получение глобального свойства
   */
  getGlobalProperty(name: string): any {
    return this.globalProperties.get(name);
  }

  /**
   * Регистрация пользовательской директивы
   */
  registerDirective(directive: CustomDirective): void {
    if (this.customDirectives.has(directive.name)) {
      console.warn(`Директива "${directive.name}" уже зарегистрирована`);
      return;
    }

    this.customDirectives.set(directive.name, directive);
    console.log(`Директива "${directive.name}" зарегистрирована`);
  }

  /**
   * Получение пользовательской директивы
   */
  getDirective(name: string): CustomDirective | undefined {
    return this.customDirectives.get(name);
  }

  /**
   * Получение всех пользовательских директив
   */
  getAllDirectives(): Map<string, CustomDirective> {
    return new Map(this.customDirectives);
  }

  /**
   * Очистка всех плагинов и ресурсов
   */
  cleanup(): void {
    // Попытаемся удалить все плагины
    for (const pluginName of this.installedPlugins) {
      this.uninstall(pluginName);
    }

    // Очищаем все коллекции
    this.plugins.clear();
    this.installedPlugins.clear();
    this.globalProperties.clear();
    this.customDirectives.clear();
  }
}

/**
 * Хелпер для создания простого плагина
 */
export function definePlugin(options: {
  name: string;
  version?: string;
  install: (framework: any, context: PluginContext) => void;
  uninstall?: (framework: any) => void;
  dependencies?: string[];
}): Plugin {
  return {
    name: options.name,
    version: options.version,
    install: options.install,
    dependencies: options.dependencies,
    ...(options.uninstall && { uninstall: options.uninstall })
  };
}

/**
 * Встроенные плагины для демонстрации
 */

/**
 * Плагин для логирования жизненного цикла компонентов
 */
const LifecycleLoggerPlugin = definePlugin({
  name: 'LifecycleLogger',
  version: '1.0.0',
  install(framework: any, context: PluginContext) {
    // Добавляем глобальное свойство для включения/выключения логирования
    context.globalProperties.set('$logLifecycle', context.options.enabled !== false);

    // Расширяем фреймворк методом для логирования
    framework.logLifecycle = (componentName: string, hook: string, data?: any) => {
      if (context.globalProperties.get('$logLifecycle')) {
        console.log(`[${componentName}] ${hook}`, data || '');
      }
    };
  }
});

/**
 * Плагин для валидации форм
 */
const FormValidationPlugin = definePlugin({
  name: 'FormValidation',
  version: '1.0.0',
  install(framework: any, context: PluginContext) {
    // Регистрируем директиву для валидации
    const validateDirective: CustomDirective = {
      name: 'validate',
      bind(el: HTMLElement, binding) {
        el.addEventListener('blur', () => {
          const validator = binding.value;
          if (typeof validator === 'function') {
            const isValid = validator((el as HTMLInputElement).value);
            el.classList.toggle('invalid', !isValid);
            el.classList.toggle('valid', isValid);
          }
        });
      }
    };

    context.directives.set('validate', validateDirective);

    // Добавляем глобальные валидаторы
    framework.validators = {
      required: (value: any) => !!value,
      email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      minLength: (min: number) => (value: string) => value.length >= min,
      maxLength: (max: number) => (value: string) => value.length <= max,
      pattern: (regex: RegExp) => (value: string) => regex.test(value)
    };
  }
});

/**
 * Плагин для интернационализации (i18n)
 */
const I18nPlugin = definePlugin({
  name: 'I18n',
  version: '1.0.0',
  install(framework: any, context: PluginContext) {
    const messages = context.options.messages || {};
    let currentLocale = context.options.locale || 'ru';

    // Добавляем глобальные методы для работы с переводами
    framework.t = (key: string, params?: Record<string, any>) => {
      const message = messages[currentLocale]?.[key] || key;
      
      if (params) {
        return Object.keys(params).reduce((msg, paramKey) => {
          return msg.replace(new RegExp(`{${paramKey}}`, 'g'), params[paramKey]);
        }, message);
      }
      
      return message;
    };

    framework.setLocale = (locale: string) => {
      currentLocale = locale;
    };

    framework.getLocale = () => currentLocale;

    // Регистрируем директиву для автоматического перевода текста
    const i18nDirective: CustomDirective = {
      name: 'i18n',
      bind(el: HTMLElement, binding) {
        const key = binding.value || el.textContent;
        if (key) {
          el.textContent = framework.t(key);
        }
      },
      update(el: HTMLElement, binding) {
        const key = binding.value || binding.expression;
        if (key) {
          el.textContent = framework.t(key);
        }
      }
    };

    context.directives.set('i18n', i18nDirective);
  }
});

/**
 * Плагин для управления состоянием (простой store)
 */
const StorePlugin = definePlugin({
  name: 'Store',
  version: '1.0.0',
  install(framework: any, context: PluginContext) {
    const initialState = context.options.state || {};
    const mutations = context.options.mutations || {};
    const actions = context.options.actions || {};

    // Создаем реактивное состояние
    const state = framework.reactive(initialState);
    
    const store = {
      state,
      
      commit(mutationName: string, payload?: any) {
        const mutation = mutations[mutationName];
        if (mutation) {
          mutation(state, payload);
        } else {
          console.warn(`Мутация "${mutationName}" не найдена`);
        }
      },

      dispatch(actionName: string, payload?: any) {
        const action = actions[actionName];
        if (action) {
          return action({ state, commit: this.commit, dispatch: this.dispatch }, payload);
        } else {
          console.warn(`Действие "${actionName}" не найдено`);
        }
      }
    };

    // Добавляем store в глобальные свойства
    framework.$store = store;
    context.globalProperties.set('$store', store);
  }
});

/**
 * Экспорт основного класса и встроенных плагинов
 */
export {
  PluginManager,
  LifecycleLoggerPlugin,
  FormValidationPlugin,
  I18nPlugin,
  StorePlugin
};