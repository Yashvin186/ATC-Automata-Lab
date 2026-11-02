# Algorithm Notes — ATC Automata Lab

## NFA simulation
The simulator maintains a set of currently active NFA states. Before consuming input, it takes the epsilon-closure of the initial state. For each character, it collects all destinations reachable from any active state on that character, then takes the epsilon-closure of the result. The string is accepted if at least one active state is accepting after all characters are consumed.

## Epsilon closure
`epsilon_closure(S)` is the set containing every state in `S` plus every state reachable from `S` using zero or more epsilon transitions. Use a stack or queue and a visited set to avoid revisiting states.

## Subset construction
Each DFA state represents a set of NFA states:
1. Initial DFA state = epsilon-closure of the NFA initial state.
2. For each unprocessed subset `S` and each input symbol `a`, calculate `epsilon_closure(move(S, a))`.
3. If the resulting subset has not been seen, add it to the work queue.
4. Record the transition from `S` on `a` to that subset.
5. A DFA subset is accepting if it intersects the NFA accepting-state set.
6. If the destination is empty, represent it as the empty subset `∅`. It loops to itself on all alphabet symbols.

## DFA simulation
A DFA has exactly one active state. For every input character, follow the unique transition. Accept if the final state is marked accepting.

## Equivalence
The subset-construction algorithm guarantees language equivalence when implemented correctly. Running example strings on both machines is a useful demonstration and regression check, but does not alone prove equivalence for every possible string.
