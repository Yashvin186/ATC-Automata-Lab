# ATC Automata Lab — Project Overview and Functional Requirements

## 1. Project identity
**Title:** ATC Automata Lab: Interactive NFA-to-DFA Conversion and String Simulation  
**Course:** Automata Theory and Computability (ATC)

## 2. Problem statement
Students often learn NFA, DFA, transition tables, subset construction, and language acceptance as separate theoretical topics. This project combines them in one interactive simulator where a user can build an automaton, visualize its transitions, convert an NFA to a DFA, and step through strings to inspect acceptance or rejection.

## 3. Objective
Develop a lightweight educational web application that demonstrates the relationship between NFAs and DFAs through real algorithms and interactive visual feedback.

## 4. User journey
1. Open the local web app.
2. Choose **Preset Language** or **Build NFA Manually**.
3. Inspect and, where supported, edit the NFA transition table.
4. View the NFA graph.
5. Select **Convert to DFA** and step through subset construction.
6. Inspect the generated DFA graph and transition table.
7. Enter a string over the selected alphabet.
8. Run or step through synchronized NFA and DFA execution.
9. Read the traces and compare final ACCEPT/REJECT results.

## 5. Functional requirements

### FR-1 — Preset language generation
Provide these presets:
- `ENDS_WITH_01`: all binary strings whose final two symbols are `01`.
- `CONTAINS_110`: all binary strings containing `110` as a contiguous substring.
- `EVEN_NUMBER_OF_0S`: all binary strings containing an even number of `0` symbols.

Selecting a preset must create a valid automaton, initial state, accepting state set, alphabet, and transition table. Do not hard-code acceptance results separately from the machine.

### FR-2 — Manual NFA editor
Allow the user to choose an alphabet of distinct single-character symbols; add, rename, and remove states; select exactly one initial state; mark zero or more accepting states; add/edit/delete transitions; specify zero, one, or multiple destination states per source-state/input-symbol pair; add epsilon transitions using `ε`; and inspect a transition table derived from the current machine.

For an NFA, a state/symbol pair maps to a set of destination states. A missing transition means the empty destination set. State names must be unique. Alphabet symbols must not include the reserved epsilon marker.

### FR-3 — NFA visualization
Render the actual machine as a directed graph. Show all states, directed transitions, and labels. Combine labels when multiple symbols share the same source and destination if this improves readability, without changing semantics.

### FR-4 — NFA-to-DFA conversion
Convert the current NFA into a language-equivalent DFA using subset construction. Display the generated DFA and its transition table. Support a step-by-step explanation of each processed subset/symbol and newly discovered subset.

### FR-5 — String simulation
Allow input strings over the configured alphabet. Provide Run, Step Next, Play, Pause, and Reset controls. NFA and DFA execution must be synchronized by input position. Show current state(s), consumed symbol, transition result, and trace. Empty input is valid. Invalid symbols must produce a clear validation message.

### FR-6 — Results
At the end of input, show the NFA result and DFA result independently. If the results differ, display an implementation-error warning. The application must not alter results to make the machines agree.

### FR-7 — State appearance
Distinguish initial state with a start arrow/marker; accepting state with double border; ordinary state with single border; empty-subset/trap state with a dashed border and clear `∅` or `Dead` label; active states and active transitions with highlights. Use labels and border styles in addition to color. Include a legend.

### FR-8 — Preset language description
Optionally map a small set of documented phrases to the three presets. For unsupported descriptions, show a helpful message and direct the user to presets or manual construction. Do not use an LLM or claim general natural-language understanding.

## 6. Scope boundaries
In scope: single-character finite alphabets; NFAs with optional epsilon transitions; subset construction; interactive graph and transition-table views; example presets; local execution and automated tests.

Out of scope for version 1: arbitrary English descriptions converted into automata; regular-expression compiler; DFA minimization; grammar/PDA/Turing machine support; accounts, database, cloud storage, AI API, or multiplayer collaboration.

## 7. Suggested technology stack
Python 3, Flask, HTML templates, CSS, vanilla JavaScript, Cytoscape.js, and Python `unittest`. Keep algorithm logic separate from web routes and UI code.

## 8. Definition of success
A user can create or load an NFA, inspect its table and graph, convert it to a complete DFA step by step, simulate accepted and rejected strings, and understand the result from the execution trace. Algorithmic tests pass.
