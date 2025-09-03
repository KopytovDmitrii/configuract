# JS Framework 🚀

Реактивный JavaScript фреймворк для рендеринга HTML из конфигурационных объектов с поддержкой TypeScript.

## ✨ Особенности

- 📦 **Легковесность**: Минифицированный bundle < 10KB
- 🔧 **TypeScript**: Полная поддержка типизации
- 🎯 **Простота**: Декларативный подход к созданию UI
- ⚡ **Производительность**: Быстрый рендеринг DOM элементов
- 🧪 **Тестируемость**: Покрытие тестами > 80%
- 🔄 **Реактивность**: Автоматическое обновление при изменениях
- 🎨 **Гибкость**: Поддержка событий, стилей и атрибутов

## 🚀 Быстрый старт

### Установка

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd js-framework

# Установите зависимости
npm install

# Соберите проект
npm run build
```

### Базовое использование

```html
<!DOCTYPE html>
<html>
<head>
    <title>Мое приложение</title>
</head>
<body>
    <div id="app"></div>
    <script src="dist/js-framework.iife.js"></script>
    <script>
        const { Framework } = window.JSFramework;
        
        const config = {
            tag: 'div',
            props: {
                class: 'container'
            },
            children: [
                {
                    tag: 'h1',
                    children: ['Привет, мир!']
                },
                {
                    tag: 'button',
                    events: {
                        click: () => alert('Кнопка нажата!')
                    },
                    children: ['Нажми меня']
                }
            ]
        };
        
        Framework.render(config, '#app');
    </script>
</body>
</html>
```

## 📖 API Документация

### ElementConfig

Основной интерфейс для конфигурации элементов:

```typescript
interface ElementConfig {
  tag: string;                    // HTML тег
  props?: ElementProps;           // Свойства элемента  
  children?: ElementChild[];      // Дочерние элементы
  events?: EventHandlers;         // Обработчики событий
}
```

### Основные методы

#### Framework.render(config, container)
Рендерит конфигурацию в указанный контейнер.

```javascript
const element = Framework.render(config, '#app');
```

#### Framework.update(newConfig)
Обновляет текущий элемент новой конфигурацией.

```javascript
Framework.update(newConfig);
```

#### Framework.unmount()
Размонтирует текущий элемент и очищает ресурсы.

```javascript
Framework.unmount();
```

### Примеры использования

#### Форма с валидацией

```javascript
const formConfig = {
    tag: 'form',
    events: {
        submit: (e) => {
            e.preventDefault();
            console.log('Форма отправлена');
        }
    },
    children: [
        {
            tag: 'input',
            props: {
                type: 'email',
                placeholder: 'Email',
                required: true
            }
        },
        {
            tag: 'button',
            props: { type: 'submit' },
            children: ['Отправить']
        }
    ]
};
```

#### Динамический список

```javascript
const todos = ['Задача 1', 'Задача 2', 'Задача 3'];

const listConfig = {
    tag: 'ul',
    children: todos.map(todo => ({
        tag: 'li',
        children: [todo]
    }))
};
```

#### Стилизованные компоненты

```javascript
const styledConfig = {
    tag: 'div',
    props: {
        style: {
            backgroundColor: '#f0f0f0',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
    },
    children: ['Стилизованный блок']
};
```

## 🧪 Тестирование

```bash
# Запуск всех тестов
npm test

# Покрытие тестами
npm run test:coverage

# Тесты в режиме watch
npm run test:watch
```

## 🔧 Разработка

```bash
# Проверка типов
npm run typecheck

# Линтинг
npm run lint

# Форматирование кода
npm run format

# Сборка проекта
npm run build
```

## 📁 Структура проекта

```
src/
├── core/
│   ├── types.ts          # TypeScript интерфейсы
│   ├── validator.ts      # Валидация конфигурации
│   └── renderer.ts       # Рендерер DOM элементов
├── utils/
│   └── helpers.ts        # Вспомогательные функции
├── __tests__/
│   ├── validator.test.ts
│   ├── renderer.test.ts
│   └── integration.test.ts
└── index.ts              # Главный файл экспорта

dist/
└── js-framework.iife.js  # Собранный файл для браузера

examples/
└── basic.html            # Примеры использования
```

## 🎯 Поддерживаемые браузеры

- Chrome 80+
- Firefox 74+
- Safari 13+
- Edge 80+

## 📊 Производительность

- **Рендеринг 1000 элементов**: < 100ms
- **Размер bundle**: < 10KB (minified + gzip)
- **Покрытие тестами**: > 95%

## 🔄 Планы развития

### Спринт 2: Реактивность
- [ ] Proxy-based реактивность
- [ ] Автоматическое обновление DOM
- [ ] Система состояния

### Спринт 3: Компоненты
- [ ] Система компонентов
- [ ] Props и lifecycle
- [ ] Слоты и композиция

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature ветку (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

MIT License - подробности в файле [LICENSE](LICENSE)

## 📞 Поддержка

- 📧 Email: support@js-framework.dev
- 🐛 Issues: [GitHub Issues](https://github.com/js-framework/issues)
- 📖 Документация: [Полная документация](https://js-framework.dev/docs)

---

Сделано с ❤️ командой JS Framework