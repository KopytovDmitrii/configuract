import { Component } from '../../src/core/types';

/**
 * Компонент списка задач с возможностью добавления, удаления и отметки выполнения
 */
export const TodoListComponent: Component = {
  name: 'TodoList',
  
  props: {
    title: {
      type: 'string',
      default: 'Список задач'
    }
  },
  
  state: () => ({
    todos: [],
    newTodoText: '',
    filter: 'all' // 'all', 'active', 'completed'
  }),
  
  render(props, state) {
    const filteredTodos = this.getFilteredTodos(state);
    
    return {
      tag: 'div',
      props: {
        class: 'todo-list-component',
        style: {
          maxWidth: '600px',
          margin: '0 auto',
          padding: '2rem',
          backgroundColor: '#ffffff',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }
      },
      children: [
        // Заголовок
        {
          tag: 'h2',
          props: {
            style: {
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#374151'
            }
          },
          children: [props.title]
        },
        
        // Форма добавления новой задачи
        {
          tag: 'div',
          props: {
            class: 'add-todo-form',
            style: {
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1rem'
            }
          },
          children: [
            {
              tag: 'input',
              props: {
                type: 'text',
                placeholder: 'Введите новую задачу...',
                value: state.newTodoText,
                style: {
                  flex: '1',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }
              },
              model: 'newTodoText',
              events: {
                keypress: (e: KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    this.addTodo(state);
                  }
                }
              }
            },
            {
              component: 'Button',
              props: {
                text: 'Добавить',
                variant: 'primary',
                disabled: !state.newTodoText.trim(),
                onClick: () => this.addTodo(state)
              }
            }
          ]
        },
        
        // Фильтры
        {
          tag: 'div',
          props: {
            class: 'filters',
            style: {
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1rem'
            }
          },
          children: [
            {
              component: 'Button',
              props: {
                text: 'Все',
                variant: state.filter === 'all' ? 'primary' : 'secondary',
                size: 'small',
                onClick: () => { state.filter = 'all'; }
              }
            },
            {
              component: 'Button',
              props: {
                text: 'Активные',
                variant: state.filter === 'active' ? 'primary' : 'secondary',
                size: 'small',
                onClick: () => { state.filter = 'active'; }
              }
            },
            {
              component: 'Button',
              props: {
                text: 'Выполненные',
                variant: state.filter === 'completed' ? 'primary' : 'secondary',
                size: 'small',
                onClick: () => { state.filter = 'completed'; }
              }
            }
          ]
        },
        
        // Список задач
        {
          tag: 'ul',
          props: {
            class: 'todo-list',
            style: {
              listStyle: 'none',
              padding: '0',
              margin: '0'
            }
          },
          children: filteredTodos.length > 0 ? [
            {
              for: 'todo in filteredTodos',
              key: 'todo.id',
              template: {
                tag: 'li',
                props: {
                  class: 'todo-item',
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: '{{todo.completed ? "#f0f9f0" : "transparent"}}'
                  }
                },
                children: [
                  {
                    tag: 'input',
                    props: {
                      type: 'checkbox',
                      checked: '{{todo.completed}}',
                      style: {
                        width: '1.25rem',
                        height: '1.25rem'
                      }
                    },
                    events: {
                      change: (e: Event) => {
                        const target = e.target as HTMLInputElement;
                        this.toggleTodo('{{todo.id}}', target.checked, state);
                      }
                    }
                  },
                  {
                    tag: 'span',
                    props: {
                      style: {
                        flex: '1',
                        textDecoration: '{{todo.completed ? "line-through" : "none"}}',
                        color: '{{todo.completed ? "#6b7280" : "#374151"}}'
                      }
                    },
                    children: ['{{todo.text}}']
                  },
                  {
                    component: 'Button',
                    props: {
                      text: 'Удалить',
                      variant: 'danger',
                      size: 'small',
                      onClick: () => this.removeTodo('{{todo.id}}', state)
                    }
                  }
                ]
              }
            }
          ] : [
            {
              tag: 'li',
              props: {
                style: {
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#6b7280',
                  fontStyle: 'italic'
                }
              },
              children: ['Задач нет']
            }
          ]
        },
        
        // Статистика
        {
          if: 'todos.length > 0',
          tag: 'div',
          props: {
            class: 'stats',
            style: {
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              color: '#6b7280'
            }
          },
          children: [
            `Всего: {{todos.length}}, Выполнено: {{todos.filter(t => t.completed).length}}, Осталось: {{todos.filter(t => !t.completed).length}}`
          ]
        }
      ]
    };
  },
  
  onCreate() {
    console.log('Компонент TodoList создан');
  },
  
  onMount() {
    console.log('Компонент TodoList смонтирован');
  },
  
  onUpdate(changedProps, changedState) {
    console.log('TodoList обновлен:', { changedProps, changedState });
  },
  
  onDestroy() {
    console.log('Компонент TodoList уничтожен');
  },

  // Методы компонента
  addTodo(state: any) {
    const text = state.newTodoText.trim();
    if (text) {
      const newTodo = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date()
      };
      
      state.todos.push(newTodo);
      state.newTodoText = '';
      console.log('Добавлена новая задача:', newTodo);
    }
  },

  removeTodo(id: number, state: any) {
    const index = state.todos.findIndex((todo: any) => todo.id === id);
    if (index !== -1) {
      const removedTodo = state.todos.splice(index, 1)[0];
      console.log('Удалена задача:', removedTodo);
    }
  },

  toggleTodo(id: number, completed: boolean, state: any) {
    const todo = state.todos.find((todo: any) => todo.id === id);
    if (todo) {
      todo.completed = completed;
      console.log(`Задача ${completed ? 'выполнена' : 'не выполнена'}:`, todo);
    }
  },

  getFilteredTodos(state: any) {
    switch (state.filter) {
      case 'active':
        return state.todos.filter((todo: any) => !todo.completed);
      case 'completed':
        return state.todos.filter((todo: any) => todo.completed);
      default:
        return state.todos;
    }
  }
};