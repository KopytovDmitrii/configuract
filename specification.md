# Спецификация JS Framework

## Обзор

Детальная спецификация реактивного JS-фреймворка для рендеринга HTML из конфигурационных объектов с поддержкой реактивности на основе Proxy API.

## Система конфигурирования

### Базовая структура элемента

```typescript
interface ElementConfig {
  tag: string;                    // HTML тег
  props?: {                       // Свойства элемента
    class?: string;
    id?: string;
    style?: Record<string, string>;
    [key: string]: any;
  };
  children?: (ElementConfig | string)[]; // Дочерние элементы
  component?: string;             // Имя компонента
  events?: Record<string, Function>; // Обработчики событий
  if?: string;                    // Условие рендеринга
  for?: string;                   // Цикл рендеринга
  model?: string;                 // Двусторонняя привязка
}
```

### Примеры конфигурации

#### 1. Простой HTML элемент
```json
{
  "tag": "div",
  "props": {
    "class": "container",
    "id": "main-wrapper",
    "style": {
      "background": "#f5f5f5",
      "padding": "20px",
      "border-radius": "8px"
    }
  },
  "children": [
    {
      "tag": "h1",
      "props": {
        "class": "title"
      },
      "children": ["Добро пожаловать в наш фреймворк"]
    }
  ]
}
```

#### 2. Использование компонентов
```json
{
  "component": "Button",
  "props": {
    "text": "Кликни меня",
    "variant": "primary",
    "size": "large",
    "disabled": false
  },
  "events": {
    "click": "handleButtonClick",
    "mouseover": "handleMouseOver"
  }
}
```

#### 3. Привязка событий
```json
{
  "tag": "form",
  "props": {
    "class": "login-form"
  },
  "events": {
    "submit": "handleFormSubmit"
  },
  "children": [
    {
      "tag": "input",
      "props": {
        "type": "text",
        "placeholder": "Введите имя пользователя",
        "class": "form-input"
      },
      "events": {
        "input": "handleUsernameChange",
        "blur": "validateUsername"
      }
    },
    {
      "tag": "button",
      "props": {
        "type": "submit",
        "class": "btn btn-primary"
      },
      "children": ["Войти"]
    }
  ]
}
```

#### 4. Условный рендеринг
```json
{
  "tag": "div",
  "if": "state.isLoggedIn",
  "children": [
    {
      "tag": "h2",
      "children": ["Добро пожаловать, {{state.user.name}}!"]
    },
    {
      "component": "UserProfile",
      "props": {
        "user": "{{state.user}}"
      }
    }
  ]
}
```

#### 5. Рендеринг списков
```json
{
  "tag": "ul",
  "props": {
    "class": "todo-list"
  },
  "children": {
    "for": "item in state.todoItems",
    "template": {
      "tag": "li",
      "props": {
        "key": "{{item.id}}",
        "class": "todo-item {{item.completed ? 'completed' : ''}}"
      },
      "children": [
        {
          "tag": "input",
          "props": {
            "type": "checkbox",
            "checked": "{{item.completed}}"
          },
          "model": "item.completed"
        },
        {
          "tag": "span",
          "children": ["{{item.text}}"]
        },
        {
          "tag": "button",
          "props": {
            "class": "delete-btn"
          },
          "events": {
            "click": "deleteItem({{item.id}})"
          },
          "children": ["×"]
        }
      ]
    }
  }
}
```

#### 6. Двусторонняя привязка данных
```json
{
  "tag": "div",
  "props": {
    "class": "form-group"
  },
  "children": [
    {
      "tag": "label",
      "children": ["Имя:"]
    },
    {
      "tag": "input",
      "props": {
        "type": "text",
        "value": "{{state.form.name}}"
      },
      "model": "state.form.name"
    },
    {
      "tag": "p",
      "children": ["Привет, {{state.form.name}}!"]
    }
  ]
}
```

#### 7. Композиция компонентов со слотами
```json
{
  "component": "Modal",
  "props": {
    "visible": "{{state.showModal}}",
    "title": "Подтверждение"
  },
  "slots": {
    "default": [
      {
        "tag": "p",
        "children": ["Вы уверены, что хотите удалить этот элемент?"]
      }
    ],
    "footer": [
      {
        "component": "Button",
        "props": {
          "text": "Отмена",
          "variant": "secondary"
        },
        "events": {
          "click": "closeModal"
        }
      },
      {
        "component": "Button",
        "props": {
          "text": "Удалить",
          "variant": "danger"
        },
        "events": {
          "click": "confirmDelete"
        }
      }
    ]
  }
}
```

## Реактивная система состояния

### Создание реактивного состояния
```typescript
const state = Framework.createState({
  user: {
    name: "Иван",
    age: 25,
    email: "ivan@example.com"
  },
  todos: [
    { id: 1, text: "Изучить фреймворк", completed: false },
    { id: 2, text: "Создать приложение", completed: false }
  ],
  ui: {
    loading: false,
    error: null,
    theme: "light"
  }
});
```

### Работа с состоянием
```typescript
// Чтение значений
console.log(state.user.name); // "Иван"

// Изменение значений (автоматически обновляет DOM)
state.user.name = "Петр";
state.todos.push({ id: 3, text: "Новая задача", completed: false });

// Работа с массивами
state.todos[0].completed = true;
state.todos.splice(1, 1); // Удаление элемента

// Работа с вложенными объектами
state.ui.loading = true;
state.ui.theme = "dark";
```

## Система компонентов

### Определение компонента
```typescript
interface Component {
  name: string;
  props?: Record<string, any>;
  state?: Record<string, any>;
  render(props: any, state: any): ElementConfig;
  onCreate?(): void;
  onMount?(): void;
  onUpdate?(changedProps: string[], changedState: string[]): void;
  onDestroy?(): void;
}
```

### Пример компонента
```typescript
const ButtonComponent: Component = {
  name: "Button",
  props: {
    text: "Кнопка",
    variant: "primary",
    size: "medium",
    disabled: false
  },
  render(props, state) {
    return {
      tag: "button",
      props: {
        class: `btn btn-${props.variant} btn-${props.size}`,
        disabled: props.disabled
      },
      events: {
        click: props.onClick
      },
      children: [props.text]
    };
  },
  onMount() {
    console.log("Button mounted");
  },
  onUpdate(changedProps) {
    console.log("Button updated:", changedProps);
  }
};
```

### Регистрация компонента
```typescript
Framework.registerComponent(ButtonComponent);
```

## Директивы

### Условные директивы
- `if` - условное отображение элемента
- `else-if` - альтернативное условие
- `else` - действие по умолчанию

```json
{
  "tag": "div",
  "if": "state.user.role === 'admin'",
  "children": ["Панель администратора"]
}
```

### Директивы циклов
- `for` - итерация по массиву или объекту
- `key` - уникальный ключ для оптимизации

```json
{
  "for": "user in state.users",
  "key": "user.id",
  "template": {
    "tag": "div",
    "children": ["{{user.name}}"]
  }
}
```

### Директивы привязки
- `model` - двусторонняя привязка данных
- `bind` - односторонняя привязка атрибутов

```json
{
  "tag": "input",
  "model": "state.searchQuery",
  "props": {
    "bind:placeholder": "state.placeholderText"
  }
}
```

## API фреймворка

### Основные методы

#### Framework.render()
```typescript
Framework.render(config: ElementConfig, container: HTMLElement | string): void
```
Рендерит конфигурацию в указанный контейнер.

#### Framework.createState()
```typescript
Framework.createState<T>(initialState: T): ReactiveState<T>
```
Создает реактивное состояние.

#### Framework.registerComponent()
```typescript
Framework.registerComponent(component: Component): void
```
Регистрирует компонент в системе.

#### Framework.mount()
```typescript
Framework.mount(selector: string): void
```
Монтирует приложение к DOM элементу.

#### Framework.unmount()
```typescript
Framework.unmount(): void
```
Размонтирует приложение и очищает ресурсы.

### Утилиты

#### createElement()
```typescript
function createElement(
  tag: string, 
  props?: any, 
  ...children: any[]
): ElementConfig
```

#### computed()
```typescript
function computed<T>(fn: () => T): ComputedRef<T>
```
Создает вычисляемое свойство.

#### watch()
```typescript
function watch(
  source: () => any, 
  callback: (newValue: any, oldValue: any) => void
): void
```
Наблюдает за изменениями в состоянии.

## Система событий

### Стандартные события DOM
```json
{
  "events": {
    "click": "handleClick",
    "mouseover": "handleMouseOver",
    "keydown": "handleKeyDown",
    "input": "handleInput",
    "change": "handleChange",
    "submit": "handleSubmit",
    "focus": "handleFocus",
    "blur": "handleBlur"
  }
}
```

### Пользовательские события
```typescript
// Создание пользовательского события
Framework.emit("custom-event", { data: "some data" });

// Подписка на событие
Framework.on("custom-event", (data) => {
  console.log("Получено событие:", data);
});
```

## Валидация конфигурации

### Правила валидации
1. **Обязательные поля**: `tag` или `component` должны быть указаны
2. **Типы данных**: проверка корректности типов для всех свойств
3. **Существование компонентов**: проверка регистрации компонентов
4. **Корректность директив**: валидация синтаксиса директив
5. **Уникальность ключей**: проверка уникальности ключей в циклах

### Обработка ошибок
```typescript
try {
  Framework.render(config, "#app");
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Ошибка валидации:", error.message);
  } else if (error instanceof RenderError) {
    console.error("Ошибка рендеринга:", error.message);
  }
}
```

## Оптимизация производительности

### Мемоизация
- Кеширование результатов рендеринга компонентов
- Пропуск перерендера при неизменных props

### Виртуальный DOM
- Минимальные изменения в реальном DOM
- Батчинг обновлений

### Lazy Loading
- Динамическая загрузка компонентов
- Асинхронная инициализация

### Tree Shaking
- Исключение неиспользуемого кода
- Минимальный размер bundle