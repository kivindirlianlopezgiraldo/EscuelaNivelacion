// ============================================
// STORE GLOBAL - ZUSTAND
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole, Student, Teacher, Parent, Course, Notification } from '@/types';

// ============================================
// STORE DE AUTENTICACIÓN
// ============================================

interface AuthState {
  user: User | null;
  student: Student | null;
  teacher: Teacher | null;
  parent: Parent | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, details?: Student | Teacher | Parent) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      student: null,
      teacher: null,
      parent: null,
      isAuthenticated: false,
      isLoading: true,
      login: (user, details) => set({
        user,
        student: user.role === 'student' ? (details as Student) : null,
        teacher: user.role === 'teacher' ? (details as Teacher) : null,
        parent: user.role === 'parent' ? (details as Parent) : null,
        isAuthenticated: true,
        isLoading: false
      }),
      logout: () => set({
        user: null,
        student: null,
        teacher: null,
        parent: null,
        isAuthenticated: false,
        isLoading: false
      }),
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      }))
    }),
    {
      name: 'auth-storage'
    }
  )
);

// ============================================
// STORE DE UI
// ============================================

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  currentPage: string;
  notifications: Notification[];
  unreadCount: number;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setCurrentPage: (page: string) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      currentPage: 'dashboard',
      notifications: [],
      unreadCount: 0,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      setCurrentPage: (page) => set({ currentPage: page }),
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      })),
      markNotificationAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      })),
      clearNotifications: () => set({ notifications: [], unreadCount: 0 })
    }),
    {
      name: 'ui-storage'
    }
  )
);

// ============================================
// STORE DE DATOS
// ============================================

interface DataState {
  users: User[];
  students: Student[];
  teachers: Teacher[];
  parents: Parent[];
  courses: Course[];
  selectedCourse: Course | null;
  selectedStudent: Student | null;
  isLoading: boolean;
  setUsers: (users: User[]) => void;
  setStudents: (students: Student[]) => void;
  setTeachers: (teachers: Teacher[]) => void;
  setParents: (parents: Parent[]) => void;
  setCourses: (courses: Course[]) => void;
  setSelectedCourse: (course: Course | null) => void;
  setSelectedStudent: (student: Student | null) => void;
  addUser: (user: User) => void;
  addStudent: (student: Student) => void;
  addTeacher: (teacher: Teacher) => void;
  addParent: (parent: Parent) => void;
  addCourse: (course: Course) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  updateCourse: (id: string, data: Partial<Course>) => void;
  deleteUser: (id: string) => void;
  deleteStudent: (id: string) => void;
  deleteCourse: (id: string) => void;
}

export const useDataStore = create<DataState>((set) => ({
  users: [],
  students: [],
  teachers: [],
  parents: [],
  courses: [],
  selectedCourse: null,
  selectedStudent: null,
  isLoading: false,
  setUsers: (users) => set({ users }),
  setStudents: (students) => set({ students }),
  setTeachers: (teachers) => set({ teachers }),
  setParents: (parents) => set({ parents }),
  setCourses: (courses) => set({ courses }),
  setSelectedCourse: (course) => set({ selectedCourse: course }),
  setSelectedStudent: (student) => set({ selectedStudent: student }),
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  addStudent: (student) => set((state) => ({ students: [...state.students, student] })),
  addTeacher: (teacher) => set((state) => ({ teachers: [...state.teachers, teacher] })),
  addParent: (parent) => set((state) => ({ parents: [...state.parents, parent] })),
  addCourse: (course) => set((state) => ({ courses: [...state.courses, course] })),
  updateUser: (id, data) => set((state) => ({
    users: state.users.map(u => u.id === id ? { ...u, ...data } : u)
  })),
  updateStudent: (id, data) => set((state) => ({
    students: state.students.map(s => s.id === id ? { ...s, ...data } : s)
  })),
  updateCourse: (id, data) => set((state) => ({
    courses: state.courses.map(c => c.id === id ? { ...c, ...data } : c)
  })),
  deleteUser: (id) => set((state) => ({
    users: state.users.filter(u => u.id !== id)
  })),
  deleteStudent: (id) => set((state) => ({
    students: state.students.filter(s => s.id !== id)
  })),
  deleteCourse: (id) => set((state) => ({
    courses: state.courses.filter(c => c.id !== id)
  }))
}));

// ============================================
// STORE DE CHAT
// ============================================

interface ChatState {
  activeChat: string | null;
  messages: Record<string, any[]>;
  onlineUsers: string[];
  typingUsers: string[];
  setActiveChat: (chatId: string | null) => void;
  addMessage: (chatId: string, message: any) => void;
  setMessages: (chatId: string, messages: any[]) => void;
  setOnlineUsers: (users: string[]) => void;
  setTypingUsers: (users: string[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeChat: null,
  messages: {},
  onlineUsers: [],
  typingUsers: [],
  setActiveChat: (chatId) => set({ activeChat: chatId }),
  addMessage: (chatId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), message]
    }
  })),
  setMessages: (chatId, messages) => set((state) => ({
    messages: { ...state.messages, [chatId]: messages }
  })),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  setTypingUsers: (users) => set({ typingUsers: users })
}));

// ============================================
// STORE DE JUEGOS
// ============================================

interface GameState {
  currentGame: string | null;
  currentSubject: string | null;
  score: number;
  level: number;
  timeRemaining: number;
  isPlaying: boolean;
  highScores: Record<string, number>;
  setCurrentGame: (game: string | null) => void;
  setCurrentSubject: (subject: string | null) => void;
  startGame: () => void;
  endGame: () => void;
  addScore: (points: number) => void;
  setLevel: (level: number) => void;
  setTimeRemaining: (time: number) => void;
  setHighScore: (game: string, score: number) => void;
  resetScore: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentGame: null,
  currentSubject: null,
  score: 0,
  level: 1,
  timeRemaining: 60,
  isPlaying: false,
  highScores: {},
  setCurrentGame: (game) => set({ currentGame: game }),
  setCurrentSubject: (subject) => set({ currentSubject: subject }),
  startGame: () => set({ isPlaying: true, score: 0, timeRemaining: 60 }),
  endGame: () => set({ isPlaying: false }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  setLevel: (level) => set({ level }),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setHighScore: (game, score) => set((state) => ({
    highScores: { ...state.highScores, [game]: Math.max(score, state.highScores[game] || 0) }
  })),
  resetScore: () => set({ score: 0, level: 1 })
}));
