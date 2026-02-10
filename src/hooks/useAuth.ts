// ============================================
// HOOK DE AUTENTICACIÓN
// ============================================

import { useState, useCallback } from 'react';
import { db } from '@/db/database';
import { useAuthStore } from '@/store';
import type { User, UserRole, Student, Teacher, Parent } from '@/types';

export function useAuth() {
  const { user, login: storeLogin, logout: storeLogout } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await db.users.where({ email, password }).first();
      
      if (!user) {
        setError('Credenciales incorrectas');
        return false;
      }
      
      if (!user.isActive) {
        setError('Usuario inactivo');
        return false;
      }

      // Obtener detalles según el rol
      let details: Student | Teacher | Parent | undefined;
      
      if (user.role === 'student') {
        details = await db.students.where('userId').equals(user.id).first();
      } else if (user.role === 'teacher') {
        details = await db.teachers.where('userId').equals(user.id).first();
      } else if (user.role === 'parent') {
        details = await db.parents.where('userId').equals(user.id).first();
      }

      storeLogin(user, details);
      return true;
    } catch (err) {
      setError('Error al iniciar sesión');
      return false;
    } finally {
      setLoading(false);
    }
  }, [storeLogin]);

  const logout = useCallback(() => {
    storeLogout();
  }, [storeLogout]);

  const hasRole = useCallback((roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  return {
    user,
    isAuthenticated: !!user,
    error,
    loading,
    login,
    logout,
    hasRole,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
    isParent: user?.role === 'parent'
  };
}

export function useUsers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = useCallback(async (
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
    roleData?: Partial<Student | Teacher | Parent>
  ): Promise<User | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Verificar si el email ya existe
      const existing = await db.users.where('email').equals(userData.email).first();
      if (existing) {
        setError('El email ya está registrado');
        return null;
      }

      const newUser: User = {
        ...userData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.users.add(newUser);

      // Crear registro según el rol
      if (userData.role === 'student' && roleData) {
        await db.students.add({
          ...roleData,
          id: crypto.randomUUID(),
          userId: newUser.id
        } as Student);
      } else if (userData.role === 'teacher' && roleData) {
        await db.teachers.add({
          ...roleData,
          id: crypto.randomUUID(),
          userId: newUser.id
        } as Teacher);
      } else if (userData.role === 'parent' && roleData) {
        await db.parents.add({
          ...roleData,
          id: crypto.randomUUID(),
          userId: newUser.id
        } as Parent);
      }

      return newUser;
    } catch (err) {
      setError('Error al crear usuario');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (
    id: string,
    data: Partial<User>
  ): Promise<boolean> => {
    setLoading(true);
    try {
      await db.users.update(id, { ...data, updatedAt: new Date() });
      return true;
    } catch (err) {
      setError('Error al actualizar usuario');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      await db.users.delete(id);
      // Eliminar registros relacionados
      await db.students.where('userId').equals(id).delete();
      await db.teachers.where('userId').equals(id).delete();
      await db.parents.where('userId').equals(id).delete();
      return true;
    } catch (err) {
      setError('Error al eliminar usuario');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUsersByRole = useCallback(async (role: UserRole): Promise<User[]> => {
    return await db.users.where('role').equals(role).toArray();
  }, []);

  return {
    createUser,
    updateUser,
    deleteUser,
    getUsersByRole,
    loading,
    error
  };
}
