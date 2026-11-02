# UI/UX Specification — ATC Automata Lab

## 1. Design goals
The interface should feel like a compact teaching laboratory: clear, practical, readable, and easy to demonstrate on a classroom projector. Prioritize state changes and algorithm explanations over decorative animation.

## 2. Main layout
Use a responsive dashboard with three areas on desktop.

### A. Builder panel
Include mode selector (Preset / Manual NFA), preset selector and Generate button, alphabet editor, state list with add/rename/remove controls, initial-state selector, accepting-state controls, transition-table editor, validation messages, and Convert to DFA button.

### B. Visualization panel
Include NFA graph, conversion progress/explanation, DFA graph, NFA/DFA transition-table tabs or collapsible tables, and graph legend.

### C. Simulation panel
Include input-string field, Run / Step Next / Play / Pause / Reset, current input position, NFA active-state set, DFA active state, execution trace, separate final results, and agreement/disagreement message.

On smaller screens, stack sections vertically. Avoid horizontal scrolling.

## 3. Visual language
Use restrained colors and accessible contrast. Do not rely on color alone:
- Initial state: start arrow and optional `START` badge.
- Accepting state: double border.
- Normal state: single border.
- Empty subset/trap: dashed border and `∅` or `DEAD` label.
- Active state: distinct highlight plus active label or outline.
- Active edge: thicker/highlighted line and readable label.
- Invalid form: inline message near the control.

Include a legend explaining all node and edge styles.

## 4. Graph behavior
Use Cytoscape.js with directed edges and visible arrowheads. Labels should show transition symbols. Multiple labels between the same source and destination may be combined if unambiguous. Support zoom, pan, draggable nodes, readable automatic layout, graph redraw after edits, active-state highlighting, and graph updates during conversion playback.

## 5. Transition tables
Derive the table from current automaton data, not from a separate stale copy. NFA cells may show sets such as `{q1, q2}` or `∅`. Show epsilon transitions in an `ε` column if present, or consistently show the column for NFAs. DFA cells must show exactly one destination state per alphabet symbol. Mark initial and accepting states using symbols and labels.

## 6. Conversion controls
Show the initial epsilon-closure. Provide Next Step and Play/Pause. Display current subset, symbol, move result, epsilon-closure result, and discovery status. Add/highlight corresponding DFA nodes as steps advance. Reset conversion playback. When complete, show the full DFA graph and table.

If the NFA changes after conversion, invalidate the old DFA and clearly request reconversion. Never simulate against stale conversion data without warning.

## 7. String playback behavior
- `Run`: process the entire input and display the complete trace.
- `Step Next`: advance one input symbol; the initial state is visible before the first symbol is consumed.
- `Play`: advance repeatedly at a moderate interval.
- `Pause`: stop playback without resetting progress.
- `Reset`: return both machines to initial states and clear active trace/results.
- Empty input is valid and finishes without consuming a character.
- Disable controls when no valid automaton or required conversion is available.

Advance NFA and DFA at the same input position. Update both graphs and the trace at each step.

## 8. Results and messages
Show explicit text such as `NFA: ACCEPT`, `DFA: ACCEPT`, and `Verification: Both machines agree on this input.` Show corresponding rejection messages. If results differ, show `ERROR: NFA and DFA results differ. Check the implementation.` Never conceal a mismatch.

Validation should explain how to fix the issue, e.g. `Input contains symbol '2', which is not in the alphabet {0, 1}.`

## 9. Accessibility and polish
Use readable typography and spacing, descriptive button labels, keyboard focus states, and short plain-language algorithm explanations. Keep the default screen uncluttered; advanced/manual controls may be grouped in collapsible sections.
