import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useClusterStore } from '@/store/cluster-store'
import { 
  Smartphone, 
  ListTodo, 
  BarChart3, 
  Activity,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'

export default function Dashboard() {
  const { stats, devices, tasks, isConnected, isLoading } = useClusterStore()

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'offline': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'processing': return 'bg-blue-500'
      case 'queued': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getTaskStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Выполнено'
      case 'processing': return 'Выполняется'
      case 'queued': return 'В очереди'
      case 'failed': return 'Ошибка'
      default: return 'Неизвестно'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Панель управления</h1>
          <p className="text-muted-foreground">
            Детальный обзор состояния Android кластера
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'Подключен' : 'Отключен'}
          </Badge>
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Обновить
          </Button>
        </div>
      </div>

      {/* Основная статистика */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего устройств</CardTitle>
            <Smartphone className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDevices || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.onlineDevices || 0} онлайн
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего задач</CardTitle>
            <ListTodo className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedTasks || 0} выполнено
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Время ответа</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats?.averageResponseTime || 0) * 1000)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Среднее время
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные задачи</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeTasksCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.queueLength || 0} в очереди
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Устройства */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Устройства</span>
            </CardTitle>
            <CardDescription>
              Статус и производительность Android устройств
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {devices.length > 0 ? (
                devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getDeviceStatusColor(device.status)}`} />
                      <div>
                        <p className="font-medium text-sm">{device.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {device.host}:{device.port}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {device.completedTasks} задач
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(device.averageResponseTime * 1000)}ms
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Устройства не найдены</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Задачи */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ListTodo className="h-5 w-5" />
              <span>Последние задачи</span>
            </CardTitle>
            <CardDescription>
              Статус выполнения задач в кластере
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.length > 0 ? (
                tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getTaskStatusColor(task.status)}`} />
                      <div>
                        <p className="font-medium text-sm capitalize">{task.operation}</p>
                        <p className="text-xs text-muted-foreground">
                          Параметр: {task.params}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {getTaskStatusText(task.status)}
                      </Badge>
                      {task.processingTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round(task.processingTime * 1000)}ms
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Задачи не найдены</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Производительность */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Производительность кластера</span>
          </CardTitle>
          <CardDescription>
            Метрики производительности и статистика
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats?.completedTasks || 0}
              </div>
              <p className="text-sm text-muted-foreground">Выполнено задач</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {stats?.failedTasks || 0}
              </div>
              <p className="text-sm text-muted-foreground">Неудачных задач</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((stats?.clusterThroughput || 0) * 100) / 100}
              </div>
              <p className="text-sm text-muted-foreground">Задач/сек</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Предупреждения */}
      {(!isConnected || stats?.failedTasks > 0) && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
              <AlertTriangle className="h-5 w-5" />
              <span>Внимание</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!isConnected && (
                <p className="text-orange-800 dark:text-orange-200">
                  Кластер не подключен. Проверьте соединение с сервером.
                </p>
              )}
              {stats?.failedTasks > 0 && (
                <p className="text-orange-800 dark:text-orange-200">
                  Обнаружено {stats.failedTasks} неудачных задач. Проверьте логи устройств.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
