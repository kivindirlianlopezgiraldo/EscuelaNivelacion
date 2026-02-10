// ============================================
// BASE DE DATOS INDEXEDDB - ESCUELA DE NIVELACIÓN
// ============================================

import Dexie, { Table } from 'dexie';
import type {
  User, Student, Teacher, Parent, Course, Enrollment,
  Grade, Attendance, ChatMessage, ChatRoom, GameScore,
  Notification, Announcement, AppSettings
} from '@/types';

class SchoolDatabase extends Dexie {
  users!: Table<User>;
  students!: Table<Student>;
  teachers!: Table<Teacher>;
  parents!: Table<Parent>;
  courses!: Table<Course>;
  enrollments!: Table<Enrollment>;
  grades!: Table<Grade>;
  attendance!: Table<Attendance>;
  chatMessages!: Table<ChatMessage>;
  chatRooms!: Table<ChatRoom>;
  gameScores!: Table<GameScore>;
  notifications!: Table<Notification>;
  announcements!: Table<Announcement>;
  settings!: Table<AppSettings>;

  constructor() {
    super('EscuelaNivelacionDB');
    
    this.version(1).stores({
      users: 'id, email, role, [email+password]',
      students: 'id, userId, studentCode, grade, section, parentId',
      teachers: 'id, userId, teacherCode',
      parents: 'id, userId',
      courses: 'id, teacherId, grade, section, subject, isActive',
      enrollments: 'id, studentId, courseId, [studentId+courseId]',
      grades: 'id, studentId, courseId, type, period, date',
      attendance: 'id, studentId, courseId, date, [courseId+date]',
      chatMessages: 'id, senderId, receiverId, chatRoomId, timestamp',
      chatRooms: 'id, participants, type, courseId',
      gameScores: 'id, studentId, gameType, subject, playedAt',
      notifications: 'id, userId, type, isRead, createdAt',
      announcements: 'id, targetRoles, createdAt',
      settings: 'id'
    });
  }
}

export const db = new SchoolDatabase();

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================

export async function initializeDatabase() {
  // Crear usuario admin por defecto si no existe
  const adminExists = await db.users.where('email').equals('admin@escuela.com').first();
  
  if (!adminExists) {
    await db.users.add({
      id: crypto.randomUUID(),
      email: 'admin@escuela.com',
      password: 'admin123',
      role: 'admin',
      firstName: 'Administrador',
      lastName: 'Sistema',
      phone: '3000000000',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Usuario admin creado: admin@escuela.com / admin123');
  }

  // Crear configuración por defecto
  const settingsExist = await db.settings.toCollection().first();
  
  if (!settingsExist) {
    await db.settings.add({
      id: 'default',
      schoolName: 'Escuela de Nivelación',
      address: 'Dirección de la escuela',
      phone: '3000000000',
      email: 'info@escuela.com',
      academicYear: '2024-2025',
      gradingScale: [
        { min: 90, max: 100, label: 'Excelente' },
        { min: 80, max: 89, label: 'Sobresaliente' },
        { min: 70, max: 79, label: 'Aceptable' },
        { min: 60, max: 69, label: 'Suficiente' },
        { min: 0, max: 59, label: 'Insuficiente' }
      ]
    });
  }
}

// ============================================
// FUNCIONES CRUD GENÉRICAS
// ============================================

export async function create<T extends { id: string }>(
  table: Table<T>,
  data: Omit<T, 'id'>
): Promise<T> {
  const item = { ...data, id: crypto.randomUUID() } as T;
  await table.add(item);
  return item;
}

export async function update<T extends { id: string }>(
  table: Table<T>,
  id: string,
  data: Partial<T>
): Promise<void> {
  await table.update(id, data);
}

export async function remove<T extends { id: string }>(
  table: Table<T>,
  id: string
): Promise<void> {
  await table.delete(id);
}

export async function getById<T extends { id: string }>(
  table: Table<T>,
  id: string
): Promise<T | undefined> {
  return await table.get(id);
}

export async function getAll<T extends { id: string }>(
  table: Table<T>
): Promise<T[]> {
  return await table.toArray();
}

// ============================================
// FUNCIONES ESPECÍFICAS
// ============================================

// Estudiantes
export async function getStudentsByParent(parentId: string): Promise<Student[]> {
  return await db.students.where('parentId').equals(parentId).toArray();
}

export async function getStudentsByCourse(courseId: string): Promise<Student[]> {
  const enrollments = await db.enrollments.where('courseId').equals(courseId).toArray();
  const studentIds = enrollments.map(e => e.studentId);
  return await db.students.where('id').anyOf(studentIds).toArray();
}

// Cursos
export async function getCoursesByTeacher(teacherId: string): Promise<Course[]> {
  return await db.courses.where('teacherId').equals(teacherId).toArray();
}

export async function getCoursesByStudent(studentId: string): Promise<Course[]> {
  const enrollments = await db.enrollments.where('studentId').equals(studentId).toArray();
  const courseIds = enrollments.map(e => e.courseId);
  return await db.courses.where('id').anyOf(courseIds).toArray();
}

// Calificaciones
export async function getGradesByStudent(studentId: string): Promise<Grade[]> {
  return await db.grades.where('studentId').equals(studentId).toArray();
}

export async function getGradesByCourse(courseId: string): Promise<Grade[]> {
  return await db.grades.where('courseId').equals(courseId).toArray();
}

export async function getStudentAverage(studentId: string, courseId?: string): Promise<number> {
  let query = db.grades.where('studentId').equals(studentId);
  if (courseId) {
    query = query.and(g => g.courseId === courseId);
  }
  const grades = await query.toArray();
  if (grades.length === 0) return 0;
  const total = grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0);
  return Math.round(total / grades.length);
}

// Asistencia
export async function getAttendanceByStudent(studentId: string): Promise<Attendance[]> {
  return await db.attendance.where('studentId').equals(studentId).toArray();
}

export async function getAttendanceByCourse(courseId: string, date?: Date): Promise<Attendance[]> {
  let query = db.attendance.where('courseId').equals(courseId);
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query = query.and(a => a.date >= startOfDay && a.date <= endOfDay);
  }
  return await query.toArray();
}

// Chat
export async function getChatRoomsByUser(userId: string): Promise<ChatRoom[]> {
  return await db.chatRooms.where('participants').equals(userId).toArray();
}

export async function getMessagesByChatRoom(chatRoomId: string): Promise<ChatMessage[]> {
  return await db.chatMessages
    .where('chatRoomId')
    .equals(chatRoomId)
    .sortBy('timestamp');
}

// Notificaciones
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  return await db.notifications
    .where({ userId, isRead: false })
    .toArray();
}

// Juegos
export async function getGameScoresByStudent(studentId: string): Promise<GameScore[]> {
  return await db.gameScores
    .where('studentId')
    .equals(studentId)
    .reverse()
    .sortBy('playedAt');
}

export async function getTopScores(gameType: string, limit: number = 10): Promise<GameScore[]> {
  return await db.gameScores
    .where('gameType')
    .equals(gameType)
    .reverse()
    .sortBy('score')
    .then(scores => scores.slice(0, limit));
}

// ============================================
// RESPALDO Y RESTAURACIÓN
// ============================================

export async function exportDatabase(): Promise<string> {
  const data = {
    users: await db.users.toArray(),
    students: await db.students.toArray(),
    teachers: await db.teachers.toArray(),
    parents: await db.parents.toArray(),
    courses: await db.courses.toArray(),
    enrollments: await db.enrollments.toArray(),
    grades: await db.grades.toArray(),
    attendance: await db.attendance.toArray(),
    chatMessages: await db.chatMessages.toArray(),
    chatRooms: await db.chatRooms.toArray(),
    gameScores: await db.gameScores.toArray(),
    notifications: await db.notifications.toArray(),
    announcements: await db.announcements.toArray(),
    settings: await db.settings.toArray()
  };
  return JSON.stringify(data, null, 2);
}

export async function importDatabase(jsonData: string): Promise<void> {
  const data = JSON.parse(jsonData);
  
  await db.transaction('rw', 
    [db.users, db.students, db.teachers, db.parents, db.courses, 
     db.enrollments, db.grades, db.attendance, db.chatMessages, 
     db.chatRooms, db.gameScores, db.notifications, db.announcements, db.settings],
    async () => {
      await db.users.clear();
      await db.students.clear();
      await db.teachers.clear();
      await db.parents.clear();
      await db.courses.clear();
      await db.enrollments.clear();
      await db.grades.clear();
      await db.attendance.clear();
      await db.chatMessages.clear();
      await db.chatRooms.clear();
      await db.gameScores.clear();
      await db.notifications.clear();
      await db.announcements.clear();
      await db.settings.clear();

      if (data.users) await db.users.bulkAdd(data.users);
      if (data.students) await db.students.bulkAdd(data.students);
      if (data.teachers) await db.teachers.bulkAdd(data.teachers);
      if (data.parents) await db.parents.bulkAdd(data.parents);
      if (data.courses) await db.courses.bulkAdd(data.courses);
      if (data.enrollments) await db.enrollments.bulkAdd(data.enrollments);
      if (data.grades) await db.grades.bulkAdd(data.grades);
      if (data.attendance) await db.attendance.bulkAdd(data.attendance);
      if (data.chatMessages) await db.chatMessages.bulkAdd(data.chatMessages);
      if (data.chatRooms) await db.chatRooms.bulkAdd(data.chatRooms);
      if (data.gameScores) await db.gameScores.bulkAdd(data.gameScores);
      if (data.notifications) await db.notifications.bulkAdd(data.notifications);
      if (data.announcements) await db.announcements.bulkAdd(data.announcements);
      if (data.settings) await db.settings.bulkAdd(data.settings);
    }
  );
}
