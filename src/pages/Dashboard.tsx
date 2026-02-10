// ============================================
// DASHBOARD PRINCIPAL
// ============================================

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { useCourses } from '@/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  TrendingUp,
  Award,
  Gamepad2,
  ArrowRight
} from 'lucide-react';
import { getGradeColor, getGradeLabel } from '@/utils/helpers';
import { db } from '@/db/database';
import type { Grade, Attendance } from '@/types';

// Dashboard para Admin
function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalParents: 0,
    averageGrade: 0,
    attendanceRate: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      const [students, teachers, courses, parents, grades, attendance] = await Promise.all([
        db.students.count(),
        db.teachers.count(),
        db.courses.count(),
        db.parents.count(),
        db.grades.toArray(),
        db.attendance.toArray()
      ]);

      const averageGrade = grades.length > 0
        ? Math.round(grades.reduce((sum: number, g: Grade) => sum + (g.score / g.maxScore) * 100, 0) / grades.length)
        : 0;

      const attendanceRate = attendance.length > 0
        ? Math.round((attendance.filter((a: Attendance) => a.status === 'present').length / attendance.length) * 100)
        : 0;

      setStats({
        totalStudents: students,
        totalTeachers: teachers,
        totalCourses: courses,
        totalParents: parents,
        averageGrade,
        attendanceRate
      });

      // Cargar actividad reciente
      const recentGrades = await db.grades
        .orderBy('date')
        .reverse()
        .limit(5)
        .toArray();

      const enrichedActivity = await Promise.all(
        recentGrades.map(async (grade: Grade) => {
          const student = await db.students.get(grade.studentId);
          const user = student ? await db.users.get(student.userId) : null;
          const course = await db.courses.get(grade.courseId);
          return {
            type: 'grade',
            description: `Nueva calificación en ${course?.name}`,
            student: user ? `${user.firstName} ${user.lastName}` : 'Estudiante',
            date: grade.date,
            score: grade.score
          };
        })
      );

      setRecentActivity(enrichedActivity);
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Profesores</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">Activos este período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cursos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageGrade}%</div>
            <Progress value={stats.averageGrade} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas calificaciones registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">{activity.student}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getGradeColor((activity.score / 100) * 100)}>
                      {activity.score}%
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Tareas comunes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-between" variant="outline">
              Registrar Estudiante
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button className="w-full justify-between" variant="outline">
              Crear Curso
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button className="w-full justify-between" variant="outline">
              Registrar Calificación
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button className="w-full justify-between" variant="outline">
              Tomar Asistencia
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button className="w-full justify-between" variant="outline">
              Generar Reporte
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Asistencia</CardTitle>
          <CardDescription>Tasa de asistencia general: {stats.attendanceRate}%</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={stats.attendanceRate} className="h-3" />
            </div>
            <span className="text-lg font-medium">{stats.attendanceRate}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Dashboard para Profesor
function TeacherDashboard() {
  const { teacher } = useAuthStore();
  const { courses } = useCourses();
  const [myCourses] = useState<any[]>([]);

  useEffect(() => {
    if (teacher) {
      courses.filter((c: any) => c.teacherId === teacher.id);
    }
  }, [teacher, courses]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mis Cursos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myCourses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis Cursos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myCourses.map((course: any) => (
              <Card key={course.id} className="border-l-4" style={{ borderLeftColor: course.color }}>
                <CardHeader>
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  <CardDescription>{course.grade} - {course.section}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{course.studentCount} estudiantes</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Dashboard para Estudiante
function StudentDashboard() {
  const { student, user } = useAuthStore();
  const [myGrades, setMyGrades] = useState<any[]>([]);
  const [averageGrade, setAverageGrade] = useState(0);
  const { getStudentScores } = useGames();
  const [gameScores, setGameScores] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (student) {
        const grades = await db.grades.where('studentId').equals(student.id).toArray();
        const enrichedGrades = await Promise.all(
          grades.map(async (grade: Grade) => {
            const course = await db.courses.get(grade.courseId);
            return { ...grade, course };
          })
        );
        setMyGrades(enrichedGrades.slice(0, 5));

        const avg = grades.length > 0
          ? Math.round(grades.reduce((sum: number, g: Grade) => sum + (g.score / g.maxScore) * 100, 0) / grades.length)
          : 0;
        setAverageGrade(avg);

        const scores = await getStudentScores();
        setGameScores(scores.slice(0, 5));
      }
    };

    loadData();
  }, [student, getStudentScores]);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">¡Hola, {user?.firstName}! 👋</h1>
          <p className="text-muted-foreground">Aquí está tu resumen académico</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageGrade}%</div>
            <Badge className={getGradeColor(averageGrade)}>{getGradeLabel(averageGrade)}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cursos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Puntos Juegos</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gameScores.reduce((sum: number, s: any) => sum + s.score, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Grades */}
      <Card>
        <CardHeader>
          <CardTitle>Calificaciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myGrades.map((grade: any) => (
              <div key={grade.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{grade.course?.name}</p>
                  <p className="text-sm text-muted-foreground">{grade.name}</p>
                </div>
                <Badge className={getGradeColor((grade.score / grade.maxScore) * 100)}>
                  {grade.score}/{grade.maxScore}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Dashboard para Acudiente
function ParentDashboard() {
  const { parent, user } = useAuthStore();
  const [children, setChildren] = useState<any[]>([]);

  useEffect(() => {
    const loadChildren = async () => {
      if (parent) {
        const childrenData = await db.students
          .where('id')
          .anyOf(parent.childrenIds)
          .toArray();

        const enrichedChildren = await Promise.all(
          childrenData.map(async (child: any) => {
            const userData = await db.users.get(child.userId);
            const grades = await db.grades.where('studentId').equals(child.id).toArray();
            const average = grades.length > 0
              ? Math.round(grades.reduce((sum: number, g: Grade) => sum + (g.score / g.maxScore) * 100, 0) / grades.length)
              : 0;
            return { ...child, user: userData, average };
          })
        );

        setChildren(enrichedChildren);
      }
    };

    loadChildren();
  }, [parent]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bienvenido, {user?.firstName}</h1>
        <p className="text-muted-foreground">Seguimiento académico de sus hijos</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {children.map((child: any) => (
          <Card key={child.id}>
            <CardHeader>
              <CardTitle>{child.user?.firstName} {child.user?.lastName}</CardTitle>
              <CardDescription>Grado: {child.grade} - Sección: {child.section}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Promedio General</span>
                  <span className="text-sm font-bold">{child.average}%</span>
                </div>
                <Progress value={child.average} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Ver Calificaciones
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Ver Asistencia
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Componente principal Dashboard
export function Dashboard() {
  const { user } = useAuthStore();

  if (!user) return null;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'parent':
      return <ParentDashboard />;
    default:
      return null;
  }
}
