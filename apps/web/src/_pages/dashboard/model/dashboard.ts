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
  "Không cần đi nhanh, chỉ cần không ngừng tiến lên.",
  "Mỗi phiên học nhỏ đều đưa bạn gần hơn tới mục tiêu lớn.",
  "Kỷ luật hôm nay là sự tự do của ngày mai.",
  "Bạn không cần hoàn hảo để bắt đầu, chỉ cần bắt đầu.",
  "Tập trung vào bước tiếp theo, không phải cả cầu thang.",
  "Một giờ học sâu đáng giá hơn một ngày học trong phân tâm.",
  "Tiến bộ chậm vẫn là tiến bộ.",
  "Mục tiêu lớn được tạo nên từ những việc nhỏ lặp lại mỗi ngày.",
  "Hãy học với sự tò mò, không phải áp lực.",
  "Ngày tốt nhất để bắt đầu là hôm nay.",
]

export function getLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function getDailyQuote(date: Date) {
  const dateKey = getLocalDateKey(date)
  const seed = Array.from(dateKey).reduce((total, character) => total + character.charCodeAt(0), 0)
  return DAILY_QUOTES[seed % DAILY_QUOTES.length] ?? DAILY_QUOTES[0]
}
