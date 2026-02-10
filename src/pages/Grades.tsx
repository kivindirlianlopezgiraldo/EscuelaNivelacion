// ============================================
// GESTIÓN DE CALIFICACIONES
// ============================================

import { useState, useEffect } from 'react';
import { useGrades, useAuth } from '@/hooks';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Plus, TrendingUp, Award, FileText } from 'lucide-react';
import { formatDate, getGradeColor, getGradeLabel } from '@/utils/helpers';
import { db } from '@/db/database';

const GRADE_TYPES = [
  { value: 'exam', label: 'Examen' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'homework', label: 'Tarea' },
  { value: 'project', label: 'Proyecto' },
  { value: 'participation', label: 'Participación' },
  { value: 'final', label: 'Final' }
];

export function Grades() {
  const { user, isAdmin, isTeacher, isStudent, isParent } = useAuth();
  const { student, teacher } = useAuthStore();
  const { grades, stats, fetchGrades, createGrade } = useGrades();
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    type: '',
    name: '',
    score: '',
    maxScore: '100',
    period: '',
    comments: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (isStudent && student) {
        await fetchGrades({ studentId: student.id });
        const studentCourses = await db.courses.toArray();
        setCourses(studentCourses);
      } else if (isTeacher && teacher) {
        const teacherCourses = await db.courses.where('teacherId').equals(teacher.id).toArray();
        setCourses(teacherCourses);
        if (teacherCourses.length > 0) {
          await fetchGrades({ courseId: teacherCourses[0].id });
        }
      } else if (isAdmin) {
        await fetchGrades();
        const allCourses = await db.courses.toArray();
        setCourses(allCourses);
      }

      const allStudents = await db.students.toArray();
      const studentsWithUsers = await Promise.all(
        allStudents.map(async (s) => {
          const user = await db.users.get(s.userId);
          return { ...s, user };
        })
      );
      setStudents(studentsWithUsers);
    };

    loadData();
  }, [fetchGrades, isStudent, isTeacher, isAdmin, student, teacher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createGrade({
      studentId: formData.studentId,
      courseId: formData.courseId,
      teacherId: teacher?.id || '',
      type: formData.type as any,
      name: formData.name,
      score: Number(formData.score),
      maxScore: Number(formData.maxScore),
      period: formData.period,
      date: new Date(),
      comments: formData.comments
    });

    setIsDialogOpen(false);
    setFormData({
      studentId: '',
      courseId: '',
      type: '',
      name: '',
      score: '',
      maxScore: '100',
      period: '',
      comments: ''
    });
  };

  // Vista para Estudiante
  if (isStudent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mis Calificaciones</h1>
          <p className="text-muted-foreground">Seguimiento de tu rendimiento académico</p>
        </div>

        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.average}%</div>
                <Badge className={getGradeColor(stats.average)}>{getGradeLabel(stats.average)}</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Calificación Máxima</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.highest}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Evaluaciones</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Historial de Calificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Evaluación</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Calificación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell>{grade.course?.name}</TableCell>
                    <TableCell>{grade.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {GRADE_TYPES.find(t => t.value === grade.type)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{grade.period}</TableCell>
                    <TableCell>
                      <Badge className={getGradeColor((grade.score / grade.maxScore) * 100)}>
                        {grade.score}/{grade.maxScore}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
          <h1 className="text-3xl font-bold">Calificaciones</h1>
          <p className="text-muted-foreground">Gestión de calificaciones y evaluaciones</p>
        </div>
        {(isAdmin || isTeacher) && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Calificación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Calificación</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Curso</Label>
                      <Select
                        value={formData.courseId}
                        onValueChange={(value) => setFormData({ ...formData, courseId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar curso" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Estudiante</Label>
                      <Select
                        value={formData.studentId}
                        onValueChange={(value) => setFormData({ ...formData, studentId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estudiante" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.user?.firstName} {student.user?.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Parcial 1"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="score">Calificación</Label>
                      <Input
                        id="score"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.score}
                        onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxScore">Máximo</Label>
                      <Input
                        id="maxScore"
                        type="number"
                        value={formData.maxScore}
                        onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="period">Período</Label>
                      <Input
                        id="period"
                        value={formData.period}
                        onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                        placeholder="Ej: 2024-1"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comments">Comentarios</Label>
                    <Input
                      id="comments"
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar Calificación</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Máxima</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highest}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mínima</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground rotate-180" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowest}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Registro de Calificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Evaluación</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Calificación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell>
                    {grade.student?.userId ? (
                      <span>Estudiante</span>
                    ) : (
                      <span>-</span>
                    )}
                  </TableCell>
                  <TableCell>{grade.course?.name}</TableCell>
                  <TableCell>{grade.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {GRADE_TYPES.find(t => t.value === grade.type)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(grade.date)}</TableCell>
                  <TableCell>
                    <Badge className={getGradeColor((grade.score / grade.maxScore) * 100)}>
                      {grade.score}/{grade.maxScore}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
