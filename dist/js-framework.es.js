class ConfigValidator {
  constructor() {
    this.validHtmlTags = /* @__PURE__ */ new Set([
      "div",
      "span",
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "button",
      "input",
      "form",
      "label",
      "textarea",
      "select",
      "option",
      "a",
      "img",
      "ul",
      "ol",
      "li",
      "table",
      "tr",
      "td",
      "th",
      "header",
      "footer",
      "main",
      "section",
      "article",
      "nav",
      "strong",
      "em",
      "small",
      "br",
      "hr"
    ]);
    this.usedIds = /* @__PURE__ */ new Set();
  }
  /**
   * Сбросить состояние валидатора (список использованных ID)
   */
  reset() {
    this.usedIds.clear();
  }
  /**
   * Валидация конфигурации элемента
   */
  validate(config, path = "") {
    const errors = [];
    if (!config || typeof config !== "object") {
      errors.push({
        field: "config",
        message: "Конфигурация должна быть объектом",
        path
      });
      return { isValid: false, errors };
    }
    this.validateTag(config, errors, path);
    if (config.props) {
      this.validateProps(config.props, errors, path);
    }
    if (config.children) {
      this.validateChildren(config.children, errors, path);
    }
    if (config.events) {
      this.validateEvents(config.events, errors, path);
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  /**
   * Валидация HTML тега или компонента
   */
  validateTag(config, errors, path) {
    if (config.component) {
      if (typeof config.component !== "string") {
        errors.push({
          field: "component",
          message: "Имя компонента должно быть строкой",
          path
        });
      }
      return;
    }
    if (!config.tag) {
      errors.push({
        field: "tag",
        message: "Поле tag является обязательным для элементов (или укажите component для компонентов)",
        path
      });
      return;
    }
    if (typeof config.tag !== "string") {
      errors.push({
        field: "tag",
        message: "Поле tag должно быть строкой",
        path
      });
      return;
    }
    if (!this.validHtmlTags.has(config.tag.toLowerCase())) {
      errors.push({
        field: "tag",
        message: `Неподдерживаемый HTML тег: ${config.tag}`,
        path
      });
    }
  }
  /**
   * Валидация свойств элемента
   */
  validateProps(props, errors, path) {
    if (typeof props !== "object" || props === null) {
      errors.push({
        field: "props",
        message: "Свойства должны быть объектом",
        path
      });
      return;
    }
    if (props.class !== void 0) {
      if (typeof props.class !== "string") {
        errors.push({
          field: "props.class",
          message: "Класс должен быть строкой",
          path
        });
      }
    }
    if (props.id !== void 0) {
      if (typeof props.id !== "string") {
        errors.push({
          field: "props.id",
          message: "ID должен быть строкой",
          path
        });
      } else {
        if (this.usedIds.has(props.id)) {
          errors.push({
            field: "props.id",
            message: `Дублирующийся ID: ${props.id}`,
            path
          });
        } else {
          this.usedIds.add(props.id);
        }
      }
    }
    if (props.style !== void 0) {
      if (typeof props.style !== "object" || props.style === null) {
        errors.push({
          field: "props.style",
          message: "Стили должны быть объектом",
          path
        });
      } else {
        this.validateStyles(props.style, errors, path);
      }
    }
  }
  /**
   * Валидация CSS стилей
   */
  validateStyles(style, errors, path) {
    for (const [property, value] of Object.entries(style)) {
      if (typeof value !== "string" && typeof value !== "number") {
        errors.push({
          field: `props.style.${property}`,
          message: `Значение стиля должно быть строкой или числом, получено: ${typeof value}`,
          path
        });
      }
    }
  }
  /**
   * Валидация дочерних элементов
   */
  validateChildren(children, errors, path) {
    if (!Array.isArray(children)) {
      errors.push({
        field: "children",
        message: "Дочерние элементы должны быть массивом",
        path
      });
      return;
    }
    children.forEach((child, index) => {
      const childPath = path ? `${path}.children[${index}]` : `children[${index}]`;
      if (typeof child === "string") {
        return;
      }
      if (typeof child === "object" && child !== null) {
        const childResult = this.validate(child, childPath);
        errors.push(...childResult.errors);
      } else {
        errors.push({
          field: "children",
          message: `Дочерний элемент должен быть строкой или объектом конфигурации, получено: ${typeof child}`,
          path: childPath
        });
      }
    });
  }
  /**
   * Валидация обработчиков событий
   */
  validateEvents(events, errors, path) {
    if (typeof events !== "object" || events === null) {
      errors.push({
        field: "events",
        message: "События должны быть объектом",
        path
      });
      return;
    }
    for (const [eventType, handler] of Object.entries(events)) {
      if (typeof handler !== "function") {
        errors.push({
          field: `events.${eventType}`,
          message: `Обработчик события должен быть функцией, получено: ${typeof handler}`,
          path
        });
      }
      if (!this.isValidEventType(eventType)) {
        errors.push({
          field: `events.${eventType}`,
          message: `Неподдерживаемый тип события: ${eventType}`,
          path
        });
      }
    }
  }
  /**
   * Проверка валидности типа события DOM
   */
  isValidEventType(eventType) {
    const validDOMEvents = [
      "click",
      "dblclick",
      "mousedown",
      "mouseup",
      "mouseover",
      "mouseout",
      "mousemove",
      "mouseenter",
      "mouseleave",
      "keydown",
      "keyup",
      "keypress",
      "focus",
      "blur",
      "change",
      "input",
      "submit",
      "reset",
      "load",
      "unload",
      "resize",
      "scroll",
      "touchstart",
      "touchend",
      "touchmove",
      "touchcancel"
    ];
    const customFrameworkEvents = [
      "mounted",
      "unmounted"
    ];
    return validDOMEvents.includes(eventType) || customFrameworkEvents.includes(eventType);
  }
  /**
   * Получить список поддерживаемых HTML тегов
   */
  getSupportedTags() {
    return Array.from(this.validHtmlTags);
  }
  /**
   * Добавить поддержку нового HTML тега
   */
  addSupportedTag(tag) {
    this.validHtmlTags.add(tag.toLowerCase());
  }
  /**
   * Удалить поддержку HTML тега
   */
  removeSupportedTag(tag) {
    this.validHtmlTags.delete(tag.toLowerCase());
  }
}
class HTMLRenderer {
  constructor(options = {}) {
    this.eventListeners = /* @__PURE__ */ new Map();
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
  render(config, container) {
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
      console.error("Ошибка рендеринга:", error);
      throw error;
    }
  }
  /**
   * Создание DOM элемента из конфигурации
   */
  createElement(config) {
    const tag = config.tag || "div";
    const element = document.createElement(tag);
    this.stats.elementsCreated++;
    if (config.props) {
      this.applyProps(element, config.props);
    }
    if (config.events) {
      this.attachEvents(element, config.events);
    }
    if (config.children) {
      this.renderChildren(element, config.children);
    }
    return element;
  }
  /**
   * Применение свойств к DOM элементу
   */
  applyProps(element, props) {
    for (const [key, value] of Object.entries(props)) {
      switch (key) {
        case "class":
          element.className = value;
          break;
        case "id":
          element.id = value;
          break;
        case "style":
          this.applyStyles(element, value);
          break;
        default:
          if (value !== void 0 && value !== null) {
            element.setAttribute(key, String(value));
          }
          break;
      }
    }
  }
  /**
   * Применение CSS стилей к элементу
   */
  applyStyles(element, styles) {
    for (const [property, value] of Object.entries(styles)) {
      if (value !== void 0 && value !== null) {
        const cssProperty = property.replace(/([A-Z])/g, "-$1").toLowerCase();
        element.style.setProperty(cssProperty, String(value));
      }
    }
  }
  /**
   * Привязка обработчиков событий к элементу
   */
  attachEvents(element, events) {
    const listeners = [];
    for (const [eventType, handler] of Object.entries(events)) {
      if (!handler) continue;
      if (eventType === "mounted" || eventType === "unmounted") {
        continue;
      }
      const listenerRecord = {
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
  renderChildren(parent, children) {
    children.forEach((child) => {
      if (typeof child === "string") {
        const textNode = document.createTextNode(child);
        parent.appendChild(textNode);
      } else if (child && typeof child === "object" && child.tag) {
        const childElement = this.createElement(child);
        parent.appendChild(childElement);
      } else {
        console.warn("Некорректный дочерний элемент:", child);
      }
    });
  }
  /**
   * Размонтирование элемента с очисткой ресурсов
   */
  unmount(element) {
    this.cleanupEventListeners(element);
    const children = Array.from(element.children);
    children.forEach((child) => {
      if (child instanceof HTMLElement) {
        this.unmount(child);
      }
    });
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
  /**
   * Очистка обработчиков событий для элемента
   */
  cleanupEventListeners(element) {
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
  update(element, newConfig) {
    const parent = element.parentNode;
    if (!parent) {
      throw new Error("Элемент не имеет родителя для обновления");
    }
    const newElement = this.createElement(newConfig);
    parent.replaceChild(newElement, element);
    this.unmount(element);
    return newElement;
  }
  /**
   * Получение статистики рендеринга
   */
  getStats() {
    return { ...this.stats };
  }
  /**
   * Сброс статистики рендеринга
   */
  resetStats() {
    this.stats = {
      elementsCreated: 0,
      eventsAttached: 0,
      renderTime: 0
    };
  }
  /**
   * Получение количества привязанных обработчиков событий
   */
  getEventListenersCount() {
    let count = 0;
    this.eventListeners.forEach((listeners) => {
      count += listeners.length;
    });
    return count;
  }
  /**
   * Создание контекста рендеринга
   */
  createRenderContext(element, config, parent) {
    return {
      element,
      config,
      ...parent && { parentContext: parent }
    };
  }
  /**
   * Поиск элемента по ID в рендереном дереве
   */
  findElementById(root, id) {
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
  findElementsByClass(root, className) {
    const result = [];
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
  cleanup() {
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ type, handler }) => {
        element.removeEventListener(type, handler);
      });
    });
    this.eventListeners.clear();
    this.resetStats();
  }
}
let activeEffect;
const effectStack = [];
const targetMap = /* @__PURE__ */ new WeakMap();
const reactiveMap = /* @__PURE__ */ new WeakMap();
const originalMap = /* @__PURE__ */ new WeakMap();
function createReactive(target, options = {}) {
  if (reactiveMap.has(target)) {
    return reactiveMap.get(target);
  }
  const proxy = new Proxy(target, {
    get(obj, prop, receiver) {
      track(target, prop);
      const value = Reflect.get(obj, prop, receiver);
      if (options.deep !== false && typeof value === "object" && value !== null) {
        return createReactive(value, options);
      }
      if (options.debuggerOptions?.onTrack) {
        options.debuggerOptions.onTrack({
          type: "get",
          target: obj,
          key: prop,
          newValue: value
        });
      }
      return value;
    },
    set(obj, prop, value, receiver) {
      const oldValue = obj[prop];
      const hadKey = Object.prototype.hasOwnProperty.call(obj, prop);
      const result = Reflect.set(obj, prop, value, receiver);
      if (!hadKey) {
        trigger(target, prop, "add");
      } else if (oldValue !== value) {
        trigger(target, prop, "set");
      }
      if (options.debuggerOptions?.onTrigger) {
        options.debuggerOptions.onTrigger({
          type: hadKey ? "set" : "add",
          target: obj,
          key: prop,
          newValue: value,
          oldValue
        });
      }
      return result;
    },
    deleteProperty(obj, prop) {
      const hadKey = Object.prototype.hasOwnProperty.call(obj, prop);
      const oldValue = obj[prop];
      const result = Reflect.deleteProperty(obj, prop);
      if (result && hadKey) {
        trigger(target, prop, "delete");
        if (options.debuggerOptions?.onTrigger) {
          options.debuggerOptions.onTrigger({
            type: "delete",
            target: obj,
            key: prop,
            oldValue
          });
        }
      }
      return result;
    }
  });
  reactiveMap.set(target, proxy);
  originalMap.set(proxy, target);
  return proxy;
}
function track(target, key) {
  if (!activeEffect || !shouldTrack) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, dep = { key: String(key), effects: /* @__PURE__ */ new Set() });
  }
  dep.effects.add(activeEffect);
  activeEffect.deps.add(dep);
}
function trigger(target, key, type, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const effects = /* @__PURE__ */ new Set();
  const dep = depsMap.get(key);
  if (dep) {
    dep.effects.forEach((effect2) => {
      if (effect2 !== activeEffect) {
        effects.add(effect2);
      }
    });
  }
  if (type === "add" || type === "delete") {
    if (Array.isArray(target)) {
      const lengthDep = depsMap.get("length");
      if (lengthDep) {
        lengthDep.effects.forEach((effect2) => {
          if (effect2 !== activeEffect) {
            effects.add(effect2);
          }
        });
      }
    }
  }
  effects.forEach((effect2) => {
    if (effect2.options?.scheduler) {
      effect2.options.scheduler(effect2);
    } else {
      effect2.fn();
    }
  });
}
let shouldTrack = true;
function pauseTracking() {
  shouldTrack = false;
}
function enableTracking() {
  shouldTrack = true;
}
function effect(fn, options = {}) {
  const effectFn = {
    fn,
    active: true,
    deps: /* @__PURE__ */ new Set(),
    options
  };
  if (!options.lazy) {
    runEffect$1(effectFn);
  }
  return effectFn;
}
function runEffect$1(effect2) {
  if (!effect2.active) {
    return effect2.fn();
  }
  cleanupEffect(effect2);
  try {
    effectStack.push(effect2);
    activeEffect = effect2;
    return effect2.fn();
  } finally {
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
  }
}
function cleanupEffect(effect2) {
  effect2.deps.forEach((dep) => {
    dep.effects.delete(effect2);
  });
  effect2.deps.clear();
}
function stop(effect2) {
  if (effect2.active) {
    cleanupEffect(effect2);
    effect2.active = false;
  }
}
function isReactive(value) {
  return originalMap.has(value);
}
function toRaw(observed) {
  const original = originalMap.get(observed);
  return original ? original : observed;
}
function shallowReactive(target) {
  return createReactive(target, { deep: false });
}
class ComponentRegistry {
  constructor() {
    this.components = /* @__PURE__ */ new Map();
    this.instances = /* @__PURE__ */ new Map();
    this.instanceCounter = 0;
  }
  /**
   * Регистрация компонента
   */
  register(component) {
    if (!component.name) {
      throw new Error("Компонент должен иметь имя");
    }
    if (this.components.has(component.name)) {
      console.warn(`Компонент "${component.name}" уже зарегистрирован. Перезаписываем.`);
    }
    this.validateComponent(component);
    this.components.set(component.name, component);
  }
  /**
   * Получение компонента по имени
   */
  get(name) {
    return this.components.get(name);
  }
  /**
   * Проверка существования компонента
   */
  has(name) {
    return this.components.has(name);
  }
  /**
   * Удаление компонента из реестра
   */
  unregister(name) {
    const activeInstances = Array.from(this.instances.values()).filter((instance) => instance.component.name === name && instance.mounted);
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
  createInstance(componentName, props = {}) {
    const component = this.get(componentName);
    if (!component) {
      throw new Error(`Компонент "${componentName}" не найден`);
    }
    const id = this.generateInstanceId();
    const validatedProps = this.validateAndNormalizeProps(props, component.props);
    try {
      component.beforeCreate?.();
    } catch (error) {
      console.error(`Ошибка в хуке beforeCreate компонента "${componentName}":`, error);
    }
    const localState = component.state ? component.state() : {};
    const reactiveState = createReactive(localState);
    const computedProperties = {};
    if (component.computed) {
      for (const [key, getter] of Object.entries(component.computed)) {
        try {
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
          computedProperties[key] = void 0;
        }
      }
    }
    const instance = {
      id,
      component,
      props: validatedProps,
      state: reactiveState,
      computed: computedProperties,
      element: null,
      mounted: false,
      dependencies: /* @__PURE__ */ new Set(),
      children: [],
      parent: null,
      pluginContext: {},
      cleanup: []
    };
    this.instances.set(id, instance);
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
  getInstance(id) {
    return this.instances.get(id);
  }
  /**
   * Удаление экземпляра
   */
  destroyInstance(id) {
    const instance = this.instances.get(id);
    if (!instance) {
      return false;
    }
    if (instance.mounted && instance.element) {
      this.unmountInstance(instance);
    }
    try {
      instance.component.destroyed?.call(instance);
    } catch (error) {
      console.error(`Ошибка в хуке destroyed компонента "${instance.component.name}":`, error);
    }
    instance.dependencies.clear();
    instance.children.forEach((child) => {
      child.parent = null;
    });
    return this.instances.delete(id);
  }
  /**
   * Монтирование экземпляра с полным жизненным циклом
   */
  mountInstance(instance, element) {
    if (instance.mounted) {
      console.warn(`Экземпляр ${instance.id} уже смонтирован`);
      return;
    }
    try {
      instance.component.beforeMount?.call(instance);
    } catch (error) {
      console.error(`Ошибка в хуке beforeMount компонента "${instance.component.name}":`, error);
    }
    instance.element = element;
    instance.mounted = true;
    try {
      instance.component.mounted?.call(instance);
    } catch (error) {
      console.error(`Ошибка в хуке mounted компонента "${instance.component.name}":`, error);
    }
  }
  /**
   * Размонтирование экземпляра с вызовом хуков
   */
  unmountInstance(instance) {
    if (!instance.mounted) {
      return;
    }
    try {
      instance.component.beforeDestroy?.call(instance);
    } catch (error) {
      console.error(`Ошибка в хуке beforeDestroy компонента "${instance.component.name}":`, error);
    }
    instance.children.forEach((child) => {
      this.unmountInstance(child);
    });
    instance.cleanup.forEach((cleanupFn) => {
      try {
        cleanupFn();
      } catch (error) {
        console.error("Ошибка при очистке ресурсов:", error);
      }
    });
    instance.element = null;
    instance.mounted = false;
    try {
      instance.component.destroyed?.call(instance);
    } catch (error) {
      console.error(`Ошибка в хуке destroyed компонента "${instance.component.name}":`, error);
    }
  }
  /**
   * Обновление props экземпляра с хуками жизненного цикла
   */
  updateInstanceProps(instance, newProps) {
    const component = instance.component;
    const validatedProps = this.validateAndNormalizeProps(newProps, component.props);
    const changedProps = [];
    for (const key in validatedProps) {
      if (instance.props[key] !== validatedProps[key]) {
        changedProps.push(key);
      }
    }
    if (changedProps.length === 0) {
      return;
    }
    try {
      component.beforeUpdate?.call(instance, changedProps, []);
    } catch (error) {
      console.error(`Ошибка в хуке beforeUpdate компонента "${component.name}":`, error);
    }
    instance.props = validatedProps;
    try {
      component.updated?.call(instance, changedProps, []);
    } catch (error) {
      console.error(`Ошибка в хуке updated компонента "${component.name}":`, error);
    }
  }
  /**
   * Получение всех экземпляров компонента
   */
  getInstancesByComponent(componentName) {
    return Array.from(this.instances.values()).filter((instance) => instance.component.name === componentName);
  }
  /**
   * Получение всех смонтированных экземпляров
   */
  getMountedInstances() {
    return Array.from(this.instances.values()).filter((instance) => instance.mounted);
  }
  /**
   * Очистка всех экземпляров
   */
  clearInstances() {
    Array.from(this.instances.values()).forEach((instance) => {
      this.destroyInstance(instance.id);
    });
  }
  /**
   * Очистка всего реестра
   */
  clear() {
    this.clearInstances();
    this.components.clear();
  }
  /**
   * Получение списка всех зарегистрированных компонентов
   */
  getRegisteredComponents() {
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
  validateComponent(component) {
    if (typeof component.render !== "function") {
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
  isValidPropDefinition(propDef) {
    const validTypes = ["string", "number", "boolean", "object", "array", "function"];
    return validTypes.includes(propDef.type);
  }
  /**
   * Валидация и нормализация props
   */
  validateAndNormalizeProps(props, propDefinitions) {
    if (!propDefinitions) {
      return props || {};
    }
    const result = {};
    for (const [propName, propDef] of Object.entries(propDefinitions)) {
      const value = props[propName];
      if (propDef.required && (value === void 0 || value === null)) {
        throw new Error(`Обязательное свойство "${propName}" не передано`);
      }
      if (value === void 0) {
        result[propName] = propDef.default;
        continue;
      }
      if (!this.validatePropType(value, propDef.type)) {
        throw new Error(
          `Свойство "${propName}" должно быть типа ${propDef.type}, получено ${typeof value}`
        );
      }
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
  validatePropType(value, expectedType) {
    switch (expectedType) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !isNaN(value);
      case "boolean":
        return typeof value === "boolean";
      case "function":
        return typeof value === "function";
      case "object":
        return value !== null && typeof value === "object" && !Array.isArray(value);
      case "array":
        return Array.isArray(value);
      default:
        return false;
    }
  }
  /**
   * Генерация уникального ID для экземпляра
   */
  generateInstanceId() {
    return `component_${++this.instanceCounter}_${Date.now()}`;
  }
}
const componentRegistry = new ComponentRegistry();
function registerComponent(component) {
  componentRegistry.register(component);
}
function getComponent(name) {
  return componentRegistry.get(name);
}
function createComponentInstance(name, props) {
  return componentRegistry.createInstance(name, props);
}
class UpdateScheduler {
  constructor() {
    this.updateQueue = /* @__PURE__ */ new Set();
    this.isFlushPending = false;
    this.isFlushActive = false;
    this.currentFlushPromise = null;
  }
  /**
   * Планирование выполнения эффекта
   */
  schedule(effect2) {
    const fn = typeof effect2 === "function" ? effect2 : effect2.fn;
    this.updateQueue.add(fn);
    if (!this.isFlushPending && !this.isFlushActive) {
      this.isFlushPending = true;
      this.currentFlushPromise = this.scheduleFlush();
    }
  }
  /**
   * Планирование обновления (алиас для schedule)
   */
  scheduleUpdate(fn) {
    this.schedule(fn);
  }
  /**
   * Планирование выполнения flush через requestAnimationFrame
   */
  scheduleFlush() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        this.flushUpdates();
        resolve();
      });
    });
  }
  /**
   * Выполнение всех запланированных обновлений
   */
  flushUpdates() {
    if (this.isFlushActive) {
      return;
    }
    this.isFlushActive = true;
    this.isFlushPending = false;
    try {
      const effects = Array.from(this.updateQueue);
      this.updateQueue.clear();
      for (const effect2 of effects) {
        try {
          effect2();
        } catch (error) {
          console.error("Ошибка при выполнении запланированного эффекта:", error);
        }
      }
      if (this.updateQueue.size > 0 && !this.isFlushPending) {
        this.isFlushPending = true;
        this.currentFlushPromise = this.scheduleFlush();
      }
    } finally {
      this.isFlushActive = false;
      if (this.updateQueue.size === 0) {
        this.currentFlushPromise = null;
      }
    }
  }
  /**
   * Ожидание завершения всех запланированных обновлений
   */
  async nextTick() {
    if (this.currentFlushPromise) {
      await this.currentFlushPromise;
    }
    if (this.currentFlushPromise) {
      await this.nextTick();
    }
  }
  /**
   * Немедленное выполнение всех запланированных обновлений
   */
  flushSync() {
    if (this.updateQueue.size > 0) {
      this.flushUpdates();
    }
  }
  /**
   * Очистка планировщика
   */
  clear() {
    this.updateQueue.clear();
    this.isFlushPending = false;
    this.isFlushActive = false;
    this.currentFlushPromise = null;
  }
  /**
   * Получение размера очереди (для отладки)
   */
  getQueueSize() {
    return this.updateQueue.size;
  }
  /**
   * Проверка активности планировщика
   */
  isActive() {
    return this.isFlushActive || this.isFlushPending;
  }
}
const scheduler = new UpdateScheduler();
function nextTick(callback) {
  if (callback) {
    scheduler.nextTick().then(callback);
  } else {
    return scheduler.nextTick();
  }
}
function flushSync() {
  scheduler.flushSync();
}
function scheduleUpdate(fn) {
  scheduler.schedule(fn);
}
class PriorityScheduler {
  constructor() {
    this.highPriorityQueue = [];
    this.normalPriorityQueue = [];
    this.lowPriorityQueue = [];
    this.isFlushPending = false;
  }
  /**
   * Планирование с приоритетом
   */
  schedule(fn, priority = "normal") {
    switch (priority) {
      case "high":
        this.highPriorityQueue.push(fn);
        break;
      case "low":
        this.lowPriorityQueue.push(fn);
        break;
      default:
        this.normalPriorityQueue.push(fn);
    }
    if (!this.isFlushPending) {
      this.isFlushPending = true;
      requestAnimationFrame(() => this.flush());
    }
  }
  /**
   * Выполнение очередей по приоритету
   */
  flush() {
    this.isFlushPending = false;
    this.executeQueue(this.highPriorityQueue);
    this.executeQueue(this.normalPriorityQueue);
    this.executeQueueWithTimeSlicing(this.lowPriorityQueue);
  }
  /**
   * Выполнение очереди
   */
  executeQueue(queue) {
    while (queue.length > 0) {
      const fn = queue.shift();
      try {
        fn();
      } catch (error) {
        console.error("Ошибка при выполнении задачи:", error);
      }
    }
  }
  /**
   * Выполнение очереди с ограничением времени
   */
  executeQueueWithTimeSlicing(queue) {
    const startTime = performance.now();
    const timeSlice = 5;
    while (queue.length > 0 && performance.now() - startTime < timeSlice) {
      const fn = queue.shift();
      try {
        fn();
      } catch (error) {
        console.error("Ошибка при выполнении задачи:", error);
      }
    }
    if (queue.length > 0 && !this.isFlushPending) {
      this.isFlushPending = true;
      requestAnimationFrame(() => this.flush());
    }
  }
}
const scheduler$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  PriorityScheduler,
  flushSync,
  nextTick,
  scheduleUpdate,
  scheduler
}, Symbol.toStringTag, { value: "Module" }));
class BaseDirective {
}
class IfDirective extends BaseDirective {
  constructor() {
    super(...arguments);
    this.name = "if";
  }
  process(config, context) {
    if (!config.if) {
      return config;
    }
    const condition = this.evaluateExpression(config.if, context);
    if (condition) {
      const { if: _, ...cleanConfig } = config;
      return cleanConfig;
    }
    return null;
  }
  /**
   * Безопасная оценка выражения
   */
  evaluateExpression(expression, context) {
    try {
      const func = new Function("state", "props", `
        with(state) {
          with(props) {
            return ${expression};
          }
        }
      `);
      return Boolean(func(context.state, context.props));
    } catch (error) {
      console.warn("Ошибка в выражении v-if:", expression, error);
      return false;
    }
  }
}
class ForDirective extends BaseDirective {
  constructor() {
    super(...arguments);
    this.name = "for";
  }
  process(config, context) {
    if (!config.for || !config.template) {
      return [config];
    }
    const { items, itemName, indexName } = this.parseForExpression(config.for);
    const itemsArray = this.evaluateExpression(items, context);
    if (!Array.isArray(itemsArray)) {
      console.warn("v-for требует массив:", items);
      return [];
    }
    return itemsArray.map((item, index) => {
      const itemContext = {
        ...context,
        state: {
          ...context.state,
          [itemName]: item,
          ...indexName ? { [indexName]: index } : { [`${itemName}Index`]: index }
        }
      };
      const processedTemplate = this.processTemplate(config.template, itemContext);
      return {
        ...processedTemplate,
        key: config.key ? this.evaluateExpression(String(config.key), itemContext) : index
      };
    });
  }
  /**
   * Парсинг выражения v-for
   */
  parseForExpression(expression) {
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
  processTemplate(template, context) {
    const processedTemplate = JSON.parse(JSON.stringify(template));
    if (processedTemplate.children) {
      processedTemplate.children = processedTemplate.children.map((child) => {
        if (typeof child === "string") {
          return this.interpolateString(child, context);
        }
        return this.processTemplate(child, context);
      });
    }
    if (processedTemplate.props) {
      Object.keys(processedTemplate.props).forEach((key) => {
        const value = processedTemplate.props[key];
        if (typeof value === "string") {
          processedTemplate.props[key] = this.interpolateString(value, context);
        }
      });
    }
    return processedTemplate;
  }
  /**
   * Интерполяция строк с выражениями {{}}
   */
  interpolateString(str, context) {
    return str.replace(/\{\{(.+?)\}\}/g, (match, expression) => {
      try {
        const result = this.evaluateExpression(expression.trim(), context);
        return String(result);
      } catch (error) {
        console.warn("Ошибка в интерполяции:", expression, error);
        return match;
      }
    });
  }
  /**
   * Оценка выражения
   */
  evaluateExpression(expression, context) {
    try {
      const func = new Function("state", "props", `
        with(state) {
          with(props) {
            return ${expression};
          }
        }
      `);
      return func(context.state, context.props);
    } catch (error) {
      console.warn("Ошибка в выражении v-for:", expression, error);
      return null;
    }
  }
}
class ShowDirective extends BaseDirective {
  constructor() {
    super(...arguments);
    this.name = "show";
  }
  process(config, context) {
    if (config.show === void 0) {
      return config;
    }
    const shouldShow = typeof config.show === "boolean" ? config.show : this.evaluateExpression(String(config.show), context);
    const processedConfig = { ...config };
    if (!processedConfig.props) {
      processedConfig.props = {};
    }
    if (!processedConfig.props.style) {
      processedConfig.props.style = {};
    }
    if (typeof processedConfig.props.style === "object") {
      processedConfig.props.style.display = shouldShow ? "" : "none";
    }
    const { show: _, ...cleanConfig } = processedConfig;
    return cleanConfig;
  }
  evaluateExpression(expression, context) {
    try {
      const func = new Function("state", "props", `
        with(state) {
          with(props) {
            return ${expression};
          }
        }
      `);
      return Boolean(func(context.state, context.props));
    } catch (error) {
      console.warn("Ошибка в выражении v-show:", expression, error);
      return false;
    }
  }
}
const _ModelDirective = class _ModelDirective2 extends BaseDirective {
  constructor() {
    super(...arguments);
    this.name = "model";
  }
  process(config, context) {
    if (!config.model) {
      return config;
    }
    const processedConfig = { ...config };
    if (!processedConfig.props) {
      processedConfig.props = {};
    }
    if (!processedConfig.events) {
      processedConfig.events = {};
    }
    const tag = config.tag?.toLowerCase();
    switch (tag) {
      case "input":
        this.handleInputModel(processedConfig, context);
        break;
      case "textarea":
        this.handleTextareaModel(processedConfig, context);
        break;
      case "select":
        this.handleSelectModel(processedConfig, context);
        break;
      default:
        console.warn(`v-model не поддерживается для элемента ${tag}`);
    }
    const originalMounted = processedConfig.events?.mounted;
    processedConfig.events = processedConfig.events || {};
    processedConfig.events.mounted = (element) => {
      _ModelDirective2.modelBindings.set(element, {
        path: config.model,
        context
      });
      if (originalMounted) {
        originalMounted(element);
      }
    };
    const { model: _, ...cleanConfig } = processedConfig;
    return cleanConfig;
  }
  /**
   * Обработка v-model для input
   */
  handleInputModel(config, context) {
    const propertyPath = config.model;
    const currentValue = this.getPropertyValue(propertyPath, context);
    const inputType = config.props?.type || "text";
    switch (inputType) {
      case "checkbox":
        config.props.checked = currentValue;
        config.events.change = (event) => {
          const target = event.target;
          this.setPropertyValue(propertyPath, target.checked, context);
        };
        break;
      case "radio":
        config.props.checked = currentValue === config.props?.value;
        config.events.change = (event) => {
          const target = event.target;
          if (target.checked) {
            this.setPropertyValue(propertyPath, target.value, context);
          }
        };
        break;
      default:
        config.props.value = currentValue;
        config.events.input = (event) => {
          const target = event.target;
          this.setPropertyValue(propertyPath, target.value, context);
        };
    }
  }
  /**
   * Обработка v-model для textarea
   */
  handleTextareaModel(config, context) {
    const propertyPath = config.model;
    const currentValue = this.getPropertyValue(propertyPath, context);
    config.props.value = currentValue;
    config.events.input = (event) => {
      const target = event.target;
      this.setPropertyValue(propertyPath, target.value, context);
    };
  }
  /**
   * Обработка v-model для select
   */
  handleSelectModel(config, context) {
    const propertyPath = config.model;
    const currentValue = this.getPropertyValue(propertyPath, context);
    config.props.value = currentValue;
    config.events.change = (event) => {
      const target = event.target;
      this.setPropertyValue(propertyPath, target.value, context);
    };
  }
  /**
   * Получение значения свойства по пути
   */
  getPropertyValue(path, context) {
    try {
      const func = new Function("state", "props", `
        with(state) {
          with(props) {
            return ${path};
          }
        }
      `);
      return func(context.state, context.props);
    } catch (error) {
      console.warn("Ошибка при получении значения v-model:", path, error);
      return "";
    }
  }
  /**
   * Установка значения свойства по пути с поддержкой реактивности
   */
  setPropertyValue(path, value, context) {
    try {
      const pathParts = this.parsePath(path);
      let obj = context.state;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (part.type === "property") {
          obj = obj[part.key];
        } else if (part.type === "index") {
          obj = obj[part.key];
        }
      }
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart.type === "property") {
        obj[lastPart.key] = value;
      } else if (lastPart.type === "index") {
        obj[lastPart.key] = value;
      }
      this.triggerUpdate(context);
    } catch (error) {
      console.warn("Ошибка при установке значения v-model:", path, error);
    }
  }
  /**
   * Парсинг пути для поддержки сложных выражений
   */
  parsePath(path) {
    const parts = [];
    const segments = path.split(".");
    for (const segment of segments) {
      const arrayMatch = segment.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        parts.push({ type: "property", key: arrayMatch[1] });
        parts.push({ type: "index", key: parseInt(arrayMatch[2]) });
      } else {
        parts.push({ type: "property", key: segment });
      }
    }
    return parts;
  }
  /**
   * Запуск обновления через планировщик
   */
  triggerUpdate(context) {
    Promise.resolve().then(() => scheduler$1).then(({ scheduler: scheduler2 }) => {
      scheduler2.scheduleUpdate(() => {
      });
    }).catch((error) => {
      console.warn("Ошибка при запуске обновления:", error);
    });
  }
  /**
   * Статический метод для обновления всех привязанных элементов
   */
  static updateBoundElements() {
    for (const [element, binding] of _ModelDirective2.modelBindings) {
      try {
        const currentValue = new _ModelDirective2().getPropertyValue(binding.path, binding.context);
        if (element instanceof HTMLInputElement) {
          if (element.type === "checkbox" || element.type === "radio") {
            element.checked = element.type === "checkbox" ? currentValue : currentValue === element.value;
          } else {
            element.value = String(currentValue || "");
          }
        } else if (element instanceof HTMLTextAreaElement) {
          element.value = String(currentValue || "");
        } else if (element instanceof HTMLSelectElement) {
          element.value = String(currentValue || "");
        }
      } catch (error) {
        console.warn("Ошибка при обновлении привязанного элемента:", error);
      }
    }
  }
};
_ModelDirective.modelBindings = /* @__PURE__ */ new Map();
let ModelDirective = _ModelDirective;
class DirectiveManager {
  constructor() {
    this.directives = /* @__PURE__ */ new Map();
    this.register(new IfDirective());
    this.register(new ForDirective());
    this.register(new ShowDirective());
    this.register(new ModelDirective());
  }
  /**
   * Регистрация новой директивы
   */
  register(directive) {
    this.directives.set(directive.name, directive);
  }
  /**
   * Обработка всех директив в конфигурации
   */
  processDirectives(config, context) {
    let results = [config];
    const directiveOrder = ["if", "for", "show", "model"];
    for (const directiveName of directiveOrder) {
      const directive = this.directives.get(directiveName);
      if (!directive) continue;
      const newResults = [];
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
  hasDirectives(config) {
    return !!(config.if || config.for || config.show !== void 0 || config.model);
  }
}
const directiveManager = new DirectiveManager();
class ComponentRenderer {
  constructor() {
    this.mountedInstances = /* @__PURE__ */ new Map();
    this.instanceElements = /* @__PURE__ */ new Map();
    this.stats = {
      elementsCreated: 0,
      eventsAttached: 0,
      renderTime: 0
    };
  }
  /**
   * Основной метод рендеринга
   */
  render(config, container) {
    const startTime = performance.now();
    try {
      this.clearContainer(container);
      const element = this.renderConfig(config);
      container.appendChild(element);
      this.stats.renderTime = performance.now() - startTime;
      return element;
    } catch (error) {
      console.error("Ошибка рендеринга:", error);
      throw error;
    }
  }
  /**
   * Рендеринг конфигурации (элемент или компонент)
   */
  renderConfig(config, parentInstance) {
    if (config.component) {
      return this.renderComponent(config, parentInstance);
    } else {
      return this.renderElement(config, parentInstance);
    }
  }
  /**
   * Рендеринг компонента
   */
  renderComponent(config, parentInstance) {
    const componentName = config.component;
    const instance = componentRegistry.createInstance(componentName, config.props);
    if (parentInstance) {
      instance.parent = parentInstance;
      parentInstance.children.push(instance);
    }
    const directiveContext = {
      state: instance.state,
      props: instance.props,
      instance,
      computed: instance.computed
    };
    effect(() => {
      try {
        const componentConfig = instance.component.render.call(
          instance,
          instance.props,
          instance.state,
          instance.computed
        );
        const processedConfigs = directiveManager.processDirectives(componentConfig, directiveContext);
        if (processedConfigs.length === 0) {
          if (instance.element) {
            this.unmountComponent(instance);
          }
          return;
        }
        const newElement = this.renderElement(processedConfigs[0], instance);
        if (instance.element) {
          if (instance.element.parentNode) {
            instance.element.parentNode.replaceChild(newElement, instance.element);
          }
          instance.element = newElement;
        } else {
          instance.element = newElement;
          this.instanceElements.set(instance.id, newElement);
          this.mountedInstances.set(newElement, instance);
          componentRegistry.mountInstance(instance, newElement);
        }
      } catch (error) {
        console.error("Ошибка при рендеринге компонента:", error);
      }
    }, {
      scheduler: (effect2) => scheduler.schedule(effect2)
    });
    return instance.element || this.createPlaceholder();
  }
  /**
   * Рендеринг обычного элемента
   */
  renderElement(config, parentInstance) {
    const directiveContext = {
      state: parentInstance?.state || {},
      props: parentInstance?.props || {},
      instance: parentInstance || void 0,
      computed: parentInstance?.computed || {}
    };
    const processedConfigs = directiveManager.processDirectives(config, directiveContext);
    if (processedConfigs.length === 0) {
      return this.createPlaceholder();
    }
    const processedConfig = processedConfigs[0];
    const element = document.createElement(processedConfig.tag || "div");
    this.stats.elementsCreated++;
    if (processedConfig.props) {
      this.applyProps(element, processedConfig.props);
    }
    if (processedConfig.events) {
      this.attachEvents(element, processedConfig.events);
    }
    if (processedConfig.children) {
      this.renderChildren(element, processedConfig.children, parentInstance);
    }
    return element;
  }
  /**
   * Рендеринг дочерних элементов
   */
  renderChildren(parent, children, parentInstance) {
    children.forEach((child) => {
      if (typeof child === "string") {
        const textNode = document.createTextNode(child);
        parent.appendChild(textNode);
      } else if (child && typeof child === "object") {
        const childElement = this.renderConfig(child, parentInstance);
        parent.appendChild(childElement);
      }
    });
  }
  /**
   * Применение свойств к элементу
   */
  applyProps(element, props) {
    for (const [key, value] of Object.entries(props)) {
      switch (key) {
        case "class":
          element.className = value;
          break;
        case "id":
          element.id = value;
          break;
        case "style":
          this.applyStyles(element, value);
          break;
        case "checked":
          if (element instanceof HTMLInputElement) {
            element.checked = Boolean(value);
          }
          break;
        case "value":
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.value = String(value || "");
          }
          break;
        case "selected":
          if (element instanceof HTMLOptionElement) {
            element.selected = Boolean(value);
          }
          break;
        default:
          if (value !== void 0 && value !== null) {
            element.setAttribute(key, String(value));
          }
          break;
      }
    }
  }
  /**
   * Применение стилей
   */
  applyStyles(element, styles) {
    if (typeof styles === "object") {
      for (const [property, value] of Object.entries(styles)) {
        if (value !== void 0 && value !== null) {
          const cssProperty = property.replace(/([A-Z])/g, "-$1").toLowerCase();
          element.style.setProperty(cssProperty, String(value));
        }
      }
    } else if (typeof styles === "string") {
      element.style.cssText = styles;
    }
  }
  /**
   * Привязка обработчиков событий
   */
  attachEvents(element, events) {
    for (const [eventType, handler] of Object.entries(events)) {
      if (!handler) continue;
      if (eventType === "mounted" || eventType === "unmounted") {
        if (eventType === "mounted") {
          handler(element);
        }
        continue;
      }
      element.addEventListener(eventType, handler);
      this.stats.eventsAttached++;
    }
  }
  /**
   * Размонтирование компонента
   */
  unmountComponent(instance) {
    if (instance.element) {
      if (instance.element.parentNode) {
        instance.element.parentNode.removeChild(instance.element);
      }
      this.mountedInstances.delete(instance.element);
      this.instanceElements.delete(instance.id);
      componentRegistry.unmountInstance(instance);
    }
  }
  /**
   * Создание элемента-заглушки
   */
  createPlaceholder() {
    const placeholder = document.createElement("span");
    placeholder.style.display = "none";
    placeholder.setAttribute("data-placeholder", "true");
    return placeholder;
  }
  /**
   * Очистка контейнера
   */
  clearContainer(container) {
    const instances = Array.from(this.mountedInstances.entries()).filter(([element]) => container.contains(element)).map(([, instance]) => instance);
    instances.forEach((instance) => {
      componentRegistry.destroyInstance(instance.id);
    });
    container.innerHTML = "";
  }
  /**
   * Обновление существующего элемента новой конфигурацией
   */
  updateElement(element, newConfig) {
    const instance = this.mountedInstances.get(element);
    if (instance) {
      if (newConfig.props) {
        componentRegistry.updateInstanceProps(instance, newConfig.props);
      }
      return instance.element || element;
    } else {
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
  unmount(element) {
    const instance = this.mountedInstances.get(element);
    if (instance) {
      componentRegistry.destroyInstance(instance.id);
    } else {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
  }
  /**
   * Поиск компонента по элементу
   */
  getComponentInstance(element) {
    return this.mountedInstances.get(element);
  }
  /**
   * Получение статистики
   */
  getStats() {
    return { ...this.stats };
  }
  /**
   * Очистка всех ресурсов
   */
  cleanup() {
    this.mountedInstances.forEach((instance) => {
      componentRegistry.destroyInstance(instance.id);
    });
    this.mountedInstances.clear();
    this.instanceElements.clear();
    this.stats = {
      elementsCreated: 0,
      eventsAttached: 0,
      renderTime: 0
    };
  }
  /**
   * Принудительное обновление всех компонентов
   */
  forceUpdate() {
    scheduler.flushSync();
  }
  /**
   * Поиск элемента по ID
   */
  findElementById(element, id) {
    return element.querySelector(`#${id}`);
  }
  /**
   * Поиск элементов по классу
   */
  findElementsByClass(element, className) {
    return Array.from(element.querySelectorAll(`.${className}`));
  }
}
function runEffect(effect2) {
  if (!effect2.active) {
    return effect2.fn();
  }
  return effect2.fn();
}
class ComputedRefImpl {
  constructor(getter, setter) {
    this._dirty = true;
    this._setter = setter;
    this._effect = effect(() => getter(), {
      lazy: true,
      scheduler: () => {
        if (!this._dirty) {
          this._dirty = true;
          this.triggerUpdate();
        }
      }
    });
  }
  get value() {
    if (this._dirty) {
      this._value = runEffect(this._effect);
      this._dirty = false;
    }
    return this._value;
  }
  set value(newValue) {
    if (this._setter) {
      this._setter(newValue);
    } else {
      console.warn("Computed свойство доступно только для чтения");
    }
  }
  get dirty() {
    return this._dirty;
  }
  get effect() {
    return this._effect;
  }
  /**
   * Принудительное обновление computed свойства
   */
  invalidate() {
    this._dirty = true;
    this.triggerUpdate();
  }
  /**
   * Уведомление об изменении computed свойства
   */
  triggerUpdate() {
    scheduler.scheduleUpdate(() => {
    });
  }
  /**
   * Остановка отслеживания зависимостей
   */
  stop() {
    stop(this._effect);
  }
}
function computed(getterOrOptions) {
  let getter;
  let setter;
  if (typeof getterOrOptions === "function") {
    getter = getterOrOptions;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}
function isComputedRef(r) {
  return !!(r && r._effect && typeof r.value !== "undefined");
}
class ComputedManager {
  constructor() {
    this.computedRefs = /* @__PURE__ */ new Set();
  }
  /**
   * Регистрация computed свойства для управления
   */
  register(computedRef) {
    this.computedRefs.add(computedRef);
  }
  /**
   * Удаление computed свойства из управления
   */
  unregister(computedRef) {
    this.computedRefs.delete(computedRef);
    computedRef.stop();
  }
  /**
   * Принудительная валидация всех computed свойств
   */
  invalidateAll() {
    for (const computedRef of this.computedRefs) {
      computedRef.invalidate();
    }
  }
  /**
   * Получение статистики computed свойств
   */
  getStats() {
    let dirty = 0;
    let clean = 0;
    for (const computedRef of this.computedRefs) {
      if (computedRef.dirty) {
        dirty++;
      } else {
        clean++;
      }
    }
    return {
      total: this.computedRefs.size,
      dirty,
      clean
    };
  }
  /**
   * Очистка всех computed свойств
   */
  cleanup() {
    for (const computedRef of this.computedRefs) {
      computedRef.stop();
    }
    this.computedRefs.clear();
  }
}
const computedManager = new ComputedManager();
function useComputed(getter, deps) {
  const computedRef = computed(getter);
  computedManager.register(computedRef);
  return computedRef;
}
function memo(fn, deps) {
  let cachedValue;
  let cachedDeps = [];
  let isInitialized = false;
  return () => {
    const hasChanged = !isInitialized || deps.some((dep, index) => dep !== cachedDeps[index]);
    if (hasChanged) {
      cachedValue = fn();
      cachedDeps = [...deps];
      isInitialized = true;
    }
    return cachedValue;
  };
}
function createComponentComputed(getter, onDestroy) {
  const computedRef = computed(getter);
  computedManager.register(computedRef);
  return {
    get value() {
      return computedRef.value;
    },
    get dirty() {
      return computedRef.dirty;
    },
    get effect() {
      return computedRef.effect;
    },
    destroy() {
      computedManager.unregister(computedRef);
      if (onDestroy) {
        onDestroy();
      }
    }
  };
}
class PluginManager {
  constructor(framework) {
    this.plugins = /* @__PURE__ */ new Map();
    this.installedPlugins = /* @__PURE__ */ new Set();
    this.globalProperties = /* @__PURE__ */ new Map();
    this.customDirectives = /* @__PURE__ */ new Map();
    this.frameworkInstance = framework;
  }
  /**
   * Установка плагина
   */
  use(plugin, options) {
    if (this.installedPlugins.has(plugin.name)) {
      console.warn(`Плагин "${plugin.name}" уже установлен`);
      return this;
    }
    if (plugin.dependencies) {
      for (const dependency of plugin.dependencies) {
        if (!this.installedPlugins.has(dependency)) {
          throw new Error(`Плагин "${plugin.name}" требует зависимость "${dependency}"`);
        }
      }
    }
    const context = {
      framework: this.frameworkInstance,
      options: options || {},
      globalProperties: Object.fromEntries(this.globalProperties),
      directives: this.customDirectives
    };
    try {
      plugin.install(this.frameworkInstance, context);
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
  uninstall(pluginName) {
    if (!this.installedPlugins.has(pluginName)) {
      console.warn(`Плагин "${pluginName}" не установлен`);
      return false;
    }
    const plugin = this.plugins.get(pluginName);
    if (plugin && typeof plugin.uninstall === "function") {
      try {
        plugin.uninstall(this.frameworkInstance);
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
  hasPlugin(pluginName) {
    return this.installedPlugins.has(pluginName);
  }
  /**
   * Получение списка установленных плагинов
   */
  getInstalledPlugins() {
    return Array.from(this.installedPlugins);
  }
  /**
   * Добавление глобального свойства
   */
  addGlobalProperty(name, value) {
    this.globalProperties.set(name, value);
  }
  /**
   * Получение глобального свойства
   */
  getGlobalProperty(name) {
    return this.globalProperties.get(name);
  }
  /**
   * Регистрация пользовательской директивы
   */
  registerDirective(directive) {
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
  getDirective(name) {
    return this.customDirectives.get(name);
  }
  /**
   * Получение всех пользовательских директив
   */
  getAllDirectives() {
    return new Map(this.customDirectives);
  }
  /**
   * Очистка всех плагинов и ресурсов
   */
  cleanup() {
    for (const pluginName of this.installedPlugins) {
      this.uninstall(pluginName);
    }
    this.plugins.clear();
    this.installedPlugins.clear();
    this.globalProperties.clear();
    this.customDirectives.clear();
  }
}
function definePlugin(options) {
  return {
    name: options.name,
    version: options.version,
    install: options.install,
    dependencies: options.dependencies,
    ...options.uninstall && { uninstall: options.uninstall }
  };
}
const LifecycleLoggerPlugin = definePlugin({
  name: "LifecycleLogger",
  version: "1.0.0",
  install(framework, context) {
    context.globalProperties.set("$logLifecycle", context.options.enabled !== false);
    framework.logLifecycle = (componentName, hook, data) => {
      if (context.globalProperties.get("$logLifecycle")) {
        console.log(`[${componentName}] ${hook}`, data || "");
      }
    };
  }
});
const FormValidationPlugin = definePlugin({
  name: "FormValidation",
  version: "1.0.0",
  install(framework, context) {
    const validateDirective = {
      name: "validate",
      bind(el, binding) {
        el.addEventListener("blur", () => {
          const validator = binding.value;
          if (typeof validator === "function") {
            const isValid = validator(el.value);
            el.classList.toggle("invalid", !isValid);
            el.classList.toggle("valid", isValid);
          }
        });
      }
    };
    context.directives.set("validate", validateDirective);
    framework.validators = {
      required: (value) => !!value,
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      minLength: (min) => (value) => value.length >= min,
      maxLength: (max) => (value) => value.length <= max,
      pattern: (regex) => (value) => regex.test(value)
    };
  }
});
const I18nPlugin = definePlugin({
  name: "I18n",
  version: "1.0.0",
  install(framework, context) {
    const messages = context.options.messages || {};
    let currentLocale = context.options.locale || "ru";
    framework.t = (key, params) => {
      const message = messages[currentLocale]?.[key] || key;
      if (params) {
        return Object.keys(params).reduce((msg, paramKey) => {
          return msg.replace(new RegExp(`{${paramKey}}`, "g"), params[paramKey]);
        }, message);
      }
      return message;
    };
    framework.setLocale = (locale) => {
      currentLocale = locale;
    };
    framework.getLocale = () => currentLocale;
    const i18nDirective = {
      name: "i18n",
      bind(el, binding) {
        const key = binding.value || el.textContent;
        if (key) {
          el.textContent = framework.t(key);
        }
      },
      update(el, binding) {
        const key = binding.value || binding.expression;
        if (key) {
          el.textContent = framework.t(key);
        }
      }
    };
    context.directives.set("i18n", i18nDirective);
  }
});
const StorePlugin = definePlugin({
  name: "Store",
  version: "1.0.0",
  install(framework, context) {
    const initialState = context.options.state || {};
    const mutations = context.options.mutations || {};
    const actions = context.options.actions || {};
    const state = framework.reactive(initialState);
    const store = {
      state,
      commit(mutationName, payload) {
        const mutation = mutations[mutationName];
        if (mutation) {
          mutation(state, payload);
        } else {
          console.warn(`Мутация "${mutationName}" не найдена`);
        }
      },
      dispatch(actionName, payload) {
        const action = actions[actionName];
        if (action) {
          return action({ state, commit: this.commit, dispatch: this.dispatch }, payload);
        } else {
          console.warn(`Действие "${actionName}" не найдено`);
        }
      }
    };
    framework.$store = store;
    context.globalProperties.set("$store", store);
  }
});
function memoize(fn, keyGenerator) {
  const cache = /* @__PURE__ */ new Map();
  return (...args) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    if (cache.size > 1e3) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    return result;
  };
}
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
function throttle(func, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
class ComponentOptimizer {
  constructor() {
    this.renderCache = /* @__PURE__ */ new Map();
    this.performanceMetrics = /* @__PURE__ */ new Map();
  }
  static getInstance() {
    if (!ComponentOptimizer.instance) {
      ComponentOptimizer.instance = new ComponentOptimizer();
    }
    return ComponentOptimizer.instance;
  }
  /**
   * Кеширование результатов рендеринга
   */
  cacheRender(componentId, props, result) {
    const key = this.generateCacheKey(componentId, props);
    this.renderCache.set(key, {
      result,
      timestamp: Date.now()
    });
    this.cleanupCache();
  }
  /**
   * Получение кешированного результата
   */
  getCachedRender(componentId, props) {
    const key = this.generateCacheKey(componentId, props);
    const cached = this.renderCache.get(key);
    if (cached && Date.now() - cached.timestamp < 5e3) {
      return cached.result;
    }
    return null;
  }
  /**
   * Измерение производительности рендеринга
   */
  measureRenderTime(componentName, renderFn) {
    const start = performance.now();
    const result = renderFn();
    const end = performance.now();
    this.recordMetric(componentName, end - start);
    return result;
  }
  /**
   * Получение метрик производительности
   */
  getMetrics() {
    const result = {};
    for (const [component, times] of this.performanceMetrics) {
      result[component] = {
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        count: times.length
      };
    }
    return result;
  }
  generateCacheKey(componentId, props) {
    return `${componentId}:${JSON.stringify(props)}`;
  }
  recordMetric(componentName, time) {
    if (!this.performanceMetrics.has(componentName)) {
      this.performanceMetrics.set(componentName, []);
    }
    const times = this.performanceMetrics.get(componentName);
    times.push(time);
    if (times.length > 100) {
      times.shift();
    }
  }
  cleanupCache() {
    const now = Date.now();
    for (const [key, cached] of this.renderCache) {
      if (now - cached.timestamp > 1e4) {
        this.renderCache.delete(key);
      }
    }
  }
}
class DOMOptimizer {
  /**
   * Батчинг DOM обновлений
   */
  static batchUpdate(updateFn) {
    this.batchedUpdates.push(updateFn);
    if (!this.isScheduled) {
      this.isScheduled = true;
      requestAnimationFrame(() => {
        this.flushUpdates();
      });
    }
  }
  /**
   * Выполнение всех накопленных обновлений
   */
  static flushUpdates() {
    const updates = [...this.batchedUpdates];
    this.batchedUpdates.length = 0;
    this.isScheduled = false;
    updates.forEach((update) => {
      try {
        update();
      } catch (error) {
        console.error("Ошибка в батчированном обновлении:", error);
      }
    });
  }
  /**
   * Виртуализация списков для больших наборов данных
   */
  static createVirtualList(items, itemHeight, containerHeight) {
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2;
    let scrollTop = 0;
    return {
      getVisibleItems() {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleCount, items.length);
        return {
          items: items.slice(startIndex, endIndex),
          startIndex,
          endIndex,
          totalHeight: items.length * itemHeight,
          offsetY: startIndex * itemHeight
        };
      },
      updateScrollTop(newScrollTop) {
        scrollTop = newScrollTop;
      }
    };
  }
}
DOMOptimizer.batchedUpdates = [];
DOMOptimizer.isScheduled = false;
class MemoryManager {
  /**
   * Регистрация функции очистки
   */
  static registerCleanup(cleanupFn) {
    this.cleanupFunctions.push(cleanupFn);
  }
  /**
   * Выполнение всех функций очистки
   */
  static cleanup() {
    this.cleanupFunctions.forEach((fn) => {
      try {
        fn();
      } catch (error) {
        console.error("Ошибка при очистке памяти:", error);
      }
    });
    this.cleanupFunctions.length = 0;
  }
  /**
   * Мониторинг использования памяти
   */
  static getMemoryUsage() {
    if ("memory" in performance) {
      return performance.memory;
    }
    return null;
  }
  /**
   * Принудительная сборка мусора (если доступна)
   */
  static forceGC() {
    if ("gc" in window) {
      window.gc();
    }
  }
}
MemoryManager.cleanupFunctions = [];
class PerformanceAnalyzer {
  /**
   * Измерение времени выполнения
   */
  static measure(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    this.recordTime(name, end - start);
    return result;
  }
  /**
   * Запись времени выполнения
   */
  static recordTime(name, time) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const times = this.metrics.get(name);
    times.push(time);
    if (times.length > 1e3) {
      times.shift();
    }
  }
  /**
   * Получение отчета о производительности
   */
  static getReport() {
    const report = {};
    for (const [name, times] of this.metrics) {
      const sorted = [...times].sort((a, b) => a - b);
      report[name] = {
        count: times.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: times.reduce((sum, time) => sum + time, 0) / times.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      };
    }
    return report;
  }
  /**
   * Очистка метрик
   */
  static clearMetrics() {
    this.metrics.clear();
  }
}
PerformanceAnalyzer.metrics = /* @__PURE__ */ new Map();
class DOMDiffer {
  /**
   * Сравнение двух конфигураций элементов
   */
  diff(oldConfig, newConfig) {
    const patches = [];
    if (this.isDifferentType(oldConfig, newConfig)) {
      patches.push({
        type: "REPLACE",
        oldConfig,
        newConfig
      });
      return { patches };
    }
    const propPatches = this.diffProps(oldConfig.props, newConfig.props);
    if (propPatches.length > 0) {
      patches.push({
        type: "PROPS",
        props: this.mergeProps(propPatches)
      });
    }
    const childPatches = this.diffChildren(
      oldConfig.children || [],
      newConfig.children || []
    );
    patches.push(...childPatches);
    return { patches };
  }
  /**
   * Проверка, являются ли элементы разными типами
   */
  isDifferentType(oldConfig, newConfig) {
    if (oldConfig.tag !== newConfig.tag) {
      return true;
    }
    if (oldConfig.component !== newConfig.component) {
      return true;
    }
    return false;
  }
  /**
   * Сравнение свойств элементов
   */
  diffProps(oldProps = {}, newProps = {}) {
    const patches = [];
    const allKeys = /* @__PURE__ */ new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);
    for (const key of allKeys) {
      const oldValue = oldProps[key];
      const newValue = newProps[key];
      if (!(key in oldProps)) {
        patches.push({ key, type: "add", value: newValue });
      } else if (!(key in newProps)) {
        patches.push({ key, type: "remove" });
      } else if (!this.isEqual(oldValue, newValue)) {
        patches.push({ key, type: "update", value: newValue });
      }
    }
    return patches;
  }
  /**
   * Сравнение дочерних элементов с поддержкой ключей
   */
  diffChildren(oldChildren, newChildren) {
    const patches = [];
    if (this.hasKeys(oldChildren) || this.hasKeys(newChildren)) {
      return this.diffChildrenWithKeys(oldChildren, newChildren);
    }
    const maxLength = Math.max(oldChildren.length, newChildren.length);
    for (let i = 0; i < maxLength; i++) {
      const oldChild = oldChildren[i];
      const newChild = newChildren[i];
      if (!oldChild && newChild) {
        patches.push({
          type: "ADD",
          index: i,
          newConfig: typeof newChild === "string" ? void 0 : newChild,
          text: typeof newChild === "string" ? newChild : void 0
        });
      } else if (oldChild && !newChild) {
        patches.push({
          type: "REMOVE",
          index: i
        });
      } else if (oldChild && newChild) {
        if (typeof oldChild === "string" && typeof newChild === "string") {
          if (oldChild !== newChild) {
            patches.push({
              type: "TEXT_UPDATE",
              index: i,
              text: newChild
            });
          }
        } else if (typeof oldChild === "object" && typeof newChild === "object") {
          const childDiff = this.diff(oldChild, newChild);
          if (childDiff.patches.length > 0) {
            patches.push({
              type: "UPDATE",
              index: i,
              patches: childDiff.patches
            });
          }
        } else {
          patches.push({
            type: "REPLACE",
            index: i,
            oldConfig: typeof oldChild === "object" ? oldChild : void 0,
            newConfig: typeof newChild === "object" ? newChild : void 0,
            text: typeof newChild === "string" ? newChild : void 0
          });
        }
      }
    }
    return patches;
  }
  /**
   * Оптимизированное сравнение дочерних элементов с ключами
   */
  diffChildrenWithKeys(oldChildren, newChildren) {
    const patches = [];
    const oldKeyMap = this.createKeyMap(oldChildren);
    this.createKeyMap(newChildren);
    const processedOldIndices = /* @__PURE__ */ new Set();
    const processedNewIndices = /* @__PURE__ */ new Set();
    newChildren.forEach((newChild, newIndex) => {
      const newKey = this.getKey(newChild, newIndex);
      const oldIndex = oldKeyMap.get(newKey);
      if (oldIndex !== void 0) {
        const oldChild = oldChildren[oldIndex];
        processedOldIndices.add(oldIndex);
        processedNewIndices.add(newIndex);
        if (oldIndex !== newIndex) {
          patches.push({
            type: "MOVE",
            index: oldIndex,
            newIndex
          });
        }
        if (typeof oldChild === "object" && typeof newChild === "object") {
          const childDiff = this.diff(oldChild, newChild);
          if (childDiff.patches.length > 0) {
            patches.push({
              type: "UPDATE",
              index: newIndex,
              patches: childDiff.patches
            });
          }
        }
      } else {
        patches.push({
          type: "ADD",
          index: newIndex,
          newConfig: typeof newChild === "object" ? newChild : void 0,
          text: typeof newChild === "string" ? newChild : void 0
        });
      }
    });
    oldChildren.forEach((oldChild, oldIndex) => {
      if (!processedOldIndices.has(oldIndex)) {
        patches.push({
          type: "REMOVE",
          index: oldIndex
        });
      }
    });
    return patches;
  }
  /**
   * Создание карты ключей для быстрого поиска
   */
  createKeyMap(children) {
    const keyMap = /* @__PURE__ */ new Map();
    children.forEach((child, index) => {
      const key = this.getKey(child, index);
      keyMap.set(key, index);
    });
    return keyMap;
  }
  /**
   * Получение ключа элемента
   */
  getKey(child, fallbackIndex) {
    if (typeof child === "object" && child.key !== void 0) {
      return child.key;
    }
    return fallbackIndex;
  }
  /**
   * Проверка наличия ключей в списке дочерних элементов
   */
  hasKeys(children) {
    return children.some(
      (child) => typeof child === "object" && child.key !== void 0
    );
  }
  /**
   * Объединение патчей для свойств
   */
  mergeProps(propPatches) {
    const result = {};
    propPatches.forEach((patch) => {
      if (patch.type === "remove") {
        result[patch.key] = null;
      } else {
        result[patch.key] = patch.value;
      }
    });
    return result;
  }
  /**
   * Глубокое сравнение значений
   */
  isEqual(value1, value2) {
    if (value1 === value2) {
      return true;
    }
    if (value1 == null || value2 == null) {
      return value1 === value2;
    }
    if (typeof value1 !== typeof value2) {
      return false;
    }
    if (typeof value1 === "object") {
      return JSON.stringify(value1) === JSON.stringify(value2);
    }
    return false;
  }
}
class DOMPatcher {
  /**
   * Применение списка патчей к DOM элементу
   */
  patch(element, patches) {
    let currentElement = element;
    patches.forEach((patch) => {
      currentElement = this.applyPatch(currentElement, patch);
    });
    return currentElement;
  }
  /**
   * Применение одного патча
   */
  applyPatch(element, patch) {
    switch (patch.type) {
      case "REPLACE":
        return this.replacePatch(element, patch);
      case "PROPS":
        this.propsPatch(element, patch);
        break;
      case "ADD":
        this.addPatch(element, patch);
        break;
      case "REMOVE":
        this.removePatch(element, patch);
        break;
      case "UPDATE":
        this.updatePatch(element, patch);
        break;
      case "TEXT_UPDATE":
        this.textUpdatePatch(element, patch);
        break;
      case "MOVE":
        this.movePatch(element, patch);
        break;
    }
    return element;
  }
  /**
   * Полная замена элемента
   */
  replacePatch(element, patch) {
    if (!patch.newConfig) {
      throw new Error("Новая конфигурация требуется для замены");
    }
    console.warn("Замена элемента еще не реализована");
    return element;
  }
  /**
   * Обновление свойств элемента
   */
  propsPatch(element, patch) {
    if (!patch.props) return;
    Object.entries(patch.props).forEach(([key, value]) => {
      if (value === null) {
        element.removeAttribute(key);
      } else {
        if (key === "style" && typeof value === "object") {
          this.updateStyles(element, value);
        } else if (key === "class") {
          element.className = value;
        } else {
          element.setAttribute(key, String(value));
        }
      }
    });
  }
  /**
   * Добавление нового дочернего элемента
   */
  addPatch(element, patch) {
    const index = patch.index || element.children.length;
    if (patch.text !== void 0) {
      const textNode = document.createTextNode(patch.text);
      if (index >= element.children.length) {
        element.appendChild(textNode);
      } else {
        element.insertBefore(textNode, element.children[index]);
      }
    } else if (patch.newConfig) {
      console.warn("Добавление элемента из конфигурации еще не реализовано");
    }
  }
  /**
   * Удаление дочернего элемента
   */
  removePatch(element, patch) {
    const index = patch.index;
    if (index !== void 0 && index < element.children.length) {
      const child = element.children[index];
      element.removeChild(child);
    }
  }
  /**
   * Обновление дочернего элемента
   */
  updatePatch(element, patch) {
    const index = patch.index;
    if (index !== void 0 && index < element.children.length && patch.patches) {
      const child = element.children[index];
      this.patch(child, patch.patches);
    }
  }
  /**
   * Обновление текста
   */
  textUpdatePatch(element, patch) {
    const index = patch.index;
    if (index !== void 0 && patch.text !== void 0) {
      const child = element.childNodes[index];
      if (child && child.nodeType === Node.TEXT_NODE) {
        child.textContent = patch.text;
      }
    }
  }
  /**
   * Перемещение элемента
   */
  movePatch(element, patch) {
    const oldIndex = patch.index;
    const newIndex = patch.newIndex;
    if (oldIndex !== void 0 && newIndex !== void 0) {
      const child = element.children[oldIndex];
      const target = element.children[newIndex];
      if (child) {
        if (target) {
          element.insertBefore(child, target);
        } else {
          element.appendChild(child);
        }
      }
    }
  }
  /**
   * Обновление стилей элемента
   */
  updateStyles(element, styles) {
    Object.entries(styles).forEach(([property, value]) => {
      if (value === null || value === void 0) {
        element.style.removeProperty(property);
      } else {
        element.style.setProperty(property, String(value));
      }
    });
  }
}
const domDiffer = new DOMDiffer();
const domPatcher = new DOMPatcher();
function createElement(tag, props, children) {
  const config = {
    tag,
    props
  };
  if (children !== void 0) {
    config.children = children;
  }
  return config;
}
function isValidHtmlTag(tag) {
  const validTags = [
    "div",
    "span",
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "button",
    "input",
    "form",
    "label",
    "textarea",
    "select",
    "option",
    "a",
    "img",
    "ul",
    "ol",
    "li",
    "table",
    "tr",
    "td",
    "th",
    "header",
    "footer",
    "main",
    "section",
    "article",
    "nav",
    "strong",
    "em",
    "small",
    "br",
    "hr"
  ];
  return validTags.includes(tag.toLowerCase());
}
function camelToKebab(str) {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function isElementConfig(obj) {
  return obj && typeof obj === "object" && typeof obj.tag === "string";
}
function cloneConfig(config) {
  return JSON.parse(JSON.stringify(config));
}
function createTextNode(text) {
  return String(text);
}
function combineClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}
function stylesToString(styles) {
  return Object.entries(styles).map(([key, value]) => `${camelToKebab(key)}: ${value}`).join("; ");
}
class JSFramework {
  constructor(options) {
    this.renderer = new ComponentRenderer();
    this.validator = new ConfigValidator();
    this.mountedElement = null;
    this.globalState = createReactive({});
    this.pluginManager = new PluginManager(this);
  }
  /**
   * Регистрация компонента в фреймворке
   */
  registerComponent(component) {
    registerComponent(component);
  }
  /**
   * Создание реактивного состояния
   */
  reactive(target) {
    return createReactive(target);
  }
  /**
   * Получение глобального состояния
   */
  getGlobalState() {
    return this.globalState;
  }
  /**
   * Ожидание следующего обновления
   */
  nextTick() {
    return nextTick();
  }
  /**
   * Создание computed свойства
   */
  computed(getter) {
    return computed(getter);
  }
  /**
   * Установка плагина
   */
  use(plugin, options) {
    this.pluginManager.use(plugin, options);
    return this;
  }
  /**
   * Регистрация пользовательской директивы
   */
  directive(directive) {
    this.pluginManager.registerDirective(directive);
    return this;
  }
  /**
   * Добавление глобального свойства
   */
  config(name, value) {
    this.pluginManager.addGlobalProperty(name, value);
    return this;
  }
  /**
   * Получение установленных плагинов
   */
  getInstalledPlugins() {
    return this.pluginManager.getInstalledPlugins();
  }
  /**
   * Рендеринг конфигурации в указанный контейнер
   */
  render(config, container) {
    const containerElement = typeof container === "string" ? document.querySelector(container) : container;
    if (!containerElement) {
      throw new Error("Контейнер не найден");
    }
    const validationResult = this.validator.validate(config);
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map((e) => e.message).join(", ");
      throw new Error(`Ошибка валидации: ${errorMessages}`);
    }
    if (this.mountedElement) {
      this.unmount();
    }
    const element = this.renderer.render(config, containerElement);
    this.mountedElement = element;
    return element;
  }
  /**
   * Размонтирование текущего элемента
   */
  unmount() {
    if (this.mountedElement) {
      this.renderer.unmount(this.mountedElement);
      this.mountedElement = null;
    }
  }
  /**
   * Обновление текущего элемента новой конфигурацией
   */
  update(newConfig) {
    if (!this.mountedElement) {
      throw new Error("Нет смонтированного элемента для обновления");
    }
    const validationResult = this.validator.validate(newConfig);
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map((e) => e.message).join(", ");
      throw new Error(`Ошибка валидации: ${errorMessages}`);
    }
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
  findById(id) {
    if (!this.mountedElement) {
      return null;
    }
    return this.renderer.findElementById(this.mountedElement, id);
  }
  /**
   * Поиск элементов по классу
   */
  findByClass(className) {
    if (!this.mountedElement) {
      return [];
    }
    return this.renderer.findElementsByClass(this.mountedElement, className);
  }
  /**
   * Очистка всех ресурсов фреймворка включая плагины
   */
  cleanup() {
    this.unmount();
    this.renderer.cleanup();
    this.validator.reset();
    this.pluginManager.cleanup();
  }
  /**
   * Получение текущего смонтированного элемента
   */
  getMountedElement() {
    return this.mountedElement;
  }
}
const Framework = new JSFramework();
export {
  ComponentOptimizer,
  ComponentRenderer,
  ConfigValidator,
  DOMDiffer,
  DOMOptimizer,
  DOMPatcher,
  ForDirective,
  FormValidationPlugin,
  Framework,
  HTMLRenderer,
  I18nPlugin,
  IfDirective,
  JSFramework,
  LifecycleLoggerPlugin,
  MemoryManager,
  ModelDirective,
  PerformanceAnalyzer,
  PluginManager,
  PriorityScheduler,
  ShowDirective,
  StorePlugin,
  camelToKebab,
  cloneConfig,
  combineClasses,
  componentRegistry,
  computed,
  computedManager,
  createComponentComputed,
  createComponentInstance,
  createElement,
  createReactive,
  createTextNode,
  debounce,
  Framework as default,
  definePlugin,
  directiveManager,
  domDiffer,
  domPatcher,
  effect,
  enableTracking,
  escapeHtml,
  flushSync,
  getComponent,
  isComputedRef,
  isElementConfig,
  isReactive,
  isValidHtmlTag,
  memo,
  memoize,
  nextTick,
  pauseTracking,
  registerComponent,
  scheduleUpdate,
  scheduler,
  shallowReactive,
  stop,
  stylesToString,
  throttle,
  toRaw,
  useComputed
};
//# sourceMappingURL=js-framework.es.js.map
