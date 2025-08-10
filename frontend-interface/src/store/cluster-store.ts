import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { toast } from 'sonner'
import { io, Socket } from 'socket.io-client'
import type { 
  Device, 
  Task, 
  ClusterState, 
  ClusterStats, 
  TaskFormData, 
  BulkTaskFormData,
  PerformanceMetrics,
  SystemInfo
} from '@/types'

interface ClusterStore {
  // Состояние
  devices: Device[]
  tasks: Task[]
  performanceMetrics: PerformanceMetrics
  isConnected: boolean
  isLoading: boolean
  error: string | null
  
  // Статистика
  stats: ClusterStats
  
  // Socket
  socket: Socket | null
  
  // Действия
  connect: () => void
  disconnect: () => void
  addTask: (taskData: TaskFormData) => Promise<void>
  addBulkTasks: (bulkData: BulkTaskFormData) => Promise<void>
  updateDeviceStatus: (deviceId: string, status: Device['status']) => void
  clearCompletedTasks: () => void
  retryFailedTask: (taskId: string) => Promise<void>
  
  // Внутренние методы
  _setDevices: (devices: Device[]) => void
  _setTasks: (tasks: Task[]) => void
  _setPerformanceMetrics: (metrics: PerformanceMetrics) => void
  _setConnectionStatus: (status: boolean) => void
  _setLoading: (loading: boolean) => void
  _setError: (error: string | null) => void
  _updateStats: (data: ClusterState) => void
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const useClusterStore = create<ClusterStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Начальное состояние
        devices: [],
        tasks: [],
        performanceMetrics: {
          totalTasks: 0,
          completedTasks: 0,
          failedTasks: 0,
          averageResponseTime: 0,
          clusterThroughput: 0,
          deviceLoads: new Map(),
          networkStats: {
            requests: 0,
            bytesReceived: 0,
            bytesSent: 0
          }
        },
        isConnected: false,
        isLoading: false,
        error: null,
        stats: {
          totalDevices: 0,
          onlineDevices: 0,
          totalTasks: 0,
          completedTasks: 0,
          failedTasks: 0,
          averageResponseTime: 0,
          clusterThroughput: 0,
          queueLength: 0,
          activeTasksCount: 0
        },
        socket: null,

        // Подключение к серверу
        connect: () => {
          const { socket } = get()
          if (socket?.connected) return

          const newSocket = io(API_BASE_URL, {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
          })

          newSocket.on('connect', () => {
            set({ isConnected: true, error: null })
            toast.success('Подключен к Android кластеру')
          })

          newSocket.on('disconnect', () => {
            set({ isConnected: false })
            toast.error('Отключен от кластера')
          })

          newSocket.on('clusterUpdate', (data: ClusterState) => {
            get()._setDevices(data.devices)
            get()._setTasks([...data.activeTasks, ...data.completedTasks])
            get()._setPerformanceMetrics(data.performanceMetrics)
            get()._updateStats(data)
          })

          newSocket.on('connect_error', (error) => {
            set({ error: error.message, isConnected: false })
            toast.error(`Ошибка подключения: ${error.message}`)
          })

          set({ socket: newSocket })
        },

        // Отключение от сервера
        disconnect: () => {
          const { socket } = get()
          if (socket) {
            socket.disconnect()
            set({ socket: null, isConnected: false })
          }
        },

        // Добавление задачи
        addTask: async (taskData: TaskFormData) => {
          try {
            set({ isLoading: true, error: null })
            
            const response = await fetch(`${API_BASE_URL}/api/cluster/task`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(taskData)
            })

            if (!response.ok) {
              throw new Error('Ошибка добавления задачи')
            }

            const result = await response.json()
            
            if (result.success) {
              toast.success('Задача добавлена в очередь')
            } else {
              throw new Error(result.error || 'Неизвестная ошибка')
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
            set({ error: message })
            toast.error(`Ошибка: ${message}`)
          } finally {
            set({ isLoading: false })
          }
        },

        // Добавление массовых задач
        addBulkTasks: async (bulkData: BulkTaskFormData) => {
          try {
            set({ isLoading: true, error: null })
            
            const response = await fetch(`${API_BASE_URL}/api/cluster/bulk-tasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(bulkData)
            })

            if (!response.ok) {
              throw new Error('Ошибка добавления задач')
            }

            const result = await response.json()
            
            if (result.success) {
              toast.success(`${result.addedTasks} задач добавлено в очередь`)
            } else {
              throw new Error(result.error || 'Неизвестная ошибка')
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
            set({ error: message })
            toast.error(`Ошибка: ${message}`)
          } finally {
            set({ isLoading: false })
          }
        },

        // Обновление статуса устройства
        updateDeviceStatus: (deviceId: string, status: Device['status']) => {
          set((state) => ({
            devices: state.devices.map(device =>
              device.id === deviceId ? { ...device, status } : device
            )
          }))
        },

        // Очистка выполненных задач
        clearCompletedTasks: () => {
          set((state) => ({
            tasks: state.tasks.filter(task => task.status !== 'completed')
          }))
          toast.success('Выполненные задачи очищены')
        },

        // Повторная попытка выполнения задачи
        retryFailedTask: async (taskId: string) => {
          const { tasks } = get()
          const failedTask = tasks.find(t => t.id === taskId && t.status === 'failed')
          
          if (!failedTask) {
            toast.error('Задача не найдена')
            return
          }

          try {
            await get().addTask({
              operation: failedTask.operation,
              params: failedTask.params as number,
              priority: failedTask.priority
            })
            
            // Удаляем неудачную задачу
            set((state) => ({
              tasks: state.tasks.filter(t => t.id !== taskId)
            }))
          } catch (error) {
            toast.error('Ошибка повторной попытки')
          }
        },

        // Внутренние методы
        _setDevices: (devices: Device[]) => set({ devices }),
        _setTasks: (tasks: Task[]) => set({ tasks }),
        _setPerformanceMetrics: (metrics: PerformanceMetrics) => set({ performanceMetrics: metrics }),
        _setConnectionStatus: (status: boolean) => set({ isConnected: status }),
        _setLoading: (loading: boolean) => set({ isLoading: loading }),
        _setError: (error: string | null) => set({ error }),

        // Обновление статистики
        _updateStats: (data: ClusterState) => {
          const onlineDevices = data.devices.filter(d => d.status === 'online').length
          const activeTasks = data.activeTasks.length
          const completedTasks = data.completedTasks.filter(t => t.status === 'completed').length
          const failedTasks = data.completedTasks.filter(t => t.status === 'failed').length

          set({
            stats: {
              totalDevices: data.devices.length,
              onlineDevices,
              totalTasks: data.performanceMetrics.totalTasks,
              completedTasks,
              failedTasks,
              averageResponseTime: data.performanceMetrics.averageResponseTime,
              clusterThroughput: data.performanceMetrics.clusterThroughput,
              queueLength: data.taskQueue,
              activeTasksCount: activeTasks
            }
          })
        }
      }),
      {
        name: 'android-cluster-store',
        partialize: (state) => ({
          // Сохраняем только настройки, не состояние кластера
        })
      }
    ),
    {
      name: 'android-cluster-store'
    }
  )
)
