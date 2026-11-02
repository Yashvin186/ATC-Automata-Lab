# Test Plan — ATC Automata Lab

## 1. Purpose
Verify mathematical correctness independently of visual presentation, then verify that the UI correctly reflects algorithm results.

## 2. Unit tests: core algorithms
- **T-01 Epsilon closure includes source:** a state with no epsilon edges has closure containing itself.
- **T-02 Epsilon chain:** `q0 --ε--> q1 --ε--> q2` gives all three states in closure of `{q0}`.
- **T-03 Epsilon cycle:** `q0 --ε--> q1` and `q1 --ε--> q0` terminates and returns both.
- **T-04 Multiple closure sources:** closure includes epsilon-reachable states from every source state.
- **T-05 NFA move combines destinations:** moves from all active states are unioned.
- **T-06 NFA simulation tracks every branch:** it must not choose only one path.
- **T-07 Empty-input NFA behavior:** acceptance depends on epsilon-closure of the start state.
- **T-08 DFA initial subset:** equals epsilon-closure of the NFA start state.
- **T-09 Accepting subsets:** accepting iff the subset intersects the NFA accepting set.
- **T-10 Complete DFA:** every state has exactly one transition per alphabet symbol.
- **T-11 Empty subset trap:** if `∅` exists, it loops to itself on every alphabet symbol.
- **T-12 No duplicate subsets:** no two DFA IDs represent the same subset.
- **T-13 DFA simulation:** exactly one transition per symbol.
- **T-14 Invalid symbols:** return a validation error rather than silently ignoring a symbol.

## 3. Preset tests
For each preset, test the examples defined in `02_ALGORITHMS_AND_CORRECTNESS.md`:
- Ends with `01`: accepted `01`, `101`, `1101`; rejected empty string, `0`, `1`, `10`, `111`, `010`.
- Contains `110`: accepted `110`, `0110`, `1101`; rejected empty string, `0`, `101`, `111`, `000`.
- Even number of `0`s: accepted empty string, `1`, `00`, `10101`; rejected `0`, `10`, `000`.

Run each string through the generated automaton, not a separate hard-coded answer function.

## 4. NFA/DFA agreement regression
For presets and manually defined NFAs, compare NFA and converted-DFA outcomes for empty input, all one-symbol strings, multiple two-/three-symbol strings, and longer examples. Where practical, generate all strings up to a small length. This is a regression test, not the formal proof of equivalence.

## 5. Validation tests
Test duplicate/empty state names; missing or unknown initial state; unknown accepting state; unknown transition source/destination; invalid transition symbol; epsilon included in alphabet; duplicate alphabet symbol; malformed transition structure; and unsupported input symbols.

## 6. UI smoke tests
1. App loads with no JavaScript errors.
2. Every preset populates its table and graph.
3. Manual edits update the NFA graph/table.
4. Conversion steps update explanation and DFA graph.
5. Run displays a complete trace.
6. Step Next advances exactly one symbol.
7. Play/Pause work without overlapping timers.
8. Reset restores the start position and clears results.
9. Invalid input displays a helpful message.
10. Both graphs highlight corresponding states at each step.
11. Responsive layout remains usable on a narrow window.

## 7. Reporting
Report the actual test command, number of tests run, and pass/fail status. Do not report unexecuted tests as passing.
