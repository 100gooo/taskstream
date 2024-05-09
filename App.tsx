import React, { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
}

const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:3000';

const TaskStream: React.FC = () => {
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [isAddTaskModalVisible, setAddTaskModalVisibility] = useState<boolean>(false);
  const [newTaskDetails, setNewTaskDetails] = useState<{ title: string; description: string }>({ title: '', description: '' });

  useEffect(() => {
    fetch(`${API_ENDPOINT}/tasks`)
      .then(response => response.json())
      .then(data => setTaskList(data))
      .catch(error => console.error('Failed to load tasks:', error));
  }, []);

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`${API_ENDPOINT}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTaskDetails),
    })
    .then(response => response.json())
    .then(addedTask => {
      setTaskList(currentTasks => [...currentTasks, addedTask]);
      setAddTaskModalVisibility(false);
      setNewTaskDetails({ title: '', description: '' });
    })
    .catch(error => console.error('Failed to create task:', error));
  };

  const changeTaskStatus = (taskId: string, newStatus: Task['status']) => {
    fetch(`${API_ENDPOINT}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    .then(() => {
      setTaskList(currentTasks =>
        currentTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ));
    })
    .catch(error => console.error('Failed to update task status:', error));
  };

  return (
    <div>
      <button onClick={() => setAddTaskModalVisibility(true)}>Add Task</button>
      {isAddTaskModalVisible && (
        <div>
          <form onSubmit={handleAddTaskSubmit}>
            <label>
              Title:
              <input type="text" value={newTaskDetails.title} onChange={(e) => setNewTaskDetails({ ...newTaskDetails, title: e.target.value })} required />
            </label>
            <label>
              Description:
              <textarea value={newTaskDetails.description} onChange={(e) => setNewTaskDetails({ ...newTaskDetails, description: e.target.value })} required />
            </label>
            <button type="submit">Create Task</button>
            <button onClick={() => setAddTaskModalVisibility(false)}>Cancel</button>
          </form>
        </div>
      )}
      <div>
        {taskList.map(task => (
          <div key={task.id}>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <button onClick={() => changeTaskStatus(task.id, 'done')}>Mark as Done</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskStream;