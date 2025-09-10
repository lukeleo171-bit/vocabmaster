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
import { useToast } from "@/hooks/use-toast";
import {
  getEnhancedExplanationAction,
  getQuizDefinitionsAction,
} from "@/lib/actions";
import { wordInputSchema } from "@/lib/schema";
import type {
  EnhancementType,
  QuizAnswerState,
  QuizItem,
  QuizState,
  PastQuiz,
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
  const [isEnhancementLoading, setIsEnhancementLoading] = useState(false);
  const [enhancementContent, setEnhancementContent] = useState({
    title: "",
    content: "",
  });
  const [isEnhancementOpen, setIsEnhancementOpen] = useState(false);
  const [quizHistory, setQuizHistory] = useState<{ score: number; total: number }[]>([]);
  const [pastQuizzes, setPastQuizzes] = useState<PastQuiz[]>([]);
  const [suggestions, setSuggestions] = useState<PastQuiz[]>([]);

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
    const existingQuiz = pastQuizzes.find(p => JSON.stringify(p.words.sort()) === wordsKey);
    setQuizHistory(existingQuiz ? existingQuiz.history : []);
    
    // Save to history
    try {
      let newHistory: PastQuiz[] = [...pastQuizzes];
      if (!existingQuiz) {
        newHistory = [{ words, history: [] }, ...pastQuizzes].slice(0, MAX_HISTORY_ITEMS);
      } else {
        // Move the existing quiz to the top of the list
        newHistory = [existingQuiz, ...pastQuizzes.filter(p => JSON.stringify(p.words.sort()) !== wordsKey)];
      }

      setPastQuizzes(newHistory);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error("Could not save quiz history to localStorage", error);
    }


    try {
      const defs = await getQuizDefinitionsAction(words);
      setDefinitions(shuffleArray(defs));
      setCurrentIndex(0);
      setScore(0);
      setUserAnswer("");
      setAnswerState("answering");
      setQuizState("quiz");
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

  const handleAnswerSubmit = () => {
    if (userAnswer.trim() === "") {
      toast({
        title: "Empty Answer",
        description: "Please provide a definition.",
        variant: "destructive",
      });
      return;
    }
    setAnswerState("evaluating");
  };

  const handleSelfEvaluation = (correct: boolean) => {
    const newScore = correct ? score + 1 : score;
    if (correct) {
      setScore(newScore);
    }
    if (currentIndex < definitions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setAnswerState("answering");
    } else {
      const newResult = { score: newScore, total: definitions.length };
      const updatedHistory = [...quizHistory, newResult];
      setQuizHistory(updatedHistory);

      try {
        const wordsKey = JSON.stringify(definitions.map(d => d.word).sort());
        const updatedPastQuizzes = pastQuizzes.map(p => 
          JSON.stringify(p.words.sort()) === wordsKey 
            ? { ...p, history: updatedHistory } 
            : p
        );
        setPastQuizzes(updatedPastQuizzes);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPastQuizzes));
      } catch (error) {
        console.error("Could not update quiz history in localStorage", error);
      }
      setQuizState("results");
    }
  };

  const handleNewQuiz = () => {
    form.reset();
    setQuizHistory([]);
    setQuizState("input");
    setSuggestions([]);
  };

  const handleStudyAgain = () => {
    setDefinitions(shuffleArray(definitions));
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer("");
    setAnswerState("answering");
    setQuizState("quiz");
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
        inputWords.every(inputWord => 
          quiz.words.some(quizWord => quizWord.toLowerCase().startsWith(inputWord))
        )
      );
      setSuggestions(matchingQuizzes);
    } else {
      setSuggestions(pastQuizzes);
    }
  };

  const handleSuggestionClick = (quiz: PastQuiz) => {
    form.setValue("words", quiz.words.join(", "));
    setSuggestions([]);
  };
  
  useEffect(() => {
    if(quizState === 'input') {
      setSuggestions(pastQuizzes);
    }
  }, [quizState, pastQuizzes]);


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
                  <CardTitle className="font-headline text-3xl capitalize">{currentWord}</CardTitle>
                  <p className="text-sm font-medium text-muted-foreground">
                    Word {currentIndex + 1} of {definitions.length}
                  </p>
                </div>
                <Progress
                  value={((currentIndex + 1) / definitions.length) * 100}
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
                ) : (
                  <motion.div
                    key="evaluating"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <CardContent className="grid md:grid-cols-2 gap-6">
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
                        <CardFooter className="flex-col items-start gap-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Sparkles className="w-3 h-3 text-accent" />Need help?</p>
                            <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" size="sm" onClick={() => handleEnhancementRequest("examples")}><MessageSquareQuote className="mr-2 h-4 w-4"/>Examples</Button>
                                <Button variant="outline" size="sm" onClick={() => handleEnhancementRequest("more detail")}><Lightbulb className="mr-2 h-4 w-4"/>More Detail</Button>
                                <Button variant="outline" size="sm" onClick={() => handleEnhancementRequest("context")}><Globe className="mr-2 h-4 w-4"/>Context</Button>
                            </div>
                        </CardFooter>
                      </Card>
                    </CardContent>
                    <CardFooter className="flex-col sm:flex-row gap-4">
                      <Button
                        onClick={() => handleSelfEvaluation(true)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="mr-2" /> I was right
                      </Button>
                      <Button
                        onClick={() => handleSelfEvaluation(false)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        <X className="mr-2" /> I was wrong
                      </Button>
                    </CardFooter>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        );
      case "results":
        const latestResult = quizHistory[quizHistory.length - 1] || { score: 0, total: definitions.length };
        const incorrect = latestResult.total - latestResult.score;
        const chartData = [
          { name: "Correct", value: latestResult.score, fill: "hsl(var(--chart-1))" },
          { name: "Incorrect", value: incorrect, fill: "hsl(var(--destructive))" },
        ];
        const historyChartData = quizHistory.map((result, index) => ({
            name: `Quiz ${index + 1}`,
            Score: result.score,
        }));

        return (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="w-full max-w-2xl text-center">
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
                {quizHistory.length > 1 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-headline mb-4 flex items-center justify-center gap-2"><LineChartIcon className="h-6 w-6 text-primary"/>Progress History</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} domain={[0, definitions.length]}/>
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
              <div className="text-sm text-muted-foreground">{enhancementContent.content}</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
