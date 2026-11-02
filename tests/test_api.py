"""Integration and unit tests for Flask API endpoints."""

import unittest
import json
from app import app
from presets import build_ends_with_01


class TestFlaskAPI(unittest.TestCase):
    """Test suite for app.py REST endpoints."""

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_index_route(self):
        """Test GET / returns 200 (even before template is complete or mock)."""
        # We will create templates/index.html shortly
        pass

    def test_list_presets(self):
        """GET /api/presets should return available presets."""
        res = self.app.get("/api/presets")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertGreaterEqual(len(data["presets"]), 3)

    def test_get_preset_nfa(self):
        """GET /api/presets/ENDS_WITH_01 returns valid NFA model."""
        res = self.app.get("/api/presets/ENDS_WITH_01")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["preset_id"], "ENDS_WITH_01")
        self.assertIn("nfa", data)
        self.assertEqual(data["nfa"]["start_state"], "q0")

    def test_preset_not_found(self):
        """GET /api/presets/INVALID_PRESET returns 404."""
        res = self.app.get("/api/presets/NON_EXISTENT")
        self.assertEqual(res.status_code, 404)

    def test_match_preset_endpoint(self):
        """POST /api/presets/match matches natural language descriptions."""
        res = self.app.post(
            "/api/presets/match",
            data=json.dumps({"phrase": "binary strings ending with 01"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["matched"])
        self.assertEqual(data["preset_id"], "ENDS_WITH_01")

    def test_validate_endpoint_valid(self):
        """POST /api/validate returns valid: True for valid NFA."""
        nfa = build_ends_with_01().to_dict()
        res = self.app.post(
            "/api/validate",
            data=json.dumps(nfa),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["valid"])
        self.assertEqual(len(data["errors"]), 0)

    def test_validate_endpoint_invalid(self):
        """POST /api/validate returns valid: False and list of errors."""
        bad_nfa = {
            "states": ["q0"],
            "alphabet": ["0"],
            "start_state": "q_missing",
            "accepting_states": ["q_ghost"],
            "transitions": [],
        }
        res = self.app.post(
            "/api/validate",
            data=json.dumps(bad_nfa),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertFalse(data["valid"])
        self.assertGreaterEqual(len(data["errors"]), 2)

    def test_convert_endpoint(self):
        """POST /api/convert returns DFA and conversion steps."""
        nfa = build_ends_with_01().to_dict()
        res = self.app.post(
            "/api/convert",
            data=json.dumps({"nfa": nfa}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("dfa", data)
        self.assertIn("conversion_steps", data)
        self.assertGreater(len(data["conversion_steps"]), 0)

    def test_simulate_endpoint_accept(self):
        """POST /api/simulate returns synchronized results and agreement."""
        nfa = build_ends_with_01().to_dict()
        res = self.app.post(
            "/api/simulate",
            data=json.dumps({"nfa": nfa, "input_string": "101"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["agrees"])
        self.assertTrue(data["nfa_result"]["is_accepted"])
        self.assertTrue(data["dfa_result"]["is_accepted"])
        self.assertIn("agree on this input (ACCEPTED)", data["verification_message"])

    def test_simulate_endpoint_reject(self):
        """POST /api/simulate returns rejection agreement."""
        nfa = build_ends_with_01().to_dict()
        res = self.app.post(
            "/api/simulate",
            data=json.dumps({"nfa": nfa, "input_string": "111"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["agrees"])
        self.assertFalse(data["nfa_result"]["is_accepted"])
        self.assertFalse(data["dfa_result"]["is_accepted"])
        self.assertIn("agree on this input (REJECTED)", data["verification_message"])

    def test_simulate_endpoint_empty_string(self):
        """POST /api/simulate handles empty string cleanly."""
        nfa = build_ends_with_01().to_dict()
        res = self.app.post(
            "/api/simulate",
            data=json.dumps({"nfa": nfa, "input_string": ""}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["agrees"])
        self.assertFalse(data["nfa_result"]["is_accepted"])
        self.assertEqual(len(data["nfa_result"]["trace"]), 0)

    def test_simulate_endpoint_invalid_character(self):
        """POST /api/simulate returns 400 with helpful error on invalid symbol."""
        nfa = build_ends_with_01().to_dict()
        res = self.app.post(
            "/api/simulate",
            data=json.dumps({"nfa": nfa, "input_string": "01201"}),
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertIn("Input contains symbol '2'", data["message"])


if __name__ == "__main__":
    unittest.main()

