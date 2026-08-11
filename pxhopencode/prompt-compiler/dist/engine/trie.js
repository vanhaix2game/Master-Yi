export class TrieNode {
    children = new Map();
    output = null;
    confidence = 0;
    isEnd = false;
    hasChild(ch) {
        return this.children.has(ch);
    }
    getChild(ch) {
        return this.children.get(ch);
    }
    addChild(ch, node) {
        this.children.set(ch, node);
    }
}
export class Trie {
    root = new TrieNode();
    size = 0;
    insert(key, output, confidence = 1.0) {
        let node = this.root;
        const lower = key.toLowerCase();
        for (const ch of lower) {
            if (!node.hasChild(ch)) {
                node.addChild(ch, new TrieNode());
            }
            node = node.getChild(ch);
        }
        node.output = output;
        node.confidence = confidence;
        node.isEnd = true;
        this.size++;
    }
    search(key) {
        let node = this.root;
        const lower = key.toLowerCase();
        for (const ch of lower) {
            if (!node.hasChild(ch))
                return { found: false, output: null, confidence: 0 };
            node = node.getChild(ch);
        }
        return {
            found: node.isEnd,
            output: node.output,
            confidence: node.confidence,
        };
    }
    startsWith(prefix) {
        let node = this.root;
        const lower = prefix.toLowerCase();
        for (const ch of lower) {
            if (!node.hasChild(ch))
                return false;
            node = node.getChild(ch);
        }
        return true;
    }
    longestMatch(input, startIndex = 0) {
        let node = this.root;
        let bestLength = 0;
        let bestOutput = null;
        let bestConfidence = 0;
        const lower = input.toLowerCase();
        for (let i = startIndex; i < lower.length; i++) {
            const ch = lower[i];
            if (!node.hasChild(ch))
                break;
            node = node.getChild(ch);
            if (node.isEnd) {
                bestLength = i - startIndex + 1;
                bestOutput = node.output;
                bestConfidence = node.confidence;
            }
        }
        return { length: bestLength, output: bestOutput, confidence: bestConfidence };
    }
    findAllMatches(input) {
        const matches = [];
        const lower = input.toLowerCase();
        for (let i = 0; i < lower.length; i++) {
            const result = this.longestMatch(lower, i);
            if (result.length > 0 && result.output) {
                matches.push({
                    start: i,
                    end: i + result.length,
                    output: result.output,
                    confidence: result.confidence,
                });
            }
        }
        return matches;
    }
    getSize() {
        return this.size;
    }
    toJSON() {
        return { size: this.size };
    }
    static fromEntries(entries) {
        const trie = new Trie();
        for (const [key, output, confidence] of entries) {
            trie.insert(key, output, confidence ?? 1.0);
        }
        return trie;
    }
}
//# sourceMappingURL=trie.js.map