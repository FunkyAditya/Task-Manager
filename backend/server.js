const express = require("express");
const fs = require("fs").promises;
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const FILE_PATH = "tasks.txt";
let tasks = [];


const loadTasks = async () => {
  try {
    const data = await fs.readFile(FILE_PATH, "utf-8");
    tasks = JSON.parse(data);
  } catch (error) {
    tasks = []; 
  }
};


const saveTasks = async () => {
  await fs.writeFile(FILE_PATH, JSON.stringify(tasks, null, 2));
};

loadTasks();

app.post("/tasks", async (req, res) => {
  const { text } = req.body;
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();
  const newTask = { id, text, status: "To Do", createdAt, completedAt: null };

  tasks.push(newTask);
  await saveTasks();
  res.json(newTask);
});

app.get("/tasks", (req, res) => {
  res.json(tasks);
});

app.put("/tasks/toggle/:id", async (req, res) => {
  const { status } = req.body;
  const task = tasks.find((t) => t.id === req.params.id);

  if (!task) return res.status(404).json({ error: "Task not found" });

  task.status = status;
  task.completedAt = status === "Completed" ? new Date() : null;

  await saveTasks();
  res.json(task);
});

app.put("/tasks/edit/:id", async (req, res) => {
  const { text } = req.body;
  const task = tasks.find((t) => t.id === req.params.id);

  if (!task) return res.status(404).json({ error: "Task not found" });

  task.text = text;
  await saveTasks();
  res.json(task);
});

app.delete("/tasks/:id", async (req, res) => {
  tasks = tasks.filter((t) => t.id !== req.params.id);
  await saveTasks();
  res.json({ message: "Task deleted" });
});

app.put("/tasks/reorder", async (req, res) => {
    try {
      const { tasks: reorderedTasks } = req.body;
      if (!Array.isArray(reorderedTasks)) {
        return res.status(400).json({ error: "Invalid tasks array" });
      }
      tasks = reorderedTasks;
      await saveTasks();
      res.json({ message: "Tasks reordered successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

app.listen(5000, () => console.log("Server running on port 5000"));
