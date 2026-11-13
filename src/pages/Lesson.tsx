import { useEffect, useState } from 'react'
import { LESSONS } from '../data/lessons'
import { Button, Card, PageHeader } from '../components/ui'
import { useLessonProgress } from './Learn'

export function Lesson({ id }: { id?: string }) {
  const idx = LESSONS.findIndex((l) => l.id === id)
  const lesson = LESSONS[idx]
  const [i, setI] = useState(0)
  const [answer, setAnswer] = useState<number | null>(null)
  const [done, setDone] = useLessonProgress()
  useEffect(() => {
    setI(0)
    setAnswer(null)
  }, [id])
  if (!lesson) return <PageHeader back="#impara" title="Lezione non trovata" />
  const go = (n: number) => {
    setI(n)
    setAnswer(null)
    window.scrollTo({ top: 0 })
  }
  const next = LESSONS[idx + 1]

  if (i >= lesson.slides.length)
    return (
      <div>
        <PageHeader back="#impara" title={lesson.title} />
        <Card className="pop-in text-center">
          <div className="text-5xl">🎉</div>
          <h2 className="mt-2 text-xl font-bold">Lezione completata!</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => go(0)}>
              Ripeti
            </Button>
            {next && next.id !== 'tavolo' ? (
              <a href={`#lezione-${next.id}`}>
                <Button>Prossima: {next.title}</Button>
              </a>
            ) : (
              <a href="#guidata">
                <Button variant="gold">Prova la partita guidata</Button>
              </a>
            )}
          </div>
        </Card>
      </div>
    )

  const slide = lesson.slides[i]
  const last = i === lesson.slides.length - 1
  const canGo = !slide.quiz || (answer !== null && !!slide.quiz.options[answer].correct)
  const finish = () => {
    if (!done.includes(lesson.id)) setDone([...done, lesson.id])
    go(lesson.slides.length)
  }

  return (
    <div>
      <PageHeader back="#impara" title={lesson.title} subtitle={lesson.summary} />
      <div className="mb-3 flex gap-1">
        {lesson.slides.map((_, n) => (
          <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= i ? 'bg-jade-600' : 'surface-2'}`} />
        ))}
      </div>
      <Card key={i} className="pop-in">
        <h2 className="mb-3 text-xl font-bold">{slide.title}</h2>
        <div className="space-y-2 leading-relaxed">{slide.body}</div>
        {slide.quiz && (
          <div className="mt-5 rounded-2xl surface-2 p-4">
            <div className="mb-3 font-semibold">🧩 {slide.quiz.question}</div>
            <div className="grid gap-2">
              {slide.quiz.options.map((o, n) => {
                const chosen = answer === n
                const tone = chosen
                  ? o.correct
                    ? 'border-jade-500 bg-jade-50 dark:bg-jade-950'
                    : 'border-red-400 bg-red-50 dark:bg-red-950/40'
                  : 'border-soft'
                return (
                  <button type="button" key={n} onClick={() => setAnswer(n)} className={`surface rounded-xl border-2 p-3 text-left cursor-pointer ${tone}`}>
                    <div>{o.label}</div>
                    {chosen && (
                      <div className="mt-1 text-sm">
                        {o.correct ? '✅ ' : '❌ '}
                        {o.explain}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </Card>
      <div className="mt-4 flex justify-between gap-2">
        <Button variant="secondary" disabled={i === 0} onClick={() => go(i - 1)}>
          ← Indietro
        </Button>
        {last ? (
          <Button disabled={!canGo} onClick={finish}>
            Fine lezione ✓
          </Button>
        ) : (
          <Button disabled={!canGo} onClick={() => go(i + 1)}>
            {slide.quiz && !canGo ? 'Rispondi per continuare' : 'Avanti →'}
          </Button>
        )}
      </div>
    </div>
  )
}
