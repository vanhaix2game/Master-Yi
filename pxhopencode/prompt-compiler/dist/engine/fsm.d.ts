export type FSMState = string;
export type FSMSymbol = string;
export interface FSMTransition {
    from: FSMState;
    to: FSMState;
    symbol: FSMSymbol | FSMSymbol[];
}
export declare class FiniteStateMachine {
    private states;
    private transitions;
    private startState;
    private acceptStates;
    private stateMetadata;
    addState(state: FSMState, isAccept?: boolean, metadata?: Record<string, unknown>): void;
    setStart(state: FSMState): void;
    addTransition(from: FSMState, to: FSMState, symbol: FSMSymbol | FSMSymbol[]): void;
    run(input: string | string[]): {
        accepted: boolean;
        finalState: FSMState | null;
        path: FSMState[];
    };
    getMetadata(state: FSMState): Record<string, unknown> | undefined;
    accepts(input: string | string[]): boolean;
    visualize(): string;
}
export declare class IntentFSM extends FiniteStateMachine {
    constructor();
    private setupIntentStates;
}
export declare const intentLexicon: Record<string, string>;
//# sourceMappingURL=fsm.d.ts.map