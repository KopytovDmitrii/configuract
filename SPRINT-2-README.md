# Компонентная система - Спринт 2

## Реализованная функциональность

### ✅ Система реактивности на основе Proxy
- Автоматическое отслеживание изменений состояния
- Эффективное обновление только измененных частей DOM
- Поддержка вложенных объектов и массивов

### ✅ Компонентная архитектура
- Регистрация и использование однофайловых компонентов
- Жизненный цикл: onCreate, onMount, onUpdate, onDestroy
- Изолированное состояние для каждого экземпляра

### ✅ Система директив
- `v-if` - условное отображение
- `v-for` - рендеринг списков
- `v-show` - показать/скрыть элемент
- `v-model` - двунаправленная привязка данных

### ✅ DOM Diffing
- Эффективное обновление DOM при изменениях
- Поддержка ключей для оптимизации списков
- Минимальные манипуляции с DOM

### ✅ Планировщик обновлений
- Батчинг изменений через requestAnimationFrame
- Предотвращение избыточных обновлений
- Поддержка приоритетов

## Структура файлов

```
src/core/
├── reactive.ts          # Система реактивности
├── scheduler.ts         # Планировщик обновлений  
├── component-registry.ts # Реестр компонентов
├── component-renderer.ts # Рендерер с поддержкой компонентов
├── directives.ts        # Система директив
├── dom-differ.ts        # DOM diffing алгоритм
└── types.ts            # Расширенные типы

examples/components/
├── Button.component.ts    # Пример компонента кнопки
├── Counter.component.ts   # Пример счетчика
└── TodoList.component.ts  # Пример списка задач
```

## Примеры использования

### Создание компонента

```typescript
import { Component } from '../src/core/types';

export const MyComponent: Component = {
  name: 'MyComponent',
  
  props: {
    title: { type: 'string', default: 'Заголовок' }
  },
  
  state: () => ({
    count: 0
  }),
  
  render(props, state) {
    return {
      tag: 'div',
      children: [
        {
          tag: 'h2',
          children: [props.title]
        },
        {
          tag: 'p',
          children: [`Счетчик: ${state.count}`]
        },
        {
          tag: 'button',
          events: {
            click: () => state.count++
          },
          children: ['Увеличить']
        }
      ]
    };
  }
};
```

### Использование компонента

```typescript
import { Framework } from './src/index';
import { MyComponent } from './components/MyComponent';

// Регистрируем компонент
Framework.registerComponent(MyComponent);

// Используем в конфигурации
Framework.render({
  component: 'MyComponent',
  props: {
    title: 'Мой счетчик'
  }
}, document.getElementById('app'));
```

### Директивы

```typescript
// Условное отображение
{
  tag: 'div',
  if: 'user.isLoggedIn',
  children: ['Добро пожаловать!']
}

// Списки
{
  for: 'item in items',
  key: 'item.id',
  template: {
    tag: 'li',
    children: ['{{item.name}}']
  }
}

// Двунаправленная привязка
{
  tag: 'input',
  model: 'message'
}
```

## Тестирование

```bash
# Запуск тестов
npm test

# Сборка фреймворка
npm run build

# Открытие примеров
# Откройте examples/components-demo.html в браузере
```

## Следующие шаги

1. Добавление анимаций и переходов
2. Роутинг между компонентами  
3. Глобальное управление состоянием
4. Server-Side Rendering (SSR)
5. Инструменты разработки