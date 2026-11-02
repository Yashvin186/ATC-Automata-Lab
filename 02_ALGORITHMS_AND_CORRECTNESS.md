# Algorithms and Correctness Requirements

This document defines the mathematical behavior. Implement these rules exactly and test them independently of the UI.

## 1. Automaton model
Represent an NFA as:
- `states`: finite set of unique state identifiers;
- `alphabet`: finite set of input symbols, excluding `ε`;
- `start_state`: exactly one state in `states`;
- `accepting_states`: subset of `states`;
- `transitions`: mapping `(state, symbol)` to a set of destination states.

For epsilon transitions, use reserved key `ε` in the transition model, but do not include it in the input alphabet. A transition may have multiple destinations. A missing transition is equivalent to an empty destination set.

Use deterministic ordering when serializing states and subsets so UI output and tests are repeatable. Internally, subsets may be represented by `frozenset`.

## 2. Epsilon closure
`epsilon_closure(S)` returns all states reachable from any state in `S` by zero or more epsilon transitions.

Algorithm:
1. Initialize `closure = S`.
2. Initialize a stack/queue with every state in `S`.
3. Remove one state `q`.
4. For every epsilon destination of `q` not already in `closure`, add it to `closure` and the stack/queue.
5. Stop when the stack/queue is empty.
6. Return `closure`.

Include all original states in `S`. Handle cycles using a visited set. Epsilon edges consume no input; the empty input string is a different concept.

## 3. NFA move operation
`move(S, a)` is the union of all destinations reached by taking one transition labelled `a` from any state in `S`.

Formally: `move(S, a) = ⋃ δ(q, a)` for all `q ∈ S`.

Do not select just one path. If several active states can transition on the same symbol, include all destinations.

## 4. NFA string simulation
For input string `w = a1 a2 ... an`:
1. `current = epsilon_closure({start_state})`.
2. For each symbol `a` in `w`, validate `a` belongs to the alphabet; set `destinations = move(current, a)`; then set `current = epsilon_closure(destinations)`.
3. Record position, symbol, previous active set, destinations before epsilon closure, active set after closure, and relevant transition information.
4. Accept iff `current ∩ accepting_states` is non-empty after all input symbols are consumed.

For empty input, perform no symbol moves; acceptance depends on whether the start state's epsilon-closure intersects the accepting states.

## 5. Subset construction: NFA to DFA
Each DFA state corresponds to a subset of NFA states.

1. Initial subset: `D0 = epsilon_closure({start_state})`.
2. Initialize a queue with `D0`; mark it discovered.
3. While the queue is non-empty, remove subset `S`.
4. For each alphabet symbol `a`, calculate `T = epsilon_closure(move(S, a))`.
5. Record DFA transition `S --a--> T`.
6. If `T` has not been discovered, add it to discovered subsets and the queue.
7. Record a human-readable conversion step including current subset, symbol, raw move result, epsilon-closure result, and discovery status.
8. A subset `S` is accepting iff `S ∩ accepting_states` is non-empty.

### Empty subset / trap state
If a move has no destinations, its epsilon-closure is `∅`. If discovered, `∅` is a valid DFA state. For every alphabet symbol `a`, its transition must be `∅ --a--> ∅`. Do not omit required transitions or use a null destination in the final DFA.

### Completeness and determinism
For every generated DFA state and every alphabet symbol, there must be exactly one destination. There must be no duplicate DFA states representing the same subset. Include every reachable subset, including `∅` when reachable.

### Conversion playback data
Each step should include processed subset, symbol, raw move destinations, result after epsilon closure, whether the destination was newly discovered, and a short explanation. The final DFA must come from the actual algorithm, not from frontend animation logic.

## 6. DFA simulation
Start at the DFA initial state. For each input symbol, follow its unique transition and record previous state, symbol, next state, and position. Accept iff the final state is accepting. A missing transition in a supposedly complete DFA is an internal error, not a rejection shortcut.

## 7. Preset language definitions

### Preset A — Ends with `01`
`L = { w ∈ {0,1}* | w ends with 01 }`

Accepted: `01`, `101`, `1101`.  
Rejected: empty string, `0`, `1`, `10`, `111`, `010`.

### Preset B — Contains `110`
`L = { w ∈ {0,1}* | 110 occurs as a contiguous substring of w }`

Accepted: `110`, `0110`, `1101`.  
Rejected: empty string, `0`, `101`, `111`, `000`.

### Preset C — Even number of `0`s
`L = { w ∈ {0,1}* | the number of occurrences of 0 in w is even }`

Accepted: empty string, `1`, `00`, `10101`.  
Rejected: `0`, `10`, `000`.

The preset generator must create valid automata and verify them using the same simulator as user-created machines. Do not hard-code expected answers in the simulation path.

## 8. Equivalence statement
Subset construction produces a DFA equivalent to the source NFA when implemented according to this algorithm. Running strings through both machines is a useful visual demonstration and regression test, but testing finitely many strings alone does not prove equivalence.

## 9. Defensive behavior
Reject or clearly report duplicate/empty state names; missing or invalid initial state; accepting states not in the state set; transitions referring to unknown states; transition symbols outside the alphabet and `ε`; duplicate alphabet symbols; and invalid input characters. Do not crash on no accepting states, empty input, epsilon cycles, or a transition with no destinations.
