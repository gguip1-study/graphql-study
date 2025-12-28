let stateTodos = [];

const statusEl = document.getElementById("status");
const listEl = document.getElementById("list");
const formEl = document.getElementById("create-form");
const titleEl = document.getElementById("title");

function humanizeGraphQLError(e) {
  const type = e.extensions?.classification || e.extensions?.errorType || "ERROR";
  const msg = e.message || "";

  // 1) 타입 기반 기본 문구
  if (type === "BAD_REQUEST") {
    // 세부 메시지 패턴별 매핑
    if (msg.includes("Todo not found")) return "이미 삭제됐거나 존재하지 않는 항목이야.";
    if (msg.includes("must not be blank") || msg.includes("blank")) return "제목을 입력해줘.";
    return "요청이 올바르지 않아. 입력값을 확인해줘.";
  }

  if (type === "INTERNAL_ERROR") {
    return "서버에서 오류가 났어. 잠시 후 다시 시도해줘.";
  }

  return "오류가 발생했어. 다시 시도해줘.";
}

async function gql(query, variables = {}) {
  const res = await fetch("/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  // GraphQL은 200이어도 errors가 올 수 있음
  if (json.errors && json.errors.length) {
    // 첫 번째 에러만 사용(학습용). 필요하면 여러 개도 처리 가능.
    const err = json.errors[0];
    const e = new Error(err.message);
    e.extensions = err.extensions || {};
    throw e;
  }

  return json.data;
}

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function renderTodos(todos) {
  listEl.innerHTML = "";
  for (const t of todos) {
    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = t.done;
    checkbox.addEventListener("change", () => toggleDone(t.id, checkbox.checked));

    const title = document.createElement("span");
    title.className = "title" + (t.done ? " done" : "");
    title.textContent = t.title;

    title.addEventListener("dblclick", async () => {
      const next = prompt("새 제목", t.title);
      if (next == null) return;

      const trimmed = next.trim();
      if (!trimmed) {
        setStatus("제목은 비울 수 없음");
        return;
      }

      setStatus("수정 중...");
      try {
        const data = await gql(
          `mutation ($input: UpdateTodoInput!) {
            updateTodo(input: $input) { id title done createdAt }
          }`,
          { input: { id: t.id, title: trimmed } }
        );

        stateTodos = stateTodos.map(x => x.id === t.id ? data.updateTodo : x);
        renderTodos(stateTodos);
        setStatus("");
      } catch (e) {
        setStatus(humanizeGraphQLError(e));
      }
    });

    const meta = document.createElement("span");
    meta.className = "muted";
    meta.textContent = new Date(t.createdAt).toLocaleString();

    const del = document.createElement("button");
    del.textContent = "삭제";
    del.addEventListener("click", () => deleteTodo(t.id));

    li.append(checkbox, title, meta, del);
    listEl.appendChild(li);
  }
}

async function loadTodos() {
  setStatus("로딩 중...");
  try {
    const data = await gql(`
      query {
        todos { id title done createdAt }
      }
    `);
    stateTodos = data.todos;
    renderTodos(stateTodos);
    setStatus("");
  } catch (e) {
    setStatus(humanizeGraphQLError(e));
  }
}

async function createTodo(title) {
  setStatus("추가 중...");
  try {
    const data = await gql(
      `mutation ($input: CreateTodoInput!) {
        createTodo(input: $input) { id title done createdAt }
      }`,
      { input: { title } }
    );
    stateTodos = [data.createTodo, ...stateTodos];
    renderTodos(stateTodos);
    setStatus("");
    titleEl.value = "";
  } catch (e) {
    setStatus(humanizeGraphQLError(e));
  }
}

async function toggleDone(id, done) {
    const prev = stateTodos;

    stateTodos = stateTodos.map(t => t.id === id ? { ...t, done } : t);
    renderTodos(stateTodos);
    setStatus("");

    try {
      const data = await gql(
        `mutation ($input: UpdateTodoInput!) {
          updateTodo(input: $input) { id title done createdAt }
        }`,
        { input: { id, done } }
      );

      stateTodos = stateTodos.map(t => t.id === id ? data.updateTodo : t);
      renderTodos(stateTodos);
    } catch (e) {
      stateTodos = prev;
      renderTodos(stateTodos);
      setStatus(humanizeGraphQLError(e));
    }
}

async function deleteTodo(id) {
  setStatus("삭제 중...");
  try {
    await gql(
      `mutation ($id: ID!) { deleteTodo(id: $id) }`,
      { id }
    );
    stateTodos = stateTodos.filter(t => t.id !== id);
    renderTodos(stateTodos);
    setStatus("");
  } catch (e) {
    setStatus(humanizeGraphQLError(e));
  }
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleEl.value.trim();
  if (!title) {
    setStatus("제목을 입력해줘");
    return;
  }
  createTodo(title);
});

loadTodos();
