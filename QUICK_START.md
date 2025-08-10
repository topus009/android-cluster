# 🚀 Быстрый запуск Android Cluster

## 📋 Что нужно для первой проверки телефонов

### 1. Установка зависимостей
```bash
# В папке android-workers
cd android-workers
npm install

# В папке frontend-interface  
cd ../frontend-interface
npm install

# В корневой папке
cd ..
npm install axios
```

### 2. Запуск одного устройства для тестирования

#### Вариант A: Запуск через start-device.js
```bash
cd android-workers
node start-device.js samsung-note4
```

#### Вариант B: Запуск через server.js
```bash
cd android-workers
PORT=3001 DEVICE_ID=samsung-note4 DEVICE_NAME="Samsung Note 4" node src/server.js
```

### 3. Тестирование устройства

В новом терминале:
```bash
node test-single-device.js
```

### 4. Запуск всего кластера

```bash
node start-cluster.js start
```

## 🔧 Конфигурация устройств

Устройства настроены в `android-workers/config/device-config.js`:

- **Samsung Note 4** - порт 3001, максимум 3 задачи
- **Samsung Google Nexus** - порт 3002, максимум 4 задачи  
- **Alcatel One Touch 7043** - порт 3003, максимум 2 задачи

## 📱 Поддерживаемые операции

- `factorial` - вычисление факториала
- `primeNumbers` - поиск простых чисел
- `arraySort` - сортировка массивов
- `hash` - хеширование строк
- `fibonacci` - числа Фибоначчи

## 🌐 Доступные эндпоинты

- **Health check**: `http://localhost:3001/health`
- **Информация об устройстве**: `http://localhost:3001/api/device`
- **Статистика**: `http://localhost:3001/api/stats`
- **Выполнение задач**: `POST http://localhost:3001/api/task`

## 🧪 Пример тестовой задачи

```bash
curl -X POST http://localhost:3001/api/task \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "factorial",
    "params": 10,
    "taskId": "test_001"
  }'
```

## ⚠️ Возможные проблемы

1. **Порт занят**: Измените порт в конфигурации или остановите процесс
2. **Файрвол**: Разрешите входящие соединения на портах 3001-3003
3. **Зависимости**: Убедитесь, что все npm пакеты установлены

## 📊 Мониторинг

- **WebSocket**: `ws://localhost:3001` для real-time обновлений
- **Логи**: Все операции логируются в консоль
- **Метрики**: Память, CPU, время выполнения задач

## 🎯 Следующие шаги

После успешного тестирования одного устройства:
1. Запустите все устройства кластера
2. Протестируйте распределение задач
3. Запустите frontend интерфейс
4. Проведите нагрузочное тестирование

