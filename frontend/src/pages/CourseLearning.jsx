import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Loader2,
  Lock,
  PartyPopper,
  PlayCircle,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../lib/api";
import { getSession } from "../lib/session";

/* ───── Animation Variants ───── */
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const stagger = { animate: { transition: { staggerChildren: 0.05 } } };

export default function CourseLearning() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingTopic, setCompletingTopic] = useState(null); // topic id being completed
  const [expandedModules, setExpandedModules] = useState({});
  const [showCelebration, setShowCelebration] = useState(false);

  /* ── Tutor IA modal ── */
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorAnswer, setTutorAnswer] = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);

  const session = getSession();

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.get(`/student/courses/${courseId}`);
      setCourse(data);
      // Expand first non-completed module by default
      const firstIncomplete = data.modules.find((m) => !m.completed);
      if (firstIncomplete) {
        setExpandedModules({ [firstIncomplete.id]: true });
      } else if (data.modules.length > 0) {
        setExpandedModules({ [data.modules[0].id]: true });
      }
    } catch (err) {
      setError(err?.data?.detail || err?.message || "Error cargando el curso.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const toggleModule = (modId) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const completeTopic = async (topicId) => {
    try {
      setCompletingTopic(topicId);
      const result = await api.post(`/student/courses/${courseId}/topics/${topicId}/complete`);
      // Update local state
      setCourse((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.completed_topics = result.course_progress_percent === 100
          ? prev.total_topics
          : Math.round(prev.total_topics * result.course_progress_percent / 100);
        updated.progress_percent = result.course_progress_percent;
        updated.is_completed = result.course_completed;
        updated.modules = prev.modules.map((mod) => {
          const newTopics = mod.topics.map((t) =>
            t.id === topicId ? { ...t, completed: true } : t
          );
          return {
            ...mod,
            topics: newTopics,
            completed: newTopics.every((t) => t.completed),
          };
        });
        return updated;
      });
      if (result.course_completed) {
        setShowCelebration(true);
      }
    } catch (err) {
      console.error("Error completing topic:", err);
    } finally {
      setCompletingTopic(null);
    }
  };

  const askTutor = async () => {
    if (!tutorQuestion.trim()) return;
    try {
      setTutorLoading(true);
      setTutorAnswer("");
      const res = await api.post(`/student/courses/${courseId}/ask`, { question: tutorQuestion.trim() });
      setTutorAnswer(res.answer || "Sin respuesta.");
    } catch (err) {
      setTutorAnswer("Error al consultar el tutor IA.");
    } finally {
      setTutorLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
        <div className="max-w-md text-center">
          <p className="text-red-500 mb-4">{error || "Curso no encontrado."}</p>
          <button onClick={() => navigate("/student/dashboard")} className="text-emerald-500 hover:underline text-sm">
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  const progress = course.progress_percent;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            onClick={() => navigate("/student/dashboard")}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <button
            onClick={() => setTutorOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-violet-300 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300 transition-all hover:bg-violet-100 dark:hover:bg-violet-500/20 active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" /> Tutor IA
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* ── Course Header ── */}
        <motion.div {...fadeUp} className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{course.name}</h1>
              {course.opportunity_title && (
                <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">
                  Vacante: <span className="font-medium text-emerald-600 dark:text-emerald-400">{course.opportunity_title}</span>
                </p>
              )}
              {course.description && (
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-zinc-400">{course.description}</p>
              )}
            </div>
            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              course.is_completed
                ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}>
              {course.is_completed ? (
                <><CheckCircle2 className="h-3.5 w-3.5" /> Completado</>
              ) : (
                <><BookOpen className="h-3.5 w-3.5" /> En progreso</>
              )}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm text-gray-500 dark:text-zinc-500">
              <span>Progreso del curso</span>
              <span className="font-semibold tabular-nums text-gray-900 dark:text-zinc-100">{progress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className={`h-full rounded-full transition-colors ${
                  progress === 100
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-500"
                }`}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-zinc-600">
              {course.completed_topics} de {course.total_topics} temas completados
            </p>
          </div>
        </motion.div>

        {/* ── Modules List ── */}
        <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
          {course.modules.map((mod, modIndex) => {
            const expanded = expandedModules[mod.id];
            const modTopicsTotal = mod.topics.length;
            const modTopicsDone = mod.topics.filter((t) => t.completed).length;
            const modPct = modTopicsTotal > 0 ? Math.round(modTopicsDone / modTopicsTotal * 100) : 0;

            return (
              <motion.div
                key={mod.id}
                variants={fadeUp}
                className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]"
              >
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      mod.completed
                        ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-zinc-500"
                    }`}>
                      {mod.completed ? <CheckCircle2 className="h-4 w-4" /> : modIndex + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">{mod.title}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-600">{modTopicsDone}/{modTopicsTotal} temas · {modPct}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Mini progress */}
                    <div className="hidden sm:block w-24 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          mod.completed ? "bg-emerald-400" : "bg-emerald-500"
                        }`}
                        style={{ width: `${modPct}%` }}
                      />
                    </div>
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400 dark:text-zinc-600" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400 dark:text-zinc-600" />
                    )}
                  </div>
                </button>

                {/* Module Topics (expandable) */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-100 dark:border-white/[0.04] px-5 pb-4 pt-3 space-y-2">
                        {mod.topics.map((topic) => (
                          <div
                            key={topic.id}
                            className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition-all ${
                              topic.completed
                                ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5"
                                : "border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] hover:border-emerald-300 dark:hover:border-emerald-500/20"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Status icon */}
                              {topic.completed ? (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                              ) : (
                                <PlayCircle className="h-5 w-5 shrink-0 text-gray-400 dark:text-zinc-600" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-medium truncate ${
                                  topic.completed
                                    ? "text-emerald-700 dark:text-emerald-300"
                                    : "text-gray-900 dark:text-zinc-100"
                                }`}>
                                  {topic.title}
                                </p>
                                {topic.content_url && (
                                  <a
                                    href={topic.content_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-0.5 inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors"
                                  >
                                    <ExternalLink className="h-3 w-3" /> Ver material
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Action button */}
                            {topic.completed ? (
                              <span className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                Completado
                              </span>
                            ) : (
                              <button
                                onClick={() => completeTopic(topic.id)}
                                disabled={completingTopic === topic.id}
                                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-[0.97] disabled:opacity-50"
                              >
                                {completingTopic === topic.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                Marcar completado
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Course Completed Message ── */}
        {course.is_completed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 p-6 text-center"
          >
            <PartyPopper className="mx-auto h-10 w-10 text-emerald-500 mb-3" />
            <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              ¡Curso completado!
            </h3>
            <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
              Has terminado todos los módulos. Ahora puedes postularte a la vacante.
            </p>
            <button
              onClick={() => navigate("/student/dashboard")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4" /> Volver y postularme
            </button>
          </motion.div>
        )}
      </main>

      {/* ── Course completion celebration ── */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-white dark:bg-zinc-900 p-8 text-center shadow-2xl"
            >
              <PartyPopper className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                ¡Felicidades!
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
                Has completado todos los temas del curso. Ahora puedes postularte a la vacante.
              </p>
              <button
                onClick={() => { setShowCelebration(false); navigate("/student/dashboard"); }}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-[0.98]"
              >
                Ir a postularme
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tutor IA Modal ── */}
      <AnimatePresence>
        {tutorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setTutorOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-zinc-900 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/[0.06] px-6 py-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-500" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">Tutor IA</h3>
                </div>
                <button onClick={() => setTutorOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                    ¿Qué quieres aprender o preguntar sobre este curso?
                  </label>
                  <textarea
                    rows={3}
                    value={tutorQuestion}
                    onChange={(e) => setTutorQuestion(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askTutor(); } }}
                    placeholder="Ej: ¿Puedes explicarme qué es una API REST?"
                    className="w-full rounded-lg border border-gray-300 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600 outline-none focus:border-violet-400 dark:focus:border-violet-500/50 focus:ring-1 focus:ring-violet-200 dark:focus:ring-violet-500/30 resize-none"
                  />
                </div>
                <button
                  onClick={askTutor}
                  disabled={tutorLoading || !tutorQuestion.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-violet-500 active:scale-[0.98] disabled:opacity-50"
                >
                  {tutorLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {tutorLoading ? "Pensando…" : "Preguntar"}
                </button>
                {tutorAnswer && (
                  <div className="rounded-lg border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 mb-2">Respuesta del Tutor IA:</p>
                    <p className="text-sm leading-relaxed text-gray-800 dark:text-zinc-200 whitespace-pre-wrap">{tutorAnswer}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
