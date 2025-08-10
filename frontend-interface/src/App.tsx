import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useClusterStore } from '@/store/cluster-store'
import { toast } from 'sonner'

// Компоненты страниц
import Dashboard from '@/pages/Dashboard'
import Devices from '@/pages/Devices'
import Tasks from '@/pages/Tasks'
import Performance from '@/pages/Performance'
import Settings from '@/pages/Settings'

// Компоненты
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

function App() {
  const { connect, disconnect, isConnected } = useClusterStore()

  useEffect(() => {
    // Подключаемся к кластеру при загрузке приложения
    connect()

    // Отключаемся при размонтировании
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  useEffect(() => {
    // Показываем уведомление о статусе подключения
    if (isConnected) {
      toast.success('Подключен к Android кластеру', {
        description: 'Все системы работают нормально'
      })
    }
  }, [isConnected])

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          {/* Боковая панель */}
          <Sidebar />
          
          {/* Основной контент */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Заголовок */}
            <Header />
            
            {/* Основной контент */}
            <main className="flex-1 overflow-auto p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/devices" element={<Devices />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default App
