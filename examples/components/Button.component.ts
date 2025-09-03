import { Component } from '../../src/core/types';

/**
 * Компонент кнопки с различными стилями и состояниями
 */
export const ButtonComponent: Component = {
  name: 'Button',
  
  props: {
    text: { 
      type: 'string', 
      default: 'Кнопка',
      required: false
    },
    variant: { 
      type: 'string', 
      default: 'primary',
      validator: (value: string) => ['primary', 'secondary', 'success', 'warning', 'danger'].includes(value)
    },
    size: { 
      type: 'string', 
      default: 'medium',
      validator: (value: string) => ['small', 'medium', 'large'].includes(value)
    },
    disabled: { 
      type: 'boolean', 
      default: false 
    },
    onClick: {
      type: 'function',
      required: false
    }
  },
  
  state: () => ({
    isPressed: false,
    clickCount: 0,
    isHovered: false
  }),
  
  render(props, state) {
    const baseClasses = 'btn';
    const variantClass = `btn-${props.variant}`;
    const sizeClass = `btn-${props.size}`;
    const stateClasses = [
      state.isPressed ? 'pressed' : '',
      state.isHovered ? 'hovered' : '',
      props.disabled ? 'disabled' : ''
    ].filter(Boolean).join(' ');
    
    const allClasses = [baseClasses, variantClass, sizeClass, stateClasses]
      .filter(Boolean)
      .join(' ');

    return {
      tag: 'button',
      props: {
        class: allClasses,
        disabled: props.disabled,
        style: {
          padding: props.size === 'small' ? '0.5rem 1rem' : 
                  props.size === 'large' ? '1rem 2rem' : '0.75rem 1.5rem',
          fontSize: props.size === 'small' ? '0.875rem' :
                   props.size === 'large' ? '1.125rem' : '1rem',
          backgroundColor: this.getBackgroundColor(props.variant, state),
          color: this.getTextColor(props.variant),
          border: 'none',
          borderRadius: '0.375rem',
          cursor: props.disabled ? 'not-allowed' : 'pointer',
          opacity: props.disabled ? '0.6' : '1',
          transition: 'all 0.2s ease-in-out',
          transform: state.isPressed ? 'scale(0.98)' : 'scale(1)'
        }
      },
      events: {
        mousedown: () => { 
          if (!props.disabled) {
            state.isPressed = true; 
          }
        },
        mouseup: () => { 
          state.isPressed = false; 
        },
        mouseleave: () => { 
          state.isPressed = false;
          state.isHovered = false;
        },
        mouseenter: () => {
          if (!props.disabled) {
            state.isHovered = true;
          }
        },
        click: () => { 
          if (!props.disabled) {
            state.clickCount++;
            props.onClick?.(state.clickCount);
          }
        }
      },
      children: [props.text]
    };
  },
  
  // Хуки жизненного цикла
  onCreate() {
    console.log('Компонент Button создан');
  },
  
  onMount() {
    console.log('Компонент Button смонтирован в DOM');
  },
  
  onUpdate(changedProps, changedState) {
    console.log('Button обновлен:', { 
      props: changedProps, 
      state: changedState 
    });
  },
  
  onDestroy() {
    console.log('Компонент Button уничтожен');
  },

  // Вспомогательные методы
  getBackgroundColor(variant: string, state: any): string {
    const colors = {
      primary: state.isHovered ? '#2563eb' : '#3b82f6',
      secondary: state.isHovered ? '#64748b' : '#6b7280', 
      success: state.isHovered ? '#059669' : '#10b981',
      warning: state.isHovered ? '#d97706' : '#f59e0b',
      danger: state.isHovered ? '#dc2626' : '#ef4444'
    };
    return colors[variant as keyof typeof colors] || colors.primary;
  },

  getTextColor(variant: string): string {
    return '#ffffff';
  }
};