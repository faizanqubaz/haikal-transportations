"use client";

import {
  Bot,
  ChevronDown,
  Loader2,
  MessageCircle,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  User,
  RotateCcw,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";


// ============================================================
// TYPES
// ============================================================

interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };

    length: number;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;

  interimResults: boolean;

  lang: string;

  start: () => void;

  stop: () => void;

  abort: () => void;

  onstart:
    (() => void) | null;

  onend:
    (() => void) | null;

  onresult:
    | ((
        event: SpeechRecognitionEventLike
      ) => void)
    | null;

  onerror:
    | ((
        event: SpeechRecognitionErrorEventLike
      ) => void)
    | null;
}

interface SpeechRecognitionConstructor {
  new ():
    SpeechRecognitionInstance;
}


// ============================================================
// STORAGE KEY
// ============================================================

const THREAD_STORAGE_KEY =
  "haikal-tours-booking-thread-id";


// ============================================================
// COMPONENT
// ============================================================

export default function BookingAssistant() {
  const [message, setMessage] =
    useState("");

  const [lastUserMessage, setLastUserMessage] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [open, setOpen] =
    useState(false);

  const [listening, setListening] =
    useState(false);

  const [speaking, setSpeaking] =
    useState(false);

  const [speechSupported, setSpeechSupported] =
    useState(false);

  const [threadId, setThreadId] =
    useState("");

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(
      null
    );

  // ==========================================================
  // CREATE / RESTORE THREAD
  // ==========================================================

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const existingThread =
      localStorage.getItem(
        THREAD_STORAGE_KEY
      );

    if (existingThread) {
      setThreadId(
        existingThread
      );

      return;
    }

    const newThreadId =
      crypto.randomUUID();

    localStorage.setItem(
      THREAD_STORAGE_KEY,
      newThreadId
    );

    setThreadId(
      newThreadId
    );
  }, []);

  // ==========================================================
  // SPEECH RECOGNITION
  // ==========================================================

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const SpeechRecognition =
      (
        window as Window & {
          SpeechRecognition?: SpeechRecognitionConstructor;

          webkitSpeechRecognition?: SpeechRecognitionConstructor;
        }
      ).SpeechRecognition ||
      (
        window as Window & {
          webkitSpeechRecognition?: SpeechRecognitionConstructor;
        }
      )
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(
        false
      );

      return;
    }

    setSpeechSupported(
      true
    );

    const recognition =
      new SpeechRecognition();

    recognition.continuous =
      false;

    recognition.interimResults =
      true;

    // English (US)
    recognition.lang =
      "en-US";

    recognition.onstart =
      () => {
        setListening(true);
      };

    recognition.onend =
      () => {
        setListening(false);
      };

    recognition.onresult =
      (event) => {
        let transcript =
          "";

        for (
          let i = 0;
          i <
          event.results.length;
          i++
        ) {
          transcript +=
            event.results[i][0]
              .transcript;
        }

        setMessage(
          transcript
        );
      };

    recognition.onerror =
      (event) => {
        console.error(
          "Speech recognition error:",
          event.error
        );

        setListening(false);

        if (
          event.error ===
          "not-allowed"
        ) {
          setAnswer(
            "Microphone access was denied. Please allow microphone access in your browser."
          );
        } else if (
          event.error ===
          "no-speech"
        ) {
          setAnswer(
            "I didn't hear anything. Please try speaking again."
          );
        } else {
          setAnswer(
            "There was a problem understanding the audio. Please try again."
          );
        }
      };

    recognitionRef.current =
      recognition;

    return () => {
      recognitionRef.current?.abort();

      window.speechSynthesis?.cancel();
    };
  }, []);

  // ==========================================================
  // START LISTENING
  // ==========================================================

  function startListening() {
    if (!speechSupported) {
      setAnswer(
        "Voice input isn't available in your browser. Please use Chrome or Edge."
      );

      return;
    }

    if (loading) {
      return;
    }

    stopSpeaking();

    try {
      setMessage("");

      setAnswer("");

      recognitionRef.current?.start();
    } catch (error) {
      console.error(
        "Could not start speech recognition:",
        error
      );
    }
  }

  // ==========================================================
  // STOP LISTENING
  // ==========================================================

  function stopListening() {
    try {
      recognitionRef.current?.stop();
    } catch (error) {
      console.error(
        error
      );
    }

    setListening(
      false
    );
  }

  // ==========================================================
  // GET AN ENGLISH VOICE
  // ==========================================================

  function getEnglishVoice(): Promise<SpeechSynthesisVoice | null> {
    return new Promise((resolve) => {
      if (
        typeof window === "undefined" ||
        !("speechSynthesis" in window)
      ) {
        resolve(null);
        return;
      }

      const pickVoice = () => {
        const voices =
          window.speechSynthesis.getVoices();

        if (!voices.length) {
          return null;
        }

        // Prefer an exact en-US voice, then any English voice,
        // then fall back to whatever is first available.
        return (
          voices.find((v) => v.lang === "en-US") ||
          voices.find((v) => v.lang?.startsWith("en")) ||
          voices[0] ||
          null
        );
      };

      const existing = pickVoice();

      if (existing) {
        resolve(existing);
        return;
      }

      // Voices often load asynchronously on first page load —
      // wait for the event instead of giving up immediately.
      const handleVoicesChanged = () => {
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          handleVoicesChanged
        );

        resolve(pickVoice());
      };

      window.speechSynthesis.addEventListener(
        "voiceschanged",
        handleVoicesChanged
      );

      // Safety timeout in case the event never fires.
      setTimeout(() => {
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          handleVoicesChanged
        );

        resolve(pickVoice());
      }, 1000);
    });
  }

  // ==========================================================
  // SPEAK ANSWER
  // ==========================================================

  async function speakAnswer(
    text: string
  ) {
    if (
      typeof window ===
        "undefined" ||
      !(
        "speechSynthesis" in
        window
      )
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        text
      );

    // English (US)
    utterance.lang =
      "en-US";

    utterance.rate =
      0.9;

    utterance.pitch =
      1;

    const voice = await getEnglishVoice();

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.onstart =
      () => {
        setSpeaking(true);
      };

    utterance.onend =
      () => {
        setSpeaking(false);
      };

    utterance.onerror =
      (event) => {
        console.error(
          "Speech synthesis error:",
          event
        );

        setSpeaking(false);
      };

    window.speechSynthesis.speak(
      utterance
    );
  }

  // ==========================================================
  // STOP SPEAKING
  // ==========================================================

  function stopSpeaking() {
    if (
      typeof window !==
        "undefined" &&
      "speechSynthesis" in
        window
    ) {
      window.speechSynthesis.cancel();
    }

    setSpeaking(false);
  }

  // ==========================================================
  // ASK ASSISTANT
  // ==========================================================

  async function askAssistant(
    customMessage?: string
  ) {
    const currentMessage =
      customMessage ??
      message;

    if (
      !currentMessage.trim() ||
      loading ||
      !threadId
    ) {
      return;
    }

    if (listening) {
      stopListening();
    }

    try {
      setLoading(true);

      setAnswer("");

      stopSpeaking();

      // Store the message separately.
      // This is important because we clear the
      // input after sending.
      setLastUserMessage(
        currentMessage
      );

      const response =
        await fetch(
          "/api/ai/booking-assistant",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              message:
                currentMessage,

              threadId,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Assistant request failed."
        );
      }

      const assistantAnswer =
        data.answer ||
        "Sorry, no response was received.";

      setAnswer(
        assistantAnswer
      );

      setMessage("");

      speakAnswer(
        assistantAnswer
      );
    } catch (error) {
      console.error(
        error
      );

      const errorMessage =
        "Sorry, your request couldn't be processed. Please try again.";

      setAnswer(
        errorMessage
      );

      speakAnswer(
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // QUICK QUESTION
  // ==========================================================

  function handleQuickQuestion(
    question: string
  ) {
    setMessage(
      question
    );

    askAssistant(
      question
    );
  }

  // ==========================================================
  // NEW CONVERSATION
  // ==========================================================

  function startNewConversation() {
    stopListening();

    stopSpeaking();

    const newThreadId =
      crypto.randomUUID();

    localStorage.setItem(
      THREAD_STORAGE_KEY,
      newThreadId
    );

    setThreadId(
      newThreadId
    );

    setMessage("");

    setLastUserMessage("");

    setAnswer("");

    setLoading(false);
  }

  // ==========================================================
  // ENTER KEY
  // ==========================================================

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      askAssistant();
    }
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="relative">
      {/* ==================================================
          FLOATING BUTTON
      ================================================== */}

      {!open && (
        <button
          type="button"
          onClick={() =>
            setOpen(true)
          }
          aria-label="Open booking assistant"
          className="
            group
            relative
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-full
            bg-[#063d43]
            text-white
            shadow-2xl
            ring-1
            ring-black/10
            transition-all
            duration-300
            hover:scale-105
            hover:bg-[#07545c]
            active:scale-95
            sm:h-16
            sm:w-16
          "
        >
          <span
            className="
              absolute
              inset-0
              animate-ping
              rounded-full
              bg-teal-500/30
            "
          />

          <MessageCircle
            size={25}
            strokeWidth={2}
            className="
              relative
              z-10
              transition-transform
              duration-300
              group-hover:rotate-6
            "
          />

          <span
            className="
              absolute
              right-0
              top-0
              h-3.5
              w-3.5
              rounded-full
              border-2
              border-white
              bg-green-500
            "
          />
        </button>
      )}

      {/* ==================================================
          CHAT WINDOW
      ================================================== */}

      {open && (
        <div
          className="
            fixed
            bottom-4
            left-4
            right-4
            z-[9999]
            flex
            max-h-[calc(100vh-2rem)]
            flex-col
            overflow-hidden
            rounded-2xl
            border
            border-gray-200
            bg-white
            shadow-2xl

            sm:absolute
            sm:bottom-0
            sm:left-auto
            sm:right-0
            sm:w-[410px]
            sm:max-w-[calc(100vw-2rem)]
          "
        >
          {/* ==================================================
              HEADER
          ================================================== */}

          <div
            className="
              flex
              items-center
              justify-between
              bg-[#063d43]
              px-4
              py-4
              text-white
              sm:px-5
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-white/10
                "
              >
                <Bot size={21} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">
                    Booking Assistant
                  </h2>

                  <span
                    className="
                      h-2
                      w-2
                      rounded-full
                      bg-green-400
                    "
                  />
                </div>

                <p className="mt-0.5 text-xs text-white/60">
                  Haikal Tours AI Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* New chat */}

              <button
                type="button"
                onClick={
                  startNewConversation
                }
                aria-label="Start new conversation"
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  text-white/70
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
              >
                <RotateCcw
                  size={16}
                />
              </button>

              {/* Close */}

              <button
                type="button"
                onClick={() => {
                  setOpen(
                    false
                  );

                  stopListening();

                  stopSpeaking();
                }}
                aria-label="Close booking assistant"
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  text-white/70
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
              >
                <ChevronDown
                  size={20}
                />
              </button>
            </div>
          </div>

          {/* ==================================================
              BODY
          ================================================== */}

          <div
            className="
              min-h-0
              flex-1
              overflow-y-auto
            "
          >
            {/* Welcome */}

            {!answer &&
              !loading && (
                <div className="p-4 sm:p-5">
                  <div className="flex gap-3">
                    <div
                      className="
                        mt-1
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-teal-50
                        text-teal-700
                      "
                    >
                      <Sparkles
                        size={16}
                      />
                    </div>

                    <div
                      className="
                        rounded-2xl
                        rounded-tl-sm
                        bg-gray-50
                        px-4
                        py-3
                      "
                    >
                      <p
                        className="
                          text-sm
                          leading-6
                          text-gray-700
                        "
                      >
                        Hi there! 👋
                        <br />
                        I can help you with buses,
                        routes, schedules, seat
                        availability, and bookings.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p
                      className="
                        mb-2
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-gray-400
                      "
                    >
                      Try asking
                    </p>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickQuestion(
                            "Which buses have seats available?"
                          )
                        }
                        className="
                          rounded-xl
                          border
                          border-gray-200
                          px-3
                          py-2.5
                          text-left
                          text-xs
                          text-gray-600
                          transition
                          hover:border-teal-200
                          hover:bg-teal-50
                          hover:text-teal-800
                        "
                      >
                        Which buses have seats available?
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleQuickQuestion(
                            "Are seats A1 and A2 available on GB-102?"
                          )
                        }
                        className="
                          rounded-xl
                          border
                          border-gray-200
                          px-3
                          py-2.5
                          text-left
                          text-xs
                          text-gray-600
                          transition
                          hover:border-teal-200
                          hover:bg-teal-50
                          hover:text-teal-800
                        "
                      >
                        Are seats A1 and A2 available on GB-102?
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleQuickQuestion(
                            "Show me buses from Gilgit to Hunza."
                          )
                        }
                        className="
                          rounded-xl
                          border
                          border-gray-200
                          px-3
                          py-2.5
                          text-left
                          text-xs
                          text-gray-600
                          transition
                          hover:border-teal-200
                          hover:bg-teal-50
                          hover:text-teal-800
                        "
                      >
                        Show me buses from Gilgit to Hunza
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* Loading */}

            {loading && (
              <div className="p-5">
                <div className="flex items-start gap-2">
                  <div
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-teal-50
                      text-teal-700
                    "
                  >
                    <Bot size={16} />
                  </div>

                  <div
                    className="
                      rounded-2xl
                      rounded-tl-sm
                      bg-gray-50
                      px-4
                      py-3
                    "
                  >
                    <div className="flex items-center gap-2">
                      <Loader2
                        size={16}
                        className="animate-spin text-teal-700"
                      />

                      <span className="text-sm text-gray-500">
                        Checking availability...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Answer */}

            {answer &&
              !loading && (
                <div className="space-y-4 p-4 sm:p-5">
                  {/* User */}

                  <div className="flex justify-end">
                    <div className="flex max-w-[88%] items-end gap-2">
                      <div
                        className="
                          rounded-2xl
                          rounded-br-sm
                          bg-[#063d43]
                          px-4
                          py-3
                          text-sm
                          leading-6
                          text-white
                        "
                      >
                        {lastUserMessage}
                      </div>

                      <div
                        className="
                          flex
                          h-7
                          w-7
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-gray-100
                          text-gray-500
                        "
                      >
                        <User size={14} />
                      </div>
                    </div>
                  </div>

                  {/* AI */}

                  <div className="flex items-start gap-2">
                    <div
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-teal-50
                        text-teal-700
                      "
                    >
                      <Bot size={16} />
                    </div>

                    <div
                      className="
                        max-w-[88%]
                        rounded-2xl
                        rounded-tl-sm
                        bg-gray-50
                        px-4
                        py-3
                      "
                    >
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <p
                          className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-wider
                            text-teal-700
                          "
                        >
                          Haikal AI
                        </p>

                        {speaking ? (
                          <button
                            type="button"
                            onClick={
                              stopSpeaking
                            }
                            className="
                              flex
                              items-center
                              gap-1
                              text-[10px]
                              font-semibold
                              text-gray-500
                              hover:text-red-500
                            "
                          >
                            <VolumeX
                              size={14}
                            />

                            Stop
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              speakAnswer(
                                answer
                              )
                            }
                            className="
                              flex
                              items-center
                              gap-1
                              text-[10px]
                              font-semibold
                              text-teal-700
                              hover:text-teal-900
                            "
                          >
                            <Volume2
                              size={14}
                            />

                            Listen
                          </button>
                        )}
                      </div>

                      <p
                        className="
                          whitespace-pre-wrap
                          text-sm
                          leading-6
                          text-gray-700
                        "
                      >
                        {answer}
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* ==================================================
              INPUT
          ================================================== */}

          <div
            className="
              border-t
              border-gray-100
              bg-white
              p-3
              sm:p-4
            "
          >
            {/* Voice */}

            <button
              type="button"
              onClick={
                listening
                  ? stopListening
                  : startListening
              }
              disabled={loading}
              className={`
                mb-3
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                py-3
                text-sm
                font-semibold
                transition-all

                ${
                  listening
                    ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                    : "bg-teal-50 text-teal-800 hover:bg-teal-100"
                }

                ${
                  loading
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }
              `}
            >
              {listening ? (
                <>
                  <MicOff
                    size={18}
                  />

                  Listening... tap to stop
                </>
              ) : (
                <>
                  <Mic
                    size={18}
                  />

                  {speechSupported
                    ? "Tap to speak"
                    : "Voice unavailable"}
                </>
              )}
            </button>

            {/* Text */}

            <div
              className="
                flex
                items-end
                gap-2
                rounded-2xl
                border
                border-gray-200
                bg-gray-50
                p-1.5
                transition
                focus-within:border-teal-500
                focus-within:ring-2
                focus-within:ring-teal-100
              "
            >
              <input
                value={
                  message
                }
                onChange={(e) =>
                  setMessage(
                    e.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                disabled={
                  loading
                }
                placeholder={
                  listening
                    ? "Listening..."
                    : "Type your question..."
                }
                className="
                  min-w-0
                  flex-1
                  bg-transparent
                  px-3
                  py-2.5
                  text-sm
                  text-gray-800
                  outline-none
                  placeholder:text-gray-400
                  disabled:opacity-50
                "
              />

              <button
                type="button"
                onClick={() =>
                  askAssistant()
                }
                disabled={
                  loading ||
                  !message.trim() ||
                  !threadId
                }
                aria-label="Send message"
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#063d43]
                  text-white
                  transition
                  hover:bg-[#07545c]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                {loading ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Send
                    size={17}
                  />
                )}
              </button>
            </div>

            <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-gray-400">
              <Sparkles
                size={10}
              />

              Haikal Tours AI • Booking Assistant
            </div>
          </div>
        </div>
      )}
    </div>
  );
}