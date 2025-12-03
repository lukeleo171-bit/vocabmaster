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
  Repeat,
  Trash2,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  getEnhancedExplanationAction,
  getQuizDefinitionsAction,
  evaluateAnswerAction,
  getMultipleChoiceOptionsAction,
} from "@/lib/actions";
import { wordInputSchema } from "@/lib/schema";
import type {
  EnhancementType,
  QuizAnswerState,
  QuizItem,
  QuizState,
  PastQuiz,
  WordResult,
  QuizType,
  MatchedPair,
} from "@/types/quiz";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

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
  const [quizType, setQuizType] = useState<QuizType>('definition_spelling');
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
  const [practiceWords, setPracticeWords] = useState<QuizItem[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Matching game state
  const [shuffledDefinitions, setShuffledDefinitions] = useState<QuizItem[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedDefinition, setSelectedDefinition] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<MatchedPair[]>([]);
  const [isMatchingCorrect, setIsMatchingCorrect] = useState<boolean[]>([]);
  const [randomWords, setRandomWords] = useState<{ word: string; definition: string }[]>([]);
  const [isLoadingRandomWords, setIsLoadingRandomWords] = useState(false);


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
        setPastQuizzes(JSON.parse(storedHistory).filter(Boolean).filter(q => q.words));
      }
    } catch (error) {
      console.error("Could not load quiz history from localStorage", error);
    }
  }, []);
  
  useEffect(() => {
    if (selectedWord && selectedDefinition) {
      setMatchedPairs([...matchedPairs, { word: selectedWord, definition: selectedDefinition }]);
      setSelectedWord(null);
      setSelectedDefinition(null);
    }
  }, [selectedWord, selectedDefinition, matchedPairs]);


  const startNewQuiz = async (defs: QuizItem[]) => {
    let quizItems = defs;
     if (quizType === 'multiple_choice') {
       setQuizState("loading");
      try {
        const itemsWithOptions = await Promise.all(
          defs.map(async (d) => {
            const options = await getMultipleChoiceOptionsAction(d.word, d.definition);
            const allOptions = shuffleArray([...options, d.definition]);
            return { ...d, options: allOptions };
          })
        );
        quizItems = itemsWithOptions;
      } catch (error) {
         toast({
          title: "Error",
          description: "Could not generate multiple choice options.",
          variant: "destructive",
        });
        setQuizState('input');
        return;
      }
    } else if (quizType === 'matching') {
      setDefinitions(shuffleArray(quizItems));
      setShuffledDefinitions(shuffleArray(quizItems));
      setMatchedPairs([]);
      setIsMatchingCorrect([]);
      setQuizState("matching");
      return;
    }

    setDefinitions(shuffleArray(quizItems));
    const initialResults = defs.map(d => ({
      word: d.word,
      definition: d.definition,
      definitionCorrect: null,
      spellingCorrect: quizType !== 'definition_spelling' ? true : null,
    }));
    setWordResults(initialResults);
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer("");
    setSpellingAnswer("");
    setEvaluationResult(null);
    setAnswerState("answering");
    setQuizState("quiz");
  }

  const parseWordInput = (input: string): (string | QuizItem)[] => {
    const entries: (string | QuizItem)[] = [];
    let current = '';
    let inParentheses = false;
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if (char === '(') inParentheses = true;
        if (char === ')') inParentheses = false;

        if (char === ',' && !inParentheses) {
            if (current.trim()) {
                entries.push(current.trim());
            }
            current = '';
        } else {
            current += char;
        }
    }
    if (current.trim()) {
        entries.push(current.trim());
    }

    return entries.map(entry => {
        if (typeof entry !== 'string') return entry;
        const match = entry.match(/^(.*?)\s*\((.*)\)$/);
        if (match) {
            const word = match[1].trim();
            const definition = match[2].trim();
            if (word && definition) {
                return { word, definition };
            }
        }
        return entry; // Return the original entry if it doesn't match the format
    });
  };

  const handleStartQuiz = async (data: WordInputForm) => {
    setQuizState("loading");
    
    const wordsAndDefs = parseWordInput(data.words);
    
    const wordsForHistoryKey = JSON.stringify(wordsAndDefs.map(item => typeof item === 'string' ? item : ({word: item.word, definition: item.definition})).sort());


    if (wordsAndDefs.length === 0) {
      setQuizState("input");
      toast({
        title: "No words provided",
        description: "Please enter some vocabulary words to start the quiz.",
        variant: "destructive",
      });
      return;
    }
    
    const existingQuiz = pastQuizzes.find(p => p && p.words && JSON.stringify(p.words.sort()) === wordsForHistoryKey);
    setQuizHistory(existingQuiz ? existingQuiz.history : []);
    
    // Save to history
    try {
      const filteredPastQuizzes = pastQuizzes.filter(p => p && p.words);
      let newHistory: PastQuiz[] = [...filteredPastQuizzes];
      
      if (!existingQuiz) {
        newHistory = [{ words: wordsAndDefs, history: [] }, ...filteredPastQuizzes].slice(0, MAX_HISTORY_ITEMS);
      } else {
        // Move the existing quiz to the top of the list
        newHistory = [existingQuiz, ...filteredPastQuizzes.filter(p => p && p.words && JSON.stringify(p.words.sort()) !== wordsForHistoryKey)];
      }

      setPastQuizzes(newHistory);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error("Could not save quiz history to localStorage", error);
    }

    try {
      const defs = await getQuizDefinitionsAction(wordsAndDefs);
      await startNewQuiz(defs);
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
     const currentQuizItem = quizState === 'practice' ? practiceWords[currentIndex] : definitions[currentIndex];
     if (quizType === 'multiple_choice') {
      if (!selectedOption) {
        toast({ title: "No Selection", description: "Please select an option.", variant: "destructive" });
        return;
      }
      const isCorrect = selectedOption === currentQuizItem.definition;
      
      const currentWordResult = wordResults.find(wr => wr.word === currentQuizItem.word);
      if (currentWordResult) {
        currentWordResult.definitionCorrect = isCorrect;
        setWordResults([...wordResults]);
      }
      setAnswerState('evaluating');
      setEvaluationResult({ isCorrect, feedback: isCorrect ? "That's right!" : `The correct answer is: "${currentQuizItem.definition}"` });
      return;
    }

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
      const result = await evaluateAnswerAction({
        word: currentQuizItem.word,
        userAnswer: userAnswer,
        correctDefinition: currentQuizItem.definition,
      });
      setEvaluationResult(result);
      
      const currentWordResult = wordResults.find(wr => wr.word === currentQuizItem.word);

      if (currentWordResult) {
        currentWordResult.definitionCorrect = result.isCorrect;
        setWordResults([...wordResults]);
      }

    } catch (error) {
      toast({
        title: "Evaluation Error",
        description: "AI evaluation failed. Please mark your answer manually.",
        variant: "destructive",
      });
      // Fallback to self-evaluation UI if API fails - set to null to trigger manual evaluation
      setEvaluationResult(null);
      setAnswerState('manual-evaluation');
    }
  };

  const handleManualEvaluation = (isCorrect: boolean) => {
    const currentQuizItem = quizState === 'practice' ? practiceWords[currentIndex] : definitions[currentIndex];
    const currentWordResult = wordResults.find(wr => wr.word === currentQuizItem.word);
    
    if (currentWordResult) {
      currentWordResult.definitionCorrect = isCorrect;
      setWordResults([...wordResults]);
    }
    
    setEvaluationResult({
      isCorrect,
      feedback: isCorrect ? "Great! You marked it correct." : "You marked it incorrect. Keep practicing!"
    });
    setAnswerState('evaluating');
  };

  const handleNextAfterEvaluation = () => {
    setEvaluationResult(null);
    setSelectedOption(null);
    if (quizType === 'definition_only' || quizType === 'multiple_choice' || quizType === 'matching') {
        handleNextQuestion();
    } else {
        setAnswerState("spelling");
    }
  };
  
  const handleNextQuestion = () => {
    if (quizState === 'practice') {
        const currentQuizItem = practiceWords[currentIndex];
        const currentWordResult = wordResults.find(wr => wr.word === currentQuizItem.word);
        if (currentWordResult?.definitionCorrect && currentWordResult?.spellingCorrect) {
            const remainingWords = practiceWords.filter(d => d.word !== currentQuizItem.word);
            if(remainingWords.length === 0) {
                setQuizState('results');
            } else {
                setPracticeWords(shuffleArray(remainingWords));
                setCurrentIndex(0);
                setUserAnswer("");
                setSpellingAnswer("");
                setAnswerState("answering");
            }
        } else {
            if (currentIndex < practiceWords.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                setCurrentIndex(0);
            }
            setUserAnswer("");
            setSpellingAnswer("");
            setAnswerState("answering");
        }
        return;
    }

    if (currentIndex < definitions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setUserAnswer("");
        setSpellingAnswer("");
        setAnswerState("answering");
    } else {
      const totalPossibleScore = quizType === 'definition_spelling' ? definitions.length * 2 : definitions.length;
      const finalScore = wordResults.reduce((acc, r) => {
        if (r.definitionCorrect) acc++;
        if (quizType === 'definition_spelling' && r.spellingCorrect) acc++;
        return acc;
      }, 0);
      setScore(finalScore);

      const newResult = { score: finalScore, total: totalPossibleScore };
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

  const handleSpellingSubmit = () => {
    const currentQuizItem = quizState === 'practice' ? practiceWords[currentIndex] : definitions[currentIndex];
    const isCorrect = spellingAnswer.trim().toLowerCase() === currentQuizItem.word.toLowerCase();
    
    const currentWordResult = wordResults.find(wr => wr.word === currentQuizItem.word);
     if (currentWordResult) {
        currentWordResult.spellingCorrect = isCorrect;
        setWordResults([...wordResults]);
     }
    
    handleNextQuestion();
  }
  
  const handleCheckMatches = () => {
    const results = matchedPairs.map(pair => {
      const correctDef = definitions.find(d => d.word === pair.word)?.definition;
      return correctDef === pair.definition;
    });
    setIsMatchingCorrect(results);
    const correctCount = results.filter(Boolean).length;
    setScore(correctCount);
    const totalPossibleScore = definitions.length;
    const newResult = { score: correctCount, total: totalPossibleScore };
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
  };

  const handleNewQuiz = () => {
    form.reset();
    setQuizHistory([]);
    setQuizState("input");
    setSuggestions([]);
    setQuizType('definition_spelling'); // Reset to default quiz type
  };

  const handleStudyAgain = () => {
    startNewQuiz(definitions.map(d => ({ word: d.word, definition: d.definition, options: d.options })));
  };

  const handlePracticeMissedWords = () => {
    const missed = wordResults
      .filter(r => !r.definitionCorrect || !r.spellingCorrect)
      .map(r => ({ word: r.word, definition: r.definition, options: definitions.find(d => d.word === r.word)?.options }));
    
    if (missed.length > 0) {
      setPracticeWords(shuffleArray(missed));
      setCurrentIndex(0);
      setUserAnswer("");
      setSpellingAnswer("");
      setEvaluationResult(null);
      setAnswerState("answering");
      setQuizState("practice");
    }
  };
  
  const handleRemoveMatch = (indexToRemove: number) => {
    setMatchedPairs(matchedPairs.filter((_, index) => index !== indexToRemove));
  };

  const handleEnhancementRequest = async (type: EnhancementType) => {
    const currentDefinition = quizState === 'practice' ? practiceWords[currentIndex] : definitions[currentIndex];
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
          (quiz.words as (string|QuizItem)[]).some(quizWordOrItem => {
            const quizWord = typeof quizWordOrItem === 'string' ? quizWordOrItem : quizWordOrItem.word;
            return quizWord.toLowerCase().startsWith(inputWord)
          })
        )
      );
      setSuggestions(matchingQuizzes);
    } else {
      setSuggestions(pastQuizzes.filter(p => p && p.words));
    }
  };

  const handleSuggestionClick = (quiz: PastQuiz) => {
    if (!quiz.words) return;
    const wordsString = (quiz.words as (string | QuizItem)[]).map(item => {
      if (typeof item === 'string') {
        return item;
      }
      return `${item.word} (${item.definition})`;
    }).join(", ");
    form.setValue("words", wordsString);
    setSuggestions([]);
  };

  const handleRandomWordClick = (word: string, definition: string) => {
    const currentWords = form.getValues("words");
    const newWordEntry = `${word} (${definition})`;
    if (currentWords.trim() === "") {
      form.setValue("words", newWordEntry);
    } else {
      form.setValue("words", `${currentWords}, ${newWordEntry}`);
    }
  };

  const handleClearHistory = () => {
    setPastQuizzes([]);
    setSuggestions([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      toast({
        title: "History Cleared",
        description: "Your recent quiz history has been cleared.",
      });
    } catch (error) {
      console.error("Could not clear quiz history from localStorage", error);
      toast({
        title: "Error",
        description: "Could not clear quiz history.",
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    if(quizState === 'input') {
      const filteredPastQuizzes = pastQuizzes.filter(p => p && p.words);
      if (JSON.stringify(suggestions) !== JSON.stringify(filteredPastQuizzes)) {
        setSuggestions(filteredPastQuizzes);
      }
    }
  }, [quizState, pastQuizzes, suggestions]);

  // Fetch random words when entering input state
  const fetchRandomWords = async () => {
    setIsLoadingRandomWords(true);
    try {
      // Fetch all words from the database for true randomization
      const { data, error } = await supabase
        .from('words')
        .select('word, definition');
      
      if (error) {
        console.error('Error fetching random words:', error);
        return;
      }
      
      if (data && data.length > 0) {
        // Shuffle all words and take 5 random ones
        // Using Fisher-Yates shuffle for better randomization
        const shuffled = [...data];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setRandomWords(shuffled.slice(0, 5));
      } else {
        setRandomWords([]);
      }
    } catch (err) {
      console.error('Failed to fetch random words:', err);
    } finally {
      setIsLoadingRandomWords(false);
    }
  };

  useEffect(() => {
    if (quizState === 'input') {
      fetchRandomWords();
    }
  }, [quizState]);


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
                  Enter words separated by commas. You can also provide your own definitions like this: word (your definition).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleStartQuiz)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="words"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="sr-only">Vocabulary Words</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., egregious (outstandingly bad), ephemeral, esoteric"
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
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><History className="h-4 w-4" />Recent Quizzes</h4>
                          <Button variant="ghost" size="sm" onClick={handleClearHistory} className="h-auto px-2 py-1 text-xs">
                            <Trash2 className="mr-1 h-3 w-3" />
                            Clear
                          </Button>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border p-2">
                          {suggestions.map((quiz, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              className="w-full justify-start h-auto text-left"
                              onClick={() => handleSuggestionClick(quiz)}
                            >
                              <p className="truncate text-sm text-muted-foreground">
                                {quiz.words ? (quiz.words as (string|QuizItem)[]).map(w => typeof w === 'string' ? w : w.word).join(', ') : ''}
                              </p>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                     <div>
                      <FormLabel className="mb-4 block font-medium">Quiz Type</FormLabel>
                      <RadioGroup
                        value={quizType}
                        onValueChange={(value: string) => setQuizType(value as QuizType)}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem value="definition_spelling" id="definition_spelling" className="peer sr-only" />
                          <Label
                            htmlFor="definition_spelling"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            Definition & Spelling
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="definition_only" id="definition_only" className="peer sr-only" />
                          <Label
                            htmlFor="definition_only"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            Definition Only
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="multiple_choice" id="multiple_choice" className="peer sr-only" />
                          <Label
                            htmlFor="multiple_choice"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            Multiple Choice
                            <span className="text-xs font-normal mt-1 text-muted-foreground">(May take a moment to generate)</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="matching" id="matching" className="peer sr-only" />
                          <Label
                            htmlFor="matching"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            Matching
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

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
      case "matching":
          const unmatchedWords = definitions.filter(d => !matchedPairs.some(p => p.word === d.word));
          const unmatchedDefinitions = shuffledDefinitions.filter(d => !matchedPairs.some(p => p.definition === d.definition));
          
          return (
            <motion.div
              key="matching"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-3xl">Matching Game</CardTitle>
                  <CardDescription>Match each word to its correct definition.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Words Column */}
                        <div className="space-y-2">
                          <h3 className="font-semibold text-center">Words</h3>
                          {unmatchedWords.map(item => (
                            <Button 
                              key={item.word}
                              variant={selectedWord === item.word ? "default" : "outline"}
                              className="w-full justify-start"
                              onClick={() => setSelectedWord(item.word)}
                              disabled={matchedPairs.some(p => p.word === item.word)}
                            >
                              {item.word}
                            </Button>
                          ))}
                        </div>
                        {/* Definitions Column */}
                        <div className="space-y-2">
                           <h3 className="font-semibold text-center">Definitions</h3>
                          {unmatchedDefinitions.map(item => (
                            <Button 
                              key={item.definition}
                              variant={selectedDefinition === item.definition ? "default" : "outline"}
                              className="w-full justify-start text-left h-auto whitespace-normal"
                              onClick={() => setSelectedDefinition(item.definition)}
                              disabled={matchedPairs.some(p => p.definition === item.definition)}
                            >
                              {item.definition}
                            </Button>
                          ))}
                        </div>
                    </div>
                    {matchedPairs.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-semibold mb-2">Your Matches</h3>
                        <div className="space-y-2">
                          {matchedPairs.map((pair, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                              <span className="font-medium capitalize">{pair.word}</span>
                              <ArrowRight className="h-4 w-4" />
                              <span className="text-right flex-1">{pair.definition}</span>
                              <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 shrink-0" onClick={() => handleRemoveMatch(index)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove match</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleCheckMatches} 
                    className="w-full"
                    disabled={unmatchedWords.length > 0}
                  >
                    Check Answers
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )
      case "practice":
      case "quiz":
        const isPractice = quizState === 'practice';
        const currentQuizItems = isPractice ? practiceWords : definitions;
        const currentQuizItem = currentQuizItems[currentIndex];
        
        if (!currentQuizItem) {
            return (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Quiz Complete!</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>You've mastered all the words in this practice session!</p>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleNewQuiz} className="w-full">
                                <PlusSquare className="mr-2 h-4 w-4" />
                                New Quiz
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            );
        }

        const { word: currentWord, definition: currentDef, options: currentOptions } = currentQuizItem;
        const totalQuestions = definitions.length;
        const currentQuestionNumber = currentIndex + 1;

        return (
          <motion.div
            key={isPractice ? "practice" : "quiz"}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl"
          >
            <Card>
              <CardHeader>
                 {isPractice && (
                  <div className="flex items-center gap-2 text-primary font-semibold mb-2">
                    <Repeat className="h-5 w-5" />
                    <p>Practice Mode</p>
                  </div>
                )}
                <div className="flex justify-between items-center mb-2">
                   {(answerState !== "spelling" || quizType === 'multiple_choice' ) && (
                    <CardTitle className="font-headline text-3xl capitalize">{currentWord}</CardTitle>
                  )}
                  <p className="text-sm font-medium text-muted-foreground">
                    {isPractice ? `Words remaining: ${currentQuizItems.length}` : `Question ${currentQuestionNumber} of ${totalQuestions}`}
                  </p>
                </div>
                {!isPractice && <Progress
                  value={(currentQuestionNumber / totalQuestions) * 100}
                />}
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
                       {quizType === 'multiple_choice' ? (
                        <div className="space-y-4">
                          <p className="mb-4 font-medium">Choose the correct definition for "{currentWord}":</p>
                          <RadioGroup value={selectedOption ?? ''} onValueChange={setSelectedOption} className="space-y-2">
                            {currentOptions?.map((option, index) => (
                              <div key={index}>
                                <RadioGroupItem value={option} id={`option-${index}`} className="peer sr-only" />
                                <Label htmlFor={`option-${index}`} className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      ) : (
                        <>
                          <p className="mb-4 font-medium">What is the definition of "{currentWord}"?</p>
                          <Textarea
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Type your definition here..."
                            className="min-h-[120px]"
                          />
                        </>
                      )}
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
                            {quizType !== 'multiple_choice' && (
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
                            )}
                          <Card className={evaluationResult.isCorrect ? 'bg-green-950/40 border-green-600' : 'bg-red-950/40 border-red-600'}>
                              <CardHeader className="flex-row items-center gap-4 space-y-0">
                                  {evaluationResult.isCorrect ? <Check className="h-6 w-6 text-green-400"/> : <X className="h-6 w-6 text-red-400"/>}
                                  <CardTitle className={cn("text-xl", evaluationResult.isCorrect ? "text-green-300" : "text-red-300")}>{evaluationResult.isCorrect ? "Correct!" : "Incorrect"}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                  <p className={evaluationResult.isCorrect ? "text-green-200" : "text-red-200"}>{evaluationResult.feedback}</p>
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
                ) : answerState === 'manual-evaluation' ? (
                  <motion.div
                    key="manual-evaluation"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <CardContent className="space-y-4">
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
                      <Card className="bg-yellow-950/40 border-yellow-600">
                        <CardHeader>
                          <CardTitle className="text-xl text-yellow-300">Manual Evaluation Required</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-4 text-yellow-200">The AI evaluation failed. Please compare your answer with the correct definition and mark whether you got it right or wrong.</p>
                          <div className="flex gap-4 justify-center">
                            <Button
                              onClick={() => handleManualEvaluation(true)}
                              variant="default"
                              size="lg"
                              className="bg-green-700 hover:bg-green-600 text-white flex-1"
                            >
                              <Check className="mr-2 h-5 w-5" />
                              I Got It Right
                            </Button>
                            <Button
                              onClick={() => handleManualEvaluation(false)}
                              variant="destructive"
                              size="lg"
                              className="bg-red-700 hover:bg-red-600 text-white flex-1"
                            >
                              <X className="mr-2 h-5 w-5" />
                              I Got It Wrong
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </motion.div>
                ) : ( // spelling state
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
        const isSpellingQuiz = quizType === 'definition_spelling';
        const isMatchingQuiz = quizType === 'matching';
        const totalPoints = isMatchingQuiz 
          ? definitions.length
          : (isSpellingQuiz ? definitions.length * 2 : definitions.length);
        
        let finalScore = score;
        if(quizType !== 'matching') {
            finalScore = wordResults.reduce((acc, r) => {
                if (r.definitionCorrect) acc++;
                if (isSpellingQuiz && r.spellingCorrect) acc++;
                return acc;
            }, 0);
        }

        const finalTotalPoints = isMatchingQuiz ? definitions.length * 2 : totalPoints;
        const finalDisplayScore = isMatchingQuiz ? finalScore * 2 : finalScore;

        const incorrect = finalTotalPoints - finalDisplayScore;
        const chartData = [
          { name: "Correct", value: finalDisplayScore, fill: "hsl(var(--chart-1))" },
          { name: "Incorrect", value: incorrect, fill: "hsl(var(--destructive))" },
        ];
        const historyChartData = quizHistory.map((result, index) => ({
            name: `Quiz ${index + 1}`,
            Score: result.total === definitions.length && isMatchingQuiz ? result.score * 2 : result.score,
        }));
        
        const correctWords = quizType === 'matching' 
          ? matchedPairs.filter((p, i) => isMatchingCorrect[i]).map(p => ({ word: p.word, definition: p.definition }))
          : wordResults.filter(r => r.definitionCorrect && (isSpellingQuiz ? r.spellingCorrect : true));
        
        const incorrectWords = quizType === 'matching'
          ? matchedPairs.filter((p, i) => !isMatchingCorrect[i]).map(p => ({ word: p.word, definition: p.definition }))
          : wordResults.filter(r => !r.definitionCorrect || (isSpellingQuiz && !r.spellingCorrect));
          

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
                  You scored {finalDisplayScore} out of {finalTotalPoints}.
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
                          <YAxis allowDecimals={false} domain={[0, finalTotalPoints]}/>
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
                {incorrectWords.length > 0 && quizType !== 'matching' && (
                   <Button onClick={handlePracticeMissedWords} className="w-full" size="lg">
                      <Repeat className="mr-2 h-4 w-4" />
                      Practice Missed Words
                    </Button>
                )}
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
      <header className="mb-8 flex flex-col items-center gap-3">
        {/* Bar Chart Icon */}
        <div className="flex items-end gap-1.5 h-12">
          <div className="w-3 bg-primary/80 rounded-t h-[40%]"></div>
          <div className="w-3 bg-primary/80 rounded-t h-[70%]"></div>
          <div className="w-3 bg-primary/80 rounded-t h-full"></div>
        </div>
        {/* Logo Text */}
        <div className="text-4xl font-headline font-bold">
          <span className="text-foreground">vocab</span>
          <span className="text-primary/90">study</span>
        </div>
      </header>
      <main className={cn(
        "flex flex-1 w-full",
        quizState === 'input' ? "flex-row gap-6 max-w-7xl" : "items-center justify-center"
      )}>
        {quizState === 'input' && (
          <aside className="hidden lg:block w-80 shrink-0">
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Random Words
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchRandomWords}
                    disabled={isLoadingRandomWords}
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoadingRandomWords && "animate-spin")} />
                  </Button>
                </div>
                <CardDescription>
                  Click words to test your vocabulary knowledge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {isLoadingRandomWords ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : randomWords.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No words available. Start adding words to your database!
                  </p>
                ) : (
                  randomWords.map((item, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-auto p-3 text-left hover:bg-secondary whitespace-normal"
                      onClick={() => handleRandomWordClick(item.word, item.definition)}
                    >
                      <div className="flex flex-col gap-1 w-full min-w-0">
                        <span className="font-semibold capitalize break-words">{item.word}</span>
                        <span className="text-xs text-muted-foreground break-words">{item.definition}</span>
                      </div>
                    </Button>
                  ))
                )}
              </CardContent>
            </Card>
          </aside>
        )}
        <div className={cn(
          "flex-1",
          quizState === 'input' ? "" : "flex items-center justify-center"
        )}>
          <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
        </div>
      </main>
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
