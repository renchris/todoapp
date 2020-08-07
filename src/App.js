import React, { useState, useEffect } from "react";
import "./App.css";
import { API, Auth } from "aws-amplify";
import { withAuthenticator, AmplifySignOut } from "@aws-amplify/ui-react";

import { listTodos } from "./graphql/queries";
import {
  createTodo as createTodoMutation,
  deleteTodo as deleteTodoMutation,
} from "./graphql/mutations";

const initialFormState = {
  name: "",
  description: "",
  category: "Home",
  owner: "",
};

function App() {
  const [todos, setTodos] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [sortIndex, setSortIndex] = useState(null);

  useEffect(() => {
    fetchTodos();
    setFormData({ ...formData, owner: Auth.user.username });
  }, []);

  async function fetchTodos() {
    const apiData = await API.graphql({ query: listTodos });
    setTodos(apiData.data.listTodos.items);
  }

  async function createTodo() {
    if (!formData.name || !formData.description) return;

    await API.graphql({
      query: createTodoMutation,
      variables: { input: formData },
    });

    setTodos([...todos, formData]);
    setFormData({ ...initialFormState, owner: Auth.user.username });
    fetchTodos();

    const feedbackElement = document.getElementById("feedback");
    feedbackElement.textContent = 'Added "' + formData.name + '"';
  }

  function compareBySelectedField() {
    switch (sortIndex) {
      case 1: //Name
        return (a, b) => (a.name > b.name) - (a.name < b.name);
      case 2: //Category
        return (a, b) => (a.category > b.category) - (a.category < b.category);
      case 3: //Owner
        return (a, b) => (a.owner > b.owner) - (a.owner < b.owner);
      default:
        //case 0: Date Added
        return (a, b) =>
          (a.createdAt > b.createdAt) - (a.createdAt < b.createdAt);
    }
  }

  async function deleteTodo({ id }) {
    const itemToDelete = todos.find((item) => item.id === id);

    const sameOwner = itemToDelete.owner === Auth.user.username;

    const feedbackElement = document.getElementById("feedback");

    if (!sameOwner) {
      const feedbackElement = document.getElementById("feedback");
      feedbackElement.textContent = "Can't delete someone else's item";
      return;
    }

    feedbackElement.textContent = 'Deleted "' + itemToDelete.name + '"';

    const newTodosArray = todos.filter((todo) => todo.id !== id);
    setTodos(newTodosArray);
    await API.graphql({
      query: deleteTodoMutation,
      variables: { input: { id } },
    });
  }

  return (
    <div className="App">
      <h1>My Todo App: {Auth.user.username}</h1>
      <input
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Todo name"
        value={formData.name}
      />
      <input
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        placeholder="Todo description"
        value={formData.description}
      />
      <select
        id="categoryDropdown"
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        value={formData.category}
      >
        <option>Home</option>
        <option>Work</option>
        <option>Study</option>
        <option>Leisure</option>
      </select>

      <button onClick={createTodo}>Create Todo</button>

      <div>
        <select
          id="sortDropdown"
          onChange={() =>
            setSortIndex(document.getElementById("sortDropdown").selectedIndex)
          }
        >
          <option>Date Added</option>
          <option>Name</option>
          <option>Category</option>
          <option>Owner</option>
        </select>
      </div>

      <small id="feedback">View all items, add and delete your own items</small>

      <div className="list" style={{ marginBottom: 30 }}>
        {todos.sort(compareBySelectedField()).map((todo) => (
          <div key={todo.id || todo.name}>
            <h2>{todo.name}</h2>
            <p>
              {todo.description}
              <br></br> {todo.category} - {todo.owner}
            </p>

            <button onClick={() => deleteTodo(todo)}>Delete Todo</button>
          </div>
        ))}
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);
