# Antigravity Agent Instructions — ATC Automata Lab

You are the implementation agent for **ATC Automata Lab**, an educational mini-project for Automata Theory and Computability.

## Your role
Build, run, test, and document the complete application. The other Markdown files are the project's requirements and design references:
- `01_PROJECT_OVERVIEW.md`
- `02_ALGORITHMS_AND_CORRECTNESS.md`
- `03_UI_UX_SPECIFICATION.md`
- `04_API_AND_DATA_MODEL.md`
- `05_TEST_PLAN.md`
- `06_SETUP_AND_DELIVERY.md`

Read all of them before implementing. Treat them as the project's source of truth. If documents conflict, prioritize algorithmic correctness in `02_ALGORITHMS_AND_CORRECTNESS.md`, then functional requirements in `01_PROJECT_OVERVIEW.md`. Explain unresolved conflicts instead of silently guessing.

## Required working method
1. Inspect the existing workspace and identify existing code before editing. Preserve useful work.
2. Create a concise implementation plan, then start implementation; do not stop to ask for approval unless a genuinely blocking ambiguity exists.
3. Implement the mathematical engine first and write tests for it.
4. Implement the Flask API and validate input on the server.
5. Implement the UI and interactive graph rendering.
6. Connect the real algorithms to the UI. Never substitute mocked results, hard-coded screenshots, or decorative-only controls.
7. Run automated tests, start the app, exercise key workflows, and fix issues.
8. Update documentation to match the actual implementation. Do not claim tests passed unless you ran them.

## Technology constraints
Use Python 3, Flask, HTML, CSS, vanilla JavaScript, Cytoscape.js for graphs, and `unittest`. Keep the app local and dependency-light. Do not add a database, login, cloud backend, paid API, React, or LLM integration unless a documented technical blocker makes an alternative necessary. Cytoscape.js may be loaded from a CDN; document that graph rendering requires internet access unless the library is vendored locally.

## Non-negotiable correctness rules
- Implement a real NFA model, including epsilon transitions and multiple destinations.
- Implement epsilon closure, NFA simulation, subset construction, and DFA simulation as specified in `02_ALGORITHMS_AND_CORRECTNESS.md`.
- A DFA must have exactly one transition per state per alphabet symbol; represent missing moves using the empty subset `∅`, which loops to itself on every alphabet symbol.
- Do not confuse the empty input string `""` with invalid input.
- Keep NFA simulation as a set of active states.
- DFA accepting subsets are those containing at least one accepting NFA state.
- Validate all inputs and show friendly errors.
- Comparing sample strings is a demonstration, not a formal proof of equivalence. Explain that correctly implemented subset construction preserves the language.
- The user may create an NFA manually or select a supported preset. Do not claim arbitrary natural-language-to-automaton generation is supported.

## Product scope
Implement these presets:
1. Binary strings ending in `01`.
2. Binary strings containing substring `110`.
3. Binary strings containing an even number of `0`s.

The user can select a preset, inspect/edit its generated NFA, convert it, and test strings. Also support manual NFA creation with alphabet symbols and `ε` transitions.

## Definition of done
The task is complete only when the app starts using documented commands; the manual editor and all presets work; NFA/DFA graphs and transition tables reflect actual automata data; conversion can be stepped through with explanations; synchronized string simulation works with Run, Step Next, Play, Pause, and Reset; state types are visually distinguishable and explained in a legend; tests pass for required algorithmic cases; and README contains actual setup/run/test commands.

At the end, report files changed, commands run, test results, how to launch the app, and limitations. If something cannot be tested, state that honestly.
