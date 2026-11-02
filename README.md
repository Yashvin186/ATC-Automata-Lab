# ATC Automata Lab: Interactive NFA-to-DFA Simulator

> **Explore. Convert. Simulate. Understand.**  
> An educational web platform for **Automata Theory and Computability (ATC)** designed to visualize Non-deterministic Finite Automata (NFA), execute step-by-step Subset Construction to derive Deterministic Finite Automata (DFA), and perform synchronized string simulations with complete pedagogical explanations.

---

## 🌟 Key Features

1. **Standard Language Preset Library**:
   - `ENDS_WITH_01`: Binary strings ending with `01` ($L = \{w \in \{0, 1\}^* \mid w \text{ ends with } 01\}$).
   - `CONTAINS_110`: Binary strings containing substring `110` ($L = \{w \in \{0, 1\}^* \mid 110 \text{ is a substring of } w\}$).
   - `EVEN_NUMBER_OF_0S`: Binary strings containing an even number of `0`s ($L = \{w \in \{0, 1\}^* \mid |w|_0 \bmod 2 = 0\}$).
   - `EPSILON_DEMO`: Demonstration of $\epsilon$-transitions ($L = \{0^m 1^n \mid m, n \ge 0\}$).
   - Each preset includes formal mathematical definitions, algorithmic rationale, and 1-click test chips for accepted and rejected strings.
2. **Interactive Manual NFA Editor**:
   - Single-character alphabet customization (excluding reserved symbol $\epsilon$).
   - Full State Manager: **Add state**, **Rename state**, **Delete state**, select initial state, and mark multiple accepting states.
   - Interactive transition matrix supporting multiple destination branches and $\epsilon$-transitions with empty cell ($\emptyset$) handling.
3. **Step-by-Step Subset Construction Stepper**:
   - Conversion from NFA to complete DFA using power set construction $\mathcal{P}(Q)$.
   - Playback controls: **Step Next**, **Play**, **Pause**, **Reset**, and **Complete Conversion**.
   - Dynamic step explanation cards explaining current processed subset, consumed symbol, raw moves, $\epsilon$-closure expansion, and state discovery status.
   - Materialization of dead/trap state ($\emptyset$) with reflexive self-loops on all alphabet symbols.
4. **Collision-Free Directed Graph Visualizer**:
   - Cytoscape.js directed graphs with hierarchical/breadthfirst layouts avoiding node or label collisions.
   - Compact node identifiers ($D_0, D_1, \dots, \emptyset$) preventing text overlap.
   - **Interactive State Inspector**: Clicking any node displays its represented subset, initial/accepting status, and incoming/outgoing transitions.
   - Controls: Zoom In (+), Zoom Out (−), Fit View, and Redraw Layout.
   - Visual distinctions:
     - **Start State**: Directed incoming blue start arrow.
     - **Accepting State**: Double concentric border.
     - **Ordinary State**: Single solid border.
     - **Trap State ($\emptyset$)**: Red dashed border.
     - **Active State**: Amber glow highlight.
     - **Active Transition**: Bold orange directed edge.
5. **Synchronized String Simulation**:
   - Visual input tape showing the active read head, consumed symbols, and upcoming characters.
   - Step Next, Play, Pause, Run All, and Reset controls with speed adjustment.
   - Real-time side-by-side trace table logging NFA moves, $\epsilon$-closures, active subsets, and DFA transitions.
   - Final acceptance verification banner independently computing NFA and DFA results and verifying equivalence.
6. **Embedded Theory & Viva Examination Guide**:
   - In-app modal covering the top 10 examination and viva voce questions in Automata Theory with formal definitions and proof sketches.

---

## 🚀 Quickstart Guide (Windows PowerShell)

All commands should be executed within the project directory. All dependencies are installed exclusively in the local `.venv` virtual environment to preserve system integrity.

### 1. Create Virtual Environment
```powershell
python -m venv .venv
```

### 2. Install Dependencies
```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 3. Run Automated Tests
```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

### 4. Start the Application
```powershell
.\.venv\Scripts\python.exe app.py
```
Open your browser at:
```text
http://127.0.0.1:5000
```

> **100% Offline Capability:**  
> The core Python algorithms, REST API, test suite, and Cytoscape.js graph visualization library (`static/cytoscape.min.js`) are completely bundled locally in this directory. The entire simulator runs without requiring internet access.

---

## 🧪 Testing Summary

The test suite consists of **42 automated unit and integration tests** across `tests/test_automata.py`, `tests/test_api.py`, and `tests/test_html_js.py`:
- **T-01 to T-04**: Epsilon closure correctness, chain reachability, cycle termination, and multi-source union.
- **T-05 to T-07**: NFA move operation, multi-branch tracking, and empty string ($\epsilon$) behavior.
- **T-08 to T-14**: Subset construction, initial subset derivation, intersection with accepting states, DFA completeness (every state has exactly 1 transition per symbol), trap state reflexive closure, and invalid character validation.
- **State Renaming**: Validation of state identifier updates across transitions, initial state, and accepting sets.
- **Simulation Explanations**: Verification that simulation trace rows include human-readable explanations.
- **Preset Acceptance & Rejection**: Strict validation of all sample accepted and rejected strings for Presets A, B, and C.
- **Equivalence Regression**: Exhaustive agreement verification between NFA and converted DFA across all binary strings of lengths 0 to 4 ($2^0 + 2^1 + 2^2 + 2^3 + 2^4 = 31$ strings per automaton).
- **API Endpoints**: Validation, error formatting, simulation, and phrase matching.

To execute tests at any time:
```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

---

## 📐 Project Structure

```text
ATC PROJECT/
├── app.py                      # Flask backend and REST API endpoints
├── automata.py                 # Pure mathematical NFA/DFA engine & subset construction
├── presets.py                  # Predefined language generators and template matcher
├── requirements.txt            # Minimal Python dependencies (Flask)
├── PROJECT_SPEC.md             # Technical specification document
├── README.md                   # Setup guide and usage instructions
├── templates/
│   └── index.html              # Modern dark-themed dashboard interface & Theory Modal
├── static/
│   ├── styles.css              # Dark navy & charcoal CSS design system
│   └── app.js                  # Frontend engine, Cytoscape graph rendering, simulation tape
└── tests/
    ├── test_automata.py        # Core algorithmic & mathematical unit tests (28 tests)
    └── test_api.py             # Flask API integration tests (12 tests)
```

---

## ⚠️ Scope Boundaries & Known Limitations

1. **Alphabet Constraints**: Designed for finite single-character alphabets (e.g. `{0, 1}`, `{a, b}`).
2. **Language Description Matching**: Natural language matching uses a deterministic phrase lookup table for standard classroom expressions. It intentionally does not depend on external LLMs or third-party APIs.
3. **Formal Equivalence**: Testing sample strings demonstrates behavior; mathematical equivalence is guaranteed by the correct implementation of the subset construction algorithm.
