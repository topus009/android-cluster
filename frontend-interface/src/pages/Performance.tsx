import React, { useEffect, useState } from 'react'
import { useClusterStore } from '@/store/cluster-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  Clock, 
  Cpu, 
  HardDrive, 
  Network, 
  Play, 
  Square, 
  TrendingUp,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Smartphone,
  Image,
  Lock,
  FileText,
  Wifi,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

interface PerformanceData {
  timestamp: number
  totalTasks: number
  completedTasks: number
  failedTasks: number
  averageResponseTime: number
  clusterThroughput: number
  onlineDevices: number
}

const Performance: React.FC = () => {
  const { 
    stats, 
    performanceMetrics, 
    devices, 
    isConnected, 
    addBulkTasks,
    isLoading 
  } = useClusterStore()

  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null)
  const [selectedOperation, setSelectedOperation] = useState<string>('factorial')

  // Запись метрик производительности
  useEffect(() => {
    if (isRecording && isConnected) {
      const interval = setInterval(() => {
        const data: PerformanceData = {
          timestamp: Date.now(),
          totalTasks: stats.totalTasks,
          completedTasks: stats.completedTasks,
          failedTasks: stats.failedTasks,
          averageResponseTime: stats.averageResponseTime,
          clusterThroughput: stats.clusterThroughput,
          onlineDevices: stats.onlineDevices
        }
        
        setPerformanceHistory(prev => [...prev, data].slice(-100)) // Храним последние 100 записей
      }, 5000) // Записываем каждые 5 секунд

      setRecordingInterval(interval)
    } else if (recordingInterval) {
      clearInterval(recordingInterval)
      setRecordingInterval(null)
    }

    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval)
      }
    }
  }, [isRecording, isConnected, stats])

  // Запуск/остановка записи
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      toast.success('Запись метрик остановлена')
    } else {
      setIsRecording(true)
      toast.success('Запись метрик запущена')
    }
  }

  // Очистка истории
  const clearHistory = () => {
    setPerformanceHistory([])
    toast.success('История метрик очищена')
  }

  // Тестовые нагрузки
  const runLoadTest = async (operation: string, params: number, count: number) => {
    try {
      await addBulkTasks({ operation, params, count })
      toast.success(`Запущен тест нагрузки: ${count} задач ${operation}(${params})`)
    } catch (error) {
      toast.error('Ошибка запуска теста нагрузки')
    }
  }

  // Форматирование времени
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(2)}мс`
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}с`
    return `${(ms / 60000).toFixed(2)}мин`
  }

  // Форматирование числа
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Статус устройства
  const getDeviceStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
  }

  // Получение иконки для операции
  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'imageProcessing':
        return <Image className="w-4 h-4" />
      case 'dataCompression':
        return <BarChart3 className="w-4 h-4" />
      case 'encryption':
        return <Lock className="w-4 h-4" />
      case 'networkSimulation':
        return <Wifi className="w-4 h-4" />
      case 'fileOperations':
        return <FileText className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  // Получение описания операции
  const getOperationDescription = (operation: string) => {
    switch (operation) {
      case 'factorial':
        return 'Вычисление факториала'
      case 'primeNumbers':
        return 'Поиск простых чисел'
      case 'arraySort':
        return 'Сортировка массивов'
      case 'hash':
        return 'Хеширование данных'
      case 'fibonacci':
        return 'Числа Фибоначчи'
      case 'imageProcessing':
        return 'Обработка изображений'
      case 'dataCompression':
        return 'Сжатие данных'
      case 'encryption':
        return 'Шифрование данных'
      case 'networkSimulation':
        return 'Сетевые операции'
      case 'fileOperations':
        return 'Файловые операции'
      default:
        return 'Неизвестная операция'
    }
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Производительность кластера</h1>
          <p className="text-muted-foreground">
            Мониторинг и анализ производительности Android кластера
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={toggleRecording}
            disabled={!isConnected}
          >
            {isRecording ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isRecording ? 'Остановить' : 'Записать'}
          </Button>
          
          {performanceHistory.length > 0 && (
            <Button variant="outline" onClick={clearHistory}>
              Очистить историю
            </Button>
          )}
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего задач</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalTasks)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} выполнено, {stats.failedTasks} ошибок
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Среднее время ответа</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(stats.averageResponseTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              Время обработки задач
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Пропускная способность</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.clusterThroughput.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Эффективность кластера
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Онлайн устройств</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.onlineDevices}/{stats.totalDevices}
            </div>
            <p className="text-xs text-muted-foreground">
              Активные устройства
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Устройства */}
      <Card>
        <CardHeader>
          <CardTitle>Устройства кластера</CardTitle>
          <CardDescription>
            Статус и производительность Android устройств
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <div key={device.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getDeviceStatusIcon(device.status)}
                    <span className="font-medium">{device.name}</span>
                  </div>
                  <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                    {device.status}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Загрузка:</span>
                    <span className="font-mono">{device.currentLoad}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Выполнено:</span>
                    <span className="font-mono">{device.completedTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ошибок:</span>
                    <span className="font-mono">{device.failedTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Время ответа:</span>
                    <span className="font-mono">{formatTime(device.averageResponseTime)}</span>
                  </div>
                  
                  {/* Системная информация */}
                  {device.systemInfo && (
                    <>
                      <div className="border-t pt-2 mt-2">
                        <div className="text-xs text-muted-foreground mb-1">Система:</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Память:</span>
                            <span className="font-mono">{device.systemInfo.memory.heapUsed}MB</span>
                          </div>
                          <div className="flex justify-between">
                            <span>CPU:</span>
                            <span className="font-mono">{device.systemInfo.cpu.loadAverage[0].toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Uptime:</span>
                            <span className="font-mono">{Math.round(device.systemInfo.platform.uptime / 3600)}ч</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Тесты нагрузки */}
      <Card>
        <CardHeader>
          <CardTitle>Тесты нагрузки</CardTitle>
          <CardDescription>
            Запуск тестовых задач для проверки производительности
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Математические операции */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Математические</span>
              </h4>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => runLoadTest('factorial', 20, 10)}
                  disabled={isLoading || !isConnected}
                  className="w-full justify-start"
                >
                  Факториал (10 задач)
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => runLoadTest('primeNumbers', 1000, 15)}
                  disabled={isLoading || !isConnected}
                  className="w-full justify-start"
                >
                  Простые числа (15 задач)
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => runLoadTest('fibonacci', 40, 20)}
                  disabled={isLoading || !isConnected}
                  className="w-full justify-start"
                >
                  Фибоначчи (20 задач)
                </Button>
              </div>
            </div>

            {/* Android-специфичные операции */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center space-x-2">
                <Smartphone className="w-4 h-4" />
                <span>Android операции</span>
              </h4>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => runLoadTest('imageProcessing', 512, 8)}
                  disabled={isLoading || !isConnected}
                  className="w-full justify-start"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Обработка изображений (8 задач)
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => runLoadTest('dataCompression', 1024, 12)}
                  disabled={isLoading || !isConnected}
                  className="w-full justify-start"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Сжатие данных (12 задач)
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => runLoadTest('encryption', 256, 10)}
                  disabled={isLoading || !isConnected}
                  className="w-full justify-start"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Шифрование (10 задач)
                </Button>
              </div>
            </div>

            {/* Сетевые и файловые операции */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center space-x-2">
                <Network className="w-4 h-4" />
                <span>Сеть и файлы</span>
              </h4>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => runLoadTest('networkSimulation', 100, 15)}
                  disabled={isLoading || !isConnected}
                  className="w-full justify-start"
                >
                  <Wifi className="w-4 h-4 mr-2" />
                  Сетевые операции (15 задач)
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => runLoadTest('fileOperations', 50, 20)}
                  disabled={isLoading || !isConnected}
                  className="w-full justify-start"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Файловые операции (20 задач)
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => runLoadTest('arraySort', 10000, 25)}
                  disabled={isLoading || !isConnected}
                  className="w-full justify-start"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Сортировка массивов (25 задач)
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* История метрик */}
      {performanceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>История метрик</CardTitle>
            <CardDescription>
              Записанные метрики производительности
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {performanceHistory.slice().reverse().map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                    <span className="text-muted-foreground">
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span>Задач: {record.totalTasks}</span>
                      <span>Выполнено: {record.completedTasks}</span>
                      <span>Ошибок: {record.failedTasks}</span>
                      <span>Время: {formatTime(record.averageResponseTime)}</span>
                      <span>Пропуск: {record.clusterThroughput.toFixed(1)}%</span>
                      <span>Устройств: {record.onlineDevices}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Статус подключения */}
      {!isConnected && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Нет подключения к кластеру. Проверьте, запущен ли backend сервер.</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Performance
