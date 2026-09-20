---
title: "Building an AI Product in Finance, Part 1: Overview"
description: "A map of an AI assistant at a consumer brokerage, and why we ended up with turn-based SSE plus short poll."
pubDate: 2026-09-19
categories:
  - AI
toc: true
cover:
  src: /images/2026-09-19-ai-product-in-finance-1-overview/cover.jpg
  alt: "Cartoon portal title card for the series Building an AI Product in Finance, Part 1: Overview"
---

Early 2025, my team got tasked to build an AI product at a consumer brokerage. The job was pretty clear on paper: personalized information retrieval, and then personalized actions inside the app. You ask about your account, the market, a tax lot, a comparison of your portfolio and the market — and the assistant should answer with *your* context, not a generic FAQ. If you want it to do something, it should be able to do that too.

I ended up building most of the system. Like, 80% of the whole thing. There is way too much to dump into one post, so this is going to be a series.

This first one is the map, and then we zoom into the piece that made the product feel alive on a phone: **turn-based SSE + short poll**.

---

Story — early 2025
------------------

We wanted the chat to feel live. Paragraphs show up. Tool calls show up. The user should not stare at a spinner for twenty seconds and then get a wall of text.

So from day one I wanted a native streaming design, and I wanted as few hops as possible between the client and the thing that actually runs the turn. Mobile, web, same protocol. If a later version needs a background agent, the same path should still work.

That last sentence is the trap. A protocol that only works while the user is staring at the screen cannot carry a background agent. The socket dies. The turn is still running. Unless those two lives share a design, you grow a second product.

The first version is easy to picture: the client opens a stream, the server writes the answer, everybody is happy. It works great when the turn is short and the user stays on the screen.

Then the turns got longer. Research. Multi-tool. The user switches apps. The OS kills the socket. The subway eats the radio. A held-open SSE is a radio station. If you walk out of the room, the song keeps playing without you.

> Think of a live SSE as a radio station. The people who are listening right now hear the same song.
>
> A persisted turn is a music CD. You can put it down, come back, and start from the last track you heard.

So we started thinking, how could we let the user walk away and still come back to the same turn — without replaying the model?

We quickly tried the usual answers:

- **Only SSE.** Beautiful when the client stays connected. Ugly when it doesn't. There is no resume. You either buffer in memory or you lose the middle of the song.
- **Only WebSocket.** Same reconnect problem, plus now every proxy, load balancer, and mobile OS wants to have an opinion about your long-lived socket.
- **Only short poll.** Resume is trivial. The chat feels like 2012. You pay for the "is there anything new?" question even when the answer is no.

We eventually picked a hybrid.

**Turn-based SSE** is the live path. The socket opens when the query starts and closes when the full response is in. We stream paragraph by paragraph, not token by token — legal and compliance did not want a token firehose on the client.

When that SSE ends, the server tells the client to **short-poll**. That is how slower updates show up after the turn: a late tool, a follow-up, anything that is not the live answer itself.

---

The Infrastructure
------------------

![AI platform architecture, with the streaming path from the client through the gateway, message queue, and turn worker in focus.](/images/2026-09-19-ai-product-in-finance-1-overview/fig-01.png "focus:stream-queue")

This is the map of the whole thing. I put a spotlight on the live path — gateway, queue, turn worker — because the rest of the boxes get their own posts.

On the user side, Android, iOS, and web talk to a **Gateway** with turn-based SSE plus short poll. The gateway does not run the agent. It accepts a turn, drops it on a **Message Queue**, and gives the client a `turn_id`. A **Turn Worker** pulls the job, writes the conversation, and drives an **Agent Loop**. The loop uses in-code skills and sub-agents, calls tools, reads a knowledge vector store, and talks to an LLM gateway that does the model routing.

The worker is the source of truth for a turn. It reads and writes a **Turn DB** and a **Conversation DB**. Tool traffic also lands in an analytical store. Traces go out so we can see what the loop actually did, not what we hoped it did.

On the engineer side there is a second path that I care about a lot. A daily eval job runs the case fixtures we keep in the repo. Persona fixtures and scenario fixtures feed those cases. Production sampling can propose fixture updates through a PR. Ingestion jobs fill the knowledge store from things like filings, help-center docs, and corporate actions. None of that is this post.

What I want you to notice on the map is just this: the client never talks to the agent loop directly. It talks to the gateway. The gateway talks to a queue. The worker owns the turn. That split is what makes streaming and walking away the same design instead of two designs.

The platform map is the boxes. This next figure is how I actually wrote the service.

![Overall service architecture: endpoints, service, and a separate agent runner on dependency injection, with a declarative observability layer and an LLM gateway.](/images/2026-09-19-ai-product-in-finance-1-overview/fig-02.png)

I built the whole service on **dependency injection**. Endpoint, Service, Agent Runner — they do not construct their own clients. The App and the clients live in DI. Swap a store, a tool, a model client, and the rest of the stack does not notice.

The **Agent Runner** is its own box on purpose. The endpoint does not run the agent. The service does not run the agent. The runner is the only thing that talks to the LLM gateway. That is how a turn stays stoppable, how you test without a model, and how agent guts do not leak into HTTP.

**Observability** is not a sidecar I bolted on later. It is declarative observation, reinforced on the path. You declare what you want to see on an endpoint — TTFT, TTFB (time to first *block*, because we stream paragraphs, not tokens), tool calls — and the instrumentation sits on the request. You do not sprinkle `start_timer()` inside the runner.

The architecture is two ideas:

- **Separation of concern**, via dependency injection. Who owns HTTP, who owns the turn, who owns the model call.
- **Declarative programming.** Especially observation. The metrics are a declaration, not a pile of timers.

---

Hybrid Streaming
----------------

The metaphor again, because this is the whole point.

The **Turn DB** is the CD. Every paragraph, tool start, tool result, and final answer is an append-only event with a cursor. The model runs once. Reconnect is "give me everything after `cursor=n`", not "please think again".

**Turn-based SSE** is the radio for the length of one song. The client opens `GET /turns/{id}/events?cursor=n` when the query starts. Paragraphs flow live until the full response is in. Then the socket closes on purpose. We do not stream token by token. Legal and compliance wanted whole paragraphs, not a drip of half-sentences.

**Short poll** is what happens after the song. The server tells the client to switch. The client says `GET /turns/{id}?cursor=12`. The gateway reads the Turn DB and returns anything slow that landed after the live answer — a late tool, a follow-up, a cancel. If the SSE dies mid-turn, the same poll is how you catch up. Nothing is lost. The next read starts from the last cursor the client actually applied.

And because a walk-away turn can still be the wrong turn, compute has to be **stoppable**. Cancel is just another write on the same log. The worker sees it and stops.

A reconnect looks like this:

```
Client          Gateway           Queue            Turn Worker         Turn DB
  |                |                |                   |                 |
  |-- POST /turns->|                |                   |                 |
  |                |-- enqueue ---->|                   |                 |
  |<- turn_id -----|                |                   |                 |
  |                |                |<-- pull ----------|                 |
  |-- open SSE c=0>|                |                   |                 |
  |                |                |                   |-- append ev 1-->|
  |<- ev 1 ---------|<---------------- live ------------|                 |
  |                |                |                   |-- append ev 2-->|
  |<- ev 2 ---------|<---------------- live ------------|                 |
  |  (full response in, SSE closes) |                   |-- append ev 3-->|
  |  (server: switch to poll)       |                   |                 |
  |-- poll c=2 --->|                |                   |                 |
  |                |------------------------------ read since 2 --------->|
  |<- ev 3 c=3 ----|                |                   |                 |
```

The events themselves stay boring on purpose. Something like:

| Field | What it is |
| --- | --- |
| `turn_id` | The handle the client keeps |
| `cursor` | Monotonic id on the turn log |
| `type` | `paragraph`, `tool_start`, `tool_result`, `final`, `error`, `cancelled` |
| `payload` | The bytes for that type |

The client protocol is just as small:

```
POST /turns                  -> { turn_id }
GET  /turns/{id}?cursor=n    -> { events, cursor }
GET  /turns/{id}/events?cursor=n   (SSE)
POST /turns/{id}/cancel
```

So what if the user never comes back? The worker still finishes, or it hits a deadline, and the events sit on the CD. The next time the conversation opens, short poll paints the missed tracks and you move on.

---

#### Good

- Resume is a cursor, not a second model call.
- The live socket is the length of one answer, not a held-open radio for the whole session.
- Paragraphs stay whole on the wire. Legal and compliance can read what the user read.
- After the turn, short poll picks up the slow stuff without keeping SSE warm.
- Cancel is a first-class event. Stoppable compute is not a special case glued on later.

#### Drawback

- You now have two read paths, poll and SSE, and they must agree on the same cursor. If they drift, the UI double-prints or skips.
- The Turn DB is on the hot path. If append is slow, the stream feels slow even when the model is fine.
- Short poll still costs you when nothing happened. You have to pick an interval that does not melt the gateway and does not feel dead.
- Exactly-once delivery is a lie. The client has to treat `cursor` as idempotent.

---

Next
----

The map has a lot of other boxes I am proud of, and I am going to leave them for later.

Next topic is the in-house agent loop, the prompt engineering, and how we manage context. After that, the daily eval that tells us the harness health every morning. Then the eval sandbox — synthetic fixtures, no PI / PII stored, patterns learned from production sampling.

link (coming soon)
