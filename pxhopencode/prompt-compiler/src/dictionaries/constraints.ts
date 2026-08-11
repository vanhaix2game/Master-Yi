import type { ConstraintPattern } from '../types.js';

const patterns: ConstraintPattern[] = [
  {
    constraint: 'minimal_changes',
    patterns: [
      /(thay đổi tối thiểu|minimal changes|ít thay đổi nhất|change as little as possible)/i,
      /(chỉ sửa|only change|only modify|chỉ thay đổi)\s+(what|những gì|đúng)/i,
    ],
    priority: 10,
  },
  {
    constraint: 'preserve_behavior',
    patterns: [
      /(đừng phá|không phá|không làm hỏng|giữ nguyên|preserve|keep.*behavior)/i,
      /(không thay đổi|don't change|do not change)\s+(behavior|hành vi|logic)/i,
      /giữ\s+nguyên\s+(hành vi|chức năng|behavior)/i,
    ],
    priority: 10,
  },
  {
    constraint: 'backward_compatible',
    patterns: [
      /(backward compatible|tương thích ngược|compatibility|backwards)/i,
      /không\s+(phá|vỡ|break)\s+(existing|có sẵn)/i,
    ],
    priority: 9,
  },
  {
    constraint: 'no_breaking_changes',
    patterns: [
      /(no breaking|không breaking|không vỡ|không phá vỡ)/i,
      /(non-breaking|non breaking)/i,
    ],
    priority: 9,
  },
  {
    constraint: 'keep_coding_style',
    patterns: [
      /(giữ style|keep style|giữ nguyên style|theo style|consistent.*style)/i,
      /(coding style|code style|style guide)/i,
    ],
    priority: 8,
  },
  {
    constraint: 'follow_architecture',
    patterns: [
      /(theo architecture|follow architecture|theo kiến trúc|theo pattern)/i,
      /(respect.*architecture|architecture.*pattern|module.*structure)/i,
    ],
    priority: 8,
  },
  {
    constraint: 'use_existing_utilities',
    patterns: [
      /(dùng thư viện có sẵn|use existing|tận dụng|reuse)/i,
      /(không thêm|don't add|no new)\s+(dependency|thư viện|library)/i,
    ],
    priority: 8,
  },
  {
    constraint: 'avoid_new_dependencies',
    patterns: [
      /(không thêm dependency|no new dependency|avoid new dep|zero new dep)/i,
      /(không cài|don't install|no install)\s+(package|module|plugin)/i,
    ],
    priority: 8,
  },
  {
    constraint: 'no_refactoring',
    patterns: [
      /(no refactor|không refactor|đừng refactor|chỉ sửa|only fix)/i,
      /(không tái cấu trúc|không clean)/i,
    ],
    priority: 7,
  },
  {
    constraint: 'only_requested_files',
    patterns: [
      /(chỉ.*file yêu cầu|only.*requested|chỉ.*trong|only.*in)/i,
      /(không sửa file khác|don't touch other|only.*specified)/i,
    ],
    priority: 8,
  },
  {
    constraint: 'do_not_touch_tests',
    patterns: [
      /(không đụng test|don't touch test|không sửa test|keep tests)/i,
      /(test.*không đổi|test.*untouched|leave.*test)/i,
    ],
    priority: 8,
  },
  {
    constraint: 'offline_only',
    patterns: [
      /(offline|local only|chạy offline|không cần mạng|no internet)/i,
      /(local execution|local dev|no cloud|không dùng cloud)/i,
    ],
    priority: 9,
  },
  {
    constraint: 'token_efficient',
    patterns: [
      /(tiết kiệm token|token efficient|ít token|save token|reduce token)/i,
      /(token.*budget|context.*limit|giới hạn token)/i,
    ],
    priority: 7,
  },
  {
    constraint: 'maintain_performance',
    patterns: [
      /(giữ performance|maintain performance|không làm chậm|don't slow)/i,
      /(performance.*keep|FPS.*giữ|hiệu năng.*không đổi)/i,
    ],
    priority: 7,
  },
  {
    constraint: 'maintain_readability',
    patterns: [
      /(readable|dễ đọc|clean code|maintain.*readability)/i,
      /(code.*clear|mã.*rõ ràng|understandable)/i,
    ],
    priority: 5,
  },
  {
    constraint: 'security_first',
    patterns: [
      /(security.*first|bảo mật.*đầu|secure.*code|no vulnerability)/i,
      /(input.*sanitize|validate.*input|escape.*output)/i,
    ],
    priority: 9,
  },
  {
    constraint: 'cross_platform',
    patterns: [
      /(cross.?platform|đa nền tảng|multi.?platform)/i,
      /(windows.*mac.*linux|chạy.*mọi.*nơi)/i,
    ],
    priority: 6,
  },
  {
    constraint: 'mobile_first',
    patterns: [
      /(mobile.?first|mobile.*trước|responsive.*mobile)/i,
      /(mobile.*design|adaptive.*mobile)/i,
    ],
    priority: 6,
  },
  {
    constraint: 'accessibility_required',
    patterns: [
      /(accessibility|a11y|accessible|WCAG)/i,
      /(screen reader|keyboard nav|aria|contrast)/i,
    ],
    priority: 8,
  },
  {
    constraint: 'no_hallucination',
    patterns: [
      /(no hallucination|không hallucinate|đừng bịa|không thêm|don't invent)/i,
      /(chỉ dùng|only use|dựa trên|based on|from.*codebase)/i,
    ],
    priority: 10,
  },
];

export function getConstraintPatterns(): ConstraintPattern[] {
  return patterns;
}
