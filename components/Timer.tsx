'use client'


import { useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '../lib/useLocalStorage'


export default function Timer() {
const idRef = useRef(Math.random().toString(36).slice(2))
const [seconds, setSeconds] = useLocalStorage<number>(`timer:${idRef.current}`, 0)
const [running, setRunning] = useState(false)


useEffect(() => {
if (!running) return
const t = setInterval(() => setSeconds(s => s + 1), 1000)
return () => clearInterval(t)
}, [running, setSeconds])


const reset = () => setSeconds(0)


const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
const ss = String(seconds % 60).padStart(2, '0')


return (
<div className="rounded-xl border p-4">
<div className="text-3xl font-mono tabular-nums">{mm}:{ss}</div>
<div className="mt-3 flex items-center gap-2">
<button onClick={() => setRunning(r => !r)} className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-neutral-900">{running ? 'Pause' : 'Start'}</button>
<button onClick={reset} className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-neutral-900">Reset</button>
</div>
</div>
)
}