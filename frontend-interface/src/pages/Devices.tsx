import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useClusterStore } from '@/store/cluster-store'
import { 
  Smartphone, 
  Activity,
  Zap,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react'

export default function Devices() {
  const { devices, stats, isConnected, isLoading } = useClusterStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'offline': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getDeviceStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Онлайн'
      case 'offline': return 'Офлайн'
      default: return 'Неизвестно'
    }
  }

  const getDeviceLoadColor = (load: number) => {
    if (load < 30) return 'text-green-600'
    if (load < 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredAndSortedDevices = devices
    .filter(device => {
      const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           device.host.includes(searchTerm)
      const matchesStatus = statusFilter === 'all' || device.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'status':
          return a.status.localeCompare(b.status)
        case 'load':
          return b.currentLoad - a.currentLoad
        case 'tasks':
          return b.completedTasks - a.completedTasks
        case 'response':
          return a.averageResponseTime - b.averageResponseTime
        default:
          return 0
      }
    })

  const handleRefreshDevice = (deviceId: string) => {
    // Здесь будет логика обновления устройства
    console.log('Обновление устройства:', deviceId)
  }

  const handleRestartDevice = (deviceId: string) => {
    // Здесь будет логика перезапуска устройства
    console.log('Перезапуск устройства:', deviceId)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded animate-pulse"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">Устройства</h1>
          <p className="text-muted-foreground">
            Управление Android устройствами в кластере
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'Подключен' : 'Отключен'}
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить все
          </Button>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск устройств..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="online">Онлайн</SelectItem>
                <SelectItem value="offline">Офлайн</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">По имени</SelectItem>
                <SelectItem value="status">По статусу</SelectItem>
                <SelectItem value="load">По нагрузке</SelectItem>
                <SelectItem value="tasks">По задачам</SelectItem>
                <SelectItem value="response">По времени ответа</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Статистика устройств */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего устройств</CardTitle>
            <Smartphone className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
            <p className="text-xs text-muted-foreground">
              {devices.filter(d => d.status === 'online').length} онлайн
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средняя нагрузка</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {devices.length > 0 
                ? Math.round(devices.reduce((sum, d) => sum + d.currentLoad, 0) / devices.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              По всем устройствам
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
              {devices.length > 0 
                ? Math.round(devices.reduce((sum, d) => sum + d.averageResponseTime, 0) / devices.length * 1000)
                : 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Среднее по кластеру
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выполнено задач</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {devices.reduce((sum, d) => sum + d.completedTasks, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Общее количество
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Список устройств */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedDevices.map((device) => (
          <Card key={device.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getDeviceStatusColor(device.status)}`} />
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle className="text-lg">{device.name}</CardTitle>
              <CardDescription>
                {device.host}:{device.port}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Статус */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Статус:</span>
                <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                  {getDeviceStatusText(device.status)}
                </Badge>
              </div>

              {/* Нагрузка */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Нагрузка:</span>
                <span className={`text-sm font-medium ${getDeviceLoadColor(device.currentLoad)}`}>
                  {device.currentLoad}%
                </span>
              </div>

              {/* Время ответа */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Время ответа:</span>
                <span className="text-sm font-medium">
                  {Math.round(device.averageResponseTime * 1000)}ms
                </span>
              </div>

              {/* Задачи */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Выполнено задач:</span>
                <span className="text-sm font-medium">{device.completedTasks}</span>
              </div>

              {/* Действия */}
              <div className="flex space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleRefreshDevice(device.id)}
                  disabled={device.status === 'offline'}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Обновить
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleRestartDevice(device.id)}
                  disabled={device.status === 'offline'}
                >
                  <Wifi className="h-3 w-3 mr-1" />
                  Перезапуск
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Пустое состояние */}
      {filteredAndSortedDevices.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Smartphone className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Устройства не найдены</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Попробуйте изменить фильтры поиска'
                : 'Добавьте устройства в кластер для начала работы'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button>
                <Smartphone className="h-4 w-4 mr-2" />
                Добавить устройство
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
