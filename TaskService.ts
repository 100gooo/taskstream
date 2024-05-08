import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

type Task = {
  id: string;
  description: string;
  completed: boolean;
}

type State = {
  tasksList: Task[];
}

type Action =
  | { type: 'LOAD_TASKS', tasks: Task[] }
  | { type: 'CREATE_TASK', newTask: Task }
  | { type: 'EDIT_TASK', updatedTask: Task }
  | { type: 'REMOVE_TASK', taskId: string }

const initialState: State = {
  tasksList: [],
};

const TasksContext = createContext<{ state: State; dispatch: React.Dispatch<Action> }>({ state: initialState, dispatch: () => null });

const tasksReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'LOAD_TASKS':
      return { ...state, tasksList: action.tasks };
    case 'CREATE_TASK':
      return { ...state, tasksList: state.tasksList.concat(action.newTask) };
    case 'EDIT_TASK':
      return {
        ...state,
        tasksList: state.tasksList.map(task => task.id === action.updatedTask.id ? action.updatedTask : task),
      };
    case 'REMOVE_TASK':
      return { ...state, tasksList: state.tasksList.filter(task => task.id !== action.taskId) };
    default:
      return state;
  }
};

export const TasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tasksReducer, initialState);

  const retrieveTasks = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/tasks`);
      dispatch({ type: 'LOAD_TASKS', tasks: response.data });
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  useEffect(() => {
    retrieveTasks();
  }, []);

  return (
    <TasksContext.Provider value={{ state, dispatch }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasksState = () => useContext(TasksContext);

export const modifyTask = async (task: Task) => {
  try {
    const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/tasks/${task.id}`, task);
    return response.data;
  } catch (error) {
    console.error('Failed to modify task:', error);
  }
};

export const createNewTask = async (task: Task) => {
  try {
    const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/tasks`, task);
    return response.data;
  } catch (error) {
    console.error('Failed to create task:', error);
  }
};

export const eraseTask = async (taskId: string) => {
  try {
    await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/tasks/${taskId}`);
  } catch (error) {
    console.error('Failed to erase task:', error);
  }
};