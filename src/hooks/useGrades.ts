// ============================================
// HOOK DE CALIFICACIONES
// ============================================

import { useState, useCallback } from 'react';
import { db } from '@/db/database';
import type { Grade, Course, Student } from '@/types';

interface GradeWithDetails extends Grade {
  student?: Student;
  course?: Course;
}

interface GradeStats {
  average: number;
  highest: number;
  lowest: number;
  total: number;
  byType: Record<string, { average: number; count: number }>;
}

export function useGrades() {
  const [grades, setGrades] = useState<GradeWithDetails[]>([]);
  const [stats, setStats] = useState<GradeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGrades = useCallback(async (filters?: {
    studentId?: string;
    courseId?: string;
    period?: string;
    type?: string;
  }) => {
    setLoading(true);
    try {
      let query = db.grades.toCollection();
      
      if (filters?.studentId) {
        query = query.filter((g: Grade) => g.studentId === filters.studentId);
      }
      if (filters?.courseId) {
        query = query.filter((g: Grade) => g.courseId === filters.courseId);
      }
      if (filters?.period) {
        query = query.filter((g: Grade) => g.period === filters.period);
      }
      if (filters?.type) {
        query = query.filter((g: Grade) => g.type === filters.type);
      }

      const gradeList = await query.toArray();
      
      const enrichedGrades = await Promise.all(
        gradeList.map(async (grade: Grade) => {
          const student = await db.students.get(grade.studentId);
          const course = await db.courses.get(grade.courseId);
          
          return {
            ...grade,
            student,
            course
          };
        })
      );

      setGrades(enrichedGrades);

      // Calcular estadísticas
      if (gradeList.length > 0) {
        const scores = gradeList.map((g: Grade) => (g.score / g.maxScore) * 100);
        const byType: Record<string, { scores: number[]; count: number }> = {};
        
        gradeList.forEach((g: Grade) => {
          if (!byType[g.type]) {
            byType[g.type] = { scores: [], count: 0 };
          }
          byType[g.type].scores.push((g.score / g.maxScore) * 100);
          byType[g.type].count++;
        });

        const byTypeStats: Record<string, { average: number; count: number }> = {};
        Object.entries(byType).forEach(([type, data]) => {
          byTypeStats[type] = {
            average: Math.round(data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length),
            count: data.count
          };
        });

        setStats({
          average: Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length),
          highest: Math.round(Math.max(...scores)),
          lowest: Math.round(Math.min(...scores)),
          total: gradeList.length,
          byType: byTypeStats
        });
      }
    } catch (err) {
      setError('Error al cargar calificaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  const createGrade = useCallback(async (
    gradeData: Omit<Grade, 'id'>
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const newGradeId = crypto.randomUUID();
      
      await db.grades.add({
        ...gradeData,
        id: newGradeId
      });

      // Crear notificación para el estudiante
      const student = await db.students.get(gradeData.studentId);
      if (student) {
        await db.notifications.add({
          id: crypto.randomUUID(),
          userId: student.userId,
          title: 'Nueva calificación',
          message: `Se ha registrado una nueva calificación: ${gradeData.name}`,
          type: 'grade',
          isRead: false,
          createdAt: new Date(),
          data: { gradeId: newGradeId }
        });
      }

      await fetchGrades();
      return true;
    } catch (err) {
      setError('Error al crear calificación');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchGrades]);

  const updateGrade = useCallback(async (
    id: string,
    data: Partial<Grade>
  ): Promise<boolean> => {
    setLoading(true);
    try {
      await db.grades.update(id, data);
      await fetchGrades();
      return true;
    } catch (err) {
      setError('Error al actualizar calificación');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchGrades]);

  const deleteGrade = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      await db.grades.delete(id);
      await fetchGrades();
      return true;
    } catch (err) {
      setError('Error al eliminar calificación');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchGrades]);

  const getStudentReport = useCallback(async (studentId: string) => {
    const grades = await db.grades.where('studentId').equals(studentId).toArray();
    const student = await db.students.get(studentId);
    const user = student ? await db.users.get(student.userId) : null;

    const byCourse: Record<string, { grades: Grade[]; average: number }> = {};
    
    for (const grade of grades) {
      const course = await db.courses.get(grade.courseId);
      if (course) {
        if (!byCourse[course.name]) {
          byCourse[course.name] = { grades: [], average: 0 };
        }
        byCourse[course.name].grades.push(grade);
      }
    }

    // Calcular promedios por curso
    Object.entries(byCourse).forEach(([courseName, data]) => {
      const scores = data.grades.map((g: Grade) => (g.score / g.maxScore) * 100);
      byCourse[courseName].average = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
    });

    return {
      student: { ...student, user },
      byCourse,
      overallAverage: grades.length > 0
        ? Math.round(grades.reduce((sum: number, g: Grade) => sum + (g.score / g.maxScore) * 100, 0) / grades.length)
        : 0
    };
  }, []);

  return {
    grades,
    stats,
    loading,
    error,
    fetchGrades,
    createGrade,
    updateGrade,
    deleteGrade,
    getStudentReport
  };
}
