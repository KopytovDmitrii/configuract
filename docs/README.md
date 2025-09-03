# JS Framework v1.0 - Документация

## Обзор

JS Framework - это современный, легкий и производительный JavaScript фреймворк для создания интерактивных веб-приложений. Фреймворк предоставляет полный набор инструментов для разработки, включая реактивную систему, компонентную архитектуру, директивы и систему плагинов.

## Основные возможности

### ✨ Реактивная система
- Автоматическое отслеживание зависимостей
- Proxy-based реактивность
- Computed свойства с кешированием
- Эффекты и наблюдатели

### 🧩 Компонентная архитектура
- Однофайловые компоненты
- Полный жизненный цикл компонентов
- Props и state с валидацией
- Композиция и слоты

### 🎯 Директивы
- Встроенные директивы (v-if, v-for, v-model, v-show)
- Двусторонняя привязка данных
- API для создания пользовательских директив

### 🔌 Система плагинов
- Расширяемая архитектура
- Встроенные плагины (Store, I18n, Validation)
- Легкое создание собственных плагинов

### ⚡ Производительность
- Виртуальный DOM с эффективным diffing
- Мемоизация и кеширование
- Батчинг обновлений DOM
- Виртуализация списков

## Быстрый старт

### Установка

```bash
npm install js-framework
# или
yarn add js-framework
```

### Базовое использование

```javascript
import { Framework } from 'js-framework';

// Создаем простой компонент
const HelloWorld = {
  name: 'HelloWorld',
  
  props: {
    name: { type: 'string', default: 'Мир' }
  },
  
  state: () => ({
    count: 0
  }),
  
  computed: {
    greeting() {
      return `Привет, ${this.props.name}!`;
    }
  },
  
  render(props, state, computed) {
    return {
      tag: 'div',
      children: [
        {
          tag: 'h1',
          children: [computed.greeting]
        },
        {
          tag: 'p',
          children: [`Счетчик: ${state.count}`]
        },
        {
          tag: 'button',
          props: { type: 'button' },
          children: ['Увеличить'],
          events: {
            click: () => state.count++
          }
        }
      ]
    };
  }
};

// Регистрируем компонент
Framework.registerComponent(HelloWorld);

// Рендерим в контейнер
Framework.render({
  component: 'HelloWorld',
  props: { name: 'JavaScript' }
}, '#app');
```

## Основные концепции

### Компоненты

Компоненты - основные строительные блоки приложения. Каждый компонент может иметь:

- **Props** - входящие данные
- **State** - локальное состояние
- **Computed** - вычисляемые свойства
- **Methods** - методы компонента
- **Lifecycle hooks** - хуки жизненного цикла

```javascript
const MyComponent = {
  name: 'MyComponent',
  
  props: {
    title: { type: 'string', required: true },
    items: { type: 'array', default: [] }
  },
  
  state: () => ({
    isVisible: true,
    selectedItem: null
  }),
  
  computed: {
    filteredItems() {
      return this.props.items.filter(item => item.active);
    }
  },
  
  methods: {
    selectItem(item) {
      this.state.selectedItem = item;
    },
    
    toggleVisibility() {
      this.state.isVisible = !this.state.isVisible;
    }
  },
  
  // Хуки жизненного цикла
  created() {
    console.log('Компонент создан');
  },
  
  mounted() {
    console.log('Компонент смонтирован в DOM');
  },
  
  beforeDestroy() {
    console.log('Компонент будет уничтожен');
  },
  
  render(props, state, computed) {
    return {
      tag: 'div',
      props: {
        class: `my-component ${state.isVisible ? 'visible' : 'hidden'}`
      },
      children: [
        {
          tag: 'h2',
          children: [props.title]
        },
        {
          tag: 'ul',
          children: computed.filteredItems.map(item => ({
            tag: 'li',
            key: item.id,
            children: [item.name],
            events: {
              click: () => this.methods.selectItem.call(this, item)
            }
          }))
        }
      ]
    };
  }
};
```

### Директивы

#### v-if - Условный рендеринг

```javascript
{
  tag: 'div',
  if: 'user.isLoggedIn',
  children: ['Добро пожаловать!']
}
```

#### v-for - Рендеринг списков

```javascript
{
  tag: 'ul',
  for: 'item in items',
  template: {
    tag: 'li',
    children: ['{{item.name}}']
  }
}
```

#### v-model - Двусторонняя привязка

```javascript
// Текстовое поле
{
  tag: 'input',
  props: { type: 'text', placeholder: 'Введите текст' },
  model: 'inputValue'
}

// Чекбокс
{
  tag: 'input',
  props: { type: 'checkbox' },
  model: 'isChecked'
}

// Селект
{
  tag: 'select',
  model: 'selectedOption',
  children: [
    { tag: 'option', props: { value: '1' }, children: ['Опция 1'] },
    { tag: 'option', props: { value: '2' }, children: ['Опция 2'] }
  ]
}
```

### Реактивная система

```javascript
import { createReactive, computed, effect } from 'js-framework';

// Создаем реактивный объект
const state = createReactive({
  count: 0,
  name: 'Test'
});

// Computed свойство
const doubleCount = computed(() => state.count * 2);

// Эффект, который выполняется при изменении зависимостей
effect(() => {
  console.log(`Count: ${state.count}, Double: ${doubleCount.value}`);
});

// Изменение состояния автоматически обновит computed и эффекты
state.count = 5; // Выведет: \"Count: 5, Double: 10\"
```

### Плагины

#### Использование встроенных плагинов

```javascript
import { Framework, StorePlugin, I18nPlugin } from 'js-framework';

// Плагин Store для управления состоянием
Framework.use(StorePlugin, {
  state: {
    user: null,
    todos: []
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    addTodo(state, todo) {
      state.todos.push(todo);
    }
  },
  actions: {
    async fetchUser({ commit }, userId) {
      const user = await api.getUser(userId);
      commit('setUser', user);
    }
  }
});

// Плагин интернационализации
Framework.use(I18nPlugin, {
  locale: 'ru',
  messages: {
    ru: {
      hello: 'Привет',
      goodbye: 'До свидания'
    },
    en: {
      hello: 'Hello',
      goodbye: 'Goodbye'
    }
  }
});
```

#### Создание собственного плагина

```javascript
import { definePlugin } from 'js-framework';

const MyPlugin = definePlugin({
  name: 'MyPlugin',
  version: '1.0.0',
  
  install(framework, options) {
    // Добавляем глобальные свойства
    framework.config('$myService', new MyService(options));
    
    // Регистрируем пользовательскую директиву
    framework.directive({
      name: 'my-directive',
      mounted(el, binding) {
        // Логика директивы
        el.style.backgroundColor = binding.value;
      }
    });
    
    // Добавляем глобальные методы
    framework.mixin({
      methods: {
        $myMethod() {
          return 'Hello from plugin!';
        }
      }
    });
  }
});

// Использование плагина
Framework.use(MyPlugin, { apiUrl: 'https://api.example.com' });
```

### Производительность

#### Мемоизация

```javascript
import { memo } from 'js-framework';

// Мемоизация дорогих вычислений
const expensiveComputation = memo((data) => {
  return data.map(item => heavyProcessing(item));
});

// Результат будет кеширован для одинаковых входных данных
const result1 = expensiveComputation(data); // Выполняется
const result2 = expensiveComputation(data); // Берется из кеша
```

#### Виртуализация списков

```javascript
import { DOMOptimizer } from 'js-framework';

const virtualList = DOMOptimizer.createVirtualList(
  items,           // Массив данных
  50,             // Высота одного элемента
  400             // Высота контейнера
);

// В рендере используем только видимые элементы
const { items: visibleItems, offsetY, totalHeight } = virtualList.getVisibleItems();
```

#### Батчинг обновлений

```javascript
import { DOMOptimizer } from 'js-framework';

// Группируем множественные DOM обновления
DOMOptimizer.batchUpdate(() => {
  element1.textContent = 'New text 1';
  element2.textContent = 'New text 2';
  element3.style.color = 'red';
});

// Все обновления выполнятся в одном кадре
```

## API Reference

### Framework

#### Методы

- `registerComponent(component)` - Регистрация компонента
- `render(config, container)` - Рендеринг в контейнер
- `use(plugin, options)` - Установка плагина
- `directive(directive)` - Регистрация директивы
- `config(name, value)` - Установка глобальной конфигурации
- `reactive(target)` - Создание реактивного объекта
- `computed(getter)` - Создание computed свойства
- `nextTick()` - Ожидание следующего обновления
- `cleanup()` - Очистка ресурсов

### Компонент

#### Свойства

- `name` - Имя компонента (обязательно)
- `props` - Определение входящих свойств
- `state` - Фабрика локального состояния
- `computed` - Вычисляемые свойства
- `methods` - Методы компонента
- `render` - Функция рендеринга (обязательно)

#### Хуки жизненного цикла

- `beforeCreate()` - До создания экземпляра
- `created()` - После создания экземпляра
- `beforeMount()` - Перед монтированием в DOM
- `mounted()` - После монтирования в DOM
- `beforeUpdate()` - Перед обновлением
- `updated()` - После обновления
- `beforeDestroy()` - Перед уничтожением
- `destroyed()` - После уничтожения

### Директивы

#### Встроенные

- `v-if` - Условное отображение
- `v-for` - Рендеринг списков
- `v-model` - Двусторонняя привязка
- `v-show` - Показать/скрыть элемент

#### Пользовательские

```javascript
const myDirective = {
  name: 'my-directive',
  
  // Хуки жизненного цикла директивы
  bind(el, binding) {}, 
  inserted(el, binding) {},
  update(el, binding, oldBinding) {},
  componentUpdated(el, binding, oldBinding) {},
  unbind(el, binding) {}
};
```

## Примеры использования

### Todo приложение

Полный пример многокомпонентного приложения находится в папке `examples/`:

- `TodoApp.component.ts` - Главный компонент
- `TodoList.component.ts` - Список задач
- `TodoItem.component.ts` - Элемент списка
- `TodoForm.component.ts` - Форма добавления
- `TodoFilters.component.ts` - Фильтры

### Запуск примеров

```bash
# Сборка фреймворка
npm run build

# Запуск HTTP сервера
python -m http.server 8000

# Откройте в браузере
http://localhost:8000/examples/todo-app.html
```

## Лучшие практики

### Структура компонентов

1. **Однофайловые компоненты** - Держите каждый компонент в отдельном файле
2. **Четкое именование** - Используйте PascalCase для имен компонентов
3. **Валидация props** - Всегда указывайте типы и требования для props
4. **Чистые функции** - Делайте computed свойства чистыми функциями

### Производительность

1. **Мемоизация** - Используйте `memo()` для дорогих вычислений
2. **Виртуализация** - Для больших списков используйте виртуализацию
3. **Батчинг** - Группируйте DOM обновления
4. **Ленивая загрузка** - Загружайте компоненты по требованию

### Управление состоянием

1. **Локальное состояние** - Для простых компонентов используйте локальное состояние
2. **Глобальное состояние** - Для общих данных используйте Store плагин
3. **Computed свойства** - Для производных данных используйте computed
4. **Избегайте мутаций** - Не изменяйте props напрямую

## Сравнение с другими фреймворками

| Характеристика | JS Framework | React | Vue | Angular |
|----------------|--------------|-------|-----|----------|
| Размер (gzipped) | ~25KB | ~42KB | ~34KB | ~130KB |
| Время обучения | Низкое | Среднее | Низкое | Высокое |
| TypeScript | Полная поддержка | Хорошая | Хорошая | Встроенная |
| Производительность | Высокая | Высокая | Высокая | Средняя |
| Экосистема | Растущая | Богатая | Богатая | Богатая |

## Вклад в проект

Мы приветствуем вклад сообщества! Пожалуйста:

1. Форкните репозиторий
2. Создайте ветку для фичи (`git checkout -b feature/amazing-feature`)
3. Коммитьте изменения (`git commit -m 'Add amazing feature'`)
4. Пушьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

### Разработка

```bash
# Клонирование репозитория
git clone https://github.com/username/js-framework.git

# Установка зависимостей
npm install

# Запуск тестов
npm test

# Сборка
npm run build

# Линтинг
npm run lint
```

## Лицензия

MIT License - см. файл LICENSE для деталей.

## Поддержка

- 📧 Email: support@js-framework.dev
- 💬 Discord: [Сообщество JS Framework](https://discord.gg/js-framework)
- 🐛 Issues: [GitHub Issues](https://github.com/username/js-framework/issues)
- 📖 Документация: [docs.js-framework.dev](https://docs.js-framework.dev)

---

**JS Framework v1.0** - Создан с ❤️ для современной веб-разработки."