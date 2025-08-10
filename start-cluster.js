#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Конфигурация кластера
const clusterConfig = {
  devices: [
    { id: 'samsung-note4', name: 'Samsung Note 4', port: 3001, host: '192.168.1.101' },
    { id: 'samsung-nexus', name: 'Samsung Google Nexus', port: 3002, host: '192.168.1.102' },
    { id: 'alcatel-7043', name: 'Alcatel One Touch 7043', port: 3003, host: '192.168.1.103' }
  ],
  frontend: { port: 8080, host: '0.0.0.0' }
};

class ClusterManager {
  constructor() {
    this.processes = new Map();
    this.isRunning = false;
  }

  // Запуск Android worker сервера
  startAndroidWorker(device) {
    console.log(`${colors.cyan}🚀 Запуск Android Worker: ${device.name}${colors.reset}`);
    
    const workerPath = path.join(__dirname, 'android-workers', 'src', 'server.js');
    
    const worker = spawn('node', [workerPath], {
      cwd: path.join(__dirname, 'android-workers'),
      env: {
        ...process.env,
        PORT: device.port,
        DEVICE_ID: device.id,
        DEVICE_NAME: device.name,
        HOST: device.host
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Логирование вывода
    worker.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`${colors.green}[${device.name}]${colors.reset} ${output}`);
      }
    });

    worker.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`${colors.red}[${device.name} ERROR]${colors.reset} ${output}`);
      }
    });

    worker.on('close', (code) => {
      if (code !== 0) {
        console.log(`${colors.red}❌ Android Worker ${device.name} завершился с кодом ${code}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}🔄 Android Worker ${device.name} остановлен${colors.reset}`);
      }
    });

    this.processes.set(device.id, worker);
    return worker;
  }

  // Запуск frontend интерфейса
  startFrontend() {
    console.log(`${colors.cyan}🌐 Запуск Frontend Interface${colors.reset}`);
    
    const frontendPath = path.join(__dirname, 'frontend-interface', 'src', 'server.js');
    
    const frontend = spawn('node', [frontendPath], {
      cwd: path.join(__dirname, 'frontend-interface'),
      env: {
        ...process.env,
        PORT: clusterConfig.frontend.port,
        HOST: clusterConfig.frontend.host
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Логирование вывода
    frontend.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`${colors.blue}[Frontend]${colors.reset} ${output}`);
      }
    });

    frontend.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`${colors.red}[Frontend ERROR]${colors.reset} ${output}`);
      }
    });

    frontend.on('close', (code) => {
      if (code !== 0) {
        console.log(`${colors.red}❌ Frontend завершился с кодом ${code}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}🔄 Frontend остановлен${colors.reset}`);
      }
    });

    this.processes.set('frontend', frontend);
    return frontend;
  }

  // Запуск всего кластера
  async start() {
    if (this.isRunning) {
      console.log(`${colors.yellow}⚠️  Кластер уже запущен${colors.reset}`);
      return;
    }

    console.log(`${colors.bright}🤖 Запуск Android Cluster...${colors.reset}\n`);

    try {
      // Запускаем Android workers
      for (const device of clusterConfig.devices) {
        this.startAndroidWorker(device);
        // Небольшая задержка между запуском устройств
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Запускаем frontend
      setTimeout(() => {
        this.startFrontend();
      }, 2000);

      this.isRunning = true;

      console.log(`\n${colors.green}✅ Кластер успешно запущен!${colors.reset}`);
      console.log(`${colors.cyan}📱 Android Workers:${colors.reset}`);
      clusterConfig.devices.forEach(device => {
        console.log(`   • ${device.name}: http://${device.host}:${device.port}`);
      });
      console.log(`${colors.cyan}🌐 Frontend Interface:${colors.reset}`);
      console.log(`   • http://localhost:${clusterConfig.frontend.port}`);
      console.log(`\n${colors.yellow}💡 Для остановки кластера нажмите Ctrl+C${colors.reset}\n`);

    } catch (error) {
      console.error(`${colors.red}❌ Ошибка запуска кластера:${colors.reset}`, error);
      this.stop();
    }
  }

  // Остановка кластера
  stop() {
    if (!this.isRunning) return;

    console.log(`\n${colors.yellow}🛑 Остановка кластера...${colors.reset}`);

    for (const [id, process] of this.processes) {
      try {
        process.kill('SIGTERM');
        console.log(`${colors.yellow}🔄 Остановка ${id}...${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}❌ Ошибка остановки ${id}:${colors.reset}`, error);
      }
    }

    this.processes.clear();
    this.isRunning = false;

    console.log(`${colors.green}✅ Кластер остановлен${colors.reset}`);
  }

  // Проверка статуса кластера
  async checkStatus() {
    console.log(`${colors.cyan}📊 Статус кластера:${colors.reset}\n`);

    for (const device of clusterConfig.devices) {
      try {
        const response = await fetch(`http://${device.host}:${device.port}/health`);
        if (response.ok) {
          const data = await response.json();
          console.log(`${colors.green}✅ ${device.name} (${device.host}:${device.port}) - ${data.status}${colors.reset}`);
          console.log(`   Uptime: ${Math.round(data.uptime)}s`);
        } else {
          console.log(`${colors.red}❌ ${device.name} (${device.host}:${device.port}) - недоступен${colors.reset}`);
        }
      } catch (error) {
        console.log(`${colors.red}❌ ${device.name} (${device.host}:${device.port}) - ошибка подключения${colors.reset}`);
      }
    }

    try {
      const response = await fetch(`http://localhost:${clusterConfig.frontend.port}/api/cluster/stats`);
      if (response.ok) {
        const data = await response.json();
        console.log(`\n${colors.green}✅ Frontend Interface (localhost:${clusterConfig.frontend.port}) - доступен${colors.reset}`);
        console.log(`   Устройств: ${data.totalDevices}/${data.onlineDevices}`);
        console.log(`   Задач: ${data.totalTasks} (выполнено: ${data.completedTasks})`);
      } else {
        console.log(`\n${colors.red}❌ Frontend Interface (localhost:${clusterConfig.frontend.port}) - недоступен${colors.reset}`);
      }
    } catch (error) {
      console.log(`\n${colors.red}❌ Frontend Interface (localhost:${clusterConfig.frontend.port}) - ошибка подключения${colors.reset}`);
    }
  }
}

// Создаем менеджер кластера
const clusterManager = new ClusterManager();

// Обработка сигналов завершения
process.on('SIGINT', () => {
  clusterManager.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  clusterManager.stop();
  process.exit(0);
});

// Обработка аргументов командной строки
const command = process.argv[2];

switch (command) {
  case 'start':
    clusterManager.start();
    break;
  case 'stop':
    clusterManager.stop();
    break;
  case 'status':
    clusterManager.checkStatus();
    break;
  case 'restart':
    clusterManager.stop();
    setTimeout(() => clusterManager.start(), 2000);
    break;
  default:
    console.log(`${colors.bright}🤖 Android Cluster Manager${colors.reset}\n`);
    console.log('Использование:');
    console.log('  node start-cluster.js start    - Запустить кластер');
    console.log('  node start-cluster.js stop     - Остановить кластер');
    console.log('  node start-cluster.js status   - Проверить статус');
    console.log('  node start-cluster.js restart  - Перезапустить кластер');
    console.log('\nПримеры:');
    console.log('  node start-cluster.js start');
    console.log('  node start-cluster.js status');
    console.log('\nДля запуска кластера выполните: node start-cluster.js start');
}
