"use client";

import { Plus, X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

interface CourseInputProps {
  courses: string[];
  onChange: (courses: string[]) => void;
}

const MAX_COURSES = 8;

/** "cisc2000" or "cisc 2000" -> "CISC 2000". Returns null when it does not look like a course code. */
export function normalizeCourse(raw: string): string | null {
  const match = raw.trim().toUpperCase().match(/^([A-Z]{2,5})\s*-?\s*(\d{3,4}[A-Z]?)$/);
  return match ? `${match[1]} ${match[2]}` : null;
}

export function CourseInput({ courses, onChange }: CourseInputProps) {
  const [value, setValue] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  const add = () => {
    if (!value.trim()) return;
    const code = normalizeCourse(value);
    if (!code) {
      setHint("Use a subject and number, like CISC 2000.");
      return;
    }
    if (courses.includes(code)) {
      setHint(`${code} is already added.`);
      return;
    }
    if (courses.length >= MAX_COURSES) {
      setHint(`You can add up to ${MAX_COURSES} courses.`);
      return;
    }
    onChange([...courses, code]);
    setValue("");
    setHint(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add();
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          aria-label="Course code"
          placeholder="CISC 2000"
          className="input"
          value={value}
          onChange={(e) => { setValue(e.target.value); setHint(null); }}
          onKeyDown={onKeyDown}
        />
        <button type="button" onClick={add} className="btn-secondary shrink-0" aria-label="Add course">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
      {hint ? <p className="mt-1.5 text-xs font-medium text-maroon-700">{hint}</p> : null}
      {courses.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {courses.map((code) => (
            <li key={code} className="chip-maroon pr-1">
              {code}
              <button
                type="button"
                onClick={() => onChange(courses.filter((c) => c !== code))}
                aria-label={`Remove ${code}`}
                className="cursor-pointer rounded-full p-0.5 hover:bg-maroon-100"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
