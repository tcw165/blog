---
title: "Building an AI Product in Finance, Part 2: Agent Loop, Prompts, and Context"
description: "How the in-house agent loop packs a turn: a short sys-prompt, skills in code, a workflow plan as a latch, and history that is not a tool dump."
pubDate: 2026-09-20
categories:
  - AI
toc: true
---

[Part 1](/blog/posts/building-an-ai-product-in-finance-1-overview/) was the map. The worker owns the turn. The runner is the only box that talks to the model. This post is what actually runs inside that runner: the in-house agent loop, the prompt, and the context window.

I did not wrap a vendor loop.

---

Story — why in-house
--------------------

A vendor agent framework is a great demo. You get tools, you get a loop, you ship a chat. Then finance shows up.

A PM wants a sequence: ask these questions, call this tool, render this widget. Compliance wants that sequence to be a DAG, not a vibe. The turn still has to be stoppable. The sys-prompt cannot become a novel. And the model — the model's greatest feature is hallucination, which is also the thing you cannot let loose on a tax lot.

So the loop had to be ours. Skills and sub-agents live **in code**. A PM can contribute a workflow skill. The runner does not change. The HTTP endpoint still does not run the agent.

We quickly tried the usual answers:

- **Wrap a vendor loop.** Fast until you need to pack the window yourself, cancel a turn, or land a workflow without forking the framework.
- **One giant few-shot sys-prompt.** Concrete examples rot. The model copies the example, not the pattern. The prompt grows. The cache dies.
- **Dump every tool call into history.** The model "remembers" a JSON dump. You pay for yesterday's search on every turn. The window fills with the card catalog, not the conversation.

We kept the loop small, and we got picky about what goes in the window.

---

Prompt
------

Three things I actually believe:

- **Less is better.** The core sys-prompt stays under four thousand words. If a rule needs a page, it is a skill, not a sermon.
- **Do not few-shot concrete examples.** Prompt *patterns of behavior*. An example of "this ticker, this tax lot" becomes a ritual. A pattern of "when the user asks about a lot, fetch the lot, then answer with the lot" survives the next ticker.
- **Treat the model as an extremely smart librarian.** You do not teach a librarian what a book is. You steer the behavior you want to unearth: when to look, when to ask, when to stop.

The sys-prompt is the constitution. Skills are the procedures. Sub-agents are people you send to a section of the stacks. None of that belongs in HTTP.

---

The Window
----------

![Model context stack: core sys-prompt, tools, session context, pre-warm skills, relevant history plus the latest user message, workflow plan state, and a step-in-loop reminder.](/images/2026-09-20-ai-product-in-finance-2-agent-loop/fig-01.png)

This is how a turn is packed. Top to bottom, static then dynamic.

**Static** is the prefix the cache can actually hit:

- Core sys-prompt
- Tool schemas
- Session context — entry, environment, created timestamp, the boring facts that do not change mid-turn
- Pre-warm skills

**Dynamic** is everything that moves:

- Relevant roled messages plus the latest user message
- Workflow plan state — checked steps and a TODOs DAG
- A step-in-loop reminder

I am proud of this cut. We observe the harness input-cache rate at **P50 92%**. That number is not a vibe. It is what you get when the prefix is boring on purpose.

The **workflow plan** is the latch. The model recommends a small state machine. Workflow skills prompt it hard — and a PM can write those skills. The plan is not "be an agent." It is a handle on a deterministic DAG: ask a question, call a tool, render a widget. Finance needs that latch. You want the librarian's imagination. You also want a door that only opens after the lot has been fetched.

The **step-in-loop reminder** sits at the bottom on purpose. It is the last thing the model reads before it acts. It tells the model when to opt into more **parallel** tool calls. Accuracy goes up. The response is better because the lookups happened together instead of as a timid one-at-a-time parade.

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

History, minus the tool dump
----------------------------

Across turns, history is **visible messages only**. Not tool calls. The user saw a paragraph, a widget, an answer. That is what the librarian keeps on the shelf.

The current turn is different. The model still sees this turn's tool tape — the lookups on the desk. Yesterday's JSON does not come back.

I call that **asymmetric history**. The conversation is durable. The card catalog is not. If a tool result still matters next turn, it has to become a visible message, or it has to land in compacted memory. Otherwise it is gone, which is the point.

Compaction is not a paragraph stuffed into the sys-prompt. I made a **typed compacted-memory message**. It is a first-class cut-off. We decide where history exposed to the model ends. The model sees a typed object, not a blob of "summary:" hoping it behaves.

That is how you keep the static prefix stable while the chat gets long. The constitution does not grow. The shelf does.

---

#### Good

- The prefix is boring, so the input cache actually hits. P50 92% is the receipt.
- Skills and sub-agents live in code. A PM can land a workflow skill without touching the runner.
- The workflow plan is a latch on a DAG, not a second orchestrator. Determinism and hallucination get to share a turn.
- The reminder is a small knob for parallel tool calls. You do not spend two thousand words of sys-prompt on "please call tools together."
- Asymmetric history keeps the window on the conversation. The current turn still sees its own tools.

#### Drawback

- You own the packing. Get the static/dynamic cut wrong and the cache falls over, and you will not notice until the bill does.
- Asymmetric history means last week's tool payload is invisible unless you promoted it. That is a feature until someone expected the raw JSON to still be there.
- A workflow plan can become a second product. Keep it a latch. The moment it starts running the company, you have two loops.
- An in-house loop is more code than wrapping a vendor. You pay that every time the model API grows a new idea.

---

Next
----

The loop is only as honest as the eval that watches it.

Next is the daily eval — the job that tells us harness health every morning. Domain and case fixtures in the repo. Composable scorers. A CLI for the change you are about to land. After that, the sandbox: synthetic fixtures, no PI / PII stored, patterns learned from production sampling.

link (coming soon)
