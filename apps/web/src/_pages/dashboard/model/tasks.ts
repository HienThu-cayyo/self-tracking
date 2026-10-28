export type TaskPriority = "Cao" | "Vừa" | "Thấp"

type PrioritizedTask = {
  priority: TaskPriority
}

const priorityRank: Record<TaskPriority, number> = {
  Cao: 0,
  Vừa: 1,
  Thấp: 2,
}

export function sortTasksByPriority<T extends PrioritizedTask>(tasks: T[]) {
  return tasks
    .map((task, index) => ({ task, index }))
    .sort(
      (left, right) =>
        priorityRank[left.task.priority] - priorityRank[right.task.priority] ||
        left.index - right.index,
    )
    .map(({ task }) => task)
}
