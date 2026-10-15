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

[Part 4](/blog/posts/building-an-ai-product-in-finance-4-eval-sandbox/) was the sandbox. This post is the loop that closes on it.

The gym in [Part 3](/blog/posts/building-an-ai-product-in-finance-3-daily-eval/) already runs in the morning. The sandbox already lets me run the same cases on a laptop. What I wanted next was one platform, and a way for a miss to become a fixture without me retyping the YAML.

---

Story — a passing case
----------------------

A case can pass and the harness can still be sick.

Someone lands a prompt tweak. Someone adds a tool. I try one chat. The answer looks fine. Tomorrow morning the pass line is flat. A week later the first block is late, the prefix is fat, and the input cache is worse. Pass / fail never said that. It graded the answer. It did not grade the machine that produced it.

We quickly tried the usual answers:

- **Only the morning pass / fail.** Honest about cases. Blind to a fatter prompt, a longer loop, a tool you did not mean to mount.
- **Only an outer judge on every change.** You debug tone. The bug was token size.
- **Only offline.** You iterate fast. You never see drift on live traces.
- **Only online.** Production teaches you the bug the laptop could have caught.
- **A human rereads sampled traces.** That is QA. It is not a loop until the miss becomes a fixture in git.

We kept one suite. We run it two ways. The inner layer watches the harness. The outer layer watches the answer.

---

Three verticals
---------------

Eval-driven development helps any agentic product in three places. I keep them separate so a number from one does not pretend to answer another.

- **Release readiness.** Offline, before a release. An eval run produces a quality report. That report is how I decide the harness is ready to ship.
- **Production monitoring.** Online, continuous. The same suites on sampled live traces. Drift, a regression, an incident — within hours, not after a ticket.
- **Model selection.** The same suites, the same fixtures, candidate models side by side. Quality sits next to cost and latency. I do not pick a model from a demo.

None of that is a new runner. It is the same cases, pointed at a different schedule.

---

One platform
------------

One eval platform. Online and offline both read fixtures in code. A case is a history, a persona, and a scenario. Persona and scenario are the blocks from [Part 4](/blog/posts/building-an-ai-product-in-finance-4-eval-sandbox/). History is the turns already on the thread.

![Eval platform. Online: daily eval and a weekly learner over traces run single-turn and multi-turn, write reports, update a dashboard, and an optimizer posts fixture changes as a PR stack. Offline: CI and an eval agent, or an engineer, run the REPL and a reporter posts to Slack. A case is history, persona, and scenario. The PR comes back as feedback with engineers in the loop.](/images/2026-10-14-ai-product-in-finance-5-close-loop/fig-03.png)

Online starts from a daily eval and a weekly learner over production traces.

Daily, single-turn and multi-turn runs write online reports and publish them to the production dashboards from [Part 3](/blog/posts/building-an-ai-product-in-finance-3-daily-eval/).

Weekly, an optimizer agent turns a miss into a fixture change and opens a PR stack. [Part 4](/blog/posts/building-an-ai-product-in-finance-4-eval-sandbox/)'s sampler never wrote a customer into git. This is that door on a schedule. The diff can be a case, a scorer, or the world the case runs in. A person still lands it.

---

The onion
---------

The eval stack is an onion.

The core is a guardrail check. Small. Deterministic. Fast to diagnose. Each layer outward allows more randomness, and it needs more signals to stay honest. The outer layer tests complete behavior and the UX. If you start there, you spend the morning arguing about a paragraph.

![Eval onion: core is safety and harness health, middle is context and tools, outer is response and multi-turn. Randomness grows outward.](/images/2026-10-14-ai-product-in-finance-5-close-loop/fig-02.png)

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
<li>Total context:
<ul>
<li>Repetitiveness</li>
<li>Cohesiveness</li>
<li>Relevancy</li>
</ul>
</li>
<li>Skill / workflow selection: expected vs unexpected</li>
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


TTFT and TTFB are the same clocks as [Part 1](/blog/posts/building-an-ai-product-in-finance-1-overview/). First token. First block. The scorers that grade an answer — compliance, tools, structure, fact grounding — are still the ones from [Part 3](/blog/posts/building-an-ai-product-in-finance-3-daily-eval/). The onion is how they stack. The core does not wait on the outer judge.

Two ways to run it.

**Offline.** Fast iteration. The only dependency is LLM access, no matter how many upstream services hide behind function tools or MCP. Part 4 is why those calls still resolve. You mock the tool. You do not stand up the bank.

**Online.** Daily. Sample production traces. Loop a human into QA. The weekly PR is that loop. If nobody reads it, you have a suggestion box.

---

The blocks
----------

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

**Case.** The question under test. `query` is the user turn. History, persona, and scenario are names, not copies. Product picks which suite this file belongs to. Scorers still compose per case, the same way as the gym. I am not going to paste that schema again.

```yaml
case:
  id: experimental_one_shot
  product: product_1
  history: talk_to_agent
  persona: conservative_parent
  scenario: pending_ach_deposit
  query: Did the deposit post?
```

**History.** Turns already on the thread. Role and content. Not a tool dump — that cut is [Part 2](/blog/posts/building-an-ai-product-in-finance-2-agent-loop/). The file is the shelf the tester starts from.

```yaml
- role: user
  content: I want to know if a deposit posted.
- role: assistant
  content: I can look. Which account?
```

**Persona.** Who the customer is. Timezone, identity, features such as crypto, options, and margin, the accounts they hold. It changes slowly. Many questions reuse it. The shape is in Part 4. A persona is a profile, not a person.

**Scenario.** What is going on today, bound to one persona. It carries the clock and the story. The facts are the contract. Any number or state the assistant might quote belongs here, and the mocked backends must return it. Part 4 called that latch the thing the synthesizer is not allowed to contradict. Same rule. I am not pasting the ACH YAML twice.

---

How you run it
--------------

Single-turn, offline, one fixture:

```text
just eval --env offline --product <product> --fixtures <single_turn_fixture>
```

Multi-turn is the same command with a different fixture. Inside, a tester agent plays the user. A policy keeps it on the plot. Then the eval grades the context the two of them just wrote.

```text
context = tester_agent(agent_under_test, policy())
report = eval(context)
```

```text
just eval --env offline --product <product> --fixtures <multi_turns_fixture>
```

When I want to sit in the loop myself, there is a repl. Same blocks. I type the user turns. Here is one session. The URIs stay redacted.

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

The heartbeat is the harness still in the loop. The table and the chart are widgets, not a second essay. The last turn is an in-app destination. That is the outer-layer structure check in the onion: the navigation link has somewhere to land.

Engineers contribute cases. Engineers contribute scorers. The runner does not care who wrote the YAML. A new harness change — a tool, a packing of the window, a skill — gets a case in the same PR, and the core is the first signal. Tokens, cache rate, TTFT, TTFB, duration, steps, tool count. I do not wait for a sentiment trajectory to tell me the prefix doubled.

The CLI is the offline run. The daily job is the online cron. The weekly agent proposes the next fixture. I still merge it.

---

#### Good

- One suite. Offline while the change is in front of me. Daily once it is in production.
- The core stays small. A guardrail miss or a fatter prefix does not wait on an outer judge.
- Harness health is visible before the answer is graded. Tokens, cache, time to first block, steps, how many tools are mounted.
- Persona, scenario, and history compose. Part 4 split the first two. A case names all three.
- Model selection is the same fixtures, with cost and latency beside quality.
- The weekly PR is how the garden grows. An agent proposes. A human lands it. No customer record in the diff.
- Engineers add cases and scorers themselves. The new harness work gets an early signal, not a vibe in one chat.

#### Drawback

- The outer layer is slow to diagnose. A sentiment trajectory can be a bad day or a bad sentence. You will not know which from the panel.
- More randomness outward means more signals. You can drown in them and stop reading the core.
- The tester agent is another agent. A loose policy and it wanders off the plot. You grade the tester, not the harness.
- Online sampling only closes if someone reads the weekly stack. A quiet PR is how the loop becomes a log.
- A red-team set of 100 is only as mean as the last case somebody added. The core can pass a museum.
- Facts in the scenario are a contract. Miss one number and the mocked backend and the judge disagree. You debug the fixture.

---

Next
----

That is the loop. Offline when I am in the change. Daily when the harness is already in production. Weekly when a miss should become a fixture.

I do not have a sixth post lined up. The onion only stays fast if the core stays small.
