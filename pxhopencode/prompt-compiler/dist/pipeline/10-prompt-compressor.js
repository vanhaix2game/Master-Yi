export function compressPrompt(ir) {
    const t0 = performance.now();
    const parts = [];
    const intentStr = ir.intents.map(i => i.replace(/_/g, ' ')).join(', ');
    if (intentStr && intentStr !== 'unknown')
        parts.push(`Intent: ${intentStr}`);
    if (ir.constraints.length > 0) {
        parts.push(`Constraints: ${ir.constraints.map(c => c.replace(/_/g, ' ')).join(', ')}`);
    }
    if (ir.target.frameworks.length > 0)
        parts.push(`Frameworks: ${ir.target.frameworks.join(', ')}`);
    if (ir.target.languages.length > 0)
        parts.push(`Languages: ${ir.target.languages.join(', ')}`);
    if (ir.target.libraries.length > 0)
        parts.push(`Libraries: ${ir.target.libraries.join(', ')}`);
    if (ir.files.length > 0) {
        const fileList = ir.files.map(f => `${f.path} (${f.action})`).join(', ');
        parts.push(`Files: ${fileList}`);
    }
    if (ir.actions.length > 0)
        parts.push(`Actions: ${ir.actions.join(', ')}`);
    if (ir.priority !== 'medium')
        parts.push(`Priority: ${ir.priority}`);
    if (ir.safety.preserveBehavior)
        parts.push('Safety: preserve behavior');
    if (ir.safety.noBreakingChanges)
        parts.push('Safety: no breaking changes');
    if (ir.safety.backwardCompatible)
        parts.push('Safety: backward compatible');
    let compressed = parts.join(' | ');
    const maxLength = 2000;
    if (compressed.length > maxLength) {
        compressed = compressed.slice(0, maxLength) + '...';
    }
    const ms = performance.now() - t0;
    return {
        compressed,
        metric: { name: 'PromptCompressor', ms, inputLength: JSON.stringify(ir).length, outputLength: compressed.length },
    };
}
//# sourceMappingURL=10-prompt-compressor.js.map