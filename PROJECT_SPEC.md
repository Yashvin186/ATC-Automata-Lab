# ATC Automata Lab — Technical Specification

## 1. Executive Summary
**ATC Automata Lab — Interactive NFA-to-DFA Conversion and Synchronized String Simulation**  
*Subtitle: Explore. Convert. Simulate. Understand.*

Built for the Automata Theory and Computability (ATC) curriculum, this simulator provides a mathematically rigorous, classroom-ready bridge between formal language theory and interactive computation:
1. **NFA Construction**: Non-deterministic Finite Automata with multi-branch targets and spontaneous $\epsilon$-transitions.
2. **Subset Construction**: Deterministic conversion via power set construction $\mathcal{P}(Q)$.
3. **Complete DFA Closure**: Deterministic total transition function $\delta: Q \times \Sigma \to Q$, including explicit dead/trap state ($\emptyset$) materialization with reflexive self-loops.
4. **Non-Overlapping Graph Layout**: Directed breadthfirst layout with compact node identifiers ($D_0, D_1, \dots, \emptyset$), and a dedicated interactive State Inspector to prevent label collision.
5. **Synchronized Simulation**: Side-by-side string simulation across both machines with an interactive tape, live active set tracking, per-step explanations, and independent acceptance verification.
6. **Viva & Theory Guide**: Built-in 10-topic theoretical reference for classroom examination and viva voce defense.

---

## 2. Mathematical Formalisms

### 2.1 Automaton Model
An NFA is formalized as a 5-tuple $M = (Q, \Sigma, \delta, q_0, F)$:
- $Q$: Finite set of states $\{q_0, q_1, \dots\}$.
- $\Sigma$: Finite input alphabet excluding the reserved symbol $\epsilon$.
- $\delta: Q \times (\Sigma \cup \{\epsilon\}) \to \mathcal{P}(Q)$: Transition function.
- $q_0 \in Q$: Initial start state.
- $F \subseteq Q$: Set of final / accepting states.

### 2.2 Epsilon Closure ($\epsilon\text{-closure}$)
For any state set $S \subseteq Q$, $\epsilon\text{-closure}(S)$ denotes the set of states reachable from any state in $S$ via zero or more $\epsilon$-transitions:
$$\epsilon\text{-closure}(S) = S \cup \bigcup_{q \in S} \epsilon\text{-closure}(\delta(q, \epsilon))$$
Cycles in $\epsilon$-transitions are resolved using a depth-first traversal with a visited set.

### 2.3 Move Operation
For state set $S \subseteq Q$ and symbol $a \in \Sigma$:
$$\text{move}(S, a) = \bigcup_{q \in S} \delta(q, a)$$

### 2.4 Subset Construction Algorithm
Given NFA $M = (Q_N, \Sigma, \delta_N, q_{0N}, F_N)$, the language-equivalent complete DFA $M' = (Q_D, \Sigma, \delta_D, q_{0D}, F_D)$ is derived as follows:
1. $q_{0D} = \epsilon\text{-closure}(\{q_{0N}\})$.
2. Queue $W \leftarrow [q_{0D}]$; $Q_D \leftarrow \{q_{0D}\}$.
3. While $W$ is non-empty:
   - Dequeue subset $S$.
   - For each symbol $a \in \Sigma$:
     - Let $T = \epsilon\text{-closure}(\text{move}(S, a))$.
     - If $T \notin Q_D$:
       - Assign deterministic identifier $D_k$ to $T$.
       - $Q_D \leftarrow Q_D \cup \{T\}$; enqueue $T$ into $W$.
     - $\delta_D(S, a) = T$.
4. **Trap State Closure**: If $T = \emptyset$ is discovered, it is designated as a trap state $D_{\text{trap}}$ where $\forall a \in \Sigma, \delta_D(D_{\text{trap}}, a) = D_{\text{trap}}$.
5. $F_D = \{S \in Q_D \mid S \cap F_N \neq \emptyset\}$.

---

## 3. System Architecture

```text
                     +-----------------------------------+
                     |          Browser Client           |
                     |  HTML5 / CSS3 / Vanilla JS (ES6)  |
                     |       Cytoscape.js Graphs         |
                     +-----------------+-----------------+
                                       |
                           REST JSON   |   HTTP POST/GET
                                       v
                     +-----------------------------------+
                     |          Flask Web Server         |
                     |               (app.py)            |
                     +--------+-----------------+--------+
                              |                 |
                              v                 v
                    +------------------+ +---------------+
                    |   automata.py    | |  presets.py   |
                    | Pure Math Engine | | Preset Specs  |
                    |  NFA, DFA, Sim   | | NL Matching   |
                    +------------------+ +---------------+
```

---

## 4. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the main single-page application dashboard |
| `GET` | `/api/presets` | Returns available language presets, mathematical definitions & descriptions |
| `GET` / `POST` | `/api/presets/<id>` | Returns serialized NFA model and metadata for a preset |
| `POST` | `/api/presets/match` | Matches classroom natural-language phrases to supported presets |
| `POST` | `/api/validate` | Validates NFA structure and returns diagnostic semantic errors |
| `POST` | `/api/convert` | Runs subset construction and returns complete DFA with step-by-step logs |
| `POST` | `/api/simulate` | Executes synchronized string simulation across NFA and DFA with trace |

---

## 5. UI/UX & Visual Semantics

1. **Start State**: Directed blue marker pointing to start node ($q_0$ / $D_0$).
2. **Accepting State**: Distinct double concentric border (`border-style: double`, 6px width).
3. **Ordinary State**: Single solid border (2px width).
4. **Dead / Trap State ($\emptyset$)**: Red dashed border (`border-style: dashed`) with translucent red background.
5. **Compact Node Labeling**: Nodes render clean IDs (`D0`, `D1`, `∅`), preventing overlap. Full represented subsets are surfaced via the interactive State Inspector card and transition table.
6. **Active State Highlight**: Amber glow (`#f59e0b`, border `#d97706`).
7. **Active Transition Highlight**: Thick orange edge (`#ea580c`, width 4px).
8. **Input Tape**: Monospaced cells showing consumed symbols, active read head, and remaining characters.
9. **Theory Guide**: Embedded 10-question modal covering viva voce topics.
