import { HTMLRenderer } from '../core/renderer';
import { ElementConfig } from '../core/types';

describe('HTMLRenderer', () => {
  let renderer: HTMLRenderer;
  let container: HTMLElement;

  beforeEach(() => {
    renderer = new HTMLRenderer();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    renderer.cleanup();
  });

  describe('базовый рендеринг', () => {
    it('должен создавать простой HTML элемент', () => {
      const config: ElementConfig = { tag: 'div' };
      const element = renderer.render(config, container);

      expect(element.tagName).toBe('DIV');
      expect(container.contains(element)).toBe(true);
    });

    it('должен создавать элементы с различными тегами', () => {
      const configs = [
        { tag: 'span' },
        { tag: 'p' },
        { tag: 'button' },
        { tag: 'h1' }
      ];

      configs.forEach(config => {
        const newContainer = document.createElement('div');
        const element = renderer.render(config, newContainer);
        expect(element.tagName).toBe(config.tag.toUpperCase());
      });
    });
  });

  describe('применение свойств', () => {
    it('должен применять CSS классы', () => {
      const config: ElementConfig = { 
        tag: 'div', 
        props: { class: 'test-class another-class' }
      };
      const element = renderer.render(config, container);

      expect(element.className).toBe('test-class another-class');
    });

    it('должен применять ID', () => {
      const config: ElementConfig = { 
        tag: 'div', 
        props: { id: 'unique-id' }
      };
      const element = renderer.render(config, container);

      expect(element.id).toBe('unique-id');
    });

    it('должен применять стили', () => {
      const config: ElementConfig = { 
        tag: 'div', 
        props: { 
          style: { 
            color: 'red',
            fontSize: '16px',
            backgroundColor: 'blue'
          }
        }
      };
      const element = renderer.render(config, container);

      expect(element.style.color).toBe('red');
      expect(element.style.fontSize).toBe('16px');
      expect(element.style.backgroundColor).toBe('blue');
    });

    it('должен применять camelCase стили как kebab-case', () => {
      const config: ElementConfig = { 
        tag: 'div', 
        props: { 
          style: { 
            marginTop: '10px',
            borderRadius: '5px'
          }
        }
      };
      const element = renderer.render(config, container);

      expect(element.style.marginTop).toBe('10px');
      expect(element.style.borderRadius).toBe('5px');
    });

    it('должен применять произвольные HTML атрибуты', () => {
      const config: ElementConfig = { 
        tag: 'input', 
        props: { 
          type: 'text',
          placeholder: 'Введите текст',
          required: true
        }
      };
      const element = renderer.render(config, container) as HTMLInputElement;

      expect(element.type).toBe('text');
      expect(element.placeholder).toBe('Введите текст');
      expect(element.hasAttribute('required')).toBe(true);
    });
  });

  describe('рендеринг дочерних элементов', () => {
    it('должен рендерить текстовые узлы', () => {
      const config: ElementConfig = { 
        tag: 'p',
        children: ['Это текст']
      };
      const element = renderer.render(config, container);

      expect(element.textContent).toBe('Это текст');
    });

    it('должен рендерить вложенные элементы', () => {
      const config: ElementConfig = { 
        tag: 'div',
        children: [
          { tag: 'span', children: ['Вложенный текст'] }
        ]
      };
      const element = renderer.render(config, container);

      expect(element.children.length).toBe(1);
      expect(element.children[0].tagName).toBe('SPAN');
      expect(element.children[0].textContent).toBe('Вложенный текст');
    });

    it('должен рендерить смешанное содержимое', () => {
      const config: ElementConfig = { 
        tag: 'div',
        children: [
          'Текст до',
          { tag: 'strong', children: ['жирный текст'] },
          'текст после'
        ]
      };
      const element = renderer.render(config, container);

      expect(element.children.length).toBe(1); // только strong элемент
      expect(element.childNodes.length).toBe(3); // 2 текстовых узла + 1 элемент
      expect(element.textContent).toBe('Текст дожирный тексттекст после');
    });

    it('должен рендерить глубоко вложенные структуры', () => {
      const config: ElementConfig = { 
        tag: 'div',
        children: [
          {
            tag: 'ul',
            children: [
              {
                tag: 'li',
                children: ['Элемент 1']
              },
              {
                tag: 'li',
                children: [
                  {
                    tag: 'a',
                    props: { href: '#' },
                    children: ['Ссылка']
                  }
                ]
              }
            ]
          }
        ]
      };
      const element = renderer.render(config, container);

      const ul = element.querySelector('ul');
      expect(ul).toBeTruthy();
      expect(ul!.children.length).toBe(2);
      
      const firstLi = ul!.children[0];
      expect(firstLi.textContent).toBe('Элемент 1');
      
      const secondLi = ul!.children[1];
      const link = secondLi.querySelector('a');
      expect(link).toBeTruthy();
      expect(link!.textContent).toBe('Ссылка');
      expect(link!.getAttribute('href')).toBe('#');
    });
  });

  describe('обработка событий', () => {
    it('должен привязывать обработчики событий', () => {
      const clickHandler = jest.fn();
      const config: ElementConfig = { 
        tag: 'button', 
        events: { click: clickHandler }
      };
      const element = renderer.render(config, container);

      element.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    it('должен привязывать несколько событий', () => {
      const clickHandler = jest.fn();
      const mouseoverHandler = jest.fn();
      
      const config: ElementConfig = { 
        tag: 'button', 
        events: { 
          click: clickHandler,
          mouseover: mouseoverHandler
        }
      };
      const element = renderer.render(config, container);

      element.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);
      
      element.dispatchEvent(new MouseEvent('mouseover'));
      expect(mouseoverHandler).toHaveBeenCalledTimes(1);
    });

    it('должен передавать event объект в обработчики', () => {
      const clickHandler = jest.fn();
      const config: ElementConfig = { 
        tag: 'button', 
        events: { click: clickHandler }
      };
      const element = renderer.render(config, container);

      element.click();
      expect(clickHandler).toHaveBeenCalledWith(expect.any(MouseEvent));
    });
  });

  describe('размонтирование', () => {
    it('должен удалять элемент из DOM', () => {
      const config: ElementConfig = { tag: 'div' };
      const element = renderer.render(config, container);

      expect(container.contains(element)).toBe(true);
      
      renderer.unmount(element);
      expect(container.contains(element)).toBe(false);
    });

    it('должен очищать обработчики событий при размонтировании', () => {
      const clickHandler = jest.fn();
      const config: ElementConfig = { 
        tag: 'button', 
        events: { click: clickHandler }
      };
      const element = renderer.render(config, container);

      renderer.unmount(element);
      
      // После размонтирования событие не должно срабатывать
      element.click();
      expect(clickHandler).not.toHaveBeenCalled();
    });

    it('должен рекурсивно размонтировать дочерние элементы', () => {
      const childClickHandler = jest.fn();
      const config: ElementConfig = { 
        tag: 'div',
        children: [
          {
            tag: 'button',
            events: { click: childClickHandler }
          }
        ]
      };
      const element = renderer.render(config, container);
      const button = element.querySelector('button')!;

      renderer.unmount(element);
      
      // Обработчик дочернего элемента должен быть очищен
      button.click();
      expect(childClickHandler).not.toHaveBeenCalled();
    });
  });

  describe('обновление элементов', () => {
    it('должен обновлять элемент новой конфигурацией', () => {
      const initialConfig: ElementConfig = { 
        tag: 'div',
        props: { class: 'old-class' },
        children: ['Старый текст']
      };
      const element = renderer.render(initialConfig, container);

      const newConfig: ElementConfig = { 
        tag: 'div',
        props: { class: 'new-class' },
        children: ['Новый текст']
      };
      const newElement = renderer.update(element, newConfig);

      expect(newElement.className).toBe('new-class');
      expect(newElement.textContent).toBe('Новый текст');
      expect(container.contains(newElement)).toBe(true);
      expect(container.contains(element)).toBe(false);
    });
  });

  describe('утилитарные методы', () => {
    it('должен находить элементы по ID', () => {
      const config: ElementConfig = { 
        tag: 'div',
        children: [
          {
            tag: 'span',
            props: { id: 'target-element' },
            children: ['Найди меня']
          }
        ]
      };
      const element = renderer.render(config, container);

      const found = renderer.findElementById(element, 'target-element');
      expect(found).toBeTruthy();
      expect(found!.tagName).toBe('SPAN');
      expect(found!.textContent).toBe('Найди меня');
    });

    it('должен находить элементы по классу', () => {
      const config: ElementConfig = { 
        tag: 'div',
        children: [
          {
            tag: 'span',
            props: { class: 'target-class' },
            children: ['Первый']
          },
          {
            tag: 'p',
            props: { class: 'target-class' },
            children: ['Второй']
          }
        ]
      };
      const element = renderer.render(config, container);

      const found = renderer.findElementsByClass(element, 'target-class');
      expect(found).toHaveLength(2);
      expect(found[0].tagName).toBe('SPAN');
      expect(found[1].tagName).toBe('P');
    });

    it('должен возвращать статистику рендеринга', () => {
      const config: ElementConfig = { 
        tag: 'div',
        children: [
          { tag: 'span' },
          { tag: 'p' }
        ],
        events: { click: () => {} }
      };
      
      renderer.render(config, container);
      const stats = renderer.getStats();

      expect(stats.elementsCreated).toBeGreaterThan(0);
      expect(stats.eventsAttached).toBe(1);
      expect(stats.renderTime).toBeGreaterThan(0);
    });

    it('должен подсчитывать привязанные обработчики событий', () => {
      const config: ElementConfig = { 
        tag: 'div',
        events: { click: () => {}, mouseover: () => {} },
        children: [
          {
            tag: 'button',
            events: { click: () => {} }
          }
        ]
      };
      
      renderer.render(config, container);
      const count = renderer.getEventListenersCount();
      
      expect(count).toBe(3); // 2 на div + 1 на button
    });
  });

  describe('обработка ошибок', () => {
    it('должен обрабатывать некорректные дочерние элементы', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const config: ElementConfig = { 
        tag: 'div',
        children: [
          null as any,
          undefined as any,
          123 as any
        ]
      };
      
      const element = renderer.render(config, container);
      expect(element.children.length).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});