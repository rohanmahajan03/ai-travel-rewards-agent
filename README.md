# AI Travel Rewards Agent

An autonomous AI agent that helps users maximize the value of their travel rewards.

Instead of requiring users to manually monitor transfer bonuses, airline award availability, and redemption opportunities, the goal of this project is to build an agent that continuously discovers opportunities, reasons about which ones matter to each user, and proactively surfaces the highest-value recommendations.

---

## Motivation

Travel rewards are surprisingly difficult to optimize.

Finding exceptional redemptions often requires monitoring multiple credit card programs, airline partners, transfer bonuses, award availability, and cash prices simultaneously. Most people simply don't have the time to constantly search for these opportunities.

This project explores whether an AI agent can perform that work automatically.

Rather than acting as a chatbot, the long-term vision is for the system to operate autonomously by discovering opportunities, gathering information, evaluating tradeoffs, and deciding when a recommendation is valuable enough to notify the user.

---

## Goals

This project is primarily an exploration of production AI engineering.

Areas I plan to explore include:

- Autonomous AI agents
- Tool calling
- Long-running workflows
- Browser automation
- Structured outputs
- Agent memory
- Recommendation systems
- Evaluation pipelines
- Production deployment
- Observability

---

## Planned Features

- Personalized travel preferences
- Credit card point tracking
- Transfer bonus monitoring
- Award travel discovery
- Personalized opportunity ranking
- Proactive notifications
- Explainable recommendations
- Continuous learning from user feedback

---

## Current Status

Early development

The first milestone is intentionally focused on building a solid product foundation before introducing autonomous agent workflows.

Current priorities include:

- User accounts
- Preference management
- Point balance tracking
- Opportunity data model
- Initial dashboard
- Deployment infrastructure

Once the core application is stable, the focus will shift toward autonomous planning, tool orchestration, and continuous opportunity discovery.

---

## Tech Stack

The implementation details are intentionally left flexible while the project evolves.

Current planned technologies include:

- Python
- FastAPI
- PostgreSQL
- React / Next.js
- Docker
- Docker Compose

Additional infrastructure and AI components will be introduced as the architecture matures.

---

## Roadmap

### Phase 1 — Foundation

- [ ] User authentication
- [ ] User preferences
- [ ] Point balances
- [ ] Dashboard
- [ ] Opportunity model
- [ ] Local development environment

### Phase 2 — Data Collection

- [ ] Transfer bonus ingestion
- [ ] Opportunity ingestion
- [ ] Caching layer
- [ ] Opportunity ranking

### Phase 3 — AI Agent

- [ ] Tool calling
- [ ] Planning loop
- [ ] Recommendation generation
- [ ] Explanation generation

### Phase 4 — Automation

- [ ] Scheduled workflows
- [ ] Notifications
- [ ] User feedback
- [ ] Agent memory

### Phase 5 — Evaluation

- [ ] Agent run logging
- [ ] Tool tracing
- [ ] Recommendation evaluation
- [ ] Performance metrics

---

## Why I'm Building This

I'm building this project to deepen my understanding of modern AI systems.

My goal is to deepen my understanding of how production AI applications are designed, deployed, evaluated, and maintained while building something that solves a real problem for travelers.

The implementation will evolve over time as I experiment with different architectures and approaches.
