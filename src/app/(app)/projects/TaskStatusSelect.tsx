"use client";

import { useRef } from "react";
import { TASK_STATUSES, TASK_STATUS_LABEL, type TaskStatus } from "@/lib/work/shared";
import { setTaskStatusAction } from "./actions";

/** Moves a task between board columns. Saves as soon as the value changes. */
export function TaskStatusSelect({ taskId, status, label }: { taskId: number; status: TaskStatus; label: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form action={setTaskStatusAction} ref={formRef}>
      <input type="hidden" name="taskId" value={taskId} />
      <select
        className="input"
        name="status"
        defaultValue={status}
        aria-label={`Status of ${label}`}
        onChange={() => formRef.current?.requestSubmit()}
      >
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {TASK_STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
