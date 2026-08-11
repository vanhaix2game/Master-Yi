---
name: game-design
description: Game design principles — core loop, GDD, player psychology, difficulty balancing, progression
---

# Game Design Principles

> Tham khảo từ [agent-skills-hub/game-development/game-design](https://github.com/agent-skills-hub/agent-skills-hub/tree/main/skills/game-development/game-design).

## 1. Core Loop — The 30-Second Test

```
ACTION → FEEDBACK → REWARD → REPEAT
```

| Genre | Core Loop |
|-------|-----------|
| Platformer | Run → Jump → Land → Collect |
| Shooter | Aim → Shoot → Kill → Loot |
| Puzzle | Observe → Think → Solve → Advance |
| RPG | Explore → Fight → Level → Gear |
| Racing | Drive → Drift → Boost → Win |

## 2. Game Design Document (GDD)

| Section | Content |
|---------|---------|
| **Pitch** | One-sentence description |
| **Core Loop** | 30-second gameplay |
| **Mechanics** | How systems work |
| **Progression** | How player advances |
| **Art Style** | Visual direction |
| **Audio** | Sound direction |

## 3. Player Psychology

| Type | Driven By |
|------|-----------|
| **Achiever** | Goals, completion |
| **Explorer** | Discovery, secrets |
| **Socializer** | Interaction, community |
| **Killer** | Competition, dominance |

### Reward Schedules
| Schedule | Effect | Use |
|----------|--------|-----|
| **Fixed** | Predictable | Milestone rewards |
| **Variable** | Addictive | Loot drops |
| **Ratio** | Effort-based | Grind games |

## 4. Difficulty Balancing — Flow State

```
Too Hard → Frustration → Quit
Too Easy → Boredom → Quit
Just Right → Flow → Engagement
```

| Strategy | How |
|----------|-----|
| **Dynamic** | Adjust to player skill |
| **Selection** | Let player choose |
| **Accessibility** | Options for all |

## 5. Progression Design

| Type | Example |
|------|---------|
| **Skill** | Player gets better |
| **Power** | Character gets stronger |
| **Content** | New areas unlock |
| **Story** | Narrative advances |

## Anti-Rationalization

| Excuse | Reality |
|--------|---------|
| "Core loop tự nhiên fun, không cần design" | Game không fun = không ai chơi |
| "GDD viết xong là xong" | GDD cần update liên tục |
| "Balancing sau, code trước" | Sai balance từ đầu → rewrite cả hệ thống |

## Red Flags
- Core loop không fun trong 30s đầu
- Difficulty không có curve
- Progression không reward

## Verification
- [ ] Core loop defined + test fun
- [ ] Difficulty curve (easy → hard)
- [ ] Reward schedule (ít nhất fixed + variable)
