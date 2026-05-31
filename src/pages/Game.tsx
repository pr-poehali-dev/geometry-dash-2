import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

// GD оригинальная физика: 60 ups, скорость ~8.4 блоков/с на нормальной скорости
// Блок = 40px. Прыжок = 11.18 блоков высота, период = 26 фреймов
// gravity = 0.9 блоков/фрейм², jump = -9 блоков/фрейм (в единицах блоков)

const BLOCK = 40;           // 1 блок = 40px
const CANVAS_W = 800;
const CANVAS_H = 450;
const GROUND_Y = CANVAS_H - 80; // пол
const PLAYER_X = 150;        // позиция игрока по X (фиксирована)

// Физика максимально близкая к GD (60 fps)
const GRAVITY = 0.9;         // блоков/фрейм² → px/фрейм² = 0.9*BLOCK/60²... нет, просто в px
const JUMP_VY = -12.5;       // px/фрейм — в оригинале ~11.5 блоков/с на 60fps
const SPEED_NORMAL = 5.77;   // px/фрейм (скорость 1x GD = ~346 px/s при 60fps)

const LEVELS: Record<string, {
  name: string;
  color: string;
  bgColor: string;
  speed: number;
  tiles: Array<{ x: number; y: number; type: 'spike' | 'block' | 'spike2' | 'spike3' }>;
}> = {
  '1': {
    name: 'Stereo Madness', color: '#7c3aed', bgColor: '#0d0020',
    speed: SPEED_NORMAL,
    tiles: [
      // x,y в блоках от начала уровня. y=0 — уровень пола
      { x: 8, y: 0, type: 'spike' },
      { x: 13, y: 0, type: 'spike' },
      { x: 14, y: 0, type: 'spike' },
      { x: 20, y: 0, type: 'spike' },
      { x: 25, y: 0, type: 'spike' },
      { x: 26, y: 0, type: 'spike' },
      { x: 30, y: 0, type: 'spike' },
      { x: 35, y: 0, type: 'spike' },
      { x: 36, y: 0, type: 'spike' },
      { x: 37, y: 0, type: 'spike' },
      { x: 42, y: 0, type: 'spike' },
      { x: 47, y: 0, type: 'spike' },
      { x: 53, y: 0, type: 'spike' },
      { x: 54, y: 0, type: 'spike' },
      { x: 60, y: 0, type: 'spike' },
      { x: 65, y: 0, type: 'spike' },
      { x: 66, y: 0, type: 'spike' },
    ],
  },
  '2': {
    name: 'Back on Track', color: '#2563eb', bgColor: '#000d20',
    speed: SPEED_NORMAL,
    tiles: [
      { x: 7, y: 0, type: 'spike' },
      { x: 12, y: 0, type: 'spike' },
      { x: 13, y: 0, type: 'spike' },
      { x: 18, y: 0, type: 'spike' },
      { x: 23, y: 0, type: 'spike' },
      { x: 24, y: 0, type: 'spike' },
      { x: 28, y: 0, type: 'spike' },
      { x: 29, y: 0, type: 'spike' },
      { x: 34, y: 0, type: 'spike' },
      { x: 39, y: 0, type: 'spike' },
      { x: 40, y: 0, type: 'spike' },
      { x: 41, y: 0, type: 'spike' },
      { x: 46, y: 0, type: 'spike' },
      { x: 51, y: 0, type: 'spike' },
      { x: 56, y: 0, type: 'spike' },
      { x: 57, y: 0, type: 'spike' },
      { x: 62, y: 0, type: 'spike' },
      { x: 67, y: 0, type: 'spike' },
      { x: 68, y: 0, type: 'spike' },
    ],
  },
  '3': {
    name: 'Polargeist', color: '#059669', bgColor: '#001510',
    speed: SPEED_NORMAL * 1.1,
    tiles: [
      { x: 6, y: 0, type: 'spike' },
      { x: 7, y: 0, type: 'spike' },
      { x: 11, y: 0, type: 'spike' },
      { x: 15, y: 0, type: 'spike' },
      { x: 16, y: 0, type: 'spike' },
      { x: 20, y: 0, type: 'spike' },
      { x: 21, y: 0, type: 'spike' },
      { x: 25, y: 0, type: 'spike' },
      { x: 29, y: 0, type: 'spike' },
      { x: 30, y: 0, type: 'spike' },
      { x: 31, y: 0, type: 'spike' },
      { x: 35, y: 0, type: 'spike' },
      { x: 39, y: 0, type: 'spike' },
      { x: 40, y: 0, type: 'spike' },
      { x: 44, y: 0, type: 'spike' },
      { x: 48, y: 0, type: 'spike' },
      { x: 49, y: 0, type: 'spike' },
      { x: 53, y: 0, type: 'spike' },
      { x: 57, y: 0, type: 'spike' },
      { x: 58, y: 0, type: 'spike' },
      { x: 62, y: 0, type: 'spike' },
      { x: 66, y: 0, type: 'spike' },
      { x: 67, y: 0, type: 'spike' },
      { x: 68, y: 0, type: 'spike' },
    ],
  },
  '4': {
    name: 'Dry Out', color: '#d97706', bgColor: '#1a0d00',
    speed: SPEED_NORMAL * 1.15,
    tiles: [
      { x: 5, y: 0, type: 'spike' },
      { x: 6, y: 0, type: 'spike' },
      { x: 10, y: 0, type: 'spike' },
      { x: 11, y: 0, type: 'spike' },
      { x: 15, y: 0, type: 'spike' },
      { x: 19, y: 0, type: 'spike' },
      { x: 20, y: 0, type: 'spike' },
      { x: 24, y: 0, type: 'spike' },
      { x: 25, y: 0, type: 'spike' },
      { x: 26, y: 0, type: 'spike' },
      { x: 30, y: 0, type: 'spike' },
      { x: 34, y: 0, type: 'spike' },
      { x: 35, y: 0, type: 'spike' },
      { x: 39, y: 0, type: 'spike' },
      { x: 43, y: 0, type: 'spike' },
      { x: 44, y: 0, type: 'spike' },
      { x: 45, y: 0, type: 'spike' },
      { x: 49, y: 0, type: 'spike' },
      { x: 53, y: 0, type: 'spike' },
      { x: 57, y: 0, type: 'spike' },
      { x: 58, y: 0, type: 'spike' },
      { x: 62, y: 0, type: 'spike' },
      { x: 66, y: 0, type: 'spike' },
      { x: 67, y: 0, type: 'spike' },
      { x: 68, y: 0, type: 'spike' },
    ],
  },
  '5': {
    name: 'Base After Base', color: '#dc2626', bgColor: '#1a0000',
    speed: SPEED_NORMAL * 1.2,
    tiles: [
      { x: 5, y: 0, type: 'spike' }, { x: 6, y: 0, type: 'spike' },
      { x: 9, y: 0, type: 'spike' }, { x: 10, y: 0, type: 'spike' },
      { x: 13, y: 0, type: 'spike' },
      { x: 16, y: 0, type: 'spike' }, { x: 17, y: 0, type: 'spike' },
      { x: 20, y: 0, type: 'spike' }, { x: 21, y: 0, type: 'spike' }, { x: 22, y: 0, type: 'spike' },
      { x: 25, y: 0, type: 'spike' },
      { x: 28, y: 0, type: 'spike' }, { x: 29, y: 0, type: 'spike' },
      { x: 32, y: 0, type: 'spike' }, { x: 33, y: 0, type: 'spike' },
      { x: 36, y: 0, type: 'spike' },
      { x: 39, y: 0, type: 'spike' }, { x: 40, y: 0, type: 'spike' }, { x: 41, y: 0, type: 'spike' },
      { x: 44, y: 0, type: 'spike' }, { x: 45, y: 0, type: 'spike' },
      { x: 48, y: 0, type: 'spike' },
      { x: 51, y: 0, type: 'spike' }, { x: 52, y: 0, type: 'spike' },
      { x: 55, y: 0, type: 'spike' }, { x: 56, y: 0, type: 'spike' }, { x: 57, y: 0, type: 'spike' },
      { x: 60, y: 0, type: 'spike' },
      { x: 63, y: 0, type: 'spike' }, { x: 64, y: 0, type: 'spike' },
      { x: 67, y: 0, type: 'spike' }, { x: 68, y: 0, type: 'spike' },
    ],
  },
  '6': {
    name: "Can't Let Go", color: '#db2777', bgColor: '#1a0010',
    speed: SPEED_NORMAL * 1.25,
    tiles: [
      { x: 4, y: 0, type: 'spike' }, { x: 5, y: 0, type: 'spike' },
      { x: 8, y: 0, type: 'spike' }, { x: 9, y: 0, type: 'spike' },
      { x: 12, y: 0, type: 'spike' },
      { x: 14, y: 0, type: 'spike' }, { x: 15, y: 0, type: 'spike' },
      { x: 18, y: 0, type: 'spike' }, { x: 19, y: 0, type: 'spike' }, { x: 20, y: 0, type: 'spike' },
      { x: 23, y: 0, type: 'spike' },
      { x: 25, y: 0, type: 'spike' }, { x: 26, y: 0, type: 'spike' },
      { x: 29, y: 0, type: 'spike' }, { x: 30, y: 0, type: 'spike' },
      { x: 33, y: 0, type: 'spike' }, { x: 34, y: 0, type: 'spike' }, { x: 35, y: 0, type: 'spike' },
      { x: 38, y: 0, type: 'spike' },
      { x: 40, y: 0, type: 'spike' }, { x: 41, y: 0, type: 'spike' },
      { x: 44, y: 0, type: 'spike' }, { x: 45, y: 0, type: 'spike' }, { x: 46, y: 0, type: 'spike' },
      { x: 49, y: 0, type: 'spike' }, { x: 50, y: 0, type: 'spike' },
      { x: 53, y: 0, type: 'spike' },
      { x: 56, y: 0, type: 'spike' }, { x: 57, y: 0, type: 'spike' }, { x: 58, y: 0, type: 'spike' },
      { x: 61, y: 0, type: 'spike' }, { x: 62, y: 0, type: 'spike' },
      { x: 65, y: 0, type: 'spike' }, { x: 66, y: 0, type: 'spike' }, { x: 67, y: 0, type: 'spike' }, { x: 68, y: 0, type: 'spike' },
    ],
  },
};

const LEVEL_BLOCKS = 75; // длина уровня в блоках

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; color: string;
  size: number;
}

const Game = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gs = useRef({
    // Позиция игрока в мировых координатах (px)
    playerY: GROUND_Y - BLOCK,    // верхний край
    playerVY: 0,
    isOnGround: true,
    cameraX: 0,                   // сколько пикселей прокрутили
    alive: true,
    won: false,
    rotation: 0,                  // в градусах
    targetRotation: 0,
    particles: [] as Particle[],
    attempts: 1,
    jumpPressed: false,            // для единственного прыжка на нажатие
  });

  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accTimeRef = useRef<number>(0);
  const FIXED_DT = 1000 / 60; // фиксированный физический тик 60fps

  const [gameStatus, setGameStatus] = useState<'playing' | 'dead' | 'won'>('playing');
  const [attempts, setAttempts] = useState(1);
  const [progress, setProgress] = useState(0);

  const level = LEVELS[levelId || '1'] || LEVELS['1'];
  const levelLengthPx = LEVEL_BLOCKS * BLOCK;

  const spawnDeathParticles = useCallback((worldX: number, worldY: number) => {
    const state = gs.current;
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      state.particles.push({
        x: worldX, y: worldY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        color: level.color,
        size: 4 + Math.random() * 4,
      });
    }
  }, [level.color]);

  const resetGame = useCallback(() => {
    const state = gs.current;
    state.playerY = GROUND_Y - BLOCK;
    state.playerVY = 0;
    state.isOnGround = true;
    state.cameraX = 0;
    state.alive = true;
    state.won = false;
    state.rotation = 0;
    state.targetRotation = 0;
    state.particles = [];
    state.jumpPressed = false;
    state.attempts += 1;
    setAttempts(state.attempts);
    setGameStatus('playing');
    setProgress(0);
  }, []);

  // Прыжок — только один раз на событие
  const jump = useCallback(() => {
    const state = gs.current;
    if (!state.alive || state.won) return;
    if (state.isOnGround) {
      // В GD прыжковая сила = ~8.5 блоков/с при 60fps
      state.playerVY = JUMP_VY;
      state.isOnGround = false;
      // Целевая ротация +90° — GD кубик вращается ровно на 90° за прыжок
      state.targetRotation = state.rotation + 90;
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameStatus === 'dead' || gameStatus === 'won') {
          if (gameStatus === 'won') navigate('/');
          else resetGame();
          return;
        }
        if (!gs.current.jumpPressed) {
          gs.current.jumpPressed = true;
          jump();
        }
      }
      if (e.code === 'Escape') navigate('/');
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        gs.current.jumpPressed = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [jump, resetGame, gameStatus, navigate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const tiles = level.tiles;

    const physicsStep = () => {
      const state = gs.current;
      if (!state.alive || state.won) return;

      // Движение камеры (= движение мира)
      state.cameraX += level.speed;

      // Гравитация (точно как GD: сначала прибавляем скорость, потом позицию)
      state.playerVY += GRAVITY;
      // В GD максимальная скорость падения ограничена
      if (state.playerVY > 15) state.playerVY = 15;
      state.playerY += state.playerVY;

      // Пол
      if (state.playerY >= GROUND_Y - BLOCK) {
        state.playerY = GROUND_Y - BLOCK;
        state.playerVY = 0;
        state.isOnGround = true;
        // При посадке — snap rotation к ближайшим 90°
        state.rotation = Math.round(state.rotation / 90) * 90;
        state.targetRotation = state.rotation;
      } else {
        state.isOnGround = false;
      }

      // Вращение: в воздухе плавно к targetRotation с постоянной угловой скоростью
      if (!state.isOnGround) {
        // GD вращает кубик ровно 1 оборот за 2 прыжка (90°/прыжок)
        // при скорости ~7° в кадр
        const rotSpeed = 7;
        const diff = state.targetRotation - state.rotation;
        if (Math.abs(diff) <= rotSpeed) {
          state.rotation = state.targetRotation;
        } else {
          state.rotation += rotSpeed * Math.sign(diff);
        }
        // Если продолжают лететь — продолжаем крутить
        if (state.rotation >= state.targetRotation && state.playerVY > 0) {
          state.targetRotation = state.rotation + 90;
        }
      }

      // Конец уровня
      if (state.cameraX >= levelLengthPx - CANVAS_W) {
        state.won = true;
        state.alive = false;
        setGameStatus('won');
        return;
      }

      // Коллизии со спайками
      // Hitbox игрока — чуть меньше чем визуал (GD-стиль: чуть форжив)
      const margin = 4;
      const pLeft  = PLAYER_X + margin;
      const pRight = PLAYER_X + BLOCK - margin;
      const pTop   = state.playerY + margin;
      const pBottom = state.playerY + BLOCK - margin;

      for (const tile of tiles) {
        const tWorldX = tile.x * BLOCK;
        const tScreenX = tWorldX - state.cameraX;

        // Видимость
        if (tScreenX < -BLOCK * 2 || tScreenX > CANVAS_W + BLOCK) continue;

        if (tile.type === 'spike') {
          // Треугольный хитбокс спайка: AABB + triangle check
          const sLeft = tWorldX + 2;
          const sRight = tWorldX + BLOCK - 2;
          const sTip = GROUND_Y - BLOCK + 2; // верхушка

          if (pRight > sLeft && pLeft < sRight && pBottom > sTip && pTop < GROUND_Y) {
            // Более точная проверка по треугольнику
            const px_center = (pLeft + pRight) / 2 - tWorldX;
            const py_bottom = pBottom - sTip;
            const halfW = (BLOCK / 2);
            const triW = halfW * (1 - py_bottom / BLOCK);
            if (Math.abs(px_center - BLOCK / 2) < triW + 2) {
              state.alive = false;
              spawnDeathParticles(PLAYER_X + state.cameraX + BLOCK / 2, state.playerY);
              setGameStatus('dead');
              setTimeout(() => resetGame(), 700);
              return;
            }
          }
        }
      }

      // Потолок
      if (state.playerY < 50) {
        state.alive = false;
        spawnDeathParticles(PLAYER_X + state.cameraX + BLOCK / 2, state.playerY);
        setGameStatus('dead');
        setTimeout(() => resetGame(), 700);
      }
    };

    const draw = (interpolation: number) => {
      const state = gs.current;
      const W = CANVAS_W;
      const H = CANVAS_H;

      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = level.bgColor;
      ctx.fillRect(0, 0, W, H);

      // Параллакс-звёзды (2 слоя)
      for (let layer = 0; layer < 2; layer++) {
        const parallax = layer === 0 ? 0.15 : 0.35;
        const alpha = layer === 0 ? 0.3 : 0.6;
        const size = layer === 0 ? 1 : 2;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        for (let i = 0; i < 30; i++) {
          const sx = ((i * 173 + state.cameraX * parallax) % W + W) % W;
          const sy = 30 + (i * 97 + layer * 200) % (GROUND_Y - 60);
          ctx.fillRect(sx, sy, size, size);
        }
      }

      // Сетка пола (GD-стиль)
      const gridSize = BLOCK;
      ctx.strokeStyle = level.color + '25';
      ctx.lineWidth = 1;
      // Вертикальные линии сетки
      const gridOffX = -(state.cameraX % gridSize);
      for (let gx = gridOffX; gx < W; gx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, GROUND_Y);
        ctx.stroke();
      }
      // Горизонтальные линии сетки (только нижняя часть)
      for (let gy = GROUND_Y; gy < H; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
      }

      // Пол — заливка
      const floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, H);
      floorGrad.addColorStop(0, level.color + 'aa');
      floorGrad.addColorStop(0.3, level.color + '44');
      floorGrad.addColorStop(1, '#000000');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

      // Линия пола с свечением
      ctx.shadowColor = level.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = level.color;
      ctx.fillRect(0, GROUND_Y, W, 2);
      ctx.shadowBlur = 0;

      // Спайки
      tiles.forEach(tile => {
        const tWorldX = tile.x * BLOCK;
        const screenX = tWorldX - state.cameraX;
        if (screenX < -BLOCK || screenX > W + BLOCK) return;

        if (tile.type === 'spike') {
          ctx.save();
          ctx.shadowColor = level.color;
          ctx.shadowBlur = 10;
          ctx.fillStyle = level.color;
          ctx.beginPath();
          ctx.moveTo(screenX + BLOCK / 2, GROUND_Y - BLOCK); // верхушка
          ctx.lineTo(screenX + BLOCK, GROUND_Y);              // правый угол
          ctx.lineTo(screenX, GROUND_Y);                      // левый угол
          ctx.closePath();
          ctx.fill();
          // Светлый отблеск
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.beginPath();
          ctx.moveTo(screenX + BLOCK / 2, GROUND_Y - BLOCK);
          ctx.lineTo(screenX + BLOCK * 0.75, GROUND_Y - BLOCK * 0.4);
          ctx.lineTo(screenX + BLOCK * 0.5, GROUND_Y - BLOCK * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.restore();
        }
      });

      // Финишный портал
      const endScreenX = levelLengthPx - state.cameraX;
      if (endScreenX > -20 && endScreenX < W + 20) {
        ctx.save();
        for (let i = 0; i < 3; i++) {
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 20 + i * 10;
          ctx.strokeStyle = `rgba(255,215,0,${0.3 + i * 0.2})`;
          ctx.lineWidth = 3 - i;
          ctx.strokeRect(endScreenX - i * 3, GROUND_Y - BLOCK * 3 - i * 3, BLOCK + i * 6, BLOCK * 3 + i * 3);
        }
        ctx.fillStyle = 'rgba(255,215,0,0.08)';
        ctx.fillRect(endScreenX, GROUND_Y - BLOCK * 3, BLOCK, BLOCK * 3);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Игрок
      if (state.alive) {
        const interY = state.playerY; // можно добавить интерполяцию позже
        ctx.save();
        ctx.translate(PLAYER_X + BLOCK / 2, interY + BLOCK / 2);
        ctx.rotate((state.rotation * Math.PI) / 180);

        // Свечение
        ctx.shadowColor = level.color;
        ctx.shadowBlur = 18;

        // Внешний квадрат
        ctx.fillStyle = level.color;
        ctx.fillRect(-BLOCK / 2, -BLOCK / 2, BLOCK, BLOCK);

        // Внутренний квадрат белый
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        const inner = BLOCK * 0.3;
        ctx.fillRect(-inner / 2, -inner / 2, inner, inner);

        // Орбит-шар (маленькая точка в углу)
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(BLOCK * 0.3, -BLOCK * 0.3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Trail (след) — простой
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = level.color;
        ctx.fillRect(PLAYER_X - 20, interY + 4, 18, BLOCK - 8);
        ctx.globalAlpha = 0.08;
        ctx.fillRect(PLAYER_X - 36, interY + 8, 14, BLOCK - 16);
        ctx.restore();
      }

      // Частицы смерти
      state.particles = state.particles.filter(p => p.life > 0);
      state.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = p.color;
        const screenPX = p.x - state.cameraX;
        ctx.fillRect(screenPX - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4;
        p.life -= 0.04;
      });

      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, 48);

      // Попытки
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.textAlign = 'left';
      ctx.fillText(`Попытка ${state.attempts}`, 16, 30);

      // Прогресс бар
      const prog = Math.min(state.cameraX / (levelLengthPx - W), 1);
      const barX = W / 2 - 120;
      const barW = 240;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(barX, 16, barW, 8);
      ctx.fillStyle = level.color;
      ctx.shadowColor = level.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(barX, 16, barW * prog, 8);
      ctx.shadowBlur = 0;

      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(prog * 100)}%`, W / 2, 36);

      // Экран победы
      if (state.won) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 40;
        ctx.font = 'bold 64px "Courier New", monospace';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('ПОБЕДА!', W / 2, H / 2 - 30);
        ctx.shadowBlur = 0;
        ctx.font = '18px "Courier New", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(`Попыток: ${state.attempts}`, W / 2, H / 2 + 20);
        ctx.font = '14px "Courier New", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText('ПРОБЕЛ — в меню', W / 2, H / 2 + 50);
      }

      ctx.textAlign = 'left';
    };

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const elapsed = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Фиксированный физический шаг
      accTimeRef.current += elapsed;
      while (accTimeRef.current >= FIXED_DT) {
        physicsStep();
        accTimeRef.current -= FIXED_DT;
        // Обновляем прогресс не каждый кадр
        const state = gs.current;
        const p = Math.min(state.cameraX / (levelLengthPx - CANVAS_W), 1);
        setProgress(Math.round(p * 100));
      }

      draw(accTimeRef.current / FIXED_DT);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = 0;
    accTimeRef.current = 0;
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [level, levelLengthPx, resetGame, spawnDeathParticles]);

  const handleCanvasInteract = useCallback(() => {
    if (gameStatus === 'dead') return;
    if (gameStatus === 'won') { navigate('/'); return; }
    jump();
  }, [gameStatus, jump, navigate]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center select-none">
      <div className="w-full max-w-4xl px-2">
        <div className="flex items-center justify-between mb-2 px-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white/50 hover:text-white text-xs"
          >
            <Icon name="ArrowLeft" size={14} className="mr-1" />
            Назад
          </Button>
          <h2 className="font-bold text-base" style={{ color: level.color }}>
            {level.name}
          </h2>
          <span className="text-white/30 text-xs">ESC — выход</span>
        </div>

        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full rounded-lg border border-white/10 cursor-pointer block"
          onClick={handleCanvasInteract}
          onTouchStart={(e) => { e.preventDefault(); handleCanvasInteract(); }}
          style={{ touchAction: 'none', imageRendering: 'pixelated' }}
        />

        <div className="flex items-center justify-center gap-4 mt-2 text-white/40 text-xs">
          <span>ПРОБЕЛ / ЛКМ — прыжок</span>
          <span>•</span>
          <span>Попытка {attempts}</span>
          <span>•</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
};

export default Game;
