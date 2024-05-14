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
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await fetch(`${API_ENDPOINT}/tasks`);
      const tasksFromServer = await response.json();
      setTasks(tasksFromServer);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const handleTaskCreation = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_ENDPOINT}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskFormData),
      });
      const newTask = await response.json();
      setTasks(currentTasks => [...currentTasks, newTask]);
      closeAndClearModal();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const closeAndClearModal = () => {
    setTaskModalOpen(false);
    setTaskFormData({ title: '', description: '' });
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      await fetch(`${API_ENDPOINT}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setTasks(currentTasks =>
        currentTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ));
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleTaskFormDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTaskFormData(prevFormData => ({ ...prevFormData, [name]: value }));
  };

  const taskForm = () => (
    <div>
      <form onSubmit={handleTaskCreation}>
        <label>
          Title:
          <input name="title" type="text" value={taskFormData.title} onChange={handleTaskFormDataChange} required />
        </label>
        <label>
          Description:
          <textarea name="description" value={taskFormData.description} onChange={handleTaskFormDataChange} required />
        </label>
        <button type="submit">Create Task</button>
        <button type="button" onClick={() => setTaskModalOpen(false)}>Cancel</button>
      </form>
    </div>
  );

  const renderTasks = () => tasks.map(task => (
    <div key={task.id}>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <button onClick={() => updateTaskStatus(task.id, 'done')}>Mark as Done</button>
    </div>
  ));

  return (
    <div>
      <button onClick={() => setTaskModalOpen(true)}>Add Task</button>
      {isTaskModalOpen && taskForm()}
      <div>{renderTasks()}</div>
    </div>
  );
};

export default TaskStream;