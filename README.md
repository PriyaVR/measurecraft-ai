# 🚀 MeasureCraft: AI-Powered Measurement Plan Generator


MeasureCraft is an intelligent, agentic web application designed to bridge the gap between business goals and technical digital analytics implementation. It transforms vague business objectives, industry contexts, and preferred tracking tools (such as GA4) into structured, implementation-ready measurement plans in seconds.

---

## 🌟 The Problem It Solved
Defining digital tracking strategies—such as selecting core Key Performance Indicators (KPIs), mapping out behavioral user-journey events, and structuring parameter schemas in clean `snake_case`—is traditionally manual and fragmented. MeasureCraft automates this workflow while embedding intelligent guardrails to ensure high-quality data outputs.

---

## 🛠️ Tech Stack & Architecture
* **Frontend & Client Architecture:** Built as a modern, high-performance web app designed for seamless client-side execution.
* **Hosting & Deployment:** Deployed via **Netlify** (`https://measurecraft-ai.netlify.app/`)[cite: 4] linked directly to a public **GitHub** repository (`measurecraft-ai`), bypassing complex cloud billing requirements.
* **AI Integration:** Powered by direct Gemini API integration configured via environment variables for secure, serverless client-side execution.

---

## 🎯 AI Solution Canvas Testing Scenarios
To ensure robust and responsible AI behavior, MeasureCraft was rigorously tested across three core behavioral scenarios:

1. **The Good Case (The Ideal Path):** 
   * *Input:* `"Reduce checkout drop-off and improve order completion on mobile checkout"`
   * *Behavior:* Instantly generates a comprehensive, perfectly formatted measurement plan split into executive context, KPIs, behavioral events, and a unified `snake_case` parameter tracking table.
2. **The Bad Case (The Vague Path):** 
   * *Input:* `"Make the site better"`
   * *Behavior:* Halts generation and prompts the user with targeted clarifying questions to extract a scoped objective.
3. **The Worst / Edge Case (The Out-of-Scope Path):** 
   * *Input:* `"How do I write CSS flexbox code to make my app responsive?"`
   * *Behavior:* Filters out non-analytics or technical coding queries and displays a refusal boundary banner.

---

## 🚀 Live Demo & Repository
* **🚀 Live Application:** [https://measurecraft-ai.netlify.app/](https://measurecraft-ai.netlify.app/)[cite: 4]
* **💻 GitHub Source Code:** [https://github.com/PriyaVR/measurecraft-ai](https://github.com/PriyaVR/measurecraft-ai)
