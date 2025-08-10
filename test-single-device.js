#!/usr/bin/env node

const axios = require('axios');

// Конфигурация тестируемого устройства
const deviceConfig = {
  id: 'samsung-note4',
  name: 'Samsung Note 4',
  port: 3001,
  host: '192.168.0.9' // IP телефона в сети
};

// Тестовые задачи
const testTasks = [
  { operation: 'factorial', params: 10, expected: 3628800 },
  { operation: 'primeNumbers', params: 100, expected: 25 },
  { operation: 'arraySort', params: 1000, expected: 1000 },
  { operation: 'hash', params: 'test-string', expected: 'number' },
  { operation: 'fibonacci', params: 20, expected: 6765 }
];

async function testDevice() {
  console.log(`🧪 Тестирование устройства: ${deviceConfig.name}`);
  console.log(`📍 Адрес: http://${deviceConfig.host}:${deviceConfig.port}\n`);

  try {
    // 1. Проверяем доступность устройства
    console.log('1️⃣ Проверка доступности...');
    const healthResponse = await axios.get(`http://${deviceConfig.host}:${deviceConfig.port}/health`);
    console.log(`✅ Health check: ${healthResponse.data.status}`);
    console.log(`   Uptime: ${Math.round(healthResponse.data.uptime)}s`);
    console.log(`   Memory: ${healthResponse.data.memoryUsage.heapUsed}MB / ${healthResponse.data.memoryUsage.heapTotal}MB\n`);

    // 2. Получаем информацию об устройстве
    console.log('2️⃣ Информация об устройстве...');
    const deviceResponse = await axios.get(`http://${deviceConfig.host}:${deviceConfig.port}/api/device`);
    console.log(`✅ Устройство: ${deviceResponse.data.name}`);
    console.log(`   ID: ${deviceResponse.data.id}`);
    console.log(`   Платформа: ${deviceResponse.data.platform}`);
    console.log(`   Максимум задач: ${deviceResponse.data.capabilities?.maxConcurrentTasks || 'N/A'}`);
    console.log(`   Поддерживаемые операции: ${deviceResponse.data.capabilities?.supportedOperations?.join(', ') || 'N/A'}\n`);

    // 3. Тестируем каждую операцию
    console.log('3️⃣ Тестирование операций...');
    let passedTests = 0;
    let totalTests = testTasks.length;

    for (const task of testTasks) {
      try {
        console.log(`   Тест: ${task.operation}(${task.params})`);
        
        const startTime = Date.now();
        const response = await axios.post(`http://${deviceConfig.host}:${deviceConfig.port}/api/task`, {
          operation: task.operation,
          params: task.params,
          taskId: `test_${Date.now()}`
        });
        const endTime = Date.now();
        
        const result = response.data;
        const processingTime = endTime - startTime;
        
        if (result.success) {
          console.log(`     ✅ Результат: ${result.result}`);
          console.log(`     ⏱️  Время обработки: ${result.processingTime}ms`);
          console.log(`     📱 Время ответа: ${processingTime}ms`);
          console.log(`     💾 Память: ${result.memoryUsage?.heapUsed || 'N/A'}MB`);
          
          // Проверяем корректность результата
          if (task.expected === 'number' || result.result === task.expected) {
            console.log(`     🎯 Тест пройден`);
            passedTests++;
          } else {
            console.log(`     ❌ Ожидалось: ${task.expected}, получено: ${result.result}`);
          }
        } else {
          console.log(`     ❌ Ошибка: ${result.error}`);
        }
        
        console.log('');
        
        // Небольшая пауза между тестами
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`     ❌ Ошибка выполнения: ${error.message}`);
        console.log('');
      }
    }

    // 4. Получаем финальную статистику
    console.log('4️⃣ Финальная статистика...');
    const statsResponse = await axios.get(`http://${deviceConfig.host}:${deviceConfig.port}/api/stats`);
    const stats = statsResponse.data;
    
    console.log(`✅ Всего задач: ${stats.totalTasks}`);
    console.log(`✅ Выполнено: ${stats.completedTasks}`);
    console.log(`❌ Ошибок: ${stats.failedTasks}`);
    console.log(`⏱️  Среднее время ответа: ${Math.round(stats.averageResponseTime * 1000)}ms`);
    
    if (stats.operationStats) {
      console.log('\n📊 Статистика по операциям:');
      Object.entries(stats.operationStats).forEach(([op, opStats]) => {
        if (opStats.count > 0) {
          console.log(`   ${op}: ${opStats.count} задач, среднее время: ${Math.round(opStats.averageTime * 1000)}ms`);
        }
      });
    }

    // 5. Результат тестирования
    console.log('\n' + '='.repeat(50));
    console.log(`🎯 РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ: ${passedTests}/${totalTests} тестов пройдено`);
    
    if (passedTests === totalTests) {
      console.log('🎉 Все тесты пройдены успешно! Устройство работает корректно.');
    } else {
      console.log('⚠️  Некоторые тесты не пройдены. Проверьте логи выше.');
    }
    
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Ошибка подключения к устройству:', error.message);
    console.log('\n💡 Убедитесь, что:');
    console.log('   1. Устройство запущено: node start-device.js samsung-note4');
    console.log('   2. Порт 3001 не занят другими процессами');
    console.log('   3. Нет блокировки файрволом');
  }
}

// Запуск тестирования
testDevice().catch(console.error);
