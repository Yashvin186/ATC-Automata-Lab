"""Flask Application for ATC Automata Lab.

Provides API endpoints for:
- Serving the main web interface
- Preset listing and instantiation
- Natural-language phrase matching
- NFA payload validation
- NFA-to-DFA subset construction
- Synchronized NFA/DFA string simulation
"""

import logging
from flask import Flask, render_template, request, jsonify
from automata import NFA, DFA, subset_construction, AutomataValidationError, EPSILON
from presets import (
    PRESET_METADATA,
    get_preset_nfa,
    match_natural_language_phrase,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)


def parse_nfa_payload(data: dict) -> NFA:
    """Helper to safely construct an NFA instance from a request payload."""
    if not isinstance(data, dict):
        raise AutomataValidationError("Payload must be a JSON object.")

    states = data.get("states", [])
    alphabet = data.get("alphabet", [])
    start_state = data.get("start_state", "")
    accepting_states = data.get("accepting_states", [])
    transitions = data.get("transitions", [])

    if not isinstance(states, list):
        raise AutomataValidationError("Field 'states' must be a list.")
    if not isinstance(alphabet, list):
        raise AutomataValidationError("Field 'alphabet' must be a list.")
    if not isinstance(accepting_states, list):
        raise AutomataValidationError("Field 'accepting_states' must be a list.")
    if not isinstance(transitions, list):
        raise AutomataValidationError("Field 'transitions' must be a list of transition objects.")

    return NFA(
        states=states,
        alphabet=alphabet,
        start_state=start_state,
        accepting_states=accepting_states,
        transitions=transitions,
    )


@app.route("/")
def index():
    """Render the single-page application dashboard."""
    return render_template("index.html")


@app.route("/api/presets", methods=["GET"])
def list_presets():
    """Return available preset languages with metadata and example strings."""
    return jsonify({
        "status": "success",
        "presets": list(PRESET_METADATA.values()),
    })


@app.route("/api/presets/<preset_id>", methods=["GET", "POST"])
def get_preset(preset_id: str):
    """Return the generated NFA model for the requested preset ID."""
    preset_id_upper = preset_id.upper()
    nfa = get_preset_nfa(preset_id_upper)
    if not nfa:
        return jsonify({
            "status": "error",
            "message": f"Preset '{preset_id}' not found. Available presets: {list(PRESET_METADATA.keys())}",
        }), 404

    return jsonify({
        "status": "success",
        "preset_id": preset_id_upper,
        "metadata": PRESET_METADATA.get(preset_id_upper),
        "nfa": nfa.to_dict(),
    })


@app.route("/api/presets/match", methods=["POST"])
def match_preset():
    """Match a natural language phrase to a supported preset."""
    data = request.get_json(silent=True) or {}
    phrase = data.get("phrase", "")
    result = match_natural_language_phrase(phrase)
    if result["matched"]:
        preset_id = result["preset_id"]
        nfa = get_preset_nfa(preset_id)
        result["nfa"] = nfa.to_dict() if nfa else None
        result["metadata"] = PRESET_METADATA.get(preset_id)
    return jsonify(result)


@app.route("/api/validate", methods=["POST"])
def validate_nfa():
    """Validate an NFA payload and report all semantic issues."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({
            "status": "error",
            "valid": False,
            "errors": ["Missing or malformed JSON payload."],
        }), 400

    try:
        nfa = parse_nfa_payload(data)
        errors = nfa.validate()
        return jsonify({
            "status": "success" if not errors else "invalid",
            "valid": len(errors) == 0,
            "errors": errors,
        })
    except AutomataValidationError as e:
        return jsonify({
            "status": "error",
            "valid": False,
            "errors": [str(e)],
        }), 400
    except Exception as e:
        logger.exception("Unexpected error in /api/validate")
        return jsonify({
            "status": "error",
            "valid": False,
            "errors": [f"Server validation error: {str(e)}"],
        }), 500


@app.route("/api/convert", methods=["POST"])
def convert_nfa_to_dfa():
    """Convert an NFA into a DFA using subset construction.
    
    Returns the complete DFA model and step-by-step conversion records.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "error", "message": "Missing JSON payload."}), 400

    try:
        # Check if payload directly contains NFA or wrapped under "nfa"
        nfa_dict = data.get("nfa", data)
        nfa = parse_nfa_payload(nfa_dict)
        errors = nfa.validate()
        if errors:
            return jsonify({
                "status": "error",
                "message": "NFA validation failed.",
                "errors": errors,
            }), 400

        dfa = subset_construction(nfa)
        return jsonify({
            "status": "success",
            "nfa": nfa.to_dict(),
            "dfa": dfa.to_dict(),
            "conversion_steps": dfa.conversion_steps,
        })
    except AutomataValidationError as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    except Exception as e:
        logger.exception("Unexpected error in /api/convert")
        return jsonify({"status": "error", "message": f"Conversion error: {str(e)}"}), 500


@app.route("/api/simulate", methods=["POST"])
def simulate():
    """Run synchronized string simulation through both NFA and DFA."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "error", "message": "Missing JSON payload."}), 400

    input_string = data.get("input_string", "")
    if not isinstance(input_string, str):
        return jsonify({"status": "error", "message": "Field 'input_string' must be a string."}), 400

    try:
        nfa_dict = data.get("nfa")
        if not nfa_dict:
            return jsonify({"status": "error", "message": "Field 'nfa' is required."}), 400

        nfa = parse_nfa_payload(nfa_dict)
        errors = nfa.validate()
        if errors:
            return jsonify({
                "status": "error",
                "message": "Invalid NFA.",
                "errors": errors,
            }), 400

        # Run NFA simulation
        nfa_sim = nfa.simulate(input_string)

        # Convert or obtain DFA
        dfa_dict = data.get("dfa")
        if dfa_dict and "states" in dfa_dict and "transitions" in dfa_dict:
            # Reconstruct DFA from provided payload
            raw_transitions = dfa_dict.get("transitions", [])
            parsed_transitions = {}
            for t in raw_transitions:
                parsed_transitions[(str(t["from"]), str(t["symbol"]))] = str(t["to"])

            dfa = DFA(
                states=dfa_dict.get("states", []),
                subset_map=dfa_dict.get("subset_map", {}),
                alphabet=dfa_dict.get("alphabet", nfa.alphabet),
                start_state=dfa_dict.get("start_state", ""),
                accepting_states=dfa_dict.get("accepting_states", []),
                transitions=parsed_transitions,
                trap_state_id=dfa_dict.get("trap_state_id"),
            )
        else:
            dfa = subset_construction(nfa)

        # Run DFA simulation
        dfa_sim = dfa.simulate(input_string)

        # Compare results
        nfa_acc = nfa_sim["is_accepted"]
        dfa_acc = dfa_sim["is_accepted"]
        agrees = (nfa_acc == dfa_acc)

        if agrees:
            status_text = "ACCEPTED" if nfa_acc else "REJECTED"
            verification_msg = f"Both machines agree on this input ({status_text})."
        else:
            verification_msg = "ERROR: NFA and DFA results differ. Check the implementation."

        return jsonify({
            "status": "success",
            "input_string": input_string,
            "nfa_result": nfa_sim,
            "dfa_result": dfa_sim,
            "agrees": agrees,
            "verification_message": verification_msg,
        })
    except AutomataValidationError as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    except Exception as e:
        logger.exception("Unexpected error in /api/simulate")
        return jsonify({"status": "error", "message": f"Simulation error: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)

