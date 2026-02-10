// ============================================
// HOOK DE JUEGOS EDUCATIVOS
// ============================================

import { useState, useCallback } from 'react';
import { db } from '@/db/database';
import { useAuthStore } from '@/store';
import type { GameScore, MathProblem, GameQuestion } from '@/types';

export type GameType = 
  | 'math-operations' 
  | 'math-fractions'
  | 'language-crossword'
  | 'language-wordsoup'
  | 'science-quiz'
  | 'history-timeline'
  | 'english-vocabulary';

export const GAME_CONFIG = {
  'math-operations': {
    name: 'Operaciones Matemáticas',
    subject: 'Matemáticas',
    description: 'Resuelve operaciones básicas: suma, resta, multiplicación y división',
    icon: 'Calculator',
    color: 'bg-blue-500'
  },
  'math-fractions': {
    name: 'Fracciones',
    subject: 'Matemáticas',
    description: 'Aprende y practica operaciones con fracciones',
    icon: 'PieChart',
    color: 'bg-indigo-500'
  },
  'language-crossword': {
    name: 'Crucigrama',
    subject: 'Lenguaje',
    description: 'Completa el crucigrama con palabras relacionadas',
    icon: 'Grid3X3',
    color: 'bg-green-500'
  },
  'language-wordsoup': {
    name: 'Sopa de Letras',
    subject: 'Lenguaje',
    description: 'Encuentra las palabras escondidas',
    icon: 'Search',
    color: 'bg-emerald-500'
  },
  'science-quiz': {
    name: 'Quiz de Ciencias',
    subject: 'Ciencias',
    description: 'Pon a prueba tus conocimientos científicos',
    icon: 'FlaskConical',
    color: 'bg-purple-500'
  },
  'history-timeline': {
    name: 'Línea de Tiempo',
    subject: 'Historia',
    description: 'Ordena los eventos históricos',
    icon: 'Clock',
    color: 'bg-amber-500'
  },
  'english-vocabulary': {
    name: 'Vocabulario en Inglés',
    subject: 'Inglés',
    description: 'Aprende nuevo vocabulario en inglés',
    icon: 'Languages',
    color: 'bg-rose-500'
  }
};

export function useGames() {
  const { user, student } = useAuthStore();
  const [currentGame, setCurrentGame] = useState<GameType | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Generar problemas matemáticos
  const generateMathProblem = useCallback((type: 'addition' | 'subtraction' | 'multiplication' | 'division', difficulty: 'easy' | 'medium' | 'hard'): MathProblem => {
    let num1: number, num2: number, answer: number;
    const maxNum = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 50 : 100;

    switch (type) {
      case 'addition':
        num1 = Math.floor(Math.random() * maxNum) + 1;
        num2 = Math.floor(Math.random() * maxNum) + 1;
        answer = num1 + num2;
        return {
          id: crypto.randomUUID(),
          type: 'addition',
          problem: `${num1} + ${num2} = ?`,
          answer,
          difficulty
        };
      case 'subtraction':
        num1 = Math.floor(Math.random() * maxNum) + 1;
        num2 = Math.floor(Math.random() * num1) + 1;
        answer = num1 - num2;
        return {
          id: crypto.randomUUID(),
          type: 'subtraction',
          problem: `${num1} - ${num2} = ?`,
          answer,
          difficulty
        };
      case 'multiplication':
        num1 = Math.floor(Math.random() * (maxNum / 2)) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
        return {
          id: crypto.randomUUID(),
          type: 'multiplication',
          problem: `${num1} × ${num2} = ?`,
          answer,
          difficulty
        };
      case 'division':
        num2 = Math.floor(Math.random() * 9) + 2;
        answer = Math.floor(Math.random() * (maxNum / 2)) + 1;
        num1 = num2 * answer;
        return {
          id: crypto.randomUUID(),
          type: 'division',
          problem: `${num1} ÷ ${num2} = ?`,
          answer,
          difficulty
        };
    }
  }, []);

  // Generar preguntas de ciencias
  const generateScienceQuestions = useCallback((): GameQuestion[] => {
    const questions: GameQuestion[] = [
      {
        id: '1',
        question: '¿Cuál es el planeta más cercano al Sol?',
        options: ['Mercurio', 'Venus', 'Tierra', 'Marte'],
        correctAnswer: 'Mercurio',
        difficulty: 'easy'
      },
      {
        id: '2',
        question: '¿Cuál es el órgano más grande del cuerpo humano?',
        options: ['Hígado', 'Piel', 'Corazón', 'Pulmón'],
        correctAnswer: 'Piel',
        difficulty: 'easy'
      },
      {
        id: '3',
        question: '¿Qué gas necesitan las plantas para la fotosíntesis?',
        options: ['Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Hidrógeno'],
        correctAnswer: 'Dióxido de carbono',
        difficulty: 'easy'
      },
      {
        id: '4',
        question: '¿Cuántos huesos tiene el cuerpo humano adulto?',
        options: ['106', '206', '306', '406'],
        correctAnswer: '206',
        difficulty: 'medium'
      },
      {
        id: '5',
        question: '¿Cuál es la fórmula química del agua?',
        options: ['CO2', 'H2O', 'NaCl', 'O2'],
        correctAnswer: 'H2O',
        difficulty: 'easy'
      }
    ];
    return questions.sort(() => Math.random() - 0.5);
  }, []);

  // Generar vocabulario en inglés
  const generateEnglishVocabulary = useCallback((): GameQuestion[] => {
    const questions: GameQuestion[] = [
      {
        id: '1',
        question: '¿Cómo se dice "perro" en inglés?',
        options: ['Cat', 'Dog', 'Bird', 'Fish'],
        correctAnswer: 'Dog',
        difficulty: 'easy'
      },
      {
        id: '2',
        question: '¿Cómo se dice "casa" en inglés?',
        options: ['House', 'Car', 'Tree', 'Book'],
        correctAnswer: 'House',
        difficulty: 'easy'
      },
      {
        id: '3',
        question: '¿Cómo se dice "biblioteca" en inglés?',
        options: ['Bookstore', 'Library', 'School', 'Office'],
        correctAnswer: 'Library',
        difficulty: 'medium'
      },
      {
        id: '4',
        question: '¿Cómo se dice "hermoso" en inglés?',
        options: ['Ugly', 'Beautiful', 'Small', 'Big'],
        correctAnswer: 'Beautiful',
        difficulty: 'medium'
      },
      {
        id: '5',
        question: '¿Cómo se dice "desayuno" en inglés?',
        options: ['Lunch', 'Dinner', 'Breakfast', 'Snack'],
        correctAnswer: 'Breakfast',
        difficulty: 'easy'
      }
    ];
    return questions.sort(() => Math.random() - 0.5);
  }, []);

  // Iniciar juego
  const startGame = useCallback((gameType: GameType) => {
    setCurrentGame(gameType);
    setScore(0);
    setLevel(1);
    setIsPlaying(true);
  }, []);

  // Finalizar juego
  const endGame = useCallback(async () => {
    if (user && student && currentGame) {
      const gameConfig = GAME_CONFIG[currentGame];
      
      await db.gameScores.add({
        id: crypto.randomUUID(),
        studentId: student.id,
        gameType: currentGame,
        subject: gameConfig.subject,
        score,
        maxScore: score + 50,
        timeSpent: 0,
        playedAt: new Date()
      });

      // Crear notificación
      await db.notifications.add({
        id: crypto.randomUUID(),
        userId: user.id,
        title: '¡Juego completado!',
        message: `Obtuviste ${score} puntos en ${gameConfig.name}`,
        type: 'game',
        isRead: false,
        createdAt: new Date()
      });
    }

    setIsPlaying(false);
    setCurrentGame(null);
  }, [user, student, currentGame, score]);

  // Agregar puntos
  const addPoints = useCallback((points: number) => {
    setScore(prev => prev + points);
  }, []);

  // Subir de nivel
  const levelUp = useCallback(() => {
    setLevel(prev => prev + 1);
  }, []);

  // Obtener puntajes del estudiante
  const getStudentScores = useCallback(async (): Promise<GameScore[]> => {
    if (!student) return [];
    return await db.gameScores
      .where('studentId')
      .equals(student.id)
      .reverse()
      .sortBy('playedAt');
  }, [student]);

  // Obtener mejores puntajes
  const getTopScores = useCallback(async (gameType: GameType, limit: number = 10): Promise<GameScore[]> => {
    return await db.gameScores
      .where('gameType')
      .equals(gameType)
      .reverse()
      .sortBy('score')
      .then((scores: GameScore[]) => scores.slice(0, limit));
  }, []);

  // Obtener estadísticas por materia
  const getSubjectStats = useCallback(async () => {
    if (!student) return {};
    
    const scores = await db.gameScores
      .where('studentId')
      .equals(student.id)
      .toArray();

    const stats: Record<string, { total: number; count: number; average: number }> = {};

    scores.forEach((score: GameScore) => {
      if (!stats[score.subject]) {
        stats[score.subject] = { total: 0, count: 0, average: 0 };
      }
      stats[score.subject].total += score.score;
      stats[score.subject].count++;
    });

    Object.keys(stats).forEach(subject => {
      stats[subject].average = Math.round(stats[subject].total / stats[subject].count);
    });

    return stats;
  }, [student]);

  return {
    currentGame,
    score,
    level,
    isPlaying,
    setCurrentGame,
    setScore,
    setLevel,
    setIsPlaying,
    startGame,
    endGame,
    addPoints,
    levelUp,
    generateMathProblem,
    generateScienceQuestions,
    generateEnglishVocabulary,
    getStudentScores,
    getTopScores,
    getSubjectStats
  };
}
