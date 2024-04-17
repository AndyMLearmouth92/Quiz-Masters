import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  Dispatch,
} from "react";

interface State {
  questions: Question[];
  questionCount: null | number;
  status: string;
  index: number;
  points: number;
  secondsRemaining: null | number;
  userAnswers: Answer[];
}
const SECS_PER_QUESTION = 30;

const initialState: State = {
  questions: [],
  questionCount: null,
  status: "SelectNumOfQuestions",
  index: 0,
  points: 0,
  secondsRemaining: null,
  userAnswers: [],
};

type Action =
  | { type: "setNumOfQuestions"; payload: number }
  | { type: "dataReceived"; payload: Question[] }
  | { type: "dataFailed" }
  | { type: "newAnswer"; payload: Answer }
  | { type: "finish" }
  | { type: "tick" }
  | { type: "reviewAnswers" }
  | { type: "restart" }
  | { type: "previousAnswer" }
  | { type: "nextAnswer" }
  | { type: "finished"; payload: string }
  | { type: "selectAnswer"; payload: number };

type QuizDispatch = Dispatch<Action>;

const QuizContext = createContext<{
  questions: Question[];
  status: string;
  index: number;
  points: number;
  numQuestions: number;
  currentQuestion: Question | null;
  dispatch: QuizDispatch;
  secondsRemaining: null | number;
  userAnswers: Answer[];
}>({
  ...initialState,
  numQuestions: 0,
  currentQuestion: null,
  dispatch: () => {},
});

interface Answer {
  answerText: string;
  isCorrect: boolean;
}

interface Question {
  answerOptions: Answer[];
  id: number;
  questionText: string;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setNumOfQuestions":
      return {
        ...state,
        questionCount: action.payload,
      };
    case "dataReceived":
      return {
        ...state,
        questions: action.payload,
        status: "ready",
        secondsRemaining: state.questionCount * SECS_PER_QUESTION,
      };
    case "dataFailed":
      return {
        ...state,
        status: "error",
      };
    case "newAnswer":
      return {
        ...state,
        points: action.payload.isCorrect ? state.points + 1 : state.points,
        index:
          state.questions.length === state.index + 1
            ? state.index
            : state.index + 1,
        userAnswers: [...state.userAnswers, action.payload],
        status:
          state.questions.length === state.index + 1
            ? "finished"
            : state.status,
      };
    // case "finalAnswer":
    //   // eslint-disable-next-line no-case-declarations
    //   const points = action.payload.answerOption.isCorrect
    //     ? state.points + 1
    //     : state.points;
    //   // eslint-disable-next-line no-case-declarations
    //   const newHighScore =
    //     points > Number(state.highScore) ? String(points) : state.highScore;
    //   localStorage.setItem("highScore", newHighScore);
    //   return {
    //     ...state,
    //     points,
    //     index:
    //       state.questions.length === state.index + 1
    //         ? state.index
    //         : state.index + 1,
    //     userAnswers: [...state.userAnswers, action.payload.answerOption],
    //     status:
    //       state.questions.length === state.index + 1
    //         ? "finished"
    //         : state.status,
    //     highScore: newHighScore,
    //   };
    case "tick":
      return {
        ...state,
        secondsRemaining: state.secondsRemaining - 1,
        status: state.secondsRemaining === 0 ? "finished" : state.status,
      };
    case "reviewAnswers":
      return {
        ...state,
        status: "reviewAnswers",
        index: 0,
      };
    case "previousAnswer":
      return {
        ...state,
        index: state.index === 0 ? state.index : state.index - 1,
      };
    case "nextAnswer":
      return {
        ...state,
        index:
          state.index === state.questionCount - 1
            ? state.index
            : state.index + 1,
      };
    case "selectAnswer":
      return {
        ...state,
        index: action.payload,
        status: "reviewAnswers",
      };
    case "finished":
      // eslint-disable-next-line no-case-declarations
      return {
        ...state,
        status: "finished",
      };
    case "restart":
      return initialState;
    default:
      throw new Error("Action unknown");
  }
}

function QuizProvider({ children }) {
  const [
    {
      questions,
      questionCount,
      status,
      index,
      points,
      secondsRemaining,
      userAnswers,
    },
    dispatch,
  ] = useReducer(reducer, initialState);
  const numQuestions = questions.length;
  const currentQuestion = questions[index];

  useEffect(
    function () {
      if (questionCount === null) {
        return;
      }
      fetch(`https://quiz-master-data.cyclic.cloud/questions/${questionCount}`)
        .then((res) => res.json())
        .then((data) => dispatch({ type: "dataReceived", payload: data }))
        .catch((err) => dispatch({ type: "dataFailed" }));
    },
    [questionCount]
  );

  return (
    <QuizContext.Provider
      value={{
        questions,
        status,
        index,
        numQuestions,
        currentQuestion,
        dispatch,
        points,
        secondsRemaining,
        userAnswers,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined)
    throw new Error("QuizContext was used outside of the QuizProvider");
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export { QuizProvider, useQuiz };
