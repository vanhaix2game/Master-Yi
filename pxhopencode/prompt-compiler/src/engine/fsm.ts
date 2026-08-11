export type FSMState = string;
export type FSMSymbol = string;

export interface FSMTransition {
  from: FSMState;
  to: FSMState;
  symbol: FSMSymbol | FSMSymbol[];
}

export class FiniteStateMachine {
  private states: Set<FSMState> = new Set();
  private transitions: Map<string, Map<string, FSMState>> = new Map();
  private startState: FSMState | null = null;
  private acceptStates: Set<FSMState> = new Set();
  private stateMetadata: Map<FSMState, Record<string, unknown>> = new Map();

  addState(state: FSMState, isAccept: boolean = false, metadata?: Record<string, unknown>): void {
    this.states.add(state);
    if (isAccept) this.acceptStates.add(state);
    if (metadata) this.stateMetadata.set(state, metadata);
    if (!this.transitions.has(state)) {
      this.transitions.set(state, new Map());
    }
  }

  setStart(state: FSMState): void {
    if (!this.states.has(state)) this.addState(state);
    this.startState = state;
  }

  addTransition(from: FSMState, to: FSMState, symbol: FSMSymbol | FSMSymbol[]): void {
    if (!this.states.has(from)) this.addState(from);
    if (!this.states.has(to)) this.addState(to);

    const symbols = Array.isArray(symbol) ? symbol : [symbol];
    const trans = this.transitions.get(from)!;

    for (const sym of symbols) {
      trans.set(sym, to);
    }
  }

  run(input: string | string[]): { accepted: boolean; finalState: FSMState | null; path: FSMState[] } {
    if (!this.startState) throw new Error('FSM: no start state defined');

    const symbols = Array.isArray(input) ? input : [...input];
    let currentState = this.startState;
    const path: FSMState[] = [currentState];

    for (const sym of symbols) {
      const trans = this.transitions.get(currentState);
      if (!trans || !trans.has(sym)) {
        return { accepted: false, finalState: currentState, path };
      }
      currentState = trans.get(sym)!;
      path.push(currentState);
    }

    return {
      accepted: this.acceptStates.has(currentState),
      finalState: currentState,
      path,
    };
  }

  getMetadata(state: FSMState): Record<string, unknown> | undefined {
    return this.stateMetadata.get(state);
  }

  accepts(input: string | string[]): boolean {
    return this.run(input).accepted;
  }

  visualize(): string {
    let out = 'digraph FSM {\n  rankdir=LR;\n';
    for (const s of this.states) {
      const shape = this.acceptStates.has(s) ? 'doublecircle' : 'circle';
      out += `  "${s}" [shape=${shape}];\n`;
    }
    if (this.startState) {
      out += `  "" [shape=none];\n  "" -> "${this.startState}";\n`;
    }
    for (const [from, trans] of this.transitions) {
      for (const [sym, to] of trans) {
        out += `  "${from}" -> "${to}" [label="${sym}"];\n`;
      }
    }
    out += '}\n';
    return out;
  }
}

export class IntentFSM extends FiniteStateMachine {
  constructor() {
    super();
    this.setupIntentStates();
  }

  private setupIntentStates(): void {
    this.addState('start', false);
    this.addState('action', false);
    this.addState('target', false);
    this.addState('qualifier', false);
    this.addState('complete', true);

    this.setStart('start');

    this.addTransition('start', 'action', ['fix', 'debug', 'create', 'generate', 'add',
      'implement', 'build', 'write', 'refactor', 'review', 'audit', 'optimize',
      'design', 'document', 'test', 'analyze', 'read', 'search', 'find',
      'migrate', 'deploy', 'release', 'update', 'remove', 'delete', 'change']);
    this.addTransition('start', 'target', ['what', 'how', 'why', 'explain', 'describe']);

    this.addTransition('action', 'target', ['bug', 'feature', 'game', 'api', 'ui', 'code',
      'test', 'doc', 'performance', 'security', 'architecture', 'dependency',
      'project', 'file', 'component', 'module', 'function', 'class']);
    this.addTransition('action', 'qualifier', ['quickly', 'carefully', 'minimally',
      'thoroughly', 'safely']);

    this.addTransition('target', 'qualifier', ['without', 'while', 'with', 'using', 'for']);
    this.addTransition('target', 'complete', ['.', '!', '']);

    this.addTransition('qualifier', 'target', ['breaking', 'changing', 'touching', 'adding']);
    this.addTransition('qualifier', 'complete', ['.', '!', '']);
  }
}

export const intentLexicon: Record<string, string> = {
  fix: 'repair',
  debug: 'diagnose',
  create: 'generate',
  generate: 'generate',
  implement: 'generate',
  build: 'generate',
  write: 'generate',
  refactor: 'restructure',
  review: 'inspect',
  audit: 'inspect',
  optimize: 'improve',
  design: 'plan',
  document: 'annotate',
  test: 'verify',
  analyze: 'examine',
  read: 'retrieve',
  search: 'locate',
  find: 'locate',
  migrate: 'transfer',
  deploy: 'ship',
  release: 'publish',
};
