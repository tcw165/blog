---
title: "Building an AI Product in Finance, Part 6: Deterministic Workflow using Skills"
description: "An agent skill gets a generalist model most of the way. A long workflow is a DAG, so the skill writes a persisted plan and the current step."
pubDate: 2026-10-16
categories:
  - AI
toc: true
cover:
  src: /images/2026-10-16-ai-product-in-finance-6-deterministic-workflow/cover.jpg
  alt: "Cartoon portal title card for the series Building an AI Product in Finance, Part 6: Deterministic Workflow"
---

An agent skill is great. It is not enough.

A pretty good model, the kind that behaves like a genius generalist, can get me to about 70 to 80 percent of what I expect. The other 20 to 30 percent is still a chance of drifting or hallucinating. Adding more signals, more rules, and more examples to the context makes that worse. The model loses attention. It develops what I call model anxiety. It thinks longer, in the wrong direction.

In a highly regulated industry, that 20 to 30 percent is the hard blocker on launch. Legal and compliance block it.

That left two paths.

1. Keep doing something around the model.
2. Fine-tune the model.

Fine-tuning is expensive, and I can still get the same result, or only slightly better. Frontier models are still getting smarter, including in specialized work. It is too early to fine-tune in order to close that 20 to 30 percent.

So I kept searching in the harness. There is still a way there. This post is that way.

I went back to what I used to do for this gap. I had many server-driven workflows. I started a prototype, migrating a few of those workflows onto agent skills. Very quickly I realized a workflow is a complicated DAG of the business. It is not a linear list of steps.

Take an ACAT reimbursement. The simplest linear version is:

`already credited in this thread? > list ACAT transfers > one or many records? > clarify with the user > …`

In reality every one of these workflows is a graph. It is not even like that linear example.

So I started thinking:

1. Program the workflow as a sub-agent?
2. Program the workflow as a skill?

I chose the skill. A sub-agent is not scalable. From experience, workflows are seasonal, and the shape of the DAG changes for a promotion or a seasonal event. If I own the code of those workflows, I become the bottleneck. Or the engineers on the team do.

A skill is the other side of that. Anyone can write a skill. The model is good at translating human language into the procedure.

A skill plus the model still cannot give me high determinism. A workflow is often a lengthy DAG. When the steps get long and the conditions get complicated, even the best frontier model gets lost in it.

Recap: a workflow via agent skills, plus something.

---

# The Meat and Juice

The better frame is this. I need the agent to translate a professional's write-up into a persisted DAG, and to record where that DAG currently is.

From there I have four things.

- A plan skill
- Four tools paired with the skill
- A database
- A collection of workflow skills

## The `plan/SKILL.md` skill

It is a small instruction. It teaches the agent the general way to use the planning tools against the workflow. It is not the ACAT graph. The graph is the plan for the request in front of it.

````markdown
# When to use

Use this when a request needs several dependent steps, many tool calls, or up-front decomposition before you can answer well. Skip it for single-shot lookups.

# Tools

## Make Plan

Create a plan with title, objective, and ordered list of steps.

## View Plan

Read the current plan back as a checklist. Only when you have not just called make-plan or update-plan; both already return the checklist.

## Update Plan

Check, uncheck, fail or skip steps by their step ID. You'll be given enough information for deciding the sequence. Advance one step or several at once, in any order. Make a step "fail" when a step could not be completed; use "skip" to bypass a step.

## Make Plan Closed

End the plan with status of completed, failed or cancelled. Put a note for the reason of the closing status. Do not call update-plan just to check off the last step.

# Workflow

1. Make plan in step 0 alongside the first step's tool calls (parallel calls in one step); never spend a step on making plan by itself.
2. Execute remaining steps, batching independent tool calls in parallel. Send update-plan for finished step(s) in the same batch as the next step's tool calls, so recording progress never costs its own step. Repeat this until you exhaust the valid steps.
3. When the last step's work comes back, call mark-plan-closed to end a plan.

# Plan Shape

Keep plans terse. Prefer steps anyone could read at a glance.
````

## A collection of workflow skills

The plan skill is the general instruction. The procedures live in a collection of workflow skills. A person who knows the business writes one. The model translates that write-up into the plan for the request in front of it.

ACAT reimbursement is one skill in that collection. The linear write-up is the same chain as above.

````markdown
# ACAT reimbursement

Use this when the user asks whether an ACAT transfer was credited.

1. Already credited in this thread?
2. List ACAT transfers.
3. One or many records?
4. Clarify with the user.
````

## The plan tools

```python
@function_tool
async def make_plan(
    context: ContextWrapper[RunContext],
    title: str,
    steps: list[PlanStep],
) -> str: ...

@function_tool
async def view_plan(
    context: ContextWrapper[RunContext],
) -> str: ...

@function_tool
async def update_plan(
    context: ContextWrapper[RunContext],
    check: list[str] | None,
    uncheck: list[str] | None,
    fail: list[str] | None,
    skip: list[str] | None,
) -> str: ...

@function_tool
async def close_plan(
    context: ContextWrapper[RunContext],
    note: str,
    check: list[str] | None,
    uncheck: list[str] | None,
    fail: list[str] | None,
    skip: list[str] | None,
) -> str: ...
```

Behind those tools I keep two building blocks.

```python
class Plan(BaseModel):
    title: str
    status: "active" | "completed" | "failed" | "cancelled"
    steps: dict[str, PlanStep]
    created_at: datetime
    updated_at: datetime

class PlanStep(BaseModel):
    id: str
    goal: str
    recommended_tools: list[str]
    status: "pending" | "in_progress" | "done" | "failed" | "skipped"
    next_on_success: str
    next_on_failure: str
```

`next_on_success` and `next_on_failure` are how the linear list in the skill becomes the graph. `recommended_tools` is the hint for that node.

## The database

The tools talk to a database scoped to the current session, the conversation, and owned by the user. I give that data a TTL of one day.

---

The skill is the write-up. The four tools are how the agent touches the plan. The database is where the current step lives after the model has moved on.

I will leave it there.
