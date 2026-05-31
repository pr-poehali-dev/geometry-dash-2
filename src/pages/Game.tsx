import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const LEVELS: Record<string, { name: string; color: string; speed: number; obstacles: number[] }> = {
  '1': { name: 'Stereo Madness', color: '#7c3aed', speed: 4, obstacles: [300, 500, 650, 900, 1100, 1400, 1600, 1900, 2100, 2400] },
  '2': { name: 'Back on Track', color: '#2563eb', speed: 4.5, obstacles: [280, 450, 620, 800, 950, 1200, 1350, 1600, 1800, 2000, 2200, 2500] },
  '3': { name: 'Polargeist', color: '#059669', speed: 5, obstacles: [250, 400, 550, 700, 850, 1050, 1200, 1400, 1550, 1750, 1900, 2100, 2300, 2600] },
  '4': { name: 'Dry Out', color: '#d97706', speed: 5.5, obstacles: [220, 380, 520, 670, 820, 970, 1120, 1300, 1450, 1620, 1780, 1950, 2100, 2280, 2450, 2650] },
  '5': { name: 'Base After Base', color: '#dc2626', speed: 6, obstacles: [200, 350, 480, 630, 760, 910, 1040, 1190, 1340, 1490, 1640, 1790, 1940, 2100, 2250, 2400, 2600, 2800] },
  '6': { name: "Can't Let Go", color: '#db2777', speed: 6.5, obstacles: [180, 320, 460, 580, 720, 850, 990, 1120, 1260, 1400, 1540, 1680, 1820, 1960, 2100, 2260, 2400, 2560, 2700, 2900] },
};

const GROUND_Y = 400;
const PLAYER_SIZE = 40;
const PLAYER_X = 100;
const OBSTACLE_WIDTH = 40;
const OBSTACLE_HEIGHT = 40;
const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const LEVEL_LENGTH = 3000;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const Game = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef({
    playerY: GROUND_Y - PLAYER_SIZE,
    playerVY: 0,
    isOnGround: true,
    cameraX: 0,
    alive: true,
    won: false,
    rotation: 0,
    particles: [] as Particle[],
    attempts: 1,
  });
  const animFrameRef = useRef<number>(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'dead' | 'won'>('playing');
  const [attempts, setAttempts] = useState(1);
  const [progress, setProgress] = useState(0);

  const level = LEVELS[levelId || '1'] || LEVELS['1'];

  const spawnDeathParticles = (x: number, y: number) => {
    const gs = gameStateRef.current;
    for (let i = 0; i < 20; i++) {
      gs.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color: level.color,
      });
    }
  };

  const resetGame = useCallback(() => {
    const gs = gameStateRef.current;
    gs.playerY = GROUND_Y - PLAYER_SIZE;
    gs.playerVY = 0;
    gs.isOnGround = true;
    gs.cameraX = 0;
    gs.alive = true;
    gs.won = false;
    gs.rotation = 0;
    gs.particles = [];
    gs.attempts += 1;
    setAttempts(gs.attempts);
    setGameStatus('playing');
    setProgress(0);
  }, []);

  const jump = useCallback(() => {
    const gs = gameStateRef.current;
    if (!gs.alive || gs.won) return;
    if (gs.isOnGround) {
      gs.playerVY = JUMP_FORCE;
      gs.isOnGround = false;
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameStatus === 'dead') {
          resetGame();
        } else {
          jump();
        }
      }
      if (e.code === 'Escape') navigate('/');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [jump, resetGame, gameStatus, navigate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const obstacles = level.obstacles;

    const draw = () => {
      const gs = gameStateRef.current;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0a0a1a');
      bg.addColorStop(1, '#1a0a2e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (let i = 0; i < 50; i++) {
        const sx = ((i * 137 + gs.cameraX * 0.1) % W + W) % W;
        const sy = (i * 73) % (H * 0.7);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Ground
      const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, H);
      groundGrad.addColorStop(0, level.color + '99');
      groundGrad.addColorStop(1, '#000');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

      // Ground line glow
      ctx.shadowColor = level.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = level.color;
      ctx.fillRect(0, GROUND_Y, W, 3);
      ctx.shadowBlur = 0;

      // Grid lines on ground
      ctx.strokeStyle = level.color + '33';
      ctx.lineWidth = 1;
      for (let gx = -(gs.cameraX % 80); gx < W; gx += 80) {
        ctx.beginPath();
        ctx.moveTo(gx, GROUND_Y);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }

      // Obstacles
      obstacles.forEach(ox => {
        const screenX = ox - gs.cameraX;
        if (screenX < -60 || screenX > W + 60) return;

        ctx.save();
        ctx.shadowColor = level.color;
        ctx.shadowBlur = 15;

        // Spike shape
        ctx.fillStyle = level.color;
        ctx.beginPath();
        ctx.moveTo(screenX + OBSTACLE_WIDTH / 2, GROUND_Y - OBSTACLE_HEIGHT);
        ctx.lineTo(screenX + OBSTACLE_WIDTH, GROUND_Y);
        ctx.lineTo(screenX, GROUND_Y);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
      });

      // End portal
      const endX = LEVEL_LENGTH - gs.cameraX;
      if (endX > 0 && endX < W + 100) {
        ctx.save();
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 30;
        const portalGrad = ctx.createLinearGradient(endX - 10, 0, endX + 10, 0);
        portalGrad.addColorStop(0, 'transparent');
        portalGrad.addColorStop(0.5, '#ffd700');
        portalGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = portalGrad;
        ctx.fillRect(endX - 10, GROUND_Y - 120, 20, 120);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Player
      if (gs.alive) {
        ctx.save();
        const px = PLAYER_X + PLAYER_SIZE / 2;
        const py = gs.playerY + PLAYER_SIZE / 2;
        ctx.translate(px, py);
        ctx.rotate((gs.rotation * Math.PI) / 180);

        ctx.shadowColor = level.color;
        ctx.shadowBlur = 20;

        // Player body
        ctx.fillStyle = level.color;
        ctx.fillRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);

        // Inner square
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(-PLAYER_SIZE / 4, -PLAYER_SIZE / 4, PLAYER_SIZE / 2, PLAYER_SIZE / 2);

        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Particles
      gs.particles = gs.particles.filter(p => p.life > 0);
      gs.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 5;
        ctx.fillRect(p.x - gs.cameraX, p.y, 6, 6);
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.life -= 0.05;
      });

      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, 50);

      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#ffffff99';
      ctx.fillText(`Попытка ${gs.attempts}`, 16, 32);

      const prog = Math.min(gs.cameraX / (LEVEL_LENGTH - W), 1);
      ctx.fillStyle = '#ffffff20';
      ctx.fillRect(W / 2 - 150, 15, 300, 10);
      ctx.fillStyle = level.color;
      ctx.shadowColor = level.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(W / 2 - 150, 15, 300 * prog, 10);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffffcc';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(prog * 100)}%`, W / 2, 40);
      ctx.textAlign = 'left';

      if (gs.won) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 30;
        ctx.font = 'bold 60px monospace';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('ПОБЕДА!', W / 2, H / 2 - 20);
        ctx.shadowBlur = 0;
        ctx.font = '20px monospace';
        ctx.fillStyle = '#ffffff99';
        ctx.fillText(`${gs.attempts} попыток`, W / 2, H / 2 + 30);
        ctx.textAlign = 'left';
      }
    };

    const update = () => {
      const gs = gameStateRef.current;
      if (!gs.alive || gs.won) return;

      const W = canvas.width;

      // Physics
      gs.playerVY += GRAVITY;
      gs.playerY += gs.playerVY;

      if (gs.playerY >= GROUND_Y - PLAYER_SIZE) {
        gs.playerY = GROUND_Y - PLAYER_SIZE;
        gs.playerVY = 0;
        gs.isOnGround = true;
      } else {
        gs.isOnGround = false;
      }

      // Rotation
      if (!gs.isOnGround) {
        gs.rotation += 7;
      } else {
        gs.rotation = Math.round(gs.rotation / 90) * 90;
      }

      // Camera
      gs.cameraX += level.speed;

      // Progress
      const prog = Math.min(gs.cameraX / (LEVEL_LENGTH - W), 1);
      setProgress(Math.round(prog * 100));

      // Win condition
      if (gs.cameraX >= LEVEL_LENGTH - W) {
        gs.won = true;
        gs.alive = false;
        setGameStatus('won');
        return;
      }

      // Collision with obstacles
      const playerLeft = PLAYER_X + 4;
      const playerRight = PLAYER_X + PLAYER_SIZE - 4;
      const playerTop = gs.playerY + 4;
      const playerBottom = gs.playerY + PLAYER_SIZE - 4;

      for (const ox of obstacles) {
        const absOx = ox - gs.cameraX;
        if (absOx + OBSTACLE_WIDTH < playerLeft || absOx > playerRight) continue;

        // Spike collision (triangle check)
        const spikeLeft = absOx;
        const spikeRight = absOx + OBSTACLE_WIDTH;
        const spikeTip = GROUND_Y - OBSTACLE_HEIGHT;

        if (playerBottom > spikeTip + 5 && playerTop < GROUND_Y && playerRight > spikeLeft + 5 && playerLeft < spikeRight - 5) {
          gs.alive = false;
          spawnDeathParticles(PLAYER_X + gs.cameraX, gs.playerY);
          setGameStatus('dead');
          setTimeout(() => resetGame(), 800);
          return;
        }
      }

      // Ceiling
      if (gs.playerY < 0) {
        gs.alive = false;
        spawnDeathParticles(PLAYER_X + gs.cameraX, gs.playerY);
        setGameStatus('dead');
        setTimeout(() => resetGame(), 800);
      }
    };

    const loop = () => {
      update();
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [level, resetGame]);

  const handleCanvasClick = () => {
    if (gameStatus === 'dead') return;
    jump();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center select-none">
      <div className="w-full max-w-3xl px-4">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white/60 hover:text-white"
          >
            <Icon name="ArrowLeft" size={16} className="mr-1" />
            Назад
          </Button>
          <h2 className="text-white font-bold text-lg" style={{ color: level.color }}>
            {level.name}
          </h2>
          <span className="text-white/40 text-sm">ESC — выход</span>
        </div>

        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full rounded-lg border border-white/10 cursor-pointer"
          onClick={handleCanvasClick}
          onTouchStart={(e) => { e.preventDefault(); jump(); }}
          style={{ touchAction: 'none' }}
        />

        <div className="flex items-center justify-center gap-6 mt-3 text-white/50 text-sm">
          <span>ПРОБЕЛ / КЛИК — прыжок</span>
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
