import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

const TASK_API_URL = "http://localhost:5000/tasks";

const mapStatusToFilter = (status) => {
  if (status === "To Do") return "not-started";
  if (status === "In Progress") return "in-progress";
  if (status === "Completed") return "completed";
  return "";
};

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [editTaskId, setEditTaskId] = useState(null);
  const [editText, setEditText] = useState("");

  const [filter, setFilter] = useState("all");
  const [theme, setTheme] = useState("dark"); 

  const dragItem = useRef(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(TASK_API_URL);
      setTasks(res.data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    try {
      const res = await axios.post(TASK_API_URL, { text: newTask });
      setTasks([...tasks, res.data]);
      setNewTask("");
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${TASK_API_URL}/${id}`);
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus =
      currentStatus === "To Do"
        ? "In Progress"
        : currentStatus === "In Progress"
        ? "Completed"
        : "To Do";
    try {
      const res = await axios.put(`${TASK_API_URL}/toggle/${id}`, { status: newStatus });
      setTasks(tasks.map((task) => (task.id === id ? res.data : task)));
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  const enableEditMode = (task) => {
    setEditTaskId(task.id);
    setEditText(task.text);
  };

  const saveEditedTask = async (id) => {
    if (!editText.trim()) return;
    try {
      const res = await axios.put(`${TASK_API_URL}/edit/${id}`, { text: editText });
      setTasks(tasks.map((task) => (task.id === id ? res.data : task)));
      setEditTaskId(null);
      setEditText("");
    } catch (error) {
      console.error("Failed to edit task:", error);
    }
  };

  const handleDragStart = (e, index) => {
    dragItem.current = index;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = dragItem.current;
    if (dragIndex === null || dragIndex === dropIndex) return;
    const updatedTasks = [...tasks];
    const [removed] = updatedTasks.splice(dragIndex, 1);
    updatedTasks.splice(dropIndex, 0, removed);
    dragItem.current = null;
    setTasks(updatedTasks);
    axios.put(`${TASK_API_URL}/reorder`, { tasks: updatedTasks })
      .catch((error) => console.error("Failed to reorder tasks:", error));
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return mapStatusToFilter(task.status) === filter;
  });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleFilterClick = (newFilter) => {
    setFilter(newFilter);
  };

  return (
    <div className={`app ${theme === "light" ? "light-theme" : ""}`}>
      <div className="task-manager">
        <aside className="sidebar">
          <h2>Task Manager</h2>
          <nav>
            <ul>
              <li>
                <a
                  href="#"
                  className={filter === "all" ? "active" : ""}
                  onClick={(e) => { e.preventDefault(); handleFilterClick("all"); }}
                >
                  All Tasks
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={filter === "not-started" ? "active" : ""}
                  onClick={(e) => { e.preventDefault(); handleFilterClick("not-started"); }}
                >
                  To-Do
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={filter === "in-progress" ? "active" : ""}
                  onClick={(e) => { e.preventDefault(); handleFilterClick("in-progress"); }}
                >
                  In Progress
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={filter === "completed" ? "active" : ""}
                  onClick={(e) => { e.preventDefault(); handleFilterClick("completed"); }}
                >
                  Completed
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="task-board ">
          <header>
            <h1>Task Board</h1>
            <i className="fas fa-adjust theme-toggle" onClick={toggleTheme}></i>
          </header>

          <div className="add-task-bar">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
            />
            <button onClick={addTask}>Add Task</button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, index) => (
                <tr
                  key={task.id}
                  data-status={mapStatusToFilter(task.status)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <td>
                    {editTaskId === task.id ? (
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      <span>{task.text}</span>
                    )}
                  </td>
                  <td>{task.completedAt ? new Date(task.completedAt).toLocaleDateString() : "Not Set"}</td>
                  <td>
                    <span className={`status ${mapStatusToFilter(task.status)}`}>
                      {mapStatusToFilter(task.status).replace("-", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="action-buttons">
                    {editTaskId === task.id ? (
                      <>
                        <button onClick={() => saveEditedTask(task.id)}>Save</button>
                        <button onClick={() => setEditTaskId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => toggleStatus(task.id, task.status)}>Toggle Status</button>
                        <button onClick={() => enableEditMode(task)}>Edit</button>
                        <button onClick={() => deleteTask(task.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      </div>
    </div>
  );
};

export default App;
