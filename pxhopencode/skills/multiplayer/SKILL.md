---
name: multiplayer
description: Multiplayer game principles — networking architecture, synchronization, security, matchmaking
---

# Multiplayer Game Principles

> Tham khảo từ [agent-skills-hub/game-development/multiplayer](https://github.com/agent-skills-hub/agent-skills-hub/tree/main/skills/game-development/multiplayer).

## 1. Architecture Selection

```
Real-time competitive → Dedicated Server (authoritative)
Cooperative / Casual → Host-based (one player is server)
Turn-based → Client-server (simple)
Massive (MMO) → Distributed servers
```

| Architecture | Latency | Cost | Security |
|--------------|---------|------|----------|
| **Dedicated** | Low | High | Strong |
| **P2P** | Variable | Low | Weak |
| **Host-based** | Medium | Low | Medium |

## 2. Synchronization

| Approach | Sync What | Best For |
|----------|-----------|----------|
| **State Sync** | Game state | Simple, few objects |
| **Input Sync** | Player inputs | Action games |
| **Hybrid** | Both | Most games |

### Lag Compensation
- **Prediction** — Client predicts server
- **Interpolation** — Smooth remote players
- **Reconciliation** — Fix mispredictions

## 3. Network Optimization

| Technique | Savings |
|-----------|---------|
| **Delta compression** | Send only changes |
| **Quantization** | Reduce precision |
| **Area of interest** | Only nearby entities |

| Data | Rate |
|------|------|
| Position | 20-60 Hz |
| Health | On change |
| Inventory | On change |

## 4. Security — Server Authority

```
Client: "I hit the enemy"
Server: Validate:
  → did projectile actually hit?
  → was player in valid state?
  → was timing possible?
```

| Cheat | Prevention |
|-------|------------|
| Speed hack | Server validates movement |
| Aimbot | Server validates sight line |
| Item dupe | Server owns inventory |
| Wall hack | Don't send hidden data |

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Trust client cho đơn giản" | Hack dễ dàng → game chết |
| "Gửi tất cả dữ liệu mỗi frame" | Bandwidth bùng nổ, lag |
| "P2P rẻ hơn, dùng P2P" | No authority = cheating everywhere |

## Red Flags
- Client-side authority
- Sync exact positions (không interpolation)
- Gửi full state mỗi frame

## Verification
- [ ] Server is authority
- [ ] Lag compensation (prediction + interpolation)
- [ ] Delta compression + area of interest
