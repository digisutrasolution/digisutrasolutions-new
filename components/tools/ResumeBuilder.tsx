"use client";

import { useState } from "react";
import { Plus, Printer, Trash2 } from "lucide-react";

/* Resume builder — a single-column, ATS-friendly layout (no tables, no
   columns, no graphics), built in the browser and printed via the browser
   dialog. */

type Job = { role: string; org: string; period: string; detail: string };

const blankJob: Job = { role: "", org: "", period: "", detail: "" };
const field =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500";
const lbl = "mb-1 block text-xs font-semibold text-stone-500";

export default function ResumeBuilder() {
  const [me, setMe] = useState({ name: "", title: "", contact: "", summary: "" });
  const [jobs, setJobs] = useState<Job[]>([{ ...blankJob }]);
  const [skills, setSkills] = useState("");
  const [education, setEducation] = useState("");

  const setJob = (i: number, patch: Partial<Job>) =>
    setJobs((p) => p.map((j, idx) => (idx === i ? { ...j, ...patch } : j)));

  const skillList = skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="grid gap-6 rounded-[2rem] bg-[#FFF6EF] p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
      <div className="no-print">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={lbl}>Full name</label>
            <input value={me.name} onChange={(e) => setMe({ ...me, name: e.target.value })} className={field} placeholder="Priya Sharma" />
          </div>
          <div>
            <label className={lbl}>Job title</label>
            <input value={me.title} onChange={(e) => setMe({ ...me, title: e.target.value })} className={field} placeholder="Performance Marketing Manager" />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Contact line</label>
            <input value={me.contact} onChange={(e) => setMe({ ...me, contact: e.target.value })} className={field} placeholder="Noida · +91-99999-00000 · priya@email.com · linkedin.com/in/priya" />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Summary (2–3 lines)</label>
            <textarea value={me.summary} onChange={(e) => setMe({ ...me, summary: e.target.value })} className={`${field} min-h-20 resize-y`} placeholder="Six years running paid campaigns for D2C brands…" />
          </div>
        </div>

        <p className="mt-5 text-sm font-semibold text-stone-700">Experience</p>
        <div className="mt-2 space-y-3">
          {jobs.map((j, i) => (
            <div key={i} className="rounded-xl border border-stone-200 bg-white/60 p-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <input value={j.role} onChange={(e) => setJob(i, { role: e.target.value })} className={field} placeholder="Role" />
                <input value={j.org} onChange={(e) => setJob(i, { org: e.target.value })} className={field} placeholder="Company" />
                <input value={j.period} onChange={(e) => setJob(i, { period: e.target.value })} className={field} placeholder="2023 – present" />
              </div>
              <textarea
                value={j.detail}
                onChange={(e) => setJob(i, { detail: e.target.value })}
                className={`${field} mt-2 min-h-16 resize-y`}
                placeholder="One achievement per line, with a number where you have one."
              />
              <button
                onClick={() => jobs.length > 1 && setJobs((p) => p.filter((_, idx) => idx !== i))}
                className="mt-1 flex cursor-pointer items-center gap-1 text-xs text-stone-400 hover:text-red-600"
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => setJobs((p) => [...p, { ...blankJob }])}
            className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#F26419] hover:underline"
          >
            <Plus size={13} /> Add role
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <div>
            <label className={lbl}>Skills (comma separated)</label>
            <input value={skills} onChange={(e) => setSkills(e.target.value)} className={field} placeholder="Google Ads, GA4, SEO, HubSpot" />
          </div>
          <div>
            <label className={lbl}>Education</label>
            <textarea value={education} onChange={(e) => setEducation(e.target.value)} className={`${field} min-h-16 resize-y`} placeholder="B.Com, Delhi University, 2018" />
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#F26419] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
        >
          <Printer size={15} aria-hidden /> Print / Save as PDF
        </button>
        <p className="mt-2 text-xs leading-relaxed text-stone-500">
          Single column, standard headings and no graphics — the format applicant tracking systems
          parse most reliably.
        </p>
      </div>

      <div className="invoice-sheet rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <p className="font-display text-2xl font-extrabold text-stone-900">{me.name || "Your name"}</p>
        <p className="text-sm font-semibold text-[#F26419]">{me.title || "Your job title"}</p>
        <p className="mt-1 text-xs text-stone-600">{me.contact || "City · phone · email"}</p>

        {me.summary && (
          <>
            <Heading>Summary</Heading>
            <p className="text-sm leading-relaxed text-stone-700">{me.summary}</p>
          </>
        )}

        {jobs.some((j) => j.role || j.org) && <Heading>Experience</Heading>}
        {jobs.map(
          (j, i) =>
            (j.role || j.org) && (
              <div key={i} className="mb-3">
                <p className="text-sm font-bold text-stone-900">
                  {j.role || "Role"}
                  {j.org && <span className="font-normal text-stone-600"> · {j.org}</span>}
                </p>
                {j.period && <p className="text-xs text-stone-500">{j.period}</p>}
                {j.detail && (
                  <ul className="mt-1 list-disc pl-4 text-sm leading-relaxed text-stone-700">
                    {j.detail.split("\n").filter(Boolean).map((line, k) => (
                      <li key={k}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            ),
        )}

        {skillList.length > 0 && (
          <>
            <Heading>Skills</Heading>
            <p className="text-sm text-stone-700">{skillList.join(" · ")}</p>
          </>
        )}

        {education && (
          <>
            <Heading>Education</Heading>
            <p className="whitespace-pre-line text-sm text-stone-700">{education}</p>
          </>
        )}
      </div>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 mt-5 border-b border-stone-200 pb-1 text-xs font-bold uppercase tracking-wide text-stone-500">
      {children}
    </p>
  );
}
