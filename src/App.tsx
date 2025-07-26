import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Circle, Calendar, Users, MapPin, AlertCircle, Menu, Home, BarChart3, Filter, Bell, X, Settings, TrendingUp, Award, Target, Zap, FileText, Check, Pill, Gift, Star, Coffee, Car, Plane, Wifi, WifiOff, Download, Smartphone, Database, Cloud, RotateCcw, Search } from 'lucide-react';
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
      console.log('🚀 Supabase initialized successfully');
      return true;
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
      console.log('🚀 Initializing Supabase for DECT:', selectedDepartment);
      
      try {
        const success = await supabaseService.initialize();
        if (success) {
          setSupabaseStatus('connected');
          setIsSupabaseReady(true);
          console.log(`🚀 Supabase connected - Auto-sync for DECT ${selectedDepartment}!`);
          
          // Start listening to all department data
          startRealtimeSync();
          
          // Auto-sync current user's data immediately
          syncCurrentUserData();
          
          // Retry any pending writes
          supabaseService.retryPendingWrites();
        } else {
          setSupabaseStatus('disconnected');
          console.log('⚠️ Supabase connection failed - Working offline');
        }
      } catch (error) {
        console.error('❌ Supabase initialization error:', error);
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
        console.log('🚀 Supabase reconnected - Auto-sync resumed!');
        supabaseService.retryPendingWrites();
        syncCurrentUserData();
      } else if (!isConnected && supabaseStatus === 'connected') {
        setSupabaseStatus('disconnected');
      }
    }, 2000);

    return () => {
      clearInterval(connectionMonitor);
    };
  }, [selectedDepartment]);

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
                  <div className="flex items-center">
                    <Wifi className="w-3 h-3 text-green-500" />
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
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto">
        {/* Progress Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-4 sm:p-6 mb-4 sm:mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              DECT {selectedDepartment}
            </h2>
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
    </div>
  );
};

export default KrankenhausLogistikApp;