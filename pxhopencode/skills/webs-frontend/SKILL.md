---
name: webs-frontend
description: Frontend React production — component patterns, custom hooks, data fetching, bundle optimization. Core Web Vitals, 90+ Lighthouse.
---

# webs-frontend — Frontend

## Core Principle

**Components > 200 lines are a smell. Custom hooks without tests will break in production.**

## Luật sắt

```
KHÔNG BAO GIỜ fetch data trực tiếp trong component — use hook hoặc query client
Mọi component route phải lazy-load
```

## Mẫu Component
Polymorphic Box + Compound Tabs pattern.
→ `templates/component-patterns.tsx`

## Custom Hooks (production)
- `useAsync` — abort controller, chống memory leak.
- `useDebounce` — 300ms default delay.
- `useLocalStorage` — JSON parse/stringify, try/catch an toàn.
→ `templates/custom-hooks.ts`

## Truy vấn dữ liệu (TanStack Query)
> Cấu hình queryClient: staleTime 5m, gcTime 30m, retry 2. Dùng `keepPreviousData` cho pagination, `invalidateQueries` sau mutation.
→ `templates/data-fetching.ts`

## Tối ưu Bundle
`React.lazy()` cho route và heavy library. Import tree-shaking friendly (`date-fns`). Tailwind purge mặc định.
→ `templates/bundle-optimization.ts`

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "React.lazy() sau" | Bundle lớn = LCP chậm, Core Web Vitals fail |
| "Custom hook không cần test" | Hook lỗi = crash toàn component |
| "data-fetching pattern giống nhau" | Mỗi page khác cache strategy → sai dữ liệu |

## Red Flags
- Component > 200 dòng
- useEffect thiếu deps
- fetch trong component, không qua hook

## Verification
- [ ] Lazy loading cho route + heavy lib
- [ ] Custom hook có unit test
- [ ] TanStack Query config: staleTime, gcTime, retry
