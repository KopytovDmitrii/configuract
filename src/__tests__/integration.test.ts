import { JSFramework } from '../index';
import { ElementConfig } from '../core/types';

describe('Интеграционные тесты JSFramework', () => {
  let framework: JSFramework;
  let container: HTMLElement;

  beforeEach(() => {
    framework = new JSFramework();
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    framework.cleanup();
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  });

  describe('полный цикл рендеринга', () => {
    it('должен рендерить простое приложение', () => {
      const config: ElementConfig = {
        tag: 'div',
        props: { 
          class: 'app',
          id: 'main-app'
        },
        children: [
          {
            tag: 'h1',
            children: ['Добро пожаловать в JS Framework']
          },
          {
            tag: 'p',
            children: ['Это простой пример использования фреймворка.']
          }
        ]
      };

      const element = framework.render(config, container);

      expect(element.classList.contains('app')).toBe(true);
      expect(element.id).toBe('main-app');
      expect(element.querySelector('h1')?.textContent).toBe('Добро пожаловать в JS Framework');
      expect(element.querySelector('p')?.textContent).toBe('Это простой пример использования фреймворка.');
    });

    it('должен рендерить интерактивное приложение с событиями', () => {
      let clickCount = 0;
      const handleClick = () => {
        clickCount++;
      };

      const config: ElementConfig = {
        tag: 'div',
        props: { class: 'interactive-app' },
        children: [
          {
            tag: 'h2',
            children: ['Счётчик кликов']
          },
          {
            tag: 'button',
            props: { 
              class: 'btn btn-primary',
              id: 'counter-button'
            },
            events: { click: handleClick },
            children: ['Нажми меня']
          },
          {
            tag: 'div',
            props: { class: 'counter-display' },
            children: [`Количество кликов: ${clickCount}`]
          }
        ]
      };

      const element = framework.render(config, container);
      const button = element.querySelector('#counter-button') as HTMLButtonElement;

      expect(button).toBeTruthy();
      expect(clickCount).toBe(0);

      button.click();
      expect(clickCount).toBe(1);

      button.click();
      button.click();
      expect(clickCount).toBe(3);
    });

    it('должен рендерить форму с различными типами элементов', () => {
      const submitHandler = jest.fn();

      const config: ElementConfig = {
        tag: 'form',
        props: { class: 'test-form' },
        events: { submit: submitHandler },
        children: [
          {
            tag: 'div',
            props: { class: 'form-group' },
            children: [
              {
                tag: 'label',
                props: { for: 'username' },
                children: ['Имя пользователя:']
              },
              {
                tag: 'input',
                props: {
                  type: 'text',
                  id: 'username',
                  name: 'username',
                  placeholder: 'Введите имя пользователя',
                  required: true
                }
              }
            ]
          },
          {
            tag: 'div',
            props: { class: 'form-group' },
            children: [
              {
                tag: 'label',
                props: { for: 'email' },
                children: ['Email:']
              },
              {
                tag: 'input',
                props: {
                  type: 'email',
                  id: 'email',
                  name: 'email',
                  placeholder: 'Введите email'
                }
              }
            ]
          },
          {
            tag: 'div',
            props: { class: 'form-group' },
            children: [
              {
                tag: 'label',
                props: { for: 'message' },
                children: ['Сообщение:']
              },
              {
                tag: 'textarea',
                props: {
                  id: 'message',
                  name: 'message',
                  rows: 4,
                  cols: 50
                }
              }
            ]
          },
          {
            tag: 'button',
            props: { 
              type: 'submit',
              class: 'submit-btn'
            },
            children: ['Отправить']
          }
        ]
      };

      const element = framework.render(config, container);

      expect(element.tagName).toBe('FORM');
      expect(element.querySelector('#username')).toBeTruthy();
      expect(element.querySelector('#email')).toBeTruthy();
      expect(element.querySelector('#message')).toBeTruthy();
      expect(element.querySelector('.submit-btn')).toBeTruthy();

      // Симуляция отправки формы
      const form = element as HTMLFormElement;
      form.dispatchEvent(new Event('submit'));
      expect(submitHandler).toHaveBeenCalled();
    });

    it('должен рендерить сложную навигационную структуру', () => {
      const config: ElementConfig = {
        tag: 'div',
        props: { class: 'navigation-app' },
        children: [
          {
            tag: 'header',
            props: { class: 'header' },
            children: [
              {
                tag: 'nav',
                props: { class: 'navbar' },
                children: [
                  {
                    tag: 'div',
                    props: { class: 'nav-brand' },
                    children: [
                      {
                        tag: 'a',
                        props: { href: '/' },
                        children: ['JS Framework']
                      }
                    ]
                  },
                  {
                    tag: 'ul',
                    props: { class: 'nav-menu' },
                    children: [
                      {
                        tag: 'li',
                        props: { class: 'nav-item' },
                        children: [
                          {
                            tag: 'a',
                            props: { 
                              href: '/home',
                              class: 'nav-link active'
                            },
                            children: ['Главная']
                          }
                        ]
                      },
                      {
                        tag: 'li',
                        props: { class: 'nav-item' },
                        children: [
                          {
                            tag: 'a',
                            props: { 
                              href: '/about',
                              class: 'nav-link'
                            },
                            children: ['О нас']
                          }
                        ]
                      },
                      {
                        tag: 'li',
                        props: { class: 'nav-item' },
                        children: [
                          {
                            tag: 'a',
                            props: { 
                              href: '/contact',
                              class: 'nav-link'
                            },
                            children: ['Контакты']
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            tag: 'main',
            props: { class: 'main-content' },
            children: [
              {
                tag: 'section',
                props: { class: 'hero' },
                children: [
                  {
                    tag: 'h1',
                    children: ['Добро пожаловать']
                  },
                  {
                    tag: 'p',
                    children: ['Это пример сложной навигационной структуры.']
                  }
                ]
              }
            ]
          }
        ]
      };

      const element = framework.render(config, container);

      expect(element.querySelector('header')).toBeTruthy();
      expect(element.querySelector('nav.navbar')).toBeTruthy();
      expect(element.querySelector('.nav-brand a')).toBeTruthy();
      expect(element.querySelectorAll('.nav-item')).toHaveLength(3);
      expect(element.querySelector('main.main-content')).toBeTruthy();
      expect(element.querySelector('.hero h1')?.textContent).toBe('Добро пожаловать');
    });
  });

  describe('обновление и размонтирование', () => {
    it('должен корректно обновлять приложение', () => {
      const initialConfig: ElementConfig = {
        tag: 'div',
        props: { class: 'app version-1' },
        children: [
          {
            tag: 'h1',
            children: ['Версия 1']
          }
        ]
      };

      const updatedConfig: ElementConfig = {
        tag: 'div',
        props: { class: 'app version-2' },
        children: [
          {
            tag: 'h1',
            children: ['Версия 2']
          },
          {
            tag: 'p',
            children: ['Обновлённое содержимое']
          }
        ]
      };

      const element1 = framework.render(initialConfig, container);
      expect(element1.classList.contains('version-1')).toBe(true);
      expect(element1.querySelector('h1')?.textContent).toBe('Версия 1');
      expect(element1.querySelector('p')).toBeFalsy();

      const element2 = framework.update(updatedConfig);
      expect(element2.classList.contains('version-2')).toBe(true);
      expect(element2.querySelector('h1')?.textContent).toBe('Версия 2');
      expect(element2.querySelector('p')?.textContent).toBe('Обновлённое содержимое');
    });

    it('должен корректно размонтировать приложение', () => {
      const clickHandler = jest.fn();
      const config: ElementConfig = {
        tag: 'div',
        children: [
          {
            tag: 'button',
            events: { click: clickHandler },
            children: ['Тестовая кнопка']
          }
        ]
      };

      const element = framework.render(config, container);
      const button = element.querySelector('button')!;

      // Проверяем что элемент в DOM и события работают
      expect(container.contains(element)).toBe(true);
      button.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);

      // Размонтируем
      framework.unmount();
      expect(container.contains(element)).toBe(false);

      // Проверяем что события больше не работают
      button.click();
      expect(clickHandler).toHaveBeenCalledTimes(1); // не должно увеличиться
    });
  });

  describe('поиск элементов', () => {
    it('должен находить элементы по ID и классу', () => {
      const config: ElementConfig = {
        tag: 'div',
        children: [
          {
            tag: 'div',
            props: { id: 'unique-element' },
            children: ['Уникальный элемент']
          },
          {
            tag: 'span',
            props: { class: 'common-class' },
            children: ['Первый span']
          },
          {
            tag: 'p',
            props: { class: 'common-class' },
            children: ['Параграф']
          }
        ]
      };

      framework.render(config, container);

      const uniqueElement = framework.findById('unique-element');
      expect(uniqueElement).toBeTruthy();
      expect(uniqueElement?.textContent).toBe('Уникальный элемент');

      const commonElements = framework.findByClass('common-class');
      expect(commonElements).toHaveLength(2);
      expect(commonElements[0].tagName).toBe('SPAN');
      expect(commonElements[1].tagName).toBe('P');
    });
  });

  describe('обработка ошибок валидации', () => {
    it('должен выбрасывать ошибку при невалидной конфигурации', () => {
      const invalidConfig: ElementConfig = {
        tag: 'invalid-tag'
      };

      expect(() => {
        framework.render(invalidConfig, container);
      }).toThrow('Ошибка валидации');
    });

    it('должен выбрасывать ошибку при попытке рендера в несуществующий контейнер', () => {
      const config: ElementConfig = { tag: 'div' };

      expect(() => {
        framework.render(config, '#non-existent-container');
      }).toThrow('Контейнер не найден');
    });

    it('должен выбрасывать ошибку при попытке обновления без смонтированного элемента', () => {
      const config: ElementConfig = { tag: 'div' };

      expect(() => {
        framework.update(config);
      }).toThrow('Нет смонтированного элемента');
    });
  });

  describe('статистика и производительность', () => {
    it('должен собирать статистику рендеринга', () => {
      const config: ElementConfig = {
        tag: 'div',
        events: { click: () => {} },
        children: [
          { tag: 'span', events: { mouseover: () => {} } },
          { tag: 'p' },
          { tag: 'button', events: { click: () => {}, mousedown: () => {} } }
        ]
      };

      framework.render(config, container);
      const stats = framework.getStats();

      expect(stats.elementsCreated).toBe(4); // div + span + p + button
      expect(stats.eventsAttached).toBe(4); // 1 + 1 + 0 + 2
      expect(stats.renderTime).toBeGreaterThan(0);
    });

    it('должен быстро рендерить большое количество элементов', () => {
      const children = Array.from({ length: 100 }, (_, i) => ({
        tag: 'div' as const,
        props: { id: `item-${i}` },
        children: [`Элемент ${i}`]
      }));

      const config: ElementConfig = {
        tag: 'div',
        props: { class: 'large-list' },
        children
      };

      const startTime = performance.now();
      framework.render(config, container);
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(100); // должно рендериться менее чем за 100ms

      const stats = framework.getStats();
      expect(stats.elementsCreated).toBe(101); // 100 дочерних + 1 родительский
    });
  });
});