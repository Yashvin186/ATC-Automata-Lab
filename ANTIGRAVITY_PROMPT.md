# Antigravity Build Prompt — ATC Automata Simulator

Build a small, polished educational web app named **ATC Automata Lab** for an Automata Theory and Computability mini-project.

## First: inspect, then implement
1. Inspect the existing workspace before changing anything.
2. If it already contains a project, preserve useful code and explain the plan before making destructive changes.
3. If it is empty, create the project structure described in `PROJECT_SPEC.md`.
4. Read `PROJECT_SPEC.md` and `README.md` before implementation.
5. Implement a working end-to-end application, not just a mockup. Run it and test the main flows.

## Product goal
A student should be able to:
- create an NFA manually using a transition table, including epsilon transitions;
- choose a supported language template to generate an automaton automatically;
- convert an NFA to a DFA step-by-step using subset construction;
- enter a string and simulate it on the NFA and DFA side-by-side;
- see initial, accepting, normal, and dead/trap states clearly;
- understand why the input is accepted or rejected from a readable trace.

Keep it minimal, reliable, and suitable for a college demonstration. Do not add login, database, AI API, accounts, or unnecessary frameworks.

## Preferred stack
- Python 3 + Flask backend
- Plain HTML, CSS, and vanilla JavaScript frontend
- Cytoscape.js for interactive state graphs, loaded from a CDN
- Python `unittest` for algorithm tests

If the workspace or environment makes this exact stack impractical, explain why and use the smallest reasonable alternative.

## Important product rules
- Do not pretend arbitrary natural-language descriptions can always be converted to automata. Support a small, explicit set of language templates and show a helpful message for unsupported descriptions.
- Provide a manual NFA editor as a first-class path.
- The alphabet for the first version is configurable but limited to single-character symbols such as `0` and `1`. Reserve `ε` for epsilon transitions; it is not an input character.
- Subset construction must correctly handle epsilon-closure, multiple destinations, unreachable subsets, and the empty subset (dead/trap state) when needed.
- A DFA must have exactly one transition per state per alphabet symbol. If a destination set is empty, represent it as the empty-set state and give it self-loops for all alphabet symbols.
- Final DFA states are every subset containing at least one accepting NFA state.
- Simulating an NFA must track a *set* of active states, not choose one arbitrary path.
- A string is accepted by an NFA if at least one active state after consuming the whole input is accepting.
- A string is accepted by a DFA if its final state is accepting.
- Side-by-side string testing is useful verification, but do not label a few test strings as a formal proof of equivalence. Explain that subset construction preserves the language by construction.
- Validate user input and show friendly errors instead of crashing.
- Avoid fake controls, hard-coded graph screenshots, and placeholder algorithm output.

## UI direction
Create a clean, responsive, dark-on-light educational dashboard with restrained accent colors, clear spacing, and no visual clutter. Use a three-part layout on desktop:
1. **Build**: alphabet, state list, initial state, accepting states, transition table, preset selector.
2. **Visualize**: NFA graph above and converted DFA graph below.
3. **Simulate**: string input, Run / Step Next / Play / Pause / Reset, trace, and ACCEPT / REJECT status.

On mobile, stack the panels vertically. Graph nodes should be visually distinct:
- initial state: a visible incoming start arrow;
- accepting state: double border;
- ordinary state: single border;
- dead/trap state: dashed border and a clear `∅` or `Dead` label;
- active state(s): highlighted;
- current transition: highlighted when practical.

Provide a legend. Do not rely on color alone: use labels and border shapes too.

## Required implementation sequence
1. Set up Flask routes and a simple front end.
2. Implement and unit-test the automata model and algorithms in Python.
3. Build the manual transition-table editor and validation.
4. Add supported language templates.
5. Add NFA and DFA graph rendering.
6. Add step-by-step conversion narration.
7. Add synchronized NFA/DFA string simulation controls and trace.
8. Add reset/error/empty-input handling and responsive styling.
9. Run tests, fix issues, and document how to start the app.

## Must-have demo cases
- A preset for strings over `{0,1}` that end with `01`.
- A preset for strings over `{0,1}` that contain substring `110`.
- A preset for strings over `{0,1}` containing an even number of `0`s.
- Empty string behavior.
- An NFA with epsilon transitions.
- A string that is rejected and reaches the dead/trap state in the DFA.
- A multi-destination NFA transition.
- A transition-table validation error.

## Deliverables
- Working source code
- `README.md` with setup and run commands
- `PROJECT_SPEC.md`
- Unit tests for epsilon closure, NFA simulation, subset construction, DFA completeness, and acceptance agreement on several test strings
- A short explanation of algorithms and limitations

Do not stop after creating the initial files. Implement the actual app, run the tests, and report:
1. files created/changed;
2. exact run command;
3. tests executed and results;
4. known limitations.
