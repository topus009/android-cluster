import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  Smartphone, 
  ListTodo, 
  BarChart3, 
  Settings,
  Home
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

const navigation = [
  { name: 'Главная', href: '/', icon: Home },
  { name: 'Панель', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Устройства', href: '/devices', icon: Smartphone },
  { name: 'Задачи', href: '/tasks', icon: ListTodo },
  { name: 'Производительность', href: '/performance', icon: BarChart3 },
  { name: 'Настройки', href: '/settings', icon: Settings }
]

export default function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  // Загружаем состояние из localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState !== null) {
      setCollapsed(JSON.parse(savedState))
    }
  }, [])

  // Сохраняем состояние в localStorage
  const toggleCollapsed = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
  }

  return (
    <div className={cn(
      'flex flex-col bg-background border-r border-border transition-all duration-300',
      collapsed ? 'w-16' : 'w-64',
      className
    )}>
      {/* Фиксированный заголовок */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        {!collapsed && (
          <h2 className="text-lg font-semibold text-foreground">
            Android Cluster
          </h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Навигация */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive 
                    ? 'bg-accent text-accent-foreground' 
                    : 'text-muted-foreground'
                )}
              >
                <Icon className={cn(
                  'h-4 w-4',
                  collapsed ? 'mx-auto' : 'mr-3'
                )} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Переключатель внизу */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className={cn(
            'w-full transition-all duration-300',
            collapsed ? 'px-2' : 'px-4'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Свернуть</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
