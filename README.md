# 🎓 Escuela de Nivelación

Sistema completo de gestión escolar con soporte **offline** para web y dispositivos móviles. Diseñado para escuelas de nivelación que necesitan una solución integral para administrar estudiantes, profesores, cursos, calificaciones, asistencia y más.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Características

### 👥 Gestión de Usuarios
- **4 Roles de usuario**: Administrador, Profesor, Estudiante y Acudiente
- Cada rol con permisos específicos y vistas personalizadas
- Autenticación segura con persistencia de sesión

### 📚 Módulos Principales

| Módulo | Descripción | Roles |
|--------|-------------|-------|
| **Dashboard** | Panel de control con estadísticas y resumen | Todos |
| **Estudiantes** | Registro, edición y seguimiento de estudiantes | Admin, Profesor |
| **Profesores** | Gestión de docentes y asignaciones | Admin |
| **Cursos** | Creación de materias y asignación de estudiantes | Admin, Profesor |
| **Calificaciones** | Registro de notas y reportes de rendimiento | Todos |
| **Asistencia** | Control de asistencia diaria | Admin, Profesor |
| **Chat** | Mensajería entre usuarios | Todos |
| **Juegos** | Juegos educativos por materia | Estudiante |

### 🎮 Juegos Educativos
- **Matemáticas**: Operaciones básicas, fracciones
- **Ciencias**: Quiz de conocimientos
- **Lenguaje**: Crucigramas, sopa de letras (próximamente)
- **Inglés**: Vocabulario interactivo
- **Historia**: Línea de tiempo (próximamente)

### 📱 Características PWA
- ✅ Funciona **sin conexión** a internet
- ✅ Instalable en Android e iOS
- ✅ Sincronización de datos
- ✅ Notificaciones push
- ✅ Interfaz responsive

## 🚀 Tecnologías

- **Frontend**: React 18 + TypeScript
- **Estilos**: Tailwind CSS + shadcn/ui
- **Estado**: Zustand
- **Base de datos**: IndexedDB (Dexie.js)
- **Gráficos**: Recharts
- **Fechas**: date-fns
- **Build**: Vite

## 📦 Instalación

### Requisitos previos
- Node.js 18+ 
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/escuela-nivelacion.git
cd escuela-nivelacion
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar en modo desarrollo**
```bash
npm run dev
```

4. **Construir para producción**
```bash
npm run build
```

## 🗄️ Estructura del Proyecto

```
escuela-nivelacion/
├── public/                    # Assets estáticos
│   ├── manifest.json          # Configuración PWA
│   ├── sw.js                  # Service Worker
│   └── icons/                 # Iconos de la app
├── src/
│   ├── components/            # Componentes reutilizables
│   │   ├── Layout.tsx         # Layout principal
│   │   ├── Sidebar.tsx        # Barra lateral
│   │   └── Header.tsx         # Header
│   ├── pages/                 # Páginas principales
│   │   ├── Login.tsx          # Login
│   │   ├── Dashboard.tsx      # Dashboard por rol
│   │   ├── Students.tsx       # Gestión de estudiantes
│   │   ├── Courses.tsx        # Gestión de cursos
│   │   ├── Grades.tsx         # Calificaciones
│   │   ├── Attendance.tsx     # Asistencia
│   │   ├── Chat.tsx           # Chat
│   │   └── Games.tsx          # Juegos educativos
│   ├── db/                    # Base de datos
│   │   └── database.ts        # Configuración IndexedDB
│   ├── store/                 # Estado global
│   │   └── index.ts           # Zustand store
│   ├── hooks/                 # Custom hooks
│   │   ├── useAuth.ts         # Autenticación
│   │   ├── useStudents.ts     # Estudiantes
│   │   ├── useCourses.ts      # Cursos
│   │   ├── useGrades.ts       # Calificaciones
│   │   ├── useAttendance.ts   # Asistencia
│   │   ├── useChat.ts         # Chat
│   │   └── useGames.ts        # Juegos
│   ├── types/                 # Tipos TypeScript
│   │   └── index.ts           # Definiciones
│   ├── utils/                 # Utilidades
│   │   └── helpers.ts         # Funciones helper
│   └── App.tsx                # App principal
├── database/                  # Scripts de base de datos
├── index.html                 # HTML principal
├── package.json               # Dependencias
├── tailwind.config.js         # Config Tailwind
├── tsconfig.json              # Config TypeScript
└── vite.config.ts             # Config Vite
```

## 💾 Base de Datos

El sistema utiliza **IndexedDB** para almacenamiento local, permitiendo funcionar completamente offline.

### Tablas principales:

```typescript
// Usuarios
interface User {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
}

// Estudiantes
interface Student {
  id: string;
  userId: string;
  studentCode: string;
  grade: string;
  section: string;
  birthDate: Date;
  address: string;
  parentId: string;
}

// Cursos
interface Course {
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
}

// Calificaciones
interface Grade {
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
}

// Asistencia
interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
}

// Mensajes de chat
interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  chatRoomId: string;
}

// Puntajes de juegos
interface GameScore {
  id: string;
  studentId: string;
  gameType: string;
  subject: string;
  score: number;
  maxScore: number;
  timeSpent: number;
  playedAt: Date;
}
```

## 🔐 Credenciales de Demo

Al iniciar la aplicación por primera vez, se crea automáticamente un usuario administrador:

- **Email**: `admin@escuela.com`
- **Contraseña**: `admin123`

## 📱 Instalación en Dispositivos Móviles

### Android
1. Abre la aplicación en Chrome
2. Toca el menú (⋮) y selecciona "Agregar a pantalla de inicio"
3. ¡Listo! La app se instala como una aplicación nativa

### iOS
1. Abre la aplicación en Safari
2. Toca el botón Compartir (□↑)
3. Selecciona "Agregar a Inicio"
4. ¡Listo! La app se instala en tu pantalla de inicio

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

## 🔄 Respaldo y Restauración

La aplicación incluye funciones para exportar e importar la base de datos completa:

```typescript
// Exportar datos
const data = await exportDatabase();
// Guarda 'data' como archivo JSON

// Importar datos
await importDatabase(jsonData);
```

## 🚢 Despliegue

### Vercel
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
npm i -g netlify-cli
netlify deploy
```

### GitHub Pages
```bash
npm run build
# Copiar contenido de 'dist' a rama gh-pages
```

## 📝 Roadmap

- [x] Sistema de autenticación
- [x] Gestión de estudiantes
- [x] Gestión de cursos
- [x] Calificaciones
- [x] Asistencia
- [x] Chat en tiempo real
- [x] Juegos educativos
- [ ] Sincronización con servidor
- [ ] Reportes PDF
- [ ] Notificaciones push
- [ ] App móvil nativa (Capacitor)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de características (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👨‍💻 Autor

**Tu Nombre** - [@tu-usuario](https://github.com/tu-usuario)

---

⭐ ¡Si te gusta este proyecto, dale una estrella en GitHub!
# EscuelaNivelacion
# EscuelaNivelacion
