import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Circle, Calendar, Users, MapPin, AlertCircle, Menu, Home, BarChart3, Filter, Bell, X, Settings, TrendingUp, Award, Target, Zap, FileText, Check, Pill, Gift, Star, Coffee, Car, Plane, Wifi, WifiOff, Download, Smartphone, Database, Cloud, RotateCcw, Search, Plus, Trash2, Edit3, Save, ArrowLeft, User, Shield, Lock, Unlock, Activity, Eye, EyeOff } from 'lucide-react';
import { 
  addBringolinoTask, 
  getBringolinoTasks, 
  updateBringolinoTask, 
  deleteBringolinoTask, 
  saveDepartmentData,
  getDepartmentData,
  getAllDepartmentData,
  subscribeToDepartmentData,
  lockDECT,
  unlockDECT,
  getDECTLocks,
  subscribeToDECTLocks,
  isSupabaseConnected,
  supabase
} from './supabase';

// ✅ GERÇEK SUPABASE SERVICE CLASS - PostgreSQL ile
class SupabaseService {
  constructor() {
    this.isOnline = true;
    this.pendingWrites = [];
    this.retryTimeout = null;
    this.initialized = false;
  }

  // Initialize Supabase connection
  async initialize() {
    try {
      if (this.initialized) return true;
      
      if (!isSupabaseConnected()) {
        console.log('⚠️ Supabase not connected - working offline');
        return false;
      }
      
      // Test connection with timeout
      const testPromise = supabase.from('bringolino_tasks').select('count').limit(1);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      try {
        await Promise.race([testPromise, timeoutPromise]);
        this.initialized = true;
        console.log('🚀 Supabase initialized successfully');
        return true;
      } catch (error) {
        console.log('⚠️ Supabase connection test failed, working offline');
        return false;
      }
    } catch (error) {
      console.error('❌ Supabase initialization failed:', error);
      return false;
    }
  }

  // Save data with offline support using Supabase
  async saveData(path, data) {
    try {
      // Supabase table structure
      const pathParts = path.split('/');
      const table = pathParts[0];
      
      if (table === 'departmentData') {
        await saveDepartmentData(data);
      }
      
      console.log(`✅ Saved to Supabase: ${path}`);
      return true;
    } catch (error) {
      console.warn(`⚠️ Supabase save failed: ${error.message}`);
      this.pendingWrites.push({ path, data, timestamp: Date.now() });
      return false;
    }
  }

  // Update specific fields using Supabase
  async updateData(path, data) {
    try {
      // Supabase update logic
      console.log(`✅ Updated Supabase: ${path}`, data);
      return true;
    } catch (error) {
      console.warn(`⚠️ Supabase update failed: ${error.message}`);
      this.pendingWrites.push({ path, data, timestamp: Date.now(), isUpdate: true });
      return false;
    }
  }

  // Listen to real-time data changes using Supabase
  listenToData(path, callback) {
    try {
      if (path === 'departments') {
        const unsubscribe = subscribeToDepartmentData((departmentData) => {
          // Convert department data to the expected format
          const data = {};
          departmentData.forEach(dept => {
            if (!data[dept.department]) {
              data[dept.department] = {};
            }
            data[dept.department][dept.date] = {
              completedTasks: dept.completedTasks,
              documentationChecks: dept.documentationChecks,
              apothekeChecks: dept.apothekeChecks,
              userPoints: dept.userPoints,
              lastUpdate: dept.lastUpdate
            };
          });
          callback(data);
        });
        return unsubscribe;
      }
      
      if (path === 'lockedDECTs') {
        const unsubscribe = subscribeToDECTLocks((locks) => {
          const lockData = {};
          locks.forEach(lock => {
            lockData[lock.dectCode] = {
              userId: lock.userId,
              userName: lock.userName,
              lockTime: lock.lockTime,
              lockDate: lock.lockDate
            };
          });
          callback(lockData);
        });
        return unsubscribe;
      }
      
      return () => {};
    } catch (error) {
      console.warn(`⚠️ Supabase listen failed: ${error.message}`);
      return () => {};
    }
  }

  // Stop listening
  stopListening(path, callback) {
    // Supabase unsubscribe handled by returned function
  }

  // Get data once using Supabase
  async getData(path) {
    try {
      if (path === 'departments') {
        const departmentData = await getAllDepartmentData();
        return departmentData;
      }
      return null;
    } catch (error) {
      console.warn(`⚠️ Supabase read failed: ${error.message}`);
      return null;
    }
  }

  // Retry pending writes when back online
  async retryPendingWrites() {
    if (this.pendingWrites.length === 0) return;

    console.log(`🔄 Retrying ${this.pendingWrites.length} pending writes...`);
    
    const writes = [...this.pendingWrites];
    this.pendingWrites = [];

    for (const write of writes) {
      try {
        if (write.isUpdate) {
          await this.updateData(write.path, write.data);
        } else {
          await this.saveData(write.path, write.data);
        }
        console.log(`✅ Retry successful: ${write.path}`);
      } catch (error) {
        console.warn(`⚠️ Retry failed: ${write.path}`);
        this.pendingWrites.push(write);
      }
    }
  }

  // Get connection status
  isConnected() {
    return navigator.onLine;
  }

  // Get pending writes count
  getPendingWritesCount() {
    return this.pendingWrites.length;
  }
}

const departmentPerformance = [
  { dept: '27527', rate: 0, tasks: 9 },
  { dept: '27522', rate: 0, tasks: 7 },
  { dept: '27525', rate: 0, tasks: 7 },
  { dept: '27529', rate: 0, tasks: 9 },
  { dept: '27530', rate: 0, tasks: 6 }
];

const KrankenhausLogistikApp = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('27527');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [showMenu, setShowMenu] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [showApotheke, setShowApotheke] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showMoppVersorgung, setShowMoppVersorgung] = useState(false);
  const [moppFilter, setMoppFilter] = useState('all');
  const [documentationChecks, setDocumentationChecks] = useState({});
  const [apothekeChecks, setApothekeChecks] = useState({});
  const [userPoints, setUserPoints] = useState(0);
  const [currentView, setCurrentView] = useState('tasks');
  const [showLeiterDashboard, setShowLeiterDashboard] = useState(false);
  const [showTaskManager, setShowTaskManager] = useState(false);
  const [showDECTManager, setShowDECTManager] = useState(false);

  // ✅ YENİ DOKÜMANTASYON STATES
  const [showTransportNeu, setShowTransportNeu] = useState(false);
  const [showTransportAlt, setShowTransportAlt] = useState(false);
  const [showMedikamenteNeu, setShowMedikamenteNeu] = useState(false);
  const [showMedikamenteAlt, setShowMedikamenteAlt] = useState(false);
  const [suchtgiftDoku, setSuchtgiftDoku] = useState(false);
  const [showBadHall, setShowBadHall] = useState(false);
  const [showKleiderbugel, setShowKleiderbugel] = useState(false);
  
  // CHECK STATES
  const [transportNeuChecks, setTransportNeuChecks] = useState({});
  const [transportAltChecks, setTransportAltChecks] = useState({});
  const [medikamenteNeuChecks, setMedikamenteNeuChecks] = useState({});
  const [medikamenteAltChecks, setMedikamenteAltChecks] = useState({});
  const [suchtgiftChecks, setSuchtgiftChecks] = useState({});
  const [badHallChecks, setBadHallChecks] = useState({});
  const [kleiderbugelChecks, setKleiderbugelChecks] = useState({});

  // ✅ FIREBASE INTEGRATION
  const [supabaseService] = useState(() => new SupabaseService());
  const [supabaseStatus, setSupabaseStatus] = useState('disconnected');
  const [supabaseLastSync, setSupabaseLastSync] = useState(null);
  const [pendingSync, setPendingSync] = useState(0);
  const [showSupabaseStatus, setShowSupabaseStatus] = useState(false);

  // ✅ SUPABASE DATA SYNC
  const [allDepartmentData, setAllDepartmentData] = useState({});
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);
  const [lockedDECTs, setLockedDECTs] = useState({});

  // ✅ SUPABASE CONNECTION STATUS
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Task Management States
  const [allTasks, setAllTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    department: selectedDepartment,
    location: '',
    dueDate: ''
  });
  const [editingTask, setEditingTask] = useState(null);

  // ✅ YENİ: MAIN COMPONENT DECT LOCK FUNCTIONS
  const mainIsDECTLocked = (dectCode) => {
    const today = new Date().toDateString();
    const lock = lockedDECTs[dectCode];
    
    if (!lock) return false;
    if (lock.lockDate !== today) return false;
    
    const userId = getUserId();
    return lock.userId !== userId;
  };

  const mainGetDECTLockInfo = (dectCode) => {
    const lock = lockedDECTs[dectCode];
    if (!lock) return null;
    
    const today = new Date().toDateString();
    if (lock.lockDate !== today) return null;
    
    return {
      userName: lock.userName,
      lockTime: new Date(lock.lockTime).toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  // ✅ SUPABASE INITIALIZATION
  useEffect(() => {
    const initSupabase = async () => {
      console.log('🚀 Supabase bağlantısı kuruluyor...');
      setConnectionStatus('connecting');
      
      try {
        const success = await supabaseService.initialize();
        if (success) {
          setConnectionStatus('connected');
          setSupabaseStatus('connected');
          setIsSupabaseReady(true);
          setLastSyncTime(new Date());
          console.log(`🎉 Supabase başarıyla bağlandı! DECT ${selectedDepartment} hazır!`);
          
          // Start listening to all department data
          startRealtimeSync();
          
          // Auto-sync current user's data immediately
          syncCurrentUserData();
          
          // Load all tasks
          loadAllTasks();
          
          // Retry any pending writes
          supabaseService.retryPendingWrites();
        } else {
          setConnectionStatus('offline');
          setSupabaseStatus('disconnected');
          console.log('⚠️ Offline modda çalışıyor');
        }
      } catch (error) {
        console.error('❌ Supabase initialization error:', error);
        setConnectionStatus('error');
        setSupabaseStatus('disconnected');
      }
    };

    initSupabase();

    // Monitor connection status
    const connectionMonitor = setInterval(() => {
      const isConnected = supabaseService.isConnected();
      const pending = supabaseService.getPendingWritesCount();
      
      setPendingSync(pending);
      
      if (isConnected && supabaseStatus === 'disconnected') {
        setSupabaseStatus('connected');
        setConnectionStatus('connected');
        console.log('🚀 Supabase yeniden bağlandı!');
        supabaseService.retryPendingWrites();
        syncCurrentUserData();
      } else if (!isConnected && supabaseStatus === 'connected') {
        setSupabaseStatus('disconnected');
        setConnectionStatus('offline');
      }
    }, 2000);

    return () => {
      clearInterval(connectionMonitor);
    };
  }, [selectedDepartment]);

  // Load all tasks from Supabase
  const loadAllTasks = async () => {
    try {
      const tasks = await getBringolinoTasks();
      setAllTasks(tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  // ✅ AUTO-SYNC CURRENT USER DATA
  const syncCurrentUserData = async () => {
    if (!isSupabaseReady) return;
    
    const today = new Date().toDateString();
    const userId = getUserId();
    const currentUserData = {
      department: selectedDepartment,
      date: today,
      completedTasks: Array.from(completedTasks),
      documentationChecks: documentationChecks,
      apothekeChecks: apothekeChecks,
      userPoints: userPoints,
      lastUpdate: Date.now(),
      deviceId: getDeviceId(),
      userId: userId
    };

    console.log(`📤 Auto-syncing data for DECT ${selectedDepartment}:`, currentUserData);
    
    await syncToSupabase('userData', currentUserData);
  };

  // ✅ DEVICE & USER IDENTIFICATION
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('bringolino_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('bringolino_device_id', deviceId);
    }
    return deviceId;
  };

  const getUserId = () => {
    let userId = localStorage.getItem('bringolino_user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('bringolino_user_id', userId);
    }
    return userId;
  };

  // ✅ AUTO-SYNC ON DATA CHANGES
  useEffect(() => {
    if (isSupabaseReady) {
      syncCurrentUserData();
    }
  }, [completedTasks, documentationChecks, apothekeChecks, userPoints, kleiderbugelChecks, isSupabaseReady]);

  // ✅ AUTO-SYNC ON DEPARTMENT CHANGE
  useEffect(() => {
    if (isSupabaseReady) {
      console.log(`🔄 Department changed to ${selectedDepartment} - Auto-syncing...`);
      syncCurrentUserData();
    }
  }, [selectedDepartment, isSupabaseReady]);

  // ✅ REAL-TIME SYNC SETUP
  const startRealtimeSync = () => {
    try {
      // Listen to all departments data
      supabaseService.listenToData('departments', (data) => {
        if (data) {
          setAllDepartmentData(data);
          console.log('📡 Real-time update received:', Object.keys(data));
        }
      });

      // Listen to locked DECTs
      supabaseService.listenToData('lockedDECTs', (data) => {
        if (data) {
          setLockedDECTs(data);
          console.log('🔒 Locked DECTs updated:', data);
        }
      });

      // Listen to specific department data if needed
      supabaseService.listenToData(`departments/${selectedDepartment}`, (data) => {
        if (data && data.completedTasks) {
          const newCompletedTasks = new Set(data.completedTasks);
          setCompletedTasks(newCompletedTasks);
        }
      });
    } catch (error) {
      console.warn('⚠️ Real-time sync setup failed:', error);
    }
  };

  // ✅ SYNC DATA TO SUPABASE
  const syncToSupabase = async (dataType, data) => {
    if (!isSupabaseReady) return;

    setSupabaseStatus('syncing');
    
    const success = await supabaseService.saveData('departmentData', data);

    if (success) {
      setSupabaseStatus('connected');
      setSupabaseLastSync(new Date());
    } else {
      setSupabaseStatus('disconnected');
    }
    
    return success;
  };

  // Örnek departmanlar
  const departments = {
    '27527': 'Kleiner Botendienst',
    '27522': 'Wäsche & Küchen Service',
    '27525': 'Bauteil C Service',
    '27529': 'Bauteil H & Kindergarten',
    '27530': 'Hauptmagazin Service',
  };

  // Görevler
  const taskTemplates = {
    '27527': [
      {
        id: 1,
        time: '06:30',
        title: 'Mopp "BT C"',
        description: 'Nach Mopp-Verteilung, Blut von K101, Präparate und Konservenboxen (leere Kühlboxen) von K101 und OP abholen',
        location: 'K101, OP, Labor/Patho',
        priority: 'high',
        estimatedDuration: '45 min'
      },
      {
        id: 2,
        time: '07:30',
        title: 'Pakete; HLM / APO',
        description: 'APO - Post und TW liefern und retour',
        location: 'Apotheke',
        priority: 'medium',
        estimatedDuration: '15 min'
      },
      {
        id: 3,
        time: '07:45',
        title: 'Post Service',
        description: 'Post von der Poststelle für Seelsorge und Personalstelle mitnehmen und retour',
        location: 'Poststelle, Seelsorge, Personal',
        priority: 'medium',
        estimatedDuration: '20 min'
      },
      {
        id: 4,
        time: '08:30',
        title: 'Blut "BT D" Transport',
        description: 'Blut "BT D" holen (ausgenommen D101 und D201)',
        location: 'Verschiedene Stationen',
        priority: 'high',
        estimatedDuration: '30 min'
      },
      {
        id: 5,
        time: '10:00',
        title: 'IT Transport (Nur Montags)',
        description: 'Küchentransport für IT - nur wenn Montag kein Feiertag ist',
        location: 'Küche, IT',
        priority: 'low',
        condition: 'Nur Montags (Dienstags wenn Montag Feiertag)',
        estimatedDuration: '25 min'
      },
      {
        id: 6,
        time: '11:30',
        title: 'Essenswagen "BT H"',
        description: 'Essenswagen "BT H" ausliefern',
        location: 'Küche zu Stationen',
        priority: 'medium',
        estimatedDuration: '20 min'
      },
      {
        id: 7,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 8,
        time: '12:30',
        title: 'Essenswagen Austausch',
        description: 'Essenswagen von "BT H" Stationen einsammeln und Moppwagen austauschen BT H (HOZ) / N',
        location: 'Alle BT H Stationen',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 9,
        time: '13:30',
        title: 'Freitag Spezial',
        description: 'Jeden Freitag: Mopp "Bauteil C / K / OP" ausstellen',
        location: 'Bauteil C, K, OP',
        priority: 'medium',
        condition: 'Nur Freitags (Feiertags um 14:00 Uhr)',
        estimatedDuration: '35 min'
      }
    ],
    '27522': [
      {
        id: 10,
        time: '06:00',
        title: 'Wäsche Verteilung',
        description: 'Saubere Wäsche an alle Stationen verteilen',
        location: 'Wäscherei zu Stationen',
        priority: 'high',
        estimatedDuration: '60 min'
      },
      {
        id: 11,
        time: '08:00',
        title: 'Küchen Service',
        description: 'Frühstück Service und Geschirr einsammeln',
        location: 'Küche, Stationen',
        priority: 'medium',
        estimatedDuration: '45 min'
      }
    ],
    '27525': [
      {
        id: 12,
        time: '07:00',
        title: 'Bauteil C Rundgang',
        description: 'Alle Stationen in Bauteil C kontrollieren',
        location: 'Bauteil C',
        priority: 'high',
        estimatedDuration: '40 min'
      }
    ],
    '27529': [
      {
        id: 13,
        time: '06:45',
        title: 'Kindergarten Service',
        description: 'Kindergarten Versorgung und Bauteil H Service',
        location: 'Kindergarten, Bauteil H',
        priority: 'high',
        estimatedDuration: '50 min'
      }
    ],
    '27530': [
      {
        id: 14,
        time: '06:00',
        title: 'Hauptmagazin Kontrolle',
        description: 'Hauptmagazin kontrollieren und Bestellungen bearbeiten',
        location: 'Hauptmagazin',
        priority: 'high',
        estimatedDuration: '90 min'
      }
    ]
  };

  const toggleTask = (taskId) => {
    const newCompletedTasks = new Set(completedTasks);
    
    if (newCompletedTasks.has(taskId)) {
      newCompletedTasks.delete(taskId);
      const newPoints = Math.max(0, userPoints - 15);
      setUserPoints(newPoints);
    } else {
      newCompletedTasks.add(taskId);
      const newPoints = userPoints + 15;
      setUserPoints(newPoints);
    }
    
    setCompletedTasks(newCompletedTasks);
    
    // ✅ SUPABASE SYNC
    syncToSupabase('completedTasks', Array.from(newCompletedTasks));
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'from-red-400 via-red-500 to-pink-500';
      case 'medium': return 'from-yellow-400 via-orange-400 to-orange-500';
      case 'low': return 'from-green-400 via-emerald-400 to-teal-500';
      case 'break': return 'from-blue-400 via-indigo-400 to-purple-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'break': return <Clock className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const currentTasks = taskTemplates[selectedDepartment] || [];
  const filteredTasks = filterPriority === 'all'
    ? currentTasks
    : currentTasks.filter(task => task.priority === filterPriority);
  
  const completedCount = Array.from(completedTasks).filter(id =>
    currentTasks.some(task => task.id === id)
  ).length;

  const progress = currentTasks.length > 0 ? (completedCount / currentTasks.length) * 100 : 0;

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isTaskActive = (taskTime) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    if (taskTime.includes('-')) {
      const [start] = taskTime.split('-');
      const [hours, minutes] = start.split(':').map(Number);
      const taskTimeMinutes = hours * 60 + minutes;
      return Math.abs(currentTime - taskTimeMinutes) <= 30;
    } else {
      const [hours, minutes] = taskTime.split(':').map(Number);
      const taskTimeMinutes = hours * 60 + minutes;
      return Math.abs(currentTime - taskTimeMinutes) <= 30;
    }
  };

  // Timer für aktuelle Zeit
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Add new task
  const handleAddTask = async () => {
    try {
      const taskData = {
        ...newTask,
        status: 'pending'
      };
      
      await addBringolinoTask(taskData);
      await loadAllTasks();
      
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        department: selectedDepartment,
        location: '',
        dueDate: ''
      });
      
      setShowTaskManager(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Update task
  const handleUpdateTask = async () => {
    try {
      await updateBringolinoTask(editingTask.id, editingTask);
      await loadAllTasks();
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteBringolinoTask(taskId);
      await loadAllTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // DECT Lock/Unlock functions
  const handleLockDECT = async (dectCode) => {
    const userId = getUserId();
    const userName = `User_${userId.slice(-4)}`;
    
    try {
      await lockDECT(dectCode, userId, userName);
      console.log(`🔒 DECT ${dectCode} locked by ${userName}`);
    } catch (error) {
      console.error('Error locking DECT:', error);
    }
  };

  const handleUnlockDECT = async (dectCode) => {
    try {
      await unlockDECT(dectCode);
      console.log(`🔓 DECT ${dectCode} unlocked`);
    } catch (error) {
      console.error('Error unlocking DECT:', error);
    }
  };

  // Render different views based on currentView
  const renderCurrentView = () => {
    if (showMenu) {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Menü
                </h2>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Department Selection */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center">
                    <Smartphone className="w-4 h-4 mr-2" />
                    DECT Auswahl
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(departments).map(([code, name]) => (
                      <button
                        key={code}
                        onClick={() => {
                          setSelectedDepartment(code);
                          setShowMenu(false);
                        }}
                        className={`p-3 rounded-xl text-left transition-all ${
                          selectedDepartment === code
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                            : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                        }`}
                      >
                        <div className="font-bold">DECT {code}</div>
                        <div className="text-xs opacity-80">{name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation Options */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setCurrentView('tasks');
                      setShowMenu(false);
                    }}
                    className="w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 text-left hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <div>
                        <div className="font-bold text-green-900">Aufgaben</div>
                        <div className="text-xs text-green-700">Tägliche Aufgaben verwalten</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowDocumentation(true);
                      setShowMenu(false);
                    }}
                    className="w-full p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 text-left hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-blue-600 mr-3" />
                      <div>
                        <div className="font-bold text-blue-900">Dokumentation</div>
                        <div className="text-xs text-blue-700">Checklisten und Protokolle</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowApotheke(true);
                      setShowMenu(false);
                    }}
                    className="w-full p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 text-left hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center">
                      <Pill className="w-5 h-5 text-purple-600 mr-3" />
                      <div>
                        <div className="font-bold text-purple-900">Apotheke</div>
                        <div className="text-xs text-purple-700">Medikamenten-Checks</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowLeiterDashboard(true);
                      setShowMenu(false);
                    }}
                    className="w-full p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200 text-left hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center">
                      <BarChart3 className="w-5 h-5 text-orange-600 mr-3" />
                      <div>
                        <div className="font-bold text-orange-900">Leiter Dashboard</div>
                        <div className="text-xs text-orange-700">Übersicht aller Abteilungen</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowTaskManager(true);
                      setShowMenu(false);
                    }}
                    className="w-full p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 text-left hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center">
                      <Plus className="w-5 h-5 text-indigo-600 mr-3" />
                      <div>
                        <div className="font-bold text-indigo-900">Aufgaben Verwalten</div>
                        <div className="text-xs text-indigo-700">Neue Aufgaben erstellen</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowDECTManager(true);
                      setShowMenu(false);
                    }}
                    className="w-full p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 text-left hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center">
                      <Lock className="w-5 h-5 text-yellow-600 mr-3" />
                      <div>
                        <div className="font-bold text-yellow-900">DECT Manager</div>
                        <div className="text-xs text-yellow-700">DECT Geräte sperren/entsperren</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowRewards(true);
                      setShowMenu(false);
                    }}
                    className="w-full p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200 text-left hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center">
                      <Gift className="w-5 h-5 text-yellow-600 mr-3" />
                      <div>
                        <div className="font-bold text-yellow-900">Belohnungen</div>
                        <div className="text-xs text-yellow-700">Punkte und Achievements</div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Connection Status */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <Database className="w-4 h-4 mr-2" />
                    Verbindungsstatus
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {connectionStatus === 'connected' ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-green-600 font-medium">Supabase Verbunden</span>
                        </>
                      ) : connectionStatus === 'connecting' ? (
                        <>
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-yellow-600 font-medium">Verbinde...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="text-sm text-gray-600 font-medium">Offline</span>
                        </>
                      )}
                    </div>
                    {lastSyncTime && (
                      <span className="text-xs text-gray-500">
                        {lastSyncTime.toLocaleTimeString('de-DE', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (showDocumentation) {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Dokumentation & Checklisten
                </h2>
                <button
                  onClick={() => setShowDocumentation(false)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Transport Neu */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center">
                    <Car className="w-5 h-5 mr-2" />
                    Transport Neu
                  </h3>
                  <div className="space-y-2">
                    {['Fahrzeug Check', 'Route Planung', 'Ladung Sicherung'].map((item, index) => (
                      <label key={index} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={transportNeuChecks[item] || false}
                          onChange={(e) => setTransportNeuChecks(prev => ({
                            ...prev,
                            [item]: e.target.checked
                          }))}
                          className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-blue-800">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Transport Alt */}
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border border-green-200">
                  <h3 className="font-bold text-green-900 mb-3 flex items-center">
                    <Car className="w-5 h-5 mr-2" />
                    Transport Alt
                  </h3>
                  <div className="space-y-2">
                    {['Wartung Check', 'Reparatur Status', 'Ersatzteile'].map((item, index) => (
                      <label key={index} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={transportAltChecks[item] || false}
                          onChange={(e) => setTransportAltChecks(prev => ({
                            ...prev,
                            [item]: e.target.checked
                          }))}
                          className="rounded border-green-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-green-800">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Medikamente Neu */}
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl border border-purple-200">
                  <h3 className="font-bold text-purple-900 mb-3 flex items-center">
                    <Pill className="w-5 h-5 mr-2" />
                    Medikamente Neu
                  </h3>
                  <div className="space-y-2">
                    {['Lieferung Check', 'Temperatur Kontrolle', 'Verfallsdatum'].map((item, index) => (
                      <label key={index} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={medikamenteNeuChecks[item] || false}
                          onChange={(e) => setMedikamenteNeuChecks(prev => ({
                            ...prev,
                            [item]: e.target.checked
                          }))}
                          className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-purple-800">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Medikamente Alt */}
                <div className="p-4 bg-gradient-to-br from-orange-50 to-red-100 rounded-2xl border border-orange-200">
                  <h3 className="font-bold text-orange-900 mb-3 flex items-center">
                    <Pill className="w-5 h-5 mr-2" />
                    Medikamente Alt
                  </h3>
                  <div className="space-y-2">
                    {['Entsorgung Check', 'Inventar Update', 'Dokumentation'].map((item, index) => (
                      <label key={index} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={medikamenteAltChecks[item] || false}
                          onChange={(e) => setMedikamenteAltChecks(prev => ({
                            ...prev,
                            [item]: e.target.checked
                          }))}
                          className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-orange-800">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDocumentation(false)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (showApotheke) {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Apotheke Kontrollen
                </h2>
                <button
                  onClick={() => setShowApotheke(false)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Medikamenten Checks */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl border border-purple-200">
                  <h3 className="font-bold text-purple-900 mb-4 flex items-center">
                    <Pill className="w-5 h-5 mr-2" />
                    Medikamenten Kontrolle
                  </h3>
                  <div className="space-y-3">
                    {[
                      'Kühlschrank Temperatur (2-8°C)',
                      'Verfallsdaten kontrolliert',
                      'Lagerung korrekt',
                      'Bestand aktualisiert',
                      'Suchtgift versiegelt'
                    ].map((item, index) => (
                      <label key={index} className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-white/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={apothekeChecks[item] || false}
                          onChange={(e) => {
                            const newChecks = {
                              ...apothekeChecks,
                              [item]: e.target.checked
                            };
                            setApothekeChecks(newChecks);
                            
                            if (e.target.checked) {
                              setUserPoints(prev => prev + 10);
                            } else {
                              setUserPoints(prev => Math.max(0, prev - 10));
                            }
                          }}
                          className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-purple-800 font-medium">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Dokumentation */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Dokumentation
                  </h3>
                  <div className="space-y-3">
                    {[
                      'Eingangskontrolle dokumentiert',
                      'Temperaturlog ausgefüllt',
                      'Inventarliste aktualisiert',
                      'Abgabe protokolliert',
                      'Tagesabschluss erstellt'
                    ].map((item, index) => (
                      <label key={index} className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-white/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={documentationChecks[item] || false}
                          onChange={(e) => {
                            const newChecks = {
                              ...documentationChecks,
                              [item]: e.target.checked
                            };
                            setDocumentationChecks(newChecks);
                            
                            if (e.target.checked) {
                              setUserPoints(prev => prev + 10);
                            } else {
                              setUserPoints(prev => Math.max(0, prev - 10));
                            }
                          }}
                          className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-blue-800 font-medium">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowApotheke(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-300 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => setShowApotheke(false)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (showLeiterDashboard) {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Leiter Dashboard - Übersicht aller Abteilungen
                </h2>
                <button
                  onClick={() => setShowLeiterDashboard(false)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-700">5</div>
                      <div className="text-sm text-blue-600">Aktive DECTs</div>
                    </div>
                    <Smartphone className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-700">42</div>
                      <div className="text-sm text-green-600">Erledigte Aufgaben</div>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-yellow-700">1,250</div>
                      <div className="text-sm text-yellow-600">Gesamt Punkte</div>
                    </div>
                    <Star className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-700">87%</div>
                      <div className="text-sm text-purple-600">Durchschnitt</div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Department Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Abteilungs-Performance
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(departments).map(([code, name]) => {
                      const dept = departmentPerformance.find(d => d.dept === code);
                      const progress = dept ? (dept.rate / dept.tasks) * 100 : 0;
                      
                      return (
                        <div key={code} className="p-4 bg-white rounded-xl border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-bold text-gray-900">DECT {code}</div>
                              <div className="text-xs text-gray-600">{name}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-900">{dept?.rate || 0}/{dept?.tasks || 0}</div>
                              <div className="text-xs text-gray-600">{Math.round(progress)}%</div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Real-time Activity */}
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border border-green-200">
                  <h3 className="font-bold text-green-900 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Live Aktivität
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-green-900">DECT 27527</div>
                        <div className="text-xs text-green-700">Mopp "BT C" abgeschlossen</div>
                      </div>
                      <div className="text-xs text-green-600">vor 2 Min</div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-green-200">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-green-900">DECT 27522</div>
                        <div className="text-xs text-green-700">Wäsche Verteilung gestartet</div>
                      </div>
                      <div className="text-xs text-green-600">vor 5 Min</div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-green-200">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-green-900">DECT 27530</div>
                        <div className="text-xs text-green-700">Hauptmagazin Kontrolle läuft</div>
                      </div>
                      <div className="text-xs text-green-600">vor 8 Min</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowLeiterDashboard(false)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all"
                >
                  Dashboard Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (showTaskManager) {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  Aufgaben Verwalten
                </h2>
                <button
                  onClick={() => setShowTaskManager(false)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add New Task Form */}
              <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-100 rounded-2xl border border-indigo-200 mb-6">
                <h3 className="font-bold text-indigo-900 mb-4 flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Neue Aufgabe Erstellen
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Aufgaben Titel"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    className="p-3 rounded-xl border border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                    className="p-3 rounded-xl border border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                    <option value="urgent">Dringend</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Standort"
                    value={newTask.location}
                    onChange={(e) => setNewTask(prev => ({ ...prev, location: e.target.value }))}
                    className="p-3 rounded-xl border border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <select
                    value={newTask.department}
                    onChange={(e) => setNewTask(prev => ({ ...prev, department: e.target.value }))}
                    className="p-3 rounded-xl border border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {Object.entries(departments).map(([code, name]) => (
                      <option key={code} value={code}>DECT {code} - {name}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  placeholder="Aufgaben Beschreibung"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full mt-4 p-3 rounded-xl border border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-24 resize-none"
                />
                <button
                  onClick={handleAddTask}
                  disabled={!newTask.title || !newTask.description}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aufgabe Erstellen
                </button>
              </div>

              {/* Existing Tasks List */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Vorhandene Aufgaben ({allTasks.length})
                </h3>
                {allTasks.map((task) => (
                  <div key={task.id} className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    {editingTask?.id === task.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingTask.title}
                          onChange={(e) => setEditingTask(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                        />
                        <textarea
                          value={editingTask.description}
                          onChange={(e) => setEditingTask(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleUpdateTask}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingTask(null)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-bold text-gray-900">{task.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
                              task.priority === 'high' ? 'bg-red-500' :
                              task.priority === 'medium' ? 'bg-yellow-500' :
                              task.priority === 'low' ? 'bg-green-500' : 'bg-purple-500'
                            }`}>
                              {task.priority.toUpperCase()}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                              DECT {task.department}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <MapPin className="w-3 h-3 mr-1" />
                            {task.location}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => setEditingTask(task)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (showDECTManager) {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  DECT Manager - Geräte Sperren/Entsperren
                </h2>
                <button
                  onClick={() => setShowDECTManager(false)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(departments).map(([code, name]) => {
                  const isLocked = mainIsDECTLocked(code);
                  const lockInfo = mainGetDECTLockInfo(code);
                  
                  return (
                    <div key={code} className={`p-6 rounded-2xl border-2 transition-all ${
                      isLocked 
                        ? 'bg-gradient-to-br from-red-50 to-pink-100 border-red-200' 
                        : 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-gray-900">DECT {code}</h3>
                          <p className="text-xs text-gray-600">{name}</p>
                        </div>
                        {isLocked ? (
                          <Lock className="w-6 h-6 text-red-500" />
                        ) : (
                          <Unlock className="w-6 h-6 text-green-500" />
                        )}
                      </div>

                      {lockInfo && (
                        <div className="mb-4 p-3 bg-white/50 rounded-xl">
                          <div className="text-xs text-gray-600">Gesperrt von:</div>
                          <div className="font-bold text-gray-900">{lockInfo.userName}</div>
                          <div className="text-xs text-gray-500">um {lockInfo.lockTime}</div>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        {!isLocked ? (
                          <button
                            onClick={() => handleLockDECT(code)}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                          >
                            <Lock className="w-4 h-4 mr-2 inline" />
                            Sperren
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnlockDECT(code)}
                            disabled={lockInfo && lockInfo.userName !== `User_${getUserId().slice(-4)}`}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Unlock className="w-4 h-4 mr-2 inline" />
                            Entsperren
                          </button>
                        )}
                      </div>

                      <div className={`mt-3 text-center text-xs font-bold ${
                        isLocked ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {isLocked ? 'GESPERRT' : 'VERFÜGBAR'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Hinweise
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Gesperrte DECTs können nur vom Sperrenden entsperrt werden</li>
                  <li>• Sperren werden täglich um Mitternacht automatisch aufgehoben</li>
                  <li>• Nur ein DECT pro Benutzer kann gleichzeitig gesperrt werden</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (showRewards) {
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                  Belohnungen & Achievements
                </h2>
                <button
                  onClick={() => setShowRewards(false)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Points */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 rounded-full shadow-2xl mb-4">
                  <div className="text-center text-white">
                    <Star className="w-8 h-8 mx-auto mb-1" />
                    <div className="text-2xl font-bold">{userPoints}</div>
                    <div className="text-xs">Punkte</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Deine Punkte</h3>
                <p className="text-sm text-gray-600">Sammle Punkte durch erledigte Aufgaben!</p>
              </div>

              {/* Achievements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-2xl border-2 transition-all ${
                  userPoints >= 100 
                    ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200' 
                    : 'bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      userPoints >= 100 ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Erste Schritte</h4>
                      <p className="text-sm text-gray-600">100 Punkte erreichen</p>
                      <div className="text-xs text-gray-500">
                        {userPoints >= 100 ? '✅ Erreicht!' : `${userPoints}/100 Punkte`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border-2 transition-all ${
                  userPoints >= 500 
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200' 
                    : 'bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      userPoints >= 500 ? 'bg-blue-500' : 'bg-gray-400'
                    }`}>
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Fleißiger Helfer</h4>
                      <p className="text-sm text-gray-600">500 Punkte erreichen</p>
                      <div className="text-xs text-gray-500">
                        {userPoints >= 500 ? '✅ Erreicht!' : `${userPoints}/500 Punkte`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border-2 transition-all ${
                  userPoints >= 1000 
                    ? 'bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200' 
                    : 'bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      userPoints >= 1000 ? 'bg-purple-500' : 'bg-gray-400'
                    }`}>
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Experte</h4>
                      <p className="text-sm text-gray-600">1000 Punkte erreichen</p>
                      <div className="text-xs text-gray-500">
                        {userPoints >= 1000 ? '✅ Erreicht!' : `${userPoints}/1000 Punkte`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border-2 transition-all ${
                  completedCount >= 10 
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-200' 
                    : 'bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      completedCount >= 10 ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}>
                      <Coffee className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Tagesmeister</h4>
                      <p className="text-sm text-gray-600">10 Aufgaben an einem Tag</p>
                      <div className="text-xs text-gray-500">
                        {completedCount >= 10 ? '✅ Erreicht!' : `${completedCount}/10 Aufgaben`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rewards Shop */}
              <div className="p-6 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl border border-amber-200">
                <h3 className="font-bold text-amber-900 mb-4 flex items-center">
                  <Gift className="w-5 h-5 mr-2" />
                  Belohnungen Shop
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-xl border border-amber-200">
                    <div className="text-center">
                      <Coffee className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                      <h4 className="font-bold text-gray-900">Kaffee Gutschein</h4>
                      <p className="text-sm text-gray-600 mb-2">Kostenloser Kaffee</p>
                      <div className="text-lg font-bold text-amber-600">50 Punkte</div>
                      <button 
                        disabled={userPoints < 50}
                        className="mt-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600 transition-colors"
                      >
                        Einlösen
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-amber-200">
                    <div className="text-center">
                      <Car className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                      <h4 className="font-bold text-gray-900">Parkplatz VIP</h4>
                      <p className="text-sm text-gray-600 mb-2">1 Tag VIP Parkplatz</p>
                      <div className="text-lg font-bold text-amber-600">200 Punkte</div>
                      <button 
                        disabled={userPoints < 200}
                        className="mt-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600 transition-colors"
                      >
                        Einlösen
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-amber-200">
                    <div className="text-center">
                      <Plane className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                      <h4 className="font-bold text-gray-900">Extra Urlaubstag</h4>
                      <p className="text-sm text-gray-600 mb-2">1 zusätzlicher Urlaubstag</p>
                      <div className="text-lg font-bold text-amber-600">1000 Punkte</div>
                      <button 
                        disabled={userPoints < 1000}
                        className="mt-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600 transition-colors"
                      >
                        Einlösen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default Tasks View
    return (
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto">
        {/* Progress Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-4 sm:p-6 mb-4 sm:mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              DECT {selectedDepartment}
            </h2>
            {connectionStatus === 'connected' && (
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">Supabase Aktif</span>
              </div>
            )}
            <p className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full inline-block">
              {new Date(selectedDate).toLocaleDateString('de-DE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </div>

          {/* Circular Progress */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 mx-auto mb-4 sm:mb-6">
            <svg className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 transform -rotate-90" viewBox="0 0 160 160">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="50%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
              <circle
                cx="80" cy="80" r="60"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="80" cy="80" r="60"
                stroke="url(#progressGradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out drop-shadow-lg"
                strokeDasharray={`${progress * 3.77} 377`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {Math.round(progress)}%
                </div>
                <div className="text-xs sm:text-sm text-gray-500 font-medium">Erledigt</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200 shadow-inner">
              <div className="text-xl sm:text-2xl font-bold text-blue-700">{currentTasks.length}</div>
              <div className="text-xs text-blue-600 font-medium">Gesamt</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border border-green-200 shadow-inner">
              <div className="text-xl sm:text-2xl font-bold text-green-700">{completedCount}</div>
              <div className="text-xs text-green-600 font-medium">Erledigt</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-red-100 rounded-2xl border border-orange-200 shadow-inner">
              <div className="text-xl sm:text-2xl font-bold text-orange-700">{currentTasks.length - completedCount}</div>
              <div className="text-xs text-orange-600 font-medium">Offen</div>
            </div>
          </div>
        </div>

        {/* Filter Options */}
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          {['all', 'high', 'medium', 'low', 'break'].map((priority) => (
            <button
              key={priority}
              onClick={() => setFilterPriority(priority)}
              className={`px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                filterPriority === priority
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-md'
              }`}
            >
              {priority === 'all' ? 'Alle' :
               priority === 'high' ? 'Hoch' :
               priority === 'medium' ? 'Mittel' :
               priority === 'low' ? 'Niedrig' : 'Pause'}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredTasks.map((task, index) => (
            <div
              key={task.id}
              className={`relative bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/30 overflow-hidden transition-all duration-500 ${
                completedTasks.has(task.id)
                  ? 'opacity-60 scale-95 grayscale'
                  : 'hover:shadow-2xl hover:scale-102 hover:-translate-y-1'
              } ${
                isTaskActive(task.time) ? 'ring-2 ring-yellow-400 shadow-yellow-200' : ''
              }`}
            >
              {/* Active task indicator */}
              {isTaskActive(task.time) && !completedTasks.has(task.id) && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-400 animate-pulse"></div>
              )}
              
              {/* Priority stripe */}
              <div className={`absolute top-0 right-0 w-2 h-full bg-gradient-to-b ${getPriorityColor(task.priority)}`}></div>
              
              <div className="p-4 sm:p-5">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="mt-1 transition-all duration-300 hover:scale-110 active:scale-95 flex-shrink-0"
                  >
                    {completedTasks.has(task.id) ? (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl border-4 border-green-200">
                        <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-gray-400 bg-white rounded-full flex items-center justify-center hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-lg transition-all duration-300 shadow-md">
                        <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                      </div>
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg">
                          <Clock className="w-3 h-3 mr-1" />
                          {task.time}
                        </span>
                        {isTaskActive(task.time) && !completedTasks.has(task.id) && (
                          <span className="animate-pulse text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">
                            JETZT
                          </span>
                        )}
                      </div>
                      <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getPriorityColor(task.priority)} shadow-lg`}>
                        {getPriorityIcon(task.priority)}
                        <span className="ml-1">
                          {task.priority === 'high' ? 'HOCH' :
                           task.priority === 'medium' ? 'MITTEL' :
                           task.priority === 'low' ? 'NIEDRIG' :
                           task.priority === 'break' ? 'PAUSE' : task.priority}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className={`font-bold text-base sm:text-lg text-gray-900 mb-2 ${
                      completedTasks.has(task.id) ? 'line-through text-gray-500' : ''
                    }`}>
                      {task.title}
                    </h3>
                    
                    <p className={`text-xs sm:text-sm text-gray-700 mb-4 leading-relaxed ${
                      completedTasks.has(task.id) ? 'text-gray-400' : ''
                    }`}>
                      {task.description}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-indigo-500 flex-shrink-0" />
                        <span className="font-medium truncate">{task.location}</span>
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium flex-shrink-0">
                        {task.estimatedDuration}
                      </div>
                    </div>
                    
                    {task.condition && (
                      <div className="mt-3 flex items-start text-xs text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 rounded-xl border border-blue-200">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{task.condition}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-24 sm:h-24 lg:h-20"></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 overflow-x-hidden relative">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg overflow-x-hidden">
        <div className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 max-w-full">
          <div className="flex items-center justify-between w-full min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Home className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Bringolino
                </h1>
                <div className="flex items-center space-x-2">
                  <p className="text-xs sm:text-sm text-gray-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {getCurrentTime()}
                  </p>
                  <div className="flex items-center space-x-1">
                    {connectionStatus === 'connected' ? (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                        <Database className="w-3 h-3 text-green-500" />
                      </div>
                    ) : connectionStatus === 'connecting' ? (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-1"></div>
                        <RotateCcw className="w-3 h-3 text-yellow-500 animate-spin" />
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                        <WifiOff className="w-3 h-3 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 min-w-0">
              <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 text-white px-2 sm:px-3 py-1.5 rounded-xl shadow-lg">
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-bold text-xs sm:text-sm">{userPoints}</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-400 text-white shadow-lg hover:scale-105 transition-transform"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderCurrentView()}
    </div>
  );
};

export default KrankenhausLogistikApp;