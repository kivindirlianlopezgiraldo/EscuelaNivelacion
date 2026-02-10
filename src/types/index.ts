// ============================================
// TIPOS DEL SISTEMA - ESCUELA DE NIVELACIÓN
// ============================================

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string;
  userId: string;
  studentCode: string;
  grade: string;
  section: string;
  birthDate: Date;
  address: string;
  parentId: string;
  enrollmentDate: Date;
}

export interface Teacher {
  id: string;
  userId: string;
  teacherCode: string;
  specialization: string;
  subjects: string[];
}

export interface Parent {
  id: string;
  userId: string;
  childrenIds: string[];
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  subject: string;
  teacherId: string;
  grade: string;
  section: string;
  schedule: Schedule[];
  color: string;
  isActive: boolean;
}

export interface Schedule {
  day: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  startTime: string;
  endTime: string;
  room: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrollmentDate: Date;
  status: 'active' | 'inactive' | 'completed';
}

export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  teacherId: string;
  type: 'exam' | 'quiz' | 'homework' | 'project' | 'participation' | 'final';
  name: string;
  score: number;
  maxScore: number;
  period: string;
  date: Date;
  comments?: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  chatRoomId: string;
}

export interface ChatRoom {
  id: string;
  name?: string;
  participants: string[];
  type: 'private' | 'group';
  courseId?: string;
  lastMessage?: ChatMessage;
  createdAt: Date;
}

export interface GameScore {
  id: string;
  studentId: string;
  gameType: string;
  subject: string;
  score: number;
  maxScore: number;
  timeSpent: number;
  playedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'grade' | 'attendance' | 'message' | 'announcement' | 'game';
  isRead: boolean;
  createdAt: Date;
  data?: any;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  targetRoles: UserRole[];
  targetCourses?: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface AppSettings {
  id: string;
  schoolName: string;
  schoolLogo?: string;
  address: string;
  phone: string;
  email: string;
  academicYear: string;
  gradingScale: {
    min: number;
    max: number;
    label: string;
  }[];
}

// Tipos para los juegos
export interface GameQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface MathProblem {
  id: string;
  type: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'fraction';
  problem: string;
  answer: number;
  difficulty: 'easy' | 'medium' | 'hard';
}
