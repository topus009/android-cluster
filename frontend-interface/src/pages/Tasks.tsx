import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useClusterStore } from '@/store/cluster-store'
import { toast } from 'sonner'
import { 
  ListTodo, 
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Stop,
  RefreshCw,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react'

export default function Tasks() {
  const { tasks, addTask, addBulkTasks, clearCompletedTasks, retryFailedTask, isLoading } = useClusterStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [operationFilter, setOperationFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)

  // Форма добавления задачи
  const [taskForm, setTaskForm] = useState({
    operation: 'factorial' as const,
    params: '',
    priority: 'normal' as const
  })

  // Форма массового добавления
  const [bulkForm, setBulkForm] = useState({
    operation: 'factorial' as const,
    params: '',
    count: 1
  })

  const operations = [
    { value: 'factorial', label: 'Факториал', description: 'Вычисление факториала числа' },
    { value: 'primeNumbers', label: 'Простые числа', description: 'Поиск простых чисел до N' },
    { value: 'arraySort', label: 'Сортировка массива', description: 'Сортировка массива заданного размера' },
    { value: 'hash', label: 'Хеширование', description: 'Вычисление хеша строки' },
    { value: 'fibonacci', label: 'Числа Фибоначчи', description: 'N-е число Фибоначчи' }
  ]

  const priorities = [
    { value: 'low', label: 'Низкий', color: 'text-blue-600' },
    { value: 'normal', label: 'Обычный', color: 'text-green-600' },
    { value: 'high', label: 'Высокий', color: 'text-red-600' }
  ]

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-blue-600'
      case 'high': return 'text-red-600'
      default: return 'text-green-600'
    }
  }

  const filteredAndSortedTasks = tasks
    .filter(task => {
      const matchesSearch = task.operation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.params.toString().includes(searchTerm)
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesOperation = operationFilter === 'all' || task.operation === operationFilter
      return matchesSearch && matchesStatus && matchesOperation
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          return b.createdAt - a.createdAt
        case 'priority':
          const priorityOrder = { high: 3, normal: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case 'status':
          return a.status.localeCompare(b.status)
        case 'operation':
          return a.operation.localeCompare(b.operation)
        default:
          return 0
      }
    })

  const handleAddTask = async () => {
    if (!taskForm.params) {
      toast.error('Введите параметры для задачи')
      return
    }

    const params = parseFloat(taskForm.params)
    if (isNaN(params)) {
      toast.error('Параметры должны быть числом')
      return
    }

    try {
      await addTask({
        operation: taskForm.operation,
        params,
        priority: taskForm.priority
      })
      
      setTaskForm({ operation: 'factorial', params: '', priority: 'normal' })
      setShowAddForm(false)
      toast.success('Задача добавлена в очередь')
    } catch (error) {
      toast.error('Ошибка добавления задачи')
    }
  }

  const handleAddBulkTasks = async () => {
    if (!bulkForm.params || bulkForm.count < 1) {
      toast.error('Введите корректные параметры')
      return
    }

    const params = parseFloat(bulkForm.params)
    if (isNaN(params)) {
      toast.error('Параметры должны быть числом')
      return
    }

    try {
      await addBulkTasks({
        operation: bulkForm.operation,
        params,
        count: bulkForm.count
      })
      
      setBulkForm({ operation: 'factorial', params: '', count: 1 })
      setShowBulkForm(false)
      toast.success(`${bulkForm.count} задач добавлено в очередь`)
    } catch (error) {
      toast.error('Ошибка добавления задач')
    }
  }

  const handleRetryTask = async (taskId: string) => {
    try {
      await retryFailedTask(taskId)
      toast.success('Задача добавлена в очередь повторно')
    } catch (error) {
      toast.error('Ошибка повторной попытки')
    }
  }

  const handleClearCompleted = () => {
    clearCompletedTasks()
  }

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    processing: tasks.filter(t => t.status === 'processing').length,
    queued: tasks.filter(t => t.status === 'queued').length,
    failed: tasks.filter(t => t.status === 'failed').length
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Задачи</h1>
          <p className="text-muted-foreground">
            Управление задачами в Android кластере
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowBulkForm(!showBulkForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Массовое добавление
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить задачу
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего задач</CardTitle>
            <ListTodo className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выполнено</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выполняется</CardTitle>
            <Play className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В очереди</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.queued}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ошибки</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Форма добавления задачи */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Добавить задачу</CardTitle>
            <CardDescription>
              Создать новую задачу для выполнения в кластере
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Операция</label>
                <Select value={taskForm.operation} onValueChange={(value: any) => setTaskForm({ ...taskForm, operation: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operations.map(op => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Параметры</label>
                <Input
                  placeholder="Введите значение"
                  value={taskForm.params}
                  onChange={(e) => setTaskForm({ ...taskForm, params: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Приоритет</label>
                <Select value={taskForm.priority} onValueChange={(value: any) => setTaskForm({ ...taskForm, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(pri => (
                      <SelectItem key={pri.value} value={pri.value}>
                        <span className={pri.color}>{pri.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Отмена
              </Button>
              <Button onClick={handleAddTask}>
                Добавить задачу
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Форма массового добавления */}
      {showBulkForm && (
        <Card>
          <CardHeader>
            <CardTitle>Массовое добавление задач</CardTitle>
            <CardDescription>
              Добавить несколько одинаковых задач в очередь
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Операция</label>
                <Select value={bulkForm.operation} onValueChange={(value: any) => setBulkForm({ ...bulkForm, operation: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operations.map(op => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Параметры</label>
                <Input
                  placeholder="Введите значение"
                  value={bulkForm.params}
                  onChange={(e) => setBulkForm({ ...bulkForm, params: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Количество</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Количество задач"
                  value={bulkForm.count}
                  onChange={(e) => setBulkForm({ ...bulkForm, count: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBulkForm(false)}>
                Отмена
              </Button>
              <Button onClick={handleAddBulkTasks}>
                Добавить {bulkForm.count} задач
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Фильтры и поиск */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск задач..."
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
                <SelectItem value="queued">В очереди</SelectItem>
                <SelectItem value="processing">Выполняется</SelectItem>
                <SelectItem value="completed">Выполнено</SelectItem>
                <SelectItem value="failed">Ошибка</SelectItem>
              </SelectContent>
            </Select>
            <Select value={operationFilter} onValueChange={setOperationFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Операция" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все операции</SelectItem>
                {operations.map(op => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">По дате создания</SelectItem>
                <SelectItem value="priority">По приоритету</SelectItem>
                <SelectItem value="status">По статусу</SelectItem>
                <SelectItem value="operation">По операции</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Действия */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleClearCompleted}>
            <Trash2 className="h-4 w-4 mr-2" />
            Очистить выполненные
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Показано {filteredAndSortedTasks.length} из {tasks.length} задач
        </div>
      </div>

      {/* Список задач */}
      <div className="space-y-3">
        {filteredAndSortedTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getTaskStatusColor(task.status)}`} />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium capitalize">{task.operation}</span>
                      <Badge variant="outline" className="text-xs">
                        {getTaskStatusText(task.status)}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {priorities.find(p => p.value === task.priority)?.label}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Параметр: {task.params} • Создано: {new Date(task.createdAt).toLocaleString()}
                      {task.processingTime && ` • Время: ${Math.round(task.processingTime * 1000)}ms`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {task.status === 'failed' && (
                    <Button variant="outline" size="sm" onClick={() => handleRetryTask(task.id)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Повторить
                    </Button>
                  )}
                  {task.result !== undefined && (
                    <div className="text-sm text-muted-foreground">
                      Результат: {task.result}
                    </div>
                  )}
                  {task.error && (
                    <div className="text-sm text-red-600">
                      Ошибка: {task.error}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Пустое состояние */}
      {filteredAndSortedTasks.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <ListTodo className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Задачи не найдены</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || operationFilter !== 'all'
                ? 'Попробуйте изменить фильтры поиска'
                : 'Добавьте задачи для начала работы с кластером'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && operationFilter === 'all' && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить задачу
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
