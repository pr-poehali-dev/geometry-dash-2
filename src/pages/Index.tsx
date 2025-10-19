import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Level {
  id: number;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  stars: number;
  locked: boolean;
}

interface OnlineRoom {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
}

const Index = () => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<'levels' | 'online'>('levels');
  const [roomName, setRoomName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const levels: Level[] = [
    { id: 1, name: 'Stereo Madness', difficulty: 'easy', stars: 3, locked: false },
    { id: 2, name: 'Back on Track', difficulty: 'easy', stars: 3, locked: false },
    { id: 3, name: 'Polargeist', difficulty: 'medium', stars: 2, locked: false },
    { id: 4, name: 'Dry Out', difficulty: 'medium', stars: 3, locked: false },
    { id: 5, name: 'Base After Base', difficulty: 'hard', stars: 2, locked: false },
    { id: 6, name: 'Cant Let Go', difficulty: 'hard', stars: 3, locked: false },
    { id: 7, name: 'Jumper', difficulty: 'hard', stars: 1, locked: true },
    { id: 8, name: 'Time Machine', difficulty: 'extreme', stars: 0, locked: true },
  ];

  const [onlineRooms, setOnlineRooms] = useState<OnlineRoom[]>([
    { id: '1', name: 'Speed Run Room', players: 2, maxPlayers: 4 },
    { id: '2', name: 'Chill Lobby', players: 1, maxPlayers: 2 },
    { id: '3', name: 'Pro Players Only', players: 3, maxPlayers: 4 },
  ]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-primary';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-accent';
      case 'extreme': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Circle';
      case 'medium': return 'Triangle';
      case 'hard': return 'Square';
      case 'extreme': return 'Hexagon';
      default: return 'Circle';
    }
  };

  const createRoom = () => {
    if (!roomName.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите название комнаты',
        variant: 'destructive',
      });
      return;
    }

    const newRoom: OnlineRoom = {
      id: String(onlineRooms.length + 1),
      name: roomName,
      players: 1,
      maxPlayers: 4,
    };

    setOnlineRooms([...onlineRooms, newRoom]);
    setRoomName('');
    
    toast({
      title: 'Комната создана!',
      description: `${roomName} готова к игре`,
    });
  };

  const playLevel = (level: Level) => {
    if (level.locked) {
      toast({
        title: 'Уровень заблокирован',
        description: 'Пройдите предыдущие уровни',
        variant: 'destructive',
      });
      return;
    }

    setSelectedLevel(level.id);
    toast({
      title: `Загружаем ${level.name}`,
      description: 'Приготовьтесь к прыжкам!',
    });
  };

  const joinRoom = (room: OnlineRoom) => {
    if (room.players >= room.maxPlayers) {
      toast({
        title: 'Комната полна',
        description: 'Выберите другую комнату',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Подключение...',
      description: `Входим в ${room.name}`,
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 blur-3xl rounded-full animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 blur-3xl rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-accent/10 blur-3xl rounded-full animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            GEOMETRY DASH
          </h1>
          <p className="text-muted-foreground text-lg">Прыгай. Летай. Разбивайся. Повторяй.</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <Button
            onClick={() => setSelectedTab('levels')}
            variant={selectedTab === 'levels' ? 'default' : 'outline'}
            className="relative overflow-hidden group px-8 py-6 text-lg font-bold"
          >
            <div className="absolute inset-0 bg-primary/20 transform -skew-x-12 group-hover:bg-primary/30 transition-colors" />
            <span className="relative flex items-center gap-2">
              <Icon name="Layers" size={20} />
              УРОВНИ
            </span>
          </Button>
          <Button
            onClick={() => setSelectedTab('online')}
            variant={selectedTab === 'online' ? 'default' : 'outline'}
            className="relative overflow-hidden group px-8 py-6 text-lg font-bold"
          >
            <div className="absolute inset-0 bg-secondary/20 transform -skew-x-12 group-hover:bg-secondary/30 transition-colors" />
            <span className="relative flex items-center gap-2">
              <Icon name="Users" size={20} />
              ОНЛАЙН
            </span>
          </Button>
        </div>

        {selectedTab === 'levels' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
            {levels.map((level, index) => (
              <Card
                key={level.id}
                className={`relative p-6 bg-card/50 backdrop-blur-sm border-2 transition-all duration-300 cursor-pointer group overflow-hidden ${
                  selectedLevel === level.id ? 'border-primary animate-pulse-glow' : 'border-border hover:border-primary/50'
                } ${level.locked ? 'opacity-50' : ''}`}
                onClick={() => playLevel(level)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
                
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 bg-background/50 transform -rotate-12 ${getDifficultyColor(level.difficulty)}`}>
                      <Icon name={getDifficultyIcon(level.difficulty)} size={32} />
                    </div>
                    {level.locked && (
                      <div className="p-2 bg-background/50">
                        <Icon name="Lock" size={20} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-xl mb-2 transform -skew-x-6">{level.name}</h3>
                  
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(3)].map((_, i) => (
                      <Icon
                        key={i}
                        name="Star"
                        size={16}
                        className={i < level.stars ? 'text-yellow-400 fill-yellow-400' : 'text-muted'}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold uppercase ${getDifficultyColor(level.difficulty)}`}>
                      {level.difficulty}
                    </span>
                    <span className="text-xs text-muted-foreground">#{level.id}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedTab === 'online' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-2 border-border">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Icon name="Plus" size={24} className="text-primary" />
                Создать комнату
              </h2>
              <div className="flex gap-4">
                <Input
                  type="text"
                  placeholder="Название комнаты..."
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="flex-1 bg-background/50 border-2 border-border focus:border-primary"
                  onKeyPress={(e) => e.key === 'Enter' && createRoom()}
                />
                <Button
                  onClick={createRoom}
                  className="px-8 font-bold bg-primary hover:bg-primary/80"
                >
                  СОЗДАТЬ
                </Button>
              </div>
            </Card>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Icon name="Globe" size={24} className="text-secondary" />
                Активные комнаты
              </h2>
              {onlineRooms.map((room, index) => (
                <Card
                  key={room.id}
                  className="p-6 bg-card/50 backdrop-blur-sm border-2 border-border hover:border-secondary/50 transition-all cursor-pointer group"
                  onClick={() => joinRoom(room)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-secondary/20 transform -rotate-12 group-hover:rotate-0 transition-transform">
                        <Icon name="Gamepad2" size={32} className="text-secondary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1">{room.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Icon name="Users" size={16} />
                          <span>{room.players}/{room.maxPlayers} игроков</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="font-bold border-2 border-secondary text-secondary hover:bg-secondary hover:text-background"
                    >
                      ВОЙТИ
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
