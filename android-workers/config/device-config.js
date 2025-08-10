// Конфигурация для Android устройств
module.exports = {
  // Samsung Note 4
  'samsung-note4': {
    name: 'Samsung Note 4',
    port: 3001,
    maxConcurrentTasks: 3,
    capabilities: {
      factorial: { maxInput: 1000 },
      primeNumbers: { maxInput: 10000 },
      arraySort: { maxSize: 50000 },
      hash: { maxInputLength: 10000 },
      fibonacci: { maxInput: 100 }
    },
    performance: {
      expectedResponseTime: 100, // ms
      memoryLimit: 512 * 1024 * 1024 // 512MB
    }
  },

  // Samsung Google Nexus
  'samsung-nexus': {
    name: 'Samsung Google Nexus',
    port: 3002,
    maxConcurrentTasks: 4,
    capabilities: {
      factorial: { maxInput: 800 },
      primeNumbers: { maxInput: 8000 },
      arraySort: { maxSize: 40000 },
      hash: { maxInputLength: 8000 },
      fibonacci: { maxInput: 80 }
    },
    performance: {
      expectedResponseTime: 80, // ms
      memoryLimit: 256 * 1024 * 1024 // 256MB
    }
  },

  // Alcatel One Touch 7043
  'alcatel-7043': {
    name: 'Alcatel One Touch 7043',
    port: 3003,
    maxConcurrentTasks: 2,
    capabilities: {
      factorial: { maxInput: 500 },
      primeNumbers: { maxInput: 5000 },
      arraySort: { maxSize: 25000 },
      hash: { maxInputLength: 5000 },
      fibonacci: { maxInput: 50 }
    },
    performance: {
      expectedResponseTime: 150, // ms
      memoryLimit: 128 * 1024 * 1024 // 128MB
    }
  },

  // Общие настройки
  common: {
    heartbeatInterval: 5000, // ms
    taskTimeout: 30000, // ms
    maxRetries: 3,
    logLevel: 'info',
    enableCompression: true,
    enableCaching: false, // Не кэшируем результаты
    security: {
      enableRateLimit: true,
      maxRequestsPerMinute: 100,
      enableCORS: true
    }
  }
};
