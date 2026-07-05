-- Make the AI brains aware of the in-app guide "notebooks" so they can speak to
-- the topics and gently point a survivor to the matching guide. The deeper
-- substance already lives in the earlier research knowledge; these two rows add
-- (a) an index of the guides so agents know they exist, and (b) the agency
-- material (pleas / being heard / your own lawyer) that the original
-- court-journey research did not cover.
--
-- Idempotent: guarded by title so re-running never duplicates. Published so it
-- reaches agents immediately (buildKnowledgeBlock only reads status='published').

insert into public.project_knowledge (title, body, agent_keys, status, created_by)
select
  'In-app guide notebooks the survivor can open',
  $body$The app has nine short, plain-language guide "notebooks" a person can open at /notebooks (also linked from Home and "Preparing for court"). If one of these topics comes up, you may speak to it briefly and gently point them to the matching guide — as background to read at their own pace, never as a script for what to say. The nine:
1. "If the case ends in a deal" — most criminal cases end in a plea, not a trial; the person can still be heard at sentencing.
2. "Your own lawyer" — the prosecutor represents the case, not them; victims'-rights attorneys or clinics may help.
3. "Questions that feel unfair" — common cross-examination patterns ("why didn't you leave", "you called him your boyfriend"), framed as what to EXPECT, never how to answer.
4. "Memory and your story" — trauma and memory, what impeachment and "refreshing recollection" mean.
5. "Phones, posts, and contact" — not discussing testimony with other witnesses, social media, no contact with jurors or the accused.
6. "If you are from another country" — T and U visas, Continued Presence, confidentiality (an immigration lawyer's territory only).
7. "Ways court can be gentler" — screens, video testimony, facility dogs, a support person, an interpreter.
8. "Waiting and delays" — the right to timing free of unreasonable delay, and why dates move.
9. "Calming tools for court days" — slow breathing, 5-4-3-2-1 grounding, small sensory tools.
All of it is general information, not legal advice, and always defers to the person's own advocate or lawyer.$body$,
  '{}',
  'published',
  'migration:notebooks'
where not exists (
  select 1 from public.project_knowledge
  where title = 'In-app guide notebooks the survivor can open'
);

insert into public.project_knowledge (title, body, agent_keys, status, created_by)
select
  'Pleas, being heard, and having your own lawyer',
  $body$Most criminal cases in the U.S. end in a plea agreement rather than a trial, so many survivors never testify to a jury; this is about how the system works, not the worth of their account. Even when a case ends in a plea, U.S. federal law (the Crime Victims' Rights Act) gives victims the right to be "reasonably heard" at public proceedings like sentencing — in writing or aloud — though the judge and lawyers still decide whether to accept a plea. The prosecutor represents the government, not the person individually; the "right to confer" is not an attorney-client relationship. In some places a person can have their OWN victims'-rights attorney (for example through clinics like the National Crime Victim Law Institute) to help enforce rights such as notice, presence, privacy, and being heard; availability depends on jurisdiction. Treat all of this as general background, defer to the person's own advocate or lawyer, and never advise on whether to accept or oppose a specific plea.$body$,
  '{coach.base,coach.interview,reframer,recognition,interviewer}',
  'published',
  'migration:notebooks'
where not exists (
  select 1 from public.project_knowledge
  where title = 'Pleas, being heard, and having your own lawyer'
);
