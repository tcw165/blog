---
title: "Building an AI Product in Finance, Part 5: Close-loop Automation"
description: "One eval platform: an onion of checks, harness health at the core, and a weekly agent that turns a miss into a fixture PR."
pubDate: 2026-10-14
categories:
  - AI
toc: true
cover:
  src: /images/2026-10-14-ai-product-in-finance-5-close-loop/cover.jpg
  alt: "Cartoon portal title card for the series Building an AI Product in Finance, Part 5: Close-loop Automation"
---

# Three Verticals

Eval-driven development helps any agentic product in three places. I keep them separate so a number from one does not answer a question from another.

- **Release readiness.** Offline, before a release. An eval run produces a quality report. That report is how I decide the harness is ready to ship.
- **Production monitoring.** Online, continuous. The same suites on sampled live traces. Drift, a regression, an incident — within hours, not after a ticket.
- **Model selection.** The same suites, the same fixtures, candidate models side by side. Quality sits next to cost and latency. I do not select a model from a demo.

None of that is a new runner. It is the same cases, on a different schedule.

---

# One Platform

One eval platform. Online and offline both read fixtures in code. A case is a history, a persona, and a scenario. Persona and scenario are the blocks from [Part 4](/blog/posts/building-an-ai-product-in-finance-4-eval-sandbox/). History is the turns already on the thread.

![Eval platform. Online: daily eval and a weekly learner over traces run single-turn and multi-turn, write reports, update a dashboard, and an optimizer posts fixture changes as a PR stack. Offline: CI and an eval agent, or an engineer, run the REPL and a reporter posts to Slack. A case is history, persona, and scenario. The PR comes back as feedback with engineers in the loop.](/images/2026-10-14-ai-product-in-finance-5-close-loop/fig-03.png)

Online starts from a daily eval and a weekly learner over production traces.

Daily, single-turn and multi-turn runs write online reports and publish them to the production dashboards from [Part 3](/blog/posts/building-an-ai-product-in-finance-3-daily-eval/).

Weekly, an optimizer agent turns a miss into a fixture change and opens a PR stack. [Part 4](/blog/posts/building-an-ai-product-in-finance-4-eval-sandbox/)'s sampler never wrote a customer into git. That constraint now runs on a schedule. The diff can be a case, a scorer, or the environment the case runs in. A person still merges it.

---

## The Onion

The eval stack is an onion.

The core is a guardrail check. Small. Deterministic. Fast to diagnose. Each layer outward allows more randomness, and it needs more signals to stay reliable. The outer layer tests complete behavior and the UX. Starting there spends the review on the wording of one paragraph.

![Eval onion: core is safety and harness health, middle is context and tools, outer is response and multi-turn. Randomness grows outward.](/images/2026-10-14-ai-product-in-finance-5-close-loop/fig-02.png)

Here is my framework.

<div class="table-scroll">
<table>
<thead>
<tr><th>Layer</th><th>Verticals / domains</th><th>Randomness</th><th>Extra signals</th></tr>
</thead>
<tbody>
<tr>
<td>Core</td>
<td>
<p><strong>Safety</strong></p>
<ul>
<li>Input guardrail. e.g. Red team 100</li>
<li>General compliance guardrail</li>
<li>Product-specific do-not-say guardrail</li>
</ul>
<p><strong>Harness health</strong></p>
<ul>
<li>Avg and median input token size over 5 turns</li>
<li>Avg and median input token cache rate over 5 turns</li>
<li>Avg and median TTFT / TTFB latency over 5 turns</li>
<li>Avg and median total duration over 5 turns</li>
<li>Avg steps-in-loop per turn</li>
<li>Number of function tools</li>
<li>Number of MCP tools</li>
</ul>
</td>
<td>Extremely low.</td>
<td>
<p>Zero to low. Potentially:</p>
<ul>
<li>an internal knowledge bank</li>
<li>a product catalog</li>
<li>a promotion catalog</li>
</ul>
</td>
</tr>
<tr>
<td>Middle</td>
<td>
<p><strong>Context engineering</strong></p>
<ul>
<li>Collection of personas and scenarios for product taxonomy</li>
<li>Skill / workflow selection: expected vs unexpected</li>
<li>Context relevancy: the right facts, not the most facts. Better RAG or graph search.</li>
<li>Context poisoning: a wrong conclusion gets saved and treated as fact. Validate before writing.</li>
<li>Context distraction: the history grows until it steers the agent. Compaction, or move state into files.</li>
<li>Context confusion: too many tools or skills in the window. Curate with lazy loading or consolidation.</li>
<li>Context clash: the window contradicts itself. Prune the stale version.</li>
</ul>
<p><strong>Relevancy and safety test</strong></p>
<ul>
<li>Tool use: expected vs unexpected</li>
<li>Tool args: relevancy to topic</li>
<li>Tool output: cohesive, useful, and compliant</li>
<li>Tool stack review: conflicts or overlap</li>
</ul>
</td>
<td>Moderate.</td>
<td>
<p>Everything from the inner layer.</p>
<ul>
<li>Traces: tool request, tool response</li>
<li>Synthetic data from persona and scenario</li>
<li>Internal QA knowledge bank</li>
</ul>
<p>The middle and the outer layer both start to need a lot of domain knowledge.</p>
</td>
</tr>
<tr>
<td>Outer</td>
<td>
<p><strong>Response examination</strong></p>
<ul>
<li>Number of paragraphs</li>
<li>Response structure. e.g. In-app navigation link is always at the bottom.</li>
<li>Fact grounding</li>
</ul>
<p><strong>Multi-turn analysis</strong></p>
<ul>
<li>Relevancy trajectory</li>
<li>User sentiment trajectory</li>
</ul>
</td>
<td>High</td>
<td>
<p>Everything from the layers above.</p>
<ul>
<li>Product opinion over compliance, styling, and so on</li>
</ul>
<p>A lot of domain knowledge here too.</p>
</td>
</tr>
</tbody>
</table>
</div>

Poisoning, distraction, confusion, and clash follow IBM Technology's [walkthrough of context failure modes](https://youtu.be/BwXremQ-i6I).

Two ways to run it.

**Offline.** Fast iteration. The only dependency is LLM access, no matter how many upstream services hide behind function tools or MCP.

**Online.** Daily. Sample production traces. Loop a human into QA.

---

## Shared Building Blocks

A case points at one history, one persona, one scenario. The product selects the suite. Offline, the tree looks like this. Persona and scenario are the fixtures Part 4 already defined. History is the block that was missing. The parent is `conservative_parent`, same file as the sandbox.

```
eval/offline/fixtures
├── cases/
│   ├── product_1/
│   │   └── experimental_one_shot_test.yaml
│   └── red-team-100.yaml
├── history/
│   └── talk_to_agent.yaml
├── personas/
│   └── conservative_parent.yaml
└── scenarios/
    ├── general.yaml
    └── pending_ach_deposit.yaml
```

**Case.** The question under test. `query` is the user turn. History, the persona preset, and the scenario are names, not copies. Tags are a list. Scorers still compose per case, as they do in the gym. The scorer schema is unchanged from [Part 3](/blog/posts/building-an-ai-product-in-finance-3-daily-eval/).

```yaml
- id: experimental_one_shot
  query: Did the deposit post?
  history: talk_to_agent
  persona_preset: conservative_parent
  scenario: pending_ach_deposit
  tags: [deposit]
```

**History.** Turns already on the thread. Role and content. Tool traces are separate, and that split is in [Part 2](/blog/posts/building-an-ai-product-in-finance-2-agent-loop/). The file is the thread the tester starts from.

```yaml
- role: user
  content: I want to know if a deposit posted.
- role: assistant
  content: I can look. Which account?
```

**Persona.** Who the customer is. Timezone, identity, features such as crypto, options, and margin, the accounts they hold. It changes slowly. Many questions reuse it. The shape is in Part 4. A persona is a profile, not a person.

**Scenario.** The situation for this session, bound to one persona. It carries the clock and the story. The facts are the contract. Any number or state the assistant might quote belongs here, and the mocked backends must return it. Part 4 called that latch the constraint the synthesizer is not allowed to contradict. The same rule applies. The ACH fixture is the one from Part 4.

---

# How You Run It

- [Single-turn Eval](#single-turn-eval)
- [Multi-turn Eval](#multi-turn-eval)
- [Interactive Eval (REPL)](#interactive-eval-repl)

## Single-turn Eval

Offline, one fixture:

```text
just eval --env offline --product <product> --fixtures <single_turn_fixture>
```

## Multi-turn Eval

The same command, with a different fixture. A tester agent plays the user. A policy keeps the tester on the scenario. The eval then grades the context the two of them produced.

```text
context = tester_agent(agent_under_test, policy())
report = eval(context)
```

```text
just eval --env offline --product <product> --fixtures <multi_turns_fixture>
```

## Interactive Eval (REPL)

The same blocks. I type the user turns. One session is below. The URIs stay redacted.

```text
$ just eval-repl --history=<history> --persona=<persona> --scenario=<scenario> --product=<product>
> hi
user: hi
assistant: Hi, how could I help you?
> Read my tax lots for what I could sell long terms?
assistant: On it
[heartbeat]
[heartbeat]
assistant: Here is the table with all valid long terms holdings
[table] col:6,rows:21
assistant: and here is a visual of your holdings's performance
[assets_chart] uri=<redacted>
> K, I want customer support
assistant: Can you specify the issue so I could help?
> No need, just connect me to support
assistant: On it, let me forward to you our support.
[in_app_destination] uri=<redacted>
```

The heartbeat shows the harness is still in the loop. The table and the chart are widgets, not additional prose. The last turn is an in-app destination. That is the outer-layer structure check in the onion: the navigation link has a destination.

Engineers contribute cases. Engineers contribute scorers. The runner treats those files the same regardless of author. A harness change — a tool, a packing of the window, a skill — gets a case in the same PR, and the core is the first signal. Tokens, cache rate, TTFT, TTFB, duration, steps, tool count. I do not wait for a sentiment trajectory to report that the prefix doubled.

The CLI is the offline run. The daily job is the online cron. The weekly agent proposes the next fixture. I still merge it.

---

Next
----

That is the loop. Offline while I am making the change. Daily once the harness is in production. Weekly when a miss should become a fixture.

Next is [Part 6](/blog/posts/building-an-ai-product-in-finance-6-deterministic-workflow/) — a persisted workflow plan. A skill names the tools. The record holds the DAG and the current step.

The onion stays fast only while the core stays small.
