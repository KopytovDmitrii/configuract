import { ElementConfig, ElementChild, DOMPatch, DiffResult, PatchType } from './types';

/**
 * Алгоритм сравнения конфигураций и создания патчей для DOM
 */
export class DOMDiffer {
  /**
   * Сравнение двух конфигураций элементов
   */
  diff(oldConfig: ElementConfig, newConfig: ElementConfig): DiffResult {
    const patches: DOMPatch[] = [];
    
    // Если типы элементов разные - полная замена
    if (this.isDifferentType(oldConfig, newConfig)) {
      patches.push({
        type: 'REPLACE',
        oldConfig,
        newConfig
      });
      return { patches };
    }
    
    // Сравнение свойств
    const propPatches = this.diffProps(oldConfig.props, newConfig.props);
    if (propPatches.length > 0) {
      patches.push({
        type: 'PROPS',
        props: this.mergeProps(propPatches)
      });
    }
    
    // Сравнение дочерних элементов
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
  private isDifferentType(oldConfig: ElementConfig, newConfig: ElementConfig): boolean {
    // Сравниваем теги
    if (oldConfig.tag !== newConfig.tag) {
      return true;
    }
    
    // Сравниваем компоненты
    if (oldConfig.component !== newConfig.component) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Сравнение свойств элементов
   */
  private diffProps(oldProps: any = {}, newProps: any = {}): Array<{key: string, type: 'add' | 'update' | 'remove', value?: any}> {
    const patches: Array<{key: string, type: 'add' | 'update' | 'remove', value?: any}> = [];
    const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);
    
    for (const key of allKeys) {
      const oldValue = oldProps[key];
      const newValue = newProps[key];
      
      if (!(key in oldProps)) {
        // Новое свойство
        patches.push({ key, type: 'add', value: newValue });
      } else if (!(key in newProps)) {
        // Удаленное свойство
        patches.push({ key, type: 'remove' });
      } else if (!this.isEqual(oldValue, newValue)) {
        // Измененное свойство
        patches.push({ key, type: 'update', value: newValue });
      }
    }
    
    return patches;
  }
  
  /**
   * Сравнение дочерних элементов с поддержкой ключей
   */
  private diffChildren(oldChildren: ElementChild[], newChildren: ElementChild[]): DOMPatch[] {
    const patches: DOMPatch[] = [];
    
    // Если есть ключи, используем оптимизированный алгоритм
    if (this.hasKeys(oldChildren) || this.hasKeys(newChildren)) {
      return this.diffChildrenWithKeys(oldChildren, newChildren);
    }
    
    // Простое сравнение по позициям
    const maxLength = Math.max(oldChildren.length, newChildren.length);
    
    for (let i = 0; i < maxLength; i++) {
      const oldChild = oldChildren[i];
      const newChild = newChildren[i];
      
      if (!oldChild && newChild) {
        // Добавление нового элемента
        patches.push({
          type: 'ADD',
          index: i,
          newConfig: typeof newChild === 'string' ? undefined : newChild,
          text: typeof newChild === 'string' ? newChild : undefined
        });
      } else if (oldChild && !newChild) {
        // Удаление элемента
        patches.push({
          type: 'REMOVE',
          index: i
        });
      } else if (oldChild && newChild) {
        // Сравнение существующих элементов
        if (typeof oldChild === 'string' && typeof newChild === 'string') {
          if (oldChild !== newChild) {
            patches.push({
              type: 'TEXT_UPDATE',
              index: i,
              text: newChild
            });
          }
        } else if (typeof oldChild === 'object' && typeof newChild === 'object') {
          const childDiff = this.diff(oldChild, newChild);
          if (childDiff.patches.length > 0) {
            patches.push({
              type: 'UPDATE',
              index: i,
              patches: childDiff.patches
            });
          }
        } else {
          // Разные типы - замена
          patches.push({
            type: 'REPLACE',
            index: i,
            oldConfig: typeof oldChild === 'object' ? oldChild : undefined,
            newConfig: typeof newChild === 'object' ? newChild : undefined,
            text: typeof newChild === 'string' ? newChild : undefined
          });
        }
      }
    }
    
    return patches;
  }
  
  /**
   * Оптимизированное сравнение дочерних элементов с ключами
   */
  private diffChildrenWithKeys(oldChildren: ElementChild[], newChildren: ElementChild[]): DOMPatch[] {
    const patches: DOMPatch[] = [];
    
    // Создаем карты ключей для быстрого поиска
    const oldKeyMap = this.createKeyMap(oldChildren);
    const newKeyMap = this.createKeyMap(newChildren);
    
    // Отслеживаем обработанные элементы
    const processedOldIndices = new Set<number>();
    const processedNewIndices = new Set<number>();
    
    // Проходим по новым элементам
    newChildren.forEach((newChild, newIndex) => {
      const newKey = this.getKey(newChild, newIndex);
      const oldIndex = oldKeyMap.get(newKey);
      
      if (oldIndex !== undefined) {
        // Элемент существовал
        const oldChild = oldChildren[oldIndex];
        processedOldIndices.add(oldIndex);
        processedNewIndices.add(newIndex);
        
        // Проверяем, нужно ли переместить
        if (oldIndex !== newIndex) {
          patches.push({
            type: 'MOVE',
            index: oldIndex,
            newIndex: newIndex
          });
        }
        
        // Сравниваем содержимое
        if (typeof oldChild === 'object' && typeof newChild === 'object') {
          const childDiff = this.diff(oldChild, newChild);
          if (childDiff.patches.length > 0) {
            patches.push({
              type: 'UPDATE',
              index: newIndex,
              patches: childDiff.patches
            });
          }
        }
      } else {
        // Новый элемент
        patches.push({
          type: 'ADD',
          index: newIndex,
          newConfig: typeof newChild === 'object' ? newChild : undefined,
          text: typeof newChild === 'string' ? newChild : undefined
        });
      }
    });
    
    // Удаляем элементы, которых нет в новом списке
    oldChildren.forEach((oldChild, oldIndex) => {
      if (!processedOldIndices.has(oldIndex)) {
        patches.push({
          type: 'REMOVE',
          index: oldIndex
        });
      }
    });
    
    return patches;
  }
  
  /**
   * Создание карты ключей для быстрого поиска
   */
  private createKeyMap(children: ElementChild[]): Map<string | number, number> {
    const keyMap = new Map<string | number, number>();
    
    children.forEach((child, index) => {
      const key = this.getKey(child, index);
      keyMap.set(key, index);
    });
    
    return keyMap;
  }
  
  /**
   * Получение ключа элемента
   */
  private getKey(child: ElementChild, fallbackIndex: number): string | number {
    if (typeof child === 'object' && child.key !== undefined) {
      return child.key;
    }
    return fallbackIndex;
  }
  
  /**
   * Проверка наличия ключей в списке дочерних элементов
   */
  private hasKeys(children: ElementChild[]): boolean {
    return children.some(child => 
      typeof child === 'object' && child.key !== undefined
    );
  }
  
  /**
   * Объединение патчей для свойств
   */
  private mergeProps(propPatches: Array<{key: string, type: 'add' | 'update' | 'remove', value?: any}>): Record<string, any> {
    const result: Record<string, any> = {};
    
    propPatches.forEach(patch => {
      if (patch.type === 'remove') {
        result[patch.key] = null; // Помечаем для удаления
      } else {
        result[patch.key] = patch.value;
      }
    });
    
    return result;
  }
  
  /**
   * Глубокое сравнение значений
   */
  private isEqual(value1: any, value2: any): boolean {
    if (value1 === value2) {
      return true;
    }
    
    if (value1 == null || value2 == null) {
      return value1 === value2;
    }
    
    if (typeof value1 !== typeof value2) {
      return false;
    }
    
    if (typeof value1 === 'object') {
      // Простое сравнение объектов (можно улучшить)
      return JSON.stringify(value1) === JSON.stringify(value2);
    }
    
    return false;
  }
}

/**
 * Применение патчей к DOM элементу
 */
export class DOMPatcher {
  /**
   * Применение списка патчей к DOM элементу
   */
  patch(element: HTMLElement, patches: DOMPatch[]): HTMLElement {
    let currentElement = element;
    
    patches.forEach(patch => {
      currentElement = this.applyPatch(currentElement, patch);
    });
    
    return currentElement;
  }
  
  /**
   * Применение одного патча
   */
  private applyPatch(element: HTMLElement, patch: DOMPatch): HTMLElement {
    switch (patch.type) {
      case 'REPLACE':
        return this.replacePatch(element, patch);
      case 'PROPS':
        this.propsPatch(element, patch);
        break;
      case 'ADD':
        this.addPatch(element, patch);
        break;
      case 'REMOVE':
        this.removePatch(element, patch);
        break;
      case 'UPDATE':
        this.updatePatch(element, patch);
        break;
      case 'TEXT_UPDATE':
        this.textUpdatePatch(element, patch);
        break;
      case 'MOVE':
        this.movePatch(element, patch);
        break;
    }
    
    return element;
  }
  
  /**
   * Полная замена элемента
   */
  private replacePatch(element: HTMLElement, patch: DOMPatch): HTMLElement {
    if (!patch.newConfig) {
      throw new Error('Новая конфигурация требуется для замены');
    }
    
    // Здесь нужно создать новый элемент из конфигурации
    // Это требует доступа к renderer'у
    // Пока оставляем заглушку
    console.warn('Замена элемента еще не реализована');
    return element;
  }
  
  /**
   * Обновление свойств элемента
   */
  private propsPatch(element: HTMLElement, patch: DOMPatch): void {
    if (!patch.props) return;
    
    Object.entries(patch.props).forEach(([key, value]) => {
      if (value === null) {
        // Удаление свойства
        element.removeAttribute(key);
      } else {
        // Установка/обновление свойства
        if (key === 'style' && typeof value === 'object') {
          this.updateStyles(element, value);
        } else if (key === 'class') {
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
  private addPatch(element: HTMLElement, patch: DOMPatch): void {
    const index = patch.index || element.children.length;
    
    if (patch.text !== undefined) {
      // Текстовый узел
      const textNode = document.createTextNode(patch.text);
      if (index >= element.children.length) {
        element.appendChild(textNode);
      } else {
        element.insertBefore(textNode, element.children[index]);
      }
    } else if (patch.newConfig) {
      // Новый элемент из конфигурации
      // Требует доступа к renderer'у
      console.warn('Добавление элемента из конфигурации еще не реализовано');
    }
  }
  
  /**
   * Удаление дочернего элемента
   */
  private removePatch(element: HTMLElement, patch: DOMPatch): void {
    const index = patch.index;
    if (index !== undefined && index < element.children.length) {
      const child = element.children[index];
      element.removeChild(child);
    }
  }
  
  /**
   * Обновление дочернего элемента
   */
  private updatePatch(element: HTMLElement, patch: DOMPatch): void {
    const index = patch.index;
    if (index !== undefined && index < element.children.length && patch.patches) {
      const child = element.children[index] as HTMLElement;
      this.patch(child, patch.patches);
    }
  }
  
  /**
   * Обновление текста
   */
  private textUpdatePatch(element: HTMLElement, patch: DOMPatch): void {
    const index = patch.index;
    if (index !== undefined && patch.text !== undefined) {
      const child = element.childNodes[index];
      if (child && child.nodeType === Node.TEXT_NODE) {
        child.textContent = patch.text;
      }
    }
  }
  
  /**
   * Перемещение элемента
   */
  private movePatch(element: HTMLElement, patch: DOMPatch): void {
    const oldIndex = patch.index;
    const newIndex = patch.newIndex;
    
    if (oldIndex !== undefined && newIndex !== undefined) {
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
  private updateStyles(element: HTMLElement, styles: Record<string, any>): void {
    Object.entries(styles).forEach(([property, value]) => {
      if (value === null || value === undefined) {
        element.style.removeProperty(property);
      } else {
        element.style.setProperty(property, String(value));
      }
    });
  }
}

/**
 * Глобальные экземпляры для удобства
 */
export const domDiffer = new DOMDiffer();
export const domPatcher = new DOMPatcher();