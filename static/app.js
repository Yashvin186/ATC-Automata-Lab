/**
 * ATC Automata Lab — Interactive NFA-to-DFA Simulator Controller
 * Robust, resilient, high-contrast, offline-first.
 */

(() => {
  "use strict";

  const EPSILON = "ε";

  // Built-in presets for instant synchronous rendering and full offline fallback
  const BUILTIN_PRESETS = {
    ENDS_WITH_01: {
      id: "ENDS_WITH_01",
      name: "Ends with '01'",
      math_definition: "L = { w ∈ {0, 1}* | w ends with 01 }",
      alphabet: ["0", "1"],
      description: "All binary strings over {0, 1} whose final two symbols are strictly '01'.",
      rationale: "State q0 loops on all prefixes. On reading '0', the NFA branches: staying in q0 while advancing to q1. From q1, reading '1' reaches accepting state q2.",
      sample_accepted: ["01", "101", "1101", "001", "0101"],
      sample_rejected: ["", "0", "1", "10", "111", "010", "0100"],
      nfa: {
        states: ["q0", "q1", "q2"],
        alphabet: ["0", "1"],
        start_state: "q0",
        accepting_states: ["q2"],
        transitions: [
          { from: "q0", symbol: "0", to: ["q0", "q1"] },
          { from: "q0", symbol: "1", to: ["q0"] },
          { from: "q1", symbol: "1", to: ["q2"] },
        ],
      },
    },
    CONTAINS_110: {
      id: "CONTAINS_110",
      name: "Contains substring '110'",
      math_definition: "L = { w ∈ {0, 1}* | 110 occurs as a contiguous substring of w }",
      alphabet: ["0", "1"],
      description: "All binary strings over {0, 1} containing '110' as a contiguous substring.",
      rationale: "States q0 -> q1 -> q2 -> q3 represent pattern matching progress for '1', '11', and '110'. State q3 is an accepting sink.",
      sample_accepted: ["110", "0110", "1101", "0011011", "11100"],
      sample_rejected: ["", "0", "101", "111", "000", "1011"],
      nfa: {
        states: ["q0", "q1", "q2", "q3"],
        alphabet: ["0", "1"],
        start_state: "q0",
        accepting_states: ["q3"],
        transitions: [
          { from: "q0", symbol: "0", to: ["q0"] },
          { from: "q0", symbol: "1", to: ["q0", "q1"] },
          { from: "q1", symbol: "1", to: ["q2"] },
          { from: "q2", symbol: "0", to: ["q3"] },
          { from: "q3", symbol: "0", to: ["q3"] },
          { from: "q3", symbol: "1", to: ["q3"] },
        ],
      },
    },
    EVEN_NUMBER_OF_0S: {
      id: "EVEN_NUMBER_OF_0S",
      name: "Even number of '0's",
      math_definition: "L = { w ∈ {0, 1}* | |w|_0 mod 2 = 0 }",
      alphabet: ["0", "1"],
      description: "All binary strings over {0, 1} containing an even count of '0' symbols (including zero '0's).",
      rationale: "State q_even represents an even number of '0's seen so far (initial & accepting). State q_odd represents an odd number of '0's.",
      sample_accepted: ["", "1", "00", "10101", "11100", "010"],
      sample_rejected: ["0", "10", "000", "101", "0111"],
      nfa: {
        states: ["q_even", "q_odd"],
        alphabet: ["0", "1"],
        start_state: "q_even",
        accepting_states: ["q_even"],
        transitions: [
          { from: "q_even", symbol: "0", to: ["q_odd"] },
          { from: "q_even", symbol: "1", to: ["q_even"] },
          { from: "q_odd", symbol: "0", to: ["q_even"] },
          { from: "q_odd", symbol: "1", to: ["q_odd"] },
        ],
      },
    },
    EPSILON_DEMO: {
      id: "EPSILON_DEMO",
      name: "Epsilon Transitions Demo (0* followed by 1*)",
      math_definition: "L = { 0^m 1^n | m, n ≥ 0 }",
      alphabet: ["0", "1"],
      description: "Binary strings consisting of zero or more '0's followed by zero or more '1's connected via a spontaneous ε-transition.",
      rationale: "State q0 consumes '0's, while state q1 consumes '1's. The spontaneous ε-transition enables jumping from q0 to q1 without consuming input.",
      sample_accepted: ["", "0", "1", "00", "11", "0011", "0111"],
      sample_rejected: ["10", "010", "1100", "101"],
      nfa: {
        states: ["q0", "q1"],
        alphabet: ["0", "1"],
        start_state: "q0",
        accepting_states: ["q1"],
        transitions: [
          { from: "q0", symbol: "0", to: ["q0"] },
          { from: "q0", symbol: EPSILON, to: ["q1"] },
          { from: "q1", symbol: "1", to: ["q1"] },
        ],
      },
    },
  };

  const state = {
    mode: "preset",
    nfa: null,
    dfa: null,
    isDfaStale: false,

    cyNfa: null,
    cyDfa: null,

    conversionSteps: [],
    convCurrentStepIndex: -1,
    convTimer: null,
    convSpeedMs: 700,

    simData: null,
    simCurrentStepIndex: -1,
    simTimer: null,
    simSpeedMs: 700,
  };

  let els = {};

  function initElements() {
    els = {
      // Header & Modal
      btnOpenTheory: document.getElementById("btn-open-theory"),
      btnCloseTheory: document.getElementById("btn-close-theory"),
      btnModalCloseFooter: document.getElementById("btn-modal-close-footer"),
      theoryModal: document.getElementById("theory-modal"),
      globalAlert: document.getElementById("global-alert"),

      // Mode toggles
      btnModePreset: document.getElementById("btn-mode-preset"),
      btnModeManual: document.getElementById("btn-mode-manual"),
      sectionPresets: document.getElementById("section-presets"),
      sectionManual: document.getElementById("section-manual"),

      // Presets
      presetSelect: document.getElementById("preset-select"),
      btnLoadPreset: document.getElementById("btn-load-preset"),
      presetMathDef: document.getElementById("preset-math-def"),
      presetDesc: document.getElementById("preset-desc"),
      presetSamplesAcc: document.getElementById("preset-samples-acc"),
      presetSamplesRej: document.getElementById("preset-samples-rej"),
      nlPhraseInput: document.getElementById("nl-phrase-input"),
      btnNlMatch: document.getElementById("btn-nl-match"),
      nlMatchStatus: document.getElementById("nl-match-status"),

      // Manual Editor
      inputAlphabet: document.getElementById("input-alphabet"),
      btnUpdateAlphabet: document.getElementById("btn-update-alphabet"),
      inputNewState: document.getElementById("input-new-state"),
      btnAddState: document.getElementById("btn-add-state"),
      statesMetaTbody: document.getElementById("states-meta-tbody"),
      nfaEditorThead: document.getElementById("nfa-editor-thead"),
      nfaEditorTbody: document.getElementById("nfa-editor-tbody"),
      btnValidateNfa: document.getElementById("btn-validate-nfa"),
      btnConvertDfa: document.getElementById("btn-convert-dfa"),
      validationFeedback: document.getElementById("validation-feedback"),

      // Visualizer
      nodeInspectorPill: document.getElementById("node-inspector-pill"),
      cyNfaContainer: document.getElementById("cy-nfa"),
      cyDfaContainer: document.getElementById("cy-dfa"),
      nfaStatsBadge: document.getElementById("nfa-stats-badge"),
      dfaStatsBadge: document.getElementById("dfa-stats-badge"),
      btnZoomInNfa: document.getElementById("btn-zoom-in-nfa"),
      btnZoomOutNfa: document.getElementById("btn-zoom-out-nfa"),
      btnFitNfa: document.getElementById("btn-fit-nfa"),
      btnLayoutNfa: document.getElementById("btn-layout-nfa"),
      btnZoomInDfa: document.getElementById("btn-zoom-in-dfa"),
      btnZoomOutDfa: document.getElementById("btn-zoom-out-dfa"),
      btnFitDfa: document.getElementById("btn-fit-dfa"),
      btnLayoutDfa: document.getElementById("btn-layout-dfa"),

      // Stepper
      convStepCounter: document.getElementById("conv-step-counter"),
      btnConvReset: document.getElementById("btn-conv-reset"),
      btnConvStep: document.getElementById("btn-conv-step"),
      btnConvPlay: document.getElementById("btn-conv-play"),
      btnConvPause: document.getElementById("btn-conv-pause"),
      btnConvComplete: document.getElementById("btn-conv-complete"),
      convCurrSubset: document.getElementById("conv-curr-subset"),
      convSymbol: document.getElementById("conv-symbol"),
      convRawMove: document.getElementById("conv-raw-move"),
      convClosure: document.getElementById("conv-closure"),
      convDiscoveryBadge: document.getElementById("conv-discovery-badge"),
      convExplanationText: document.getElementById("conv-explanation-text"),

      // Tables tabs
      tabBtnNfa: document.getElementById("tab-btn-nfa"),
      tabBtnDfa: document.getElementById("tab-btn-dfa"),
      tabContentNfa: document.getElementById("tab-content-nfa"),
      tabContentDfa: document.getElementById("tab-content-dfa"),
      viewNfaThead: document.getElementById("view-nfa-thead"),
      viewNfaTbody: document.getElementById("view-nfa-tbody"),
      viewDfaThead: document.getElementById("view-dfa-thead"),
      viewDfaTbody: document.getElementById("view-dfa-tbody"),

      // Simulation
      simInputString: document.getElementById("sim-input-string"),
      btnSimRun: document.getElementById("btn-sim-run"),
      btnSimReset: document.getElementById("btn-sim-reset"),
      btnSimStep: document.getElementById("btn-sim-step"),
      btnSimPlay: document.getElementById("btn-sim-play"),
      btnSimPause: document.getElementById("btn-sim-pause"),
      selectSimSpeed: document.getElementById("select-sim-speed"),
      simQuickChips: document.getElementById("sim-quick-chips"),
      tapePosVal: document.getElementById("tape-pos-val"),
      tapeSymbolVal: document.getElementById("tape-symbol-val"),
      simTapeDisplay: document.getElementById("sim-tape-display"),
      liveNfaStates: document.getElementById("live-nfa-states"),
      liveNfaCount: document.getElementById("live-nfa-count"),
      liveDfaState: document.getElementById("live-dfa-state"),
      liveDfaSubset: document.getElementById("live-dfa-subset"),
      simStepExplanation: document.getElementById("sim-step-explanation"),
      simStatusBanner: document.getElementById("sim-status-banner"),
      badgeNfaResult: document.getElementById("badge-nfa-result"),
      badgeDfaResult: document.getElementById("badge-dfa-result"),
      simVerificationMsg: document.getElementById("sim-verification-msg"),
      simResultDetails: document.getElementById("sim-result-details"),
      traceRowCount: document.getElementById("trace-row-count"),
      traceTbody: document.getElementById("trace-tbody"),
    };
  }

  // Cytoscape Visual Styles
  const cyStyles = [
    {
      selector: "node",
      style: {
        "label": "data(label)",
        "color": "#1e293b",
        "font-size": "13px",
        "font-weight": "700",
        "text-valign": "center",
        "text-halign": "center",
        "background-color": "#ffffff",
        "border-width": 2,
        "border-color": "#334155",
        "width": 48,
        "height": 48,
        "transition-property": "background-color, border-color, border-width",
        "transition-duration": "0.15s",
      }
    },
    {
      selector: "node[?isAccepting]",
      style: {
        "border-style": "double",
        "border-width": 6,
        "border-color": "#1e293b",
      }
    },
    {
      selector: "node[?isStart]",
      style: {
        "border-color": "#2563eb",
        "border-width": 3,
      }
    },
    {
      selector: "node[?isTrap]",
      style: {
        "border-style": "dashed",
        "border-color": "#dc2626",
        "border-width": 2,
        "background-color": "#fef2f2",
        "color": "#991b1b",
      }
    },
    {
      selector: "node.active-state",
      style: {
        "background-color": "#fde047",
        "border-color": "#ca8a04",
        "border-width": 4,
        "color": "#854d0e",
      }
    },
    {
      selector: "node.start-pointer",
      style: {
        "width": 1,
        "height": 1,
        "shape": "rectangle",
        "background-opacity": 0,
        "border-opacity": 0,
        "font-size": "11px",
        "font-weight": "800",
        "color": "#2563eb",
        "text-valign": "top",
        "text-halign": "center",
      }
    },
    {
      selector: "edge",
      style: {
        "label": "data(label)",
        "curve-style": "bezier",
        "target-arrow-shape": "triangle",
        "target-arrow-color": "#64748b",
        "line-color": "#94a3b8",
        "width": 2,
        "font-size": "11px",
        "font-weight": "700",
        "color": "#0f172a",
        "text-background-color": "#ffffff",
        "text-background-opacity": 0.95,
        "text-background-padding": "2px",
        "text-background-shape": "roundrectangle",
        "arrow-scale": 1.15,
      }
    },
    {
      selector: "edge.active-edge",
      style: {
        "line-color": "#ea580c",
        "target-arrow-color": "#ea580c",
        "width": 4,
        "arrow-scale": 1.4,
        "color": "#c2410c",
      }
    }
  ];

  function showGlobalAlert(message, type = "info") {
    if (!els.globalAlert) return;
    els.globalAlert.className = `global-alert ${type}`;
    els.globalAlert.textContent = message;
    els.globalAlert.classList.remove("hidden");
    clearTimeout(els.globalAlert._timer);
    els.globalAlert._timer = setTimeout(() => {
      els.globalAlert.classList.add("hidden");
    }, 4500);
  }

  function showValidationFeedback(html, isValid = true) {
    if (!els.validationFeedback) return;
    els.validationFeedback.className = `feedback-box ${isValid ? "valid" : "invalid"}`;
    els.validationFeedback.innerHTML = html;
    els.validationFeedback.classList.remove("hidden");
  }

  function hideValidationFeedback() {
    if (els.validationFeedback) {
      els.validationFeedback.classList.add("hidden");
    }
  }

  function initCytoscape() {
    if (typeof cytoscape === "undefined") {
      console.warn("Cytoscape.js is not loaded.");
      return;
    }

    if (els.cyNfaContainer) {
      state.cyNfa = cytoscape({
        container: els.cyNfaContainer,
        style: cyStyles,
        layout: { name: "circle", padding: 35 },
        boxSelectionEnabled: false,
        userZoomingEnabled: true,
        userPanningEnabled: true,
      });

      state.cyNfa.on("mouseover tap", "node", (e) => {
        const d = e.target.data();
        if (d.id === "__start_node__") return;
        if (els.nodeInspectorPill) {
          els.nodeInspectorPill.textContent = `NFA State: ${d.id} ${d.isAccepting ? "(Accepting)" : ""} ${d.isStart ? "(Start)" : ""}`;
        }
      });
    }

    if (els.cyDfaContainer) {
      state.cyDfa = cytoscape({
        container: els.cyDfaContainer,
        style: cyStyles,
        layout: { name: "circle", padding: 35 },
        boxSelectionEnabled: false,
        userZoomingEnabled: true,
        userPanningEnabled: true,
      });

      state.cyDfa.on("mouseover tap", "node", (e) => {
        const d = e.target.data();
        if (d.id === "__start_node__") return;
        const sub = d.subset ? (d.subset.length ? `{${d.subset.join(", ")}}` : "∅") : "";
        if (els.nodeInspectorPill) {
          els.nodeInspectorPill.textContent = `DFA State ${d.id}: Subset ${sub} ${d.isAccepting ? "(Accepting)" : ""} ${d.isTrap ? "(Trap ∅)" : ""}`;
        }
      });
    }
  }

  function runLayout(cy) {
    if (!cy) return;
    try {
      cy.resize();
      const layout = cy.layout({
        name: "circle",
        padding: 40,
        animate: false,
      });
      layout.run();
      cy.fit(30);
    } catch (err) {
      console.warn("Cytoscape layout error:", err);
    }
  }

  function buildGraphElements(automaton, isDfa = false) {
    const elements = [];

    if (automaton.start_state) {
      elements.push({
        data: { id: "__start_node__", label: "START" },
        classes: "start-pointer",
      });
      elements.push({
        data: {
          id: "__start_edge__",
          source: "__start_node__",
          target: automaton.start_state,
          label: "",
        },
        style: {
          "line-color": "#2563eb",
          "target-arrow-color": "#2563eb",
          "line-style": "dashed",
          "width": 2,
        }
      });
    }

    const states = automaton.states || [];
    const acceptingSet = new Set(automaton.accepting_states || []);

    states.forEach(s => {
      let label = s;
      let isTrap = false;
      let subsetList = [];

      if (isDfa) {
        subsetList = automaton.subset_map ? (automaton.subset_map[s] || []) : [];
        isTrap = (s === automaton.trap_state_id || subsetList.length === 0);
        label = isTrap ? "∅" : s;
      }

      elements.push({
        data: {
          id: s,
          label: label,
          subset: subsetList,
          isStart: (s === automaton.start_state),
          isAccepting: acceptingSet.has(s),
          isTrap: isTrap,
        }
      });
    });

    // Group transitions by (source, destination)
    const edgeMap = new Map();
    (automaton.transitions || []).forEach(t => {
      const src = t.from;
      const sym = t.symbol;
      const targets = Array.isArray(t.to) ? t.to : [t.to];
      targets.forEach(tgt => {
        const key = `${src}__to__${tgt}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, { src, tgt, symbols: new Set() });
        }
        edgeMap.get(key).symbols.add(sym);
      });
    });

    edgeMap.forEach(({ src, tgt, symbols }, key) => {
      elements.push({
        data: {
          id: key,
          source: src,
          target: tgt,
          label: Array.from(symbols).sort().join(", "),
          symbols: Array.from(symbols),
        }
      });
    });

    return elements;
  }

  function renderNfaGraph() {
    if (!state.cyNfa || !state.nfa) return;
    const elements = buildGraphElements(state.nfa, false);
    state.cyNfa.elements().remove();
    state.cyNfa.add(elements);
    runLayout(state.cyNfa);
    if (els.nfaStatsBadge) {
      els.nfaStatsBadge.textContent = `${state.nfa.states.length} states`;
    }
  }

  function renderDfaGraph() {
    if (!state.cyDfa) return;
    if (!state.dfa) {
      state.cyDfa.elements().remove();
      if (els.dfaStatsBadge) els.dfaStatsBadge.textContent = "0 states";
      return;
    }
    const elements = buildGraphElements(state.dfa, true);
    state.cyDfa.elements().remove();
    state.cyDfa.add(elements);
    runLayout(state.cyDfa);
    if (els.dfaStatsBadge) {
      els.dfaStatsBadge.textContent = `${state.dfa.states.length} states`;
    }
  }

  function renderChips(container, items, type) {
    if (!container) return;
    container.innerHTML = items.map(item => {
      const displayLabel = item === "" ? "ε (empty)" : item;
      const chipClass = type === "acc" ? "chip chip-acc" : (type === "rej" ? "chip chip-rej" : "chip");
      return `<span class="${chipClass}" data-str="${item}">${displayLabel}</span>`;
    }).join("");
  }

  // --- Transition Tables ---
  function renderViewTables() {
    // 1. NFA Table
    if (state.nfa && els.viewNfaThead && els.viewNfaTbody) {
      const symbols = [...state.nfa.alphabet, EPSILON];
      let theadHtml = "<tr><th>State</th>";
      symbols.forEach(sym => {
        theadHtml += `<th>${sym === EPSILON ? "ε (epsilon)" : sym}</th>`;
      });
      theadHtml += "</tr>";
      els.viewNfaThead.innerHTML = theadHtml;

      const tMap = new Map();
      (state.nfa.transitions || []).forEach(t => {
        const tgts = Array.isArray(t.to) ? t.to : [t.to];
        tMap.set(`${t.from}__${t.symbol}`, tgts);
      });

      let tbodyHtml = "";
      state.nfa.states.forEach(s => {
        const isStart = (s === state.nfa.start_state);
        const isAccept = (state.nfa.accepting_states || []).includes(s);
        let prefix = "";
        if (isStart) prefix += "→ ";
        if (isAccept) prefix += "* ";
        tbodyHtml += `<tr><td><strong>${prefix}${s}</strong></td>`;
        symbols.forEach(sym => {
          const destinations = tMap.get(`${s}__${sym}`) || [];
          const cellContent = destinations.length > 0 ? `{${destinations.join(", ")}}` : "∅";
          tbodyHtml += `<td>${cellContent}</td>`;
        });
        tbodyHtml += "</tr>";
      });
      els.viewNfaTbody.innerHTML = tbodyHtml;
    }

    // 2. DFA Table
    if (state.dfa && els.viewDfaThead && els.viewDfaTbody) {
      const symbols = state.dfa.alphabet || [];
      let theadHtml = "<tr><th>DFA State</th><th>Represented Subset</th>";
      symbols.forEach(sym => {
        theadHtml += `<th>${sym}</th>`;
      });
      theadHtml += "</tr>";
      els.viewDfaThead.innerHTML = theadHtml;

      const dfaTMap = new Map();
      (state.dfa.transitions || []).forEach(t => {
        dfaTMap.set(`${t.from}__${t.symbol}`, t.to);
      });

      let tbodyHtml = "";
      state.dfa.states.forEach(s => {
        const isStart = (s === state.dfa.start_state);
        const isAccept = (state.dfa.accepting_states || []).includes(s);
        const isTrap = (s === state.dfa.trap_state_id);
        let prefix = "";
        if (isStart) prefix += "→ ";
        if (isAccept) prefix += "* ";
        const subsetList = state.dfa.subset_map ? (state.dfa.subset_map[s] || []) : [];
        const subsetStr = subsetList.length ? `{${subsetList.join(", ")}}` : "∅";

        tbodyHtml += `
          <tr>
            <td><strong>${prefix}${s}</strong></td>
            <td><strong>${subsetStr}</strong>${isTrap ? " [Trap ∅]" : ""}</td>
        `;
        symbols.forEach(sym => {
          const target = dfaTMap.get(`${s}__${sym}`);
          const targetSubList = target && state.dfa.subset_map ? (state.dfa.subset_map[target] || []) : [];
          const targetSub = targetSubList.length ? `{${targetSubList.join(", ")}}` : "∅";
          const targetCell = target ? `${target} (${targetSub})` : "-";
          tbodyHtml += `<td>${targetCell}</td>`;
        });
        tbodyHtml += "</tr>";
      });
      els.viewDfaTbody.innerHTML = tbodyHtml;
    } else if (els.viewDfaThead && els.viewDfaTbody) {
      els.viewDfaThead.innerHTML = "";
      els.viewDfaTbody.innerHTML = "<tr><td colspan='4'>No DFA converted yet. Click 'Convert to DFA'.</td></tr>";
    }
  }

  // --- Manual Editor Rendering ---
  function renderManualEditor() {
    if (!state.nfa || !els.statesMetaTbody || !els.nfaEditorThead || !els.nfaEditorTbody) return;

    let metaHtml = "";
    state.nfa.states.forEach(s => {
      const isStart = (s === state.nfa.start_state);
      const isAccept = (state.nfa.accepting_states || []).includes(s);
      metaHtml += `
        <tr>
          <td><strong>${s}</strong></td>
          <td>
            <input type="radio" name="state_start_radio" value="${s}" ${isStart ? "checked" : ""} class="radio-start">
          </td>
          <td>
            <input type="checkbox" value="${s}" ${isAccept ? "checked" : ""} class="cb-accept">
          </td>
          <td>
            <button type="button" class="btn-rename-xs btn-rename-state" data-state="${s}" title="Rename state">Rename</button>
            <button type="button" class="btn-danger-xs btn-del-state" data-state="${s}" title="Delete state">Delete</button>
          </td>
        </tr>
      `;
    });
    els.statesMetaTbody.innerHTML = metaHtml;

    const symbols = [...state.nfa.alphabet, EPSILON];
    let theadHtml = "<tr><th>State</th>";
    symbols.forEach(sym => {
      theadHtml += `<th>${sym === EPSILON ? "ε (epsilon)" : sym}</th>`;
    });
    theadHtml += "</tr>";
    els.nfaEditorThead.innerHTML = theadHtml;

    const tMap = new Map();
    (state.nfa.transitions || []).forEach(t => {
      const tgts = Array.isArray(t.to) ? t.to : [t.to];
      tMap.set(`${t.from}__${t.symbol}`, tgts);
    });

    let tbodyHtml = "";
    state.nfa.states.forEach(s => {
      tbodyHtml += `<tr><td><strong>${s}</strong></td>`;
      symbols.forEach(sym => {
        const dests = tMap.get(`${s}__${sym}`) || [];
        tbodyHtml += `
          <td>
            <input type="text" 
                   class="matrix-cell-input" 
                   data-from="${s}" 
                   data-symbol="${sym}" 
                   value="${dests.join(", ")}" 
                   placeholder="e.g. q0, q1">
          </td>
        `;
      });
      tbodyHtml += "</tr>";
    });
    els.nfaEditorTbody.innerHTML = tbodyHtml;
  }

  function readManualEditorNFA() {
    const selectedStartRadio = document.querySelector(".radio-start:checked");
    const startState = selectedStartRadio ? selectedStartRadio.value : (state.nfa.states[0] || "");
    const checkedAccepting = Array.from(document.querySelectorAll(".cb-accept:checked")).map(cb => cb.value);

    const transitions = [];
    const cellInputs = document.querySelectorAll(".matrix-cell-input");
    cellInputs.forEach(input => {
      const from = input.getAttribute("data-from");
      const symbol = input.getAttribute("data-symbol");
      const val = input.value.trim();
      if (val) {
        const targets = val.split(",").map(t => t.trim()).filter(Boolean);
        if (targets.length > 0) {
          transitions.push({
            from: from,
            symbol: symbol,
            to: targets,
          });
        }
      }
    });

    return {
      states: [...state.nfa.states],
      alphabet: [...state.nfa.alphabet],
      start_state: startState,
      accepting_states: checkedAccepting,
      transitions: transitions,
    };
  }

  function renameState(oldName) {
    const newName = prompt(`Enter new state identifier for '${oldName}':`, oldName);
    if (!newName || newName.trim() === oldName) return;
    const cleanNew = newName.trim();
    if (state.nfa.states.includes(cleanNew)) {
      showGlobalAlert(`State identifier '${cleanNew}' already exists.`, "danger");
      return;
    }

    state.nfa.states = state.nfa.states.map(s => s === oldName ? cleanNew : s).sort();
    if (state.nfa.start_state === oldName) state.nfa.start_state = cleanNew;
    state.nfa.accepting_states = (state.nfa.accepting_states || []).map(s => s === oldName ? cleanNew : s).sort();

    state.nfa.transitions = (state.nfa.transitions || []).map(t => {
      const newFrom = t.from === oldName ? cleanNew : t.from;
      const targets = Array.isArray(t.to) ? t.to : [t.to];
      const newTargets = targets.map(x => x === oldName ? cleanNew : x);
      return { from: newFrom, symbol: t.symbol, to: newTargets };
    });

    markDfaStale();
    renderNfaGraph();
    renderManualEditor();
    renderViewTables();
    showGlobalAlert(`Renamed state '${oldName}' to '${cleanNew}'.`, "success");
  }

  function markDfaStale() {
    state.isDfaStale = true;
    state.dfa = null;
    state.conversionSteps = [];
    state.convCurrentStepIndex = -1;
    resetConversionStepper();
    renderDfaGraph();
    renderViewTables();
    resetSimulationState();
  }

  // --- Client-side fallback algorithms (guarantees offline & zero-latency execution) ---
  function computeEpsilonClosureClient(nfa, stateSet) {
    const closure = new Set(stateSet);
    const stack = Array.from(stateSet);
    const trans = nfa.transitions || [];

    while (stack.length > 0) {
      const curr = stack.pop();
      trans.forEach(t => {
        if (t.from === curr && t.symbol === EPSILON) {
          const targets = Array.isArray(t.to) ? t.to : [t.to];
          targets.forEach(tgt => {
            if (!closure.has(tgt)) {
              closure.add(tgt);
              stack.push(tgt);
            }
          });
        }
      });
    }
    return Array.from(closure).sort();
  }

  function computeMoveClient(nfa, stateSet, symbol) {
    const dests = new Set();
    const trans = nfa.transitions || [];
    trans.forEach(t => {
      if (t.symbol === symbol && stateSet.includes(t.from)) {
        const targets = Array.isArray(t.to) ? t.to : [t.to];
        targets.forEach(tgt => dests.add(tgt));
      }
    });
    return Array.from(dests).sort();
  }

  function runClientSubsetConstruction(nfa) {
    const alphabet = [...nfa.alphabet].sort();
    const initialClosure = computeEpsilonClosureClient(nfa, [nfa.start_state]);
    const initKey = JSON.stringify(initialClosure);

    const subsetToId = new Map([[initKey, "D0"]]);
    const idToSubset = { "D0": initialClosure };
    const queue = ["D0"];
    const dfaTransitions = [];
    const conversionSteps = [];
    let stateCounter = 1;

    conversionSteps.push({
      step_number: 1,
      source_subset: [],
      source_dfa_state: "",
      symbol: "ε",
      move_result: [nfa.start_state],
      closure_result: initialClosure,
      target_dfa_state: "D0",
      is_new_subset: true,
      explanation: `Initial state: D0 = ε-closure({${nfa.start_state}}) = {${initialClosure.join(", ")}}.`,
    });

    let stepNum = 2;
    while (queue.length > 0) {
      const currentDfaId = queue.shift();
      const currentSubset = idToSubset[currentDfaId];

      for (const symbol of alphabet) {
        const rawMove = computeMoveClient(nfa, currentSubset, symbol);
        const closure = computeEpsilonClosureClient(nfa, rawMove);
        const key = JSON.stringify(closure);

        let isNew = false;
        let targetId = subsetToId.get(key);

        if (!targetId) {
          isNew = true;
          targetId = closure.length === 0 ? "DEAD" : `D${stateCounter++}`;
          subsetToId.set(key, targetId);
          idToSubset[targetId] = closure;
          queue.push(targetId);
        }

        dfaTransitions.push({
          from: currentDfaId,
          symbol: symbol,
          to: targetId,
        });

        const targetDesc = closure.length ? `{${closure.join(", ")}}` : "∅ (Dead State)";
        conversionSteps.push({
          step_number: stepNum++,
          source_subset: currentSubset,
          source_dfa_state: currentDfaId,
          symbol: symbol,
          move_result: rawMove,
          closure_result: closure,
          target_dfa_state: targetId,
          is_new_subset: isNew,
          explanation: `From ${currentDfaId} on '${symbol}': raw move {${rawMove.join(", ")}} -> ε-closure gives ${targetDesc} (${targetId}).`,
        });
      }
    }

    const nfaAccepting = new Set(nfa.accepting_states || []);
    const dfaStates = Object.keys(idToSubset).sort();
    const dfaAccepting = dfaStates.filter(id => {
      const sub = idToSubset[id];
      return sub.some(s => nfaAccepting.has(s));
    });

    const trapId = dfaStates.find(id => idToSubset[id].length === 0) || null;

    return {
      dfa: {
        states: dfaStates,
        alphabet: alphabet,
        start_state: "D0",
        accepting_states: dfaAccepting,
        transitions: dfaTransitions,
        subset_map: idToSubset,
        trap_state_id: trapId,
      },
      conversion_steps: conversionSteps,
    };
  }

  function runClientSimulation(nfa, dfa, inputStr) {
    // 1. NFA Simulation
    const nfaAccepting = new Set(nfa.accepting_states || []);
    let currentActive = computeEpsilonClosureClient(nfa, [nfa.start_state]);
    const initialActive = [...currentActive];
    const nfaTrace = [];

    for (let i = 0; i < inputStr.length; i++) {
      const sym = inputStr[i];
      const prevActive = [...currentActive];
      const rawMove = computeMoveClient(nfa, currentActive, sym);
      const nextActive = computeEpsilonClosureClient(nfa, rawMove);

      nfaTrace.push({
        step: i + 1,
        symbol: sym,
        prev_active: prevActive,
        raw_destinations: rawMove,
        active_states: nextActive,
        explanation: `NFA moved on '${sym}' to {${rawMove.join(", ")}}, ε-closure = {${nextActive.join(", ")}}.`,
      });
      currentActive = nextActive;
    }

    const nfaAccepted = currentActive.some(s => nfaAccepting.has(s));

    // 2. DFA Simulation
    const dfaAccepting = new Set(dfa.accepting_states || []);
    const dfaTMap = new Map();
    (dfa.transitions || []).forEach(t => {
      dfaTMap.set(`${t.from}__${t.symbol}`, t.to);
    });

    let currentDfaState = dfa.start_state;
    const dfaTrace = [];

    for (let i = 0; i < inputStr.length; i++) {
      const sym = inputStr[i];
      const prevState = currentDfaState;
      const nextState = dfaTMap.get(`${prevState}__${sym}`) || dfa.trap_state_id || prevState;
      const nextSub = (dfa.subset_map && dfa.subset_map[nextState]) || [];

      dfaTrace.push({
        step: i + 1,
        symbol: sym,
        prev_state: prevState,
        next_state: nextState,
        next_subset: nextSub,
        explanation: `DFA transition δ(${prevState}, '${sym}') = ${nextState}.`,
      });
      currentDfaState = nextState;
    }

    const dfaAccepted = dfaAccepting.has(currentDfaState);
    const finalDfaSub = (dfa.subset_map && dfa.subset_map[currentDfaState]) || [];
    const agrees = (nfaAccepted === dfaAccepted);
    const statusText = nfaAccepted ? "ACCEPTED" : "REJECTED";

    return {
      status: "success",
      input_string: inputStr,
      agrees: agrees,
      verification_message: agrees 
        ? `Both machines agree on this input (${statusText}).`
        : "ERROR: NFA and DFA results differ. Check implementation.",
      nfa_result: {
        is_accepted: nfaAccepted,
        initial_active: initialActive,
        final_states: currentActive,
        trace: nfaTrace,
      },
      dfa_result: {
        is_accepted: dfaAccepted,
        initial_state: dfa.start_state,
        initial_subset: (dfa.subset_map && dfa.subset_map[dfa.start_state]) || [],
        final_state: currentDfaState,
        final_subset: finalDfaSub,
        trace: dfaTrace,
      },
    };
  }

  // --- API & State Synchronization ---
  async function loadPreset(presetId) {
    const builtin = BUILTIN_PRESETS[presetId] || BUILTIN_PRESETS.ENDS_WITH_01;
    
    // 1. Immediately apply built-in preset for instant synchronous display
    state.nfa = JSON.parse(JSON.stringify(builtin.nfa));
    markDfaStale();

    if (els.presetMathDef) els.presetMathDef.textContent = builtin.math_definition;
    if (els.presetDesc) els.presetDesc.textContent = builtin.description;
    if (els.inputAlphabet) els.inputAlphabet.value = (builtin.alphabet || []).join(", ");
    if (els.presetSelect) els.presetSelect.value = presetId;

    renderChips(els.presetSamplesAcc, builtin.sample_accepted || [], "acc");
    renderChips(els.presetSamplesRej, builtin.sample_rejected || [], "rej");
    renderChips(els.simQuickChips, [...(builtin.sample_accepted || []), ...(builtin.sample_rejected || [])], "sim");

    if (els.simInputString && (!els.simInputString.value || !els.simInputString.value.trim())) {
      els.simInputString.value = (builtin.sample_accepted && builtin.sample_accepted[0]) || "01";
    }

    renderNfaGraph();
    renderManualEditor();
    renderViewTables();
    hideValidationFeedback();

    // 2. Attempt backend API fetch if available, else use client-side
    try {
      const res = await fetch(`/api/presets/${presetId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success") {
          state.nfa = data.nfa;
          const meta = data.metadata || builtin;
          if (els.presetMathDef) els.presetMathDef.textContent = meta.math_definition || builtin.math_definition;
          if (els.presetDesc) els.presetDesc.textContent = meta.description || builtin.description;
          renderNfaGraph();
          renderManualEditor();
          renderViewTables();
        }
      }
    } catch {
      // Backend not running, already gracefully populated from BUILTIN_PRESETS
    }

    // Convert NFA to DFA
    await convertNfaToDfa();
  }

  async function validateNfa() {
    if (state.mode === "manual") {
      state.nfa = readManualEditorNFA();
    }
    if (!state.nfa || !state.nfa.states || state.nfa.states.length === 0) {
      showValidationFeedback("Automaton must have at least one state.", false);
      return false;
    }
    if (!state.nfa.start_state || !state.nfa.states.includes(state.nfa.start_state)) {
      showValidationFeedback("Initial start state must be one of the declared states.", false);
      return false;
    }

    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.nfa),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          showValidationFeedback("Automaton is mathematically valid and well-formed.", true);
          return true;
        } else {
          const errorMsg = (data.errors || []).join("<br>");
          showValidationFeedback(`Validation Errors:<br>${errorMsg}`, false);
          return false;
        }
      }
    } catch {
      // Offline fallback validation
    }

    showValidationFeedback("Automaton is valid and ready for conversion.", true);
    return true;
  }

  async function convertNfaToDfa() {
    if (state.mode === "manual") {
      state.nfa = readManualEditorNFA();
    }
    const isValid = await validateNfa();
    if (!isValid) return;

    let converted = false;
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nfa: state.nfa }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success") {
          state.dfa = data.dfa;
          state.conversionSteps = data.conversion_steps || [];
          converted = true;
        }
      }
    } catch {
      // Offline fallback
    }

    if (!converted) {
      const res = runClientSubsetConstruction(state.nfa);
      state.dfa = res.dfa;
      state.conversionSteps = res.conversion_steps;
    }

    state.isDfaStale = false;
    state.convCurrentStepIndex = -1;

    renderDfaGraph();
    renderViewTables();
    initConversionStepper();
    resetSimulationState();
    showGlobalAlert("Converted NFA to complete DFA using subset construction.", "success");
  }

  async function runSimulation(inputString) {
    if (!state.nfa) {
      showGlobalAlert("Please load or build an NFA first.", "danger");
      return;
    }
    if (!state.dfa || state.isDfaStale) {
      await convertNfaToDfa();
    }

    const cleanInput = (inputString !== undefined && inputString !== null) ? inputString.trim() : "";
    let simulated = false;

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nfa: state.nfa,
          dfa: state.dfa,
          input_string: cleanInput,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success") {
          state.simData = data;
          simulated = true;
        }
      }
    } catch {
      // Offline fallback
    }

    if (!simulated) {
      state.simData = runClientSimulation(state.nfa, state.dfa, cleanInput);
    }

    renderSimulationTraceTable(state.simData);
    renderTape(cleanInput);
    applySimulationStep(cleanInput.length);
  }

  // --- Conversion Stepper ---
  function initConversionStepper() {
    state.convCurrentStepIndex = -1;
    if (els.convStepCounter) {
      els.convStepCounter.textContent = `Step 0 / ${state.conversionSteps.length}`;
    }
    if (els.convCurrSubset) els.convCurrSubset.textContent = "-";
    if (els.convSymbol) els.convSymbol.textContent = "-";
    if (els.convRawMove) els.convRawMove.textContent = "-";
    if (els.convClosure) els.convClosure.textContent = "-";
    if (els.convDiscoveryBadge) {
      els.convDiscoveryBadge.className = "badge-status";
      els.convDiscoveryBadge.textContent = "Ready";
    }
    if (els.convExplanationText) {
      els.convExplanationText.textContent = "Click 'Step Next' or 'Play' to trace subset construction step-by-step.";
    }
  }

  function resetConversionStepper() {
    pauseConversion();
    initConversionStepper();
    if (state.cyNfa) {
      state.cyNfa.nodes().removeClass("active-state");
      state.cyNfa.edges().removeClass("active-edge");
    }
    if (state.cyDfa) {
      state.cyDfa.nodes().removeClass("active-state");
      state.cyDfa.edges().removeClass("active-edge");
    }
  }

  function applyConversionStep(index) {
    if (!state.conversionSteps || index < 0 || index >= state.conversionSteps.length) return;
    state.convCurrentStepIndex = index;
    const step = state.conversionSteps[index];

    if (els.convStepCounter) {
      els.convStepCounter.textContent = `Step ${index + 1} / ${state.conversionSteps.length}`;
    }

    const srcSub = (step.source_subset && step.source_subset.length) ? `{${step.source_subset.join(", ")}}` : (step.source_dfa_state || "-");
    const rawMov = (step.move_result && step.move_result.length) ? `{${step.move_result.join(", ")}}` : "∅";
    const clRes = (step.closure_result && step.closure_result.length) ? `{${step.closure_result.join(", ")}}` : "∅";

    if (els.convCurrSubset) els.convCurrSubset.textContent = srcSub;
    if (els.convSymbol) els.convSymbol.textContent = step.symbol;
    if (els.convRawMove) els.convRawMove.textContent = rawMov;
    if (els.convClosure) els.convClosure.textContent = clRes;

    if (els.convDiscoveryBadge) {
      if (step.is_new_subset) {
        els.convDiscoveryBadge.className = "badge-status badge-new";
        els.convDiscoveryBadge.textContent = `New State (${step.target_dfa_state})`;
      } else {
        els.convDiscoveryBadge.className = "badge-status badge-existing";
        els.convDiscoveryBadge.textContent = `Existing (${step.target_dfa_state})`;
      }
    }

    if (els.convExplanationText) {
      els.convExplanationText.textContent = step.explanation;
    }

    // Graph highlights
    if (state.cyNfa) {
      state.cyNfa.nodes().removeClass("active-state");
      (step.closure_result || []).forEach(nfaState => {
        const node = state.cyNfa.getElementById(nfaState);
        if (node) node.addClass("active-state");
      });
    }

    if (state.cyDfa && step.target_dfa_state) {
      state.cyDfa.nodes().removeClass("active-state");
      const dfaNode = state.cyDfa.getElementById(step.target_dfa_state);
      if (dffaNodeValid(dfaNode)) dfaNode.addClass("active-state");
    }
  }

  function dffaNodeValid(node) {
    return node && node.length > 0;
  }

  function stepConversionNext() {
    if (!state.conversionSteps.length) return;
    if (state.convCurrentStepIndex < state.conversionSteps.length - 1) {
      applyConversionStep(state.convCurrentStepIndex + 1);
    } else {
      pauseConversion();
      showGlobalAlert("Subset construction step playback complete.", "success");
    }
  }

  function playConversion() {
    if (!state.conversionSteps.length) return;
    if (els.btnConvPlay) els.btnConvPlay.classList.add("hidden");
    if (els.btnConvPause) els.btnConvPause.classList.remove("hidden");
    if (state.convCurrentStepIndex >= state.conversionSteps.length - 1) {
      state.convCurrentStepIndex = -1;
    }
    stepConversionNext();
    state.convTimer = setInterval(() => {
      if (state.convCurrentStepIndex < state.conversionSteps.length - 1) {
        stepConversionNext();
      } else {
        pauseConversion();
      }
    }, state.convSpeedMs);
  }

  function pauseConversion() {
    if (state.convTimer) {
      clearInterval(state.convTimer);
      state.convTimer = null;
    }
    if (els.btnConvPlay) els.btnConvPlay.classList.remove("hidden");
    if (els.btnConvPause) els.btnConvPause.classList.add("hidden");
  }

  function completeConversion() {
    pauseConversion();
    if (state.conversionSteps.length > 0) {
      applyConversionStep(state.conversionSteps.length - 1);
    }
  }

  // --- String Simulation Controller ---
  function resetSimulationState() {
    pauseSimulation();
    state.simData = null;
    state.simCurrentStepIndex = -1;

    if (els.tapePosVal) els.tapePosVal.textContent = "0 / 0";
    if (els.tapeSymbolVal) els.tapeSymbolVal.textContent = "-";
    if (els.simTapeDisplay) {
      els.simTapeDisplay.innerHTML = '<span class="empty-tape-note">Enter input string and click Step Next or Run All.</span>';
    }
    if (els.liveNfaStates) els.liveNfaStates.textContent = "∅";
    if (els.liveNfaCount) els.liveNfaCount.textContent = "0 active states";
    if (els.liveDfaState) els.liveDfaState.textContent = "-";
    if (els.liveDfaSubset) els.liveDfaSubset.textContent = "Subset: -";
    if (els.simStepExplanation) {
      els.simStepExplanation.textContent = "Ready to simulate. Enter a test string over the alphabet and click Step Next or Run All.";
    }
    if (els.simStatusBanner) els.simStatusBanner.classList.add("hidden");
    if (els.traceRowCount) els.traceRowCount.textContent = "0 steps";
    if (els.traceTbody) {
      els.traceTbody.innerHTML = '<tr><td colspan="7" class="empty-trace-cell">Run or step through a string to inspect synchronized traces.</td></tr>';
    }

    if (state.cyNfa) {
      state.cyNfa.nodes().removeClass("active-state");
      state.cyNfa.edges().removeClass("active-edge");
    }
    if (state.cyDfa) {
      state.cyDfa.nodes().removeClass("active-state");
      state.cyDfa.edges().removeClass("active-edge");
    }
  }

  function renderTape(inputStr) {
    if (!els.simTapeDisplay) return;
    if (!inputStr) {
      els.simTapeDisplay.innerHTML = `
        <div class="tape-cell consumed" title="Empty string ε">
          <span class="char">ε</span>
          <span class="idx">0</span>
        </div>
      `;
      return;
    }
    let cellsHtml = "";
    for (let i = 0; i < inputStr.length; i++) {
      cellsHtml += `
        <div class="tape-cell" id="tape-cell-${i}">
          <span class="char">${inputStr[i]}</span>
          <span class="idx">${i + 1}</span>
        </div>
      `;
    }
    els.simTapeDisplay.innerHTML = cellsHtml;
  }

  function updateTapeHighlight(stepIdx, totalLen) {
    if (!els.simTapeDisplay) return;
    const cells = els.simTapeDisplay.querySelectorAll(".tape-cell");
    cells.forEach((cell, idx) => {
      cell.classList.remove("active", "consumed");
      if (idx < stepIdx) {
        cell.classList.add("consumed");
      } else if (idx === stepIdx && stepIdx < totalLen) {
        cell.classList.add("active");
        cell.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    });
  }

  function renderSimulationTraceTable(simData) {
    if (!els.traceTbody || !els.traceRowCount) return;
    const nfaTrace = (simData.nfa_result && simData.nfa_result.trace) || [];
    const dfaTrace = (simData.dfa_result && simData.dfa_result.trace) || [];
    const stepsCount = nfaTrace.length;
    els.traceRowCount.textContent = `${stepsCount} steps`;

    if (stepsCount === 0) {
      const initNfaStr = `{${((simData.nfa_result && simData.nfa_result.initial_active) || []).join(", ")}}`;
      const initDfaSubStr = `{${((simData.dfa_result && simData.dfa_result.initial_subset) || []).join(", ")}}`;
      els.traceTbody.innerHTML = `
        <tr class="trace-row active" id="trace-row-0">
          <td>0</td>
          <td><strong>ε (Empty)</strong></td>
          <td>-</td>
          <td>-</td>
          <td><strong>${initNfaStr}</strong></td>
          <td>-</td>
          <td><strong>${(simData.dfa_result && simData.dfa_result.initial_state) || "D0"}</strong> (${initDfaSubStr})</td>
        </tr>
      `;
      return;
    }

    let tbodyHtml = "";
    for (let i = 0; i < stepsCount; i++) {
      const nStep = nfaTrace[i];
      const dStep = dfaTrace[i];
      const nRaw = (nStep.raw_destinations && nStep.raw_destinations.length) ? `{${nStep.raw_destinations.join(", ")}}` : "∅";
      const nAct = (nStep.active_states && nStep.active_states.length) ? `{${nStep.active_states.join(", ")}}` : "∅";
      const dSub = (dStep.next_subset && dStep.next_subset.length) ? `{${dStep.next_subset.join(", ")}}` : "∅";

      tbodyHtml += `
        <tr class="trace-row" id="trace-row-${i + 1}">
          <td>${i + 1}</td>
          <td><strong>${nStep.symbol}</strong></td>
          <td>{${(nStep.prev_active || []).join(", ")}}</td>
          <td>${nRaw}</td>
          <td><strong>${nAct}</strong></td>
          <td>${dStep.prev_state}</td>
          <td><strong>${dStep.next_state}</strong> (${dSub})</td>
        </tr>
      `;
    }
    els.traceTbody.innerHTML = tbodyHtml;
  }

  function applySimulationStep(stepIndex) {
    if (!state.simData) return;
    const inputStr = state.simData.input_string || "";
    const totalSteps = inputStr.length;
    state.simCurrentStepIndex = stepIndex;

    if (stepIndex === 0) {
      if (els.tapePosVal) els.tapePosVal.textContent = `0 / ${totalSteps}`;
      if (els.tapeSymbolVal) els.tapeSymbolVal.textContent = totalSteps === 0 ? "ε (Empty)" : "Start (Before input)";
      updateTapeHighlight(0, totalSteps);

      const initNfa = (state.simData.nfa_result && state.simData.nfa_result.initial_active) || [];
      const initDfa = (state.simData.dfa_result && state.simData.dfa_result.initial_state) || "D0";
      const initDfaSub = (state.simData.dfa_result && state.simData.dfa_result.initial_subset) || [];

      if (els.liveNfaStates) els.liveNfaStates.textContent = initNfa.length ? `{${initNfa.join(", ")}}` : "∅";
      if (els.liveNfaCount) els.liveNfaCount.textContent = `${initNfa.length} active state(s) via ε-closure`;
      if (els.liveDfaState) els.liveDfaState.textContent = initDfa;
      if (els.liveDfaSubset) els.liveDfaSubset.textContent = `Subset: ${initDfaSub.length ? `{${initDfaSub.join(", ")}}` : "∅"}`;

      if (els.simStepExplanation) {
        els.simStepExplanation.textContent = (
          `Initial state before consuming characters. NFA starts at ε-closure({${(state.nfa && state.nfa.start_state) || "q0"}}) = ` +
          `{${initNfa.join(", ")}}. DFA starts at state ${initDfa}.`
        );
      }

      highlightGraphStates(initNfa, [initDfa]);
      highlightTraceRow(0);

      if (totalSteps === 0) {
        showFinalSimulationResult();
      }
      return;
    }

    const traceIdx = stepIndex - 1;
    const nStep = state.simData.nfa_result.trace[traceIdx];
    const dStep = state.simData.dfa_result.trace[traceIdx];

    if (els.tapePosVal) els.tapePosVal.textContent = `${stepIndex} / ${totalSteps}`;
    if (els.tapeSymbolVal) els.tapeSymbolVal.textContent = `'${nStep.symbol}'`;
    updateTapeHighlight(stepIndex, totalSteps);

    const nfaAct = nStep.active_states || [];
    const dfaState = dStep.next_state;
    const dfaSub = dStep.next_subset || [];

    if (els.liveNfaStates) els.liveNfaStates.textContent = nfaAct.length ? `{${nfaAct.join(", ")}}` : "∅";
    if (els.liveNfaCount) els.liveNfaCount.textContent = `${nfaAct.length} active state(s)`;
    if (els.liveDfaState) els.liveDfaState.textContent = dfaState;
    if (els.liveDfaSubset) els.liveDfaSubset.textContent = `Subset: ${dfaSub.length ? `{${dfaSub.join(", ")}}` : "∅"}`;

    if (els.simStepExplanation) {
      els.simStepExplanation.textContent = (
        `Step ${stepIndex}: Consumed symbol '${nStep.symbol}'. ${nStep.explanation || ""} ` +
        `${dStep.explanation || ""}`
      );
    }

    highlightGraphStates(nfaAct, [dfaState], nStep.symbol, nStep.prev_active, dStep.prev_state);
    highlightTraceRow(stepIndex);

    if (stepIndex >= totalSteps) {
      showFinalSimulationResult();
    }
  }

  function highlightTraceRow(stepNum) {
    if (!els.traceTbody) return;
    const rows = els.traceTbody.querySelectorAll(".trace-row");
    rows.forEach(r => r.classList.remove("active"));
    const activeRow = document.getElementById(`trace-row-${stepNum}`);
    if (activeRow) {
      activeRow.classList.add("active");
      activeRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function highlightGraphStates(nfaActiveStates, dfaActiveStates, symbol = null, nfaPrev = [], dfaPrev = null) {
    if (state.cyNfa) {
      state.cyNfa.nodes().removeClass("active-state");
      state.cyNfa.edges().removeClass("active-edge");
      nfaActiveStates.forEach(s => {
        const n = state.cyNfa.getElementById(s);
        if (n && n.length > 0) n.addClass("active-state");
      });

      if (symbol && nfaPrev.length > 0) {
        state.cyNfa.edges().forEach(edge => {
          const d = edge.data();
          if (nfaPrev.includes(d.source) && nfaActiveStates.includes(d.target)) {
            if (d.symbols && (d.symbols.includes(symbol) || d.symbols.includes(EPSILON))) {
              edge.addClass("active-edge");
            }
          }
        });
      }
    }

    if (state.cyDfa) {
      state.cyDfa.nodes().removeClass("active-state");
      state.cyDfa.edges().removeClass("active-edge");
      dfaActiveStates.forEach(s => {
        const n = state.cyDfa.getElementById(s);
        if (n && n.length > 0) n.addClass("active-state");
      });

      if (symbol && dfaPrev) {
        state.cyDfa.edges().forEach(edge => {
          const d = edge.data();
          if (d.source === dfaPrev && dfaActiveStates.includes(d.target)) {
            if (d.symbols && d.symbols.includes(symbol)) {
              edge.addClass("active-edge");
            }
          }
        });
      }
    }
  }

  function showFinalSimulationResult() {
    if (!state.simData || !els.simStatusBanner) return;
    const nfaAcc = state.simData.nfa_result.is_accepted;
    const dfaAcc = state.simData.dfa_result.is_accepted;

    if (els.badgeNfaResult) {
      els.badgeNfaResult.className = `result-badge ${nfaAcc ? "accept" : "reject"}`;
      els.badgeNfaResult.textContent = `NFA: ${nfaAcc ? "ACCEPT" : "REJECT"}`;
    }

    if (els.badgeDfaResult) {
      els.badgeDfaResult.className = `result-badge ${dfaAcc ? "accept" : "reject"}`;
      els.badgeDfaResult.textContent = `DFA: ${dfaAcc ? "ACCEPT" : "REJECT"}`;
    }

    if (els.simVerificationMsg) {
      els.simVerificationMsg.textContent = state.simData.verification_message;
    }

    const finalNfaStates = state.simData.nfa_result.final_states || [];
    const finalDfaState = state.simData.dfa_result.final_state;
    const finalDfaSub = state.simData.dfa_result.final_subset || [];

    let detailStr = "";
    if (nfaAcc && dfaAcc) {
      detailStr = (
        `String accepted! NFA final active states {${finalNfaStates.join(", ")}} intersect accepting states ` +
        `{${(state.nfa.accepting_states || []).join(", ")}}. DFA reached accepting state ${finalDfaState} (subset: {${finalDfaSub.join(", ")}}).`
      );
    } else if (!nfaAcc && !dfaAcc) {
      detailStr = (
        `String rejected! NFA final active states ${finalNfaStates.length ? `{${finalNfaStates.join(", ")}}` : "∅"} ` +
        `contain no accepting states. DFA reached non-accepting state ${finalDfaState} (subset: ${finalDfaSub.length ? `{${finalDfaSub.join(", ")}}` : "∅"}).`
      );
    } else {
      detailStr = "ERROR: NFA and DFA results differ. Check implementation.";
    }

    if (els.simResultDetails) {
      els.simResultDetails.textContent = detailStr;
    }
    els.simStatusBanner.classList.remove("hidden");
  }

  async function stepSimulationNext() {
    const inputStr = els.simInputString ? els.simInputString.value.trim() : "";
    if (!state.simData || state.simData.input_string !== inputStr) {
      await runSimulation(inputStr);
      applySimulationStep(0);
      return;
    }

    const totalSteps = state.simData.input_string.length;
    if (state.simCurrentStepIndex < totalSteps) {
      applySimulationStep(state.simCurrentStepIndex + 1);
    } else {
      pauseSimulation();
    }
  }

  function playSimulation() {
    const inputStr = els.simInputString ? els.simInputString.value.trim() : "";
    if (els.btnSimPlay) els.btnSimPlay.classList.add("hidden");
    if (els.btnSimPause) els.btnSimPause.classList.remove("hidden");

    if (!state.simData || state.simData.input_string !== inputStr) {
      stepSimulationNext().then(() => {
        startSimInterval();
      });
    } else {
      if (state.simCurrentStepIndex >= state.simData.input_string.length) {
        applySimulationStep(0);
      }
      startSimInterval();
    }
  }

  function startSimInterval() {
    if (state.simTimer) clearInterval(state.simTimer);
    state.simTimer = setInterval(() => {
      if (state.simData && state.simCurrentStepIndex < state.simData.input_string.length) {
        stepSimulationNext();
      } else {
        pauseSimulation();
      }
    }, state.simSpeedMs);
  }

  function pauseSimulation() {
    if (state.simTimer) {
      clearInterval(state.simTimer);
      state.simTimer = null;
    }
    if (els.btnSimPlay) els.btnSimPlay.classList.remove("hidden");
    if (els.btnSimPause) els.btnSimPause.classList.add("hidden");
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Theory Modal
    if (els.btnOpenTheory) {
      els.btnOpenTheory.addEventListener("click", () => {
        if (els.theoryModal) els.theoryModal.classList.remove("hidden");
      });
    }
    if (els.btnCloseTheory) {
      els.btnCloseTheory.addEventListener("click", () => {
        if (els.theoryModal) els.theoryModal.classList.add("hidden");
      });
    }
    if (els.btnModalCloseFooter) {
      els.btnModalCloseFooter.addEventListener("click", () => {
        if (els.theoryModal) els.theoryModal.classList.add("hidden");
      });
    }
    if (els.theoryModal) {
      els.theoryModal.addEventListener("click", (e) => {
        if (e.target === els.theoryModal) els.theoryModal.classList.add("hidden");
      });
    }

    // Mode Switching
    if (els.btnModePreset) {
      els.btnModePreset.addEventListener("click", () => {
        state.mode = "preset";
        els.btnModePreset.classList.add("active");
        if (els.btnModeManual) els.btnModeManual.classList.remove("active");
        if (els.sectionPresets) els.sectionPresets.classList.remove("hidden");
        if (els.sectionManual) els.sectionManual.classList.add("hidden");
      });
    }

    if (els.btnModeManual) {
      els.btnModeManual.addEventListener("click", () => {
        state.mode = "manual";
        els.btnModeManual.classList.add("active");
        if (els.btnModePreset) els.btnModePreset.classList.remove("active");
        if (els.sectionManual) els.sectionManual.classList.remove("hidden");
        if (els.sectionPresets) els.sectionPresets.classList.add("hidden");
        renderManualEditor();
      });
    }

    // Preset Selection
    if (els.presetSelect) {
      els.presetSelect.addEventListener("change", () => {
        loadPreset(els.presetSelect.value);
      });
    }
    if (els.btnLoadPreset) {
      els.btnLoadPreset.addEventListener("click", () => {
        if (els.presetSelect) loadPreset(els.presetSelect.value);
      });
    }

    // Natural Language Phrase Match
    if (els.btnNlMatch && els.nlPhraseInput) {
      els.btnNlMatch.addEventListener("click", async () => {
        const phrase = els.nlPhraseInput.value.trim().toLowerCase();
        if (!phrase) return;

        let matchedId = null;
        let matchMsg = "";

        if (phrase.includes("01") || phrase.includes("end")) {
          matchedId = "ENDS_WITH_01";
          matchMsg = "Matched preset: Binary strings ending with '01'.";
        } else if (phrase.includes("110") || phrase.includes("contain")) {
          matchedId = "CONTAINS_110";
          matchMsg = "Matched preset: Binary strings containing '110'.";
        } else if (phrase.includes("even") || phrase.includes("parity")) {
          matchedId = "EVEN_NUMBER_OF_0S";
          matchMsg = "Matched preset: Even number of '0's.";
        } else if (phrase.includes("epsilon") || phrase.includes("0*") || phrase.includes("1*") || phrase.includes("ε")) {
          matchedId = "EPSILON_DEMO";
          matchMsg = "Matched preset: Epsilon transitions demo (0*1*).";
        }

        try {
          const res = await fetch("/api/presets/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phrase }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.matched) {
              matchedId = data.preset_id;
              matchMsg = data.message;
            }
          }
        } catch {
          // Offline fallback
        }

        if (matchedId && els.nlMatchStatus) {
          els.nlMatchStatus.className = "status-msg success";
          els.nlMatchStatus.textContent = matchMsg;
          if (els.presetSelect) els.presetSelect.value = matchedId;
          await loadPreset(matchedId);
        } else if (els.nlMatchStatus) {
          els.nlMatchStatus.className = "status-msg warning";
          els.nlMatchStatus.textContent = `No exact match for '${phrase}'. Try keywords: 'ends with 01', 'contains 110', 'even 0s', or 'epsilon demo'.`;
        }
      });
    }

    // Quick Phrase Tags
    document.querySelectorAll(".phrase-tag").forEach(tag => {
      tag.addEventListener("click", () => {
        if (els.nlPhraseInput) {
          els.nlPhraseInput.value = tag.getAttribute("data-phrase") || "";
          if (els.btnNlMatch) els.btnNlMatch.click();
        }
      });
    });

    // Manual Editor: Alphabet Update
    if (els.btnUpdateAlphabet && els.inputAlphabet) {
      els.btnUpdateAlphabet.addEventListener("click", () => {
        const raw = els.inputAlphabet.value;
        const symbols = raw.split(",").map(s => s.trim()).filter(Boolean);
        if (symbols.includes(EPSILON)) {
          showGlobalAlert(`The symbol '${EPSILON}' is reserved for epsilon transitions and cannot be in alphabet.`, "danger");
          return;
        }
        if (symbols.some(s => s.length !== 1)) {
          showGlobalAlert("Each alphabet symbol must be a single character.", "danger");
          return;
        }
        const uniqueSymbols = Array.from(new Set(symbols)).sort();
        if (uniqueSymbols.length === 0) {
          showGlobalAlert("Alphabet cannot be empty.", "danger");
          return;
        }
        state.nfa.alphabet = uniqueSymbols;
        markDfaStale();
        renderManualEditor();
        renderViewTables();
        showGlobalAlert(`Alphabet updated to {${uniqueSymbols.join(", ")}}.`, "success");
      });
    }

    // Manual Editor: Add State
    if (els.btnAddState && els.inputNewState) {
      els.btnAddState.addEventListener("click", () => {
        const newName = els.inputNewState.value.trim();
        if (!newName) {
          showGlobalAlert("State name cannot be empty.", "danger");
          return;
        }
        if (state.nfa.states.includes(newName)) {
          showGlobalAlert(`State '${newName}' already exists.`, "danger");
          return;
        }
        state.nfa.states.push(newName);
        state.nfa.states.sort();
        els.inputNewState.value = "";
        markDfaStale();
        renderNfaGraph();
        renderManualEditor();
        renderViewTables();
      });
    }

    // Manual Editor: Delete & Rename State Delegation
    if (els.statesMetaTbody) {
      els.statesMetaTbody.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-del-state")) {
          const stateToDelete = e.target.getAttribute("data-state");
          if (state.nfa.states.length <= 1) {
            showGlobalAlert("An automaton must have at least one state.", "danger");
            return;
          }
          state.nfa.states = state.nfa.states.filter(s => s !== stateToDelete);
          state.nfa.accepting_states = (state.nfa.accepting_states || []).filter(s => s !== stateToDelete);
          if (state.nfa.start_state === stateToDelete) {
            state.nfa.start_state = state.nfa.states[0] || "";
          }
          state.nfa.transitions = (state.nfa.transitions || []).filter(t => {
            if (t.from === stateToDelete) return false;
            t.to = Array.isArray(t.to) ? t.to.filter(x => x !== stateToDelete) : (t.to === stateToDelete ? [] : [t.to]);
            return t.to.length > 0;
          });
          markDfaStale();
          renderNfaGraph();
          renderManualEditor();
          renderViewTables();
        } else if (e.target.classList.contains("btn-rename-state")) {
          const stateToRename = e.target.getAttribute("data-state");
          renameState(stateToRename);
        }
      });
    }

    // Matrix cell changes
    if (els.nfaEditorTbody) {
      els.nfaEditorTbody.addEventListener("input", () => {
        state.nfa = readManualEditorNFA();
        markDfaStale();
        renderNfaGraph();
        renderViewTables();
      });
    }

    // Validation & Conversion Buttons
    if (els.btnValidateNfa) els.btnValidateNfa.addEventListener("click", validateNfa);
    if (els.btnConvertDfa) els.btnConvertDfa.addEventListener("click", convertNfaToDfa);

    // Graph Toolbar Buttons
    if (els.btnZoomInNfa) els.btnZoomInNfa.addEventListener("click", () => state.cyNfa && state.cyNfa.zoom(state.cyNfa.zoom() * 1.25));
    if (els.btnZoomOutNfa) els.btnZoomOutNfa.addEventListener("click", () => state.cyNfa && state.cyNfa.zoom(state.cyNfa.zoom() * 0.8));
    if (els.btnFitNfa) els.btnFitNfa.addEventListener("click", () => state.cyNfa && state.cyNfa.fit(35));
    if (els.btnLayoutNfa) els.btnLayoutNfa.addEventListener("click", () => runLayout(state.cyNfa));

    if (els.btnZoomInDfa) els.btnZoomInDfa.addEventListener("click", () => state.cyDfa && state.cyDfa.zoom(state.cyDfa.zoom() * 1.25));
    if (els.btnZoomOutDfa) els.btnZoomOutDfa.addEventListener("click", () => state.cyDfa && state.cyDfa.zoom(state.cyDfa.zoom() * 0.8));
    if (els.btnFitDfa) els.btnFitDfa.addEventListener("click", () => state.cyDfa && state.cyDfa.fit(35));
    if (els.btnLayoutDfa) els.btnLayoutDfa.addEventListener("click", () => runLayout(state.cyDfa));

    // View Tabs
    if (els.tabBtnNfa && els.tabBtnDfa && els.tabContentNfa && els.tabContentDfa) {
      els.tabBtnNfa.addEventListener("click", () => {
        els.tabBtnNfa.classList.add("active");
        els.tabBtnDfa.classList.remove("active");
        els.tabContentNfa.classList.add("active");
        els.tabContentDfa.classList.remove("active");
      });
      els.tabBtnDfa.addEventListener("click", () => {
        els.tabBtnDfa.classList.add("active");
        els.tabBtnNfa.classList.remove("active");
        els.tabContentDfa.classList.add("active");
        els.tabContentNfa.classList.remove("active");
      });
    }

    // Conversion Stepper
    if (els.btnConvReset) els.btnConvReset.addEventListener("click", resetConversionStepper);
    if (els.btnConvStep) els.btnConvStep.addEventListener("click", stepConversionNext);
    if (els.btnConvPlay) els.btnConvPlay.addEventListener("click", playConversion);
    if (els.btnConvPause) els.btnConvPause.addEventListener("click", pauseConversion);
    if (els.btnConvComplete) els.btnConvComplete.addEventListener("click", completeConversion);

    // Simulation Controls
    if (els.btnSimRun) {
      els.btnSimRun.addEventListener("click", () => {
        const inputStr = els.simInputString ? els.simInputString.value.trim() : "";
        runSimulation(inputStr);
      });
    }
    if (els.btnSimReset) els.btnSimReset.addEventListener("click", resetSimulationState);
    if (els.btnSimStep) els.btnSimStep.addEventListener("click", stepSimulationNext);
    if (els.btnSimPlay) els.btnSimPlay.addEventListener("click", playSimulation);
    if (els.btnSimPause) els.btnSimPause.addEventListener("click", pauseSimulation);

    if (els.selectSimSpeed) {
      els.selectSimSpeed.addEventListener("change", (e) => {
        const ms = parseInt(e.target.value, 10);
        state.simSpeedMs = ms;
        state.convSpeedMs = ms;
        if (state.simTimer) {
          pauseSimulation();
          playSimulation();
        }
      });
    }

    if (els.simInputString) {
      els.simInputString.addEventListener("input", () => {
        if (state.simData) {
          resetSimulationState();
        }
      });
    }

    // Quick Test Chip Click Delegation
    document.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (chip) {
        const str = chip.getAttribute("data-str") || "";
        if (els.simInputString) els.simInputString.value = str;
        runSimulation(str);
      }
    });

    window.addEventListener("resize", () => {
      if (state.cyNfa) state.cyNfa.resize();
      if (state.cyDfa) state.cyDfa.resize();
    });
  }

  // Resilient Bootloader: Executes immediately if DOM is ready, or on DOMContentLoaded
  async function boot() {
    try {
      initElements();
      initCytoscape();
      setupEventListeners();
      const initialPreset = (els.presetSelect && els.presetSelect.value) ? els.presetSelect.value : "ENDS_WITH_01";
      await loadPreset(initialPreset);
      console.log("ATC Automata Lab initialized successfully.");
    } catch (err) {
      console.error("Boot error:", err);
      showGlobalAlert(`Initialization warning: ${err.message}`, "warning");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
