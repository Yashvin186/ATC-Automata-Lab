"""Comprehensive Unit Tests for ATC Automata Lab.

Implements all tests specified in 05_TEST_PLAN.md:
- Core mathematical algorithms (T-01 through T-14)
- Presets A, B, C acceptance & rejection
- NFA and DFA agreement regression tests
- Defensive validation tests
"""

import unittest
import itertools
from automata import NFA, DFA, subset_construction, AutomataValidationError, EPSILON
from presets import (
    build_ends_with_01,
    build_contains_110,
    build_even_number_of_0s,
    build_epsilon_demo,
    match_natural_language_phrase,
)


class TestEpsilonClosure(unittest.TestCase):
    """Test suite for epsilon closure operations."""

    def test_t01_epsilon_closure_includes_source(self):
        """T-01: A state with no epsilon edges has closure containing itself."""
        nfa = NFA(
            states=["q0", "q1"],
            alphabet=["0"],
            start_state="q0",
            accepting_states=["q1"],
            transitions=[{"from": "q0", "symbol": "0", "to": ["q1"]}],
        )
        closure = nfa.epsilon_closure(["q0"])
        self.assertEqual(closure, frozenset(["q0"]))

    def test_t02_epsilon_chain(self):
        """T-02: q0 --ε--> q1 --ε--> q2 gives all three states in closure of {q0}."""
        nfa = NFA(
            states=["q0", "q1", "q2"],
            alphabet=["0"],
            start_state="q0",
            accepting_states=["q2"],
            transitions=[
                {"from": "q0", "symbol": EPSILON, "to": ["q1"]},
                {"from": "q1", "symbol": EPSILON, "to": ["q2"]},
            ],
        )
        closure = nfa.epsilon_closure(["q0"])
        self.assertEqual(closure, frozenset(["q0", "q1", "q2"]))

    def test_t03_epsilon_cycle(self):
        """T-03: q0 --ε--> q1 and q1 --ε--> q0 terminates cleanly and returns both."""
        nfa = NFA(
            states=["q0", "q1"],
            alphabet=["0"],
            start_state="q0",
            accepting_states=["q1"],
            transitions=[
                {"from": "q0", "symbol": EPSILON, "to": ["q1"]},
                {"from": "q1", "symbol": EPSILON, "to": ["q0"]},
            ],
        )
        closure = nfa.epsilon_closure(["q0"])
        self.assertEqual(closure, frozenset(["q0", "q1"]))

    def test_t04_multiple_closure_sources(self):
        """T-04: Closure includes epsilon-reachable states from every source state."""
        nfa = NFA(
            states=["q0", "q1", "q2", "q3"],
            alphabet=["0"],
            start_state="q0",
            accepting_states=["q3"],
            transitions=[
                {"from": "q0", "symbol": EPSILON, "to": ["q1"]},
                {"from": "q2", "symbol": EPSILON, "to": ["q3"]},
            ],
        )
        closure = nfa.epsilon_closure(["q0", "q2"])
        self.assertEqual(closure, frozenset(["q0", "q1", "q2", "q3"]))


class TestNFAMoveAndSimulation(unittest.TestCase):
    """Test suite for NFA move operations and simulation."""

    def test_t05_nfa_move_combines_destinations(self):
        """T-05: Moves from all active states on a symbol are unioned."""
        nfa = NFA(
            states=["q0", "q1", "q2", "q3"],
            alphabet=["0", "1"],
            start_state="q0",
            accepting_states=["q3"],
            transitions=[
                {"from": "q0", "symbol": "0", "to": ["q1", "q2"]},
                {"from": "q1", "symbol": "0", "to": ["q3"]},
            ],
        )
        move_res = nfa.move(["q0", "q1"], "0")
        self.assertEqual(move_res, frozenset(["q1", "q2", "q3"]))

    def test_t06_nfa_simulation_tracks_every_branch(self):
        """T-06: NFA simulation maintains all active states and explores all branches."""
        # NFA that accepts strings ending in '01'
        nfa = build_ends_with_01()
        res = nfa.simulate("001")
        self.assertTrue(res["is_accepted"])
        # On '0': from q0 -> {q0, q1}
        # On '0': from q0 -> {q0, q1}, from q1 -> empty => {q0, q1}
        # On '1': from q0 -> {q0}, from q1 -> {q2} => {q0, q2} (accepts)
        self.assertIn("q2", res["final_states"])

    def test_t07_empty_input_nfa_behavior(self):
        """T-07: Acceptance of empty string depends on epsilon closure of start state."""
        # Non-accepting start state without epsilon to accepting state
        nfa_reject = NFA(
            states=["q0", "q1"],
            alphabet=["0"],
            start_state="q0",
            accepting_states=["q1"],
            transitions=[],
        )
        self.assertFalse(nfa_reject.simulate("")["is_accepted"])

        # Start state is accepting
        nfa_accept1 = NFA(
            states=["q0", "q1"],
            alphabet=["0"],
            start_state="q0",
            accepting_states=["q0"],
            transitions=[],
        )
        self.assertTrue(nfa_accept1.simulate("")["is_accepted"])

        # Start state reaches accepting state via epsilon
        nfa_accept2 = NFA(
            states=["q0", "q1"],
            alphabet=["0"],
            start_state="q0",
            accepting_states=["q1"],
            transitions=[{"from": "q0", "symbol": EPSILON, "to": ["q1"]}],
        )
        self.assertTrue(nfa_accept2.simulate("")["is_accepted"])


class TestSubsetConstruction(unittest.TestCase):
    """Test suite for NFA-to-DFA subset construction."""

    def test_t08_dfa_initial_subset(self):
        """T-08: Initial DFA subset equals epsilon closure of the NFA start state."""
        nfa = NFA(
            states=["q0", "q1", "q2"],
            alphabet=["0", "1"],
            start_state="q0",
            accepting_states=["q2"],
            transitions=[{"from": "q0", "symbol": EPSILON, "to": ["q1"]}],
        )
        dfa = subset_construction(nfa)
        self.assertEqual(dfa.subset_map[dfa.start_state], ["q0", "q1"])

    def test_t09_accepting_subsets(self):
        """T-09: DFA subset is accepting iff it intersects NFA accepting set."""
        nfa = build_ends_with_01()
        dfa = subset_construction(nfa)
        for state_id in dfa.states:
            subset = set(dfa.subset_map[state_id])
            should_accept = bool(subset & set(nfa.accepting_states))
            self.assertEqual(state_id in dfa.accepting_states, should_accept)

    def test_t10_complete_dfa(self):
        """T-10: Complete DFA: every state has exactly one transition per alphabet symbol."""
        nfa = build_ends_with_01()
        dfa = subset_construction(nfa)
        for s in dfa.states:
            for sym in dfa.alphabet:
                target = dfa.transitions.get((s, sym))
                self.assertIsNotNone(target, f"Missing transition for state {s} on symbol {sym}")
                self.assertIn(target, dfa.states)

    def test_t11_empty_subset_trap(self):
        """T-11: Empty subset trap: if ∅ is reachable, it loops to itself on every alphabet symbol."""
        # NFA where '0' from start state leads to no state
        nfa = NFA(
            states=["q0", "q1"],
            alphabet=["0", "1"],
            start_state="q0",
            accepting_states=["q1"],
            transitions=[{"from": "q0", "symbol": "1", "to": ["q1"]}],
        )
        dfa = subset_construction(nfa)
        # There must be a trap state representing empty subset []
        trap_states = [s for s, sub in dfa.subset_map.items() if len(sub) == 0]
        self.assertEqual(len(trap_states), 1)
        trap_id = trap_states[0]
        self.assertNotIn(trap_id, dfa.accepting_states)
        for sym in dfa.alphabet:
            self.assertEqual(dfa.transitions.get((trap_id, sym)), trap_id)

    def test_t12_no_duplicate_subsets(self):
        """T-12: No two DFA IDs represent the same subset."""
        nfa = build_contains_110()
        dfa = subset_construction(nfa)
        seen_subsets = set()
        for s in dfa.states:
            subset_tuple = tuple(dfa.subset_map[s])
            self.assertNotIn(subset_tuple, seen_subsets, f"Duplicate subset {subset_tuple}")
            seen_subsets.add(subset_tuple)

    def test_t13_dfa_simulation(self):
        """T-13: DFA simulation follows deterministic transitions."""
        nfa = build_ends_with_01()
        dfa = subset_construction(nfa)
        res = dfa.simulate("101")
        self.assertTrue(res["is_accepted"])
        res_fail = dfa.simulate("100")
        self.assertFalse(res_fail["is_accepted"])

    def test_t14_invalid_symbols(self):
        """T-14: Invalid symbols return validation error instead of silent ignoring."""
        nfa = build_ends_with_01()
        dfa = subset_construction(nfa)
        with self.assertRaises(AutomataValidationError) as ctx_nfa:
            nfa.simulate("01201")
        self.assertIn("alphabet", str(ctx_nfa.exception))

        with self.assertRaises(AutomataValidationError) as ctx_dfa:
            dfa.simulate("01x01")
        self.assertIn("alphabet", str(ctx_dfa.exception))


class TestPresets(unittest.TestCase):
    """Test suite for the three required presets."""

    def test_preset_a_ends_with_01(self):
        """Preset A: Ends with 01."""
        nfa = build_ends_with_01()
        dfa = subset_construction(nfa)

        accepted = ["01", "101", "1101", "00001", "10101"]
        rejected = ["", "0", "1", "10", "111", "010", "0100"]

        for s in accepted:
            self.assertTrue(nfa.simulate(s)["is_accepted"], f"NFA failed on accepted string '{s}'")
            self.assertTrue(dfa.simulate(s)["is_accepted"], f"DFA failed on accepted string '{s}'")

        for s in rejected:
            self.assertFalse(nfa.simulate(s)["is_accepted"], f"NFA accepted rejected string '{s}'")
            self.assertFalse(dfa.simulate(s)["is_accepted"], f"DFA accepted rejected string '{s}'")

    def test_preset_b_contains_110(self):
        """Preset B: Contains substring 110."""
        nfa = build_contains_110()
        dfa = subset_construction(nfa)

        accepted = ["110", "0110", "1101", "1110", "0011000", "110110"]
        rejected = ["", "0", "101", "111", "000", "1011", "01010"]

        for s in accepted:
            self.assertTrue(nfa.simulate(s)["is_accepted"], f"NFA failed on accepted string '{s}'")
            self.assertTrue(dfa.simulate(s)["is_accepted"], f"DFA failed on accepted string '{s}'")

        for s in rejected:
            self.assertFalse(nfa.simulate(s)["is_accepted"], f"NFA accepted rejected string '{s}'")
            self.assertFalse(dfa.simulate(s)["is_accepted"], f"DFA accepted rejected string '{s}'")

    def test_preset_c_even_number_of_0s(self):
        """Preset C: Even number of 0s."""
        nfa = build_even_number_of_0s()
        dfa = subset_construction(nfa)

        accepted = ["", "1", "00", "10101", "010", "1111", "0000", "1001001"]
        rejected = ["0", "10", "000", "101", "0111", "00011"]

        for s in accepted:
            self.assertTrue(nfa.simulate(s)["is_accepted"], f"NFA failed on accepted string '{s}'")
            self.assertTrue(dfa.simulate(s)["is_accepted"], f"DFA failed on accepted string '{s}'")

        for s in rejected:
            self.assertFalse(nfa.simulate(s)["is_accepted"], f"NFA accepted rejected string '{s}'")
            self.assertFalse(dfa.simulate(s)["is_accepted"], f"DFA accepted rejected string '{s}'")

    def test_epsilon_demo(self):
        """Preset: Epsilon Transitions Demo (0*1*)."""
        nfa = build_epsilon_demo()
        dfa = subset_construction(nfa)

        accepted = ["", "0", "1", "00", "11", "0011", "0111", "0001"]
        rejected = ["10", "010", "1100", "101", "0101"]

        for s in accepted:
            self.assertTrue(nfa.simulate(s)["is_accepted"], f"NFA failed on '{s}'")
            self.assertTrue(dfa.simulate(s)["is_accepted"], f"DFA failed on '{s}'")

        for s in rejected:
            self.assertFalse(nfa.simulate(s)["is_accepted"], f"NFA accepted rejected '{s}'")
            self.assertFalse(dfa.simulate(s)["is_accepted"], f"DFA accepted rejected '{s}'")


class TestNFADFAEquivalenceRegression(unittest.TestCase):
    """Exhaustive agreement regression test across binary strings up to length 5."""

    def test_agreement_exhaustive_length_0_to_4(self):
        presets = [
            build_ends_with_01(),
            build_contains_110(),
            build_even_number_of_0s(),
            build_epsilon_demo(),
        ]

        # Generate all binary strings from length 0 to 4 (1 + 2 + 4 + 8 + 16 = 31 strings)
        test_strings = [""]
        for length in range(1, 5):
            for combo in itertools.product("01", repeat=length):
                test_strings.append("".join(combo))

        for nfa in presets:
            dfa = subset_construction(nfa)
            for test_str in test_strings:
                nfa_res = nfa.simulate(test_str)["is_accepted"]
                dfa_res = dfa.simulate(test_str)["is_accepted"]
                self.assertEqual(
                    nfa_res,
                    dfa_res,
                    f"Disagreement on string '{test_str}' for NFA states {nfa.states}!"
                )


class TestValidation(unittest.TestCase):
    """Test defensive validation for automata definitions."""

    def test_empty_states(self):
        nfa = NFA(states=[], alphabet=["0"], start_state="q0", accepting_states=[], transitions=[])
        errors = nfa.validate()
        self.assertTrue(any("empty" in e.lower() for e in errors))

    def test_epsilon_in_alphabet(self):
        nfa = NFA(states=["q0"], alphabet=["0", EPSILON], start_state="q0", accepting_states=["q0"], transitions=[])
        errors = nfa.validate()
        self.assertTrue(any("reserved epsilon" in e.lower() for e in errors))

    def test_unknown_start_state(self):
        nfa = NFA(states=["q0"], alphabet=["0"], start_state="q99", accepting_states=[], transitions=[])
        errors = nfa.validate()
        self.assertTrue(any("start state" in e.lower() for e in errors))

    def test_unknown_accepting_state(self):
        nfa = NFA(states=["q0"], alphabet=["0"], start_state="q0", accepting_states=["q99"], transitions=[])
        errors = nfa.validate()
        self.assertTrue(any("accepting state" in e.lower() for e in errors))

    def test_unknown_transition_source_and_destination(self):
        nfa = NFA(
            states=["q0", "q1"],
            alphabet=["0"],
            start_state="q0",
            accepting_states=["q1"],
            transitions=[{"from": "q_bad", "symbol": "0", "to": ["q_ghost"]}],
        )
        errors = nfa.validate()
        self.assertEqual(len(errors), 2)

    def test_natural_language_matcher(self):
        res1 = match_natural_language_phrase("strings that end with 01")
        self.assertTrue(res1["matched"])
        self.assertEqual(res1["preset_id"], "ENDS_WITH_01")

        res2 = match_natural_language_phrase("has substring 110 inside")
        self.assertTrue(res2["matched"])
        self.assertEqual(res2["preset_id"], "CONTAINS_110")

        res3 = match_natural_language_phrase("even number of 0s")
        self.assertTrue(res3["matched"])
        self.assertEqual(res3["preset_id"], "EVEN_NUMBER_OF_0S")

        res4 = match_natural_language_phrase("arbitrary grammar CFG parser")
        self.assertFalse(res4["matched"])


    def test_rename_state_success(self):
        """Test renaming state updates states, start, accepting, and transitions."""
        nfa = build_ends_with_01()
        nfa.rename_state("q0", "q_start")
        self.assertIn("q_start", nfa.states)
        self.assertNotIn("q0", nfa.states)
        self.assertEqual(nfa.start_state, "q_start")
        # Ensure transitions from q_start are updated
        self.assertIn("q1", nfa.transitions[("q_start", "0")])
        self.assertIn("q_start", nfa.transitions[("q_start", "0")])
        # Acceptance check still valid
        self.assertTrue(nfa.simulate("01")["is_accepted"])
        self.assertFalse(nfa.simulate("00")["is_accepted"])

    def test_rename_state_errors(self):
        """Test renaming raises validation error on unknown or colliding state names."""
        nfa = build_ends_with_01()
        with self.assertRaises(AutomataValidationError):
            nfa.rename_state("q_unknown", "q_new")
        with self.assertRaises(AutomataValidationError):
            nfa.rename_state("q0", "q1")  # collision with existing state
        with self.assertRaises(AutomataValidationError):
            nfa.rename_state("q0", "  ")  # empty name

    def test_simulation_trace_contains_explanations(self):
        """Test that simulation trace rows include human-readable step explanations."""
        nfa = build_ends_with_01()
        sim_res = nfa.simulate("01")
        self.assertGreater(len(sim_res["trace"]), 0)
        for row in sim_res["trace"]:
            self.assertIn("explanation", row)
            self.assertIsInstance(row["explanation"], str)

        dfa = subset_construction(nfa)
        dfa_sim = dfa.simulate("01")
        self.assertGreater(len(dfa_sim["trace"]), 0)
        for row in dfa_sim["trace"]:
            self.assertIn("explanation", row)
            self.assertIsInstance(row["explanation"], str)


if __name__ == "__main__":
    unittest.main()

