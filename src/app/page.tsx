"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookType,
  Loader,
  Lightbulb,
  MessageSquareQuote,
  Globe,
  ArrowRight,
  Check,
  X,
  Award,
  BookMarked,
  Sparkles,
  RefreshCw,
  PlusSquare,
  History,
  LineChart as LineChartIcon,
  SpellCheck,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, LineChart, Line, CartesianGrid, Tooltip, Legend } from "recharts";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  getEnhancedExplanationAction,
  getQuizDefinitionsAction,
  evaluateAnswerAction,
} from "@/lib/actions";
import { wordInputSchema } from "@/lib/schema";
import type {
  EnhancementType,
  QuizAnswerState,
  QuizItem,
  QuizState,
  PastQuiz,
  WordResult,
} from "@/types/quiz";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type WordInputForm = z.infer<typeof wordInputSchema>;

// Function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const MAX_HISTORY_ITEMS = 5;
const LOCAL_STORAGE_KEY = "vocabMasterHistory";

export default function Home() {
  const [quizState, setQuizState] = useState<QuizState>("input");
  const [answerState, setAnswerState] = useState<QuizAnswerState>("answering");
  const [definitions, setDefinitions] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [spellingAnswer, setSpellingAnswer] = useState("");
  const [isEnhancementLoading, setIsEnhancementLoading] = useState(false);
  const [enhancementContent, setEnhancementContent] = useState({
    title: "",
    content: "",
  });
  const [isEnhancementOpen, setIsEnhancementOpen] = useState(false);
  const [quizHistory, setQuizHistory] = useState<{ score: number; total: number }[]>([]);
  const [pastQuizzes, setPastQuizzes] = useState<PastQuiz[]>([]);
  const [suggestions, setSuggestions] = useState<PastQuiz[]>([]);
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [evaluationResult, setEvaluationResult] = useState<{ isCorrect: boolean; feedback: string } | null>(null);


  const { toast } = useToast();

  const form = useForm<WordInputForm>({
    resolver: zodResolver(wordInputSchema),
    defaultValues: {
      words: "",
    },
  });

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedHistory) {
        setPastQuizzes(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Could not load quiz history from localStorage", error);
    }
  }, []);

  const startNewQuiz = (defs: QuizItem[]) => {
    setDefinitions(shuffleArray(defs));
    const initialResults = defs.map(d => ({
      word: d.word,
      definition: d.definition,
      definitionCorrect: null,
      spellingCorrect: null,
    }));
    setWordResults(initialResults);
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer("");
    setSpellingAnswer("");
    setAnswerState("answering");
    setQuizState("quiz");
  }

  const handleStartQuiz = async (data: WordInputForm) => {
    setQuizState("loading");
    const words = data.words
      .split(/,?\s+/)
      .map((w) => w.trim())
      .filter(Boolean);

    if (words.length === 0) {
      setQuizState("input");
      toast({
        title: "No words provided",
        description: "Please enter some vocabulary words to start the quiz.",
        variant: "destructive",
      });
      return;
    }

    const wordsKey = JSON.stringify(words.sort());
    const existingQuiz = pastQuizzes.find(p => p && p.words && JSON.stringify(p.words.sort()) === wordsKey);
    setQuizHistory(existingQuiz ? existingQuiz.history : []);
    
    // Save to history
    try {
      const filteredPastQuizzes = pastQuizzes.filter(p => p && p.words);
      let newHistory: PastQuiz[] = [...filteredPastQuizzes];

      if (!existingQuiz) {
        newHistory = [{ words, history: [] }, ...filteredPastQuizzes].slice(0, MAX_HISTORY_ITEMS);
      } else {
        // Move the existing quiz to the top of the list
        newHistory = [existingQuiz, ...filteredPastQuizzes.filter(p => p && p.words && JSON.stringify(p.words.sort()) !== wordsKey)];
      }

      setPastQuizzes(newHistory);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) => {
      console.error("Could not save quiz history to localStorage", error);
    }

    try {
      const defs = await getQuizDefinitionsAction(words);
      startNewQuiz(defs);
    } catch (error) {
      setQuizState("input");
      toast({
        title: "Error",
        description:
          "Could not generate quiz. Please check your words and try again.",
        variant: "destructive",
      });
    }
  };

  const handleAnswerSubmit = async () => {
    if (userAnswer.trim() === "") {
      toast({
        title: "Empty Answer",
        description: "Please provide a definition.",
        variant: "destructive",
      });
      return;
    }
    setAnswerState("evaluating");
    try {
      const currentQuizItem = definitions[currentIndex];
      const result = await evaluateAnswerAction({
        word: currentQuizItem.word,
        userAnswer: userAnswer,
        correctDefinition: currentQuizItem.definition,
      });
      setEvaluationResult(result);
      const newScore = result.isCorrect ? score + 1 : score;
      if (result.isCorrect) {
        setScore(newScore);
      }
      const updatedResults = [...wordResults];
      updatedResults[currentIndex].definitionCorrect = result.isCorrect;
      setWordResults(updatedResults);
    } catch (error) {
      toast({
        title: "Evaluation Error",
        description: "Could not evaluate your answer. Please proceed with self-evaluation.",
        variant: "destructive",
      });
      // Fallback to self-evaluation UI if API fails
      setEvaluationResult({ isCorrect: false, feedback: 'Error evaluating answer.' });
    }
  };

  const handleNextAfterEvaluation = () => {
    setEvaluationResult(null);
    setAnswerState("spelling");
  };

  const handleSpellingSubmit = () => {
    const isCorrect = spellingAnswer.trim().toLowerCase() === definitions[currentIndex].word.toLowerCase();
    let newScore = score;
    if (isCorrect) {
        newScore++;
        setScore(newScore);
    }

    const updatedResults = [...wordResults];
    updatedResults[currentIndex].spellingCorrect = isCorrect;
    setWordResults(updatedResults);

    if (currentIndex < definitions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setUserAnswer("");
        setSpellingAnswer("");
        setAnswerState("answering");
    } else {
      const newResult = { score: newScore, total: definitions.length * 2 };
      const updatedHistory = [...quizHistory, newResult];
      setQuizHistory(updatedHistory);

      try {
        const wordsKey = JSON.stringify(definitions.map(d => d.word).sort());
        const updatedPastQuizzes = pastQuizzes.map(p => 
          p && p.words && JSON.stringify(p.words.sort()) === wordsKey 
            ? { ...p, history: updatedHistory } 
            : p
        ).filter(Boolean);
        setPastQuizzes(updatedPastQuizzes);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPastQuizzes));
      } catch (error) {
        console.error("Could not update quiz history in localStorage", error);
      }
      setQuizState("results");
    }
  }

  const handleNewQuiz = () => {
    form.reset();
    setQuizHistory([]);
    setQuizState("input");
    setSuggestions([]);
  };

  const handleStudyAgain = () => {
    startNewQuiz(definitions);
  };

  const handleEnhancementRequest = async (type: EnhancementType) => {
    const currentDefinition = definitions[currentIndex];
    setIsEnhancementOpen(true);
    setIsEnhancementLoading(true);
    setEnhancementContent({ title: `Enhancing explanation for "${currentDefinition.word}"...`, content: "" });
    try {
      const result = await getEnhancedExplanationAction(
        currentDefinition.word,
        currentDefinition.definition,
        type
      );
      setEnhancementContent({
        title: `Enhanced explanation for "${currentDefinition.word}"`,
        content: result,
      });
    } catch (error) {
      setEnhancementContent({ title: "Error", content: "Could not get enhancement." });
      toast({
        title: "Enhancement Error",
        description: "Failed to get an enhanced explanation.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancementLoading(false);
    }
  };

  const handleWordInputChange = (value: string) => {
    form.setValue("words", value);
    if (value.trim().length > 0) {
      const inputWords = value.toLowerCase().split(/,?\s+/);
      const matchingQuizzes = pastQuizzes.filter(quiz => 
        quiz && quiz.words && inputWords.every(inputWord => 
          quiz.words.some(quizWord => quizWord.toLowerCase().startsWith(inputWord))
        )
      );
      setSuggestions(matchingQuizzes);
    } else {
      setSuggestions(pastQuizzes.filter(p => p && p.words));
    }
  };

  const handleSuggestionClick = (quiz: PastQuiz) => {
    if (!quiz.words) return;
    form.setValue("words", quiz.words.join(", "));
    setSuggestions([]);
  };
  
  useEffect(() => {
    if(quizState === 'input') {
      const filteredPastQuizzes = pastQuizzes.filter(p => p && p.words);
      if (JSON.stringify(suggestions) !== JSON.stringify(filteredPastQuizzes)) {
        setSuggestions(filteredPastQuizzes);
      }
    }
  }, [quizState, pastQuizzes, suggestions]);


  const renderContent = () => {
    switch (quizState) {
      case "input":
        return (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <BookType className="text-primary" />
                  Enter Your Vocabulary
                </CardTitle>
                <CardDescription>
                  Enter your vocabulary words, separated by commas or spaces. Or select a recent quiz.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleStartQuiz)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="words"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Vocabulary Words</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., egregious, ephemeral, esoteric"
                              className="min-h-[150px] resize-y"
                              {...field}
                              onChange={(e) => handleWordInputChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     {suggestions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><History className="h-4 w-4" />Recent Quizzes</h4>
                        <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border p-2">
                          {suggestions.map((quiz, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              className="w-full justify-start h-auto text-left"
                              onClick={() => handleSuggestionClick(quiz)}
                            >
                              <p className="truncate text-sm text-muted-foreground">{quiz.words.join(', ')}</p>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button type="submit" className="w-full" size="lg">
                      Start Quiz <ArrowRight className="ml-2" />
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "loading":
        return (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <Loader className="h-12 w-12 animate-spin text-primary" />
            <p className="font-semibold text-lg">Generating your quiz...</p>
            <p className="text-muted-foreground">This will just take a moment.</p>
          </motion.div>
        );
      case "quiz":
        const currentWord = definitions[currentIndex].word;
        const currentDef = definitions[currentIndex].definition;
        const totalQuestions = definitions.length * 2;
        const currentQuestionNumber = currentIndex * 2 + (answerState === 'answering' || answerState === 'evaluating' ? 1 : 2);
        return (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl"
          >
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center mb-2">
                   {answerState !== "spelling" && (
                    <CardTitle className="font-headline text-3xl capitalize">{currentWord}</CardTitle>
                  )}
                  <p className="text-sm font-medium text-muted-foreground">
                    Question {currentQuestionNumber} of {totalQuestions}
                  </p>
                </div>
                <Progress
                  value={(currentQuestionNumber / totalQuestions) * 100}
                />
              </CardHeader>

              <AnimatePresence mode="wait">
                {answerState === "answering" ? (
                  <motion.div
                    key="answering"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <CardContent>
                      <p className="mb-4 font-medium">What is the definition of "{currentWord}"?</p>
                      <Textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your definition here..."
                        className="min-h-[120px]"
                      />
                    </CardContent>
                    <CardFooter>
                      <Button onClick={handleAnswerSubmit} className="w-full">
                        Submit Answer
                      </Button>
                    </CardFooter>
                  </motion.div>
                ) : answerState === 'evaluating' ? (
                  <motion.div
                    key="evaluating"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <CardContent className="space-y-4">
                      {!evaluationResult ? (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader className="h-5 w-5 animate-spin" />
                          <span>Evaluating your answer...</span>
                        </div>
                      ) : (
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card className="bg-secondary">
                                <CardHeader>
                                    <CardTitle className="text-lg">Your Answer</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-secondary-foreground">{userAnswer}</p>
                                </CardContent>
                                </Card>
                                <Card className="bg-secondary">
                                <CardHeader>
                                    <CardTitle className="text-lg">Correct Answer</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-secondary-foreground">{currentDef}</p>
                                </CardContent>
                                </Card>
                            </div>
                          <Card className={evaluationResult.isCorrect ? 'bg-green-100 dark:bg-green-900/20 border-green-500' : 'bg-red-100 dark:bg-red-900/20 border-red-500'}>
                              <CardHeader className="flex-row items-center gap-4 space-y-0">
                                  {evaluationResult.isCorrect ? <Check className="h-6 w-6 text-green-600"/> : <X className="h-6 w-6 text-red-600"/>}
                                  <CardTitle className="text-xl">{evaluationResult.isCorrect ? "Correct!" : "Incorrect"}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                  <p>{evaluationResult.feedback}</p>
                              </CardContent>
                          </Card>
                          <div className="flex flex-col items-start gap-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Sparkles className="w-3 h-3 text-accent" />Need help?</p>
                            <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" size="sm" onClick={() => handleEnhancementRequest("examples")}><MessageSquareQuote className="mr-2 h-4 w-4"/>Examples</Button>
                                <Button variant="outline" size="sm" onClick={() => handleEnhancementRequest("more detail")}><Lightbulb className="mr-2 h-4 w-4"/>More Detail</Button>
                                <Button variant="outline" size="sm" onClick={() => handleEnhancementRequest("context")}><Globe className="mr-2 h-4 w-4"/>Context</Button>
                            </div>
                        </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button onClick={handleNextAfterEvaluation} className="w-full" disabled={!evaluationResult}>
                        Next <ArrowRight className="ml-2"/>
                      </Button>
                    </CardFooter>
                  </motion.div>
                ) : (
                  <motion.div
                    key="spelling"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <CardContent>
                      <Form {...form}>
                        <form onSubmit={(e) => { e.preventDefault(); handleSpellingSubmit(); }}>
                            <FormLabel className="font-medium">Now, spell the word.</FormLabel>
                            <div className="flex items-center gap-2 mt-4">
                                <SpellCheck className="text-muted-foreground" />
                                <Input
                                    value={spellingAnswer}
                                    onChange={(e) => setSpellingAnswer(e.target.value)}
                                    placeholder="Type the spelling here..."
                                    className="flex-1"
                                    autoFocus
                                />
                            </div>
                        </form>
                      </Form>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={handleSpellingSubmit} className="w-full">
                        Check Spelling
                      </Button>
                    </CardFooter>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        );
      case "results":
        const totalPoints = definitions.length * 2;
        const latestResult = quizHistory[quizHistory.length - 1] || { score: 0, total: totalPoints };
        const incorrect = latestResult.total - latestResult.score;
        const chartData = [
          { name: "Correct", value: latestResult.score, fill: "hsl(var(--chart-1))" },
          { name: "Incorrect", value: incorrect, fill: "hsl(var(--destructive))" },
        ];
        const historyChartData = quizHistory.map((result, index) => ({
            name: `Quiz ${index + 1}`,
            Score: result.score,
        }));
        
        const correctWords = wordResults.filter(r => r.definitionCorrect && r.spellingCorrect);
        const incorrectWords = wordResults.filter(r => !r.definitionCorrect || !r.spellingCorrect);

        return (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl"
          >
            <Card className="w-full text-center">
              <CardHeader>
                <div className="mx-auto bg-accent/20 text-accent p-3 rounded-full w-fit">
                    <Award className="h-10 w-10"/>
                </div>
                <CardTitle className="font-headline text-3xl mt-4">Quiz Complete!</CardTitle>
                <CardDescription>
                  You scored {latestResult.score} out of {latestResult.total}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                </div>
                 <div className="grid md:grid-cols-2 gap-6 mt-8 text-left">
                  <div>
                    <h3 className="font-headline text-xl mb-4 flex items-center gap-2"><ThumbsUp className="text-green-500" />Mastered Words</h3>
                    <Card className="bg-secondary max-h-60 overflow-y-auto">
                        <CardContent className="p-4 space-y-2">
                            {correctWords.length > 0 ? correctWords.map(r => (
                                <div key={r.word} className="p-2 bg-background rounded-md text-sm capitalize">{r.word}</div>
                            )) : <p className="text-muted-foreground text-sm p-2">No words fully mastered yet. Keep trying!</p>}
                        </CardContent>
                    </Card>
                  </div>
                  <div>
                    <h3 className="font-headline text-xl mb-4 flex items-center gap-2"><ThumbsDown className="text-red-500" />Needs Practice</h3>
                     <Card className="bg-secondary max-h-60 overflow-y-auto">
                        <CardContent className="p-4 space-y-2">
                           {incorrectWords.length > 0 ? incorrectWords.map(r => (
                                <div key={r.word} className="p-2 bg-background rounded-md text-sm capitalize">{r.word}</div>
                            )) : <p className="text-muted-foreground text-sm p-2">Great job! You mastered all the words.</p>}
                        </CardContent>
                    </Card>
                  </div>
                </div>

                {quizHistory.length > 1 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-headline mb-4 flex items-center justify-center gap-2"><LineChartIcon className="h-6 w-6 text-primary"/>Progress History</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} domain={[0, totalPoints]}/>
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="Score" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col sm:flex-row gap-4">
                <Button onClick={handleStudyAgain} className="w-full" size="lg" variant="secondary">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Study Same Words
                </Button>
                <Button onClick={handleNewQuiz} className="w-full" size="lg">
                  <PlusSquare className="mr-2 h-4 w-4" />
                  New Quiz
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6">
      <header className="mb-8 flex items-center gap-3 text-4xl font-headline font-bold text-foreground">
        <BookMarked className="h-10 w-10 text-primary" />
        VocabMaster
      </header>
      <main className="flex flex-1 w-full items-center justify-center">
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </main>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} VocabMaster. Time to learn.</p>
      </footer>
      <Dialog open={isEnhancementOpen} onOpenChange={setIsEnhancementOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{enhancementContent.title}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            {isEnhancementLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader className="h-4 w-4 animate-spin"/>
                <span>Loading...</span>
              </div>
            ) : (
              <div>{enhancementContent.content}</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
