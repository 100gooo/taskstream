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
  const [isTaskModalOpen, setTaskModalOpen] = useState<boolean>(false);
  const [taskFormData, setTaskFormData] = useState<{ title: string; description: string }>({ title: '', description: '' });

  useEffect(() => {
    fetch(`${API_ENDPOINT}/tasks`)
      .then(response => response.json())
      .then(tasksFromServer => setTasks(tasksFromServer))
      .catch(error => console.error('Failed to load tasks:', error));
  }, []);

  const handleTaskCreation = (event: React.FormEvent) => {
    event.preventDefault();
    fetch(`${API_ENDPOINT}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskFormData),
    })
    .then(response => response.json())
    .then(newTask => {
      setTasks(currentTasks => [...currentTasks, newTask]);
      setTaskModalOpen(false);
      setTaskFormData({ title: '', description: '' });
    })
    .catch(error => console.error('Failed to create task:', error));
  };

  const updateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    fetch(`${API_ENDPOINT}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    .then(() => {
      setTasks(currentTasks =>
        currentTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ));
    })
    .catch(error => console.error('Failed to update task status:', error));
  };

  return (
    <div>
      <button onClick={() => setTaskModalOpen(true)}>Add Task</button>
      {isTaskModalOpen && (
        <div>
          <form onSubmit={handleTaskCreation}>
            <label>
              Title:
              <input type="text" value={taskFormData.title} onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })} required />
            </label>
            <label>
              Description:
              <textarea value={taskFormData.description} onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })} required />
            </label>
            <button type="submit">Create Task</button>
            <button onClick={() => setTaskModalOpen(false)}>Cancel</button>
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