import { createFileRoute, Link } from '@tanstack/react-router'
import { LESSON1_LEVEL_ID, loadLesson1 } from '#/game/levels'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const lesson1 = loadLesson1()
  return (
    <main className="home">
      <h1>SteerHead</h1>
      <p>2D HDD training sim — TanStack Start + TypeScript shell.</p>
      <p>
        Lesson 1 default: <strong>{lesson1.bibleTitle}</strong> (
        <code>{LESSON1_LEVEL_ID}</code>)
      </p>
      <p>
        <Link to="/play">Enter yard (play)</Link>
      </p>
      <p className="note">
        TickSnap is the only physics→UI contract. Soil/fail numbers await Bot 2/5.
      </p>
    </main>
  )
}
