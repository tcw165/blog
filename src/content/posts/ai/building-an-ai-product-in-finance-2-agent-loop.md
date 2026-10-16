---
title: "Building an AI Product in Finance, Part 2: Agent Loop, Prompts, and Context"
description: "How the in-house agent loop packs a turn: a short sys-prompt, skills in code, a workflow plan as a latch, and history that is not a tool dump."
pubDate: 2026-09-20
categories:
  - AI
toc: true
cover:
  src: /images/2026-09-20-ai-product-in-finance-2-agent-loop/cover.jpg
  alt: "Cartoon portal title card for the series Building an AI Product in Finance, Part 2: Agent Loop"
---

[Part 1](/blog/posts/building-an-ai-product-in-finance-1-overview/) was the map. The worker owns the turn. The runner is the only box that talks to the model. This post is what runs inside that runner: the in-house agent loop, the prompt, and the context window.

I did not wrap a vendor loop.

---

Story — why in-house
--------------------

A vendor agent framework is enough for a demo. It provides tools, a loop, and a chat. A brokerage product needs more than that.

A PM wants a sequence: ask these questions, call this tool, render this widget. Compliance wants that sequence to be a DAG, not an open-ended generation. The turn still has to be stoppable. The sys-prompt cannot grow without a bound. The model's tendency to hallucinate cannot be left loose on a tax lot.

The loop had to be ours. Skills and sub-agents live **in code**. A PM can contribute a workflow skill. The runner does not change. The HTTP endpoint still does not run the agent.

I tried the usual answers:

- **Wrap a vendor loop.** Fast until the window has to be packed locally, a turn has to be cancelled, or a workflow has to land without forking the framework.
- **One giant few-shot sys-prompt.** Concrete examples go stale. The model copies the example, not the pattern. The prompt grows. The cache misses.
- **Store every tool call in history.** The model retains a JSON dump. Every later turn pays for the previous turn's search. The window fills with tool output, not the conversation.

The loop stays small. The window is selective about what it includes.

---

Prompt
------

Three rules:

- **Less is better.** The core sys-prompt stays under four thousand words. If a rule needs a page, it is a skill, not part of the sys-prompt.
- **Do not few-shot concrete examples.** Prompt *patterns of behavior*. An example of one ticker and one tax lot gets copied. A pattern — when the user asks about a lot, fetch the lot, then answer with the lot — still applies to the next ticker.
- **Treat the model as a capable librarian.** Do not teach it what a book is. Specify the behavior: when to look, when to ask, when to stop.

The sys-prompt is the constitution. Skills are the procedures. Sub-agents are delegated to one part of the work. None of that belongs in HTTP.

---

The Window
----------

![Model context stack: core sys-prompt, tools, session context, pre-warm skills, relevant history plus the latest user message, workflow plan state, and a step-in-loop reminder.](/images/2026-09-20-ai-product-in-finance-2-agent-loop/fig-01.png)

This is how a turn is packed. Top to bottom, static then dynamic.

**Static** is the prefix the cache can actually hit:

- Core sys-prompt
- Tool schemas
- Session context — entry, environment, created timestamp, the facts that do not change mid-turn
- Pre-warm skills

**Dynamic** is everything that moves:

- Relevant roled messages plus the latest user message
- Workflow plan state — checked steps and a TODOs DAG
- A step-in-loop reminder

The harness input-cache rate is **P50 92%**. That rate depends on a prefix that stays stable.

The **workflow plan** is the latch. The model proposes a small state machine. Workflow skills constrain it, and a PM can write those skills. The plan is not an open instruction to act. It is a deterministic DAG: ask a question, call a tool, render a widget. The model can still choose the wording. The plan does not advance until the lot has been fetched.

The **step-in-loop reminder** sits at the bottom on purpose. It is the last thing the model reads before it acts. It tells the model when to use more **parallel** tool calls. Accuracy improves when the lookups happen together.

One turn looks like this:

```
static prefix (cached)
  sys-prompt
  tools
  session
  pre-warm skills
dynamic
  visible history + latest user
  workflow plan (DAG)
  step-in-loop reminder
        |
        v
      model
        |
        +--> parallel tools / sub-agents
        +--> append a visible message
        +--> maybe update the plan
```

The runner owns that packing. The service does not. The endpoint does not.

---

History without the tool trace
-------------------------------

Across turns, history is **visible messages only**. Not tool calls. The user saw a paragraph, a widget, an answer. That is what the next turn receives.

The current turn is different. The model still sees this turn's tool trace. The previous turn's tool JSON does not come back.

I call that **asymmetric history**. The conversation is durable. The tool trace is not. If a tool result still matters on the next turn, it has to become a visible message, or it has to land in compacted memory. Otherwise it is dropped.

Compaction is not a paragraph inserted into the sys-prompt. It is a **typed compacted-memory message**. It is a first-class boundary. I decide where the history exposed to the model ends. The model sees a typed object, not an unbounded "summary:" string.

That keeps the static prefix stable as the chat grows. The sys-prompt does not grow. The visible history does.

---

Next
----

The loop is only as honest as the eval that watches it.

Next is [Part 3](/blog/posts/building-an-ai-product-in-finance-3-daily-eval/) — the daily eval that tells me harness health every morning. Domain and case fixtures in the repo. Composable scorers. A CLI for the change you are about to land. After that, the sandbox: synthetic fixtures, no PI / PII stored, patterns learned from production sampling.
