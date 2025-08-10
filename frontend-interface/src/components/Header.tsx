import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Sun, 
  Moon, 
  Monitor,
  Bell,
  Search,
  Menu
} from 'lucide-react'
import { useClusterStore } from '@/store/cluster-store'

interface HeaderProps {
  className?: string
}

export default function Header({ className }: HeaderProps) {
  const { isConnected, stats } = useClusterStore()
  const location = useLocation()
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>('system')

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
    
    // Применяем тему
    if (nextTheme === 'dark' || (nextTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    localStorage.setItem('theme', nextTheme)
  }

  // Загружаем тему из localStorage
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system'
    if (savedTheme) {
      setTheme(savedTheme)
      if (savedTheme === 'dark' || (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Главная'
      case '/dashboard': return 'Панель управления'
      case '/devices': return 'Устройства'
      case '/tasks': return 'Задачи'
      case '/performance': return 'Производительность'
      case '/settings': return 'Настройки'
      default: return 'Android Cluster'
    }
  }

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      className
    )}>
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Левая часть - заголовок страницы */}
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-foreground">
            {getPageTitle()}
          </h1>
        </div>

        {/* Центральная часть - навигация */}
        <nav className="hidden md:flex items-center space-x-2">
          <Link to="/">
            <Button variant="ghost" size="sm">Главная</Button>
          </Link>
          <Link to="/devices">
            <Button variant="ghost" size="sm">Устройства</Button>
          </Link>
          <Link to="/tasks">
            <Button variant="ghost" size="sm">Задачи</Button>
          </Link>
          <Link to="/performance">
            <Button variant="ghost" size="sm">Производительность</Button>
          </Link>
        </nav>

        {/* Правая часть - действия */}
        <div className="flex items-center space-x-2">
          {/* Статус подключения */}
          <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
            <div className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500' : 'bg-red-500'
            )} />
            <span>{isConnected ? 'Подключен' : 'Отключен'}</span>
            {isConnected && stats && (
              <span className="text-xs">
                ({stats.onlineDevices}/{stats.totalDevices} устройств)
              </span>
            )}
          </div>

          {/* Поиск */}
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Search className="h-4 w-4" />
          </Button>

          {/* Уведомления */}
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>

          {/* Переключатель темы */}
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {theme === 'light' && <Sun className="h-4 w-4" />}
            {theme === 'dark' && <Moon className="h-4 w-4" />}
            {theme === 'system' && <Monitor className="h-4 w-4" />}
          </Button>

          {/* Мобильное меню */}
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
