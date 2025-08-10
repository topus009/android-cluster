#!/usr/bin/env node

const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { performance } = require('perf_hooks');
const path = require('path');

// Загружаем конфигурацию устройства
const deviceConfig = require('./config/device-config');

// Получаем ID устройства из аргументов командной строки или переменных окружения
const deviceId = process.argv[2] || process.env.DEVICE_ID || 'samsung-note4';

// Проверяем, есть ли конфигурация для данного устройства
if (!deviceConfig[deviceId] && deviceId !== 'common') {
  console.error(`❌ Ошибка: Устройство '${deviceId}' не найдено в конфигурации`);
  console.log('Доступные устройства:');
  Object.keys(deviceConfig).filter(key => key !== 'common').forEach(key => {
    console.log(`  • ${key}: ${deviceConfig[key].name}`);
  });
  process.exit(1);
}

const device = deviceConfig[deviceId];
const PORT = process.env.PORT || device.port || 3000;

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Отключаем для WebSocket
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json());

// Информация об устройстве
const deviceInfo = {
  id: deviceId,
  name: device.name || 'Android Device',
  platform: 'Android',
  nodeVersion: process.version,
  startTime: new Date().toISOString(),
  capabilities: device?.capabilities || {
    maxConcurrentTasks: 5,
    supportedOperations: ['factorial', 'primeNumbers', 'arraySort', 'hash', 'fibonacci']
  },
  performance: device?.performance || {
    expectedResponseTime: 100,
    memoryLimit: 256 * 1024 * 1024
  }
};

// Статистика производительности
let performanceStats = {
  totalTasks: 0,
  completedTasks: 0,
  failedTasks: 0,
  averageResponseTime: 0,
  totalProcessingTime: 0,
  memoryUsage: [],
  operationStats: {
    factorial: { count: 0, totalTime: 0, averageTime: 0 },
    primeNumbers: { count: 0, totalTime: 0, averageTime: 0 },
    arraySort: { count: 0, totalTime: 0, averageTime: 0 },
    hash: { count: 0, totalTime: 0, averageTime: 0 },
    fibonacci: { count: 0, totalTime: 0, averageTime: 0 }
  }
};

// Математические операции с оптимизацией
const mathOperations = {
  // Вычисление факториала с проверкой лимитов
  factorial: (n) => {
    if (n <= 1) return 1;
    if (n > device.capabilities?.factorial?.maxInput || 1000) {
      throw new Error(`Факториал ${n} превышает лимит устройства (${device.capabilities?.factorial?.maxInput || 1000})`);
    }
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
      // Проверяем переполнение
      if (!isFinite(result)) {
        throw new Error(`Переполнение при вычислении факториала ${n}`);
      }
    }
    return result;
  },

  // Поиск простых чисел до N с оптимизацией
  primeNumbers: (n) => {
    if (n > device.capabilities?.primeNumbers?.maxInput || 10000) {
      throw new Error(`Поиск простых чисел до ${n} превышает лимит устройства (${device.capabilities?.primeNumbers?.maxInput || 10000})`);
    }
    
    const primes = [];
    const isPrime = new Array(n + 1).fill(true);
    isPrime[0] = isPrime[1] = false;
    
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (isPrime[i]) {
        for (let j = i * i; j <= n; j += i) {
          isPrime[j] = false;
        }
      }
    }
    
    for (let i = 2; i <= n; i++) {
      if (isPrime[i]) primes.push(i);
    }
    
    return primes.length; // Возвращаем только количество
  },

  // Сортировка массива с проверкой размера
  arraySort: (size) => {
    if (size > device.capabilities?.arraySort?.maxSize || 50000) {
      throw new Error(`Размер массива ${size} превышает лимит устройства (${device.capabilities?.arraySort?.maxSize || 50000})`);
    }
    
    const arr = Array.from({ length: size }, () => Math.floor(Math.random() * 1000));
    
    // Используем быструю сортировку для больших массивов
    if (size > 1000) {
      arr.sort((a, b) => a - b);
    } else {
      // Простая сортировка для маленьких массивов
      for (let i = 0; i < size - 1; i++) {
        for (let j = 0; j < size - i - 1; j++) {
          if (arr[j] > arr[j + 1]) {
            [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          }
        }
      }
    }
    
    return arr.length; // Возвращаем только размер
  },

  // Хеширование с проверкой длины
  hash: (input) => {
    const str = input.toString();
    if (str.length > device.capabilities?.hash?.maxInputLength || 10000) {
      throw new Error(`Длина входных данных ${str.length} превышает лимит устройства (${device.capabilities?.hash?.maxInputLength || 10000})`);
    }
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Преобразование в 32-битное целое
    }
    return Math.abs(hash);
  },

  // Числа Фибоначчи с проверкой лимитов
  fibonacci: (n) => {
    if (n > device.capabilities?.fibonacci?.maxInput || 100) {
      throw new Error(`Число Фибоначчи ${n} превышает лимит устройства (${device.capabilities?.fibonacci?.maxInput || 100})`);
    }
    
    if (n <= 1) return n;
    
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
      // Проверяем переполнение
      if (!isFinite(b)) {
        throw new Error(`Переполнение при вычислении числа Фибоначчи ${n}`);
      }
    }
    return b;
  }
};

// Обработка задач с улучшенной статистикой
app.post('/api/task', async (req, res) => {
  const { operation, params, taskId } = req.body;
  
  if (!operation || !mathOperations[operation]) {
    return res.status(400).json({ 
      error: 'Неизвестная операция',
      supported: Object.keys(mathOperations),
      deviceCapabilities: device.capabilities
    });
  }

  const startTime = performance.now();
  performanceStats.totalTasks++;

  try {
    // Проверяем лимиты устройства
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > device.performance.memoryLimit) {
      throw new Error('Превышен лимит памяти устройства');
    }

    // Выполняем операцию
    const result = mathOperations[operation](params);
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    // Обновляем статистику
    performanceStats.completedTasks++;
    performanceStats.totalProcessingTime += processingTime;
    performanceStats.averageResponseTime = 
      performanceStats.totalProcessingTime / performanceStats.completedTasks;
    
    // Обновляем статистику по операциям
    if (performanceStats.operationStats[operation]) {
      const opStats = performanceStats.operationStats[operation];
      opStats.count++;
      opStats.totalTime += processingTime;
      opStats.averageTime = opStats.totalTime / opStats.count;
    }
    
    // Записываем использование памяти
    performanceStats.memoryUsage.push({
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal
    });

    // Ограничиваем историю памяти
    if (performanceStats.memoryUsage.length > 100) {
      performanceStats.memoryUsage = performanceStats.memoryUsage.slice(-100);
    }

    res.json({
      success: true,
      taskId,
      result,
      processingTime: Math.round(processingTime * 1000) / 1000,
      deviceId: deviceInfo.id,
      deviceName: deviceInfo.name,
      operation,
      timestamp: new Date().toISOString(),
      memoryUsage: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100
      }
    });

  } catch (error) {
    performanceStats.failedTasks++;
    
    res.status(500).json({
      success: false,
      error: error.message,
      taskId,
      deviceId: deviceInfo.id,
      deviceName: deviceInfo.name,
      operation,
      timestamp: new Date().toISOString()
    });
  }
});

// Получение информации об устройстве
app.get('/api/device', (req, res) => {
  res.json({
    ...deviceInfo,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    performanceStats,
    config: {
      capabilities: device.capabilities,
      performance: device.performance
    }
  });
});

// Получение статистики производительности
app.get('/api/stats', (req, res) => {
  res.json({
    deviceId: deviceInfo.id,
    deviceName: deviceInfo.name,
    ...performanceStats,
    currentMemory: process.memoryUsage(),
    config: {
      capabilities: device.capabilities,
      performance: device.performance
    }
  });
});

// Получение статистики по операциям
app.get('/api/stats/operations', (req, res) => {
  res.json({
    deviceId: deviceInfo.id,
    deviceName: deviceInfo.name,
    operationStats: performanceStats.operationStats,
    totalStats: {
      totalTasks: performanceStats.totalTasks,
      completedTasks: performanceStats.completedTasks,
      failedTasks: performanceStats.failedTasks,
      averageResponseTime: performanceStats.averageResponseTime
    }
  });
});

// Health check с детальной информацией
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage();
  const isHealthy = memUsage.heapUsed < device.performance.memoryLimit;
  
  res.json({ 
    status: isHealthy ? 'healthy' : 'warning',
    deviceId: deviceInfo.id,
    deviceName: deviceInfo.name,
    uptime: process.uptime(),
    memoryUsage: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
      limit: Math.round(device.performance.memoryLimit / 1024 / 1024 * 100) / 100
    },
    performance: {
      totalTasks: performanceStats.totalTasks,
      averageResponseTime: Math.round(performanceStats.averageResponseTime * 1000) / 1000
    }
  });
});

// WebSocket для real-time обновлений
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket клиент подключен');
  
  // Отправляем информацию об устройстве
  ws.send(JSON.stringify({
    type: 'deviceInfo',
    data: deviceInfo
  }));

  // Отправляем текущую статистику
  ws.send(JSON.stringify({
    type: 'stats',
    data: performanceStats
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ 
          type: 'pong', 
          timestamp: Date.now(),
          deviceId: deviceInfo.id
        }));
      } else if (data.type === 'getStats') {
        ws.send(JSON.stringify({
          type: 'stats',
          data: performanceStats
        }));
      }
    } catch (error) {
      console.error('❌ Ошибка WebSocket:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket клиент отключен');
  });
});

// Запуск сервера
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Android Worker сервер запущен на порту ${PORT}`);
  console.log(`📱 ID устройства: ${deviceInfo.id}`);
  console.log(`📱 Имя устройства: ${deviceInfo.name}`);
  console.log(`🌐 Доступен по адресу: http://0.0.0.0:${PORT}`);
  console.log(`📊 Статистика: http://0.0.0.0:${PORT}/api/stats`);
  console.log(`💚 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔌 WebSocket: ws://0.0.0.0:${PORT}`);
  console.log(`⚡ Максимум задач: ${device.capabilities.maxConcurrentTasks || 5}`);
  console.log(`💾 Лимит памяти: ${Math.round(device.performance.memoryLimit / 1024 / 1024)}MB`);
});

// Подключаем WebSocket к HTTP серверу
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Периодическая отправка статистики через WebSocket
setInterval(() => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'stats',
        data: performanceStats
      }));
    }
  });
}, 5000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Получен SIGTERM, завершаем работу...');
  server.close(() => {
    console.log('✅ Сервер остановлен');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 Получен SIGINT, завершаем работу...');
  server.close(() => {
    console.log('✅ Сервер остановлен');
    process.exit(0);
  });
});

// Обработка необработанных ошибок
process.on('uncaughtException', (error) => {
  console.error('❌ Необработанная ошибка:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Необработанное отклонение промиса:', reason);
  process.exit(1);
});
