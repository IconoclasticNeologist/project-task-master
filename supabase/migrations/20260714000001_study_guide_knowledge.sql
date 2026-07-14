-- Make the AI brains aware of the in-app STUDY GUIDES (the bigger, paged
-- guides at /study) so they can gently point a survivor to the matching one.
-- This row is an index, not content: agents may name a guide and say what it
-- covers, as background to read at the person's own pace — never as a script
-- for what to say. Mirrors 20260705000004_notebook_knowledge.sql.
--
-- Idempotent: guarded by title so re-running never duplicates. Published so it
-- reaches agents immediately (buildKnowledgeBlock only reads status='published').

insert into public.project_knowledge (title, body, agent_keys, status, created_by)
select
  'In-app study guides the survivor can open',
  $body$The app has ten bigger "study guides" a person can open at /study (also linked from Home, "Preparing for court", and the notebooks shelf). Each one is paged — one small step at a time — with optional listen-aloud audio, tap-a-word definitions, and gentle unscored check-ins. Nothing is saved about what they read or answer. If one of these topics comes up, you may speak to it briefly and point them to the matching guide — as background to read at their own pace, never as a script for what to say. The ten:
1. "The path of a case" (/study/path-of-a-case) — the whole journey: charges, first court dates, the quiet middle, maybe an agreement, maybe a trial, sentencing and after.
2. "Who's who in the courtroom" (/study/who-is-who-in-court) — every person in the room, what they do, and who is and isn't "for you".
3. "Words you'll hear" (/study/words-you-will-hear) — courtroom language in plain words: objection, sustained, exhibit, recess, testimony, oath.
4. "The day you testify" (/study/the-day-you-testify) — the full arc of a testimony day: waiting, being called in, the oath, questions from each side, stepping down. What to expect, never what to say.
5. "Cross-examination and objections" (/study/cross-examination) — why the other side pushes, how objections protect, the right to pause, to not understand, and to not remember.
6. "Your rights in the process" (/study/your-rights) — rights to be told about hearings, to be present, to be heard at some hearings, to protection and privacy, and who helps make them real.
7. "Evidence, simply" (/study/evidence-simply) — what evidence and exhibits are, why some things can't be said, why lawyers interrupt.
8. "Being heard: impact statements" (/study/being-heard) — what an impact statement is, the forms it can take, and that it is always the person's choice. Describes what it IS, never suggests content.
9. "Privacy and protection" (/study/privacy-and-protection) — limits on questions about the past, sealed records, no-contact orders, raising safety worries.
10. "After the case ends" (/study/after-the-case) — verdicts, sentencing, why appeals happen, and what "over" can mean.
All of it is general information, not legal advice, and always defers to the person's own advocate or lawyer.$body$,
  '{}',
  'published',
  'migration:study-guides'
where not exists (
  select 1 from public.project_knowledge
  where title = 'In-app study guides the survivor can open'
);
