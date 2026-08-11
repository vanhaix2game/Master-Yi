---
name: process-verification
description: Dùng trước khi claim work hoàn tất, fix xong, hoặc test pass — chạy verification command, đọc output, KHÔNG claim nếu chưa verify
---

# Verification Before Completion

## Core Principle

**Evidence before claims. Always.**

## Luật sắt

```
KHÔNG completion claim NẾU KHÔNG có fresh verification evidence
```

Chưa chạy verification command trong message này? Không được claim nó pass.

## Gate Function

Trước mỗi claim về status:

1. **XÁC ĐỊNH**: Command nào chứng minh claim này?
2. **CHẠY**: Execute FULL command (fresh, complete)
3. **ĐỌC**: Full output, check exit code, đếm failures
4. **XÁC NHẬN**: Output có khớp claim không?
   - Không → báo actual status kèm evidence
   - Có → claim kèm evidence
5. **CHỈ SAU ĐÓ**: Mới claim

## Common Failures

| Claim | Cần | Không đủ |
|-------|-----|----------|
| Tests pass | Output: 0 failures | "Should pass" |
| Linter clean | Output: 0 errors | Partial check |
| Build succeeds | exit 0 | Linter passing |
| Bug fixed | Test original symptom passes | Code changed |
| Agent completed | VCS diff + changes | Agent báo "success" |

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Tôi nhớ là test pass mà" | "Nhớ" = 0 evidence |
| "Chạy partial command cũng đủ" | Partial check bỏ sót failure |
| "Code nhìn ổn, không cần verify" | Nhìn ổn != chạy ổn |
| "Hôm qua chạy pass rồi" | Hôm qua không chứng minh gì cho hôm nay |

## Red Flags

- "Tôi đã chạy test rồi" nhưng không show output
- "Trông ổn rồi" thay vì chạy command verify
- Skip verification vì "đơn giản mà"

## Verification

- [ ] Command xác định đúng claim cần chứng minh
- [ ] Command chạy FULL (không partial)
- [ ] Output đọc và exit code checked
- [ ] Output khớp với claim (hoặc báo actual status)
- [ ] Claim kèm evidence output
