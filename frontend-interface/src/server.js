const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Конфигурация кластера
const clusterConfig = {
  devices: [
    { id: 'samsung-note4', name: 'Samsung Note 4', port: 3001, host: '192.168.0.9' }
  ]
};

// Состояние кластера
let clusterState = {
  devices: [],
  taskQueue: [],
  activeTasks: [],
  completedTasks: [],
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
  }
};

// Очередь задач
class TaskQueue {
  constructor() {
    this.queue = [];
    this.processing = new Map();
    this.maxConcurrentTasks = 15; // Максимум 5 задач на устройство * 3 устройства
  }

  addTask(task) {
    const taskWithId = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'queued',
      createdAt: Date.now()
    };
    
    this.queue.push(taskWithId);
    clusterState.taskQueue = this.queue.length;
    
    // Пытаемся сразу выполнить задачу
    this.processNextTask();
    
    return taskWithId;
  }

  async processNextTask() {
    if (this.processing.size >= this.maxConcurrentTasks || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    clusterState.taskQueue = this.queue.length;
    
    // Находим доступное устройство
    const availableDevice = clusterState.devices.find(device => 
      device.status === 'online' && 
      !this.processing.has(device.id) &&
      device.currentLoad < (device.capabilities?.maxConcurrentTasks || 5)
    );

    if (!availableDevice) {
      // Возвращаем задачу в очередь
      this.queue.unshift(task);
      clusterState.taskQueue = this.queue.length;
      return;
    }

    // Помечаем устройство как занятое
    this.processing.set(availableDevice.id, task.id);
    
    // Обновляем статус задачи
    task.status = 'processing';
    task.assignedTo = availableDevice.id;
    task.startedAt = Date.now();
    
    clusterState.activeTasks.push(task);
    
    try {
      // Отправляем задачу на устройство
      const response = await axios.post(`http://${availableDevice.host}:${availableDevice.port}/api/task`, {
        operation: task.operation,
        params: task.params,
        taskId: task.id
      }, {
        timeout: 30000
      });

      if (response.data.success) {
        // Задача выполнена успешно
        task.status = 'completed';
        task.result = response.data.result;
        task.processingTime = response.data.processingTime;
        task.completedAt = Date.now();
        
        // Обновляем статистику
        clusterState.performanceMetrics.completedTasks++;
        clusterState.performanceMetrics.totalTasks++;
        
        // Обновляем метрики устройства
        const device = clusterState.devices.find(d => d.id === availableDevice.id);
        if (device) {
          device.completedTasks++;
          device.currentLoad = Math.max(0, device.currentLoad - 1);
          device.averageResponseTime = 
            (device.averageResponseTime + response.data.processingTime) / 2;
          
          // Обновляем системную информацию если доступна
          if (response.data.systemInfo) {
            device.systemInfo = response.data.systemInfo;
          }
        }
        
        clusterState.completedTasks.push(task);
        
        // Обновляем сетевую статистику
        if (response.data.systemInfo) {
          clusterState.performanceMetrics.networkStats.requests++;
          clusterState.performanceMetrics.networkStats.bytesReceived += 
            JSON.stringify({ operation: task.operation, params: task.params }).length;
          clusterState.performanceMetrics.networkStats.bytesSent += 
            JSON.stringify(response.data.result).length;
        }
        
      } else {
        throw new Error(response.data.error || 'Ошибка выполнения задачи');
      }
      
    } catch (error) {
      // Задача завершилась с ошибкой
      task.status = 'failed';
      task.error = error.message;
      task.completedAt = Date.now();
      
      // Обновляем статистику
      clusterState.performanceMetrics.failedTasks++;
      clusterState.performanceMetrics.totalTasks++;
      
      // Обновляем метрики устройства
      const device = clusterState.devices.find(d => d.id === availableDevice.id);
      if (device) {
        device.failedTasks++;
        device.currentLoad = Math.max(0, device.currentLoad - 1);
      }
      
      clusterState.completedTasks.push(task);
    }

    // Убираем задачу из активных
    clusterState.activeTasks = clusterState.activeTasks.filter(t => t.id !== task.id);
    
    // Освобождаем устройство
    this.processing.delete(availableDevice.id);
    
    // Обновляем общую статистику
    this.updatePerformanceMetrics();
    
    // Уведомляем клиентов об обновлении
    io.emit('clusterUpdate', clusterState);
    
    // Пытаемся обработать следующую задачу
    setTimeout(() => this.processNextTask(), 100);
  }

  updatePerformanceMetrics() {
    const totalTasks = clusterState.performanceMetrics.completedTasks + 
                      clusterState.performanceMetrics.failedTasks;
    
    if (totalTasks > 0) {
      const avgResponseTime = clusterState.completedTasks
        .filter(t => t.processingTime)
        .reduce((sum, t) => sum + t.processingTime, 0) / 
        clusterState.completedTasks.filter(t => t.processingTime).length;
      
      clusterState.performanceMetrics.averageResponseTime = avgResponseTime || 0;
      clusterState.performanceMetrics.clusterThroughput = 
        (clusterState.performanceMetrics.completedTasks / totalTasks) * 100;
    }
  }
}

const taskQueue = new TaskQueue();

// Мониторинг устройств
async function monitorDevices() {
  for (const deviceConfig of clusterConfig.devices) {
    try {
      const response = await axios.get(`http://${deviceConfig.host}:${deviceConfig.port}/api/device`, {
        timeout: 5000
      });
      
      const deviceData = response.data;
      
      // Обновляем или добавляем устройство
      const existingDeviceIndex = clusterState.devices.findIndex(d => d.id === deviceConfig.id);
      
      if (existingDeviceIndex >= 0) {
        clusterState.devices[existingDeviceIndex] = {
          ...clusterState.devices[existingDeviceIndex],
          ...deviceData,
          status: 'online',
          lastSeen: Date.now()
        };
      } else {
        clusterState.devices.push({
          ...deviceData,
          status: 'online',
          lastSeen: Date.now()
        });
      }
      
    } catch (error) {
      // Устройство недоступно
      const existingDeviceIndex = clusterState.devices.findIndex(d => d.id === deviceConfig.id);
      
      if (existingDeviceIndex >= 0) {
        clusterState.devices[existingDeviceIndex].status = 'offline';
        clusterState.devices[existingDeviceIndex].lastSeen = Date.now();
      }
    }
  }
  
  // Уведомляем клиентов об обновлении
  io.emit('clusterUpdate', clusterState);
}

// Запускаем мониторинг каждые 10 секунд
setInterval(monitorDevices, 10000);

// API endpoints
app.get('/api/cluster/stats', (req, res) => {
  const onlineDevices = clusterState.devices.filter(d => d.status === 'online').length;
  const activeTasks = clusterState.activeTasks.length;
  
  res.json({
    totalDevices: clusterState.devices.length,
    onlineDevices,
    totalTasks: clusterState.performanceMetrics.totalTasks,
    completedTasks: clusterState.performanceMetrics.completedTasks,
    failedTasks: clusterState.performanceMetrics.failedTasks,
    averageResponseTime: clusterState.performanceMetrics.averageResponseTime,
    clusterThroughput: clusterState.performanceMetrics.clusterThroughput,
    queueLength: clusterState.taskQueue,
    activeTasksCount: activeTasks
  });
});

app.get('/api/cluster/devices', (req, res) => {
  res.json(clusterState.devices);
});

app.get('/api/cluster/tasks', (req, res) => {
  res.json({
    queued: clusterState.taskQueue,
    active: clusterState.activeTasks,
    completed: clusterState.completedTasks
  });
});

app.post('/api/cluster/task', async (req, res) => {
  const { operation, params, priority = 'normal' } = req.body;
  
  if (!operation || !params) {
    return res.status(400).json({
      success: false,
      error: 'Необходимы operation и params'
    });
  }
  
  const task = taskQueue.addTask({
    operation,
    params,
    priority
  });
  
  res.json({
    success: true,
    taskId: task.id,
    message: 'Задача добавлена в очередь'
  });
});

app.post('/api/cluster/bulk-tasks', async (req, res) => {
  const { operation, params, count, priority = 'normal' } = req.body;
  
  if (!operation || !params || !count) {
    return res.status(400).json({
      success: false,
      error: 'Необходимы operation, params и count'
    });
  }
  
  const taskIds = [];
  
  for (let i = 0; i < count; i++) {
    const task = taskQueue.addTask({
      operation,
      params,
      priority
    });
    taskIds.push(task.id);
  }
  
  res.json({
    success: true,
    addedTasks: count,
    taskIds,
    message: `${count} задач добавлено в очередь`
  });
});

// WebSocket обработчики
io.on('connection', (socket) => {
  console.log('Клиент подключен:', socket.id);
  
  // Отправляем текущее состояние кластера
  socket.emit('clusterUpdate', clusterState);
  
  socket.on('disconnect', () => {
    console.log('Клиент отключен:', socket.id);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    devices: clusterState.devices.length,
    onlineDevices: clusterState.devices.filter(d => d.status === 'online').length
  });
});

// Запуск сервера
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Android Cluster API сервер запущен на порту ${PORT}`);
  console.log(`🌐 Доступен по адресу: http://0.0.0.0:${PORT}`);
  console.log(`📊 Статистика: http://0.0.0.0:${PORT}/api/cluster/stats`);
  console.log(`🔌 WebSocket: ws://0.0.0.0:${PORT}`);
  
  // Запускаем первичный мониторинг устройств
  monitorDevices();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Получен SIGTERM, завершаем работу...');
  server.close(() => {
    console.log('Сервер остановлен');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Получен SIGINT, завершаем работу...');
  server.close(() => {
    console.log('Сервер остановлен');
    process.exit(0);
  });
});
