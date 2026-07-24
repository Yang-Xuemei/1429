import "./index.css";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "todo-app-tasks";
const FILTER_KEY = "todo-app-filter";

const state: {
  todos: Todo[];
  filter: Filter;
} = {
  todos: loadTodos(),
  filter: loadFilter(),
};

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Todo =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.text === "string" &&
        typeof item.completed === "boolean"
    );
  } catch {
    return [];
  }
}

function saveTodos(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function loadFilter(): Filter {
  const raw = localStorage.getItem(FILTER_KEY);
  if (raw === "all" || raw === "active" || raw === "completed") return raw;
  return "all";
}

function saveFilter(): void {
  localStorage.setItem(FILTER_KEY, state.filter);
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}

const taskInput = requireElement<HTMLInputElement>("#task-input");
const addButton = requireElement<HTMLButtonElement>("#add-button");
const taskList = requireElement<HTMLUListElement>("#task-list");
const emptyState = requireElement<HTMLDivElement>("#empty-state");
const taskContainer = requireElement<HTMLDivElement>("#task-container");
const filterButtons = document.querySelectorAll<HTMLButtonElement>(".filter-btn");
const countAll = requireElement<HTMLStrongElement>("#count-all");
const countActive = requireElement<HTMLStrongElement>("#count-active");
const countCompleted = requireElement<HTMLStrongElement>("#count-completed");

addButton.addEventListener("click", handleAdd);
taskInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleAdd();
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter as Filter | undefined;
    if (filter && filter !== state.filter) {
      state.filter = filter;
      saveFilter();
      render();
    }
  });
});

function handleAdd(): void {
  const text = taskInput.value.trim();
  if (!text) return;

  state.todos.push({
    id: generateId(),
    text,
    completed: false,
  });

  saveTodos();
  taskInput.value = "";
  taskInput.focus();
  render();
}

function toggleTodo(id: string): void {
  const todo = state.todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveTodos();
    render();
  }
}

function deleteTodo(id: string): void {
  state.todos = state.todos.filter((t) => t.id !== id);
  saveTodos();
  render();
}

function getFilteredTodos(): Todo[] {
  switch (state.filter) {
    case "active":
      return state.todos.filter((t) => !t.completed);
    case "completed":
      return state.todos.filter((t) => t.completed);
    default:
      return state.todos;
  }
}

function renderTaskItem(todo: Todo): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "task-item group flex items-center gap-4 rounded-md bg-surface-alt/50 px-5 py-4 border-2 border-line/50 hover:border-primary/50 hover:shadow-lg transition-all";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.className = "anime-checkbox flex-shrink-0";
  checkbox.setAttribute("aria-label", `标记"${todo.text}"为${todo.completed ? "未完成" : "已完成"}`);
  checkbox.addEventListener("change", () => toggleTodo(todo.id));

  const span = document.createElement("span");
  span.textContent = todo.text;
  span.className = `flex-1 min-w-0 break-words text-lg font-medium ${
    todo.completed ? "line-through text-muted/60" : "text-ink"
  } transition-colors`;

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "✕";
  deleteButton.className =
    "flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full text-muted hover:text-danger hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 transition-all opacity-60 group-hover:opacity-100 font-bold text-lg";
  deleteButton.setAttribute("aria-label", `删除任务"${todo.text}"`);
  deleteButton.addEventListener("click", () => deleteTodo(todo.id));

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(deleteButton);

  return li;
}

function render(): void {
  const filtered = getFilteredTodos();
  const hasAnyTodos = state.todos.length > 0;

  taskList.innerHTML = "";
  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    const emptyText = emptyState.querySelector("p");
    if (emptyText) {
      if (hasAnyTodos) {
        emptyText.textContent =
          state.filter === "active" ? "没有进行中的任务 (◕‿◕)" : "没有已完成的任务 (´・ω・`)";
      } else {
        emptyText.textContent = "暂无任务 (´・ω・`)";
      }
    }
  } else {
    emptyState.classList.add("hidden");
    const fragment = document.createDocumentFragment();
    for (const todo of filtered) {
      fragment.appendChild(renderTaskItem(todo));
    }
    taskList.appendChild(fragment);
  }

  taskContainer.classList.toggle("hidden", !hasAnyTodos);

  const activeCount = state.todos.filter((t) => !t.completed).length;
  const completedCount = state.todos.filter((t) => t.completed).length;
  countAll.textContent = String(state.todos.length);
  countActive.textContent = String(activeCount);
  countCompleted.textContent = String(completedCount);

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === state.filter;
    button.classList.toggle("bg-primary", isActive);
    button.classList.toggle("text-primary-fg", isActive);
    button.classList.toggle("border-primary", isActive);
    button.classList.toggle("shadow-lg", isActive);
    button.classList.toggle("shadow-primary/30", isActive);
  });
}

render();
