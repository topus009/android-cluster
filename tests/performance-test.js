#!/usr/bin/env node

const axios = require('axios');
const { performance } = require('perf_hooks');

// Конфигурация тестирования
const testConfig = {
  cluster: {
    baseUrl: 'http://localhost:8080',
    endpoints: {
      stats: '/api/cluster/stats',
      devices: '/api/cluster/devices',
      task: '/api/cluster/task',
      bulkTasks: '/api/cluster/bulk-tasks'
    }
  },
  devices: [
    { id: 'samsung-note4', name: 'Samsung Note 4', host: '192.168.1.101', port: 3001 },
    { id: 'samsung-nexus', name: 'Samsung Google Nexus', host: '192.168.1.102', port: 3002 },
    { id: 'alcatel-7043', name: 'Alcatel One Touch 7043', host: '192.168.1.103', port: 3003 }
  ],
  testScenarios: [
    {
      name: 'Факториал (малые числа)',
      operation: 'factorial',
      params: [5, 10, 15, 20],
      count: 50,
      description: 'Тестирование вычисления факториала для малых чисел'
    },
    {
      name: 'Факториал (средние числа)',
      operation: 'factorial',
      params: [25, 30, 35, 40],
      count: 30,
      description: 'Тестирование вычисления факториала для средних чисел'
    },
    {
      name: 'Простые числа (малые диапазоны)',
      operation: 'primeNumbers',
      params: [100, 500, 1000, 2000],
      count: 40,
      description: 'Тестирование поиска простых чисел в малых диапазонах'
    },
    {
      name: 'Простые числа (средние диапазоны)',
      operation: 'primeNumbers',
      params: [3000, 5000, 7000, 9000],
      count: 25,
      description: 'Тестирование поиска простых чисел в средних диапазонах'
    },
    {
      name: 'Сортировка массивов (малые)',
      operation: 'arraySort',
      params: [100, 500, 1000, 2000],
      count: 60,
      description: 'Тестирование сортировки малых массивов'
    },
    {
      name: 'Сортировка массивов (средние)',
      operation: 'arraySort',
      params: [5000, 10000, 15000, 20000],
      count: 35,
      description: 'Тестирование сортировки средних массивов'
    },
    {
      name: 'Хеширование (короткие строки)',
      operation: 'hash',
      params: ['test', 'hello', 'world', 'android'],
      count: 80,
      description: 'Тестирование хеширования коротких строк'
    },
    {
      name: 'Хеширование (длинные строки)',
      operation: 'hash',
      params: ['very-long-string-for-testing-performance', 'another-long-string-with-more-content', 'third-long-string-to-test-hash-function'],
      count: 45,
      description: 'Тестирование хеширования длинных строк'
    },
    {
      name: 'Числа Фибоначчи (малые)',
      operation: 'fibonacci',
      params: [10, 20, 30, 40],
      count: 70,
      description: 'Тестирование вычисления чисел Фибоначчи для малых индексов'
    },
    {
      name: 'Числа Фибоначчи (средние)',
      operation: 'fibonacci',
      params: [50, 60, 70, 80],
      count: 20,
      description: 'Тестирование вычисления чисел Фибоначчи для средних индексов'
    }
  ]
};

// Класс для тестирования производительности
class PerformanceTester {
  constructor() {
    this.results = [];
    this.currentTest = null;
    this.startTime = null;
    this.testStats = {
      totalTests: 0,
      completedTests: 0,
      failedTests: 0,
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalProcessingTime: 0,
      averageResponseTime: 0
    };
  }

  // Проверка доступности кластера
  async checkClusterHealth() {
    console.log('🔍 Проверка доступности кластера...');
    
    try {
      const response = await axios.get(`${testConfig.cluster.baseUrl}${testConfig.cluster.endpoints.stats}`);
      
      if (response.status === 200) {
        const stats = response.data;
        console.log(`✅ Кластер доступен`);
        console.log(`   Устройств: ${stats.totalDevices}/${stats.onlineDevices}`);
        console.log(`   Всего задач: ${stats.totalTasks}`);
        console.log(`   Выполнено: ${stats.completedTasks}`);
        console.log(`   Ошибок: ${stats.failedTasks}`);
        return true;
      }
    } catch (error) {
      console.error('❌ Кластер недоступен:', error.message);
      return false;
    }
    
    return false;
  }

  // Проверка доступности устройств
  async checkDevicesHealth() {
    console.log('\n🔍 Проверка доступности устройств...');
    
    const deviceStatus = [];
    
    for (const device of testConfig.devices) {
      try {
        const response = await axios.get(`http://${device.host}:${device.port}/health`, {
          timeout: 5000
        });
        
        if (response.status === 200) {
          const health = response.data;
          deviceStatus.push({
            device: device.name,
            status: 'online',
            uptime: health.uptime,
            memory: health.memoryUsage
          });
          console.log(`✅ ${device.name}: ${health.status} (uptime: ${Math.round(health.uptime)}s)`);
        } else {
          deviceStatus.push({ device: device.name, status: 'error', error: 'HTTP Error' });
          console.log(`❌ ${device.name}: HTTP Error ${response.status}`);
        }
      } catch (error) {
        deviceStatus.push({ device: device.name, status: 'offline', error: error.message });
        console.log(`❌ ${device.name}: недоступен (${error.message})`);
      }
    }
    
    return deviceStatus;
  }

  // Выполнение тестовой задачи
  async executeTask(operation, params) {
    try {
      const startTime = performance.now();
      
      const response = await axios.post(`${testConfig.cluster.baseUrl}${testConfig.cluster.endpoints.task}`, {
        operation,
        params
      }, {
        timeout: 30000
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (response.data.success) {
        return {
          success: true,
          taskId: response.data.taskId,
          result: response.data.result,
          responseTime,
          deviceId: response.data.deviceId,
          deviceName: response.data.deviceName,
          processingTime: response.data.processingTime
        };
      } else {
        return {
          success: false,
          error: response.data.error,
          responseTime
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        responseTime: 0
      };
    }
  }

  // Выполнение массовых задач
  async executeBulkTasks(operation, params, count) {
    try {
      const startTime = performance.now();
      
      const response = await axios.post(`${testConfig.cluster.baseUrl}${testConfig.cluster.endpoints.bulkTasks}`, {
        operation,
        params,
        count
      }, {
        timeout: 60000
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (response.data.success) {
        return {
          success: true,
          addedTasks: response.data.addedTasks,
          taskIds: response.data.taskIds,
          responseTime
        };
      } else {
        return {
          success: false,
          error: response.data.error,
          responseTime
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        responseTime: 0
      };
    }
  }

  // Ожидание завершения задач
  async waitForTaskCompletion(expectedCount, timeout = 120000) {
    console.log(`   ⏳ Ожидание завершения ${expectedCount} задач...`);
    
    const startTime = Date.now();
    let completedCount = 0;
    
    while (completedCount < expectedCount && (Date.now() - startTime) < timeout) {
      try {
        const response = await axios.get(`${testConfig.cluster.baseUrl}${testConfig.cluster.endpoints.stats}`);
        const stats = response.data;
        
        completedCount = stats.completedTasks;
        
        if (completedCount >= expectedCount) {
          break;
        }
        
        // Ждем 2 секунды перед следующей проверкой
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.log(`   ⚠️  Ошибка проверки статуса: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    if (completedCount >= expectedCount) {
      console.log(`   ✅ Завершено ${completedCount} задач`);
    } else {
      console.log(`   ⚠️  Таймаут ожидания, завершено ${completedCount}/${expectedCount} задач`);
    }
    
    return completedCount;
  }

  // Выполнение тестового сценария
  async runTestScenario(scenario) {
    console.log(`\n🧪 Тест: ${scenario.name}`);
    console.log(`   📝 ${scenario.description}`);
    console.log(`   🔢 Операция: ${scenario.operation}`);
    console.log(`   📊 Количество задач: ${scenario.count}`);
    
    this.currentTest = {
      name: scenario.name,
      operation: scenario.operation,
      params: scenario.params,
      count: scenario.count,
      startTime: Date.now(),
      results: []
    };
    
    const testStartTime = performance.now();
    
    // Выполняем задачи для каждого набора параметров
    for (const param of scenario.params) {
      console.log(`   📋 Параметр: ${param}`);
      
      const taskCount = Math.ceil(scenario.count / scenario.params.length);
      
      // Отправляем массовые задачи
      const bulkResult = await this.executeBulkTasks(scenario.operation, param, taskCount);
      
      if (bulkResult.success) {
        console.log(`      ✅ Отправлено ${bulkResult.addedTasks} задач`);
        
        // Ожидаем завершения
        const completedCount = await this.waitForTaskCompletion(bulkResult.addedTasks);
        
        // Получаем финальную статистику
        try {
          const statsResponse = await axios.get(`${testConfig.cluster.baseUrl}${testConfig.cluster.endpoints.stats}`);
          const stats = statsResponse.data;
          
          this.currentTest.results.push({
            param,
            taskCount: bulkResult.addedTasks,
            completedCount,
            responseTime: bulkResult.responseTime,
            clusterStats: {
              totalTasks: stats.totalTasks,
              completedTasks: stats.completedTasks,
              failedTasks: stats.failedTasks,
              averageResponseTime: stats.averageResponseTime
            }
          });
        } catch (error) {
          console.log(`      ⚠️  Ошибка получения статистики: ${error.message}`);
        }
      } else {
        console.log(`      ❌ Ошибка отправки задач: ${bulkResult.error}`);
        this.currentTest.results.push({
          param,
          taskCount: 0,
          completedCount: 0,
          error: bulkResult.error
        });
      }
    }
    
    const testEndTime = performance.now();
    this.currentTest.endTime = Date.now();
    this.currentTest.duration = testEndTime - testStartTime;
    
    // Анализируем результаты
    this.analyzeTestResults(this.currentTest);
    
    return this.currentTest;
  }

  // Анализ результатов теста
  analyzeTestResults(test) {
    console.log(`\n📊 Результаты теста: ${test.name}`);
    console.log(`   ⏱️  Общее время: ${Math.round(test.duration)}мс`);
    
    const successfulResults = test.results.filter(r => !r.error);
    
    if (successfulResults.length > 0) {
      const totalTasks = successfulResults.reduce((sum, r) => sum + r.taskCount, 0);
      const totalCompleted = successfulResults.reduce((sum, r) => sum + r.completedCount, 0);
      const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length;
      
      console.log(`   📋 Всего задач: ${totalTasks}`);
      console.log(`   ✅ Завершено: ${totalCompleted}`);
      console.log(`   📈 Успешность: ${Math.round((totalCompleted / totalTasks) * 100)}%`);
      console.log(`   ⚡ Среднее время ответа: ${Math.round(avgResponseTime)}мс`);
      
      // Детали по параметрам
      successfulResults.forEach(result => {
        console.log(`      • Параметр ${result.param}: ${result.completedCount}/${result.taskCount} задач`);
      });
    } else {
      console.log(`   ❌ Все тесты завершились с ошибкой`);
    }
    
    // Сохраняем результаты
    this.results.push(test);
  }

  // Запуск всех тестов
  async runAllTests() {
    console.log('🚀 Запуск тестирования производительности Android кластера\n');
    
    // Проверяем доступность кластера
    if (!(await this.checkClusterHealth())) {
      console.error('❌ Кластер недоступен, тестирование прервано');
      return;
    }
    
    // Проверяем устройства
    const deviceStatus = await this.checkDevicesHealth();
    const onlineDevices = deviceStatus.filter(d => d.status === 'online').length;
    
    if (onlineDevices === 0) {
      console.error('❌ Нет доступных устройств, тестирование прервано');
      return;
    }
    
    console.log(`\n📱 Доступно устройств: ${onlineDevices}/${testConfig.devices.length}`);
    
    // Запускаем тесты
    this.startTime = Date.now();
    
    for (const scenario of testConfig.testScenarios) {
      try {
        await this.runTestScenario(scenario);
        
        // Небольшая пауза между тестами
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`❌ Ошибка выполнения теста "${scenario.name}":`, error.message);
      }
    }
    
    // Финальный отчет
    this.generateFinalReport();
  }

  // Генерация финального отчета
  generateFinalReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 ФИНАЛЬНЫЙ ОТЧЕТ ПО ТЕСТИРОВАНИЮ');
    console.log('='.repeat(60));
    
    console.log(`⏱️  Общее время тестирования: ${Math.round(totalDuration / 1000)}с`);
    console.log(`🧪 Выполнено тестов: ${this.results.length}`);
    
    const totalTasks = this.results.reduce((sum, test) => {
      return sum + test.results.reduce((testSum, result) => testSum + (result.taskCount || 0), 0);
    }, 0);
    
    const totalCompleted = this.results.reduce((sum, test) => {
      return sum + test.results.reduce((testSum, result) => testSum + (result.completedCount || 0), 0);
    }, 0);
    
    console.log(`📋 Всего задач: ${totalTasks}`);
    console.log(`✅ Завершено: ${totalCompleted}`);
    console.log(`📈 Общая успешность: ${Math.round((totalCompleted / totalTasks) * 100)}%`);
    
    // Статистика по операциям
    const operationStats = {};
    this.results.forEach(test => {
      if (!operationStats[test.operation]) {
        operationStats[test.operation] = { tests: 0, totalTasks: 0, totalCompleted: 0 };
      }
      
      operationStats[test.operation].tests++;
      test.results.forEach(result => {
        operationStats[test.operation].totalTasks += result.taskCount || 0;
        operationStats[test.operation].totalCompleted += result.completedCount || 0;
      });
    });
    
    console.log('\n📊 Статистика по операциям:');
    Object.entries(operationStats).forEach(([operation, stats]) => {
      const successRate = stats.totalTasks > 0 ? Math.round((stats.totalCompleted / stats.totalTasks) * 100) : 0;
      console.log(`   • ${operation}: ${stats.totalCompleted}/${stats.totalTasks} (${successRate}%)`);
    });
    
    // Рекомендации
    console.log('\n💡 Рекомендации:');
    if (totalCompleted / totalTasks < 0.8) {
      console.log('   ⚠️  Низкая успешность выполнения задач - проверьте стабильность устройств');
    }
    
    const avgTestTime = totalDuration / this.results.length;
    if (avgTestTime > 30000) {
      console.log('   ⚠️  Долгое время выполнения тестов - оптимизируйте алгоритмы');
    }
    
    console.log('   ✅ Тестирование завершено успешно');
    console.log('='.repeat(60));
  }
}

// Запуск тестирования
async function main() {
  const tester = new PerformanceTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Критическая ошибка тестирования:', error);
    process.exit(1);
  }
}

// Проверяем, что скрипт запущен напрямую
if (require.main === module) {
  main();
}

module.exports = PerformanceTester;
