// ============================================
// HOOK DE ASISTENCIA
// ============================================

import { useState, useCallback } from 'react';
import { db } from '@/db/database';
import type { Attendance, Student, Course } from '@/types';

interface AttendanceWithDetails extends Attendance {
  student?: Student;
  course?: Course;
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  rate: number;
}

export function useAttendance() {
  const [attendance, setAttendance] = useState<AttendanceWithDetails[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async (filters: {
    courseId?: string;
    studentId?: string;
    date: Date;
  }) => {
    setLoading(true);
    try {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      let query = db.attendance
        .where('date')
        .between(startOfDay, endOfDay);

      if (filters.courseId) {
        query = query.and((a: Attendance) => a.courseId === filters.courseId);
      }
      if (filters.studentId) {
        query = query.and((a: Attendance) => a.studentId === filters.studentId);
      }

      const attendanceList = await query.toArray();
      
      const enrichedAttendance = await Promise.all(
        attendanceList.map(async (record: Attendance) => {
          const student = await db.students.get(record.studentId);
          const course = await db.courses.get(record.courseId);
          
          return {
            ...record,
            student,
            course
          };
        })
      );

      setAttendance(enrichedAttendance);

      // Calcular estadísticas
      const statsData: AttendanceStats = {
        present: attendanceList.filter((a: Attendance) => a.status === 'present').length,
        absent: attendanceList.filter((a: Attendance) => a.status === 'absent').length,
        late: attendanceList.filter((a: Attendance) => a.status === 'late').length,
        excused: attendanceList.filter((a: Attendance) => a.status === 'excused').length,
        total: attendanceList.length,
        rate: 0
      };
      
      statsData.rate = statsData.total > 0
        ? Math.round(((statsData.present + statsData.excused) / statsData.total) * 100)
        : 0;

      setStats(statsData);
    } catch (err) {
      setError('Error al cargar asistencia');
    } finally {
      setLoading(false);
    }
  }, []);

  const registerAttendance = useCallback(async (
    records: Omit<Attendance, 'id'>[]
  ): Promise<boolean> => {
    setLoading(true);
    try {
      // Eliminar registros existentes para la misma fecha/curso
      if (records.length > 0) {
        const firstRecord = records[0];
        const startOfDay = new Date(firstRecord.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(firstRecord.date);
        endOfDay.setHours(23, 59, 59, 999);

        const existing = await db.attendance
          .where('date')
          .between(startOfDay, endOfDay)
          .and((a: Attendance) => a.courseId === firstRecord.courseId)
          .toArray();

        await db.attendance.bulkDelete(existing.map((e: Attendance) => e.id));
      }

      // Crear nuevos registros
      const newRecords = records.map((r: any) => ({
        ...r,
        id: crypto.randomUUID()
      }));

      await db.attendance.bulkAdd(newRecords);

      // Crear notificaciones para ausencias
      for (const record of records) {
        if (record.status === 'absent') {
          const student = await db.students.get(record.studentId);
          if (student) {
            const parent = await db.parents.get(student.parentId);
            if (parent) {
              await db.notifications.add({
                id: crypto.randomUUID(),
                userId: parent.userId,
                title: 'Ausencia registrada',
                message: `Su hijo/a no asistió a clase el ${record.date.toLocaleDateString()}`,
                type: 'attendance',
                isRead: false,
                createdAt: new Date()
              });
            }
          }
        }
      }

      await fetchAttendance({ courseId: records[0]?.courseId, date: records[0]?.date });
      return true;
    } catch (err) {
      setError('Error al registrar asistencia');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAttendance]);

  const updateAttendance = useCallback(async (
    id: string,
    data: Partial<Attendance>
  ): Promise<boolean> => {
    setLoading(true);
    try {
      await db.attendance.update(id, data);
      
      const record = await db.attendance.get(id);
      if (record) {
        await fetchAttendance({ courseId: record.courseId, date: record.date });
      }
      return true;
    } catch (err) {
      setError('Error al actualizar asistencia');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAttendance]);

  const getStudentAttendanceHistory = useCallback(async (
    studentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Attendance[]> => {
    let query = db.attendance.where('studentId').equals(studentId);
    
    if (startDate && endDate) {
      query = query.and((a: Attendance) => a.date >= startDate && a.date <= endDate);
    }

    return await query.toArray();
  }, []);

  const getMonthlyReport = useCallback(async (
    courseId: string,
    month: number,
    year: number
  ) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await db.attendance
      .where('date')
      .between(startDate, endDate)
      .and((a: Attendance) => a.courseId === courseId)
      .toArray();

    const students = await db.students.toArray();
    const report: Record<string, { present: number; absent: number; late: number; rate: number }> = {};

    for (const student of students) {
      const studentRecords = records.filter((r: Attendance) => r.studentId === student.id);
      const present = studentRecords.filter((r: Attendance) => r.status === 'present').length;
      const absent = studentRecords.filter((r: Attendance) => r.status === 'absent').length;
      const late = studentRecords.filter((r: Attendance) => r.status === 'late').length;
      const total = studentRecords.length;

      report[student.id] = {
        present,
        absent,
        late,
        rate: total > 0 ? Math.round((present / total) * 100) : 0
      };
    }

    return report;
  }, []);

  return {
    attendance,
    stats,
    loading,
    error,
    fetchAttendance,
    registerAttendance,
    updateAttendance,
    getStudentAttendanceHistory,
    getMonthlyReport
  };
}
