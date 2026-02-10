// ============================================
// HOOK DE ESTUDIANTES
// ============================================

import { useState, useCallback } from 'react';
import { db } from '@/db/database';
import type { Student, User, Grade, Attendance, Course } from '@/types';

interface StudentWithUser extends Student {
  user?: User;
  averageGrade?: number;
  attendanceRate?: number;
}

export function useStudents() {
  const [students, setStudents] = useState<StudentWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async (filters?: { grade?: string; section?: string }) => {
    setLoading(true);
    try {
      let query = db.students.toCollection();
      
      if (filters?.grade) {
        query = query.filter((s: Student) => s.grade === filters.grade);
      }
      if (filters?.section) {
        query = query.filter((s: Student) => s.section === filters.section);
      }

      const studentList = await query.toArray();
      
      // Enriquecer con datos de usuario
      const enrichedStudents = await Promise.all(
        studentList.map(async (student: Student) => {
          const user = await db.users.get(student.userId);
          const grades = await db.grades.where('studentId').equals(student.id).toArray();
          const attendance = await db.attendance.where('studentId').equals(student.id).toArray();
          
          const averageGrade = grades.length > 0
            ? grades.reduce((sum: number, g: Grade) => sum + (g.score / g.maxScore) * 100, 0) / grades.length
            : 0;
          
          const attendanceRate = attendance.length > 0
            ? (attendance.filter((a: Attendance) => a.status === 'present').length / attendance.length) * 100
            : 0;

          return {
            ...student,
            user,
            averageGrade: Math.round(averageGrade),
            attendanceRate: Math.round(attendanceRate)
          };
        })
      );

      setStudents(enrichedStudents);
    } catch (err) {
      setError('Error al cargar estudiantes');
    } finally {
      setLoading(false);
    }
  }, []);

  const getStudentById = useCallback(async (id: string): Promise<StudentWithUser | null> => {
    try {
      const student = await db.students.get(id);
      if (!student) return null;

      const user = await db.users.get(student.userId);
      const grades = await db.grades.where('studentId').equals(student.id).toArray();
      const attendance = await db.attendance.where('studentId').equals(student.id).toArray();

      const averageGrade = grades.length > 0
        ? grades.reduce((sum: number, g: Grade) => sum + (g.score / g.maxScore) * 100, 0) / grades.length
        : 0;

      const attendanceRate = attendance.length > 0
        ? (attendance.filter((a: Attendance) => a.status === 'present').length / attendance.length) * 100
        : 0;

      return {
        ...student,
        user,
        averageGrade: Math.round(averageGrade),
        attendanceRate: Math.round(attendanceRate)
      };
    } catch (err) {
      return null;
    }
  }, []);

  const createStudent = useCallback(async (
    studentData: Omit<Student, 'id'>,
    userData: Omit<User, 'id' | 'role' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    setLoading(true);
    try {
      // Crear usuario primero
      const newUser: User = {
        ...userData,
        id: crypto.randomUUID(),
        role: 'student',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.users.add(newUser);

      // Crear estudiante
      await db.students.add({
        ...studentData,
        id: crypto.randomUUID(),
        userId: newUser.id
      });

      await fetchStudents();
      return true;
    } catch (err) {
      setError('Error al crear estudiante');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchStudents]);

  const updateStudent = useCallback(async (
    id: string,
    data: Partial<Student>,
    userData?: Partial<User>
  ): Promise<boolean> => {
    setLoading(true);
    try {
      await db.students.update(id, data);
      
      if (userData) {
        const student = await db.students.get(id);
        if (student) {
          await db.users.update(student.userId, { ...userData, updatedAt: new Date() });
        }
      }

      await fetchStudents();
      return true;
    } catch (err) {
      setError('Error al actualizar estudiante');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchStudents]);

  const deleteStudent = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const student = await db.students.get(id);
      if (student) {
        await db.users.delete(student.userId);
        await db.students.delete(id);
        // Eliminar registros relacionados
        await db.grades.where('studentId').equals(id).delete();
        await db.attendance.where('studentId').equals(id).delete();
        await db.enrollments.where('studentId').equals(id).delete();
      }
      await fetchStudents();
      return true;
    } catch (err) {
      setError('Error al eliminar estudiante');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchStudents]);

  const getStudentCourses = useCallback(async (studentId: string): Promise<Course[]> => {
    const enrollments = await db.enrollments.where('studentId').equals(studentId).toArray();
    const courseIds = enrollments.map((e: any) => e.courseId);
    return await db.courses.where('id').anyOf(courseIds).toArray();
  }, []);

  const getStudentGrades = useCallback(async (studentId: string): Promise<Grade[]> => {
    return await db.grades.where('studentId').equals(studentId).toArray();
  }, []);

  const getStudentAttendance = useCallback(async (studentId: string): Promise<Attendance[]> => {
    return await db.attendance.where('studentId').equals(studentId).toArray();
  }, []);

  return {
    students,
    loading,
    error,
    fetchStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentCourses,
    getStudentGrades,
    getStudentAttendance
  };
}
