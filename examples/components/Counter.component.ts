import { Component } from '../../src/core/types';

/**
 * Компонент счетчика с кнопками увеличения и уменьшения
 */
export const CounterComponent: Component = {
  name: 'Counter',
  
  props: {
    initialValue: { 
      type: 'number', 
      default: 0 
    },
    step: { 
      type: 'number', 
      default: 1 
    },
    min: {
      type: 'number',
      required: false
    },
    max: {
      type: 'number', 
      required: false
    },
    disabled: {
      type: 'boolean',
      default: false
    }
  },
  
  state: () => ({
    count: 0,
    history: []
  }),
  
  render(props, state) {
    const canDecrement = !props.disabled && 
      (props.min === undefined || state.count > props.min);
    const canIncrement = !props.disabled && 
      (props.max === undefined || state.count < props.max);

    return {
      tag: 'div',
      props: {
        class: 'counter-component',
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          backgroundColor: '#f9fafb'
        }
      },
      children: [
        // Кнопка уменьшения
        {
          component: 'Button',
          props: {
            text: '-',
            variant: 'secondary',
            size: 'small',
            disabled: !canDecrement,
            onClick: () => this.decrement(props, state)
          }
        },
        
        // Отображение значения
        {
          tag: 'span',
          props: {
            class: 'counter-value',
            style: {
              minWidth: '3rem',
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#374151'
            }
          },
          children: [String(state.count)]
        },
        
        // Кнопка увеличения
        {
          component: 'Button',
          props: {
            text: '+',
            variant: 'primary',
            size: 'small',
            disabled: !canIncrement,
            onClick: () => this.increment(props, state)
          }
        },
        
        // Кнопка сброса (если значение не равно начальному)
        {
          if: 'count !== initialValue',
          component: 'Button',
          props: {
            text: 'Сброс',
            variant: 'warning',
            size: 'small',
            onClick: () => this.reset(props, state)
          }
        }
      ]
    };
  },
  
  onCreate() {
    console.log('Компонент Counter создан');
  },
  
  onMount() {
    // Инициализируем состояние значением из props
    this.state.count = this.props.initialValue;
    this.state.history = [this.props.initialValue];
    console.log('Компонент Counter смонтирован');
  },
  
  onUpdate(changedProps, changedState) {
    console.log('Counter обновлен:', { changedProps, changedState });
  },
  
  onDestroy() {
    console.log('Компонент Counter уничтожен');
  },

  // Методы компонента
  increment(props: any, state: any) {
    if (props.max === undefined || state.count < props.max) {
      state.count += props.step;
      state.history.push(state.count);
      console.log(`Счетчик увеличен до ${state.count}`);
    }
  },

  decrement(props: any, state: any) {
    if (props.min === undefined || state.count > props.min) {
      state.count -= props.step;
      state.history.push(state.count);
      console.log(`Счетчик уменьшен до ${state.count}`);
    }
  },

  reset(props: any, state: any) {
    state.count = props.initialValue;
    state.history.push(state.count);
    console.log(`Счетчик сброшен до ${state.count}`);
  }
};