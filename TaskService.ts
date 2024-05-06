import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

type Task = {
  id: string;
  description: string;
  completed: boolean;
}

type State = {
  tasks: Task[];
}

type Action =
  | { type: 'SET_TASKS', tasks: Task[] }
  | { type: 'ADD_TASK', task: Task }
  | { type: 'UPDATE_TASK', task: Task }
  | { type: 'DELETE_TASK', taskId: string }

const initialState: State = {
  tasks: [],
};

const TaskContext = createContext<{ state: State; dispatch: React.Dispatch<Action> }>({ state: initialState, dispatch: () => null });

const taskReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.tasks };
    case 'ADD_TASK':
      return { ...state, tasks: state.tasks.concat(action.task) };
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map(task => task.id === action.task.id ? action.task : task) };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(task => task.id !== action.taskId) };
    default:
      return state;
  }
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/tasks`);
      dispatch({ type: 'SET_TASKS', tasks: response.data });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <TaskContext.Provider value={{ state, dispatch }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);

export const updateTask = async (task: Task) => {
  try {
    const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/tasks/${task.id}`, task);
    return response.data;
  } catch (error) {
    console.error('Failed to update task:', error);
  }
};

export const addTask = async (task: Task) => {
  try {
    const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/tasks`, task);
    return response.data;
  } catch (error) {
    console.error('Failed to add task:', error);
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/tasks/${taskId}`);
  } catch (error) {
    console.error('Failed to delete task:', error);
  }
};