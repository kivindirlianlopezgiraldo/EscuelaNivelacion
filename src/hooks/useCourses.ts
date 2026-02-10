// ============================================
// HOOK DE CURSOS
// ============================================

import { useState, useCallback } from 'react';
import { db } from '@/db/database';
import type { Course, User, Student } from '@/types';

interface CourseWithTeacher extends Course {
  teacher?: User;
  studentCount?: number;
}

export function useCourses() {
  const [courses, setCourses] = useState<CourseWithTeacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async (filters?: { teacherId?: string; grade?: string }) => {
    setLoading(true);
    try {
      let query = db.courses.toCollection();
      
      if (filters?.teacherId) {
        query = query.filter((c: Course) => c.teacherId === filters.teacherId);
      }
      if (filters?.grade) {
        query = query.filter((c: Course) => c.grade === filters.grade);
      }

      const courseList = await query.toArray();
      
      const enrichedCourses = await Promise.all(
        courseList.map(async (course: Course) => {
          const teacher = await db.users.get(course.teacherId);
          const enrollments = await db.enrollments.where('courseId').equals(course.id).count();
          
          return {
            ...course,
            teacher,
            studentCount: enrollments
          };
        })
      );

      setCourses(enrichedCourses);
    } catch (err) {
      setError('Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCourse = useCallback(async (
    courseData: Omit<Course, 'id'>
  ): Promise<boolean> => {
    setLoading(true);
    try {
      await db.courses.add({
        ...courseData,
        id: crypto.randomUUID()
      });
      await fetchCourses();
      return true;
    } catch (err) {
      setError('Error al crear curso');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCourses]);

  const updateCourse = useCallback(async (
    id: string,
    data: Partial<Course>
  ): Promise<boolean> => {
    setLoading(true);
    try {
      await db.courses.update(id, data);
      await fetchCourses();
      return true;
    } catch (err) {
      setError('Error al actualizar curso');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCourses]);

  const deleteCourse = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      await db.courses.delete(id);
      // Eliminar inscripciones relacionadas
      await db.enrollments.where('courseId').equals(id).delete();
      await fetchCourses();
      return true;
    } catch (err) {
      setError('Error al eliminar curso');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCourses]);

  const enrollStudent = useCallback(async (
    courseId: string,
    studentId: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      // Verificar si ya está inscrito
      const existing = await db.enrollments
        .where({ courseId, studentId })
        .first();
      
      if (existing) {
        setError('El estudiante ya está inscrito en este curso');
        return false;
      }

      await db.enrollments.add({
        id: crypto.randomUUID(),
        courseId,
        studentId,
        enrollmentDate: new Date(),
        status: 'active'
      });

      await fetchCourses();
      return true;
    } catch (err) {
      setError('Error al inscribir estudiante');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCourses]);

  const unenrollStudent = useCallback(async (
    courseId: string,
    studentId: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const enrollment = await db.enrollments
        .where({ courseId, studentId })
        .first();
      
      if (enrollment) {
        await db.enrollments.delete(enrollment.id);
      }

      await fetchCourses();
      return true;
    } catch (err) {
      setError('Error al desinscribir estudiante');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCourses]);

  const getCourseStudents = useCallback(async (courseId: string): Promise<Student[]> => {
    const enrollments = await db.enrollments.where('courseId').equals(courseId).toArray();
    const studentIds = enrollments.map((e: any) => e.studentId);
    return await db.students.where('id').anyOf(studentIds).toArray();
  }, []);

  return {
    courses,
    loading,
    error,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollStudent,
    unenrollStudent,
    getCourseStudents
  };
}
