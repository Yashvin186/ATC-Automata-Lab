"""Pure mathematical model and algorithms for ATC Automata Lab.

This module is completely independent of Flask or any web frameworks.
It implements:
- NFA representation and validation
- Epsilon closure computation with cycle handling
- Move operations
- NFA string simulation tracking sets of active states
- Deterministic subset construction (NFA -> DFA) including trap/empty state handling
- DFA representation, validation, and deterministic simulation
"""

from typing import Dict, List, Set, Tuple, Any, Optional, Iterable
import collections

EPSILON = "ε"


class AutomataValidationError(ValueError):
    """Raised when an automaton specification or input string fails validation."""
    pass


class NFA:
    """Non-deterministic Finite Automaton with optional epsilon transitions."""

    def __init__(
        self,
        states: Iterable[str],
        alphabet: Iterable[str],
        start_state: str,
        accepting_states: Iterable[str],
        transitions: List[Dict[str, Any]],
    ) -> None:
        self.states = sorted(list(set(states)))
        self.alphabet = sorted(list(set(alphabet)))
        self.start_state = str(start_state)
        self.accepting_states = sorted(list(set(accepting_states)))

        # Map (state, symbol) -> set of destination states
        self.transitions: Dict[Tuple[str, str], Set[str]] = collections.defaultdict(set)
        for t in transitions:
            src = str(t["from"])
            sym = str(t["symbol"])
            targets = t["to"]
            if isinstance(targets, str):
                targets = [targets]
            for tgt in targets:
                self.transitions[(src, sym)].add(str(tgt))

    def rename_state(self, old_name: str, new_name: str) -> None:
        """Rename an existing state and update start, accepting states, and transitions."""
        if old_name not in self.states:
            raise AutomataValidationError(f"State '{old_name}' not found.")
        if not new_name.strip():
            raise AutomataValidationError("New state name cannot be empty.")
        if new_name in self.states and new_name != old_name:
            raise AutomataValidationError(f"State '{new_name}' already exists.")

        self.states = sorted(list(set(new_name if s == old_name else s for s in self.states)))
        if self.start_state == old_name:
            self.start_state = new_name
        self.accepting_states = sorted(list(set(new_name if s == old_name else s for s in self.accepting_states)))

        new_transitions = collections.defaultdict(set)
        for (src, sym), tgts in self.transitions.items():
            new_src = new_name if src == old_name else src
            new_tgts = {new_name if t == old_name else t for t in tgts}
            new_transitions[(new_src, sym)].update(new_tgts)
        self.transitions = new_transitions

    def validate(self) -> List[str]:
        """Validate automaton definition according to formal rules.
        
        Returns a list of error message strings (empty if valid).
        """
        errors = []
        if not self.states:
            errors.append("States set cannot be empty.")
        if any(not s.strip() for s in self.states):
            errors.append("State names cannot be empty or whitespace only.")
        if not self.alphabet:
            errors.append("Alphabet cannot be empty.")
        if EPSILON in self.alphabet:
            errors.append(f"Reserved epsilon symbol '{EPSILON}' must not be included in the input alphabet.")
        for a in self.alphabet:
            if len(a) != 1:
                errors.append(f"Alphabet symbol '{a}' must be a single character.")
        if not self.start_state:
            errors.append("A start state must be specified.")
        elif self.start_state not in self.states:
            errors.append(f"Start state '{self.start_state}' is not in the states set.")
        
        for acc in self.accepting_states:
            if acc not in self.states:
                errors.append(f"Accepting state '{acc}' is not in the states set.")

        valid_symbols = set(self.alphabet) | {EPSILON}
        for (src, sym), tgts in self.transitions.items():
            if src not in self.states:
                errors.append(f"Transition source state '{src}' is not in the states set.")
            if sym not in valid_symbols:
                errors.append(f"Transition symbol '{sym}' is neither in the alphabet nor '{EPSILON}'.")
            for tgt in tgts:
                if tgt not in self.states:
                    errors.append(f"Transition destination state '{tgt}' is not in the states set.")

        return errors

    def epsilon_closure(self, states: Iterable[str]) -> frozenset[str]:
        """Compute the epsilon closure for a set of states.
        
        Algorithm:
        1. Initialize closure = set(states).
        2. Initialize stack with all states in closure.
        3. While stack is not empty:
           Pop state q.
           For each state p reachable from q via an epsilon transition:
             If p is not in closure, add p to closure and push to stack.
        4. Return frozenset(closure).
        """
        closure = set(states)
        stack = list(closure)
        while stack:
            q = stack.pop()
            epsilon_destinations = self.transitions.get((q, EPSILON), set())
            for p in epsilon_destinations:
                if p not in closure:
                    closure.add(p)
                    stack.append(p)
        return frozenset(closure)

    def move(self, states: Iterable[str], symbol: str) -> frozenset[str]:
        """Compute move(S, a) = Union of delta(q, a) for all q in S."""
        destinations: Set[str] = set()
        for q in states:
            destinations.update(self.transitions.get((q, symbol), set()))
        return frozenset(destinations)

    def simulate(self, input_string: str) -> Dict[str, Any]:
        """Simulate the NFA on an input string.
        
        Maintains the set of all active states at each step.
        """
        # Validate input characters
        for idx, char in enumerate(input_string):
            if char not in self.alphabet:
                raise AutomataValidationError(
                    f"Input contains symbol '{char}' at index {idx}, which is not in the alphabet {set(self.alphabet)}."
                )

        initial_active = self.epsilon_closure([self.start_state])
        current = initial_active
        trace = []

        for idx, char in enumerate(input_string):
            prev_states = sorted(list(current))
            raw_destinations = self.move(current, char)
            next_active = self.epsilon_closure(raw_destinations)

            # Details on which transitions fired
            fired_transitions = []
            for q in prev_states:
                targets = self.transitions.get((q, char), set())
                if targets:
                    fired_transitions.append({
                        "from": q,
                        "symbol": char,
                        "to": sorted(list(targets))
                    })

            # Formulate clear pedagogical explanation for this step
            prev_str = "{" + ", ".join(prev_states) + "}"
            raw_str = "{" + ", ".join(sorted(list(raw_destinations))) + "}" if raw_destinations else "∅"
            act_str = "{" + ", ".join(sorted(list(next_active))) + "}" if next_active else "∅"

            if not raw_destinations:
                step_expl = f"From active states {prev_str}, no transitions exist on symbol '{char}'. Active set becomes ∅ (dead end)."
            elif raw_destinations == next_active:
                step_expl = f"Reading '{char}' from {prev_str} yields {raw_str}. No spontaneous ε-transitions exist from these destinations."
            else:
                step_expl = f"Reading '{char}' from {prev_str} yields raw moves {raw_str}. Computing ε-closure expands active set to {act_str}."

            trace.append({
                "step_index": idx + 1,
                "char_index": idx,
                "symbol": char,
                "prev_active": prev_states,
                "raw_destinations": sorted(list(raw_destinations)),
                "active_states": sorted(list(next_active)),
                "fired_transitions": fired_transitions,
                "explanation": step_expl,
            })
            current = next_active

        final_states = sorted(list(current))
        is_accepted = any(q in self.accepting_states for q in current)

        return {
            "initial_active": sorted(list(initial_active)),
            "trace": trace,
            "final_states": final_states,
            "is_accepted": is_accepted,
            "input_string": input_string,
        }

    def to_dict(self) -> Dict[str, Any]:
        """Serialize NFA to dictionary representation."""
        serialized_transitions = []
        for (src, sym), tgts in sorted(self.transitions.items()):
            if tgts:
                serialized_transitions.append({
                    "from": src,
                    "symbol": sym,
                    "to": sorted(list(tgts))
                })
        return {
            "states": self.states,
            "alphabet": self.alphabet,
            "start_state": self.start_state,
            "accepting_states": self.accepting_states,
            "transitions": serialized_transitions,
        }


class DFA:
    """Deterministic Finite Automaton produced by subset construction."""

    def __init__(
        self,
        states: List[str],
        subset_map: Dict[str, List[str]],
        alphabet: List[str],
        start_state: str,
        accepting_states: List[str],
        transitions: Dict[Tuple[str, str], str],
        conversion_steps: Optional[List[Dict[str, Any]]] = None,
        trap_state_id: Optional[str] = None,
    ) -> None:
        self.states = states
        self.subset_map = subset_map  # state_id -> sorted list of NFA states
        self.alphabet = alphabet
        self.start_state = start_state
        self.accepting_states = accepting_states
        self.transitions = transitions  # (state_id, symbol) -> state_id
        self.conversion_steps = conversion_steps or []
        self.trap_state_id = trap_state_id

    def simulate(self, input_string: str) -> Dict[str, Any]:
        """Simulate the DFA on an input string.
        
        Follows the unique transition for each symbol.
        """
        for idx, char in enumerate(input_string):
            if char not in self.alphabet:
                raise AutomataValidationError(
                    f"Input contains symbol '{char}' at index {idx}, which is not in the alphabet {set(self.alphabet)}."
                )

        current = self.start_state
        trace = []

        for idx, char in enumerate(input_string):
            prev_state = current
            next_state = self.transitions.get((prev_state, char))
            if next_state is None:
                raise RuntimeError(
                    f"Internal Error: Incomplete DFA! No transition from state '{prev_state}' on symbol '{char}'."
                )

            prev_sub = self.subset_map.get(prev_state, [])
            next_sub = self.subset_map.get(next_state, [])
            prev_sub_str = "{" + ", ".join(prev_sub) + "}" if prev_sub else "∅"
            next_sub_str = "{" + ", ".join(next_sub) + "}" if next_sub else "∅"
            if not next_sub:
                dfa_expl = f"DFA follows transition on '{char}' into trap state {next_state} = ∅."
            else:
                dfa_expl = f"DFA follows deterministic transition on '{char}': {prev_state} ({prev_sub_str}) → {next_state} ({next_sub_str})."

            trace.append({
                "step_index": idx + 1,
                "char_index": idx,
                "symbol": char,
                "prev_state": prev_state,
                "prev_subset": prev_sub,
                "next_state": next_state,
                "next_subset": next_sub,
                "explanation": dfa_expl,
            })
            current = next_state

        is_accepted = current in self.accepting_states
        return {
            "initial_state": self.start_state,
            "initial_subset": self.subset_map.get(self.start_state, []),
            "trace": trace,
            "final_state": current,
            "final_subset": self.subset_map.get(current, []),
            "is_accepted": is_accepted,
            "input_string": input_string,
        }

    def to_dict(self) -> Dict[str, Any]:
        """Serialize DFA to dictionary representation."""
        serialized_transitions = []
        for (src, sym), tgt in sorted(self.transitions.items()):
            serialized_transitions.append({
                "from": src,
                "symbol": sym,
                "to": tgt,
            })

        state_labels = {}
        compact_labels = {}
        for s in self.states:
            subset = self.subset_map.get(s, [])
            if not subset:
                state_labels[s] = f"{s} = ∅"
                compact_labels[s] = "∅"
            else:
                state_labels[s] = f"{s} = {{{', '.join(subset)}}}"
                compact_labels[s] = s

        return {
            "states": self.states,
            "subset_map": self.subset_map,
            "state_labels": state_labels,
            "compact_labels": compact_labels,
            "alphabet": self.alphabet,
            "start_state": self.start_state,
            "accepting_states": self.accepting_states,
            "transitions": serialized_transitions,
            "conversion_steps": self.conversion_steps,
            "trap_state_id": self.trap_state_id,
        }


def subset_construction(nfa: NFA) -> DFA:
    """Convert an NFA into a minimal-equivalent complete DFA via subset construction.
    
    Guarantees:
    - Every DFA state corresponds to a unique subset of NFA states.
    - Initial DFA state is epsilon_closure({nfa.start_state}).
    - Empty subset '∅' is created and mapped to a trap state if reachable.
    - Every DFA state has exactly one transition for each alphabet symbol.
    - Subsets intersecting nfa.accepting_states are marked accepting.
    - Deterministic state ordering and generation of detailed conversion narration steps.
    """
    errors = nfa.validate()
    if errors:
        raise AutomataValidationError(f"Invalid NFA specification: {'; '.join(errors)}")

    # Initial subset D0
    initial_subset = nfa.epsilon_closure([nfa.start_state])
    
    # Map frozenset -> state_id
    subset_to_id: Dict[frozenset[str], str] = {}
    id_to_subset: Dict[str, List[str]] = {}
    
    def format_subset_label(s_set: frozenset[str]) -> str:
        if not s_set:
            return "∅"
        return "{" + ", ".join(sorted(list(s_set))) + "}"

    # Assign D0
    d0_id = "D0"
    subset_to_id[initial_subset] = d0_id
    id_to_subset[d0_id] = sorted(list(initial_subset))

    queue: collections.deque[frozenset[str]] = collections.deque([initial_subset])
    dfa_transitions: Dict[Tuple[str, str], str] = {}
    conversion_steps: List[Dict[str, Any]] = []
    
    # Counter for newly discovered subsets: D0, D1, D2, ...
    next_id_num = 1
    trap_state_id: Optional[str] = None
    if not initial_subset:
        trap_state_id = d0_id

    # Record initial discovery step
    conversion_steps.append({
        "step_index": 0,
        "type": "INITIAL",
        "current_state_id": d0_id,
        "current_subset": id_to_subset[d0_id],
        "symbol": None,
        "raw_destinations": [nfa.start_state],
        "closure_result": id_to_subset[d0_id],
        "target_state_id": d0_id,
        "is_new_state": True,
        "explanation": (
            f"Compute ε-closure of start state '{nfa.start_state}': "
            f"ε-closure({{{nfa.start_state}}}) = {format_subset_label(initial_subset)}. "
            f"Designated as initial DFA state {d0_id}."
        )
    })

    while queue:
        current_subset = queue.popleft()
        current_id = subset_to_id[current_subset]

        for sym in nfa.alphabet:
            raw_move = nfa.move(current_subset, sym)
            closure_res = nfa.epsilon_closure(raw_move)

            is_new = False
            if closure_res not in subset_to_id:
                is_new = True
                new_id = f"D{next_id_num}"
                next_id_num += 1
                subset_to_id[closure_res] = new_id
                id_to_subset[new_id] = sorted(list(closure_res))
                queue.append(closure_res)
                if not closure_res and trap_state_id is None:
                    trap_state_id = new_id

            target_id = subset_to_id[closure_res]
            dfa_transitions[(current_id, sym)] = target_id

            # Prepare step explanation
            curr_lbl = format_subset_label(current_subset)
            raw_lbl = format_subset_label(raw_move)
            clos_lbl = format_subset_label(closure_res)

            if is_new:
                if not closure_res:
                    explanation = (
                        f"From {current_id} ({curr_lbl}) on '{sym}': move -> {raw_lbl}, "
                        f"ε-closure -> {clos_lbl}. Discovered new trap state {target_id} = ∅."
                    )
                else:
                    explanation = (
                        f"From {current_id} ({curr_lbl}) on '{sym}': move -> {raw_lbl}, "
                        f"ε-closure -> {clos_lbl}. Discovered new subset state {target_id} = {clos_lbl}."
                    )
            else:
                explanation = (
                    f"From {current_id} ({curr_lbl}) on '{sym}': move -> {raw_lbl}, "
                    f"ε-closure -> {clos_lbl}. Transitions to existing state {target_id}."
                )

            conversion_steps.append({
                "step_index": len(conversion_steps),
                "type": "TRANSITION",
                "current_state_id": current_id,
                "current_subset": id_to_subset[current_id],
                "symbol": sym,
                "raw_destinations": sorted(list(raw_move)),
                "closure_result": id_to_subset[target_id],
                "target_state_id": target_id,
                "is_new_state": is_new,
                "explanation": explanation,
            })

    # Order DFA states consistently: D0, D1, D2, ...
    ordered_states = sorted(list(subset_to_id.values()), key=lambda sid: int(sid[1:]))

    # Determine accepting DFA states
    nfa_accepting_set = set(nfa.accepting_states)
    dfa_accepting_states = [
        sid for sid in ordered_states
        if any(q in nfa_accepting_set for q in id_to_subset[sid])
    ]

    return DFA(
        states=ordered_states,
        subset_map=id_to_subset,
        alphabet=nfa.alphabet,
        start_state=d0_id,
        accepting_states=dfa_accepting_states,
        transitions=dfa_transitions,
        conversion_steps=conversion_steps,
        trap_state_id=trap_state_id,
    )

