import { ConfigValidator } from '../core/validator';
import { ElementConfig } from '../core/types';

describe('ConfigValidator', () => {
  let validator: ConfigValidator;

  beforeEach(() => {
    validator = new ConfigValidator();
  });

  describe('validateTag', () => {
    it('должен принимать валидные HTML теги', () => {
      const config: ElementConfig = { tag: 'div' };
      const result = validator.validate(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('должен отклонять невалидные теги', () => {
      const config: ElementConfig = { tag: 'invalid-tag' };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Неподдерживаемый HTML тег');
    });

    it('должен требовать обязательное поле tag', () => {
      const config = {} as ElementConfig;
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('обязательным'))).toBe(true);
    });

    it('должен требовать чтобы tag был строкой', () => {
      const config = { tag: 123 } as any;
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('должно быть строкой'))).toBe(true);
    });
  });

  describe('validateProps', () => {
    it('должен валидировать свойство class', () => {
      const config: ElementConfig = { 
        tag: 'div', 
        props: { class: 'test-class' }
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(true);
    });

    it('должен отклонять некорректный тип class', () => {
      const config: ElementConfig = { 
        tag: 'div', 
        props: { class: 123 } as any
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Класс должен быть строкой'))).toBe(true);
    });

    it('должен валидировать уникальность ID', () => {
      const config1: ElementConfig = { 
        tag: 'div', 
        props: { id: 'unique-id' }
      };
      const config2: ElementConfig = { 
        tag: 'span', 
        props: { id: 'unique-id' }
      };

      validator.validate(config1);
      const result = validator.validate(config2);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Дублирующийся ID'))).toBe(true);
    });

    it('должен валидировать объект стилей', () => {
      const config: ElementConfig = { 
        tag: 'div', 
        props: { 
          style: { 
            color: 'red',
            fontSize: '16px',
            margin: 10
          }
        }
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(true);
    });

    it('должен отклонять некорректные типы в стилях', () => {
      const config: ElementConfig = { 
        tag: 'div', 
        props: { 
          style: { 
            color: true 
          } as any
        }
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateChildren', () => {
    it('должен принимать массив дочерних элементов', () => {
      const config: ElementConfig = { 
        tag: 'div',
        children: [
          'Текст',
          { tag: 'span', children: ['Вложенный текст'] }
        ]
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(true);
    });

    it('должен отклонять дочерние элементы не в виде массива', () => {
      const config: ElementConfig = { 
        tag: 'div',
        children: 'не массив' as any
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('должны быть массивом'))).toBe(true);
    });

    it('должен рекурсивно валидировать вложенные элементы', () => {
      const config: ElementConfig = { 
        tag: 'div',
        children: [
          { tag: 'invalid-tag' }
        ]
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Неподдерживаемый HTML тег'))).toBe(true);
    });
  });

  describe('validateEvents', () => {
    it('должен принимать валидные обработчики событий', () => {
      const config: ElementConfig = { 
        tag: 'button',
        events: { 
          click: () => console.log('clicked'),
          mouseover: () => console.log('hover')
        }
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(true);
    });

    it('должен отклонять не-функции как обработчики', () => {
      const config: ElementConfig = { 
        tag: 'button',
        events: { 
          click: 'не функция' as any
        }
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('должен быть функцией'))).toBe(true);
    });

    it('должен отклонять неподдерживаемые типы событий', () => {
      const config: ElementConfig = { 
        tag: 'button',
        events: { 
          'invalid-event': () => {}
        }
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Неподдерживаемый тип события'))).toBe(true);
    });
  });

  describe('методы управления тегами', () => {
    it('должен возвращать список поддерживаемых тегов', () => {
      const tags = validator.getSupportedTags();
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.includes('div')).toBe(true);
      expect(tags.includes('span')).toBe(true);
    });

    it('должен позволять добавлять новые теги', () => {
      validator.addSupportedTag('custom-tag');
      const tags = validator.getSupportedTags();
      expect(tags.includes('custom-tag')).toBe(true);
    });

    it('должен позволять удалять теги', () => {
      validator.removeSupportedTag('div');
      const tags = validator.getSupportedTags();
      expect(tags.includes('div')).toBe(false);
    });
  });

  describe('reset', () => {
    it('должен очищать список использованных ID', () => {
      const config: ElementConfig = { 
        tag: 'div', 
        props: { id: 'test-id' }
      };
      
      validator.validate(config);
      validator.reset();
      
      // После reset тот же ID должен быть валидным
      const result = validator.validate(config);
      expect(result.isValid).toBe(true);
    });
  });

  describe('сложные сценарии', () => {
    it('должен валидировать глубоко вложенную структуру', () => {
      const config: ElementConfig = {
        tag: 'div',
        props: { class: 'container' },
        children: [
          {
            tag: 'header',
            children: [
              {
                tag: 'h1',
                children: ['Заголовок']
              },
              {
                tag: 'nav',
                children: [
                  {
                    tag: 'ul',
                    children: [
                      {
                        tag: 'li',
                        children: [
                          {
                            tag: 'a',
                            props: { href: '/home' },
                            children: ['Главная']
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(true);
    });

    it('должен находить ошибки на разных уровнях вложенности', () => {
      const config: ElementConfig = {
        tag: 'div',
        children: [
          {
            tag: 'span',
            props: { id: 'same-id' }
          },
          {
            tag: 'p',
            children: [
              {
                tag: 'strong',
                props: { id: 'same-id' } // Дублирующийся ID
              }
            ]
          }
        ]
      };

      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Дублирующийся ID'))).toBe(true);
    });
  });
});