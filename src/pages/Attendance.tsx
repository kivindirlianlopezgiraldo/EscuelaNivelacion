// ============================================
// CONTROL DE ASISTENCIA
// ============================================

import { useState, useEffect } from 'react';
import { useAttendance, useAuth } from '@/hooks';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Check, X, Clock, AlertCircle, Save } from 'lucide-react';
import { db } from '@/db/database';
import type { Attendance as AttendanceType } from '@/types';

const ATTENDANCE_STATUS = {
  present: { label: 'Presente', icon: Check, color: 'bg-green-500' },
  absent: { label: 'Ausente', icon: X, color: 'bg-red-500' },
  late: { label: 'Tardanza', icon: Clock, color: 'bg-yellow-500' },
  excused: { label: 'Justificado', icon: AlertCircle, color: 'bg-blue-500' }
};

export function Attendance() {
  const { isAdmin, isTeacher, isStudent, isParent } = useAuth();
  const { teacher } = useAuthStore();
  const { stats, fetchAttendance, registerAttendance } = useAttendance();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      if (isTeacher && teacher) {
        const teacherCourses = await db.courses.where('teacherId').equals(teacher.id).toArray();
        setCourses(teacherCourses);
        if (teacherCourses.length > 0 && !selectedCourse) {
          setSelectedCourse(teacherCourses[0].id);
        }
      } else if (isAdmin) {
        const allCourses = await db.courses.toArray();
        setCourses(allCourses);
      }
    };

    loadData();
  }, [isTeacher, isAdmin, teacher, selectedCourse]);

  useEffect(() => {
    const loadStudents = async () => {
      if (selectedCourse) {
        const enrollments = await db.enrollments.where('courseId').equals(selectedCourse).toArray();
        const studentIds = enrollments.map((e: any) => e.studentId);
        const studentsData = await db.students.where('id').anyOf(studentIds).toArray();
        
        const studentsWithUsers = await Promise.all(
          studentsData.map(async (s: any) => {
            const user = await db.users.get(s.userId);
            return { ...s, user };
          })
        );
        
        setStudents(studentsWithUsers);

        // Cargar asistencia existente
        await fetchAttendance({ courseId: selectedCourse, date: selectedDate });
      }
    };

    loadStudents();
  }, [selectedCourse, selectedDate, fetchAttendance]);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedCourse) return;

    const records = students.map((student: any) => ({
      studentId: student.id,
      courseId: selectedCourse,
      date: selectedDate,
      status: (attendanceRecords[student.id] || 'present') as any,
      notes: ''
    }));

    await registerAttendance(records);
  };

  // Vista para Estudiante/Acudiente
  if (isStudent || isParent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Asistencia</h1>
          <p className="text-muted-foreground">Registro de asistencia</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Asistencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </div>
            <div className="flex justify-center gap-4">
              {Object.entries(ATTENDANCE_STATUS).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded-full ${config.color}`} />
                  <span className="text-sm">{config.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista para Profesor/Admin
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Control de Asistencia</h1>
          <p className="text-muted-foreground">Registro diario de asistencia</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Curso y Fecha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Curso</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course: any) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lista de Estudiantes</CardTitle>
            <Button onClick={handleSaveAttendance}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Asistencia
            </Button>
          </CardHeader>
          <CardContent>
            {stats && (
              <div className="flex gap-4 mb-4">
                <Badge variant="default" className="bg-green-500">
                  Presentes: {stats.present}
                </Badge>
                <Badge variant="destructive">
                  Ausentes: {stats.absent}
                </Badge>
                <Badge variant="outline" className="bg-yellow-500 text-white">
                  Tardanzas: {stats.late}
                </Badge>
                <Badge variant="outline" className="bg-blue-500 text-white">
                  Justificados: {stats.excused}
                </Badge>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {student.user?.firstName?.charAt(0)}{student.user?.lastName?.charAt(0)}
                        </div>
                        <span>{student.user?.firstName} {student.user?.lastName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {attendanceRecords[student.id] && (
                        <Badge className={ATTENDANCE_STATUS[attendanceRecords[student.id] as keyof typeof ATTENDANCE_STATUS]?.color}>
                          {ATTENDANCE_STATUS[attendanceRecords[student.id] as keyof typeof ATTENDANCE_STATUS]?.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {Object.entries(ATTENDANCE_STATUS).map(([key, config]) => {
                          const Icon = config.icon;
                          return (
                            <Button
                              key={key}
                              variant={attendanceRecords[student.id] === key ? 'default' : 'outline'}
                              size="icon"
                              className={`h-8 w-8 ${attendanceRecords[student.id] === key ? config.color : ''}`}
                              onClick={() => handleStatusChange(student.id, key)}
                            >
                              <Icon className="h-4 w-4" />
                            </Button>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
