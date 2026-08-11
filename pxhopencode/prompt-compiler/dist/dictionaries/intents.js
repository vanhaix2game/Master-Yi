const patterns = [
    {
        intent: 'fix_bug',
        patterns: [
            /(fix|sửa|chữa|repair)\s+(the\s+|a\s+)?(bug|lỗi|issue|error|problem)/i,
            /(bug|lỗi)\s+(fix|sửa|chữa)/i,
        ],
        priority: 10,
    },
    {
        intent: 'debug',
        patterns: [
            /(debug|gỡ lỗi)\b/i,
            /tìm\s+(nguyên nhân|root\s*cause)/i,
            /(crash|lỗi|error|exception)\s+(khi|when|occur)/i,
        ],
        priority: 9,
    },
    {
        intent: 'explain',
        patterns: [
            /(explain|giải thích|tại sao|làm thế nào|how\s+(does|to|is|are|can))/i,
            /(what\s+is|what\s+are|why\s+(does|is|are|did))/i,
        ],
        priority: 6,
    },
    {
        intent: 'generate_feature',
        patterns: [
            /(thêm|add|implement|tạo|create|generate)\s+(feature|tính năng|chức năng)/i,
            /(feature|tính năng)\s+mới/i,
        ],
        priority: 8,
    },
    {
        intent: 'generate_game',
        patterns: [
            /(làm|tạo|viết|generate|build)\s+(game|trò chơi)/i,
            /(phát triển|develop)\s+game/i,
            /game\s+(platformer|shooter|rpg|racing|puzzle|2d|3d)/i,
            /(phaser|three\.js|unity|godot)\s+(game|project)/i,
        ],
        priority: 8,
    },
    {
        intent: 'generate_api',
        patterns: [
            /(tạo|create|generate|build|xây)\s+(api|endpoint|route|rest)/i,
            /(api|backend)\s+(cho|for|endpoint)/i,
        ],
        priority: 8,
    },
    {
        intent: 'generate_ui',
        patterns: [
            /(tạo|create|generate|build|làm)\s+(ui|giao diện|interface|component)/i,
            /(ui|giao diện)\s+(cho|for|component)/i,
            /(trang|page|screen|view|layout)/i,
        ],
        priority: 8,
    },
    {
        intent: 'refactor',
        patterns: [
            /(refactor|tái cấu trúc|clean\s+code)/i,
            /cải\s+(thiện|tiến)\s+(code|mã)/i,
        ],
        priority: 9,
    },
    {
        intent: 'review_code',
        patterns: [
            /(review|rà soát|kiểm tra)\s+(code|mã)/i,
            /code\s+review/i,
        ],
        priority: 9,
    },
    {
        intent: 'security_audit',
        patterns: [
            /(security|bảo mật|audit)\s+(audit|check|review|kiểm tra)/i,
            /(security|bảo mật)\s+(vulnerability|lỗ hổng)/i,
            /(kiểm tra|check)\s+bảo mật/i,
            /(lỗ hổng|vulnerability)/i,
        ],
        priority: 9,
    },
    {
        intent: 'performance_optimization',
        patterns: [
            /(performance|hiệu năng|hiệu suất)\s+(optimize|tối ưu|improve|cải thiện)/i,
            /(tối ưu|optimize)\s+(performance|hiệu năng|hiệu suất|tốc độ|speed)/i,
            /(FPS|chậm|slow|lag)\s+(fix|improve|optimize|bị)/i,
            /(hiệu năng|hiệu suất|tốc độ)\s+(bị|thấp|chậm)/i,
        ],
        priority: 9,
    },
    {
        intent: 'architecture_design',
        patterns: [
            /(architecture|kiến trúc)\s+(design|thiết kế)/i,
            /thiết kế\s+(architecture|kiến trúc)/i,
            /(schema|database)\s+(design|thiết kế)/i,
            /design\s+(system|architecture|pattern)/i,
            /(system design|architecture design)/i,
        ],
        priority: 7,
    },
    {
        intent: 'create_documentation',
        patterns: [
            /(viết|write|create|generate)\s+(doc|documentation|tài liệu)/i,
            /(doc|documentation|tài liệu)\s+(cho|for)/i,
            /(readme|README|API doc|wiki)/i,
        ],
        priority: 6,
    },
    {
        intent: 'write_tests',
        patterns: [
            /(viết|write|thêm|add)\s+(test|unit test|integration test|e2e)/i,
            /(test coverage|coverage|testing)/i,
        ],
        priority: 9,
    },
    {
        intent: 'optimize_prompt',
        patterns: [
            /(optimize|tối ưu)\s+(prompt|instruction)/i,
            /prompt\s+(engineering|optimization|compression)/i,
        ],
        priority: 7,
    },
    {
        intent: 'optimize_token',
        patterns: [
            /(tiết kiệm|save|reduce|optimize)\s+(token|quota|cost)/i,
            /token\s+(efficient|optimization|budget)/i,
        ],
        priority: 7,
    },
    {
        intent: 'analyze_project',
        patterns: [
            /(phân tích|analyze)\s+(project|source|codebase|mã nguồn)/i,
            /(audit|assessment)\s+(project|codebase)/i,
        ],
        priority: 7,
    },
    {
        intent: 'read_codebase',
        patterns: [
            /(đọc|read|xem)\s+(project|source|codebase|code|mã nguồn)/i,
            /hiểu\s+(project|code)/i,
        ],
        priority: 6,
    },
    {
        intent: 'search',
        patterns: [
            /(search|tìm|find|locate)\s+(file|code|function|class|variable)/i,
            /tìm\s+(file|hàm|function|class|biến)/i,
        ],
        priority: 6,
    },
    {
        intent: 'find_root_cause',
        patterns: [
            /(root cause|nguyên nhân gốc|tận gốc)/i,
            /tại\s+sao\s+(lỗi|bug|crash)/i,
            /(investigate|điều tra)\s+(cause|nguyên nhân)/i,
        ],
        priority: 9,
    },
    {
        intent: 'dependency_analysis',
        patterns: [
            /(dependency|phụ thuộc)\s+(analysis|graph|tree|check|audit)/i,
            /(npm|pip|cargo|nuget)\s+(audit|outdated|check)/i,
        ],
        priority: 6,
    },
    {
        intent: 'migration',
        patterns: [
            /(migrate|migration|nâng cấp|chuyển đổi)\s+(from|to|từ|sang|version)/i,
            /(upgrade|downgrade)\s+(version|package|library)/i,
        ],
        priority: 8,
    },
    {
        intent: 'deployment',
        patterns: [
            /(deploy|triển khai)\s+(to|lên|production|server|hosting)/i,
            /(deploy|release)\s+pipeline/i,
            /(CI|CD|CI\/CD)\s+(pipeline|setup)/i,
        ],
        priority: 7,
    },
    {
        intent: 'packaging',
        patterns: [
            /(package|đóng gói)\s+(build|release|distribute)/i,
            /(npm|cargo|pip|docker)\s+(publish|pack|build)/i,
        ],
        priority: 6,
    },
    {
        intent: 'release',
        patterns: [
            /(release|phát hành)\s+(version|phiên bản)/i,
            /(tag|changelog|version)\s+(bump|release)/i,
        ],
        priority: 7,
    },
    {
        intent: 'git_operations',
        patterns: [
            /\b(git|branch|commit|push|pull|merge|rebase)\b/i,
            /(git|branch|commit|push|pull|merge|rebase)\s+(operation|thao tác)/i,
            /\b(PR|pull request|merge request)\b/i,
        ],
        priority: 6,
    },
    {
        intent: 'mcp_operations',
        patterns: [
            /(MCP|mcp)\s+(server|tool|resource|operation)/i,
            /(Model Context Protocol)\b/i,
        ],
        priority: 5,
    },
    {
        intent: 'workspace_management',
        patterns: [
            /(workspace|project)\s+(management|quản lý|setup|init)/i,
            /(tạo|create)\s+(project|workspace)\s+mới/i,
        ],
        priority: 5,
    },
    {
        intent: 'multi_agent_coordination',
        patterns: [
            /(multi-agent|multi agent|nhiều agent|parallel)\s+(coordination|phối hợp|run|chạy)/i,
            /(subagent|delegate|dispatch|orchestrate)/i,
        ],
        priority: 5,
    },
    {
        intent: 'enhance_ui',
        patterns: [
            /(make it pop|give it some sauce|make it look cool|make it pretty|it's giving)/i,
            /(làm cho đẹp|làm cho nó pro|làm cho nó xịn|thiết kế lại giao diện)/i,
            /(enhance.*(ui|visual|aesthetic)|improve.*(ui|look|appearance))/i,
        ],
        priority: 7,
    },
    {
        intent: 'rapid_prototype',
        patterns: [
            /(throw together|cobble together|slap on|slap together)/i,
            /(làm nhanh|làm tạm|chạy tạm|dựng nhanh|demo nhanh)/i,
            /(rapid prototype|prototype nhanh|mvp|proof of concept|poc)/i,
            /(just.*get.*done|quick.*dirty|make.*quick)/i,
        ],
        priority: 8,
    },
    {
        intent: 'integrate_systems',
        patterns: [
            /(glue.*(together|code)|wire.*up|hook.*up|stitch.*together)/i,
            /(nối dây|đấu nối|chắp vá|kết nối.*(hệ thống|module|các))|tích hợp/i,
            /(integrate.*(system|service|api|component))/i,
        ],
        priority: 8,
    },
    {
        intent: 'refactor_vibe',
        patterns: [
            /(clean it up|clean up|tidy up|pave the cow path)/i,
            /(refactor.*(vibe|clean|aesthetic|đẹp))/i,
            /(làm cho.*sạch|dọn.*code|clean.*code.*đẹp)/i,
        ],
        priority: 7,
    },
];
export function getIntentPatterns() {
    return patterns;
}
//# sourceMappingURL=intents.js.map