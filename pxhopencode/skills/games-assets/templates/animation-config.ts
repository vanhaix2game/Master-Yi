export type EasingFn = 'linear' | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad' | 'easeOutBack' | 'easeOutElastic';

export interface AnimFrame { start: number; end: number }
export interface AnimationConfig {
  frames: AnimFrame;
  speed: number;
  repeat: number;
  ease: EasingFn;
  blendDuration: number;
}

export const ANIM_CONFIG: Record<string, AnimationConfig> = {
  player_idle:   { frames: { start: 0, end: 3  }, speed: 6,  repeat: -1, ease: 'easeInOutQuad', blendDuration: 120 },
  player_run:    { frames: { start: 4, end: 9  }, speed: 10, repeat: -1, ease: 'linear',         blendDuration: 80  },
  player_jump:   { frames: { start: 10,end: 12 }, speed: 8,  repeat: 0,  ease: 'easeOutQuad',    blendDuration: 100 },
  player_attack: { frames: { start: 13,end: 17 }, speed: 12, repeat: 0,  ease: 'easeOutBack',    blendDuration: 60  },
  player_hurt:   { frames: { start: 18,end: 19 }, speed: 4,  repeat: 0,  ease: 'easeOutElastic', blendDuration: 150 },
  player_die:    { frames: { start: 20,end: 23 }, speed: 6,  repeat: 0,  ease: 'easeInOutQuad',  blendDuration: 200 },
};
