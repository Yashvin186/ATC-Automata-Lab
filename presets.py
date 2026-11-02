"""Preset language generators and template matchers for ATC Automata Lab.

Defines the required presets with formal mathematical definitions,
pedagogical explanations, sample accepted/rejected test cases, and
natural-language lookup patterns:
1. ENDS_WITH_01: Binary strings ending with '01'
2. CONTAINS_110: Binary strings containing substring '110'
3. EVEN_NUMBER_OF_0S: Binary strings containing an even number of '0's
4. EPSILON_DEMO: An educational NFA with epsilon transitions (0* followed by 1*)
"""

from typing import Dict, Any, Optional
from automata import NFA, EPSILON


PRESET_METADATA = {
    "ENDS_WITH_01": {
        "id": "ENDS_WITH_01",
        "name": "Ends with '01'",
        "math_definition": "L = { w ∈ {0, 1}* | w ends with 01 }",
        "alphabet": ["0", "1"],
        "description": "All binary strings over {0, 1} whose final two symbols are strictly '01'.",
        "rationale": "State q0 loops on all prefixes. On reading '0', the NFA branches: staying in q0 while tentatively advancing to q1. From q1, reading '1' reaches accepting state q2. Subset construction eliminates non-determinism by tracking these branches simultaneously.",
        "sample_accepted": ["01", "101", "1101", "001", "0101"],
        "sample_rejected": ["", "0", "1", "10", "111", "010", "0100"],
    },
    "CONTAINS_110": {
        "id": "CONTAINS_110",
        "name": "Contains substring '110'",
        "math_definition": "L = { w ∈ {0, 1}* | 110 occurs as a contiguous substring of w }",
        "alphabet": ["0", "1"],
        "description": "All binary strings over {0, 1} containing '110' as a contiguous substring.",
        "rationale": "States q0 -> q1 -> q2 -> q3 represent pattern matching progress for '1', '11', and '110'. Once state q3 is reached, it acts as an accepting sink that absorbs all subsequent characters.",
        "sample_accepted": ["110", "0110", "1101", "0011011", "11100"],
        "sample_rejected": ["", "0", "101", "111", "000", "1011"],
    },
    "EVEN_NUMBER_OF_0S": {
        "id": "EVEN_NUMBER_OF_0S",
        "name": "Even number of '0's",
        "math_definition": "L = { w ∈ {0, 1}* | |w|_0 mod 2 = 0 }",
        "alphabet": ["0", "1"],
        "description": "All binary strings over {0, 1} containing an even count of '0' symbols (including zero '0's).",
        "rationale": "State q_even represents an even number of '0's seen so far (initial & accepting). State q_odd represents an odd number of '0's. Reading '0' alternates between the states, while reading '1' retains the current parity.",
        "sample_accepted": ["", "1", "00", "10101", "11100", "010"],
        "sample_rejected": ["0", "10", "000", "101", "0111"],
    },
    "EPSILON_DEMO": {
        "id": "EPSILON_DEMO",
        "name": "Epsilon Transitions Demo (0* followed by 1*)",
        "math_definition": "L = { 0^m 1^n | m, n ≥ 0 }",
        "alphabet": ["0", "1"],
        "description": "Binary strings consisting of zero or more '0's followed by zero or more '1's connected via a spontaneous ε-transition.",
        "rationale": "State q0 consumes '0's, while state q1 consumes '1's. The spontaneous ε-transition enables jumping from q0 to q1 without consuming any input character.",
        "sample_accepted": ["", "0", "1", "00", "11", "0011", "0111"],
        "sample_rejected": ["10", "010", "1100", "101"],
    }
}


def build_ends_with_01() -> NFA:
    """Construct NFA for strings ending with '01'."""
    return NFA(
        states=["q0", "q1", "q2"],
        alphabet=["0", "1"],
        start_state="q0",
        accepting_states=["q2"],
        transitions=[
            {"from": "q0", "symbol": "0", "to": ["q0", "q1"]},
            {"from": "q0", "symbol": "1", "to": ["q0"]},
            {"from": "q1", "symbol": "1", "to": ["q2"]},
        ],
    )


def build_contains_110() -> NFA:
    """Construct NFA for strings containing substring '110'."""
    return NFA(
        states=["q0", "q1", "q2", "q3"],
        alphabet=["0", "1"],
        start_state="q0",
        accepting_states=["q3"],
        transitions=[
            {"from": "q0", "symbol": "0", "to": ["q0"]},
            {"from": "q0", "symbol": "1", "to": ["q0", "q1"]},
            {"from": "q1", "symbol": "1", "to": ["q2"]},
            {"from": "q2", "symbol": "0", "to": ["q3"]},
            {"from": "q3", "symbol": "0", "to": ["q3"]},
            {"from": "q3", "symbol": "1", "to": ["q3"]},
        ],
    )


def build_even_number_of_0s() -> NFA:
    """Construct NFA for strings with an even number of '0's."""
    return NFA(
        states=["q_even", "q_odd"],
        alphabet=["0", "1"],
        start_state="q_even",
        accepting_states=["q_even"],
        transitions=[
            {"from": "q_even", "symbol": "0", "to": ["q_odd"]},
            {"from": "q_even", "symbol": "1", "to": ["q_even"]},
            {"from": "q_odd", "symbol": "0", "to": ["q_even"]},
            {"from": "q_odd", "symbol": "1", "to": ["q_odd"]},
        ],
    )


def build_epsilon_demo() -> NFA:
    """Construct NFA demonstrating epsilon transitions: 0* followed by 1*."""
    return NFA(
        states=["q0", "q1"],
        alphabet=["0", "1"],
        start_state="q0",
        accepting_states=["q1"],
        transitions=[
            {"from": "q0", "symbol": "0", "to": ["q0"]},
            {"from": "q0", "symbol": EPSILON, "to": ["q1"]},
            {"from": "q1", "symbol": "1", "to": ["q1"]},
        ],
    )


PRESET_BUILDERS = {
    "ENDS_WITH_01": build_ends_with_01,
    "CONTAINS_110": build_contains_110,
    "EVEN_NUMBER_OF_0S": build_even_number_of_0s,
    "EPSILON_DEMO": build_epsilon_demo,
}


def get_preset_nfa(preset_id: str) -> Optional[NFA]:
    """Retrieve NFA instance for a given preset ID."""
    builder = PRESET_BUILDERS.get(preset_id)
    if builder:
        return builder()
    return None


def match_natural_language_phrase(phrase: str) -> Dict[str, Any]:
    """Match natural-language phrases to supported presets without pretending general AI capability.
    
    Supports a clear, explicit set of common classroom phrases for the presets.
    """
    cleaned = phrase.strip().lower()
    if not cleaned:
        return {
            "matched": False,
            "message": "Please enter a description or pick from the preset dropdown."
        }

    # Preset A keywords
    if any(k in cleaned for k in ["ends with 01", "ending in 01", "end with 01", "ends in 01", "01 at end", "ending with 01"]):
        return {
            "matched": True,
            "preset_id": "ENDS_WITH_01",
            "message": "Matched preset: 'Binary strings ending in 01'."
        }

    # Preset B keywords
    if any(k in cleaned for k in ["contains 110", "has 110", "substring 110", "contain 110", "containing 110", "includes 110"]):
        return {
            "matched": True,
            "preset_id": "CONTAINS_110",
            "message": "Matched preset: 'Binary strings containing substring 110'."
        }

    # Preset C keywords
    if any(k in cleaned for k in [
        "even number of 0", "even number of zeros", "even 0s", "even count of 0",
        "even count of zero", "number of 0 is even", "number of zeros is even", "even zeros"
    ]):
        return {
            "matched": True,
            "preset_id": "EVEN_NUMBER_OF_0S",
            "message": "Matched preset: 'Binary strings with an even number of 0s'."
        }

    # Epsilon demo keywords
    if any(k in cleaned for k in ["epsilon", "0*1*", "0* followed by 1*", "empty transition"]):
        return {
            "matched": True,
            "preset_id": "EPSILON_DEMO",
            "message": "Matched preset: 'Epsilon Transitions Demo'."
        }

    return {
        "matched": False,
        "message": (
            f"No direct preset match for '{phrase}'. "
            "Supported presets are: 'ends with 01', 'contains 110', and 'even number of 0s'. "
            "You can also use the Manual NFA Editor to build any custom automaton."
        )
    }
