export type DashboardSummary = {
  learningProgressPercent: number
  completedTasks: number
  totalTasks: number
  currentGpa: number | null
  targetGpa: number | null
  completedCredits: number
  totalCredits: number
}

export const EMPTY_DASHBOARD_SUMMARY: DashboardSummary = {
  learningProgressPercent: 0,
  completedTasks: 0,
  totalTasks: 0,
  currentGpa: null,
  targetGpa: null,
  completedCredits: 0,
  totalCredits: 0,
}

const DAILY_QUOTES = [
  "You can't win at everything, but you can try.",
  "Keep learning, keep enjoying, keep dreaming.",
  "The whole of life is a process of learning.",
  "Wishing your dreams won't just stay as dreams.",
  "Life is a soup and I'm a fork.",
  "If you can't find the sunshine, be the sunshine.",
  "Keep going because your life doesn't end in one failure.",
  "I can do this. You can do this.",
  "Let go or be dragged.",
  "I only see my goals, I don't believe in failure.",
  "If people don't match your vibe, change the people, not the vibe.",
  "Just keep going! You'll get there! You got this!",
  "It's not always easy, but that's life. Be strong because there are better days ahead.",
  "Dream as if you'd live forever. Live as if you'd die today.",
  "Study now, shine later.",
  "A little progress is still progress.",
  "Learn something new every day.",
  "Your future self will thank you.",
  "One page at a time.",
  "Focus on learning, not perfection.",
  "Stay curious. Keep growing.",
  "Small steps, every single day.",
  "Consistency over perfection.",
  "Show up for yourself today.",
  "Make progress, not excuses.",
  "One task. One step. One win.",
  "Build habits, build your future.",
  "Keep your promises to yourself.",
  "You're doing better than you think.",
  "It's okay to grow slowly.",
  "Be proud of how far you've come.",
  "You deserve the life you're building.",
  "Rest is part of the journey.",
  "Some days, trying is enough.",
  "Your pace is still a good pace.",
  "Make today count.",
  "Progress starts with showing up.",
  "Your story is still being written.",
  "Turn your dreams into plans.",
  "Good things take time.",
  "A fresh start begins today.",
  "Keep blooming in your own season.",
  "Habits are the compound interest of self-improvement.",
  "Goals are good for setting a direction, but systems are best for making progress.",
  "Most people need consistency more than they need intensity.",
]

export function getLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function getDailyQuotes(date: Date) {
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  )
  const firstIndex = ((dayNumber % DAILY_QUOTES.length) + DAILY_QUOTES.length) % DAILY_QUOTES.length
  const secondIndex = (firstIndex + 1) % DAILY_QUOTES.length

  return {
    greeting: DAILY_QUOTES[firstIndex] ?? DAILY_QUOTES[0] ?? "",
    timer: DAILY_QUOTES[secondIndex] ?? DAILY_QUOTES[0] ?? "",
  }
}
