import { ElementConfig } from '../core/types';

/**
 * Утилиты для работы с элементами
 */

/**
 * Создание простого элемента с минимальной конфигурацией
 */
export function createElement(tag: string, props?: any, children?: any[]): ElementConfig {
  const config: ElementConfig = {
    tag,
    props
  };
  
  if (children !== undefined) {
    config.children = children;
  }
  
  return config;
}

/**
 * Проверка валидности HTML тега
 */
export function isValidHtmlTag(tag: string): boolean {
  const validTags = [
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'button', 'input', 'form', 'label', 'textarea', 'select', 'option',
    'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
    'header', 'footer', 'main', 'section', 'article', 'nav',
    'strong', 'em', 'small', 'br', 'hr'
  ];
  return validTags.includes(tag.toLowerCase());
}

/**
 * Преобразование camelCase в kebab-case
 */
export function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Escape HTML специальных символов
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Проверка является ли объект ElementConfig
 */
export function isElementConfig(obj: any): obj is ElementConfig {
  return obj && typeof obj === 'object' && typeof obj.tag === 'string';
}

/**
 * Глубокое клонирование конфигурации
 */
export function cloneConfig(config: ElementConfig): ElementConfig {
  return JSON.parse(JSON.stringify(config));
}

/**
 * Создание текстового узла
 */
export function createTextNode(text: string): string {
  return String(text);
}

/**
 * Объединение CSS классов
 */
export function combineClasses(...classes: (string | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Преобразование объекта стилей в CSS строку
 */
export function stylesToString(styles: Record<string, string | number>): string {
  return Object.entries(styles)
    .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
    .join('; ');
}