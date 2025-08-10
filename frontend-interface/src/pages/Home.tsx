import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useClusterStore } from '@/store/cluster-store'
import { 
  Smartphone, 
  ListTodo, 
  BarChart3, 
  Play, 
  Plus,
  Activity,
  Zap,
  Clock
} from 'lucide-react'

export default function Home() {
  const { stats, isConnected, isLoading } = useClusterStore()

  const quickActions = [
    {
      title: 'Добавить задачу',
      description: 'Создать новую задачу для кластера',
      icon: Plus,
      href: '/tasks',
      variant: 'default' as const
    },
    {
      title: 'Мониторинг',
      description: 'Просмотр производительности устройств',
      icon: Activity,
      href: '/performance',
      variant: 'secondary' as const
    },
    {
      title: 'Управление',
      description: 'Настройка и конфигурация кластера',
      icon: Settings,
      href: '/settings',
      variant: 'outline' as const
    }
  ]

  const statsCards = [
    {
      title: 'Устройства',
      value: stats?.totalDevices || 0,
      subtitle: `${stats?.onlineDevices || 0} онлайн`,
      icon: Smartphone,
      color: 'text-blue-600'
    },
    {
      title: 'Задачи',
      value: stats?.totalTasks || 0,
      subtitle: `${stats?.completedTasks || 0} выполнено`,
      icon: ListTodo,
      color: 'text-green-600'
    },
    {
      title: 'Производительность',
      value: `${Math.round((stats?.averageResponseTime || 0) * 1000)}ms`,
      subtitle: 'Среднее время ответа',
      icon: Zap,
      color: 'text-purple-600'
    },
    {
      title: 'Активные задачи',
      value: stats?.activeTasksCount || 0,
      subtitle: `${stats?.queueLength || 0} в очереди`,
      icon: Clock,
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Android Cluster</h1>
          <p className="text-muted-foreground">
            Кластер Android устройств для тестирования производительности
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'Подключен' : 'Отключен'}
          </Badge>
          {isLoading && (
            <Badge variant="secondary">
              Загрузка...
            </Badge>
          )}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Быстрые действия */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Быстрые действия</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Card key={action.title} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </div>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={action.href}>
                    <Button variant={action.variant} className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Открыть
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Статус кластера */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Статус кластера</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Обзор системы</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Подключение</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Статус:</span>
                    <Badge variant={isConnected ? 'default' : 'destructive'}>
                      {isConnected ? 'Активно' : 'Неактивно'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Устройств:</span>
                    <span className="text-sm font-medium">
                      {stats?.onlineDevices || 0} / {stats?.totalDevices || 0}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Производительность</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Задач в очереди:</span>
                    <span className="text-sm font-medium">{stats?.queueLength || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Активных задач:</span>
                    <span className="text-sm font-medium">{stats?.activeTasksCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
