export interface Device {
  id: string
  name: string
  host: string
  port: number
  status: 'online' | 'offline'
  lastSeen: number
  currentLoad: number
  completedTasks: number
  failedTasks: number
  averageResponseTime: number
  uptime?: number
  memoryUsage?: {
    rss: number
    heapUsed: number
    heapTotal: number
  }
  capabilities?: {
    maxConcurrentTasks: number
    supportedOperations: string[]
  }
  systemInfo?: SystemInfo
}

export interface Task {
  id: string
  operation: 'factorial' | 'primeNumbers' | 'arraySort' | 'hash' | 'fibonacci' | 'imageProcessing' | 'dataCompression' | 'encryption' | 'networkSimulation' | 'fileOperations'
  params: number | string
  priority: 'low' | 'normal' | 'high'
  status: 'queued' | 'processing' | 'completed' | 'failed'
  createdAt: number
  startedAt?: number
  completedAt?: number
  assignedTo?: string
  result?: any
  processingTime?: number
  error?: string
}

export interface SystemInfo {
  memory: {
    rss: string
    heapUsed: string
    heapTotal: string
    external: string
  }
  cpu: {
    user: string
    system: string
    loadAverage: number[]
  }
  platform: {
    arch: string
    platform: string
    uptime: number
    totalMemory: string
    freeMemory: string
  }
}

export interface PerformanceMetrics {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  averageResponseTime: number
  clusterThroughput: number
  deviceLoads: Map<string, number>
  networkStats?: {
    requests: number
    bytesReceived: number
    bytesSent: number
  }
}

export interface ClusterState {
  devices: Device[]
  taskQueue: number
  activeTasks: Task[]
  completedTasks: Task[]
  performanceMetrics: PerformanceMetrics
}

export interface ClusterStats {
  totalDevices: number
  onlineDevices: number
  totalTasks: number
  completedTasks: number
  failedTasks: number
  averageResponseTime: number
  clusterThroughput: number
  queueLength: number
  activeTasksCount: number
}

export interface TaskFormData {
  operation: Task['operation']
  params: number
  priority: Task['priority']
}

export interface BulkTaskFormData {
  operation: Task['operation']
  params: number
  count: number
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
  accentColor: string
}

export interface GridSettings {
  columns: number
  spacing: number
  showFavicons: boolean
  showTimestamps: boolean
  sortBy: 'name' | 'date' | 'status' | 'load'
  sortOrder: 'asc' | 'desc'
}

export interface SidebarConfig {
  collapsed: boolean
  width: number
  showDevices: boolean
  showTasks: boolean
  showStats: boolean
}

export interface NotificationConfig {
  enabled: boolean
  sound: boolean
  desktop: boolean
  taskCompletion: boolean
  deviceStatus: boolean
  errors: boolean
}

// Новые интерфейсы для работы с вкладками и закладками
export interface Tab {
  id: string
  title: string
  url: string
  favicon?: string
  windowId: string
  active: boolean
  pinned: boolean
  createdAt: number
  lastAccessed: number
}

export interface BrowserWindow {
  id: string
  title: string
  tabs: Tab[]
  activeTabId: string
  createdAt: number
  lastAccessed: number
}

export interface Bookmark {
  id: string
  title: string
  url: string
  favicon?: string
  tags: string[]
  createdAt: number
  lastAccessed: number
  collectionId?: string
}

export interface Collection {
  id: string
  name: string
  description?: string
  bookmarks: Bookmark[]
  color?: string
  icon?: string
  createdAt: number
  updatedAt: number
  order: number
}

export interface TabStore {
  windows: BrowserWindow[]
  collections: Collection[]
  activeWindowId: string | null
  searchQuery: string
  sortBy: 'title' | 'url' | 'date' | 'access'
  sortOrder: 'asc' | 'desc'
  gridSettings: GridSettings
  sidebarConfig: SidebarConfig
}

export interface TabActions {
  // Управление вкладками
  addTab: (windowId: string, tab: Omit<Tab, 'id' | 'createdAt' | 'lastAccessed'>) => void
  updateTab: (tabId: string, updates: Partial<Tab>) => void
  removeTab: (tabId: string) => void
  moveTab: (tabId: string, targetWindowId: string) => void
  activateTab: (tabId: string) => void
  
  // Управление окнами
  addWindow: (window: Omit<BrowserWindow, 'id' | 'createdAt' | 'lastAccessed'>) => void
  removeWindow: (windowId: string) => void
  updateWindow: (windowId: string, updates: Partial<BrowserWindow>) => void
  
  // Управление закладками
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'lastAccessed'>) => void
  updateBookmark: (bookmarkId: string, updates: Partial<Bookmark>) => void
  removeBookmark: (bookmarkId: string) => void
  moveBookmark: (bookmarkId: string, targetCollectionId: string) => void
  
  // Управление коллекциями
  addCollection: (collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateCollection: (collectionId: string, updates: Partial<Collection>) => void
  removeCollection: (collectionId: string) => void
  reorderCollections: (collectionIds: string[]) => void
  
  // Массовые операции
  saveAllTabs: (windowId: string, collectionId: string) => void
  moveAllBookmarks: (sourceCollectionId: string, targetCollectionId: string) => void
  
  // Поиск и сортировка
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: TabStore['sortBy']) => void
  setSortOrder: (order: 'asc' | 'desc') => void
  
  // Настройки
  updateGridSettings: (settings: Partial<GridSettings>) => void
  updateSidebarConfig: (config: Partial<SidebarConfig>) => void
  
  // Утилиты
  getFilteredTabs: () => Tab[]
  getFilteredCollections: () => Collection[]
  getTabsByWindow: (windowId: string) => Tab[]
  getBookmarksByCollection: (collectionId: string) => Bookmark[]
}
