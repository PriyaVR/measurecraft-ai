# 🚀 MeasureCraft: AI-Powered Measurement Plan Generator

MeasureCraft is an intelligent, agentic web application designed to bridge the gap between high-level business goals and technical digital analytics implementation. It transforms vague business objectives, industry contexts, and preferred tracking tools (such as GA4 or Adobe Analytics) into structured, implementation-ready measurement plans in seconds.

---

## 🌟 The Problem It Solves
Defining digital tracking strategies—such as selecting core Key Performance Indicators (KPIs), mapping out behavioral user-journey events, and structuring parameter schemas in clean `snake_case`—is traditionally manual, fragmented, and prone to miscommunication between stakeholders. Non-technical teams often struggle to articulate precise data needs, leading to poorly tracked user flows and messy analytics configurations.

---

## 🛠️ Core Features
* **Dynamic Context Parsing:** Tailors outputs based on custom business goals, industry verticals (e.g., E-commerce, Fintech, SaaS), platform requirements (Web vs. Mobile), and chosen analytics platforms.
* **Multi-Tier Plan Generation:** Automatically outputs structured data split into:
  1. *Executive Context & Scope*
  2. *Section 1: Key Performance Indicators (KPIs)* with macro/micro definitions and calculation logic.
  3. *Section 2: Events to Track* with standardized trigger conditions and payload parameters.
  4. *Section 3: Unified Tracking Plan Table* featuring clean `snake_case` naming ready for immediate copy-pasting or CSV export.
* **Intelligent Guardrails:** Built following the **AI Solution Canvas** framework to gracefully handle ambiguous prompts, out-of-scope technical queries (e.g., front-end coding help), and informational requests via targeted clarification checkpoints.

---

## 🎯 AI Solution Canvas Validation
To ensure production readiness and responsible AI behavior, MeasureCraft was rigorously tested across three core behavioral scenarios:

1. **The Good Case (The Ideal Path):** 
   * *Input:* `"Increase newsletter signups on our e-commerce checkout page"`
   * *Behavior:* Bypasses friction and immediately generates a comprehensive, perfectly formatted measurement plan across all three schema sections.
2. **The Bad Case (The Vague Path):** 
   * *Input:* `"Make the site better"`
   * *Behavior:* Recognizes ambiguity, halts table generation, and prompts the user with clarifying questions to extract a precise objective.
3. **The Worst / Edge Case (The Out-of-Scope Path):** 
   * *Input:* `"How do I write CSS flexbox code to make my app responsive?"`
   * *Behavior:* Filters out non-analytics or technical queries, refuses to hallucinate an onboarding template, and politely displays a refusal boundary banner.

---

## 🚀 How to Run Locally

If you want to review or run the source code locally:

1. **Prerequisites:** Make sure you have [Node.js](https://nodejs.org/) installed on your machine.
2. **Install Dependencies:**
   ```bash
   npm install
