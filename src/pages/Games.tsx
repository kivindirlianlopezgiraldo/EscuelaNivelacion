// ============================================
// JUEGOS EDUCATIVOS
// ============================================

import { useState, useEffect } from 'react';
import { useGames, GAME_CONFIG, GameType } from '@/hooks';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator,
  PieChart,
  Grid3X3,
  Search,
  FlaskConical,
  Clock,
  Languages,
  Trophy,
  Star,
  Timer,
  ArrowLeft,
  Check,
  X
} from 'lucide-react';

const ICONS: Record<string, React.ElementType> = {
  Calculator,
  PieChart,
  Grid3X3,
  Search,
  FlaskConical,
  Clock,
  Languages
};

// Juego de Operaciones Matemáticas
function MathOperationsGame({ onEnd }: { onEnd: () => void }) {
  const { score, level, generateMathProblem, addPoints, levelUp } = useGames();
  const [problem, setProblem] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    nextProblem();
  }, []);

  const nextProblem = () => {
    const types: ('addition' | 'subtraction' | 'multiplication' | 'division')[] = 
      ['addition', 'subtraction', 'multiplication', 'division'];
    const type = types[Math.floor(Math.random() * types.length)];
    const difficulty = level <= 2 ? 'easy' : level <= 5 ? 'medium' : 'hard';
    setProblem(generateMathProblem(type, difficulty));
    setAnswer('');
    setFeedback(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAnswer = Number(answer);
    
    if (numAnswer === problem?.answer) {
      setFeedback('correct');
      addPoints(10 * level);
      setStreak(prev => prev + 1);
      
      if (streak > 0 && streak % 5 === 0) {
        levelUp();
      }
      
      setTimeout(nextProblem, 1000);
    } else {
      setFeedback('incorrect');
      setStreak(0);
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Puntuación</p>
          <p className="text-2xl font-bold">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Nivel</p>
          <p className="text-2xl font-bold">{level}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Racha</p>
          <p className="text-2xl font-bold">{streak}</p>
        </div>
      </div>

      <Card className="text-center p-8">
        <CardContent>
          <p className="text-4xl font-bold mb-6">{problem?.problem}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full text-center text-2xl p-4 border rounded-lg"
              placeholder="?"
              autoFocus
            />
            <Button type="submit" className="w-full" size="lg">
              Responder
            </Button>
          </form>
          {feedback === 'correct' && (
            <div className="mt-4 text-green-500 flex items-center justify-center gap-2">
              <Check className="h-6 w-6" />
              <span className="text-lg font-bold">¡Correcto!</span>
            </div>
          )}
          {feedback === 'incorrect' && (
            <div className="mt-4 text-red-500 flex items-center justify-center gap-2">
              <X className="h-6 w-6" />
              <span className="text-lg font-bold">Intenta de nuevo</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" onClick={onEnd} className="w-full">
        Terminar Juego
      </Button>
    </div>
  );
}

// Quiz de Ciencias
function ScienceQuizGame({ onEnd }: { onEnd: () => void }) {
  const { score, generateScienceQuestions, addPoints } = useGames();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    setQuestions(generateScienceQuestions());
  }, []);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);
    
    if (answer === currentQuestion?.correctAnswer) {
      addPoints(10);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        onEnd();
      }
    }, 1500);
  };

  if (!currentQuestion) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Puntuación</p>
          <p className="text-2xl font-bold">{score}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Pregunta</p>
          <p className="text-2xl font-bold">{currentIndex + 1}/{questions.length}</p>
        </div>
      </div>

      <Progress value={(currentIndex / questions.length) * 100} />

      <Card className="p-6">
        <CardContent className="space-y-6">
          <p className="text-xl font-medium">{currentQuestion.question}</p>
          <div className="grid gap-3">
            {currentQuestion.options?.map((option: string) => (
              <Button
                key={option}
                variant={
                  showResult
                    ? option === currentQuestion.correctAnswer
                      ? 'default'
                      : option === selectedAnswer
                      ? 'destructive'
                      : 'outline'
                    : 'outline'
                }
                className="justify-start h-auto py-4 px-6"
                onClick={() => !showResult && handleAnswer(option)}
                disabled={showResult}
              >
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={onEnd} className="w-full">
        Terminar Juego
      </Button>
    </div>
  );
}

// Vocabulario en Inglés
function EnglishVocabularyGame({ onEnd }: { onEnd: () => void }) {
  const { score, generateEnglishVocabulary, addPoints } = useGames();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    setQuestions(generateEnglishVocabulary());
  }, []);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);
    
    if (answer === currentQuestion?.correctAnswer) {
      addPoints(10);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        onEnd();
      }
    }, 1500);
  };

  if (!currentQuestion) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Puntuación</p>
          <p className="text-2xl font-bold">{score}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Pregunta</p>
          <p className="text-2xl font-bold">{currentIndex + 1}/{questions.length}</p>
        </div>
      </div>

      <Progress value={(currentIndex / questions.length) * 100} />

      <Card className="p-6">
        <CardContent className="space-y-6">
          <p className="text-xl font-medium">{currentQuestion.question}</p>
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options?.map((option: string) => (
              <Button
                key={option}
                variant={
                  showResult
                    ? option === currentQuestion.correctAnswer
                      ? 'default'
                      : option === selectedAnswer
                      ? 'destructive'
                      : 'outline'
                    : 'outline'
                }
                className="h-auto py-4"
                onClick={() => !showResult && handleAnswer(option)}
                disabled={showResult}
              >
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={onEnd} className="w-full">
        Terminar Juego
      </Button>
    </div>
  );
}

// Página principal de juegos
export function Games() {
  const { student } = useAuthStore();
  const { currentGame, score, startGame, endGame, getStudentScores, getSubjectStats } = useGames();
  const [gameScores, setGameScores] = useState<any[]>([]);
  const [subjectStats, setSubjectStats] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadData = async () => {
      const scores = await getStudentScores();
      setGameScores(scores.slice(0, 10));
      
      const stats = await getSubjectStats();
      setSubjectStats(stats);
    };
    
    loadData();
  }, [getStudentScores, getSubjectStats]);

  // Renderizar juego activo
  if (currentGame) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={endGame}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{GAME_CONFIG[currentGame].name}</h1>
            <p className="text-muted-foreground">{GAME_CONFIG[currentGame].description}</p>
          </div>
        </div>

        {currentGame === 'math-operations' && <MathOperationsGame onEnd={endGame} />}
        {currentGame === 'science-quiz' && <ScienceQuizGame onEnd={endGame} />}
        {currentGame === 'english-vocabulary' && <EnglishVocabularyGame onEnd={endGame} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Juegos Educativos</h1>
        <p className="text-muted-foreground">Aprende jugando y mejora tus habilidades</p>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Puntos</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gameScores.reduce((sum, s) => sum + s.score, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Juegos Jugados</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gameScores.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mejor Puntuación</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gameScores.length > 0 ? Math.max(...gameScores.map(s => s.score)) : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Total</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(gameScores.reduce((sum, s) => sum + s.timeSpent, 0) / 60)} min
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Juegos por Materia */}
      <Tabs defaultValue="matematicas">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="matematicas">Matemáticas</TabsTrigger>
          <TabsTrigger value="ciencias">Ciencias</TabsTrigger>
          <TabsTrigger value="lenguaje">Lenguaje</TabsTrigger>
          <TabsTrigger value="ingles">Inglés</TabsTrigger>
        </TabsList>

        <TabsContent value="matematicas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => startGame('math-operations')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Calculator className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Operaciones Matemáticas</CardTitle>
                    <CardDescription>Practica suma, resta, multiplicación y división</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge>Nivel Básico</Badge>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => startGame('math-fractions')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-indigo-500 flex items-center justify-center">
                    <PieChart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Fracciones</CardTitle>
                    <CardDescription>Aprende a trabajar con fracciones</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge>Nivel Intermedio</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ciencias" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => startGame('science-quiz')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-purple-500 flex items-center justify-center">
                    <FlaskConical className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Quiz de Ciencias</CardTitle>
                    <CardDescription>Pon a prueba tus conocimientos científicos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge>Todos los niveles</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lenguaje" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-green-500 flex items-center justify-center">
                    <Grid3X3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Crucigrama</CardTitle>
                    <CardDescription>Completa el crucigrama con palabras</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge>Próximamente</Badge>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <Search className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Sopa de Letras</CardTitle>
                    <CardDescription>Encuentra palabras escondidas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge>Próximamente</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ingles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => startGame('english-vocabulary')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-rose-500 flex items-center justify-center">
                    <Languages className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Vocabulario</CardTitle>
                    <CardDescription>Aprende nuevo vocabulario en inglés</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge>Nivel Básico</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Historial de Puntuaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Mis Puntuaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {gameScores.map((score, index) => (
              <div key={score.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{GAME_CONFIG[score.gameType as GameType]?.name || score.gameType}</p>
                    <p className="text-sm text-muted-foreground">{score.subject}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{score.score} pts</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(score.playedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {gameScores.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Aún no has jugado. ¡Empieza ahora!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
