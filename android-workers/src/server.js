const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { performance } = require('perf_hooks');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Информация об устройстве
const deviceInfo = {
  id: process.env.DEVICE_ID || `android-${Math.random().toString(36).substr(2, 9)}`,
  name: process.env.DEVICE_NAME || 'Android Device',
  platform: 'Android',
  nodeVersion: process.version,
  startTime: new Date().toISOString(),
  capabilities: {
    maxConcurrentTasks: 5,
    supportedOperations: ['factorial', 'primeNumbers', 'arraySort', 'hash', 'fibonacci', 'imageProcessing', 'dataCompression', 'encryption', 'networkSimulation', 'fileOperations']
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
  cpuUsage: [],
  networkStats: {
    requests: 0,
    bytesReceived: 0,
    bytesSent: 0
  }
};

// Android-специфичные операции
const androidOperations = {
  // Математические операции
  factorial: (n) => {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  },

  primeNumbers: (n) => {
    const primes = [];
    for (let i = 2; i <= n; i++) {
      let isPrime = true;
      for (let j = 2; j <= Math.sqrt(i); j++) {
        if (i % j === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) primes.push(i);
    }
    return primes.length;
  },

  arraySort: (size) => {
    const arr = Array.from({ length: size }, () => Math.floor(Math.random() * 1000));
    return arr.sort((a, b) => a - b).length;
  },

  hash: (input) => {
    let hash = 0;
    const str = input.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  },

  fibonacci: (n) => {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  },

  // Android-специфичные операции
  imageProcessing: (size) => {
    // Симуляция обработки изображения
    const pixels = size * size;
    let processedPixels = 0;
    
    for (let i = 0; i < pixels; i++) {
      // Симуляция обработки пикселя
      processedPixels += Math.random() > 0.5 ? 1 : 0;
    }
    
    return {
      processedPixels,
      totalPixels: pixels,
      compressionRatio: (processedPixels / pixels * 100).toFixed(2)
    };
  },

  dataCompression: (dataSize) => {
    // Симуляция сжатия данных
    const originalSize = dataSize * 1024; // KB to bytes
    const compressedSize = originalSize * (0.3 + Math.random() * 0.4); // 30-70% от оригинала
    
    return {
      originalSize: (originalSize / 1024).toFixed(2),
      compressedSize: (compressedSize / 1024).toFixed(2),
      compressionRatio: ((1 - compressedSize / originalSize) * 100).toFixed(2)
    };
  },

  encryption: (dataSize) => {
    // Симуляция шифрования данных
    const startTime = performance.now();
    const iterations = dataSize * 100;
    
    for (let i = 0; i < iterations; i++) {
      // Симуляция шифрования
      Math.random() * Math.random();
    }
    
    const endTime = performance.now();
    
    return {
      dataSize: `${dataSize}KB`,
      encryptionTime: (endTime - startTime).toFixed(2),
      algorithm: 'AES-256',
      keyStrength: '256-bit'
    };
  },

  networkSimulation: (packets) => {
    // Симуляция сетевых операций
    let successfulPackets = 0;
    let failedPackets = 0;
    let totalLatency = 0;
    
    for (let i = 0; i < packets; i++) {
      const latency = Math.random() * 100 + 10; // 10-110ms
      totalLatency += latency;
      
      if (Math.random() > 0.1) { // 90% успешных пакетов
        successfulPackets++;
      } else {
        failedPackets++;
      }
    }
    
    return {
      totalPackets: packets,
      successfulPackets,
      failedPackets,
      successRate: ((successfulPackets / packets) * 100).toFixed(2),
      averageLatency: (totalLatency / packets).toFixed(2)
    };
  },

  fileOperations: (fileCount) => {
    // Симуляция файловых операций
    let readOperations = 0;
    let writeOperations = 0;
    let totalSize = 0;
    
    for (let i = 0; i < fileCount; i++) {
      const fileSize = Math.floor(Math.random() * 1024) + 1; // 1-1024KB
      totalSize += fileSize;
      
      if (Math.random() > 0.5) {
        readOperations++;
      } else {
        writeOperations++;
      }
    }
    
    return {
      totalFiles: fileCount,
      readOperations,
      writeOperations,
      totalSize: `${(totalSize / 1024).toFixed(2)}MB`,
      averageFileSize: `${(totalSize / fileCount / 1024).toFixed(2)}KB`
    };
  }
};

// Получение системной информации
function getSystemInfo() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    memory: {
      rss: (memUsage.rss / 1024 / 1024).toFixed(2), // MB
      heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2), // MB
      heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2), // MB
      external: (memUsage.external / 1024 / 1024).toFixed(2) // MB
    },
    cpu: {
      user: (cpuUsage.user / 1000).toFixed(2), // ms
      system: (cpuUsage.system / 1000).toFixed(2), // ms
      loadAverage: os.loadavg()
    },
    platform: {
      arch: os.arch(),
      platform: os.platform(),
      uptime: os.uptime(),
      totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2), // GB
      freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) // GB
    }
  };
}

// Обработка задач
app.post('/api/task', async (req, res) => {
  const { operation, params, taskId } = req.body;
  
  if (!operation || !androidOperations[operation]) {
    return res.status(400).json({ 
      error: 'Неизвестная операция',
      supported: Object.keys(androidOperations)
    });
  }

  const startTime = performance.now();
  performanceStats.totalTasks++;

  try {
    // Выполняем операцию
    const result = androidOperations[operation](params);
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    // Обновляем статистику
    performanceStats.completedTasks++;
    performanceStats.totalProcessingTime += processingTime;
    performanceStats.averageResponseTime = 
      performanceStats.totalProcessingTime / performanceStats.completedTasks;
    
    // Записываем использование памяти и CPU
    const systemInfo = getSystemInfo();
    performanceStats.memoryUsage.push({
      timestamp: Date.now(),
      ...systemInfo.memory
    });

    performanceStats.cpuUsage.push({
      timestamp: Date.now(),
      ...systemInfo.cpu
    });

    // Ограничиваем историю
    if (performanceStats.memoryUsage.length > 100) {
      performanceStats.memoryUsage = performanceStats.memoryUsage.slice(-100);
    }
    if (performanceStats.cpuUsage.length > 100) {
      performanceStats.cpuUsage = performanceStats.cpuUsage.slice(-100);
    }

    // Обновляем сетевую статистику
    performanceStats.networkStats.requests++;
    performanceStats.networkStats.bytesReceived += JSON.stringify(req.body).length;
    performanceStats.networkStats.bytesSent += JSON.stringify(result).length;

    res.json({
      success: true,
      taskId,
      result,
      processingTime: Math.round(processingTime * 1000) / 1000,
      deviceId: deviceInfo.id,
      timestamp: new Date().toISOString(),
      systemInfo
    });

  } catch (error) {
    performanceStats.failedTasks++;
    res.status(500).json({
      success: false,
      error: error.message,
      taskId,
      deviceId: deviceInfo.id
    });
  }
});

// Получение информации об устройстве
app.get('/api/device', (req, res) => {
  const systemInfo = getSystemInfo();
  
  res.json({
    ...deviceInfo,
    uptime: process.uptime(),
    systemInfo,
    performanceStats: {
      ...performanceStats,
      currentSystemInfo: systemInfo
    }
  });
});

// Получение статистики производительности
app.get('/api/stats', (req, res) => {
  const systemInfo = getSystemInfo();
  
  res.json({
    deviceId: deviceInfo.id,
    ...performanceStats,
    currentSystemInfo: systemInfo
  });
});

// Получение детальной системной информации
app.get('/api/system', (req, res) => {
  res.json({
    deviceId: deviceInfo.id,
    timestamp: new Date().toISOString(),
    ...getSystemInfo(),
    performance: performanceStats
  });
});

// Health check с расширенной информацией
app.get('/health', (req, res) => {
  const systemInfo = getSystemInfo();
  const memUsage = process.memoryUsage();
  
  res.json({ 
    status: 'healthy', 
    deviceId: deviceInfo.id,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    system: {
      memory: {
        used: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
        total: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
        free: (os.freemem() / 1024 / 1024 / 1024).toFixed(2)
      },
      cpu: {
        load: os.loadavg(),
        cores: os.cpus().length
      }
    }
  });
});

// WebSocket для real-time обновлений
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  console.log('WebSocket клиент подключен');
  
  // Отправляем информацию об устройстве
  ws.send(JSON.stringify({
    type: 'deviceInfo',
    data: {
      ...deviceInfo,
      systemInfo: getSystemInfo()
    }
  }));

  // Отправляем обновления каждые 5 секунд
  const updateInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'systemUpdate',
        data: {
          timestamp: Date.now(),
          systemInfo: getSystemInfo(),
          performanceStats
        }
      }));
    }
  }, 5000);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ 
          type: 'pong', 
          timestamp: Date.now(),
          systemInfo: getSystemInfo()
        }));
      }
    } catch (error) {
      console.error('Ошибка WebSocket:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket клиент отключен');
    clearInterval(updateInterval);
  });
});

// Запуск сервера
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Android Worker сервер запущен на порту ${PORT}`);
  console.log(`📱 ID устройства: ${deviceInfo.id}`);
  console.log(`🌐 Доступен по адресу: http://0.0.0.0:${PORT}`);
  console.log(`📊 Статистика: http://0.0.0.0:${PORT}/api/stats`);
  console.log(`🔌 WebSocket: ws://0.0.0.0:${PORT}`);
  console.log(`💻 Поддерживаемые операции: ${deviceInfo.capabilities.supportedOperations.join(', ')}`);
});

// Подключаем WebSocket к HTTP серверу
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
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
