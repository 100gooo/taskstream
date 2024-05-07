import React, { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
}

const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:3000';

const TaskStream: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newTask, setNewTask] = useState<{ title: string; description: string }>({ title: '', description: '' });

  useEffect(() => {
    fetch(`${API_ENDPOINT}/tasks`)
      .then(response => response.json())
      .then(data => setTasks(data))
      .catch(error => console.error('Failed to load tasks:', error));
  }, []);

  const handleTaskCreate = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`${API_ENDPOINT}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    })
    .then(response => response.json())
    .then(createdTask => {
      setTasks(currentTasks => [...currentTasks, createdTask]);
      setShowModal(false);
      setNewTask({ title: '', description: '' });
    })
    .catch(error => console.error('Failed to create task:', error));
  };

  const updateTaskStatus = (id: string, status: Task['status']) => {
    fetch(`${API_ENDPOINT}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    .then(() => {
      setTasks(currentTasks =>
        currentTasks.map(task => 
          task.id === id ? { ...task, status } : task
        ));
    })
    .catch(error => console.error('Failed to update task status:', error));
  };

  return (
    <div>
      <button onClick={() => setShowModal(true)}>Add Task</button>
      {showModal && (
        <div>
          <form onSubmit={handleTaskCreate}>
            <label>
              Title:
              <input type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} required />
            </label>
            <label>
              Description:
              <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} required />
            </label>
            <button type="submit">Create Task</button>
            <button onClick={() => setShowModal(false)}>Cancel</button>
          </form>
        </div>
      )}
      <div>
        {tasks.map(task => (
          <div key={task.id}>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <button onClick={() => updateTaskStatus(task.id, 'done')}>Mark as Done</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskStream;