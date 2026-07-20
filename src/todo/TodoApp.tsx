import { useState, useEffect, useCallback, useRef } from 'react';
import './Todo.css';

type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
};

type Filter = 'all' | 'active';

const STORAGE_KEY = 'todo-app-todos';

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Todo[];
  } catch {
    return [];
  }
}

function saveTodos(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

let idCounter = Date.now();
function uid(): string {
  return (++idCounter).toString(36);
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const addTodo = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      { id: uid(), text: trimmed, done: false, createdAt: Date.now() },
      ...prev,
    ]);
    setText('');
    inputRef.current?.focus();
  }, [text]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') addTodo();
    },
    [addTodo],
  );

  const filtered =
    filter === 'all' ? todos : todos.filter(t => !t.done);

  const activeCount = todos.filter(t => !t.done).length;

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'active', label: '进行中' },
  ];

  return (
    <div className="todo-app">
      <header className="todo-header">
        <h1>待办清单</h1>
        <p className="todo-sub">
          {todos.length === 0
            ? '开始添加你的第一个任务'
            : `共 ${todos.length} 项，${activeCount} 项未完成`}
        </p>
      </header>

      <div className="todo-input-row">
        <input
          ref={inputRef}
          className="todo-input"
          type="text"
          placeholder="输入新任务，按 Enter 添加..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button className="todo-add-btn" onClick={addTodo} disabled={!text.trim()}>
          +
        </button>
      </div>

      <div className="todo-filters">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`todo-filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key === 'all' && <span className="filter-count">{todos.length}</span>}
            {f.key === 'active' && <span className="filter-count">{activeCount}</span>}
          </button>
        ))}
      </div>

      <div className="todo-list-wrap">
        {filtered.length === 0 ? (
          <div className="todo-empty">
            {filter === 'all' && '暂无任务，添加一个吧'}
            {filter === 'active' && '没有进行中的任务'}
          </div>
        ) : (
          <ul className="todo-list">
            {filtered.map((todo) => (
              <li
                key={todo.id}
                className={`todo-item ${todo.done ? 'done' : ''}`}
              >
                <button
                  className="todo-check"
                  onClick={() => toggleTodo(todo.id)}
                  aria-label={todo.done ? '标记未完成' : '标记完成'}
                >
                  {todo.done ? '✓' : ''}
                </button>
                <span className="todo-text">{todo.text}</span>
                <button
                  className="todo-delete"
                  onClick={() => deleteTodo(todo.id)}
                  aria-label="删除任务"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>


    </div>
  );
}
