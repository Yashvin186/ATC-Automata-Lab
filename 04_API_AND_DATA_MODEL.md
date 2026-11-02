# API and Data Model — ATC Automata Lab

## 1. Architecture
Separate responsibilities:
- `automata.py`: pure mathematical model and algorithms;
- `presets.py`: constructs valid example automata;
- `app.py`: Flask routes, request validation, and JSON responses;
- `templates/index.html`: page structure;
- `static/styles.css`: presentation;
- `static/app.js`: UI state, API calls, Cytoscape graph rendering, and playback;
- `tests/`: unit tests.

The algorithm module must not depend on Flask or browser code.

## 2. Suggested JSON representation
NFA input:
```json
{
  "states": ["q0", "q1", "q2"],
  "alphabet": ["0", "1"],
  "start_state": "q0",
  "accepting_states": ["q2"],
  "transitions": [
    {"from": "q0", "symbol": "0", "to": ["q0", "q1"]},
    {"from": "q1", "symbol": "1", "to": ["q2"]},
    {"from": "q0", "symbol": "ε", "to": ["q1"]}
  ]
}
```
Use `ε` as the reserved epsilon label in serialized data. It must not be included in `alphabet`.

DFA output should include stable IDs such as `D0`, `D1`; a mapping from each DFA ID to the sorted subset it represents; alphabet; start ID; accepting DFA IDs; complete transitions; and conversion-step list. Display both `D1` and its represented subset, e.g. `D1 = {q0, q1}`.

## 3. Suggested Flask endpoints
- `GET /`: render the app.
- `GET /api/presets`: return available preset names and descriptions.
- `POST /api/presets/<preset_id>`: return generated NFA model.
- `POST /api/validate`: validate an NFA payload and return errors/warnings.
- `POST /api/convert`: validate an NFA and return DFA data plus conversion steps.
- `POST /api/simulate`: accept an NFA, its converted DFA (or compute it server-side), and an input string; return traces and final results.

Exact route names may change if behavior remains equivalent and documentation is updated. The backend must validate payloads even if the frontend already validates them.

## 4. Simulation response expectations
For each machine, include initial active state/set, trace row for each consumed symbol, final state/set, accepted boolean, and a useful error if input is invalid. NFA trace rows must distinguish destinations before epsilon closure from active states after closure. DFA trace rows include previous state, symbol, and next state.

## 5. Errors
Return a clear client error response for invalid data, preferably HTTP 400 with a JSON message and field details where practical. Unexpected server exceptions should be logged and return a generic error to the UI; do not expose stack traces.

## 6. Playback architecture
Compute traces on the backend and let the frontend reveal one trace row per Step Next or timer tick. This keeps the algorithm deterministic and avoids implementing a second automata engine in JavaScript.

For conversion playback, return the ordered conversion-step list from the backend. The frontend reveals steps sequentially and highlights the relevant subset/node/edge. The final DFA must come from the algorithm result, not frontend animation logic.
