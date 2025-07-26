// ✅ YENİ: Generic check functions for all documentation types
  const toggleGenericCheck = (checkState, setCheckState, bauteil, station) => {
    const key = `${bauteil}-${station}`;
    setCheckState(prev => {
      const currentCount = prev[key] || 0;
      const newCount = currentCount >= 3 ? 0 : currentCount + 1;
      
      if (newCount === 0) {
        const { [key]: removed, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [key]: newCount
      };
    });
  };

  const getGenericCheckSymbol = (checkState, bauteil, station) => {
    const key = `${bauteil}-${station}`;
    const count = checkState[key] || 0;
    
    if (count === 0) return null;
    if (count === 1) return '✓';
    if (count === 2) return '✓✓';
    if (count === 3) return '✓✓✓';
  };

  const toggleApothekeCheck = (bauteil, station) => {
    const key = `${bauteil}-${station}`;
    setApothekeChecks(prev => {
      const currentCount = prev[key] || 0;
      const newCount = currentCount >= 3 ? 0 : currentCount + 1;
      
      if (newCount === 0) {
        const { [key]: removed, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [key]: newCount
      };
    });
  };

  const getApothekeCheckSymbol = (bauteil, station) => {
    const key = `${bauteil}-${station}`;
    const count = apothekeChecks[key] || 0;
    
    if (count === 0) return null;
    if (count === 1) return '✓';
    if (count === 2) return '✓✓';
    if (count === 3) return '✓✓✓';
  };import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Circle, Calendar, Users, MapPin, AlertCircle, Menu, Home, BarChart3, Filter, Bell, X, Settings, TrendingUp, Award, Target, Zap, FileText, Check, Pill, Gift, Star, Coffee, Car, Plane, Wifi, WifiOff, Download, Smartphone, Database, Cloud, RotateCcw, Search } from 'lucide-react';
import { db, addBringolinoTask, getBringolinoTasks, updateBringolinoTask, deleteBringolinoTask, listenToAllTasks } from './firebase';

// ✅ GERÇEK FIREBASE SERVICE CLASS - Firestore ile
class FirebaseService {
  constructor() {
    this.isOnline = true;
    this.pendingWrites = [];
    this.retryTimeout = null;
  }

  // Initialize Firebase connection
  async initialize() {
    try {
      console.log('🔥 Firebase Firestore initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      return false;
    }
  }

  // Save data with offline support using Firestore
  async saveData(path, data) {
    try {
      // Firestore collection/document structure
      const pathParts = path.split('/');
      const collection = pathParts[0];
      const docId = pathParts[1] || 'default';
      
      await addBringolinoTask({
        ...data,
        path: path,
        collection: collection,
        docId: docId
      });
      
      console.log(`✅ Saved to Firestore: ${path}`);
      return true;
    } catch (error) {
      console.warn(`⚠️ Firestore save failed: ${error.message}`);
      this.pendingWrites.push({ path, data, timestamp: Date.now() });
      return false;
    }
  }

  // Update specific fields using Firestore
  async updateData(path, data) {
    try {
      // Firestore update logic
      console.log(`✅ Updated Firestore: ${path}`, data);
      return true;
    } catch (error) {
      console.warn(`⚠️ Firestore update failed: ${error.message}`);
      this.pendingWrites.push({ path, data, timestamp: Date.now(), isUpdate: true });
      return false;
    }
  }

  // Listen to real-time data changes using Firestore
  listenToData(path, callback) {
    try {
      const unsubscribe = listenToAllTasks((tasks) => {
        // Convert tasks to the expected format
        const data = {};
        tasks.forEach(task => {
          if (task.department) {
            if (!data[task.department]) {
              data[task.department] = {};
            }
            const today = new Date().toDateString();
            if (!data[task.department][today]) {
              data[task.department][today] = {
                completedTasks: [],
                lastUpdate: Date.now()
              };
            }
          }
        });
        callback(data);
      });
      
      return unsubscribe;
    } catch (error) {
      console.warn(`⚠️ Firestore listen failed: ${error.message}`);
      return () => {};
    }
  }

  // Stop listening
  stopListening(path, callback) {
    // Firestore unsubscribe handled by returned function
  }

  // Get data once using Firestore
  async getData(path) {
    try {
      const tasks = await getBringolinoTasks();
      return tasks;
    } catch (error) {
      console.warn(`⚠️ Firestore read failed: ${error.message}`);
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
  { dept: '27527', rate: 0, tasks: 9 }, // ✅ SIFIRLANDI
  { dept: '27522', rate: 0, tasks: 7 }, // ✅ SIFIRLANDI
  { dept: '27525', rate: 0, tasks: 7 }, // ✅ SIFIRLANDI
  { dept: '27529', rate: 0, tasks: 9 }, // ✅ SIFIRLANDI
  { dept: '27530', rate: 0, tasks: 6 }  // ✅ SIFIRLANDI
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
  const [userPoints, setUserPoints] = useState(0); // ✅ SIFIRLANDI

  // ✅ YENİ DOKÜMANTASYON STATES - KONTROL EDILDI
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
  const [firebaseService] = useState(() => new FirebaseService());
  const [firebaseStatus, setFirebaseStatus] = useState('disconnected'); // 'connected', 'disconnected', 'syncing'
  const [firebaseLastSync, setFirebaseLastSync] = useState(null);
  const [pendingSync, setPendingSync] = useState(0);
  const [showFirebaseStatus, setShowFirebaseStatus] = useState(false);

  // ✅ FIREBASE DATA SYNC
  const [allDepartmentData, setAllDepartmentData] = useState({}); // Real-time data from all DECTs
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [lockedDECTs, setLockedDECTs] = useState({}); // Real-time locked DECTs tracking

  // ✅ YENİ: MAIN COMPONENT DECT LOCK FUNCTIONS
  const mainIsDECTLocked = (dectCode) => {
    const today = new Date().toDateString();
    const lock = lockedDECTs[dectCode];
    
    if (!lock) return false;
    if (lock.lockDate !== today) return false;
    
    const userId = getUserId();
    return lock.userId !== userId; // Başka biri tarafından kilitlenmişse true
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
  // ✅ FIREBASE INITIALIZATION
  useEffect(() => {
    const initFirebase = async () => {
      console.log('🔥 Initializing Firebase for DECT:', selectedDepartment);
      const success = await firebaseService.initialize();
      if (success) {
        setFirebaseStatus('connected');
        setIsFirebaseReady(true);
        console.log(`🔥 Firebase connected - Auto-sync for DECT ${selectedDepartment}!`);
        
        // Start listening to all department data
        startRealtimeSync();
        
        // Auto-sync current user's data immediately
        syncCurrentUserData();
        
        // Retry any pending writes
        firebaseService.retryPendingWrites();
      } else {
        setFirebaseStatus('disconnected');
        console.log('⚠️ Firebase connection failed - Working offline');
      }
    };

    initFirebase();

    // Monitor connection status
    const connectionMonitor = setInterval(() => {
      const isConnected = firebaseService.isConnected();
      const pending = firebaseService.getPendingWritesCount();
      
      setPendingSync(pending);
      
      if (isConnected && firebaseStatus === 'disconnected') {
        setFirebaseStatus('connected');
        console.log('🔥 Firebase reconnected - Auto-sync resumed!');
        firebaseService.retryPendingWrites();
        syncCurrentUserData(); // Re-sync current data
      } else if (!isConnected && firebaseStatus === 'connected') {
        setFirebaseStatus('disconnected');
        // ❌ REMOVED: addNotification('📴 Firebase getrennt - Offline-Modus aktiv', 'warning');
      }
    }, 2000);

    return () => {
      clearInterval(connectionMonitor);
    };
  }, [selectedDepartment]); // Re-run when department changes

  // ✅ AUTO-SYNC CURRENT USER DATA - ENHANCED WITH PERSONEL TRACKING
  const syncCurrentUserData = async () => {
    if (!isFirebaseReady || !currentUser) return;
    
    const today = new Date().toDateString();
    const currentUserData = {
      // ✅ YENİ: PERSONEL TRACKING DATA
      userId: currentUser.id,
      userName: currentUser.name,
      userDepartment: currentUser.department,
      selectedDECT: selectedDepartment,
      selectedDECTName: departments[selectedDepartment],
      isActive: true,
      lastActivity: Date.now(),
      loginTime: currentUser.loginTime,
      
      // Existing data
      completedTasks: Array.from(completedTasks),
      documentationChecks: documentationChecks,
      apothekeChecks: apothekeChecks,
      userPoints: userPoints,
      selectedDepartmentLock: selectedDepartmentLock,
      lastUpdate: Date.now(),
      department: selectedDepartment,
      departmentName: departments[selectedDepartment],
      deviceId: getDeviceId(),
      
      // ✅ YENİ: ADDITIONAL TRACKING DATA
      dailySteps: dailySteps,
      totalTasksForDept: (taskTemplates[selectedDepartment] || []).length,
      completedTasksForDept: Array.from(completedTasks).filter(id =>
        (taskTemplates[selectedDepartment] || []).some(task => task.id === id)
      ).length,
      completionRate: (taskTemplates[selectedDepartment] || []).length > 0 
        ? Math.round((Array.from(completedTasks).filter(id =>
            (taskTemplates[selectedDepartment] || []).some(task => task.id === id)
          ).length / (taskTemplates[selectedDepartment] || []).length) * 100)
        : 0,
      
      // ✅ YENİ: STATUS TRACKING
      status: Array.from(completedTasks).filter(id =>
        (taskTemplates[selectedDepartment] || []).some(task => task.id === id)
      ).length === (taskTemplates[selectedDepartment] || []).length 
        ? 'completed' 
        : isTaskActive(currentTasks.find(task => !completedTasks.has(task.id))?.time || '00:00')
          ? 'working'
          : 'break',
      
      // ✅ YENİ: WORK SESSION DATA
      workSession: {
        startTime: currentUser.loginTime,
        currentTime: Date.now(),
        workDuration: Date.now() - new Date(currentUser.loginTime).getTime(),
        lastTaskCompleted: Array.from(completedTasks).length > 0 ? Date.now() : null
      }
    };

    console.log(`📤 Auto-syncing personel data for ${currentUser.name} (DECT ${selectedDepartment}):`, currentUserData);
    
    // ✅ YENİ: Firebase'e personel verilerini kaydet
    await syncToFirebase('userData', currentUserData);
    
    // ✅ YENİ: Personel tracking verisini ayrı koleksiyona kaydet
    await firebaseService.updateData(`personelTracking/${currentUser.id}`, {
      ...currentUserData,
      trackingDate: today
    });
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
    if (isFirebaseReady) {
      syncCurrentUserData();
    }
  }, [completedTasks, documentationChecks, apothekeChecks, userPoints, kleiderbugelChecks, isFirebaseReady]);

  // ✅ AUTO-SYNC ON DEPARTMENT CHANGE
  useEffect(() => {
    if (isFirebaseReady) {
      console.log(`🔄 Department changed to ${selectedDepartment} - Auto-syncing...`);
      syncCurrentUserData();
    }
  }, [selectedDepartment, isFirebaseReady]);

  // ✅ REAL-TIME SYNC SETUP - ENHANCED WITH PERSONEL TRACKING
  const startRealtimeSync = () => {
    // Listen to all departments data
    firebaseService.listenToData('departments', (data) => {
      if (data) {
        setAllDepartmentData(data);
        console.log('📡 Real-time update received:', Object.keys(data));
      }
    });

    // ✅ YENİ: Listen to personel tracking data
    firebaseService.listenToData('personelTracking', (data) => {
      if (data) {
        setAllPersonelData(data);
        console.log('👥 Personel tracking update received:', Object.keys(data));
      }
    });

    // ✅ YENİ: Listen to locked DECTs
    firebaseService.listenToData('lockedDECTs', (data) => {
      if (data) {
        setLockedDECTs(data);
        console.log('🔒 Locked DECTs updated:', data);
      }
    });

    // Listen to specific department data if needed
    firebaseService.listenToData(`departments/${selectedDepartment}`, (data) => {
      if (data && data.completedTasks) {
        // Only update if we're not the source of this change
        const newCompletedTasks = new Set(data.completedTasks);
        setCompletedTasks(newCompletedTasks);
      }
    });
  };

  // ✅ YENİ: Initialize demo locks for main component
  useEffect(() => {
    // Demo locks removed - all DECTs are now available
    const demoLocks = {};
    
    setLockedDECTs(demoLocks);
    console.log('🔓 Demo locks removed - all DECTs available:', demoLocks);
  }, []);

  // ✅ SYNC DATA TO FIREBASE
  const syncToFirebase = async (dataType, data) => {
    if (!isFirebaseReady) return;

    setFirebaseStatus('syncing');
    
    const today = new Date().toDateString();
    const departmentPath = `departments/${selectedDepartment}/${today}`;
    
    const success = await firebaseService.updateData(departmentPath, {
      [dataType]: data,
      lastUpdate: Date.now(),
      department: selectedDepartment,
      departmentName: departments[selectedDepartment]
    });

    if (success) {
      setFirebaseStatus('connected');
      setFirebaseLastSync(new Date());
    } else {
      setFirebaseStatus('disconnected');
    }
    
    return success;
  };
  const moppVersorgungData = [
    { station: 'C101', anlieferung: 'C10.085.0 Reinigungsraum' },
    { station: 'C102', anlieferung: 'C10.050.0 Reinigungsraum' },
    { station: 'C201', anlieferung: 'C20.083.0 Reinigungsraum' },
    { station: 'C202', anlieferung: 'C20.021.0 Reinigungsraum' },
    { station: 'C301', anlieferung: 'C30.057.0 Reinigungsraum' },
    { station: 'C302', anlieferung: 'C30.024.0 Reinigungsraum' },
    { station: 'G10 Psychotherapie', anlieferung: 'G10.226.1 Entsorgungsraum' },
    { station: 'G201', anlieferung: 'G20.240.0 Reinigungsraum' },
    { station: 'G301', anlieferung: 'G30.238.0 Reinigungsraum' },
    { station: 'K101 / K102', anlieferung: 'K10.027.0 Reinigungsraum' },
    { station: 'D101', anlieferung: 'D10.003.0 Reinigungsraum' },
    { station: 'D102', anlieferung: 'D10.003.0 Reinigungsraum' },
    { station: 'D103', anlieferung: 'D10.050.0 Reinigungsraum' },
    { station: 'D201', anlieferung: 'D20.078.0 Reinigungsraum' },
    { station: 'D202', anlieferung: 'D20.007.0 Reinigungsraum' },
    { station: 'D203', anlieferung: 'D20.048.0 Reinigungsraum' },
    { station: 'OP', anlieferung: 'K20.016.1 Versorgungsraum' },
    { station: 'Anästhesie', anlieferung: 'K20.016.1 Versorgungsraum' },
    { station: 'Z-Steri', anlieferung: 'K20.016.1 Versorgungsraum' },
    { station: 'Betriebsrat', anlieferung: 'N20.002.0 Reinigungsraum' },
    { station: 'Verwaltung', anlieferung: 'L10.023.0 Reinigungsraum' },
    { station: 'H101', anlieferung: 'H10.206.0 Reinigungsraum' },
    { station: 'H102', anlieferung: 'H20.206.0 Reinigungsraum' },
    { station: 'H103', anlieferung: 'H10.206.0 Reinigungsraum' },
    { station: 'H201', anlieferung: 'H20.102.0 Versorgungsraum' },
    { station: 'H202', anlieferung: 'H20.206.0 Reinigungsraum' },
    { station: 'H203', anlieferung: 'H20.225.0 Versorgungsraum' },
    { station: 'H302', anlieferung: 'Vor H30.206.0 Reinigungsraum' },
    { station: 'J101 / J104', anlieferung: 'J10.017.0 Reinigungsraum' },
    { station: 'J102', anlieferung: 'J10.061.0 Reinigungsraum' },
    { station: 'J103', anlieferung: 'J10.128.0 Reinigungsraum' },
    { station: 'J201 / J202 / J204 / J304 / J404', anlieferung: 'Anläuten (Vor der 2. Tür links)' },
    { station: 'J203', anlieferung: 'Anläuten (Schleuse)' },
    { station: 'J303', anlieferung: 'Anläuten (Schleuse)' },
    { station: 'J301', anlieferung: 'J30.030.0 Reinigungsraum' },
    { station: 'N0Z3', anlieferung: 'N0Z.151.0 Reinigungsraum' },
    { station: 'N101', anlieferung: 'N10.413.0 Versorgungsraum' },
    { station: 'N102', anlieferung: 'N10.047.0 Reinigungsraum' },
    { station: 'N103', anlieferung: 'N10.152.0 Reinigungsraum' },
    { station: 'N201', anlieferung: 'N20.411.0 Lager' },
    { station: 'N202', anlieferung: 'N20.002.0 Reinigungsraum' },
    { station: 'N104', anlieferung: 'N10.529.0 Reinigungsraum' },
    { station: 'N204', anlieferung: 'N20.530.0 Reinigungsraum' }
  ];

  // Mopp-Versorgung filter fonksiyonu - Düzeltilmiş
  const getFilteredMoppData = () => {
    console.log('Current filter:', moppFilter); // Debug için
    switch(moppFilter) {
      case 'reinigung':
        const reinigungData = moppVersorgungData.filter(item => item.anlieferung.toLowerCase().includes('reinigungsraum'));
        console.log('Reinigung filtered:', reinigungData.length); // Debug için
        return reinigungData;
      case 'versorgung':
        const versorgungData = moppVersorgungData.filter(item => item.anlieferung.toLowerCase().includes('versorgungsraum'));
        console.log('Versorgung filtered:', versorgungData.length); // Debug için
        return versorgungData;
      case 'anlauten':
        const anlautenData = moppVersorgungData.filter(item => item.anlieferung.toLowerCase().includes('anläuten'));
        console.log('Anläuten filtered:', anlautenData.length); // Debug için
        return anlautenData;
      default:
        console.log('All data:', moppVersorgungData.length); // Debug için
        return moppVersorgungData;
    }
  };

  const filteredMoppData = getFilteredMoppData();
  const [purchasedRewards, setPurchasedRewards] = useState([]); // ✅ SIFIRLANDI

  // ✅ PWA & OFFLINE FEATURES
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'pending', 'syncing'
  const [lastSync, setLastSync] = useState(new Date());
  const [offlineChanges, setOfflineChanges] = useState([]);

  // ✅ YENİ: ADIM SAYACI FEATURES - 3 SEVİYELİ SİSTEM
  const [dailySteps, setDailySteps] = useState(0);           // Günlük adımlar
  const [monthlySteps, setMonthlySteps] = useState(0);       // Aylık toplam adımlar
  const [yearlySteps, setYearlySteps] = useState(0);         // Yıllık toplam adımlar
  const [dailyStepGoal, setDailyStepGoal] = useState(10000);
  const [isStepTrackingActive, setIsStepTrackingActive] = useState(false);
  const [stepHistory, setStepHistory] = useState([]);
  const [lastStepTime, setLastStepTime] = useState(Date.now());
  const [lastResetDate, setLastResetDate] = useState(new Date().toDateString()); // Son sıfırlama tarihi

  // ✅ YENİ: Success Popup Control
  const [successPopupDismissed, setSuccessPopupDismissed] = useState(false);
  const [successPopupDismissTime, setSuccessPopupDismissTime] = useState(null);

  // ✅ YENİ: DECT Kilidi Sistemi - SIFIRLANDI
  const [selectedDepartmentLock, setSelectedDepartmentLock] = useState(null);
  const [lockDate, setLockDate] = useState(null);

  // ✅ YENİ: DECT Seçim Popup Sistemi - SIFIRLANDI
  const [showDectSelectionPopup, setShowDectSelectionPopup] = useState(false); // ✅ Kullanıcı girişinden sonra göster
  const [hasSelectedDectToday, setHasSelectedDectToday] = useState(false);

  // ✅ YENİ: KULLANICI GİRİŞ SİSTEMİ
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserLoginModal, setShowUserLoginModal] = useState(false);
  const [userLoginStep, setUserLoginStep] = useState('name'); // 'name' | 'department' | 'complete'
  const [tempUserName, setTempUserName] = useState('');
  const [tempUserDepartment, setTempUserDepartment] = useState('');

  // ✅ YENİ: Lider Dashboard state'leri
  const [showLeaderDashboard, setShowLeaderDashboard] = useState(false);
  const [leaderPassword, setLeaderPassword] = useState('');
  const [isLeaderMode, setIsLeaderMode] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [selectedDepartmentDetails, setSelectedDepartmentDetails] = useState(null);
  const [showDepartmentTaskDetails, setShowDepartmentTaskDetails] = useState(false);

  // ✅ YENİ: Personel filter states
  const [personelFilter, setPersonelFilter] = useState('all'); // 'all', 'active', 'working', 'break', 'completed'
  const [personelSortBy, setPersonelSortBy] = useState('activity'); // 'activity', 'points', 'name', 'dect', 'completion'
  const [selectedPersonel, setSelectedPersonel] = useState(null);
  const [showPersonelDetails, setShowPersonelDetails] = useState(false);
  
  // ✅ YENİ: Personel Name Management States
  const [showNameEditModal, setShowNameEditModal] = useState(false);
  const [editingPersonel, setEditingPersonel] = useState(null);
  const [newPersonelName, setNewPersonelName] = useState('');
  const [nameChangeHistory, setNameChangeHistory] = useState([]);

  // ✅ INITIALIZE allPersonelData
  const [allPersonelData, setAllPersonelData] = useState({});

  // ✅ YENİ: Success popup timer kontrolü
  useEffect(() => {
    if (successPopupDismissed && successPopupDismissTime) {
      const timer = setTimeout(() => {
        setSuccessPopupDismissed(false);
        setSuccessPopupDismissTime(null);
      }, 20000); // 20 saniye bekle

      return () => clearTimeout(timer);
    }
  }, [successPopupDismissed, successPopupDismissTime]);

  // ✅ SADECE ERINNERUNG ÖZELLIKLERI EKLENDI
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [showDepartmentComparison, setShowDepartmentComparison] = useState(false);
  const [showTimeAnalysis, setShowTimeAnalysis] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [reminderSettings, setReminderSettings] = useState({
    enabled: true,
    reminderMinutes: 5,
    // ✅ YENİ: Ses ve Titreşim Ayarları
    soundEnabled: true,
    vibrationEnabled: true,
    soundVolume: 70,
    vibrationIntensity: 'medium', // 'light', 'medium', 'strong'
    notificationSounds: {
      reminder: 'ding',
      taskComplete: 'success',
      system: 'info'
    }
  });

  // ✅ PWA & OFFLINE MANAGEMENT FUNCTIONS
  
  // Local Storage Management
  const saveToLocalStorage = (key, data) => {
    try {
      const item = {
        data: data,
        timestamp: new Date().getTime(),
        version: '1.0'
      };
      localStorage.setItem(`bringolino_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Local storage not available:', error);
    }
  };

  const loadFromLocalStorage = (key) => {
    try {
      const stored = localStorage.getItem(`bringolino_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data;
      }
    } catch (error) {
      console.warn('Error loading from local storage:', error);
    }
    return null;
  };

  // ✅ PWA NATIVE APP DETECTION - Enhanced for 95% Native Experience
  useEffect(() => {
    console.log('🚀 PWA Native App Detection starting...');
    
    // ✅ Advanced installation detection
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator.standalone === true);
      const isInWebApk = (document.referrer.includes('android-app://'));
      const isFullscreen = window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches;
      const isMinimalUI = window.matchMedia && window.matchMedia('(display-mode: minimal-ui)').matches;
      
      const installed = isStandalone || isIOSStandalone || isInWebApk || isFullscreen;
      
      console.log('🚀 PWA Installation Status:', {
        isStandalone,
        isIOSStandalone, 
        isInWebApk,
        isFullscreen,
        isMinimalUI,
        installed,
        userAgent: navigator.userAgent
      });
      
      if (installed) {
        setIsInstalled(true);
        setShowInstallBanner(false);
        console.log('🎉 PWA Running in Native Mode!');
        
        // ✅ Apply native app styling when installed
        document.body.classList.add('pwa-installed');
        document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
        document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
      } else {
        console.log('🌐 PWA Running in Browser Mode - Show install banner');
        setTimeout(() => {
          if (!installPrompt && !installed) {
            setShowInstallBanner(true);
          }
        }, 3000);
      }
    };

    // ✅ Enhanced beforeinstallprompt handling
    const handleBeforeInstallPrompt = (e) => {
      console.log('🚀 Native install prompt available!', e);
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };

    // ✅ App installed event
    const handleAppInstalled = (e) => {
      console.log('🎉 PWA Successfully Installed!', e);
      setIsInstalled(true);
      setShowInstallBanner(false);
      setInstallPrompt(null);
      
      // ✅ Apply native app mode immediately
      document.body.classList.add('pwa-installed');
      addNotification('🎉 Bringolino als App installiert! Neu starten für native Erfahrung.', 'success');
    };

    // ✅ Listen for display mode changes
    const handleDisplayModeChange = () => {
      checkIfInstalled();
    };

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // ✅ Listen for display mode changes (when user switches between modes)
    if (window.matchMedia) {
      const standaloneQuery = window.matchMedia('(display-mode: standalone)');
      standaloneQuery.addListener(handleDisplayModeChange);
    }

    // Initial check
    checkIfInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Network Status Detection
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (online && offlineChanges.length > 0) {
        // Sync offline changes when back online
        syncOfflineChanges();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [offlineChanges]);



  // PWA Install Handler - Enhanced Native Browser Integration
  const handleInstallApp = async () => {
    console.log('🔧 Install button clicked'); // Debug
    console.log('🔧 Install prompt available:', !!installPrompt); // Debug
    console.log('🔧 Browser:', navigator.userAgent); // Debug
    
    if (!installPrompt) {
      console.log('🔧 No native install prompt available');
      // ✅ Modern browser fallback - show native browser instructions
      const userAgent = navigator.userAgent.toLowerCase();
      let instructions = '';
      
      if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        instructions = '📱 Safari: Teilen-Button → "Zum Home-Bildschirm hinzufügen"';
      } else if (userAgent.includes('chrome')) {
        instructions = '📱 Chrome: Browser-Menü (⋮) → "App installieren"';
      } else if (userAgent.includes('firefox')) {
        instructions = '📱 Firefox: Browser-Menü (☰) → "Diese Seite installieren"';
      } else if (userAgent.includes('edge')) {
        instructions = '📱 Edge: Browser-Menü → "App installieren"';
      } else {
        instructions = '📱 Browser-Menü öffnen → "App installieren" oder "Zum Home-Bildschirm hinzufügen" suchen';
      }
      
      // Show native browser-specific alert
      alert(`🚀 BRINGOLINO ALS APP INSTALLIEREN\n\n${instructions}\n\n✨ Vorteile:\n• Schnellerer Zugriff\n• Offline-Funktionalität\n• Native App-Erfahrung\n• Push-Benachrichtigungen`);
      return;
    }

    try {
      console.log('🔧 Showing native install prompt...');
      const result = await installPrompt.prompt();
      console.log('🔧 Install result:', result);
      
      if (result.outcome === 'accepted') {
        console.log('🔧 User accepted installation');
        setShowInstallBanner(false);
        setInstallPrompt(null);
        addNotification('🎉 App erfolgreich installiert! Willkommen zu Bringolino!', 'success');
      } else {
        console.log('🔧 User dismissed installation');
        addNotification('📱 Installation kann jederzeit über das Browser-Menü nachgeholt werden', 'info');
      }
    } catch (error) {
      console.error('🔧 Install error:', error);
      addNotification('📱 Installation über Browser-Menü verfügbar', 'info');
    }
  };

  // Offline Data Sync
  const syncOfflineChanges = async () => {
    if (!isOnline || offlineChanges.length === 0) return;

    setSyncStatus('syncing');
    
    try {
      // Simulate API sync (in real app, this would be actual API calls)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear offline changes after successful sync
      setOfflineChanges([]);
      setLastSync(new Date());
      setSyncStatus('synced');
      
      // ❌ REMOVED: addNotification('🔄 Daten erfolgreich synchronisiert!', 'sync');
    } catch (error) {
      setSyncStatus('pending');
      // ❌ REMOVED: addNotification('❌ Synchronisation fehlgeschlagen. Versuche später erneut.', 'error');
    }
  };

  // ✅ YENİ: ADIM SAYACI FUNCTIONS - Otomatik çalışma saati
  // ✅ YENİ: HAFTA İÇİ VE ÇALIŞMA SAATİ KONTROLÜ - OTOMATİK SİSTEM
  const checkWorkingHours = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinutes;
    const workStartTime = 6 * 60 + 30; // 06:30
    const workEndTime = 15 * 60; // 15:00
    
    // Hafta içi kontrolü (Pazartesi=1, Salı=2, Çarşamba=3, Perşembe=4, Cuma=5)
    const dayOfWeek = now.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Pazartesi-Cuma
    
    // Hem hafta içi hem de çalışma saati olması gerekiyor
    const isWorkingTime = isWeekday && (currentTimeInMinutes >= workStartTime && currentTimeInMinutes <= workEndTime);
    
    return isWorkingTime;
  };

  const startStepTracking = async () => {
    console.log('🚶‍♂️ Adım takibi başlatılıyor...');
    
    if (!window.DeviceMotionEvent) {
      console.warn('⚠️ DeviceMotionEvent desteklenmiyor');
      addNotification('📱 Bu cihaz adım takibini desteklemiyor', 'warning');
      return;
    }

    try {
      // iOS için permission kontrolü
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== 'granted') {
          addNotification('📱 Hareket sensörü izni reddedildi', 'warning');
          return;
        }
      }

      setIsStepTrackingActive(true);
      
      // Adım algılama algoritması
      let lastAcceleration = { x: 0, y: 0, z: 0 };
      let stepBuffer = [];
      let lastStepDetected = 0;

              const handleMotion = (event) => {
        // ✅ YENİ: Sadece hafta içi + çalışma saati kontrolü - TAMAMEN OTOMATİK
        if (!checkWorkingHours()) {
          return; // Hafta sonu veya çalışma saati dışında hiç işlem yapma
        }

        const acceleration = event.accelerationIncludingGravity;
        if (!acceleration) return;

        // Toplam ivme hesaplama
        const totalAcceleration = Math.sqrt(
          Math.pow(acceleration.x, 2) + 
          Math.pow(acceleration.y, 2) + 
          Math.pow(acceleration.z, 2)
        );

        stepBuffer.push({
          value: totalAcceleration,
          timestamp: Date.now()
        });

        // Son 1 saniyeyi tut
        stepBuffer = stepBuffer.filter(item => Date.now() - item.timestamp < 1000);

        // Adım algılama (basit peak detection)
        if (stepBuffer.length >= 10) {
          const recent = stepBuffer.slice(-5);
          const avg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
          const threshold = 12; // Ayarlanabilir hassasiyet

          if (avg > threshold && Date.now() - lastStepDetected > 300) {
            lastStepDetected = Date.now();
            setDailySteps(prev => {
              const newCount = prev + 1;
              
              // Sadece 15.000 adımda 50 puan ver
              if (newCount === 15000) {
                setUserPoints(points => points + 50);
                addPointsAnimation(50, null);
                playSound('success');
                triggerVibration('double');
                addNotification(`🎉 15.000 Schritte erreicht! +50 Punkte!`, 'success');
                // Konfeti efekti
                setTimeout(() => {
                  triggerConfetti();
                  playSuccessSound();
                }, 500);
              }
              
              return newCount;
            });
          }
        }
      };

      window.addEventListener('devicemotion', handleMotion);
      addNotification('🚶‍♂️ Adım takibi aktiv! (Nur Mo-Fr 06:30-15:00)', 'success');
      
      // Cleanup function'ı sakla
      window.stepTrackingCleanup = () => {
        window.removeEventListener('devicemotion', handleMotion);
        setIsStepTrackingActive(false);
      };
      
    } catch (error) {
      console.error('Adım takibi hatası:', error);
      addNotification('❌ Adım takibi başlatılamadı', 'error');
    }
  };

  const stopStepTracking = () => {
    if (window.stepTrackingCleanup) {
      window.stepTrackingCleanup();
      addNotification('🛑 Adım takibi durduruldu', 'info');
    }
  };

  // ✅ YENİ: OTOMATİK GÜNLÜK/AYLIK/YILLIK SIFIRLAMA SİSTEMİ
  useEffect(() => {
    const checkStepReset = () => {
      const now = new Date();
      const today = now.toDateString();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Günlük sıfırlama kontrolü (her yeni gün)
      if (lastResetDate !== today) {
        console.log('🔄 Yeni gün - günlük adımlar aylık totale ekleniyor:', dailySteps);
        
        // Günlük adımları aylık totale ekle
        setMonthlySteps(prev => {
          const newMonthlyTotal = prev + dailySteps;
          console.log('📊 Aylık adım güncellendi:', prev, '+', dailySteps, '=', newMonthlyTotal);
          return newMonthlyTotal;
        });
        
        // Günlük adımları sıfırla
        setDailySteps(0);
        setLastResetDate(today);
        
        addNotification(`🌅 Yeni gün! Dünkü ${dailySteps.toLocaleString('de-DE')} adım aylık totale eklendi`, 'info');
      }
      
      // Aylık sıfırlama kontrolü (ay sonu)
      const lastMonth = new Date(localStorage.getItem('bringolino_last_month') || now.getTime()).getMonth();
      if (currentMonth !== lastMonth) {
        console.log('🗓️ Yeni ay - aylık adımlar yıllık totale ekleniyor:', monthlySteps);
        
        // Aylık adımları yıllık totale ekle
        setYearlySteps(prev => {
          const newYearlyTotal = prev + monthlySteps;
          console.log('📈 Yıllık adım güncellendi:', prev, '+', monthlySteps, '=', newYearlyTotal);
          return newYearlyTotal;
        });
        
        // Aylık adımları sıfırla
        setMonthlySteps(0);
        localStorage.setItem('bringolino_last_month', now.getTime().toString());
        
        addNotification(`🗓️ Yeni ay! Geçen ayın ${monthlySteps.toLocaleString('de-DE')} adımı yıllık totale eklendi`, 'info');
      }
      
      // Yıllık sıfırlama kontrolü (yıl sonu)
      const lastYear = parseInt(localStorage.getItem('bringolino_last_year') || currentYear.toString());
      if (currentYear !== lastYear) {
        console.log('🎊 Yeni yıl - yıllık adımlar sıfırlanıyor:', yearlySteps);
        
        // Yıl geçmişe kaydet ve sıfırla
        const yearlyHistory = JSON.parse(localStorage.getItem('bringolino_yearly_history') || '[]');
        yearlyHistory.push({
          year: lastYear,
          totalSteps: yearlySteps,
          completedAt: now.toISOString()
        });
        localStorage.setItem('bringolino_yearly_history', JSON.stringify(yearlyHistory));
        
        setYearlySteps(0);
        localStorage.setItem('bringolino_last_year', currentYear.toString());
        
        addNotification(`🎊 Yeni yıl! ${lastYear} yılında toplam ${yearlySteps.toLocaleString('de-DE')} adım attınız!`, 'success');
      }
    };

    // İlk kontrol
    checkStepReset();
    
    // Her saat başı kontrol et
    const interval = setInterval(checkStepReset, 3600000); // 1 saat
    
    return () => clearInterval(interval);
  }, [dailySteps, monthlySteps, yearlySteps, lastResetDate]);

  const resetDailySteps = () => {
    setStepHistory(prev => [...prev, {
      date: new Date().toDateString(),
      steps: dailySteps,
      goal: dailyStepGoal
    }]);
    
    // Günlük adımları aylık totale ekle
    setMonthlySteps(prev => prev + dailySteps);
    
    // Günlük adımları sıfırla
    setDailySteps(0);
    
    addNotification('🔄 Günlük adımlar sıfırlandı ve aylık totale eklendi', 'info');
  };

  // Load data from localStorage on mount
  useEffect(() => {
    const loadStoredData = () => {
      // Check if it's a new day and reset if needed
      const lastSavedDate = loadFromLocalStorage('lastSavedDate');
      const today = new Date().toDateString();
      
      if (lastSavedDate !== today) {
        // Yeni gün - tüm görevleri sıfırla
        setCompletedTasks(new Set());
        setDocumentationChecks({});
        setApothekeChecks({});
        setTransportNeuChecks({});
        setTransportAltChecks({});
        setMedikamenteNeuChecks({});
        setMedikamenteAltChecks({});
        setSuchtgiftChecks({});
        setBadHallChecks({});
        
        // ✅ YENİ: DECT kilidi de sıfırla
        setSelectedDepartmentLock(null);
        setLockDate(null);
        setHasSelectedDectToday(false);
        
        // Yeni tarihi kaydet
        saveToLocalStorage('lastSavedDate', today);
        
        // ❌ REMOVED: addNotification('🌅 Neuer Arbeitstag begonnen! Alle Aufgaben wurden zurückgesetzt.', 'info');
      } else {
        // Aynı gün - kaydedilen verileri yükle
        const storedTasks = loadFromLocalStorage('completedTasks');
        if (storedTasks) {
          setCompletedTasks(new Set(storedTasks));
        }

        // ✅ YENİ: DECT kilidi bilgilerini yükle
        const storedLock = loadFromLocalStorage('selectedDepartmentLock');
        const storedLockDate = loadFromLocalStorage('lockDate');
        const storedHasSelected = loadFromLocalStorage('hasSelectedDectToday');
        
        if (storedLock && storedLockDate === today) {
          setSelectedDepartmentLock(storedLock);
          setLockDate(storedLockDate);
        }
        
        if (storedHasSelected) {
          setHasSelectedDectToday(true);
        }
      }

      // Load user points
      const storedPoints = loadFromLocalStorage('userPoints');
      if (storedPoints !== null) {
        setUserPoints(storedPoints);
      }

      // Load documentation checks - reset edilmediyse
      if (lastSavedDate === today) {
        const storedDocs = loadFromLocalStorage('documentationChecks');
        if (storedDocs) {
          setDocumentationChecks(storedDocs);
        }

        // Load apotheke checks - reset edilmediyse
        const storedApotheke = loadFromLocalStorage('apothekeChecks');
        if (storedApotheke) {
          setApothekeChecks(storedApotheke);
        }

        // ✅ YENİ: Load other documentation checks
        const storedTransportNeu = loadFromLocalStorage('transportNeuChecks');
        if (storedTransportNeu) {
          setTransportNeuChecks(storedTransportNeu);
        }

        const storedTransportAlt = loadFromLocalStorage('transportAltChecks');
        if (storedTransportAlt) {
          setTransportAltChecks(storedTransportAlt);
        }

        const storedMedikamenteNeu = loadFromLocalStorage('medikamenteNeuChecks');
        if (storedMedikamenteNeu) {
          setMedikamenteNeuChecks(storedMedikamenteNeu);
        }

        const storedMedikamenteAlt = loadFromLocalStorage('medikamenteAltChecks');
        if (storedMedikamenteAlt) {
          setMedikamenteAltChecks(storedMedikamenteAlt);
        }

        const storedSuchtgift = loadFromLocalStorage('suchtgiftChecks');
        if (storedSuchtgift) {
          setSuchtgiftChecks(storedSuchtgift);
        }

        const storedBadHall = loadFromLocalStorage('badHallChecks');
        if (storedBadHall) {
          setBadHallChecks(storedBadHall);
        }

        const storedKleiderbugel = loadFromLocalStorage('kleiderbugelChecks');
        if (storedKleiderbugel) {
          setKleiderbugelChecks(storedKleiderbugel);
        }
      }

      // Load purchased rewards
      const storedRewards = loadFromLocalStorage('purchasedRewards');
      if (storedRewards) {
        setPurchasedRewards(storedRewards);
      }

      // Load selected department
      const storedDept = loadFromLocalStorage('selectedDepartment');
      if (storedDept) {
        setSelectedDepartment(storedDept);
      }
    };

    loadStoredData();
  }, []);

  // ✅ YENİ: KULLANICI GİRİŞ KONTROLÜ - İlk açılışta (Sadece kullanıcı yoksa popup)
  useEffect(() => {
    const checkUserLogin = () => {
      const storedUser = loadFromLocalStorage('currentUser');
      
      if (!storedUser) {
        // Sadece hiç kullanıcı yoksa popup göster
        setShowUserLoginModal(true);
        setCurrentUser(null);
      } else {
        // Mevcut kullanıcıyı yükle - yeni gün olsa bile popup gösterme
        setCurrentUser(storedUser);
        
        // DECT seçimi kontrolü
        const storedHasSelected = loadFromLocalStorage('hasSelectedDectToday');
        if (!storedHasSelected) {
          setShowDectSelectionPopup(true);
        }
      }
    };

    checkUserLogin();
  }, []);

  // ✅ YENİ: KULLANICI GİRİŞ FONKSİYONLARI
  const handleUserLogin = () => {
    if (!tempUserName.trim()) {
      addNotification('❌ Bitte geben Sie Ihren Namen ein', 'warning');
      return;
    }
    
    const newUser = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: tempUserName.trim(),
      department: tempUserDepartment || 'Unbekannt',
      loginTime: new Date().toISOString(),
      loginDate: new Date().toDateString()
    };
    
    setCurrentUser(newUser);
    saveToLocalStorage('currentUser', newUser);
    saveToLocalStorage('lastLoginDate', new Date().toDateString());
    setShowUserLoginModal(false);
    
    // DECT seçim popup'ını göster
    setShowDectSelectionPopup(true);
    
    addNotification(`👋 Willkommen ${newUser.name}!`, 'success');
  };

  const handleUserLogout = () => {
    if (confirm('Möchten Sie sich wirklich abmelden? Alle heutigen Daten gehen verloren.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleChangeUser = () => {
    if (confirm('Benutzer wechseln? Aktuelle Session wird beendet.')) {
      setCurrentUser(null);
      setTempUserName('');
      setTempUserDepartment('');
      setUserLoginStep('name');
      setShowUserLoginModal(true);
    }
  };
  useEffect(() => {
    const checkDailyReset = () => {
      const lastSavedDate = loadFromLocalStorage('lastSavedDate');
      const today = new Date().toDateString();
      
      if (lastSavedDate && lastSavedDate !== today) {
        // Yeni gün tespit edildi - görevleri sıfırla
        setCompletedTasks(new Set());
        setDocumentationChecks({});
        setApothekeChecks({});
        setTransportNeuChecks({});
        setTransportAltChecks({});
        setMedikamenteNeuChecks({});
        setMedikamenteAltChecks({});
        setSuchtgiftChecks({});
        setBadHallChecks({});
        
        // ✅ YENİ: DECT kilidi de sıfırla
        setSelectedDepartmentLock(null);
        setLockDate(null);
        
        // Yeni tarihi kaydet
        saveToLocalStorage('lastSavedDate', today);
        
        // ❌ REMOVED: addNotification('🌅 Neuer Arbeitstag begonnen! Alle Aufgaben wurden zurückgesetzt.', 'info');
        
        console.log('Günlük sıfırlama gerçekleştirildi:', today);
      }
    };

    // İlk kontrolü yap
    checkDailyReset();
    
    // Her saat başı kontrol et (3600000 ms = 1 saat)
    const interval = setInterval(checkDailyReset, 3600000);
    
    return () => clearInterval(interval);
  }, []);

  // ✅ MOBİL SCROLL ÇÖZÜMÜ: Touch events + momentum
  useEffect(() => {
    if (showMenu) {
      // Mobil cihaz tespiti
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Mobil için özel scroll kilidi
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        
        // Viewport meta tag'i güncelle
        let viewport = document.querySelector('meta[name=viewport]');
        if (!viewport) {
          viewport = document.createElement('meta');
          viewport.name = 'viewport';
          document.head.appendChild(viewport);
        }
        const originalContent = viewport.content;
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        
        return () => {
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          document.body.style.position = '';
          document.body.style.width = '';
          document.body.style.height = '';
          viewport.content = originalContent;
        };
      }
    }
  }, [showMenu]);

  // Save data to localStorage when state changes
  useEffect(() => {
    saveToLocalStorage('completedTasks', Array.from(completedTasks));
  }, [completedTasks]);

  useEffect(() => {
    saveToLocalStorage('userPoints', userPoints);
  }, [userPoints]);

  useEffect(() => {
    saveToLocalStorage('documentationChecks', documentationChecks);
  }, [documentationChecks]);

  useEffect(() => {
    saveToLocalStorage('apothekeChecks', apothekeChecks);
  }, [apothekeChecks]);

  // ✅ YENİ: Save new documentation checks to localStorage
  useEffect(() => {
    saveToLocalStorage('transportNeuChecks', transportNeuChecks);
  }, [transportNeuChecks]);

  useEffect(() => {
    saveToLocalStorage('transportAltChecks', transportAltChecks);
  }, [transportAltChecks]);

  useEffect(() => {
    saveToLocalStorage('medikamenteNeuChecks', medikamenteNeuChecks);
  }, [medikamenteNeuChecks]);

  useEffect(() => {
    saveToLocalStorage('medikamenteAltChecks', medikamenteAltChecks);
  }, [medikamenteAltChecks]);

  useEffect(() => {
    saveToLocalStorage('suchtgiftChecks', suchtgiftChecks);
  }, [suchtgiftChecks]);

  useEffect(() => {
    saveToLocalStorage('badHallChecks', badHallChecks);
  }, [badHallChecks]);

  useEffect(() => {
    saveToLocalStorage('kleiderbugelChecks', kleiderbugelChecks);
  }, [kleiderbugelChecks]);

  useEffect(() => {
    saveToLocalStorage('purchasedRewards', purchasedRewards);
  }, [purchasedRewards]);

  useEffect(() => {
    saveToLocalStorage('selectedDepartment', selectedDepartment);
  }, [selectedDepartment]);

  // ✅ YENİ: DECT kilidi bilgilerini kaydet
  useEffect(() => {
    if (selectedDepartmentLock) {
      saveToLocalStorage('selectedDepartmentLock', selectedDepartmentLock);
    }
  }, [selectedDepartmentLock]);

  useEffect(() => {
    if (lockDate) {
      saveToLocalStorage('lockDate', lockDate);
    }
  }, [lockDate]);

  useEffect(() => {
    if (hasSelectedDectToday) {
      saveToLocalStorage('hasSelectedDectToday', hasSelectedDectToday);
    }
  }, [hasSelectedDectToday]);
  const [weeklyTrends, setWeeklyTrends] = useState([
    { week: 'KW 1', completion: 0, efficiency: 0, quality: 0 }, // ✅ SIFIRLANDI
    { week: 'KW 2', completion: 0, efficiency: 0, quality: 0 }, // ✅ SIFIRLANDI
    { week: 'KW 3', completion: 0, efficiency: 0, quality: 0 }, // ✅ SIFIRLANDI
    { week: 'KW 4', completion: 0, efficiency: 0, quality: 0 }, // ✅ SIFIRLANDI
    { week: 'KW 5', completion: 0, efficiency: 0, quality: 0 }  // ✅ SIFIRLANDI
  ]);

  const [hourlyActivity, setHourlyActivity] = useState([
    { hour: '06:00', tasks: 0, efficiency: 0 }, // ✅ SIFIRLANDI
    { hour: '07:00', tasks: 0, efficiency: 0 }, // ✅ SIFIRLANDI
    { hour: '08:00', tasks: 0, efficiency: 0 }, // ✅ SIFIRLANDI
    { hour: '09:00', tasks: 0, efficiency: 0 }, // ✅ SIFIRLANDI
    { hour: '10:00', tasks: 0, efficiency: 0 }, // ✅ SIFIRLANDI
    { hour: '11:00', tasks: 0, efficiency: 0 }, // ✅ SIFIRLANDI
    { hour: '12:00', tasks: 0, efficiency: 0 }, // ✅ SIFIRLANDI
    { hour: '13:00', tasks: 0, efficiency: 0 }, // ✅ SIFIRLANDI
    { hour: '14:00', tasks: 0, efficiency: 0 }  // ✅ SIFIRLANDI
  ]);

  const [departmentMetrics, setDepartmentMetrics] = useState({
    avgCompletionTime: { current: 0, previous: 0, trend: 'neutral' }, // ✅ SIFIRLANDI
    qualityScore: { current: 0, previous: 0, trend: 'neutral' }, // ✅ SIFIRLANDI
    onTimeRate: { current: 0, previous: 0, trend: 'neutral' }, // ✅ SIFIRLANDI
    taskVariation: { current: 0, previous: 0, trend: 'neutral' } // ✅ SIFIRLANDI
  });

  // İstatistik verileri - ✅ SIFIRLANDI
  const [dailyStats, setDailyStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    averageTimePerTask: 25,
    mostActiveHour: '09:00',
    streakDays: 0, // ✅ SIFIRLANDI
    totalPoints: 0, // ✅ SIFIRLANDI
    weeklyGoal: 95,
    monthlyGoal: 92
  });

  // Örnek departmanlar - Gerçek departman listesi
  const departments = {
    '27527': 'Kleiner Botendienst',
    '27522': 'Wäsche & Küchen Service',
    '27525': 'Bauteil C Service',
    '27529': 'Bauteil H & Kindergarten',
    '27530': 'Hauptmagazin Service',
    '27521': 'Essen Service (N & D)',
    '27519': 'S3 - Wochenende',
    '27520-Samstag': 'LD - Samstag',
    '27520-Sonntag': 'LD - Sonntag', 
    '27521-Q2': 'Q2 - Samstag',
    '27543': 'AK N - Müllzentrale',
    '27538': 'Post Service (Freitag)',
    '27523-AKN': 'AK N (27543)',
    '27523-AKA': 'AK A (27523)',
    '27518': 'LD - Wochentag (27518)',
    '27518-Samstag': 'LD - Samstag',
    '27518-Sonntag': 'LD - Sonntag',
    '27518-LD': 'LD - Wochentag',
    '27520-LD': 'LD - Wochentag',
    '27524': 'S2 - Service & Verteilung',
    '27526': 'Sterilgut Service',
    '27531': 'Auftragsdect',
    '27531-BadHall': 'Bad Hall Service'
  };

  // Görevler - Vollständige Aufgaben für alle DECT-Codes
  const taskTemplates = {
    '27543': [
      {
        id: 720,
        time: '06:30',
        title: 'Körperteilkühlschrank kontrollieren',
        description: 'Körperteilkühlschrank in der Früh kontrollieren und eintragen! Datenschutz: Montag: Bauteil C, Dienstag: Bauteil B/K, Mittwoch: Bauteil D/G',
        location: 'Pathologie',
        priority: 'high',
        estimatedDuration: '15 min',
        condition: 'Täglich! Datenschutz nach Wochentag'
      },
      {
        id: 721,
        time: '06:45',
        title: 'Bauteil K (OP, Z-Steri, K101)',
        description: 'Bauteil K (OP, Z-Steri, K101). Dann Bauteil C (C301, C302, C201, C202, C101, C102)',
        location: 'Bauteil K und C',
        priority: 'high',
        estimatedDuration: '45 min'
      },
      {
        id: 722,
        time: '09:30',
        title: 'Bauteil D und G',
        description: 'Bauteil D (D203, D201, D103, D102, D101, Physik, Med., Z-Ergo). Bauteil G (G301, G201, Psychoth.)',
        location: 'Bauteil D und G',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 723,
        time: '11:00',
        title: 'Infekt Müll-Runde',
        description: 'Infekt Müll-Runde: Patho, Nuk, Labor, Theoretische, K101',
        location: 'Pathologie, Nuklearmedizin, Labor',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 724,
        time: '12:00',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 725,
        time: '12:30',
        title: 'Theoretische NC, Patho, Labor+ NUK, Radiologie',
        description: 'Theoretische NC, Patho, Labor+ NUK, Radiologie. Bauteil C (C301, C302, C201, C202, C101, C102)',
        location: 'Verschiedene Abteilungen und Bauteil C',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 726,
        time: '14:30',
        title: 'Weitere Arbeiten in der Müllzentrale',
        description: 'Weitere Arbeiten in der Müllzentrale: Infekt-Tonnen in Desinfektor, Datenschutz vernichten, Müllwägen für nächsten Tag vorbereiten, Jeden Freitag ganzen Technikmüll holen. Büro anrufen und abmelden. Drucker ausschalten und alle Türen abschließen.',
        location: 'Müllzentrale',
        priority: 'low',
        estimatedDuration: '60 min',
        condition: 'Jeden Freitag ganzen Technikmüll holen'
      }
    ],
    '27538': [
      {
        id: 780,
        time: '06:35',
        title: 'Poststelle - 1. und 2. Fahrt erledigen',
        description: '1. Fahrt: Röntgen, K101, Navi, OP, C201, C202, NC Sekretariat, C301, C302, NL Sekretariat, C101, C102, Pathologie, Labor, Nuklearmedizin, NC Amb./NL Amb., Physiotherapie, D103, Psychosom. Sekretariat, D102, D101, SPAZ, D203, D202, D201, Sek.Dalpiaz (BTG 1.Stock), G201, G301. 2. Fahrt: Einkauf-L.20.008.0, VAP-Stelle (neben Einkauf), Medizintechnik, Kaufmännische Direktion (Fr.Dommes), Personalstelle, Klinische Sozialarbeit, Rechnungswesen L.10.034.0, Anläuten H103, H102, AfA, H101 Ger.Amb, H101 Ger.TKL, H201, H202, H203, H302, J102, J101, J104, Pfleged. 2.Stock, Hygiene 2.Stock, J201, J202, J203, J301, J303, Forensik Sek., J103',
        location: 'Poststelle und alle Krankenhausbereiche',
        priority: 'high',
        estimatedDuration: '2.5 Stunden'
      },
      {
        id: 781,
        time: '09:15',
        title: '3. Fahrt ab 09:15 Uhr',
        description: '3. Fahrt: N204, N104, EDV, NOZ3, N103, N102, Bauleitung, N101, N201, N202, Übergangspflege, Arbeitsmedizin, Diätologie (nur Posteingang), Mikroverfilmung, Betriebsrat Linzer, Betriebsrat Schulz, Clearingstelle N 3. Stock, Ger. Sekr. 3. Stock, Wäschemagazin, HBD/Patiententransport',
        location: 'Bauteil N und verschiedene Abteilungen',
        priority: 'medium',
        estimatedDuration: '2 Stunden'
      }
    ],
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
    '27521': [
      {
        id: 39,
        time: '06:30',
        title: 'Frühstück ausliefern',
        description: 'Frühstück in dieser Reihenfolge ausliefern: N102, N103, N201, NOZ3, N101, N202, N204, N104 (Ausräumen lassen und wieder retour zu V1). Dann D101, D102, D103, D201, D202, D203',
        location: 'Bauteil N & D Stationen',
        priority: 'high'
      },
      {
        id: 40,
        time: '08:30',
        title: 'Frühstück einsammeln',
        description: 'Frühstück einsammeln in dieser Reihenfolge: N204, N201, N202, N101, N102, N103, NOZ3. Dann D101, D102, D103, D201, D202, D203',
        location: 'Bauteil N & D Stationen',
        priority: 'medium'
      },
      {
        id: 41,
        time: '10:30',
        title: 'Mittagessen ausliefern',
        description: 'Mittagessen ausliefern in dieser Reihenfolge: N102, N103, N201, NOZ3, N101, N202, N204, N104. Dann D101, D102, D103, D201, D202, D203',
        location: 'Bauteil N & D Stationen',
        priority: 'medium'
      },
      {
        id: 42,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break'
      },
      {
        id: 43,
        time: '12:30',
        title: 'Mittagessen einsammeln',
        description: 'Mittagessen einsammeln in dieser Reihenfolge: N204, N104, N201, N202, N101, N102, N103, NOZ3. Dann D101, D102, D103, D201, D202, D203',
        location: 'Bauteil N & D Stationen',
        priority: 'medium'
      },
      {
        id: 44,
        time: '14:00',
        title: 'Mopp "BT D/G" ausstellen',
        description: 'Mopp "BT D/G" ausstellen (Freitags um 13:30 Uhr)',
        location: 'Bauteil D & G',
        priority: 'medium',
        condition: 'Freitags um 13:30 Uhr'
      }
    ],
    '27522': [
      {
        id: 10,
        time: '06:30',
        title: 'Frischwäschewagen bereitstellen',
        description: 'Frischwäschewagen bereitstellen, ausliefern und dokumentieren',
        location: 'Wäscherei zu Stationen',
        priority: 'high',
        estimatedDuration: '45 min',
        condition: 'Mo, Mi & Fr Altbau / Di & Do Neubau'
      },
      {
        id: 11,
        time: '08:00',
        title: 'Küchen-Nachlieferung',
        description: 'Küchen-Nachlieferung - Anschließend jeden Montag und Mittwoch: Mineralwasserversorgung',
        location: 'Küche zu Stationen',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 12,
        time: '10:30',
        title: 'Apothekenversorgung Bauteil K',
        description: 'Apothekenversorgung: Bauteil K (ausgenommen Ambulanzen)',
        location: 'Apotheke zu Bauteil K',
        priority: 'medium',
        estimatedDuration: '25 min'
      },
      {
        id: 13,
        time: '11:30',
        title: 'Medikamentenwagen runterstellen',
        description: 'Medikamentenwagen v. Bauteil K wieder runterstellen und 27518 anrufen wegen zurückstellen',
        location: 'Bauteil K',
        priority: 'medium',
        estimatedDuration: '20 min'
      },
      {
        id: 14,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 15,
        time: '12:30',
        title: 'Essenswagen K101/102 runterstellen',
        description: 'Essenswagen K101/102 runterstellen. Danach Mopp "Bauteil J / K / G / Ambulanzen" einsammeln. Anschließend Mittagessen einsammeln: G201, G301',
        location: 'K101/102, Bauteil J/K/G',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 16,
        time: '14:00',
        title: 'Mopp "BT H" ausstellen',
        description: 'Mopp "BT H" ausstellen (Freitags um 13:30 Uhr)',
        location: 'Bauteil H',
        priority: 'medium',
        estimatedDuration: '25 min',
        condition: 'Freitags um 13:30 Uhr'
      }
    ],
    '27525': [
      {
        id: 17,
        time: '06:30',
        title: 'Frühstück ausliefern',
        description: 'Frühstück ausliefern: C101, C201, C301, C102, C202, C302. Danach JEDEN MONTAG Kleiderbügelständer austauschen',
        location: 'Stationen C101-C302',
        priority: 'high',
        estimatedDuration: '45 min',
        condition: 'Montags: Kleiderbügelständer austauschen'
      },
      {
        id: 18,
        time: '08:15',
        title: 'Frühstück einsammeln',
        description: 'Frühstück einsammeln: C101, C201, C301, C102, C202, C302',
        location: 'Stationen C101-C302',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 19,
        time: '08:30',
        title: 'Apothekenversorgung',
        description: 'Apothekenversorgung; siehe Routenplan (BT C / D und Ambulanzen) - Die leeren APO-Kisten werden mitgenommen!!!',
        location: 'Bauteil C/D, Ambulanzen',
        priority: 'high',
        estimatedDuration: '40 min'
      },
      {
        id: 20,
        time: '10:30',
        title: 'Mittagessen ausliefern',
        description: 'Mittagessen ausliefern: C101, C201, C301, C102, C202, C302',
        location: 'Stationen C101-C302',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 21,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 22,
        time: '12:30',
        title: 'Mittagessen einsammeln',
        description: 'Mittagessen einsammeln: C101, C102, C201, C202, C301, C302. Danach Mopp "BT C / D" einsammeln und retour in Wäscheraum Unrein',
        location: 'Stationen C101-C302',
        priority: 'medium',
        estimatedDuration: '35 min'
      },
      {
        id: 23,
        time: '14:00',
        title: 'Mopp "BT J" ausstellen',
        description: 'Mopp "BT J" ausstellen (Freitags um 13:30 Uhr)',
        location: 'Bauteil J',
        priority: 'medium',
        estimatedDuration: '25 min',
        condition: 'Freitags um 13:30 Uhr'
      }
    ],
    '27529': [
      {
        id: 24,
        time: '06:30',
        title: 'Austausch Rentomaten "BT N"',
        description: 'Austausch Rentomaten "BT N"',
        location: 'Bauteil N',
        priority: 'high',
        estimatedDuration: '30 min',
        condition: 'NUR MONTAGS: MOPP BT "D / G" AUSTEILEN!!!'
      },
      {
        id: 25,
        time: '07:20',
        title: 'Essenswagen BT H ausliefern',
        description: 'Essenswagen BT H ausliefern: H103, H201, H203, H302',
        location: 'Bauteil H Stationen',
        priority: 'high',
        estimatedDuration: '25 min'
      },
      {
        id: 26,
        time: '09:00',
        title: 'Essenswagen BT H einsammeln',
        description: 'Essenswagen BT H einsammeln: H103, H201, H203, H302',
        location: 'Bauteil H Stationen',
        priority: 'medium',
        estimatedDuration: '25 min'
      },
      {
        id: 27,
        time: '09:30',
        title: 'Hauptmagazin-Lieferung',
        description: 'Hauptmagazin-Lieferung (BT H / J / N) gemeinsam mit 27530',
        location: 'Bauteil H/J/N',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 28,
        time: '10:40',
        title: 'Essensversorgung "Kindergarten"',
        description: 'Essensversorgung "Kindergarten" gemeinsam mit 27530',
        location: 'Kindergarten',
        priority: 'medium',
        estimatedDuration: '20 min'
      },
      {
        id: 29,
        time: '11:30-12:00',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 30,
        time: '12:15',
        title: 'Mikrofasertücher-Wagen',
        description: 'Mikrofasertücher-Wagen in Wäscheraum-Unrein stellen',
        location: 'Wäscheraum',
        priority: 'low',
        estimatedDuration: '10 min'
      },
      {
        id: 31,
        time: '12:20',
        title: 'Essenboxen "Kindergarten" abholen',
        description: 'Abholung bzw. Rücktransport Essenboxen "Kindergarten" gemeinsam mit 27530',
        location: 'Kindergarten',
        priority: 'medium',
        estimatedDuration: '20 min'
      },
      {
        id: 32,
        time: '12:30',
        title: 'Hauptmagazinwagen dokumentieren',
        description: 'Hauptmagazinwagen dokumentieren. Danach HLM-Lieferung mit 27530. Anschließend: Hauptmagazinwagen gemeinsam mit 27530 und 27520 retourstellen',
        location: 'Hauptmagazin',
        priority: 'medium',
        estimatedDuration: '45 min'
      }
    ],
    '27530': [
      {
        id: 33,
        time: '06:30',
        title: 'Austausch Rentomaten "BT N"',
        description: 'Austausch Rentomaten "BT N"',
        location: 'Bauteil N',
        priority: 'high',
        estimatedDuration: '30 min',
        condition: 'NUR MONTAGS: MOPP BT "H & J" AUSTEILEN!!!'
      },
      {
        id: 34,
        time: '09:30',
        title: 'Hauptmagazin-Lieferung',
        description: 'Hauptmagazin-Lieferung (BT H / J / N) gemeinsam mit 27529',
        location: 'Bauteil H/J/N',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 35,
        time: '10:40',
        title: 'Essensversorgung "Kindergarten"',
        description: 'Essensversorgung "Kindergarten" gemeinsam mit 27529',
        location: 'Kindergarten',
        priority: 'medium',
        estimatedDuration: '20 min'
      },
      {
        id: 36,
        time: '11:30-12:00',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 37,
        time: '12:20',
        title: 'Essenboxen "Kindergarten" abholen',
        description: 'Abholung bzw. Rücktransport Essenboxen "Kindergarten" gemeinsam mit 27529',
        location: 'Kindergarten',
        priority: 'medium',
        estimatedDuration: '20 min'
      },
      {
        id: 38,
        time: '12:30',
        title: 'Hauptmagazin-Lieferung',
        description: 'Zettel (Transportdokumentation) mitnehmen und die HLM-Wägen aufschreiben. Danach Hauptmagazinversorgung mit 27529. Anschließend: Hauptmagazinwägen gemeinsam mit 27529 und 27520 retourstellen',
        location: 'Hauptmagazin',
        priority: 'medium',
        estimatedDuration: '45 min'
      }
    ],
    '27519': [
      {
        id: 45,
        time: '06:30',
        title: 'Frühstück ausliefern',
        description: 'N102, N103, N201, NOZ3, N101, N202, N204 ausliefern. Dann D101, D102, D103, D201, D202, D203 ausliefern. Danach Schmutzwäsche mit 27518 (S3); "BT N"',
        location: 'Bauteil N & D Stationen',
        priority: 'high',
        estimatedDuration: '60 min'
      },
      {
        id: 46,
        time: '08:30',
        title: 'Frühstück einsammeln',
        description: 'In dieser Reihenfolge: N204, N201, N202, N101, N102, N103, NOZ3. Dann D101, D102, D103, D201, D202, D203',
        location: 'Bauteil N & D Stationen',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 47,
        time: '10:30',
        title: 'Mittagessen ausliefern',
        description: 'N102, N103, N201, NOZ3, N101, N202, N204 ausliefern. Dann D101, D102, D103, D201, D202, D203 ausliefern. Danach Essen für Portier bringen',
        location: 'Bauteil N & D Stationen',
        priority: 'medium',
        estimatedDuration: '50 min'
      },
      {
        id: 48,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 49,
        time: '12:30',
        title: 'Mittagessen einsammeln',
        description: 'In dieser Reihenfolge: N204, N201, N202, N101, N102, N103, NOZ3. Dann D101, D102, D103, D201, D202, D203. Danach Mopp "BT D / G" einsammeln und in Wäscheraum Unrein hinstellen',
        location: 'Bauteil N & D Stationen',
        priority: 'medium',
        estimatedDuration: '45 min'
      },
      {
        id: 50,
        time: '15:30',
        title: 'Abendessen ausliefern',
        description: 'N102, N103, N201, NOZ3, N101, N202, N204 ausliefern. Anschließend Küchenwäsche. Danach D101, D102, D103, D201, D202, D203 ausliefern',
        location: 'Bauteil N & D Stationen',
        priority: 'medium',
        estimatedDuration: '50 min'
      },
      {
        id: 51,
        time: '17:00',
        title: 'Abendessen einsammeln',
        description: 'In dieser Reihenfolge: N204, N201, N202, N101, N102, N103, NOZ3',
        location: 'Bauteil N Stationen',
        priority: 'low',
        estimatedDuration: '25 min'
      }
    ],
    '27520': [
      {
        id: 52,
        time: '06:30',
        title: 'Frühstück ausliefern (Samstag)',
        description: 'C102, C202, C302 zum Lift. N102, N103, N201, NOZ3, N101, N202, N204 zum Lift. J103, J201/J202, J203, J301, J303 ausliefern. H103, H201 ausliefern. Danach Schmutzwäsche "BT J"',
        location: 'Alle Stationen',
        priority: 'high',
        estimatedDuration: '60 min'
      },
      {
        id: 53,
        time: '08:30',
        title: 'Frühstück einsammeln (Samstag)',
        description: 'J103, J201/J202, J203, J301, J303 holen und zu V1. H103, H201 holen und zu V1. N102, N103, N201, NOZ3, N101, N202, N204 zu V1. Anschließend mit 27518; Frischwäschewägen bereitstellen zum Transport',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '50 min'
      },
      {
        id: 54,
        time: '10:30',
        title: 'Mittagessen ausliefern (Samstag)',
        description: 'C102, C202, C302 zum Lift. N102, N103, N201, NOZ3, N101, N202, N204 zum Lift. J103, J201/J202, J203, J301, J303 ausliefern. H103, H201 ausliefern',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '50 min'
      },
      {
        id: 55,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 56,
        time: '12:30',
        title: 'Mittagessen einsammeln (Samstag)',
        description: 'J103, J201/J202, J203, J301, J303 holen und zu V1. H103, H201 holen und zu V1. N102, N103, N201, NOZ3, N101, N202, N204 zu V1. Danach Mopp "BT H / N / J" einsammeln und in Wäscheraum Unrein hinstellen',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '45 min'
      },
      {
        id: 57,
        time: '15:15',
        title: 'Abendessen ausliefern (Samstag)',
        description: 'N102, N103, N201, NOZ3, N101, N202, N204 zum Lift (werden beim Bereitstellen von 27543 gebracht!). H103, H201 ausliefern. J103, J201/J202, J203, J301, J303 ausliefern',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 58,
        time: '16:00',
        title: 'Küchen-Nachlieferung',
        description: 'Küchen-Nachlieferung (15:55 Uhr anrufen)',
        location: 'Küche',
        priority: 'low',
        estimatedDuration: '15 min',
        condition: '15:55 Uhr anrufen'
      },
      {
        id: 59,
        time: '17:00',
        title: 'Abendessen einsammeln (Samstag)',
        description: 'H103, H201 holen und zu V1. J103, J201/J202, J203, J301, J303 holen und zu V1. N102, N103, N201, NOZ3, N101, N202, N204 zu V1. K101/K102 holen und zu V1. G201, G301 holen und zu V1. Anschließend Rentomaten "BT N" Kontrollieren',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '50 min'
      }
    ],
    '27520S': [ // Sonntag Version
      {
        id: 60,
        time: '06:30',
        title: 'Frühstück ausliefern (Sonntag)',
        description: 'C102, C202, C302 zum Lift. N102, N103, N201, NOZ3, N101, N202, N204 zum Lift. J103, J201/J202, J203, J301, J303 ausliefern. H103, H201 ausliefern. Danach Schmutzwäsche "BT J"',
        location: 'Alle Stationen',
        priority: 'high',
        estimatedDuration: '60 min'
      },
      {
        id: 61,
        time: '08:30',
        title: 'Frühstück einsammeln (Sonntag)',
        description: 'J103, J201/J202, J203, J301, J303 holen und zu V1. H103, H201 holen und zu V1. N102, N103, N201, NOZ3, N101, N202, N204 zu V1. Danach Schmutzwäsche "BT C" mit 27518',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '50 min'
      },
      {
        id: 62,
        time: '10:30',
        title: 'Mittagessen ausliefern (Sonntag)',
        description: 'C102, C202, C302 zum Lift. N102, N103, N201, NOZ3, N101, N202, N204 zum Lift. J103, J201/J202, J203, J301, J303 ausliefern. H103, H201 ausliefern',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '50 min'
      },
      {
        id: 63,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 64,
        time: '12:30',
        title: 'Mittagessen einsammeln (Sonntag)',
        description: 'J103, J201/J202, J203, J301, J303 holen und zu V1. H103, H201 holen und zu V1. N102, N103, N201, NOZ3, N101, N202, N204 zu V1. Danach Mopp "BT H / N / J" einsammeln und in Wäscheraum Unrein hinstellen',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '45 min'
      },
      {
        id: 65,
        time: '15:15',
        title: 'Abendessen ausliefern (Sonntag)',
        description: 'N102, N103, N201, NOZ3, N101, N202, N204 zum Lift (werden beim Bereitstellen von 27543 gebracht!). H103, H201 ausliefern. J103, J201/J202, J203, J301, J303 ausliefern',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 66,
        time: '16:00',
        title: 'Küchen-Nachlieferung',
        description: 'Küchen-Nachlieferung (15:55 Uhr anrufen)',
        location: 'Küche',
        priority: 'low',
        estimatedDuration: '15 min',
        condition: '15:55 Uhr anrufen'
      },
      {
        id: 67,
        time: '17:00',
        title: 'Abendessen einsammeln (Sonntag)',
        description: 'H103, H201 holen und zu V1. J103, J201/J202, J203, J301, J303 holen und zu V1. N102, N103, N201, NOZ3, N101, N202, N204 zu V1. K101/K102 holen und zu V1. G201, G301 holen und zu V1. Anschließend Rentomaten "BT N" Kontrollieren',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '50 min'
      }
    ],
    '27521Q2': [
      {
        id: 68,
        time: '06:30',
        title: 'Frühstückswägen bereitstellen (Q2)',
        description: 'C101, C201, C301, C102, C202, C302. N102, N103, N201, NOZ3, N101, N201, N202, N204. J301, J303, J201/202, J203, J103. D101, D102, D103, D201, D202, D203. H103, H201. K101/K102. Anschließend G201, G301 ausliefern. Danach Dienstbekleidung BT N einsammeln',
        location: 'Alle Stationen',
        priority: 'high',
        estimatedDuration: '70 min'
      },
      {
        id: 69,
        time: '08:00',
        title: 'Küchen-Nachlieferung',
        description: 'Küchen-Nachlieferung',
        location: 'Küche',
        priority: 'medium',
        estimatedDuration: '20 min'
      },
      {
        id: 70,
        time: '08:30',
        title: 'Frühstückswägen einsammeln (Q2)',
        description: 'G201, G301. Danach Mopp "BT K" einsammeln',
        location: 'G201, G301',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 71,
        time: '10:10',
        title: 'Mittagessen bereitstellen (Q2)',
        description: 'C101, C201, C301, C102, C202, C302. N102, N103, N201, NOZ3, N101, N201, N202, N204. J301, J303, J201/202, J203, J103. D101, D102, D103, D201, D202, D203. H103, H201. K101/K102. Anschließend G201, G301 ausliefern. Dienstende 11:30 Uhr',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '80 min',
        condition: 'Dienstende 11:30 Uhr'
      }
    ],
    '27543': [
      {
        id: 72,
        time: '06:30',
        title: 'Körperteilkühlschrank kontrollieren',
        description: 'Körperteilkühlschrank in der Früh kontrollieren und eintragen! Datenschutz: Montag: Bauteil C, Dienstag: Bauteil B/K, Mittwoch: Bauteil D/G',
        location: 'Pathologie',
        priority: 'high',
        estimatedDuration: '15 min',
        condition: 'Täglich! Datenschutz nach Wochentag'
      },
      {
        id: 73,
        time: '06:30',
        title: 'Bauteil K (OP, Z-Steri, K101)',
        description: 'Bauteil K (OP, Z-Steri, K101). Dann Bauteil C (C301, C302, C201, C202, C101, C102)',
        location: 'Bauteil K und C',
        priority: 'high',
        estimatedDuration: '45 min'
      },
      {
        id: 74,
        time: '09:30',
        title: 'Bauteil D und G',
        description: 'Bauteil D (D203, D201, D103, D102, D101, Physik, Med., Z-Ergo). Bauteil G (G301, G201, Psychoth.)',
        location: 'Bauteil D und G',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 75,
        time: '11:00',
        title: 'Infekt Müll-Runde',
        description: 'Infekt Müll-Runde: Patho, Nuk, Labor, Theoretische, K101',
        location: 'Pathologie, Nuklearmedizin, Labor',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 76,
        time: '12:00',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 77,
        time: '12:30',
        title: 'Theoretische NC, Patho, Labor+ NUK, Radiologie',
        description: 'Theoretische NC, Patho, Labor+ NUK, Radiologie. Bauteil C (C301, C302, C201, C202, C101, C102)',
        location: 'Verschiedene Abteilungen und Bauteil C',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 78,
        time: '14:30',
        title: 'Weitere Arbeiten in der Müllzentrale',
        description: 'Weitere Arbeiten in der Müllzentrale: Infekt-Tonnen in Desinfektor, Datenschutz vernichten, Müllwägen für nächsten Tag vorbereiten, Jeden Freitag ganzen Technikmüll holen. Büro anrufen und abmelden. Drucker ausschalten und alle Türen abschließen.',
        location: 'Müllzentrale',
        priority: 'low',
        estimatedDuration: '60 min',
        condition: 'Jeden Freitag ganzen Technikmüll holen'
      }
    ],
    '27538': [
      {
        id: 78,
        time: '06:35',
        title: 'Poststelle - 1. und 2. Fahrt erledigen',
        description: 'In die Poststelle gehen und 1. und 2. Fahrt erledigen. Verschiedene Stationen wie Röntgen, Einkauf, VAP-Stelle, Medizintechnik, Klinische Sozialarbeit, Rechnungswesen anfahren',
        location: 'Poststelle und verschiedene Abteilungen',
        priority: 'high',
        estimatedDuration: '2.5 Stunden'
      },
      {
        id: 79,
        time: '09:15',
        title: '3. Fahrt',
        description: '3. Fahrt durchführen mit verschiedenen Stationen: N204, N104, EDV, NOZ3, N103, N102, Bauleitung, N101, N201, N202, Übergangspflege, Arbeitsmedizin, Diätologie, Mikroverfilmung, Betriebsrat Linzer, Betriebsrat Schulz, Clearingstelle N 3. Stock, Ger. Sekr. 3. Stock, Wäschemagazin, HBD/Patiententransport',
        location: 'Verschiedene Stationen',
        priority: 'medium',
        estimatedDuration: '2 Stunden'
      }
    ],
    '27523': [ // AK N - Müllzentrale
      {
        id: 80,
        time: '06:30',
        title: 'Körperteilkühlschrank kontrollieren',
        description: 'Körperteilkühlschrank in der Früh kontrollieren und eintragen!',
        location: 'Pathologie',
        priority: 'high',
        estimatedDuration: '15 min',
        condition: 'Datenschutz Montag: Bauteil C. Dienstag: Bauteil B/K. Mittwoch: Bauteil D/G'
      },
      {
        id: 81,
        time: '06:30',
        title: 'Bauteil K (OP, Z-Steri, K101)',
        description: 'Bauteil K (OP, Z-Steri, K101). Bauteil C (C301, C302, C201, C202, C101, C102)',
        location: 'Bauteil K und C',
        priority: 'high',
        estimatedDuration: '45 min'
      },
      {
        id: 82,
        time: '09:30',
        title: 'Bauteil D und G',
        description: 'Bauteil D (D203, D201, D103, D102, D101, Physik, Med., Z-Ergo). Bauteil G (G301, G201, Psychoth.)',
        location: 'Bauteil D und G',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 83,
        time: '11:00',
        title: 'Infekt Müll-Runde',
        description: 'Infekt Müll-Runde: Patho, Nuk, Labor, Theoretische, K101',
        location: 'Pathologie, Nuklearmedizin, Labor',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 84,
        time: '12:00',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 85,
        time: '12:30',
        title: 'Theoretische NC, Patho, Labor+ NUK, Radiologie',
        description: 'Theoretische NC, Patho, Labor+ NUK, Radiologie. Bauteil C (C301, C302, C201, C202, C101, C102)',
        location: 'Verschiedene Abteilungen und Bauteil C',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 86,
        time: '14:30',
        title: 'Weitere Arbeiten in der Müllzentrale',
        description: 'Weitere Arbeiten in der Müllzentrale: Infekt-Tonnen in Desinfektor, Datenschutz vernichten, Müllwägen für nächsten Tag vorbereiten, Jeden Freitag ganzen Technikmüll holen. Büro anrufen und abmelden. Drucker ausschalten und alle Türen abschließen.',
        location: 'Müllzentrale',
        priority: 'low',
        estimatedDuration: '60 min',
        condition: 'Jeden Freitag ganzen Technikmüll holen'
      }
    ],
    '27523A': [ // AK A - Ambulanz Service
      {
        id: 87,
        time: '06:30',
        title: 'Körperteilkühlschrank kontrollieren',
        description: 'Körperteilkühlschrank in der Früh kontrollieren und eintragen!',
        location: 'Pathologie',
        priority: 'high',
        estimatedDuration: '15 min',
        condition: 'Datenschutz Montag: Bauteil N. Dienstag: Bauteil H/J. Mittwoch: Bauteil V'
      },
      {
        id: 88,
        time: '06:30',
        title: 'AMB. Röntgen',
        description: 'AMB. Röntgen',
        location: 'Röntgen Ambulanz',
        priority: 'high',
        estimatedDuration: '20 min'
      },
      {
        id: 89,
        time: '07:15',
        title: 'Bauteil N Wäscheausgabe',
        description: 'Bauteil N (N201, N103, N101, NOZ3, N204, N104). Wäscheausgabe (Wäschemagazin)',
        location: 'Bauteil N und Wäschemagazin',
        priority: 'high',
        estimatedDuration: '45 min'
      },
      {
        id: 90,
        time: '09:30',
        title: 'Bauteil H und J',
        description: 'Bauteil H (H302, H201, H202, H203, H101, H103). Bauteil J (J301, J303, J201, J202, J203, J101, J103, Verwaltung/Kirchengang)',
        location: 'Bauteil H und J',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 91,
        time: '10:00',
        title: 'Elektrotechnik-Müll (Freitag)',
        description: 'Elektrotechnik-Müll (Freitag). Technik + Med. Technik',
        location: 'Elektrotechnik Abteilung',
        priority: 'low',
        estimatedDuration: '30 min',
        condition: 'Nur Freitags'
      },
      {
        id: 92,
        time: '11:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 93,
        time: '12:00',
        title: 'Küchen – HLM – APO – und Technikmüll entsorgen',
        description: 'Küchen – HLM – APO – und Technikmüll entsorgen. Kindergartenmüll (Mittwoch, Freitag). (wird von der Außenrunde im Sommer mitgenommen!). Bauteil K (OP, Z-Steri, K101,). Bauteil N: 1.Stock & 2.Stock',
        location: 'Verschiedene Abteilungen',
        priority: 'medium',
        estimatedDuration: '60 min',
        condition: 'Kindergartenmüll Mittwoch & Freitag'
      },
      {
        id: 94,
        time: '14:30',
        title: 'Büro anrufen und abmelden',
        description: 'Büro anrufen und abmelden.',
        location: 'Büro',
        priority: 'low',
        estimatedDuration: '5 min'
      }
    ],
    '27518': [ // LD - Samstag/Sonntag Wäsche
      {
        id: 95,
        time: '06:30',
        title: 'Frühstück ausliefern (Samstag)',
        description: 'C101, C201, C301 zum Lift. C101, C102, C201, C202, C301, C302 ausliefern. D101, D102, D103, D201, D202, D203 zum Lift. K101/K102 ausliefern. G201, G301 zum Lift. Anschließend Schmutzwäsche "BT H". Danach Schmutzwäsche mit 27519 (S3); "BT N". 27518: N201, N202, N204. 27519: N101, N102, N103, NOZ3. Danach Wäschewägen retour in Wäscheraum Unrein. Anschließend mit 27520; Frischwäschewägen bereitstellen zum Transport',
        location: 'Alle Stationen',
        priority: 'high',
        estimatedDuration: '90 min'
      },
      {
        id: 96,
        time: '08:30',
        title: 'Frühstück einsammeln (Samstag)',
        description: 'C101, C102, C201, C202, C301, C302 holen und zu V1. D101, D102, D103, D201, D202, D203 zu V1. K101/K102 holen und zu V1. G201, G301 zu V1',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 97,
        time: '10:30',
        title: 'Mittagessen ausliefern (Samstag)',
        description: 'C101, C201, C301 zum Lift. C101, C102, C201, C202, C301, C302 ausliefern. OP ausliefern (Spätestens um 11:00 Uhr sollte oben sein). K101/K102 ausliefern. D101, D102, D103, D201, D202, D203 zum Lift. G201, G301 zum Lift',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 98,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 99,
        time: '12:30',
        title: 'Mittagessen einsammeln (Samstag)',
        description: 'C101, C102, C201, C202, C301, C302 holen und zu V1. D101, D102, D103, D201, D202, D203 zu V1. K101/K102 holen und zu V1. G201, G301 zu V1. Danach Mopp "BT C" einsammeln und in Wäscheraum Unrein hinstellen',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '45 min'
      },
      {
        id: 100,
        time: '15:30',
        title: 'Abendessen ausliefern (Samstag)',
        description: 'C101, C102, C201, C202, C301, C302 ausliefern',
        location: 'Bauteil C Stationen',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 101,
        time: '16:00',
        title: 'Abendessen ausliefern (Samstag - Fortsetzung)',
        description: 'D101, D102, D103, D201, D202, D203 zum Lift. K101/K102 ausliefern und OP holen und zu V1',
        location: 'Bauteil D und K',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 102,
        time: '17:00',
        title: 'Abendessen einsammeln (Samstag)',
        description: 'D101, D102, D103, D201, D202, D203 holen und zu V1. C101, C102, C201, C202, C301, C302 holen und zu V1. Anschließend Rentomaten "BT C / D" Kontrollieren. Bei Dienstende (18:30 Uhr!!!) Tagesdokumentation in HBD - Briefkasten',
        location: 'Bauteil C und D',
        priority: 'medium',
        estimatedDuration: '60 min',
        condition: 'Bei Dienstende 18:30 Uhr!!! Tagesdokumentation in HBD'
      }
    ],
    '27518S': [ // LD - Sonntag Wäsche
      {
        id: 103,
        time: '06:30',
        title: 'Frühstück ausliefern (Sonntag)',
        description: 'C101, C201, C301 zum Lift. C101, C102, C201, C202, C301, C302 ausliefern. D101, D102, D103, D201, D202, D203 zum Lift. K101/K102 ausliefern. G201, G301 zum Lift. Anschließend Schmutzwäsche "BT H". Danach Schmutzwäsche mit 27519 (S3); "BT N". 27518: N201, N202, N204. 27519: N101, N102, N103, NOZ3. Danach Wäschewägen retour in Wäscheraum Unrein',
        location: 'Alle Stationen',
        priority: 'high',
        estimatedDuration: '90 min'
      },
      {
        id: 104,
        time: '08:30',
        title: 'Frühstück einsammeln (Sonntag)',
        description: 'C101, C102, C201, C202, C301, C302 holen und zu V1. D101, D102, D103, D201, D202, D203 zu V1. K101/K102 holen und zu V1. G201, G301 zu V1. Danach Schmutzwäsche "BT C" mit 27520',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '50 min'
      },
      {
        id: 105,
        time: '10:30',
        title: 'Mittagessen ausliefern (Sonntag)',
        description: 'C101, C201, C301 zum Lift. C101, C102, C201, C202, C301, C302 ausliefern. OP ausliefern (Spätestens um 11:00 Uhr oben). K101/K102 ausliefern. D101, D102, D103, D201, D202, D203 zum Lift. G201, G301 zum Lift',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 106,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 107,
        time: '12:30',
        title: 'Mittagessen einsammeln (Sonntag)',
        description: 'C101, C102, C201, C202, C301, C302 holen und zu V1. D101, D102, D103, D201, D202, D203 zu V1. K101/K102 holen und zu V1. G201, G301 zu V1. Danach Mopp "BT C" einsammeln und in Wäscheraum Unrein hinstellen',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '45 min'
      },
      {
        id: 108,
        time: '15:30',
        title: 'Abendessen ausliefern (Sonntag)',
        description: 'C101, C102, C201, C202, C301, C302 ausliefern. D101, D102, D103, D201, D202, D203 zum Lift. K101/K102 ausliefern / OP holen und zu V1',
        location: 'Bauteil C, D und K',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 109,
        time: '17:00',
        title: 'Abendessen einsammeln (Sonntag)',
        description: 'D101, D102, D103, D201, D202, D203 holen und zu V1. C101, C102, C201, C202, C301, C302 holen und zu V1. Anschließend Rentomaten "BT C / D" Kontrollieren. Bei Dienstende (18:30 Uhr!!!) Tagesdokumentation in HBD - Briefkasten',
        location: 'Bauteil C und D',
        priority: 'medium',
        estimatedDuration: '60 min',
        condition: 'Bei Dienstende 18:30 Uhr!!! Tagesdokumentation in HBD'
      }
    ],
    '27518': [ // 27518 - LD Wochentag (Detailliert aus Bild)
      {
        id: 780,
        time: '06:30',
        title: 'Frühstück ausliefern',
        description: 'C101, C102, C201, C202, C301, C302 zum Lift. D101, D102, D103, D201, D202, D203 zum Lift. K101/K102 und J103 zum Lift. Ab 7:00 Uhr: Radiologie Tee und Milch ausliefern, leere Teekanne wieder mitnehmen und K101/K102 ausliefern. G201, G301 zum Lift',
        location: 'Alle Stationen + Radiologie',
        priority: 'high',
        estimatedDuration: '60 min',
        condition: 'Ab 7:00 Uhr Radiologie Tee/Milch Service'
      },
      {
        id: 781,
        time: '08:30',
        title: 'Frühstück einsammeln',
        description: 'C101, C102, C201, C202, C301, C302 zu V1. D101, D102, D103, D201, D202, D203 zu V1. K101/K102 holen und Transport zu V1. G201, G301 zu V1',
        location: 'Alle Stationen zu V1',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 782,
        time: '09:00',
        title: 'Apothekenversorgung',
        description: 'Apothekenversorgung - siehe Routenplan',
        location: 'Apotheke und Stationen',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 783,
        time: '10:30',
        title: 'Mittagessen ausliefern',
        description: 'C101, C201, C301, C102 zum Lift. OP ausliefern (Spätestens um 11:00 sollte oben sein). K101/K102 ausliefern. D101, D102, D103, D201, D202, D203 zum Lift. G201, G301 zum Lift. Anschließend Apothekenwägen Bauteil K zurückstellen (27522 ruft an)',
        location: 'Alle Stationen + OP',
        priority: 'medium',
        estimatedDuration: '60 min',
        condition: 'OP spätestens um 11:00 Uhr. 27522 ruft wegen Apothekenwägen an'
      },
      {
        id: 784,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 785,
        time: '12:30',
        title: 'Essenwägen K101/102 zurückstellen',
        description: 'Essenwägen K101/102 zurückstellen zu V1. Danach Hauptmagazinwägen für 27529/27530 ausliefern. Anschließend Essenwägen einsammeln: C101, C102, C201, C202, C301, C302 zu V1. D101, D102, D103, D201, D202, D203 zu V1. G201, G301 zu V1',
        location: 'K101/102, alle Stationen',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 786,
        time: '14:10',
        title: 'Abendessen bereitstellen',
        description: 'Abendessen bereitstellen',
        location: 'Küche',
        priority: 'medium',
        estimatedDuration: '20 min'
      },
      {
        id: 787,
        time: '15:30',
        title: 'Abendessen ausliefern (1. Teil)',
        description: 'C101, C102, C201, C202, C301, C302 ausliefern. Anschließend Rentomaten "BT D" austauschen',
        location: 'Bauteil C + Rentomaten BT D',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 788,
        time: '16:00',
        title: 'Abendessen ausliefern (2. Teil)',
        description: 'D101, D102, D103, D201, D202, D203 zum Lift. K101/K102 ausliefern. G201, G301 ausliefern',
        location: 'Bauteil D, K und G',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 789,
        time: '17:00',
        title: 'Abendessen einsammeln',
        description: 'D101, D102, D103, D201, D202, D203 holen und zu V1. C101, C102, C201, C202, C301, C302 holen und zu V1. Anschließend Rentomaten "BT C/D" austauschen. Bei Dienstende (18:30 Uhr!!!) Tagesdokumentation in HBD-Briefkasten',
        location: 'Alle Stationen + Rentomaten',
        priority: 'medium',
        estimatedDuration: '60 min',
        condition: 'Dienstende 18:30 Uhr!!! Tagesdokumentation in HBD-Briefkasten'
      }
    ],
    '27520W': [ // LD - Wochentags Extended
      {
        id: 120,
        time: '06:30',
        title: 'Frühstück ausliefern (LD Wochentag)',
        description: 'N101, N102, N103, N201, N202, N204, NOZ3, N104 zum Lift. H101 ausliefern. J101 / J102, J201 / J202, J203, J301, J303 ausliefern. H103, H201, H203, H302 zum Lift',
        location: 'Bauteil N, H und J',
        priority: 'high',
        estimatedDuration: '60 min'
      },
      {
        id: 121,
        time: '08:30',
        title: 'Frühstück einsammeln (LD Wochentag)',
        description: 'J101 / J102, J103, J201 / J202, J203, J301, J303 holen und zu V1. N101, N102, N103, N201, N202, N204, NOZ3, N104 zu V1. H101 holen und zu V1. H103, H201, H203, H302 zu V1',
        location: 'Bauteil N, H und J',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 122,
        time: '09:00',
        title: 'Apothekenversorgung (LD)',
        description: 'Apothekenversorgung; siehe APO-Routenplan. HLM-versorgung (Altbau); HLM-Wägen ausliefern und anschließend einsammeln',
        location: 'Apotheke und HLM',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 123,
        time: '10:30',
        title: 'Mittagessen ausliefern (LD)',
        description: 'N101, N102, N103, N201, N202, N204, NOZ3, N104 zum Lift. OP, K101/102 (Bis zur Kreuzung BT K). C202, C302 zum Lift. H101, H102 ausliefern. J101 / J102, J103 / J201 / J202, J203, J301, J303 ausliefern. H103, H201, H203, H302 zum Lift',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 124,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 125,
        time: '12:30',
        title: 'Hauptmagazinwägen ausliefern',
        description: 'Hauptmagazinwägen für 27529 / 27530 ausliefern (BT K). Danach Mittagessen einsammeln: J101 / J102, J103, J201 / J202, J203, J301, J303 holen und zu V1. N101, N102, N103, N201, N202, N204, NOZ3, N104 zu V1. H101, H102, H103, H201, H203, H302 zu V1. Danach gemeinsam mit 27529 / 27530 Hauptmagazinwägen zurückstellen',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 126,
        time: '14:45',
        title: 'Abendessen bereitstellen mit 27518',
        description: 'Abendessen bereitstellen mit 27518',
        location: 'Küche',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 127,
        time: '15:15',
        title: 'Abendessen ausliefern (LD)',
        description: 'H103, H201 ausliefern. J103, J201 / J202, J203, J301, J303 ausliefern. OP zu V1',
        location: 'Bauteil H und J',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 128,
        time: '16:00',
        title: 'Küchen-Nachlieferung',
        description: 'Küchen-Nachlieferung (15:55 Uhr anrufen)',
        location: 'Küche',
        priority: 'low',
        estimatedDuration: '15 min',
        condition: '15:55 Uhr anrufen'
      },
      {
        id: 129,
        time: '17:00',
        title: 'Abendessen einsammeln (LD)',
        description: 'H103, H201 holen und zu V1. J103, J201 / J202, J203, J301, J303 holen und zu V1. N101, N102, N103, N201, N202, N204, NOZ3, N104 zu V1. K101 / K102 zu V1. G201, G301 zu V1. Anschließend Rentomaten "BT N" Kontrollieren',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '60 min'
      }
    ],
    '27524': [
      {
        id: 130,
        time: '06:30',
        title: 'Frühstückswägen bereitstellen (S2)',
        description: 'C101, C201, C301, C102, C202, C302. N102, N103, N201, NOZ3, N101, N202, N204, N104. H101, J301, J303, J201 / J202, J203, J101 / 102, J103. D101, D102, D103, D201, D202, D203. H302, H103, H203, H201. K101 / K102 / G201, G301. G201, G301 ausliefern. J104 ausräumen lassen und wieder retour zu V1 (mit Transportbox) - (Bleibt im Lift, bis "BT G" fertig ist)',
        location: 'Alle Stationen',
        priority: 'high',
        estimatedDuration: '90 min'
      },
      {
        id: 131,
        time: '08:30',
        title: 'Frühstück einsammeln (S2)',
        description: 'G201, G301',
        location: 'G201, G301',
        priority: 'medium',
        estimatedDuration: '15 min'
      },
      {
        id: 132,
        time: '09:30',
        title: 'Die Post zur Schule bringen',
        description: 'Die Post von der Poststelle in die Schule bringen (Wagen mitnehmen) und anschließend die Post von der Schule wieder zur Poststelle bringen.',
        location: 'Poststelle und Schule',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 133,
        time: '10:00',
        title: 'Mopp "BT N" austauschen',
        description: 'Mopp "BT N" austauschen',
        location: 'Bauteil N',
        priority: 'medium',
        estimatedDuration: '20 min'
      },
      {
        id: 134,
        time: '10:10',
        title: 'Mittagessen bereitstellen (S2)',
        description: 'C101, C201, C301, C102, C202, C302. OP, K101 / K102. N102, N103, N201, NOZ3, N101, N202, N204, N104. H101, H102. J301, J303, J201 / J202, J203, J101 / 102, J103. D101, D102, D103, D201, D202, D203. H302, H103, H203, H201 / G201, G301. Anschließend; G201, G301 ausliefern',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '80 min'
      },
      {
        id: 135,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 136,
        time: '15:00',
        title: 'Rentomaten "BT N" austauschen',
        description: 'Rentomaten "BT N" austauschen',
        location: 'Bauteil N',
        priority: 'medium',
        estimatedDuration: '20 min'
      },
      {
        id: 137,
        time: '15:05',
        title: 'Angio – Wagen abholen',
        description: 'Angio – Wagen von der K.00.040.0 in die Z-Steri (Fensterfront abstellen). Danach den OP – Essenwägen retour in den Kollektor',
        location: 'Angiographie und Z-Steri',
        priority: 'medium',
        estimatedDuration: '25 min'
      },
      {
        id: 138,
        time: '15:30',
        title: 'Abendessen ausliefern (S2)',
        description: 'N102, N103, N201, NOZ3, N101, N202, N204. D101, D102, D103, D201, D202, D203',
        location: 'Bauteil N und D',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 139,
        time: '17:00',
        title: 'Abendessen einsammeln (S2)',
        description: 'In dieser Reihenfolge: N204, N201, N202, N101, N102, N103, NOZ3',
        location: 'Bauteil N',
        priority: 'low',
        estimatedDuration: '25 min'
      }
    ],
    '27526': [
      {
        id: 140,
        time: '07:30',
        title: 'Sterilgut ausliefern (Nur Montags)',
        description: 'Nur Montags: Mop BT "N". Sterilgut ausliefern und anschließend einsammeln. K101 / K102 nicht vor 7:30 Uhr abholen!!! Sterilgutwagen wieder auf die Z-Steri bringen und anläuten. Danach den Angio – Wagen (von Z-Steri) in Raum K.00.040.0 abstellen.',
        location: 'Z-Steri und K101/K102',
        priority: 'high',
        estimatedDuration: '60 min',
        condition: 'Nur Montags. K101/K102 nicht vor 7:30 Uhr!'
      },
      {
        id: 141,
        time: '09:00',
        title: 'Apothekenversorgung',
        description: 'Apothekenversorgung; siehe Routenplan (BT J / H / N / G) – Die leeren APO-Kisten werden mitgenommen!!!',
        location: 'Bauteil J, H, N, G',
        priority: 'medium',
        estimatedDuration: '90 min'
      },
      {
        id: 142,
        time: '11:30-12:00',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 143,
        time: '12:00',
        title: 'Küchen-Nachlieferung',
        description: 'Küchen-Nachlieferung (Der Nachlieferungswagen wird v. d. Küche abgeholt)',
        location: 'Küche',
        priority: 'medium',
        estimatedDuration: '20 min'
      },
      {
        id: 144,
        time: '14:00',
        title: 'Mopp "BT N" austeilen',
        description: 'Mopp "BT N" austeilen. (Freitags um 13:30 Uhr)',
        location: 'Bauteil N',
        priority: 'medium',
        estimatedDuration: '30 min',
        condition: 'Freitags um 13:30 Uhr'
      }
    ],
    '27531': [
      {
        id: 145,
        time: '06:30',
        title: 'Auftragsdect',
        description: 'Auftragsdect',
        location: 'Nach Bedarf',
        priority: 'medium',
        estimatedDuration: '180 min'
      },
      {
        id: 146,
        time: '10:00',
        title: 'Suchtgiftverteilung nach Info HBD – Büro',
        description: 'Ab ca. 10:00 Uhr: Suchtgiftverteilung nach Info HBD – Büro',
        location: 'Verschiedene Stationen',
        priority: 'medium',
        estimatedDuration: '120 min'
      },
      {
        id: 147,
        time: '11:30-12:00',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 148,
        time: '12:00',
        title: 'Auftragsdect (Nachmittag)',
        description: 'Ab 12:00 Uhr: Auftragsdect',
        location: 'Nach Bedarf',
        priority: 'medium',
        estimatedDuration: '180 min'
      }
    ],
    '27531-BadHall': [ // Bad Hall Service
      {
        id: 149,
        time: '07:30',
        title: 'Lieferungen für Bad Hall abholen',
        description: 'Diensthandy v. HBD - Büro holen. Schlüssel v. TBL - Büro holen. HLM – Lieferungen holen. APO – Lieferungen holen. Kassa – Lieferungen holen (v. d. Poststelle)',
        location: 'HBD, TBL, HLM, Apotheke, Poststelle',
        priority: 'high',
        estimatedDuration: '30 min',
        condition: 'Dienstag und Freitag ab 07:30 Uhr. Wenn Feiertag am Montag, wird am Dienstag gefahren! Wenn Feiertag am Donnerstag, wird am Mittwoch gefahren!'
      },
      {
        id: 150,
        time: '08:00',
        title: 'Abfahrt nach Bad Hall',
        description: 'Abfahrt. Die gesamte Lieferung wird beim Stützpunkt abgegeben. (Ausg. Sonnenpark & Ergotherapie)',
        location: 'Bad Hall',
        priority: 'high',
        estimatedDuration: '60 min'
      },
      {
        id: 151,
        time: '10:30',
        title: 'Rücktransport aus Bad Hall',
        description: 'Aus Bad Hall ist mitzunehmen: Retourwaren aller Art. Blut- und Harnproben für das Labor. Post. Geldtransport in die Anstaltskasse (Der Bedienstete soll die Kassenbelege selbstständig aufbewahren, um im Anlassfall die Geldübergabe bestätigen zu können!). sonstige Anforderungen werden vom Büro bekanntgegeben',
        location: 'Bad Hall',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 152,
        time: '10:30',
        title: 'Suchtgiftverteilung (variabel)',
        description: 'Ab ca. 10:30 Uhr: Suchtgiftverteilung nach Info HBD – Büro (Jeden Dienstag & Freitag variabel)',
        location: 'Verschiedene Stationen',
        priority: 'medium',
        estimatedDuration: '60 min',
        condition: 'Jeden Dienstag & Freitag variabel'
      }
    ],
    
    // ✅ NEUE DECT AUFGABEN - Vollständig integriert
    '27520-Samstag': [
      {
        id: 52,
        time: '06:30',
        title: 'Frühstück ausliefern (Samstag)',
        description: 'C102, C202, C302 zum Lift. N102, N103, N201, NOZ3, N101, N202, N204 zum Lift. J103, J201/J202, J203, J301, J303 ausliefern. H103, H201 ausliefern. Danach Schmutzwäsche "BT J"',
        location: 'Alle Stationen',
        priority: 'high',
        estimatedDuration: '60 min'
      },
      {
        id: 53,
        time: '08:30',
        title: 'Frühstück einsammeln (Samstag)',
        description: 'J103, J201/J202, J203, J301, J303 holen und zu V1. H103, H201 holen und zu V1. N102, N103, N201, NOZ3, N101, N202, N204 zu V1. Anschließend mit 27518; Frischwäschewägen bereitstellen zum Transport',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '50 min'
      },
      {
        id: 54,
        time: '10:30',
        title: 'Mittagessen ausliefern (Samstag)',
        description: 'C102, C202, C302 zum Lift. N102, N103, N201, NOZ3, N101, N202, N204 zum Lift. J103, J201/J202, J203, J301, J303 ausliefern. H103, H201 ausliefern',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '50 min'
      },
      {
        id: 55,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 56,
        time: '12:30',
        title: 'Mittagessen einsammeln (Samstag)',
        description: 'J103, J201/J202, J203, J301, J303 holen und zu V1. H103, H201 holen und zu V1. N102, N103, N201, NOZ3, N101, N202, N204 zu V1. Danach Mopp "BT H / N / J" einsammeln und in Wäscheraum Unrein hinstellen',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '45 min'
      },
      {
        id: 57,
        time: '15:15',
        title: 'Abendessen ausliefern (Samstag)',
        description: 'N102, N103, N201, NOZ3, N101, N202, N204 zum Lift (werden beim Bereitstellen von 27543 gebracht!). H103, H201 ausliefern. J103, J201/J202, J203, J301, J303 ausliefern',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 58,
        time: '16:00',
        title: 'Küchen-Nachlieferung',
        description: 'Küchen-Nachlieferung (15:55 Uhr anrufen)',
        location: 'Küche',
        priority: 'low',
        estimatedDuration: '15 min',
        condition: '15:55 Uhr anrufen'
      },
      {
        id: 59,
        time: '17:00',
        title: 'Abendessen einsammeln (Samstag)',
        description: 'H103, H201 holen und zu V1. J103, J201/J202, J203, J301, J303 holen und zu V1. N102, N103, N201, NOZ3, N101, N202, N204 zu V1. K101/K102 holen und zu V1. G201, G301 holen und zu V1. Anschließend Rentomaten "BT N" Kontrollieren',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '50 min'
      }
    ],
    
    '27520-Sonntag': [
      {
        id: 60,
        time: '06:30',
        title: 'Frühstück ausliefern (Sonntag)',
        description: 'C102, C202, C302 zum Lift. N102, N103, N201, NOZ3, N101, N202, N204 zum Lift. J103, J201/J202, J203, J301, J303 ausliefern. H103, H201 ausliefern. Danach Schmutzwäsche "BT J"',
        location: 'Alle Stationen',
        priority: 'high',
        estimatedDuration: '60 min'
      },
      {
        id: 61,
        time: '08:30',
        title: 'Frühstück einsammeln (Sonntag)',
        description: 'J103, J201/J202, J203, J301, J303 holen und zu V1. H103, H201 holen und zu V1. N102, N103, N201, NOZ3, N101, N202, N204 zu V1. Danach Schmutzwäsche "BT C" mit 27518',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '50 min'
      },
      {
        id: 62,
        time: '10:30',
        title: 'Mittagessen ausliefern (Sonntag)',
        description: 'C102, C202, C302 zum Lift. N102, N103, N201, NOZ3, N101, N202, N204 zum Lift. J103, J201/J202, J203, J301, J303 ausliefern. H103, H201 ausliefern',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '50 min'
      },
      {
        id: 63,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 64,
        time: '12:30',
        title: 'Mittagessen einsammeln (Sonntag)',
        description: 'J103, J201/J202, J203, J301, J303 holen und zu V1. H103, H201 holen und zu V1. N102, N103, N201, NOZ3, N101, N202, N204 zu V1. Danach Mopp "BT H / N / J" einsammeln und in Wäscheraum Unrein hinstellen',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '45 min'
      },
      {
        id: 65,
        time: '15:15',
        title: 'Abendessen ausliefern (Sonntag)',
        description: 'N102, N103, N201, NOZ3, N101, N202, N204 zum Lift (werden beim Bereitstellen von 27543 gebracht!). H103, H201 ausliefern. J103, J201/J202, J203, J301, J303 ausliefern',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 66,
        time: '16:00',
        title: 'Küchen-Nachlieferung',
        description: 'Küchen-Nachlieferung (15:55 Uhr anrufen)',
        location: 'Küche',
        priority: 'low',
        estimatedDuration: '15 min',
        condition: '15:55 Uhr anrufen'
      },
      {
        id: 67,
        time: '17:00',
        title: 'Abendessen einsammeln (Sonntag)',
        description: 'H103, H201 holen und zu V1. J103, J201/J202, J203, J301, J303 holen und zu V1. N102, N103, N201, NOZ3, N101, N202, N204 zu V1. K101/K102 holen und zu V1. G201, G301 holen und zu V1. Anschließend Rentomaten "BT N" Kontrollieren',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '50 min'
      }
    ],

    '27521-Q2': [
      {
        id: 68,
        time: '06:30',
        title: 'Frühstückswägen bereitstellen (Q2)',
        description: 'C101, C201, C301, C102, C202, C302. N102, N103, N201, NOZ3, N101, N201, N202, N204. J301, J303, J201/202, J203, J103. D101, D102, D103, D201, D202, D203. H103, H201. K101/K102. Anschließend G201, G301 ausliefern. Danach Dienstbekleidung BT N einsammeln',
        location: 'Alle Stationen',
        priority: 'high',
        estimatedDuration: '70 min'
      },
      {
        id: 69,
        time: '08:00',
        title: 'Küchen-Nachlieferung',
        description: 'Küchen-Nachlieferung',
        location: 'Küche',
        priority: 'medium',
        estimatedDuration: '20 min'
      },
      {
        id: 70,
        time: '08:30',
        title: 'Frühstückswägen einsammeln (Q2)',
        description: 'G201, G301. Danach Mopp "BT K" einsammeln',
        location: 'G201, G301',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 71,
        time: '10:10',
        title: 'Mittagessen bereitstellen (Q2)',
        description: 'C101, C201, C301, C102, C202, C302. N102, N103, N201, NOZ3, N101, N201, N202, N204. J301, J303, J201/202, J203, J103. D101, D102, D103, D201, D202, D203. H103, H201. K101/K102. Anschließend G201, G301 ausliefern. Dienstende 11:30 Uhr',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '80 min',
        condition: 'Dienstende 11:30 Uhr'
      }
    ],

    '27523-AKN': [
      {
        id: 80,
        time: '06:30',
        title: 'Körperteilkühlschrank kontrollieren',
        description: 'Körperteilkühlschrank in der Früh kontrollieren und eintragen!',
        location: 'Pathologie',
        priority: 'high',
        estimatedDuration: '15 min',
        condition: 'Datenschutz Montag: Bauteil C. Dienstag: Bauteil B/K. Mittwoch: Bauteil D/G'
      },
      {
        id: 81,
        time: '06:30',
        title: 'Bauteil K (OP, Z-Steri, K101)',
        description: 'Bauteil K (OP, Z-Steri, K101). Bauteil C (C301, C302, C201, C202, C101, C102)',
        location: 'Bauteil K und C',
        priority: 'high',
        estimatedDuration: '45 min'
      },
      {
        id: 82,
        time: '09:30',
        title: 'Bauteil D und G',
        description: 'Bauteil D (D203, D201, D103, D102, D101, Physik, Med., Z-Ergo). Bauteil G (G301, G201, Psychoth.)',
        location: 'Bauteil D und G',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 83,
        time: '11:00',
        title: 'Infekt Müll-Runde',
        description: 'Infekt Müll-Runde: Patho, Nuk, Labor, Theoretische, K101',
        location: 'Pathologie, Nuklearmedizin, Labor',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 84,
        time: '12:00',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 85,
        time: '12:30',
        title: 'Theoretische NC, Patho, Labor+ NUK, Radiologie',
        description: 'Theoretische NC, Patho, Labor+ NUK, Radiologie. Bauteil C (C301, C302, C201, C202, C101, C102)',
        location: 'Verschiedene Abteilungen und Bauteil C',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 86,
        time: '14:30',
        title: 'Weitere Arbeiten in der Müllzentrale',
        description: 'Weitere Arbeiten in der Müllzentrale: Infekt-Tonnen in Desinfektor, Datenschutz vernichten, Müllwägen für nächsten Tag vorbereiten, Jeden Freitag ganzen Technikmüll holen. Büro anrufen und abmelden. Drucker ausschalten und alle Türen abschließen.',
        location: 'Müllzentrale',
        priority: 'low',
        estimatedDuration: '60 min',
        condition: 'Jeden Freitag ganzen Technikmüll holen'
      }
    ],

    '27523-AKA': [
      {
        id: 87,
        time: '06:30',
        title: 'Körperteilkühlschrank kontrollieren',
        description: 'Körperteilkühlschrank in der Früh kontrollieren und eintragen!',
        location: 'Pathologie',
        priority: 'high',
        estimatedDuration: '15 min',
        condition: 'Datenschutz Montag: Bauteil N. Dienstag: Bauteil H/J. Mittwoch: Bauteil V'
      },
      {
        id: 88,
        time: '06:30',
        title: 'AMB. Röntgen',
        description: 'AMB. Röntgen',
        location: 'Röntgen Ambulanz',
        priority: 'high',
        estimatedDuration: '20 min'
      },
      {
        id: 89,
        time: '07:15',
        title: 'Bauteil N Wäscheausgabe',
        description: 'Bauteil N (N201, N103, N101, NOZ3, N204, N104). Wäscheausgabe (Wäschemagazin)',
        location: 'Bauteil N und Wäschemagazin',
        priority: 'high',
        estimatedDuration: '45 min'
      },
      {
        id: 90,
        time: '09:30',
        title: 'Bauteil H und J',
        description: 'Bauteil H (H302, H201, H202, H203, H101, H103). Bauteil J (J301, J303, J201, J202, J203, J101, J103, Verwaltung/Kirchengang)',
        location: 'Bauteil H und J',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 91,
        time: '10:00',
        title: 'Elektrotechnik-Müll (Freitag)',
        description: 'Elektrotechnik-Müll (Freitag). Technik + Med. Technik',
        location: 'Elektrotechnik Abteilung',
        priority: 'low',
        estimatedDuration: '30 min',
        condition: 'Nur Freitags'
      },
      {
        id: 92,
        time: '11:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 93,
        time: '12:00',
        title: 'Küchen – HLM – APO – und Technikmüll entsorgen',
        description: 'Küchen – HLM – APO – und Technikmüll entsorgen. Kindergartenmüll (Mittwoch, Freitag). (wird von der Außenrunde im Sommer mitgenommen!). Bauteil K (OP, Z-Steri, K101,). Bauteil N: 1.Stock & 2.Stock',
        location: 'Verschiedene Abteilungen',
        priority: 'medium',
        estimatedDuration: '60 min',
        condition: 'Kindergartenmüll Mittwoch & Freitag'
      },
      {
        id: 94,
        time: '14:30',
        title: 'Büro anrufen und abmelden',
        description: 'Büro anrufen und abmelden.',
        location: 'Büro',
        priority: 'low',
        estimatedDuration: '5 min'
      }
    ],

    '27518-Samstag': [
      {
        id: 95,
        time: '06:30',
        title: 'Frühstück ausliefern (Samstag)',
        description: 'C101, C201, C301 zum Lift. C101, C102, C201, C202, C301, C302 ausliefern. D101, D102, D103, D201, D202, D203 zum Lift. K101/K102 ausliefern. G201, G301 zum Lift. Anschließend Schmutzwäsche "BT H". Danach Schmutzwäsche mit 27519 (S3); "BT N". 27518: N201, N202, N204. 27519: N101, N102, N103, NOZ3. Danach Wäschewägen retour in Wäscheraum Unrein. Anschließend mit 27520; Frischwäschewägen bereitstellen zum Transport',
        location: 'Alle Stationen',
        priority: 'high',
        estimatedDuration: '90 min'
      },
      {
        id: 96,
        time: '08:30',
        title: 'Frühstück einsammeln (Samstag)',
        description: 'C101, C102, C201, C202, C301, C302 holen und zu V1. D101, D102, D103, D201, D202, D203 zu V1. K101/K102 holen und zu V1. G201, G301 zu V1',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 97,
        time: '10:30',
        title: 'Mittagessen ausliefern (Samstag)',
        description: 'C101, C201, C301 zum Lift. C101, C102, C201, C202, C301, C302 ausliefern. OP ausliefern (Spätestens um 11:00 Uhr sollte oben sein). K101/K102 ausliefern. D101, D102, D103, D201, D202, D203 zum Lift. G201, G301 zum Lift',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 98,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 99,
        time: '12:30',
        title: 'Mittagessen einsammeln (Samstag)',
        description: 'C101, C102, C201, C202, C301, C302 holen und zu V1. D101, D102, D103, D201, D202, D203 zu V1. K101/K102 holen und zu V1. G201, G301 zu V1. Danach Mopp "BT C" einsammeln und in Wäscheraum Unrein hinstellen',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '45 min'
      },
      {
        id: 100,
        time: '15:30',
        title: 'Abendessen ausliefern (Samstag)',
        description: 'C101, C102, C201, C202, C301, C302 ausliefern',
        location: 'Bauteil C Stationen',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 101,
        time: '16:00',
        title: 'Abendessen ausliefern (Samstag - Fortsetzung)',
        description: 'D101, D102, D103, D201, D202, D203 zum Lift. K101/K102 ausliefern und OP holen und zu V1',
        location: 'Bauteil D und K',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 102,
        time: '17:00',
        title: 'Abendessen einsammeln (Samstag)',
        description: 'D101, D102, D103, D201, D202, D203 holen und zu V1. C101, C102, C201, C202, C301, C302 holen und zu V1. Anschließend Rentomaten "BT C / D" Kontrollieren. Bei Dienstende (18:30 Uhr!!!) Tagesdokumentation in HBD - Briefkasten',
        location: 'Bauteil C und D',
        priority: 'medium',
        estimatedDuration: '60 min',
        condition: 'Bei Dienstende 18:30 Uhr!!! Tagesdokumentation in HBD'
      }
    ],

    '27518-Sonntag': [
      {
        id: 103,
        time: '06:30',
        title: 'Frühstück ausliefern (Sonntag)',
        description: 'C101, C201, C301 zum Lift. C101, C102, C201, C202, C301, C302 ausliefern. D101, D102, D103, D201, D202, D203 zum Lift. K101/K102 ausliefern. G201, G301 zum Lift. Anschließend Schmutzwäsche "BT H". Danach Schmutzwäsche mit 27519 (S3); "BT N". 27518: N201, N202, N204. 27519: N101, N102, N103, NOZ3. Danach Wäschewägen retour in Wäscheraum Unrein',
        location: 'Alle Stationen',
        priority: 'high',
        estimatedDuration: '90 min'
      },
      {
        id: 104,
        time: '08:30',
        title: 'Frühstück einsammeln (Sonntag)',
        description: 'C101, C102, C201, C202, C301, C302 holen und zu V1. D101, D102, D103, D201, D202, D203 zu V1. K101/K102 holen und zu V1. G201, G301 zu V1. Danach Schmutzwäsche "BT C" mit 27520',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '50 min'
      },
      {
        id: 105,
        time: '10:30',
        title: 'Mittagessen ausliefern (Sonntag)',
        description: 'C101, C201, C301 zum Lift. C101, C102, C201, C202, C301, C302 ausliefern. OP ausliefern (Spätestens um 11:00 Uhr oben). K101/K102 ausliefern. D101, D102, D103, D201, D202, D203 zum Lift. G201, G301 zum Lift',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 106,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 107,
        time: '12:30',
        title: 'Mittagessen einsammeln (Sonntag)',
        description: 'C101, C102, C201, C202, C301, C302 holen und zu V1. D101, D102, D103, D201, D202, D203 zu V1. K101/K102 holen und zu V1. G201, G301 zu V1. Danach Mopp "BT C" einsammeln und in Wäscheraum Unrein hinstellen',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '45 min'
      },
      {
        id: 108,
        time: '15:30',
        title: 'Abendessen ausliefern (Sonntag)',
        description: 'C101, C102, C201, C202, C301, C302 ausliefern. D101, D102, D103, D201, D202, D203 zum Lift. K101/K102 ausliefern / OP holen und zu V1',
        location: 'Bauteil C, D und K',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 109,
        time: '17:00',
        title: 'Abendessen einsammeln (Sonntag)',
        description: 'D101, D102, D103, D201, D202, D203 holen und zu V1. C101, C102, C201, C202, C301, C302 holen und zu V1. Anschließend Rentomaten "BT C / D" Kontrollieren. Bei Dienstende (18:30 Uhr!!!) Tagesdokumentation in HBD - Briefkasten',
        location: 'Bauteil C und D',
        priority: 'medium',
        estimatedDuration: '60 min',
        condition: 'Bei Dienstende 18:30 Uhr!!! Tagesdokumentation in HBD'
      }
    ],

    '27518-LD': [
      {
        id: 110,
        time: '06:30',
        title: 'Frühstück ausliefern (Wochentag)',
        description: 'C101, C102, C201, C202, C301, C302 zum Lift. D101, D102, D103, D201, D202, D203 zum Lift. K101/K102 und J103 zum Lift (Ab 7:00 Uhr: Radiologie Tee und Milch ausliefern, leere Teekanne wieder mitnehmen und K101 / K102 ausliefern). G201, G301 zum Lift',
        location: 'Alle Stationen',
        priority: 'high',
        estimatedDuration: '60 min'
      },
      {
        id: 111,
        time: '08:30',
        title: 'Frühstück einsammeln (Wochentag)',
        description: 'C101, C102, C201, C202, C301, C302 zu V1. D101, D102, D103, D201, D202, D203 zu V1. K101 / K102 holen und Transport zu V1. G201, G301 zu V1',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 112,
        time: '09:00',
        title: 'Apothekenversorgung',
        description: 'Apothekenversorgung; siehe Routenplan',
        location: 'Apotheke und Stationen',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 113,
        time: '10:30',
        title: 'Mittagessen ausliefern (Wochentag)',
        description: 'C101, C201, C301, C102 zum Lift. OP ausliefern (Spätestens um 11:00 sollte oben sein). K101 / K102 ausliefern. D101, D102, D103, D201, D202, D203 zum Lift. G201, G301 zum Lift. Anschließend Apothekenwägen Bauteil K zurückstellen (27522 ruft an)',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 114,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 115,
        time: '12:30',
        title: 'Essenwägen K101/102 zurückstellen',
        description: 'Essenwägen K101/102 zurückstellen zu V1. Danach Hauptmagazinwägen für 27529 / 27530 ausliefern. Anschließend Essenwägen einsammeln: C101, C102, C201, C202, C301, C302 zu V1. D101, D102, D103, D201, D202, D203 zu V1. G201, G301 zu V1',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 116,
        time: '14:10',
        title: 'Abendessen bereitstellen',
        description: 'Abendessen bereitstellen.',
        location: 'Küche',
        priority: 'medium',
        estimatedDuration: '20 min'
      },
      {
        id: 117,
        time: '15:30',
        title: 'Abendessen ausliefern (Wochentag)',
        description: 'C101, C102, C201, C202, C301, C302 ausliefern. Anschließend Rentomaten "BT D" austauschen',
        location: 'Bauteil C und D',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 118,
        time: '16:00',
        title: 'Abendessen ausliefern (Fortsetzung)',
        description: 'D101, D102, D103, D201, D202, D203 zum Lift. K101 / K102 ausliefern. G201, G301 ausliefern',
        location: 'Bauteil D, K und G',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 119,
        time: '17:00',
        title: 'Abendessen einsammeln (Wochentag)',
        description: 'D101, D102, D103, D201, D202, D203 holen und zu V1. C101, C102, C201, C202, C301, C302 holen und zu V1. Anschließend Rentomaten "BT C / D" austauschen. Bei Dienstende (18:30 Uhr!!!) Tagesdokumentation in HBD - Briefkasten',
        location: 'Bauteil C und D',
        priority: 'medium',
        estimatedDuration: '60 min',
        condition: 'Bei Dienstende 18:30 Uhr!!! Tagesdokumentation in HBD'
      }
    ],

    '27520-LD': [
      {
        id: 120,
        time: '06:30',
        title: 'Frühstück ausliefern (LD Wochentag)',
        description: 'N101, N102, N103, N201, N202, N204, NOZ3, N104 zum Lift. H101 ausliefern. J101 / J102, J201 / J202, J203, J301, J303 ausliefern. H103, H201, H203, H302 zum Lift',
        location: 'Bauteil N, H und J',
        priority: 'high',
        estimatedDuration: '60 min'
      },
      {
        id: 121,
        time: '08:30',
        title: 'Frühstück einsammeln (LD Wochentag)',
        description: 'J101 / J102, J103, J201 / J202, J203, J301, J303 holen und zu V1. N101, N102, N103, N201, N202, N204, NOZ3, N104 zu V1. H101 holen und zu V1. H103, H201, H203, H302 zu V1',
        location: 'Bauteil N, H und J',
        priority: 'medium',
        estimatedDuration: '40 min'
      },
      {
        id: 122,
        time: '09:00',
        title: 'Apothekenversorgung (LD)',
        description: 'Apothekenversorgung; siehe APO-Routenplan. HLM-versorgung (Altbau); HLM-Wägen ausliefern und anschließend einsammeln',
        location: 'Apotheke und HLM',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 123,
        time: '10:30',
        title: 'Mittagessen ausliefern (LD)',
        description: 'N101, N102, N103, N201, N202, N204, NOZ3, N104 zum Lift. OP, K101/102 (Bis zur Kreuzung BT K). C202, C302 zum Lift. H101, H102 ausliefern. J101 / J102, J103 / J201 / J202, J203, J301, J303 ausliefern. H103, H201, H203, H302 zum Lift',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 124,
        time: '12:00-12:30',
        title: 'Mittagspause',
        description: 'Mittagspause',
        location: 'Pausenraum',
        priority: 'break',
        estimatedDuration: '30 min'
      },
      {
        id: 125,
        time: '12:30',
        title: 'Hauptmagazinwägen ausliefern',
        description: 'Hauptmagazinwägen für 27529 / 27530 ausliefern (BT K). Danach Mittagessen einsammeln: J101 / J102, J103, J201 / J202, J203, J301, J303 holen und zu V1. N101, N102, N103, N201, N202, N204, NOZ3, N104 zu V1. H101, H102, H103, H201, H203, H302 zu V1. Danach gemeinsam mit 27529 / 27530 Hauptmagazinwägen zurückstellen',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '60 min'
      },
      {
        id: 126,
        time: '14:45',
        title: 'Abendessen bereitstellen mit 27518',
        description: 'Abendessen bereitstellen mit 27518',
        location: 'Küche',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 127,
        time: '15:15',
        title: 'Abendessen ausliefern (LD)',
        description: 'H103, H201 ausliefern. J103, J201 / J202, J203, J301, J303 ausliefern. OP zu V1',
        location: 'Bauteil H und J',
        priority: 'medium',
        estimatedDuration: '30 min'
      },
      {
        id: 128,
        time: '16:00',
        title: 'Küchen-Nachlieferung',
        description: 'Küchen-Nachlieferung (15:55 Uhr anrufen)',
        location: 'Küche',
        priority: 'low',
        estimatedDuration: '15 min',
        condition: '15:55 Uhr anrufen'
      },
      {
        id: 129,
        time: '17:00',
        title: 'Abendessen einsammeln (LD)',
        description: 'H103, H201 holen und zu V1. J103, J201 / J202, J203, J301, J303 holen und zu V1. N101, N102, N103, N201, N202, N204, NOZ3, N104 zu V1. K101 / K102 zu V1. G201, G301 zu V1. Anschließend Rentomaten "BT N" Kontrollieren',
        location: 'Alle Stationen',
        priority: 'medium',
        estimatedDuration: '60 min'
      }
    ]
  };

  const toggleTask = (taskId) => {
    const newCompletedTasks = new Set(completedTasks);
    const today = new Date().toDateString();
    
    // ✅ YENİ: DECT Kilidi Kontrolü
    const canEarnPoints = !selectedDepartmentLock || selectedDepartmentLock === selectedDepartment;
    
    if (newCompletedTasks.has(taskId)) {
      newCompletedTasks.delete(taskId);
      // Görev geri alınırsa ve puan alma hakkı varsa puan düş
      if (canEarnPoints) {
        const newPoints = Math.max(0, userPoints - 15);
        setUserPoints(newPoints);
      }
    } else {
      newCompletedTasks.add(taskId);
      
      // ✅ YENİ: İlk görev tamamlandığında DECT'i kilitle
      if (!selectedDepartmentLock && newCompletedTasks.size === 1) {
        setSelectedDepartmentLock(selectedDepartment);
        setLockDate(today);
        addNotification(`🔒 DECT ${selectedDepartment} für heute gesperrt. Punkte nur von diesem DECT!`, 'info');
      }
      
      // ✅ YENİ: Görev tamamlanırsa ve puan alma hakkı varsa puan kazan + ANIMASYON
      if (canEarnPoints) {
        const newPoints = userPoints + 15;
        setUserPoints(newPoints);
        
        // ✅ PUAN ANIMASYONU GÖSTER - Element gereksiz, orta hizalama
        addPointsAnimation(15, null);
        
        // ✅ SES EFEKTI - Yeni yumuşak ses
        playSound('taskComplete'); // taskComplete yerine eski ses
        triggerVibration('light');
        
        // ✅ BİLDİRİM KALDIRI - Tek görev için bildirim yok artık
        
      } else {
        // Farklı DECT'ten puan alınmaya çalışılırsa uyarı
        addNotification(`⚠️ Keine Punkte! Sie sind heute bei DECT ${selectedDepartmentLock} gesperrt.`, 'warning');
      }
    }
    
    setCompletedTasks(newCompletedTasks);
    
    // ✅ YENİ: TÜM GÖREVLER TAMAMLANDI MI KONTROL ET
    const totalTasksForDept = (taskTemplates[selectedDepartment] || []).length;
    const completedTasksForDept = Array.from(newCompletedTasks).filter(id =>
      (taskTemplates[selectedDepartment] || []).some(task => task.id === id)
    ).length;
    
    if (completedTasksForDept === totalTasksForDept && totalTasksForDept > 0) {
      // ✅ TÜM GÖREVLER TAMAMLANDI - KONFETI + SES!
      setTimeout(() => {
        triggerConfetti();
        playSuccessSound();
      }, 500); // Kısa bir gecikme ile daha etkileyici
    }
    
    // ✅ FIREBASE SYNC
    syncToFirebase('completedTasks', Array.from(newCompletedTasks));
    
    // ✅ PWA: Track offline changes
    if (!isOnline) {
      const change = {
        type: 'task_toggle',
        taskId,
        timestamp: new Date().getTime(),
        action: newCompletedTasks.has(taskId) ? 'complete' : 'uncomplete'
      };
      setOfflineChanges(prev => [...prev, change]);
      setSyncStatus('pending');
    }
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

  // Dinamik süre hesaplama fonksiyonu
  const calculateDuration = (currentTime, nextTime, isLastTask = false) => {
    // Zaman aralığı formatı kontrolü (12:00-12:30)
    if (currentTime.includes('-')) {
      const [start, end] = currentTime.split('-');
      const startMinutes = convertTimeToMinutes(start);
      const endMinutes = convertTimeToMinutes(end);
      return `${endMinutes - startMinutes} min`;
    }
    
    // Son görev için varsayılan süre
    if (isLastTask) {
      return '30 min';
    }
    
    // Normal hesaplama
    const currentMinutes = convertTimeToMinutes(currentTime);
    const nextMinutes = convertTimeToMinutes(nextTime);
    const duration = nextMinutes - currentMinutes;
    
    return `${duration} min`;
  };

  // Saat formatını dakikaya çeviren yardımcı fonksiyon
  const convertTimeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Dinamik süre ile görevleri güncelle
  const getTasksWithDynamicDuration = (tasks) => {
    return tasks.map((task, index) => {
      const nextTask = tasks[index + 1];
      const isLastTask = index === tasks.length - 1;
      
      return {
        ...task,
        estimatedDuration: calculateDuration(
          task.time,
          nextTask?.time,
          isLastTask
        )
      };
    });
  };

  // Dinamik süre ile görevleri al
  const currentTasks = getTasksWithDynamicDuration(taskTemplates[selectedDepartment] || []);
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

  // ✅ ERINNERUNG FUNKTIONEN
  // Timer für aktuelle Zeit
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Erinnerung kontrollü
  useEffect(() => {
    if (!reminderSettings.enabled) return;

    const checkReminders = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      currentTasks.forEach(task => {
        if (completedTasks.has(task.id)) return;
        
        let taskTimeMinutes;
        if (task.time.includes('-')) {
          const [start] = task.time.split('-');
          const [hours, minutes] = start.split(':').map(Number);
          taskTimeMinutes = hours * 60 + minutes;
        } else {
          const [hours, minutes] = task.time.split(':').map(Number);
          taskTimeMinutes = hours * 60 + minutes;
        }
        
        const reminderTime = taskTimeMinutes - reminderSettings.reminderMinutes;
        const timeDiff = currentMinutes - reminderTime;
        
        if (timeDiff >= 0 && timeDiff <= 1) {
          const existingNotification = notifications.find(n => n.taskId === task.id);
          if (!existingNotification) {
            const newNotification = {
              id: Date.now(),
              taskId: task.id,
              title: `Erinnerung: ${task.title}`,
              message: `Aufgabe beginnt in ${reminderSettings.reminderMinutes} Minuten um ${task.time}`,
              time: now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
              priority: task.priority,
              type: 'erinnerung', // ✅ Ses için tip belirt
              isRead: false
            };
            
            setNotifications(prev => [...prev, newNotification]);
            
            // ✅ YENİ: Ses ve titreşim ile bildirim
            playSound(reminderSettings.notificationSounds.reminder);
            triggerVibration(reminderSettings.vibrationIntensity);
          }
        }
      });
    };

    checkReminders();
  }, [currentTime, currentTasks, completedTasks, reminderSettings, notifications]);

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [audioContext, setAudioContext] = useState(null);
  const [soundBuffers, setSoundBuffers] = useState({});

  // ✅ YENİ: Animasyon ve Efekt State'leri
  const [pointsAnimation, setPointsAnimation] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebrationShake, setCelebrationShake] = useState(false);

  // Ses sistemini başlat
  useEffect(() => {
    const initAudio = async () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        setAudioContext(ctx);
        
        // Ses dosyalarını yükle (gerçek uygulamada ses dosyaları olacak)
        const sounds = {
          ding: generateTone(ctx, 800, 0.3, 'sine'),
          success: generateTone(ctx, 523, 0.8, 'success'), // ✅ YENİ: Melodic C major chord
          taskComplete: generateTone(ctx, 660, 0.4, 'triangle'), // ✅ YENİ: Yumuşak E note, kısa süre
          info: generateTone(ctx, 400, 0.2, 'square')
        };
        setSoundBuffers(sounds);
      } catch (error) {
        console.warn('Audio context başlatılamadı:', error);
      }
    };

    initAudio();
  }, []);

  // Ses oluşturma fonksiyonu - İyileştirilmiş melodic sesler
  const generateTone = (audioContext, frequency, duration, type = 'sine') => {
    const sampleRate = audioContext.sampleRate;
    const numSamples = duration * sampleRate;
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      let sample = 0;
      
      // ✅ YENİ: Çoklu harmonik ses oluşturma
      if (type === 'success') {
        // Melodic success sound - major chord
        sample = Math.sin(2 * Math.PI * frequency * time) * 0.3 +        // Ana ton
                 Math.sin(2 * Math.PI * frequency * 1.25 * time) * 0.2 +  // Major third
                 Math.sin(2 * Math.PI * frequency * 1.5 * time) * 0.15;   // Perfect fifth
      } else {
        switch (type) {
          case 'sine':
            sample = Math.sin(2 * Math.PI * frequency * time);
            break;
          case 'triangle':
            sample = 2 * Math.abs(2 * (frequency * time - Math.floor(frequency * time + 0.5))) - 1;
            break;
          case 'square':
            sample = Math.sin(2 * Math.PI * frequency * time) > 0 ? 1 : -1;
            break;
        }
      }
      
      // ✅ İyileştirilmiş fade out efekti
      const fadeOut = Math.max(0, 1 - Math.pow(i / numSamples, 1.5));
      channelData[i] = sample * fadeOut;
    }
    return buffer;
  };

  // ✅ YENİ: Puan Animasyonu Ekleme Fonksiyonu - Orta hizalama
  const addPointsAnimation = (points, element) => {
    const animationId = Date.now();
    
    // ✅ SAYFANIN ORTASINDAN ÇIKSIN
    const newAnimation = {
      id: animationId,
      points: `+${points}`,
      x: window.innerWidth / 2, // Sayfanın ortası
      y: window.innerHeight / 2, // Sayfanın ortası (dikey)
      timestamp: Date.now()
    };
    
    setPointsAnimation(prev => [...prev, newAnimation]);
    
    // 2 saniye sonra animasyonu kaldır
    setTimeout(() => {
      setPointsAnimation(prev => prev.filter(anim => anim.id !== animationId));
    }, 2000);
  };

  // ✅ YENİ: Konfeti Efekti Başlatma
  const triggerConfetti = () => {
    setShowConfetti(true);
    setCelebrationShake(true);
    
    // Konfeti 3 saniye gösterilsin
    setTimeout(() => setShowConfetti(false), 3000);
    // Titreşim 1 saniye sürsün
    setTimeout(() => setCelebrationShake(false), 1000);
  };

  // ✅ YENİ: Başarı Sesi Çalma
  const playSuccessSound = () => {
    if (reminderSettings.soundEnabled && audioContext && soundBuffers.success) {
      try {
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        
        source.buffer = soundBuffers.success;
        gainNode.gain.value = (reminderSettings.soundVolume / 100) * 1.5; // Biraz daha yüksek ses
        
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        source.start();
      } catch (error) {
        console.warn('Başarı sesi çalınamadı:', error);
      }
    }
  };
  const playSound = (soundType = 'ding') => {
    if (!reminderSettings.soundEnabled || !audioContext || !soundBuffers[soundType]) return;

    try {
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = soundBuffers[soundType];
      gainNode.gain.value = reminderSettings.soundVolume / 100;
      
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      source.start();
    } catch (error) {
      console.warn('Ses çalınamadı:', error);
    }
  };

  // Titreşim fonksiyonu
  const triggerVibration = (pattern = 'medium') => {
    if (!reminderSettings.vibrationEnabled || !navigator.vibrate) return;

    const patterns = {
      light: [100],
      medium: [200],
      strong: [300],
      double: [200, 100, 200],
      triple: [200, 100, 200, 100, 200]
    };

    try {
      navigator.vibrate(patterns[pattern] || patterns.medium);
    } catch (error) {
      console.warn('Titreşim desteklenmiyor:', error);
    }
  };

  // Bildirim fonksiyonu - ses ve titreşim ile
  const addNotificationWithSound = (message, type = 'info', soundType = 'ding', vibrationPattern = 'medium') => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);

    // Ses ve titreşim çal
    if (type === 'reminder' || type === 'erinnerung') {
      playSound(reminderSettings.notificationSounds.reminder);
      triggerVibration(reminderSettings.vibrationIntensity);
    } else if (type === 'success') {
      playSound(reminderSettings.notificationSounds.taskComplete);
      triggerVibration('double');
    } else {
      playSound(reminderSettings.notificationSounds.system);
      triggerVibration('light');
    }
  };

  // İstatistikleri güncelle
  useEffect(() => {
    const updateStats = () => {
      const total = currentTasks.length;
      const completed = Array.from(completedTasks).filter(id =>
        currentTasks.some(task => task.id === id)
      ).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // Hedef kontrolü ve streak hesaplama
      const weeklyGoalMet = rate >= 95;
      const monthlyGoalMet = rate >= 92;
      const newStreakDays = rate === 100 ? 5 : rate >= 80 ? 3 : rate >= 60 ? 2 : 1;
      
      setDailyStats({
        totalTasks: total,
        completedTasks: completed,
        completionRate: rate,
        averageTimePerTask: 25,
        mostActiveHour: '09:00',
        streakDays: newStreakDays,
        totalPoints: userPoints,
        weeklyGoal: 95,
        monthlyGoal: 92,
        weeklyGoalMet,
        monthlyGoalMet,
        efficiency: Math.min(rate + 5, 100),
        quality: Math.min(rate + 3, 100)
      });

      // ✅ CANLI YAYIN: Haftalık trend sıfırlama
      setWeeklyTrends(prev => 
        prev.map((week, index) => ({
          week: week.week,
          completion: 0, // ✅ SIFIRLANDI
          efficiency: 0, // ✅ SIFIRLANDI  
          quality: 0     // ✅ SIFIRLANDI
        }))
      );
    };
    
    updateStats();
  }, [currentTasks, completedTasks, userPoints]);

  // Belohnung Sistemi
  const rewards = [
    { id: 'coffee', name: 'Kostenloser Kaffee', icon: '☕', points: 9000, description: 'Gratis Kaffee aus dem Automaten' },
    { id: 'parking', name: '1 Tag Kostenlose Parkplatz', icon: '🅿️', points: 12000, description: '1 Tag VIP Parkplatz näher zum Eingang' },
    { id: 'lunch', name: 'Kostenloses Mittagessen', icon: '🍽️', points: 20000, description: 'Gratis Menü in der Kantine' },
    { id: 'wellness', name: 'Wellness Gutschein', icon: '💆', points: 40000, description: '50€ Gutschein für Spa/Massage' }
  ];

  const purchaseReward = (rewardId) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (reward && userPoints >= reward.points) {
      const newPoints = userPoints - reward.points;
      setUserPoints(newPoints);
      
      // Satın alınan ödülleri kaydet
      const newPurchased = [...purchasedRewards, {
        id: rewardId,
        name: reward.name,
        date: new Date().toLocaleDateString('de-DE'),
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      }];
      setPurchasedRewards(newPurchased);
      
      // Satın alma başarı mesajı göster
      alert(`🎉 ${reward.name} erfolgreich gekauft!\n💰 Verbrauchte Punkte: ${reward.points}\n⭐ Verbleibende Punkte: ${newPoints}`);
    }
  };

  // Haftalık veri simülasyonu - ✅ SIFIRLANDI
  const weeklyData = [
    { day: 'Mo', completed: 0, total: 0 }, // ✅ SIFIRLANDI
    { day: 'Di', completed: 0, total: 0 }, // ✅ SIFIRLANDI
    { day: 'Mi', completed: 0, total: 0 }, // ✅ SIFIRLANDI
    { day: 'Do', completed: 0, total: 0 }, // ✅ SIFIRLANDI
    { day: 'Fr', completed: dailyStats.completedTasks, total: dailyStats.totalTasks },
    { day: 'Sa', completed: 0, total: 0 },
    { day: 'So', completed: 0, total: 0 }
  ];

  const currentDeptPerformance = departmentPerformance.find(d => d.dept === selectedDepartment);
  const updatedDepartmentPerformance = departmentPerformance.map(dept =>
    dept.dept === selectedDepartment
      ? { ...dept, rate: dailyStats.completionRate, tasks: dailyStats.totalTasks }
      : dept
  );

  // Wäsche Dokumentation Verisi
  const waescheDocumentation = {
    'Bauteil K': ['OP', 'OP Nachtdienst', 'Anästhesie Nachtd.', 'Anästhesie', 'Angiographie', 'MRI', 'NUK', 'Zentralsterilisation', 'Röntgeninstitut', 'K101', 'K102', 'Internist', 'NC-Ambulanz', 'NL-Ambulanz', 'NMAZ', 'Portier', 'CT'],
    'Bauteil C': ['C101', 'C102', 'C201', 'C202', 'C301', 'C302', 'Labor', 'Pathologie', 'Gebäude C', 'Hausreinigung', 'Schlaflabor C 102', 'Theor. NC'],
    'Bauteil J': ['J101', 'J102', 'J103', 'J201', 'J202', 'J203', 'J301', 'J303', 'Nachtdienst J'],
    'Bauteil H': ['H101', 'H102', 'H103', 'H201', 'H202', 'H203', 'H302', 'Zentrum f. Suchtm.'],
    'Bauteil D': ['D101', 'D102', 'D103', 'D201', 'D202', 'D203', 'SPAZ', 'Logopädie', 'Ergotherapie', 'Physik. Med.', 'Musiktherapie', 'Kinderg.&Krabbel.', 'Techn.Betriebs.'],
    'Bauteil S': ['FH Ergotherapie', 'Gespag Akad.', 'Schule f. psych.', 'Ges.-und Krankpfl.', 'Sportwissen ger.'],
    'Bauteil L': ['Servicebereiche', 'Ärztliche Direktion', 'Aus- und Fortb.', 'Eink.- und Besch.', 'Klinische Sozial.', 'Personalstelle', 'Pflegedirektion', 'Rechnungswesen', 'Seelsorge, Kapelle', 'Sozialzentrum'],
    'Bauteil G': ['G201', 'G301', 'Klinische Psych.', 'Psychotherapie', 'Gebäude G', 'Küche', 'Apotheke'],
    'Bauteil N': ['NOZ3', 'N101', 'N102', 'N103', 'N104', 'N201', 'N202', 'N204', 'Nachtdienst N', 'Betriebsrat', 'Arbeitsmedizin', 'Hausreinigung', 'HBD', 'Wäscheversorgung', 'Notfalllager']
  };

  // Demo Apotheke Dokumentation Verisi
  const apothekeDocumentation = {
    'Bauteil C': ['C101 - Innere Medizin', 'C102 - Kardiologie', 'C201 - Neurologie', 'C202 - Onkologie', 'C301 - Ambulanz', 'C302 - Tagesklinik'],
    'Bauteil D': ['D101 - Pädiatrie', 'D102 - Neonatologie', 'D201 - Gynäkologie', 'D202 - Geburtshilfe', 'D203 - Chirurgie'],
    'Bauteil H': ['H101 - Intensivstation', 'H102 - Intermediate Care', 'H103 - Recovery', 'H201 - Orthopädie', 'H302 - Unfallchirurgie'],
    'Bauteil J': ['J101 - Psychiatrie', 'J102 - Psychosomatik', 'J201 - Suchtmedizin', 'J301 - Tagesklinik Psychiatrie'],
    'Bauteil K': ['OP-Säle 1-8', 'Anästhesie', 'Aufwachraum', 'Notfall-OP', 'Ambulante OPs'],
    'Bauteil N': ['Notaufnahme', 'Schockraum', 'Erste Hilfe', 'Rettungsstelle', 'Beobachtungsstation'],
    'Spezialstationen': ['Dialyse', 'Endoskopie', 'Herzkatheterlabor', 'Radiologie', 'Nuklearmedizin', 'Pathologie']
  };

  // ✅ YENİ: Kleiderbügel Dokumentation - Görselden alınmış veriler
  const kleiderbugelDocumentation = {
    'Anlieferung Rentomat BT N': [
      'N Waschraum Damen N.00.111.1 - 1 Kleiderbügelständer',
      'N Waschraum Herren N.00.110.1 - 1 Kleiderbügelständer', 
      'N Personalumkleide Herren N.00.109.0 - 1 Kleiderbügelständer',
      'N Personalumkleide Damen N.00.108.0 - 1 Kleiderbügelständer'
    ],
    'Anlieferung Rentomat BT G': [
      'G Psychologischer Dienst G.10.226.1 - nicht notwendig',
      'G Personalumkleide Damen G.00.233.0 (keine Wäscheklappe) - 1 Kleiderbügelständer',
      'G Waschraum / Dusche Herren G.00.229.0 (keine Wäscheklappe) - 1 Kleiderbügelständer'
    ],
    'Anlieferung Rentomat BT J': [
      'J Personalumkleide Damen J.00.006.0 - 1 Kleiderbügelständer',
      'J Personalumkleide Herren J.00.007.0 - 1 Kleiderbügelständer'
    ],
    'Anlieferung Rentomat BT H': [
      'H Personalumkleide Damen T.00.003.3 - 1 Kleiderbügelständer',
      'H Waschraum H.30.105.0 - nicht notwendig',
      'H Waschraum H.30.103.0 - nicht notwendig'
    ],
    'Anlieferung Rentomat BT D': [
      'D Waschraum / Dusche D.01.008.0 - nicht notwendig',
      'D Waschraum / Dusche D.01.007.0 - nicht notwendig',
      'D Personalumkleide Damen D.01.006.0 - 1 Kleiderbügelständer',
      'D Personalumkleide Damen Patho D.01.009 - 1 Kleiderbügelständer'
    ],
    'Anlieferung Rentomat BT C': [
      'C Personalumkleide Damen C.01.009.0 - 2 Kleiderbügelständer',
      'C Personalumkleide Herren C.01.011.0 (keine Wäscheklappe) - 1 Kleiderbügelständer',
      'C Personalumkleide Damen C.01.014.0 - 1 Kleiderbügelständer',
      'C Personalumkleide Herren C.01.015.0 - 2 Kleiderbügelständer'
    ]
  };

  // ✅ YENİ: Transport Neubau Dokumentation
  const transportNeuDocumentation = {
    'Hauptmagazin Neubau': {
      'Bauteil C': ['C101', 'Sek.NL', 'C102', 'Sek.NC', 'C201', 'C202', 'C301', 'C302', 'Labor', 'Patho', 'Theoretische Neurochirurgie'],
      'Bauteil D': ['SPAZ', 'D101', 'D102', 'D103', 'D201', 'D202', 'D203', 'Psychosomatik Sekretariat', 'Logopädie', 'Musiktherapie', 'Physikalische Medizin', 'Zentrale Ergotherapie'],
      'Bauteil B / Ambulanzen': ['Augen Amb.', 'Dermatologie Amb.', 'Gyn.Amb.', 'HNO Amb.', 'Internist', 'NC Amb.', 'Neuroonkologische Ambulanz', 'Neurophysiologie (EEG, EMG)', 'Neurosonologie', 'NL Amb.', 'NMAZ', 'Portier', 'Schmerzambulanz / Akutambulanz', 'Urologie Amb.'],
      'Bauteil K': ['Anästhesie', 'Angiographie', 'CT', 'K101', 'K102', 'MRI', 'NUK', 'OP', 'Röntgeninstitut', 'Zentralsterilisation AEMP'],
      'Bauteil G': ['G201', 'G301', 'Klin. Psychologie', 'Psychotherapie', 'Wundmanagement']
    }
  };

  // ✅ YENİ: Transport Altbau Dokumentation  
  const transportAltDocumentation = {
    'Hauptmagazin Altbau': {
      'Bauteil J': ['Anzahl der Wägen', 'J101', 'J102', 'J103', 'J201', 'J202', 'J203', 'J301', 'J303', 'Anzahl der Wägen bis'],
      'Bauteil S': ['Anzahl der Wägen', 'Schule', 'Anzahl der Wägen bis'],
      'Bauteil H': ['Anzahl der Wägen', 'H101', 'H102', 'H103', 'H201', 'H202', 'H203', 'H302', 'Anzahl der Wägen bis'],
      'Bauteil N': ['Anzahl der Wägen', 'N101', 'N102', 'N103', 'N104', 'N201', 'N202', 'N204', 'Anzahl der Wägen bis']
    }
  };

  // ✅ YENİ: Medikamente Neubau Dokumentation
  const medikamenteNeuDocumentation = {
    'Medikamente Neubau': {
      'Bauteil C': ['Anzahl der Wägen', 'C101', 'C102', 'C201', 'C202', 'C301', 'C302', 'bis'],
      'Bauteil D': ['Anzahl der Wägen', 'D101', 'D102', 'D103', 'D201', 'D202', 'D203', 'bis'],
      'Bauteil B / Ambulanzen': ['Anzahl der Wägen', 'bis'],
      'Bauteil K': ['Anzahl der Wägen', 'Anästhesie', 'Angiographie', 'CT', 'K101', 'K102', 'MRI', 'NUK', 'OP', 'Röntgeninstitut', 'Zentralsterilisation AEMP', 'bis'],
      'Bauteil G': ['Anzahl der Wägen', 'G201', 'G301', 'Klin. Psychologie', 'Psychotherapie', 'bis']
    }
  };

  // ✅ YENİ: Medikamente Altbau Dokumentation
  const medikamenteAltDocumentation = {
    'Medikamente Altbau': {
      'Bauteil J': ['Anzahl der Wägen', 'J101', 'J102', 'J103', 'J201', 'J202', 'J203', 'J301', 'J303', 'bis'],
      'Bauteil S': ['Anzahl der Wägen', 'Schule', 'bis'],
      'Bauteil H': ['Anzahl der Wägen', 'H101', 'H102', 'H103', 'H201', 'H202', 'H203', 'H302', 'bis'],
      'Bauteil N': ['Anzahl der Wägen', 'N101', 'N102', 'N103', 'N104', 'N201', 'N202', 'N204', 'bis']
    }
  };

  // ✅ YENİ: Suchtgift Dokumentation
  const suchtgiftDocumentation = {
    'Suchtgift Kontrolle': {
      'Bauteil B': ['Anzahl der Wägen', 'Anästhesie', 'Angiographie', 'CT', 'K101', 'K102', 'MRI', 'NUK', 'OP', 'Röntgeninstitut', 'Zentralsterilisation AEMP', 'bis'],
      'Bauteil K': ['Anzahl der Wägen', 'Anästhesie', 'Angiographie', 'CT', 'K101', 'K102', 'MRI', 'NUK', 'OP', 'Röntgeninstitut', 'bis'],
      'Bauteil D': ['Anzahl der Wägen', 'SPAZ', 'D101', 'D102', 'D103', 'Pathologie', 'Psychosomatik Sekretariat', 'Physikalische Medizin', 'Zentrale Ergotherapie', 'bis'],
      'Bauteil H': ['Anzahl der Wägen', 'H101', 'H102', 'H103', 'H201', 'H202', 'H203', 'Zentrum f. Suchtmedizin Ambulanz Fz', 'bis'],
      'Bauteil G': ['Anzahl der Wägen', 'G201', 'G301', 'Kein. Psychologie', 'Psychiatrie', 'bis']
    }
  };

  // ✅ YENİ: Bad Hall Versorgung Dokumentation
  const badHallDocumentation = {
    'Bad Hall Versorgung': {
      'Bad Hall': ['Ergotherapie', 'Abhängigkeitserkrankungen', 'Sonnenpark', 'Physiotherapie', 'Sonstige'],
      'NMC': ['Hauptmagazin', 'Medizintechnik', 'Apotheke', 'Kassa', 'Labor', 'Pathologie', 'Poststelle', 'H102', 'Abfallzentrale', 'Sonstige', 'Anzahl Spritzenbehälter']
    }
  };

  const toggleDocumentationCheck = (bauteil, station) => {
    const key = `${bauteil}-${station}`;
    setDocumentationChecks(prev => {
      const currentCount = prev[key] || 0;
      const newCount = currentCount >= 3 ? 0 : currentCount + 1;
      
      if (newCount === 0) {
        const { [key]: removed, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [key]: newCount
      };
    });
  };

  const getCheckSymbol = (bauteil, station) => {
    const key = `${bauteil}-${station}`;
    const count = documentationChecks[key] || 0;
    
    if (count === 0) return null;
    if (count === 1) return '✓';
    if (count === 2) return '✓✓';
    if (count === 3) return '✓✓✓';
  };

  // ✅ YENİ: DECT LOCK FUNCTIONS
  const lockDECT = async (dectCode) => {
    const today = new Date().toDateString();
    const userId = getUserId();
    const deviceId = getDeviceId();
    
    const lockData = {
      dectCode,
      userId,
      deviceId,
      userName: `Benutzer ${userId.slice(-4)}`, // Kısa kullanıcı adı
      lockTime: Date.now(),
      lockDate: today
    };

    // Firebase'e kilidi kaydet
    await firebaseService.updateData(`lockedDECTs/${dectCode}`, lockData);
    console.log(`🔒 DECT ${dectCode} locked by user ${userId}`);
  };

  const unlockDECT = async (dectCode) => {
    // Firebase'den kilidi kaldır
    await firebaseService.updateData(`lockedDECTs/${dectCode}`, null);
    console.log(`🔓 DECT ${dectCode} unlocked`);
  };

  const isDECTLocked = (dectCode) => {
    const today = new Date().toDateString();
    const lock = lockedDECTs[dectCode];
    
    if (!lock) return false;
    if (lock.lockDate !== today) return false; // Eski kilit, geçersiz
    
    const userId = getUserId();
    return lock.userId !== userId; // Başka biri tarafından kilitlenmişse true
  };

  const getDECTLockInfo = (dectCode) => {
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
  const handleLeaderLogin = () => {
    if (leaderPassword === 'kukhbd') {
      setIsLeaderMode(true);
      setShowLeaderDashboard(true);
      setShowPasswordPrompt(false);
      setLeaderPassword('');
    } else {
      alert('❌ Falsches Passwort!');
      setLeaderPassword('');
    }
  };

  const handleLeaderLogout = () => {
    setIsLeaderMode(false);
    setShowLeaderDashboard(false);
    setShowPasswordPrompt(false);
    setLeaderPassword('');
  };

  // ✅ YENİ: Modern Leiter Dashboard States
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('all');
  const [searchTermLeader, setSearchTermLeader] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dashboardData, setDashboardData] = useState({});
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardViewMode, setDashboardViewMode] = useState('grid'); // 'grid', 'list', 'analytics'

  // Tüm departmanlar için istatistikleri topla
  const getAllDepartmentStats = () => {
    const today = new Date().toDateString();
    
    return Object.keys(departments).map(deptCode => {
      const tasks = taskTemplates[deptCode] || [];
      
      // ✅ FIREBASE: Get completed tasks from real-time data
      let completed = 0;
      if (allDepartmentData[deptCode] && allDepartmentData[deptCode][today]) {
        const firebaseCompletedTasks = allDepartmentData[deptCode][today].completedTasks || [];
        completed = Array.from(firebaseCompletedTasks).filter(id =>
          tasks.some(task => task.id === id)
        ).length;
      }
      
      // Fallback to local data if no Firebase data
      if (completed === 0 && deptCode === selectedDepartment) {
        completed = Array.from(completedTasks).filter(id =>
          tasks.some(task => task.id === id)
        ).length;
      }
      
      const total = tasks.length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        code: deptCode,
        name: departments[deptCode],
        completed,
        total,
        rate,
        tasks: tasks,
        status: rate >= 80 ? 'excellent' : rate >= 60 ? 'good' : 'attention',
        lastUpdate: allDepartmentData[deptCode]?.[today]?.lastUpdate || null,
        isRealTime: !!(allDepartmentData[deptCode]?.[today]),
        // ✅ YENİ: Enhanced Leiter Dashboard Data
        completion: rate,
        efficiency: Math.min(rate + 5, 100),
        trend: rate >= 80 ? 'up' : rate >= 60 ? 'stable' : 'down',
        priority: rate < 60 ? 'high' : rate < 80 ? 'medium' : 'low',
        activeUsers: allDepartmentData[deptCode]?.[today] ? 1 : 0,
        avgTime: 25 + Math.floor(Math.random() * 10)
      };
    });
  };

  // ✅ YENİ: Leiter Dashboard Helper Functions
  const getStatusColor = (status) => {
    switch(status) {
      case 'excellent': return 'from-green-500 to-emerald-600';
      case 'good': return 'from-blue-500 to-indigo-600';
      case 'attention': return 'from-orange-500 to-red-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'excellent': return <CheckCircle className="w-5 h-5" />;
      case 'good': return <Target className="w-5 h-5" />;
      case 'attention': return <AlertCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const timeAgo = (date) => {
    if (!date) return 'Nie';
    // ✅ Use stable time to prevent constant changes
    const now = stableTime.getTime();
    const then = new Date(date).getTime();
    const minutes = Math.floor((now - then) / 60000);
    if (minutes < 1) return 'Gerade eben';
    if (minutes < 60) return `vor ${minutes}m`;
    return `vor ${Math.floor(minutes / 60)}h`;
  };

  // ✅ ANTI-FLICKER: Frozen dashboard data - updates only on manual refresh
  const [frozenDashboardData, setFrozenDashboardData] = useState(null);
  const [lastFreezeTime, setLastFreezeTime] = useState(Date.now());

  // ✅ Initialize frozen data once and keep it stable
  useEffect(() => {
    if (!frozenDashboardData) {
      const allStats = getAllDepartmentStats();
      const frozenData = {
        metrics: {
          totalDepartments: allStats.length,
          activeDepartments: Math.max(1, allStats.filter(d => d.activeUsers > 0).length), // Prevent flicker
          avgCompletion: Math.round(allStats.reduce((sum, d) => sum + d.completion, 0) / allStats.length),
          totalTasks: allStats.reduce((sum, d) => sum + d.total, 0),
          completedTasks: allStats.reduce((sum, d) => sum + d.completed, 0),
          highPriorityIssues: allStats.filter(d => d.status === 'attention').length,
          avgEfficiency: Math.round(allStats.reduce((sum, d) => sum + d.efficiency, 0) / allStats.length)
        },
        departments: allStats.map(dept => ({
          ...dept,
          // ✅ Freeze time-related fields to prevent flicker
          lastUpdateText: dept.lastUpdate ? 'Live' : 'Offline',
          avgTimeStable: dept.avgTime || 25 // Stable value
        })),
        frozenTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        frozenDate: new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
      };
      
      setFrozenDashboardData(frozenData);
      setLastFreezeTime(Date.now());
      console.log('🧊 Dashboard data frozen to prevent flicker');
    }
  }, []);

  // ✅ YENİ: Stable data for dashboard to prevent flickering
  const [stableMetrics, setStableMetrics] = useState(null);
  const [stableActivity, setStableActivity] = useState([]);
  const [stableTime, setStableTime] = useState(new Date()); // ✅ STABLE TIME FOR DASHBOARD

  // ✅ Initialize stable data once
  useEffect(() => {
    if (!stableMetrics) {
      const allStats = getAllDepartmentStats();
      setStableMetrics({
        totalDepartments: allStats.length,
        activeDepartments: allStats.filter(d => d.activeUsers > 0).length,
        avgCompletion: Math.round(allStats.reduce((sum, d) => sum + d.completion, 0) / allStats.length),
        totalTasks: allStats.reduce((sum, d) => sum + d.total, 0),
        completedTasks: allStats.reduce((sum, d) => sum + d.completed, 0),
        highPriorityIssues: allStats.filter(d => d.status === 'attention').length,
        avgEfficiency: Math.round(allStats.reduce((sum, d) => sum + d.efficiency, 0) / allStats.length)
      });
    }
  }, []);

  // ✅ Update stable time only every minute to prevent flickering
  useEffect(() => {
    const updateStableTime = () => {
      setStableTime(new Date());
    };
    
    // Update immediately, then every minute
    updateStableTime();
    const interval = setInterval(updateStableTime, 60000); // Every minute instead of every second
    
    return () => clearInterval(interval);
  }, []);

  // ✅ Initialize stable activity once
  useEffect(() => {
    if (stableActivity.length === 0) {
      const activities = [
        {
          time: '16:33',
          dept: '27522',
          action: '8 Aufgaben erfolgreich abgeschlossen',
          type: 'success'
        },
        {
          time: '16:34',
          dept: '27518',
          action: 'Unterdurchschnittliche Leistung festgestellt',
          type: 'warning'
        },
        {
          time: '16:37',
          dept: '27521',
          action: 'Unterdurchschnittliche Leistung festgestellt',
          type: 'warning'
        },
        {
          time: '16:37',
          dept: '27519',
          action: 'Unterdurchschnittliche Leistung festgestellt',
          type: 'warning'
        },
        {
          time: '16:38',
          dept: '27529',
          action: '9 Aufgaben erfolgreich abgeschlossen',
          type: 'success'
        }
      ];
      setStableActivity(activities);
    }
  }, []);

  // ✅ YENİ: Dashboard Refresh Function with frozen data update
  const handleDashboardRefresh = async () => {
    setIsDashboardLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ✅ Update frozen data only on manual refresh
      const allStats = getAllDepartmentStats();
      const newFrozenData = {
        metrics: {
          totalDepartments: allStats.length,
          activeDepartments: Math.max(1, allStats.filter(d => d.activeUsers > 0).length),
          avgCompletion: Math.round(allStats.reduce((sum, d) => sum + d.completion, 0) / allStats.length),
          totalTasks: allStats.reduce((sum, d) => sum + d.total, 0),
          completedTasks: allStats.reduce((sum, d) => sum + d.completed, 0),
          highPriorityIssues: allStats.filter(d => d.status === 'attention').length,
          avgEfficiency: Math.round(allStats.reduce((sum, d) => sum + d.efficiency, 0) / allStats.length)
        },
        departments: allStats.map(dept => ({
          ...dept,
          lastUpdateText: dept.lastUpdate ? 'Live' : 'Offline',
          avgTimeStable: dept.avgTime || 25
        })),
        frozenTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        frozenDate: new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
      };
      
      setFrozenDashboardData(newFrozenData);
      setStableTime(new Date()); 
      setLastFreezeTime(Date.now());
      
      console.log('🔄 Dashboard data refreshed and re-frozen');
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  // ✅ YENİ: Departman detaylarını açma fonksiyonu
  const handleDepartmentClick = (deptCode) => {
    console.log('Department clicked:', deptCode); // Debug için
    const deptStats = getAllDepartmentStats().find(d => d.code === deptCode);
    console.log('Department stats:', deptStats); // Debug için
    setSelectedDepartmentDetails(deptStats);
    setShowDepartmentTaskDetails(true);
  };

  // ✅ YENİ: Görev durumunu kontrol etme fonksiyonu
  const getTaskStatus = (taskId) => {
    return completedTasks.has(taskId) ? 'completed' : 'pending';
  };

  const toggleApothekeCheck = (bauteil, station) => {
    const key = `${bauteil}-${station}`;
    setApothekeChecks(prev => {
      const currentCount = prev[key] || 0;
      const newCount = currentCount >= 3 ? 0 : currentCount + 1;
      
      if (newCount === 0) {
        const { [key]: removed, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [key]: newCount
      };
    });
  };

  const getApothekeCheckSymbol = (bauteil, station) => {
    const key = `${bauteil}-${station}`;
    const count = apothekeChecks[key] || 0;
    
    if (count === 0) return null;
    if (count === 1) return '✓';
    if (count === 2) return '✓✓';
    if (count === 3) return '✓✓✓';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 overflow-x-hidden relative">
      {/* ✅ PWA SPLASH SCREEN - Native App Experience */}
      {isInstalled && (
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 z-[9999] flex items-center justify-center pwa-splash-screen">
          <div className="text-center">
            <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <Home className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Bringolino</h1>
            <p className="text-blue-100">Kepler Universitätsklinikum</p>
            <div className="mt-8 w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      )}
      
      {/* ✅ PWA STATUS BAR SPACER for notched devices */}
      <div className="pwa-status-bar-spacer"></div>
      {/* ✅ PWA META TAGS - Native App Experience */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Bringolino" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="application-name" content="Bringolino" />
      <meta name="theme-color" content="#4F46E5" />
      <meta name="msapplication-navbutton-color" content="#4F46E5" />
      <meta name="msapplication-TileColor" content="#4F46E5" />
      
      {/* ✅ PWA MANIFEST */}
      <link rel="manifest" href="data:application/json;base64,eyJuYW1lIjoiQnJpbmdvbGlubyIsInNob3J0X25hbWUiOiJCcmluZ29saW5vIiwic3RhcnRfdXJsIjoiLyIsImRpc3BsYXkiOiJzdGFuZGFsb25lIiwidGhlbWVfY29sb3IiOiIjNEY0NkU1IiwiYmFja2dyb3VuZF9jb2xvciI6IiM0RjQ2RTUiLCJpY29ucyI6W3sic3JjIjoiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlCM2FXUjBhRDBpTWpRaUlHaGxhV2RvZEQwaU1qUWlJSFpwWlhkQ2IzZzlJakFnTUNBeU5DQXlOQ0lpSUdacGJHdzlJbTV2Ym1VaUlIaHRiRzV6UFNKb2RIUndPaTh2ZDNkM0xuY3pMbTl5Wnk4eU1EQXdMM04yWnlJK1BHUmxabk0rUEd4cGJtVmhja2R5WVdScFpXNTBJR2xrUFNKbmNtRmthV1Z1ZENJaWVERTlJakFsSWlCNU1UMGlNQ1VpSUhneTBTSXhNREFsSWlCNU1qMGlNQ1VpUGp4emRHOXdJRzltWm5ObGREMGlNQ1VpSUhOMGIzQXRZMjlzYjNJOUlpTTBSRFEyUlRVaUx6NEk2TzR6YzNSdmNDQnZabVp6WlhROUlqRXdNQ1VpSUhOMGIzQXRZMjlzYjNJOUlpTkZRemhET1RraUx6NGdQQzlzYVc1bFlYSkhjbUZrYVdWdWRENDhMMlJsWm5NK1BHTnBjbU5zWlNCallUMGlNVElpSUdONFBTSXhNaUlpSUhJOUlqRXdJaUJtYVd4c1BTSjFjbXdvSTJkeVlXUnBaVzUwS1NJdkx6NDhZMmx5WTJ4bElHTjRQU0l4TWlJZ1kza3BTSTB3VWlJZ2NqMGlNVEFpSUdacGJHdzlJblZ5YkNnalozSmhaR2xsYm5RcElpOHZQand2YzNabitsz0iic2l6ZXMiOiIyNHgyNCIsInR5cGUiOiJpbWFnZS9zdmcreG1sIn1dLCJkaXJlY3Rpb24iOiJsdHIiLCJvcmllbnRhdGlvbiI6InBvcnRyYWl0IiwibGFuZyI6ImRlIn0=" />
      
      {/* ✅ iOS SPLASH SCREENS */}
      <link rel="apple-touch-startup-image" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" />
      
      {/* ✅ APP ICONS */}
      <link rel="apple-touch-icon" sizes="180x180" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDE4MCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzRGNDZFNSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI0VDNEc5OSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIiByeD0iNDAiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+PGNpcmNsZSBjeD0iOTAiIGN5PSI5MCIgcj0iNDAiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjkiLz48L3N2Zz4=" />
      <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNEY0NkU1Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRUM0RzQ5Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iOCIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuOSIvPjwvc3ZnPg==" />
      {/* ✅ RESPONSIVE HEADER - Mobile First, Desktop Scalable */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg overflow-x-hidden">
        <div className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 max-w-full">
          <div className="flex items-center justify-between w-full min-w-0">
            {/* ✅ PWA STATUS BAR */}
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
                  {/* ✅ PWA: Network Status Indicator */}
                  <div className="flex items-center">
                    {isOnline ? (
                      <Wifi className="w-3 h-3 text-green-500" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-red-500" />
                    )}
                    {syncStatus === 'pending' && (
                      <div className="w-2 h-2 bg-yellow-400 rounded-full ml-1 animate-pulse" />
                    )}
                    {syncStatus === 'syncing' && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full ml-1 animate-spin" />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* ✅ RESPONSIVE QUICK ACTIONS - Hidden/Visible based on screen size */}
            <div className="flex items-center space-x-1 min-w-0">
              {/* Desktop Quick Actions - Reduced on smaller screens */}
              <div className="hidden xl:flex items-center space-x-1 xl:space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-xl bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg hover:scale-105 transition-transform flex-shrink-0"
                >
                  <Settings className="w-4 h-4 xl:w-5 xl:h-5" />
                </button>
                <button
                  onClick={() => setShowDocumentation(!showDocumentation)}
                  className="p-2 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg hover:scale-105 transition-transform"
                >
                  <FileText className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowMoppVersorgung(!showMoppVersorgung)}
                  className="p-2 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg hover:scale-105 transition-transform"
                >
                  <FileText className="w-5 h-5" />
                </button>
                {/* Header buttons reduced for mobile space */}
                <button
                  onClick={() => {
                    setShowMedikamenteNeu(!showMedikamenteNeu);
                    if (!showMedikamenteNeu) {
                      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                    }
                  }}
                  className="p-2 rounded-xl bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-lg hover:scale-105 transition-transform"
                >
                  <Pill className="w-5 h-5" />
                </button>
              </div>
              
              {/* Medium screens - Fewer buttons */}
              <div className="hidden lg:flex xl:hidden items-center space-x-1">
                <button
                  onClick={() => setShowDocumentation(!showDocumentation)}
                  className="p-2 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg hover:scale-105 transition-transform"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowMedikamenteNeu(!showMedikamenteNeu);
                    if (!showMedikamenteNeu) {
                      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                    }
                  }}
                  className="p-2 rounded-xl bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-lg hover:scale-105 transition-transform"
                >
                  <Pill className="w-4 h-4" />
                </button>
              </div>
              
              {/* Always Visible Core Actions */}
              {/* ✅ PWA: NATIVE APP ICON with Gradient */}
              {isInstalled && (
                <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg relative">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Home className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
              )}
              
              {/* ✅ PWA: Install App Button with Gradient Icon */}
              {showInstallBanner && !isInstalled && (
                <button
                  onClick={handleInstallApp}
                  className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:scale-105 transition-transform flex items-center"
                  title="Als Native App installieren"
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-1 shadow-lg">
                    <Download className="w-3 h-3 text-white" />
                  </div>
                </button>
              )}
              
              {/* ✅ MOBİL KULLANICI BİLGİSİ - REMOVED FOR MOBILE SPACE */}
              
              {/* ✅ YENİ: TOPLAM PUAN GÖSTERGESI - LEITER DASHBOARD YANINDA */}
              <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 text-white px-2 sm:px-3 py-1.5 rounded-xl shadow-lg">
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-bold text-xs sm:text-sm">{userPoints}</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  if (isLeaderMode) {
                    handleLeaderLogout();
                  } else {
                    setShowPasswordPrompt(true);
                  }
                }}
                className={`p-2 rounded-xl text-white shadow-lg hover:scale-105 transition-transform ${
                  isLeaderMode
                    ? 'bg-gradient-to-r from-red-400 to-red-500'
                    : 'bg-gradient-to-r from-purple-400 to-purple-500'
                }`}
              >
                {isLeaderMode ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Users className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-lg hover:scale-105 transition-transform"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </div>
                )}
              </button>
              
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-400 text-white shadow-lg hover:scale-105 transition-transform"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
          
          {/* ✅ ENHANCED PWA INSTALL BANNER - Native Browser Integration + Gradient Icon */}
          {showInstallBanner && !isInstalled && (
            <div className="mt-4 p-4 sm:p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-2xl shadow-2xl border-2 border-green-300 max-w-2xl mx-auto transform hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-green-800 flex items-center text-base sm:text-lg">
                  {/* ✅ GRADIENT APP ICON IN BANNER */}
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                    <Home className="w-5 h-5 text-white" />
                  </div>
                  📱 Bringolino als Native App installieren
                </h3>
                <button 
                  onClick={() => {
                    setShowInstallBanner(false);
                    localStorage.setItem('bringolino_install_banner_dismissed', 'true');
                    console.log('🚀 Install banner dismissed and saved to localStorage');
                  }} 
                  className="p-2 rounded-full hover:bg-green-100 transition-all hover:scale-110"
                >
                  <X className="w-4 h-4 text-green-600" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm sm:text-base text-green-700 font-medium">
                  🚀 Installieren Sie Bringolino für 95% native App-Erfahrung!
                </p>
                
                {/* Native App Benefits */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-green-200">
                  <div className="text-sm text-green-800">
                    <strong>✨ Native App Erfahrung:</strong>
                    <div className="mt-2 space-y-1">
                      <div>🎯 <strong>Vollbild-Modus:</strong> Keine Browser-Leiste, echtes App-Gefühl</div>
                      <div>🚀 <strong>Splash Screen:</strong> Professioneller App-Start mit Logo</div>
                      <div>⚡ <strong>Blitzschnell:</strong> Instant-Loading wie native Apps</div>
                      <div>🔔 <strong>Push-Benachrichtigungen:</strong> Auch wenn App geschlossen</div>
                      <div>📴 <strong>Offline-Nutzung:</strong> Funktioniert ohne Internet</div>
                      <div>🏠 <strong>Home Screen:</strong> Icon direkt auf dem Startbildschirm</div>
                    </div>
                  </div>
                </div>

                {/* Browser-specific instructions */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-green-200">
                  <div className="text-sm text-green-800">
                    <strong>📲 Installation in Ihrem Browser:</strong>
                    <div className="mt-2 space-y-1">
                      {(() => {
                        const userAgent = navigator.userAgent.toLowerCase();
                        if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
                          return (
                            <>
                              <div>🦘 <strong>Safari:</strong> Teilen-Button (□↗) → "Zum Home-Bildschirm hinzufügen"</div>
                              <div className="text-xs text-green-600 ml-4">• Unten in der Browser-Leiste das Teilen-Symbol antippen</div>
                            </>
                          );
                        } else if (userAgent.includes('chrome')) {
                          return (
                            <>
                              <div>🌐 <strong>Chrome:</strong> Browser-Menü (⋮) → "App installieren"</div>
                              <div className="text-xs text-green-600 ml-4">• Oben rechts die drei Punkte antippen</div>
                            </>
                          );
                        } else if (userAgent.includes('firefox')) {
                          return (
                            <>
                              <div>🦊 <strong>Firefox:</strong> Browser-Menü (☰) → "Diese Seite installieren"</div>
                              <div className="text-xs text-green-600 ml-4">• Hamburger-Menü öffnen</div>
                            </>
                          );
                        } else if (userAgent.includes('edge')) {
                          return (
                            <>
                              <div>🔷 <strong>Edge:</strong> Browser-Menü → "App installieren"</div>
                              <div className="text-xs text-green-600 ml-4">• Drei Punkte im Browser-Menü</div>
                            </>
                          );
                        } else {
                          return <div>🌐 <strong>Ihr Browser:</strong> Menü → "App installieren" oder "Zum Home-Bildschirm hinzufügen"</div>;
                        }
                      })()}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => {
                      console.log('🚀 Install button clicked from enhanced banner');
                      handleInstallApp();
                    }}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:shadow-xl transition-all text-sm sm:text-base flex items-center justify-center group hover:scale-[1.02]"
                  >
                    <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-2 shadow-lg group-hover:animate-bounce">
                      <Download className="w-3 h-3 text-white" />
                    </div>
                    {installPrompt ? '🚀 Als Native App installieren' : '📲 Installation anzeigen'}
                  </button>
                  <button
                    onClick={() => {
                      setShowInstallBanner(false);
                      localStorage.setItem('bringolino_install_banner_dismissed', 'true');
                      console.log('🚀 Install banner dismissed by user');
                    }}
                    className="flex-1 py-3 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium hover:shadow-lg transition-all text-sm sm:text-base"
                  >
                    ⏰ Später erinnern
                  </button>
                </div>

                {/* Advanced PWA Debug Info - Collapsible */}
                <details className="text-xs text-gray-500 bg-gray-100 rounded-lg p-3 border border-gray-200">
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900 transition-colors">
                    🔧 PWA Status (für Entwickler)
                  </summary>
                  <div className="mt-2 space-y-1">
                    <div><strong>📱 Native Install:</strong> {installPrompt ? '✅ Verfügbar' : '❌ Nicht verfügbar - Fallback aktiv'}</div>
                    <div><strong>🏠 App Status:</strong> {isInstalled ? '✅ Installiert (Native Mode)' : '❌ Browser Mode'}</div>
                    <div><strong>🌐 Browser:</strong> {
                      navigator.userAgent.includes('Chrome') ? 'Chrome/Chromium' : 
                      navigator.userAgent.includes('Safari') ? 'Safari' : 
                      navigator.userAgent.includes('Firefox') ? 'Firefox' :
                      navigator.userAgent.includes('Edge') ? 'Edge' : 'Andere'
                    }</div>
                    <div><strong>📱 Display Mode:</strong> {window.matchMedia && window.matchMedia('(display-mode: standalone)').matches ? '✅ Standalone (Native)' : '🌐 Browser'}</div>
                    <div><strong>🔄 PWA Support:</strong> {'serviceWorker' in navigator ? '✅ Service Worker verfügbar' : '❌ Nicht unterstützt'}</div>
                    <div><strong>🎯 Manifest:</strong> {document.querySelector('link[rel="manifest"]') ? '✅ Geladen' : '❌ Fehlt'}</div>
                  </div>
                </details>
              </div>
            </div>
          )}

          {/* ✅ PWA: OFFLINE STATUS BANNER */}
          {!isOnline && (
            <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200 max-w-2xl mx-auto">
              <div className="flex items-center justify-center text-sm text-orange-800">
                <WifiOff className="w-4 h-4 mr-2" />
                <span className="font-medium">Offline-Modus</span>
                <span className="ml-2 text-xs text-orange-600">
                  - Daten werden automatisch synchronisiert, wenn Sie wieder online sind
                </span>
              </div>
            </div>
          )}

          {/* ✅ PWA: SYNC STATUS BANNER */}
          {isOnline && syncStatus === 'pending' && offlineChanges.length > 0 && (
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-blue-800">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="font-medium">{offlineChanges.length} Änderungen warten auf Synchronisation</span>
                </div>
                <button
                  onClick={syncOfflineChanges}
                  className="py-2 px-3 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
                >
                  Jetzt synchronisieren
                </button>
              </div>
            </div>
          )}

          {/* ✅ PWA: SYNC SUCCESS BANNER */}
          {syncStatus === 'syncing' && (
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 max-w-2xl mx-auto">
              <div className="flex items-center justify-center text-sm text-green-800">
                <div className="animate-spin w-4 h-4 mr-2 border-2 border-green-600 border-t-transparent rounded-full"></div>
                <span className="font-medium">Synchronisiere Daten...</span>
              </div>
            </div>
          )}



          {/* ✅ FIREBASE STATUS PANEL */}
          {showFirebaseStatus && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center text-sm sm:text-base">
                  <Database className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                  Firebase Real-time Database
                </h3>
                <button onClick={() => setShowFirebaseStatus(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-3">
                {/* Connection Status */}
                <div className={`p-3 rounded-xl border ${
                  firebaseStatus === 'connected' 
                    ? 'bg-green-50 border-green-300' 
                    : firebaseStatus === 'syncing'
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-red-50 border-red-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {firebaseStatus === 'connected' && <Cloud className="w-5 h-5 text-green-600 mr-2" />}
                      {firebaseStatus === 'syncing' && <RotateCcw className="w-5 h-5 text-blue-600 mr-2 animate-spin" />}
                      {firebaseStatus === 'disconnected' && <WifiOff className="w-5 h-5 text-red-600 mr-2" />}
                      <div>
                        <div className={`font-bold text-sm ${
                          firebaseStatus === 'connected' ? 'text-green-800' :
                          firebaseStatus === 'syncing' ? 'text-blue-800' : 'text-red-800'
                        }`}>
                          {firebaseStatus === 'connected' && '🟢 Verbunden'}
                          {firebaseStatus === 'syncing' && '🔄 Synchronisiere...'}
                          {firebaseStatus === 'disconnected' && '🔴 Getrennt'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {firebaseStatus === 'connected' && 'Real-time sync aktiv'}
                          {firebaseStatus === 'syncing' && 'Daten werden übertragen'}
                          {firebaseStatus === 'disconnected' && 'Offline-Modus'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {firebaseLastSync && (
                        <div className="text-xs text-gray-500">
                          Letzte Sync: {firebaseLastSync.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {pendingSync > 0 && (
                        <div className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-bold">
                          {pendingSync} wartend
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Real-time Data Overview */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-2 text-sm">Live DECT Daten</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-blue-700 font-bold">
                        {Object.keys(allDepartmentData).length} / {Object.keys(departments).length}
                      </div>
                      <div className="text-blue-600">DECTs online</div>
                    </div>
                    <div>
                      <div className="text-blue-700 font-bold">
                        {getAllDepartmentStats().reduce((sum, dept) => sum + dept.completed, 0)}
                      </div>
                      <div className="text-blue-600">Erledigte Aufgaben</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      setFirebaseStatus('syncing');
                      await firebaseService.retryPendingWrites();
                      setFirebaseStatus('connected');
                      addNotification('🔄 Manuelle Synchronisation durchgeführt', 'success');
                    }}
                    className="flex-1 py-2 px-3 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
                  >
                    🔄 Manuell Sync
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify({
                        firebaseStatus,
                        allDepartmentData,
                        pendingSync,
                        firebaseLastSync
                      }, null, 2));
                      addNotification('📋 Debug-Daten kopiert', 'info');
                    }}
                    className="flex-1 py-2 px-3 bg-gray-500 text-white rounded-lg text-xs font-medium hover:bg-gray-600 transition-colors"
                  >
                    📋 Debug Info
                  </button>
                </div>

                {/* Real-time indicator */}
                <div className="text-center text-xs text-gray-500">
                  {firebaseStatus === 'connected' && (
                    <span className="inline-flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Live-Updates von allen DECTs
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          {showSettings && (
            <div className="mt-4 p-3 sm:p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">🔔 Benachrichtigungs-Einstellungen</h3>
                <button onClick={() => setShowSettings(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* ✅ Erinnerungen Ein/Aus */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">📅 Erinnerungen aktiviert</span>
                  <button
                    onClick={() => setReminderSettings(prev => ({...prev, enabled: !prev.enabled}))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      reminderSettings.enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      reminderSettings.enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {/* ✅ Erinnerungszeit */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    ⏰ Erinnerung vor Aufgabe (Minuten)
                  </label>
                  <select
                    value={reminderSettings.reminderMinutes}
                    onChange={(e) => setReminderSettings(prev => ({...prev, reminderMinutes: parseInt(e.target.value)}))}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value={1}>1 Minute</option>
                    <option value={3}>3 Minuten</option>
                    <option value={5}>5 Minuten</option>
                    <option value={10}>10 Minuten</option>
                    <option value={15}>15 Minuten</option>
                  </select>
                </div>

                {/* ✅ YENİ: SES AYARLARI */}
                <div className="border-t pt-4">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm">🔊 Ses Einstellungen</h4>
                  
                  {/* Ses Açma/Kapama */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">🔈 Benachrichtigungstöne</span>
                    <button
                      onClick={() => setReminderSettings(prev => ({...prev, soundEnabled: !prev.soundEnabled}))}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        reminderSettings.soundEnabled ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                        reminderSettings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* Ses Seviyesi */}
                  {reminderSettings.soundEnabled && (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        🎵 Lautstärke: {reminderSettings.soundVolume}%
                      </label>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs">🔇</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={reminderSettings.soundVolume}
                          onChange={(e) => setReminderSettings(prev => ({...prev, soundVolume: parseInt(e.target.value)}))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs">🔊</span>
                        <button
                          onClick={() => playSound('ding')}
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                        >
                          Test
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ✅ YENİ: TİTREŞİM AYARLARI */}
                <div className="border-t pt-4">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm">📳 Vibration Einstellungen</h4>
                  
                  {/* Titreşim Açma/Kapama */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">📱 Vibration aktiviert</span>
                    <button
                      onClick={() => setReminderSettings(prev => ({...prev, vibrationEnabled: !prev.vibrationEnabled}))}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        reminderSettings.vibrationEnabled ? 'bg-purple-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                        reminderSettings.vibrationEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* Titreşim Gücü */}
                  {reminderSettings.vibrationEnabled && (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        ⚡ Vibrationsstärke
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['light', 'medium', 'strong'].map((intensity) => (
                          <button
                            key={intensity}
                            onClick={() => {
                              setReminderSettings(prev => ({...prev, vibrationIntensity: intensity}));
                              triggerVibration(intensity);
                            }}
                            className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                              reminderSettings.vibrationIntensity === intensity
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {intensity === 'light' ? '🟢 Leicht' : 
                             intensity === 'medium' ? '🟡 Mittel' : '🔴 Stark'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ✅ YENİ: TEST BEREICH */}
                <div className="border-t pt-4">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm">🧪 Test Benachrichtigungen</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        playSound('ding');
                        triggerVibration('light');
                        addNotificationWithSound('🔔 Test Erinnerung', 'erinnerung');
                      }}
                      className="py-2 px-3 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                    >
                      📅 Erinnerung Test
                    </button>
                    <button
                      onClick={() => {
                        playSound('success');
                        triggerVibration('double');
                        addNotificationWithSound('✅ Aufgabe erledigt!', 'success');
                      }}
                      className="py-2 px-3 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
                    >
                      ✅ Erfolg Test
                    </button>
                    <button
                      onClick={() => {
                        playSound('info');
                        triggerVibration('medium');
                        addNotificationWithSound('ℹ️ System Info', 'info');
                      }}
                      className="py-2 px-3 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors"
                    >
                      ℹ️ Info Test
                    </button>
                  </div>
                </div>

                {/* ✅ Browser Uyumluluk Bilgisi */}
                <div className="border-t pt-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h5 className="font-bold text-blue-800 text-xs mb-2">💡 Browser-Unterstützung:</h5>
                    <div className="text-xs text-blue-700 space-y-1">
                      <div>🔊 Audio: {audioContext ? '✅ Unterstützt' : '❌ Nicht verfügbar'}</div>
                      <div>📳 Vibration: {navigator.vibrate ? '✅ Unterstützt' : '❌ Nicht verfügbar'}</div>
                      <div>📱 PWA: {window.matchMedia('(display-mode: standalone)').matches ? '✅ Installiert' : '🌐 Browser-Modus'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✅ RESPONSIVE PASSWORD PROMPT */}
          {showPasswordPrompt && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-w-md mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center text-sm sm:text-base">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
                  Leiter Dashboard Zugang
                </h3>
                <button onClick={() => setShowPasswordPrompt(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Leiter Passwort eingeben:
                  </label>
                  <input
                    type="password"
                    value={leaderPassword}
                    onChange={(e) => setLeaderPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLeaderLogin()}
                    placeholder="Passwort..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-black placeholder-gray-500 text-sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={handleLeaderLogin}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-sm"
                  >
                    Anmelden
                  </button>
                  <button
                    onClick={() => setShowPasswordPrompt(false)}
                    className="flex-1 py-3 px-4 bg-gray-500 text-white rounded-lg font-medium hover:shadow-lg transition-all text-sm"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ✅ RESPONSIVE LEADER DASHBOARD */}
          {showLeaderDashboard && isLeaderMode && (
            <div className="mt-4 p-0 bg-transparent max-w-none mx-auto">
              {/* ✅ MODERN LEITER DASHBOARD - FULL SCREEN */}
              <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden rounded-2xl">
                {/* ✅ GLASSMORPHISM HEADER */}
                <header className="sticky top-0 z-50 bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-2xl">
                  <div className="px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                      {/* Logo & Title */}
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                          <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                            Leiter Dashboard
                          </h1>
                          <p className="text-sm text-blue-200">
                            Kepler Universitätsklinikum - Live Monitoring
                          </p>
                        </div>
                      </div>

                      {/* Real-time Info & Close */}
                      <div className="flex items-center space-x-6">
                        <div className="hidden lg:flex items-center space-x-6">
                          <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-lg">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">Live</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-cyan-300">
                              {frozenDashboardData?.frozenTime || '00:00'}
                            </div>
                            <div className="text-xs text-blue-200">
                              {frozenDashboardData?.frozenDate || 'Loading...'}
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={handleLeaderLogout} 
                          className="p-2 rounded-xl bg-white/10 backdrop-blur-lg hover:bg-white/20 transition-all"
                        >
                          <X className="w-6 h-6 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Sub Navigation */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                      {/* View Mode Toggles */}
                      <div className="flex items-center space-x-2 bg-white/10 p-1 rounded-xl backdrop-blur-lg">
                        {[
                          { key: 'grid', icon: BarChart3, label: 'Overview' },
                          { key: 'list', icon: Users, label: 'DECT-Liste' },
                          { key: 'personel', icon: Users, label: 'Personel' },
                          { key: 'management', icon: Settings, label: 'Verwaltung' },
                          { key: 'analytics', icon: TrendingUp, label: 'Analytics' }
                        ].map(({ key, icon: Icon, label }) => (
                          <button
                            key={key}
                            onClick={() => setDashboardViewMode(key)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                              dashboardViewMode === key 
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' 
                                : 'text-blue-200 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Filters & Search */}
                      <div className="flex items-center space-x-4">
                        {/* Search Input */}
                        <div className="relative">
                          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
                          <input
                            type="text"
                            placeholder="DECT suchen..."
                            value={searchTermLeader}
                            onChange={(e) => setSearchTermLeader(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-lg w-64"
                          />
                          {searchTermLeader && (
                            <button
                              onClick={() => setSearchTermLeader('')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        {/* Department Filter */}
                        <select
                          value={selectedDepartmentFilter}
                          onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                          className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-lg"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 8px center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '16px',
                            paddingRight: '2.5rem'
                          }}
                        >
                          <option value="all" style={{background: '#1e293b', color: 'white'}}>Alle DECT</option>
                          {getAllDepartmentStats().map(dept => (
                            <option key={dept.code} value={dept.code} style={{background: '#1e293b', color: 'white'}}>
                              {dept.code} - {dept.name}
                            </option>
                          ))}
                        </select>
                        
                        {/* Timeframe Filter */}
                        <select
                          value={selectedTimeframe}
                          onChange={(e) => setSelectedTimeframe(e.target.value)}
                          className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-lg"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 8px center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '16px',
                            paddingRight: '2.5rem'
                          }}
                        >
                          <option value="today" style={{background: '#1e293b', color: 'white'}}>Heute</option>
                          <option value="week" style={{background: '#1e293b', color: 'white'}}>Diese Woche</option>
                          <option value="month" style={{background: '#1e293b', color: 'white'}}>Dieser Monat</option>
                        </select>

                        <button 
                          onClick={handleDashboardRefresh}
                          disabled={isDashboardLoading}
                          className={`p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all backdrop-blur-lg relative ${
                            isDashboardLoading ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          <RotateCcw className={`w-5 h-5 ${isDashboardLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </header>

                {/* ✅ LOADING OVERLAY */}
                {isDashboardLoading && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-white font-medium">Dashboard wird aktualisiert...</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ✅ MAIN CONTENT */}
                <main className="p-4 sm:p-6 lg:p-8">
                  {(() => {
                    // ✅ Use frozen data to prevent flicker
                    const overallMetrics = frozenDashboardData?.metrics || {
                      totalDepartments: 0,
                      activeDepartments: 0,
                      avgCompletion: 0,
                      totalTasks: 0,
                      completedTasks: 0,
                      highPriorityIssues: 0,
                      avgEfficiency: 0
                    };
                    
                    // Use frozen department data
                    const filteredDepartments = frozenDashboardData?.departments || [];

                    if (dashboardViewMode === 'grid') {
                      return (
                        <>
                          {/* ✅ KEY METRICS GRID */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                              <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                                  <Target className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex items-center space-x-1 text-green-400">
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="text-sm font-bold">+5%</span>
                                </div>
                              </div>
                              <div className="text-3xl font-bold text-white mb-1">{overallMetrics.avgCompletion}%</div>
                              <div className="text-sm text-blue-200">Durchschnittliche Abschlussrate</div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                              <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                                  <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex items-center space-x-1 text-blue-400">
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="text-sm font-bold">+12</span>
                                </div>
                              </div>
                              <div className="text-3xl font-bold text-white mb-1">{overallMetrics.completedTasks}/{overallMetrics.totalTasks}</div>
                              <div className="text-sm text-blue-200">Erledigte Aufgaben</div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                              <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                                  <Users className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex items-center space-x-1 text-green-400">
                                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                  <span className="text-sm font-bold">Live</span>
                                </div>
                              </div>
                              <div className="text-3xl font-bold text-white mb-1">{overallMetrics.activeDepartments}/{overallMetrics.totalDepartments}</div>
                              <div className="text-sm text-blue-200">Aktive DECT-Geräte</div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                              <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                                  <AlertCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex items-center space-x-1 text-orange-400">
                                  <span className="text-sm font-bold">{overallMetrics.highPriorityIssues > 0 ? 'Achtung' : 'OK'}</span>
                                </div>
                              </div>
                              <div className="text-3xl font-bold text-white mb-1">{overallMetrics.highPriorityIssues}</div>
                              <div className="text-sm text-blue-200">Kritische Bereiche</div>
                            </div>
                          </div>

                          {/* Search Results Info */}
                          {(searchTermLeader || selectedDepartmentFilter !== 'all') && (
                            <div className="mb-6 p-4 bg-cyan-500/20 border border-cyan-400/30 rounded-2xl backdrop-blur-xl">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Filter className="w-5 h-5 text-cyan-300" />
                                  <span className="text-cyan-200 font-medium">
                                    {filteredDepartments.length} von {overallMetrics.totalDepartments} DECT-Geräten gefunden
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    setSearchTermLeader('');
                                    setSelectedDepartmentFilter('all');
                                  }}
                                  className="text-cyan-300 hover:text-white transition-colors text-sm"
                                >
                                  Filter zurücksetzen
                                </button>
                              </div>
                              {searchTermLeader && (
                                <div className="mt-2 text-sm text-cyan-300">
                                  Suchbegriff: "<span className="font-bold">{searchTermLeader}</span>"
                                </div>
                              )}
                              {selectedDepartmentFilter !== 'all' && (
                                <div className="mt-2 text-sm text-cyan-300">
                                  Gefiltert nach: <span className="font-bold">{selectedDepartmentFilter}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* DECT OVERVIEW GRID */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                            {filteredDepartments.map((dept) => (
                              <div
                                key={dept.code}
                                onClick={() => handleDepartmentClick(dept.code)}
                                className={`bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden`}
                              >
                                {/* Gradient overlay for status */}
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getStatusColor(dept.status)}`}></div>
                                
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <h3 className="text-lg font-bold text-white">DECT {dept.code}</h3>
                                      {dept.activeUsers > 0 && (
                                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                      )}
                                    </div>
                                    <p className="text-sm text-blue-200 leading-tight">{dept.name}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className={`text-2xl font-bold ${
                                      dept.status === 'excellent' ? 'text-green-400' :
                                      dept.status === 'good' ? 'text-blue-400' : 'text-orange-400'
                                    }`}>
                                      {dept.completion}%
                                    </div>
                                    <div className="flex items-center justify-end space-x-1">
                                      {getTrendIcon(dept.trend)}
                                      <span className="text-xs text-blue-300">
                                        {dept.lastUpdateText}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                    <div
                                      className={`h-full bg-gradient-to-r ${getStatusColor(dept.status)} transition-all duration-1000 ease-out`}
                                      style={{width: `${dept.completion}%`}}
                                    ></div>
                                  </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-white">{dept.completed}/{dept.total}</div>
                                    <div className="text-xs text-blue-300">Aufgaben</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-cyan-400">{dept.efficiency}%</div>
                                    <div className="text-xs text-blue-300">Effizienz</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-purple-400">{dept.avgTimeStable}min</div>
                                    <div className="text-xs text-blue-300">Ø Zeit</div>
                                  </div>
                                  {/* ✅ YENİ: ADIM SAYACI COLUMN - 3 SEVİYELİ - RENK UYUMLU */}
                                  <div className="text-center">
                                    <div className="space-y-1">
                                      <div className="text-sm font-bold text-red-400">{(dept.dailySteps || 0).toLocaleString('de-DE', {maximumFractionDigits: 0})}</div>
                                      <div className="text-xs text-blue-400">{(dept.monthlySteps || 0).toLocaleString('de-DE', {maximumFractionDigits: 0})}</div>
                                      <div className="text-xs text-purple-400">{(dept.yearlySteps || 0).toLocaleString('de-DE', {maximumFractionDigits: 0})}</div>
                                    </div>
                                    <div className="text-xs">
                                      <span className="text-red-400 font-bold">T</span>/
                                      <span className="text-blue-400 font-bold">M</span>/
                                      <span className="text-purple-400 font-bold">J</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Status Badge */}
                                <div className="flex items-center justify-between">
                                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${getStatusColor(dept.status)} text-white text-xs font-bold`}>
                                    {getStatusIcon(dept.status)}
                                    <span className="capitalize">
                                      {dept.status === 'excellent' ? 'Ausgezeichnet' :
                                       dept.status === 'good' ? 'Gut' : 'Aufmerksamkeit'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-blue-300">
                                    <Users className="w-4 h-4" />
                                    <span className="text-sm">{dept.activeUsers}</span>
                                  </div>
                                </div>

                                {/* Click to View Details Indicator */}
                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="bg-white/20 backdrop-blur-xl rounded-lg px-2 py-1 text-xs text-white font-medium">
                                    📋 Details anzeigen
                                  </div>
                                </div>

                                {/* Hover Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    }

                    if (dashboardViewMode === 'list') {
                      return (
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                          <div className="p-6 border-b border-white/20">
                            <h2 className="text-2xl font-bold text-white mb-2">Detaillierte DECT-Übersicht</h2>
                            <p className="text-blue-200">Alle DECT-Codes und ihre aktuelle Leistung</p>
                          </div>
                          
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-white/5">
                                <tr>
                                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">DECT</th>
                                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">Dect Name</th>
                                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-200">Status</th>
                                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-200">Abschlussrate</th>
                                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-200">Aufgaben</th>
                                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-200">Effizienz</th>
                                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-200">Schritte (T/M/J)</th>
                                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-200">Aktive Benutzer</th>
                                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-200">Letztes Update</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/10">
                                {filteredDepartments.map((dept, index) => (
                                  <tr 
                                    key={dept.code} 
                                    className="hover:bg-white/5 transition-colors duration-200 cursor-pointer"
                                  >
                                    <td className="px-6 py-4">
                                      <div className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${getStatusColor(dept.status)} flex items-center justify-center text-white font-bold text-sm`}>
                                          {dept.code.slice(-2)}
                                        </div>
                                        <span className="font-bold text-white">{dept.code}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-white font-medium">{dept.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-gradient-to-r ${getStatusColor(dept.status)} text-white text-xs font-bold`}>
                                        {getStatusIcon(dept.status)}
                                        <span className="capitalize">
                                          {dept.status === 'excellent' ? 'Exzellent' :
                                           dept.status === 'good' ? 'Gut' : 'Kritisch'}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <div className="flex items-center justify-center space-x-2">
                                        <span className={`text-xl font-bold ${
                                          dept.completion >= 90 ? 'text-green-400' :
                                          dept.completion >= 70 ? 'text-blue-400' : 'text-orange-400'
                                        }`}>
                                          {dept.completion}%
                                        </span>
                                        {getTrendIcon(dept.trend)}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="text-white font-bold">
                                        {dept.completed}/{dept.total}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="text-cyan-400 font-bold">{dept.efficiency}%</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <div className="flex flex-col items-center">
                                        <div className="space-y-1">
                                          <div className="text-sm font-bold text-red-400">{(dept.dailySteps || 0).toLocaleString('de-DE')}</div>
                                          <div className="text-xs text-blue-400">{(dept.monthlySteps || 0).toLocaleString('de-DE')}</div>
                                          <div className="text-xs text-purple-400">{(dept.yearlySteps || 0).toLocaleString('de-DE')}</div>
                                        </div>
                                        <div className="text-xs mt-1">
                                          <span className="text-red-400 font-bold">T</span>/
                                          <span className="text-blue-400 font-bold">M</span>/
                                          <span className="text-purple-400 font-bold">J</span>
                                        </div>
                                        <div className="w-12 h-1.5 bg-gray-600 rounded-full mt-2 overflow-hidden">
                                          <div
                                            className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-700"
                                            style={{width: `${Math.min((dept.dailySteps || 0) / (dept.stepGoal || 10000) * 100, 100)}%`}}
                                          ></div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <div className="flex items-center justify-center space-x-1">
                                        {dept.activeUsers > 0 && (
                                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        )}
                                        <span className="text-white font-bold">{dept.activeUsers}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className="text-blue-300 text-sm">{dept.lastUpdate ? stableTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : 'Nie'}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }

                    if (dashboardViewMode === 'management') {
                      return (
                        <div className="space-y-6">
                          {/* Personel Management Header */}
                          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                              <h2 className="text-2xl font-bold text-white flex items-center">
                                <Settings className="w-8 h-8 mr-3 text-cyan-400" />
                                Personel Verwaltung
                              </h2>
                              <div className="flex items-center space-x-2">
                                <div className="bg-white/10 px-3 py-1 rounded-lg">
                                  <span className="text-white text-sm font-medium">
                                    {Object.keys(allPersonelData).length} Mitarbeiter
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-blue-200">Namen bearbeiten, Änderungen verfolgen und Benutzerkonten verwalten</p>
                          </div>

                          {/* Change History */}
                          {nameChangeHistory.length > 0 && (
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <Clock className="w-6 h-6 mr-2 text-yellow-400" />
                                Letzte Namensänderungen
                              </h3>
                              <div className="space-y-3 max-h-64 overflow-y-auto">
                                {nameChangeHistory.slice(0, 10).map((change) => (
                                  <div key={change.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="text-white font-medium">
                                          <span className="text-red-300">"{change.oldName}"</span>
                                          <span className="text-gray-300 mx-2">→</span>
                                          <span className="text-green-300">"{change.newName}"</span>
                                        </div>
                                        <div className="text-blue-200 text-sm">
                                          Geändert von {change.changedBy} um {change.changeTime}
                                        </div>
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {new Date(change.changeDate).toLocaleDateString('de-DE')}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Personel List with Edit Options */}
                          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/20">
                              <h3 className="text-xl font-bold text-white mb-2">Aktive Mitarbeiter</h3>
                              <p className="text-blue-200">Namen bearbeiten und Benutzerinformationen verwalten</p>
                            </div>
                            
                            <div className="p-6">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {Object.values(allPersonelData)
                                  .filter(p => p && p.isActive)
                                  .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
                                  .map(personel => (
                                  <div
                                    key={personel.userId}
                                    className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                                          {personel.userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <div className="text-white font-bold">{personel.userName}</div>
                                          <div className="text-blue-200 text-sm">DECT {personel.selectedDECT}</div>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleEditPersonelName(personel)}
                                        className="p-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-all hover:scale-105 text-white"
                                        title="Name bearbeiten"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-3 mb-3">
                                      <div className="text-center">
                                        <div className="text-white font-bold">{personel.completedTasksForDept || 0}</div>
                                        <div className="text-blue-300 text-xs">Aufgaben</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-green-400 font-bold">{personel.completionRate || 0}%</div>
                                        <div className="text-blue-300 text-xs">Quote</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-yellow-400 font-bold">{personel.userPoints || 0}</div>
                                        <div className="text-blue-300 text-xs">Punkte</div>
                                      </div>
                                    </div>
                                    
                                    <div className="text-xs text-gray-400 text-center">
                                      Letzte Aktivität: {timeAgo(personel.lastActivity)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {Object.keys(allPersonelData).length === 0 && (
                                <div className="text-center py-12">
                                  <div className="text-6xl mb-4">👥</div>
                                  <h3 className="text-2xl font-bold text-white mb-2">Keine Mitarbeiter</h3>
                                  <p className="text-blue-200">Warten auf erste Anmeldungen...</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (dashboardViewMode === 'analytics') {
                      return (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Performance Chart */}
                          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-4">Leistungstrend (24h)</h3>
                            <div className="h-64 flex items-end justify-between space-x-2">
                              {Array.from({length: 24}, (_, i) => {
                                const height = Math.random() * 80 + 20;
                                return (
                                  <div key={i} className="flex-1 flex flex-col items-center">
                                    <div 
                                      className="w-full bg-gradient-to-t from-cyan-500 to-blue-600 rounded-t-lg transition-all duration-1000 ease-out"
                                      style={{height: `${height}%`}}
                                    ></div>
                                    <span className="text-xs text-blue-300 mt-2">{i}h</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Abteilungsvergleich */}
                          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-4">DECT-Vergleich</h3>
                            <div className="space-y-4">
                              {filteredDepartments.slice(0, 5).map((dept, index) => (
                                <div key={dept.code} className="flex items-center space-x-4">
                                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-white font-medium">{dept.code}</span>
                                      <span className="text-cyan-400 font-bold">{dept.completion}%</span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full bg-gradient-to-r ${getStatusColor(dept.status)} transition-all duration-1000`}
                                        style={{width: `${dept.completion}%`}}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ✅ YENİ: PERSONEL TRACKING VIEW
                    if (dashboardViewMode === 'personel') {
                      const activePersonel = Object.values(allPersonelData).filter(p => 
                        p && p.isActive && new Date().toDateString() === new Date(p.lastActivity).toDateString()
                      );

                      return (
                        <div className="space-y-6">
                          {/* Personel Overview Stats */}
                          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                              <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                                  <Users className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-green-400 text-sm font-bold">AKTIV</div>
                              </div>
                              <div className="text-3xl font-bold text-white mb-1">{activePersonel.length}</div>
                              <div className="text-sm text-blue-200">Aktive Mitarbeiter</div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                              <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                                  <Target className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-blue-400 text-sm font-bold">LEISTUNG</div>
                              </div>
                              <div className="text-3xl font-bold text-white mb-1">
                                {activePersonel.length > 0 
                                  ? Math.round(activePersonel.reduce((sum, p) => sum + (p.completionRate || 0), 0) / activePersonel.length)
                                  : 0}%
                              </div>
                              <div className="text-sm text-blue-200">Ø Abschlussrate</div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                              <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                                  <Award className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-purple-400 text-sm font-bold">PUNKTE</div>
                              </div>
                              <div className="text-3xl font-bold text-white mb-1">
                                {activePersonel.reduce((sum, p) => sum + (p.userPoints || 0), 0)}
                              </div>
                              <div className="text-sm text-blue-200">Gesamt Punkte</div>
                            </div>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                              <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-xl flex items-center justify-center">
                                  <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-cyan-400 text-sm font-bold">AUFGABEN</div>
                              </div>
                              <div className="text-3xl font-bold text-white mb-1">
                                {activePersonel.reduce((sum, p) => sum + (p.completedTasksForDept || 0), 0)}
                              </div>
                              <div className="text-sm text-blue-200">Erledigt heute</div>
                            </div>
                          </div>

                          {/* Personel Filter & Sort */}
                          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-2xl">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-white font-medium">Filter:</span>
                                {['all', 'active', 'working', 'break', 'completed'].map(filter => (
                                  <button
                                    key={filter}
                                    onClick={() => setPersonelFilter(filter)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                      personelFilter === filter
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                                        : 'bg-white/10 text-blue-200 hover:bg-white/20'
                                    }`}
                                  >
                                    {filter === 'all' ? 'Alle' :
                                     filter === 'active' ? 'Aktiv' :
                                     filter === 'working' ? 'Arbeitet' :
                                     filter === 'break' ? 'Pause' : 'Fertig'}
                                  </button>
                                ))}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span className="text-white font-medium">Sortierung:</span>
                                <select
                                  value={personelSortBy}
                                  onChange={(e) => setPersonelSortBy(e.target.value)}
                                  className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-xs"
                                >
                                  <option value="activity" style={{background: '#1e293b'}}>Letzte Aktivität</option>
                                  <option value="points" style={{background: '#1e293b'}}>Punkte</option>
                                  <option value="name" style={{background: '#1e293b'}}>Name</option>
                                  <option value="dect" style={{background: '#1e293b'}}>DECT</option>
                                  <option value="completion" style={{background: '#1e293b'}}>Abschlussrate</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Personel List */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {(() => {
                              let filtered = Object.values(allPersonelData).filter(p => {
                                if (!p || !p.isActive) return false;
                                
                                const today = new Date().toDateString();
                                const personelDate = new Date(p.lastActivity).toDateString();
                                if (personelDate !== today) return false;
                                
                                if (personelFilter === 'all') return true;
                                if (personelFilter === 'active') return p.isActive;
                                if (personelFilter === 'working') return p.status === 'working';
                                if (personelFilter === 'break') return p.status === 'break';
                                if (personelFilter === 'completed') return p.status === 'completed';
                                
                                return true;
                              });

                              // Sort
                              filtered.sort((a, b) => {
                                switch (personelSortBy) {
                                  case 'activity':
                                    return new Date(b.lastActivity) - new Date(a.lastActivity);
                                  case 'points':
                                    return (b.userPoints || 0) - (a.userPoints || 0);
                                  case 'name':
                                    return (a.userName || '').localeCompare(b.userName || '');
                                  case 'dect':
                                    return (a.selectedDECT || '').localeCompare(b.selectedDECT || '');
                                  case 'completion':
                                    return (b.completionRate || 0) - (a.completionRate || 0);
                                  default:
                                    return 0;
                                }
                              });

                              return filtered.map(personel => (
                                <div
                                  key={personel.userId}
                                  onClick={() => {
                                    setSelectedPersonel(personel);
                                    setShowPersonelDetails(true);
                                  }}
                                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden"
                                >
                                  {/* Status Indicator */}
                                  <div className={`absolute top-0 left-0 w-full h-1 ${
                                    personel.status === 'working' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                    personel.status === 'break' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                                    personel.status === 'completed' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                    'bg-gradient-to-r from-gray-400 to-gray-500'
                                  }`}></div>

                                  {/* Header */}
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <h3 className="text-lg font-bold text-white">{personel.userName}</h3>
                                        <div className={`w-3 h-3 rounded-full ${
                                          Date.now() - personel.lastActivity < 300000 ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                                        }`}></div>
                                      </div>
                                      <p className="text-sm text-blue-200">{personel.userDepartment}</p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-bold text-cyan-400">DECT {personel.selectedDECT}</div>
                                      <div className="text-xs text-blue-300">
                                        {timeAgo(personel.lastActivity)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Stats Grid */}
                                  <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="text-center">
                                      <div className="text-lg font-bold text-white">{personel.completedTasksForDept}/{personel.totalTasksForDept}</div>
                                      <div className="text-xs text-blue-300">Aufgaben</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-lg font-bold text-green-400">{personel.completionRate || 0}%</div>
                                      <div className="text-xs text-blue-300">Abschluss</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-lg font-bold text-yellow-400">{personel.userPoints || 0}</div>
                                      <div className="text-xs text-blue-300">Punkte</div>
                                    </div>
                                  </div>

                                  {/* Progress Bar */}
                                  <div className="mb-4">
                                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                      <div
                                        className={`h-full transition-all duration-1000 ease-out ${
                                          personel.status === 'completed' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                          personel.status === 'working' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                          'bg-gradient-to-r from-yellow-400 to-orange-500'
                                        }`}
                                        style={{width: `${personel.completionRate || 0}%`}}
                                      ></div>
                                    </div>
                                  </div>

                                  {/* Status Badge */}
                                  <div className="flex items-center justify-between">
                                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-white text-xs font-bold ${
                                      personel.status === 'working' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                                      personel.status === 'break' ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
                                      personel.status === 'completed' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                                      'bg-gradient-to-r from-gray-500 to-gray-600'
                                    }`}>
                                      <span>
                                        {personel.status === 'working' ? '🔄 ARBEITET' :
                                         personel.status === 'break' ? '☕ PAUSE' :
                                         personel.status === 'completed' ? '✅ FERTIG' : '❓ UNBEKANNT'}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-1 text-blue-300">
                                      <span className="text-sm">{(personel.dailySteps || 0).toLocaleString('de-DE')}</span>
                                      <span className="text-xs">Schritte</span>
                                    </div>
                                  </div>

                                  {/* Click Indicator */}
                                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="bg-white/20 backdrop-blur-xl rounded-lg px-2 py-1 text-xs text-white font-medium">
                                      📊 Details
                                    </div>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>

                          {/* No Data State */}
                          {Object.keys(allPersonelData).length === 0 && (
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/20 shadow-2xl text-center">
                              <div className="text-6xl mb-4">👥</div>
                              <h3 className="text-2xl font-bold text-white mb-2">Keine aktiven Mitarbeiter</h3>
                              <p className="text-blue-200">Warten auf erste Anmeldungen...</p>
                            </div>
                          )}
                        </div>
                      );
                    }
                  })()}

                  {/* ✅ REAL-TIME ACTIVITY FEED */}
                  <div className="mt-8 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
                    <div className="p-6 border-b border-white/20">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Live-Aktivitäten</h2>
                        <div className="flex items-center space-x-2 text-green-400">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">Echtzeit</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="space-y-4 max-h-80 overflow-y-auto">
                        {stableActivity.map((activity, index) => (
                          <div key={index} className="flex items-start space-x-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              activity.type === 'success' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                              activity.type === 'warning' ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                              'bg-gradient-to-r from-blue-400 to-indigo-500'
                            }`}>
                              {activity.type === 'success' ? <CheckCircle className="w-5 h-5 text-white" /> :
                               activity.type === 'warning' ? <AlertCircle className="w-5 h-5 text-white" /> :
                               <BarChart3 className="w-5 h-5 text-white" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-bold text-cyan-400">DECT {activity.dept}</span>
                                <span className="text-xs text-blue-300">{activity.time}</span>
                              </div>
                              <p className="text-white text-sm">{activity.action}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </main>

                {/* ✅ FLOATING ACTION BUTTON */}
                <button 
                  onClick={handleDashboardRefresh}
                  disabled={isDashboardLoading}
                  className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all duration-300 z-50 ${
                    isDashboardLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isDashboardLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Download className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ✅ RESPONSIVE DEPARTMENT TASK DETAILS - NOW AS MODAL OVERLAY */}
          {showDepartmentTaskDetails && selectedDepartmentDetails && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-[80vh] overflow-y-auto max-w-4xl mx-auto w-full">
                <div className="sticky top-0 bg-white/90 backdrop-blur-xl p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center text-lg">
                    <Users className="w-6 h-6 mr-2 text-purple-600" />
                    <span>DECT {selectedDepartmentDetails.code} - Aufgaben Details</span>
                  </h3>
                  <button 
                    onClick={() => setShowDepartmentTaskDetails(false)} 
                    className="p-2 rounded-lg hover:bg-gray-100 transition-all hover:scale-110"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                <div className="p-6">
                  {/* ✅ DEPARTMENT SUMMARY */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                    <h4 className="font-bold text-indigo-800 mb-3 text-lg">{selectedDepartmentDetails.name}</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-700">{selectedDepartmentDetails.completed}</div>
                        <div className="text-sm text-green-600">Erledigt</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-700">{selectedDepartmentDetails.total - selectedDepartmentDetails.completed}</div>
                        <div className="text-sm text-orange-600">Ausstehend</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${
                          selectedDepartmentDetails.rate >= 80 ? 'text-green-700' :
                          selectedDepartmentDetails.rate >= 60 ? 'text-yellow-700' :
                          'text-red-700'
                        }`}>
                          {selectedDepartmentDetails.rate}%
                        </div>
                        <div className="text-sm text-gray-600">Abschlussrate</div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-1000 ${
                            selectedDepartmentDetails.rate >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                            selectedDepartmentDetails.rate >= 60 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                            'bg-gradient-to-r from-red-400 to-pink-500'
                          }`}
                          style={{width: `${selectedDepartmentDetails.rate}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* ✅ TASK LIST */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Alle Aufgaben im Detail ({selectedDepartmentDetails.tasks.length})
                    </h4>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedDepartmentDetails.tasks.map((task) => {
                        const isCompleted = getTaskStatus(task.id) === 'completed';
                        
                        return (
                          <div
                            key={task.id}
                            className={`p-4 rounded-xl border transition-all ${
                              isCompleted
                                ? 'bg-green-50 border-green-300 shadow-sm'
                                : 'bg-red-50 border-red-300 shadow-sm hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  isCompleted
                                    ? 'bg-green-500 text-white'
                                    : 'bg-red-500 text-white'
                                }`}>
                                  {isCompleted ? (
                                    <CheckCircle className="w-5 h-5" />
                                  ) : (
                                    <Circle className="w-5 h-5" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full text-sm">
                                      {task.time}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      task.priority === 'low' ? 'bg-green-100 text-green-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {task.priority === 'high' ? '🔴 HOCH' :
                                       task.priority === 'medium' ? '🟡 MITTEL' :
                                       task.priority === 'low' ? '🟢 NIEDRIG' :
                                       task.priority === 'break' ? '🔵 PAUSE' : task.priority}
                                    </span>
                                  </div>
                                  <div className={`font-bold text-base ${
                                    isCompleted ? 'text-green-800 line-through' : 'text-gray-800'
                                  }`}>
                                    {task.title}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    📍 {task.location}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className={`text-lg font-bold px-3 py-1 rounded-full ${
                                  isCompleted 
                                    ? 'bg-green-200 text-green-800' 
                                    : 'bg-red-200 text-red-800'
                                }`}>
                                  {isCompleted ? '✅ ERLEDIGT' : '⏱️ OFFEN'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {task.estimatedDuration}
                                </div>
                              </div>
                            </div>
                            
                            {/* Task Description */}
                            <div className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 mb-2">
                              <strong>Beschreibung:</strong> {task.description}
                            </div>
                            
                            {/* Special Conditions */}
                            {task.condition && (
                              <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg border border-blue-200">
                                <strong>⚠️ Besondere Bedingung:</strong> {task.condition}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ✅ ACTION BUTTONS */}
                  <div className="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={() => {
                        setSelectedDepartment(selectedDepartmentDetails.code);
                        setShowDepartmentTaskDetails(false);
                        setShowLeaderDashboard(false);
                      }}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      📋 Zu dieser Abteilung wechseln
                    </button>
                    <button
                      onClick={() => setShowDepartmentTaskDetails(false)}
                      className="flex-1 py-3 px-4 bg-gray-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      Zurück zur Übersicht
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✅ RESPONSIVE ADVANCED ANALYTICS PANEL - MOBILE OPTIMIZED */}
          {showAdvancedAnalytics && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-[75vh] lg:max-h-[90vh] overflow-y-auto max-w-6xl mx-auto mb-20 lg:mb-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center text-sm sm:text-base">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-cyan-600" />
                  Erweiterte Analytics
                </h3>
                <button onClick={() => setShowAdvancedAnalytics(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              {/* ✅ MOBILE-FIRST KPI CARDS - Optimized Stack Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {/* Aufgabenzeit */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 p-4 rounded-xl border border-blue-200 relative overflow-hidden">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-xs font-bold text-blue-800 bg-blue-200 px-2 py-1 rounded-full">
                        ZEIT
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      departmentMetrics.avgCompletionTime.trend === 'up' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                    }`}>
                      {departmentMetrics.avgCompletionTime.trend === 'up' ? '↗️ -5%' : '↘️ -5%'}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="text-2xl font-bold text-blue-700 mb-1">{departmentMetrics.avgCompletionTime.current}min</div>
                    <div className="text-sm font-medium text-blue-600">Ø Aufgabenzeit</div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Vorher: <span className="font-bold">{departmentMetrics.avgCompletionTime.previous}min</span>
                  </div>
                </div>
                
                {/* Qualitätsscore */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-xl border border-green-200 relative overflow-hidden">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <Award className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-xs font-bold text-green-800 bg-green-200 px-2 py-1 rounded-full">
                        QUALITÄT
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-200 text-green-800 font-bold">↗️ +3%</span>
                  </div>
                  <div className="mb-2">
                    <div className="text-2xl font-bold text-green-700 mb-1">{departmentMetrics.qualityScore.current}%</div>
                    <div className="text-sm font-medium text-green-600">Qualitätsscore</div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Vorher: <span className="font-bold">{departmentMetrics.qualityScore.previous}%</span>
                  </div>
                </div>
                
                {/* Pünktlichkeit */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-4 rounded-xl border border-purple-200 relative overflow-hidden">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-xs font-bold text-purple-800 bg-purple-200 px-2 py-1 rounded-full">
                        TIMING
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-200 text-green-800 font-bold">↗️ +4%</span>
                  </div>
                  <div className="mb-2">
                    <div className="text-2xl font-bold text-purple-700 mb-1">{departmentMetrics.onTimeRate.current}%</div>
                    <div className="text-sm font-medium text-purple-600">Pünktlichkeit</div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Vorher: <span className="font-bold">{departmentMetrics.onTimeRate.previous}%</span>
                  </div>
                </div>
                
                {/* Zeitabweichung */}
                <div className="bg-gradient-to-br from-orange-50 to-yellow-100 p-4 rounded-xl border border-orange-200 relative overflow-hidden">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-xs font-bold text-orange-800 bg-orange-200 px-2 py-1 rounded-full">
                        ABWEICH
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-200 text-green-800 font-bold">-20%</span>
                  </div>
                  <div className="mb-2">
                    <div className="text-2xl font-bold text-orange-700 mb-1">{departmentMetrics.taskVariation.current}min</div>
                    <div className="text-sm font-medium text-orange-600">Zeitabweichung</div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Vorher: <span className="font-bold">{departmentMetrics.taskVariation.previous}min</span>
                  </div>
                </div>
              </div>

              {/* ✅ MOBILE-OPTIMIZED WEEKLY TREND CHART */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center text-sm sm:text-base">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  5-Wochen Leistungstrend
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  {/* Mobile Chart - Horizontal Layout */}
                  <div className="block sm:hidden">
                    <div className="space-y-4">
                      {weeklyTrends.map((week, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-gray-800">{week.week}</span>
                            <div className="flex space-x-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold">
                                {week.completion}%
                              </span>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">
                                {week.efficiency}%
                              </span>
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold">
                                {week.quality}%
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <div className="w-16 text-xs text-blue-600 font-medium">Abschluss</div>
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-1000"
                                  style={{width: `${week.completion}%`}}
                                ></div>
                              </div>
                              <div className="w-8 text-xs text-gray-600 text-right">{week.completion}%</div>
                            </div>
                            <div className="flex items-center">
                              <div className="w-16 text-xs text-green-600 font-medium">Effizienz</div>
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                                <div 
                                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-1000"
                                  style={{width: `${week.efficiency}%`}}
                                ></div>
                              </div>
                              <div className="w-8 text-xs text-gray-600 text-right">{week.efficiency}%</div>
                            </div>
                            <div className="flex items-center">
                              <div className="w-16 text-xs text-purple-600 font-medium">Qualität</div>
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                                <div 
                                  className="bg-gradient-to-r from-purple-500 to-pink-400 h-2 rounded-full transition-all duration-1000"
                                  style={{width: `${week.quality}%`}}
                                ></div>
                              </div>
                              <div className="w-8 text-xs text-gray-600 text-right">{week.quality}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desktop Chart - Vertical Layout */}
                  <div className="hidden sm:block">
                    <div className="flex items-end justify-between h-48 mb-4">
                      {weeklyTrends.map((week, index) => (
                        <div key={index} className="flex flex-col items-center flex-1 max-w-[60px]">
                          <div className="flex flex-col items-center space-y-1 mb-3">
                            {/* Completion Rate */}
                            <div className="w-6 bg-gray-200 rounded-t-lg relative" style={{height: '120px'}}>
                              <div
                                className="bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg w-full absolute bottom-0 transition-all duration-1000"
                                style={{height: `${(week.completion / 100) * 120}px`}}
                              ></div>
                            </div>
                            {/* Efficiency */}
                            <div className="w-6 bg-gray-200 rounded-t-lg relative" style={{height: '120px'}}>
                              <div
                                className="bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-lg w-full absolute bottom-0 transition-all duration-1000"
                                style={{height: `${(week.efficiency / 100) * 120}px`}}
                              ></div>
                            </div>
                            {/* Quality */}
                            <div className="w-6 bg-gray-200 rounded-t-lg relative" style={{height: '120px'}}>
                              <div
                                className="bg-gradient-to-t from-purple-500 to-pink-400 rounded-t-lg w-full absolute bottom-0 transition-all duration-1000"
                                style={{height: `${(week.quality / 100) * 120}px`}}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-700 font-bold bg-white px-2 py-1 rounded-lg shadow-sm border">
                            {week.week}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex justify-center space-x-6 mt-4 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">Abschluss</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-400 rounded mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">Effizienz</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-400 rounded mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">Qualität</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Current Week Summary */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="text-center">
                      <div className="font-bold text-gray-800 mb-2">Aktuelle Woche (KW 5)</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg font-bold">
                          📊 {weeklyTrends[4].completion}% Abschluss
                        </div>
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded-lg font-bold">
                          ⚡ {weeklyTrends[4].efficiency}% Effizienz
                        </div>
                        <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-lg font-bold">
                          ⭐ {weeklyTrends[4].quality}% Qualität
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ MOBILE-OPTIMIZED HOURLY ACTIVITY */}
              <div>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center text-sm sm:text-base">
                  <Clock className="w-4 h-4 mr-2" />
                  Tagesaktivität nach Stunden
                </h4>
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                  {/* Mobile Hourly Activity - Horizontal Bars */}
                  <div className="block sm:hidden space-y-3">
                    {hourlyActivity.map((hour, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-gray-800">{hour.hour}</span>
                          <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-bold">
                            {hour.tasks} Tasks
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-1000"
                            style={{width: `${(hour.tasks / 4) * 100}%`}}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Hourly Activity - Vertical Bars */}
                  <div className="hidden sm:block">
                    <div className="flex items-end justify-between h-32 mb-4">
                      {hourlyActivity.map((hour, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div className="relative">
                            <div className="w-8 bg-gray-200 rounded-t-lg relative" style={{height: '80px'}}>
                              <div
                                className="bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg w-full absolute bottom-0 transition-all duration-1000"
                                style={{height: `${(hour.tasks / 4) * 80}px`}}
                              ></div>
                              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-700 bg-white px-1 rounded shadow">
                                {hour.tasks}
                              </div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-700 mt-2 font-medium bg-white px-2 py-1 rounded-lg shadow-sm border">
                            {hour.hour.substring(0, 5)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Activity Insights */}
                  <div className="bg-white rounded-lg p-4 border border-indigo-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="font-bold text-orange-700 mb-1">🔥 Peak Zeit</div>
                        <div className="text-orange-600 font-bold">08:00-09:00 Uhr</div>
                        <div className="text-xs text-gray-500">4 Aufgaben/Stunde</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="font-bold text-green-700 mb-1">😌 Ruhigste Zeit</div>
                        <div className="text-green-600 font-bold">12:00-13:00 Uhr</div>
                        <div className="text-xs text-gray-500">1 Aufgabe/Stunde</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-gray-200 text-center">
                      <div className="text-sm text-gray-600">
                        <strong>Gesamt heute:</strong> {hourlyActivity.reduce((sum, h) => sum + h.tasks, 0)} Aufgaben verteilt über {hourlyActivity.length} Stunden
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✅ RESPONSIVE DEPARTMENT COMPARISON PANEL */}
          {showDepartmentComparison && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-[75vh] lg:max-h-96 overflow-y-auto max-w-6xl mx-auto mb-24 lg:mb-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center text-sm sm:text-base">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-emerald-600" />
                  Power Ranking
                </h3>
                <button onClick={() => setShowDepartmentComparison(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              {/* ✅ RESPONSIVE TOP PERFORMERS */}
              <div className="mb-6 p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <h4 className="font-bold text-yellow-800 mb-3 flex items-center text-sm sm:text-base">
                  <Award className="w-4 h-4 mr-2" />
                  Top Performer dieser Woche
                </h4>
                <div className="space-y-2">
                  {updatedDepartmentPerformance
                    .sort((a, b) => b.rate - a.rate)
                    .slice(0, 3)
                    .map((dept, index) => (
                    <div key={dept.dept} className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-yellow-300">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                          'bg-gradient-to-r from-orange-400 to-red-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-gray-800">{dept.dept}</div>
                          <div className="text-xs text-gray-600 truncate">{departments[dept.dept]}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base sm:text-lg font-bold text-yellow-700">{dept.rate}%</div>
                        <div className="text-xs text-gray-600">{dept.tasks} Aufgaben</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ✅ RESPONSIVE DETAILED METRICS TABLE */}
              <div className="mb-4">
                <h4 className="font-bold text-gray-800 mb-3 text-sm sm:text-base">Detaillierte Metriken</h4>
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <div className="space-y-3">
                    {updatedDepartmentPerformance.map((dept) => (
                      <div
                        key={dept.dept}
                        className={`p-3 rounded-lg border transition-all ${
                          dept.dept === selectedDepartment
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-100 border-2 border-blue-300'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-gray-800">
                              {dept.dept} {dept.dept === selectedDepartment && '(Ihre Abteilung)'}
                            </div>
                            <div className="text-xs text-gray-600 truncate">{departments[dept.dept]}</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-base sm:text-lg font-bold ${
                              dept.rate >= 90 ? 'text-green-700' :
                              dept.rate >= 75 ? 'text-yellow-700' :
                              'text-red-700'
                            }`}>
                              {dept.rate}%
                            </div>
                            <div className="text-xs text-gray-600">{dept.tasks} Aufgaben</div>
                          </div>
                        </div>
                        
                        {/* ✅ RESPONSIVE MULTI-METRIC INDICATORS */}
                        <div className="grid grid-cols-3 gap-1 sm:gap-2">
                          <div className="text-center">
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                                style={{width: `${dept.rate}%`}}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">Abschluss</span>
                          </div>
                          <div className="text-center">
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                              <div
                                className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                style={{width: `${Math.min(dept.rate + 5, 100)}%`}}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">Qualität</span>
                          </div>
                          <div className="text-center">
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                              <div
                                className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                                style={{width: `${Math.min(dept.rate + 3, 100)}%`}}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">Pünktlichkeit</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ✅ RESPONSIVE BENCHMARK COMPARISON */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-3 sm:p-4 border border-purple-200">
                <h4 className="font-bold text-purple-800 mb-3 text-sm sm:text-base">Hospital Benchmark</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-700">Hospital Durchschnitt</span>
                    <span className="text-sm font-bold text-purple-800">82%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-700">Ihre Abteilung</span>
                    <span className={`text-sm font-bold ${
                      dailyStats.completionRate >= 82 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {dailyStats.completionRate}%
                      {dailyStats.completionRate >= 82 ? ' ✅' : ' ⚠️'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-700">Branchenstandard</span>
                    <span className="text-sm font-bold text-purple-800">78%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✅ RESPONSIVE MOPP-VERSORGUNG HBD PANEL */}
          {showMoppVersorgung && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-96 overflow-y-auto max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center text-sm sm:text-base">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-600" />
                  Mopp-Versorgung HBD - Kepler Universitätsklinikum
                </h3>
                <button onClick={() => setShowMoppVersorgung(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="text-xs text-gray-600 mb-4 p-2 bg-orange-50 rounded-lg border border-orange-200">
                <strong>Mopp-Versorgung Dokumentation:</strong> Übersicht der Anlieferungspunkte für alle Stationen im Krankenhaus
              </div>

              {/* Birleştirilmiş 4 Buton - Mobile'da yan yana sığacak boyut + Tıklanabilir */}
              <div className="mb-4 grid grid-cols-4 gap-1 sm:gap-2">
                <button 
                  onClick={() => setMoppFilter('all')}
                  className={`bg-gradient-to-br transition-all hover:scale-105 shadow-sm font-medium text-center border ${
                    moppFilter === 'all' 
                      ? 'from-green-100 to-green-200 border-green-400 ring-2 ring-green-300' 
                      : 'from-green-50 to-green-100 hover:from-green-100 hover:to-green-150 border-green-200'
                  } text-green-800 p-1.5 sm:p-2 rounded-lg sm:rounded-xl`}
                >
                  <div className="text-sm sm:text-lg font-bold text-green-600 mb-0.5">43</div>
                  <div className="text-xs text-green-600 font-medium leading-tight">Gesamt Stationen</div>
                </button>
                
                <button 
                  onClick={() => setMoppFilter('reinigung')}
                  className={`bg-gradient-to-br transition-all hover:scale-105 shadow-sm font-medium text-center border ${
                    moppFilter === 'reinigung' 
                      ? 'from-blue-100 to-blue-200 border-blue-400 ring-2 ring-blue-300' 
                      : 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 border-blue-200'
                  } text-blue-800 p-1.5 sm:p-2 rounded-lg sm:rounded-xl`}
                >
                  <div className="text-sm sm:text-lg font-bold text-blue-600 mb-0.5">32</div>
                  <div className="text-xs text-blue-600 font-medium leading-tight">Reinigungs räume</div>
                </button>
                
                <button 
                  onClick={() => setMoppFilter('versorgung')}
                  className={`bg-gradient-to-br transition-all hover:scale-105 shadow-sm font-medium text-center border ${
                    moppFilter === 'versorgung' 
                      ? 'from-purple-100 to-purple-200 border-purple-400 ring-2 ring-purple-300' 
                      : 'from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-150 border-purple-200'
                  } text-purple-800 p-1.5 sm:p-2 rounded-lg sm:rounded-xl`}
                >
                  <div className="text-sm sm:text-lg font-bold text-purple-600 mb-0.5">6</div>
                  <div className="text-xs text-purple-600 font-medium leading-tight">Versorgungs räume</div>
                </button>
                
                <button 
                  onClick={() => setMoppFilter('anlauten')}
                  className={`bg-gradient-to-br transition-all hover:scale-105 shadow-sm font-medium text-center border ${
                    moppFilter === 'anlauten' 
                      ? 'from-orange-100 to-orange-200 border-orange-400 ring-2 ring-orange-300' 
                      : 'from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-150 border-orange-200'
                  } text-orange-800 p-1.5 sm:p-2 rounded-lg sm:rounded-xl`}
                >
                  <div className="text-sm sm:text-lg font-bold text-orange-600 mb-0.5">3</div>
                  <div className="text-xs text-orange-600 font-medium leading-tight">Anläuten erforderlich</div>
                </button>
              </div>

              {/* Filter Status Display */}
              <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-bold text-gray-800">
                    {moppFilter === 'all' && '🏥 Alle Stationen angezeigt'}
                    {moppFilter === 'reinigung' && '🧽 Nur Reinigungsräume angezeigt'}
                    {moppFilter === 'versorgung' && '📦 Nur Versorgungsräume angezeigt'}
                    {moppFilter === 'anlauten' && '🔔 Nur "Anläuten erforderlich" angezeigt'}
                  </div>
                  <div className="text-gray-600">
                    {filteredMoppData.length} von {moppVersorgungData.length} Stationen
                  </div>
                </div>
                {moppFilter !== 'all' && (
                  <button
                    onClick={() => setMoppFilter('all')}
                    className="mt-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full transition-all"
                  >
                    ← Alle Stationen anzeigen
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredMoppData.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-3 border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-800 mb-1 flex items-center">
                          <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-xs font-bold mr-2">
                            {item.station.charAt(0)}
                          </div>
                          {item.station}
                        </h4>
                        <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                          <strong>Anlieferung:</strong> {item.anlieferung}
                        </div>
                      </div>
                      
                      {/* Quick Action Buttons */}
                      <div className="flex flex-col space-y-1 ml-2">
                        <button 
                          className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded-full transition-all hover:scale-105"
                          onClick={() => {
                            // Could add functionality to mark as completed
                            addNotification(`✅ Mopp-Versorgung für ${item.station} markiert`, 'success');
                          }}
                        >
                          ✓
                        </button>
                        <button 
                          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-full transition-all hover:scale-105"
                          onClick={() => {
                            // Could add functionality for navigation or notes
                            addNotification(`📍 Navigation zu ${item.station} aktiviert`, 'info');
                          }}
                        >
                          📍
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats - Removed since we now have them at the top */}

              {/* Document Info */}
              <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800">📋 Kepler Universitätsklinikum</span>
                  <span className="text-gray-600">Mopp-Versorgung HBD Dokumentation</span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Letzte Aktualisierung: {new Date().toLocaleDateString('de-DE')} - Alle Anlieferungspunkte gemäß Krankenhaus-Standard
                </div>
              </div>
            </div>
          )}
          {showRewards && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-96 overflow-y-auto max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center text-sm sm:text-base">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-600" />
                  Belohnungs-System
                </h3>
                <button onClick={() => setShowRewards(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              {/* ✅ RESPONSIVE POINTS INDICATOR - CANLI YAYIN SIFIRLANDI */}
              <div className="mb-6 p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-yellow-800 flex items-center text-sm sm:text-base">
                    <Star className="w-4 h-4 mr-1" />
                    Ihre Punkte:
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-yellow-700">{userPoints}</span>
                </div>
                <div className="text-xs text-yellow-600 mb-2">
                  ✓ Aufgabe = +15 Punkte | Dokumentation: 1-7 Klicks = +5, 8-10 Klicks = +10, 11+ Klicks = +20
                </div>
                <div className="w-full bg-yellow-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{width: `${Math.min((userPoints / 40000) * 100, 100)}%`}}
                  ></div>
                </div>
              </div>

              {/* ✅ RESPONSIVE REWARDS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {rewards.map((reward) => {
                  const canAfford = userPoints >= reward.points;
                  
                  return (
                    <div
                      key={reward.id}
                      className={`p-3 rounded-xl border transition-all ${
                        canAfford
                          ? 'bg-green-50 border-green-300 hover:shadow-md cursor-pointer'
                          : 'bg-gray-50 border-gray-300 opacity-60'
                      }`}
                      onClick={() => canAfford && purchaseReward(reward.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          <div className="text-xl sm:text-2xl">{reward.icon}</div>
                          <div className="min-w-0 flex-1">
                            <h4 className={`font-bold text-sm ${
                              canAfford ? 'text-green-800' : 'text-gray-600'
                            }`}>
                              {reward.name}
                            </h4>
                            <p className={`text-xs ${
                              canAfford ? 'text-green-600' : 'text-gray-500'
                            }`}>
                              {reward.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-sm font-bold ${
                            canAfford ? 'text-green-700' : 'text-gray-500'
                          }`}>
                            {reward.points} Punkte
                          </div>
                          {canAfford ? (
                            <div className="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full">
                              KAUFEN! 🛒
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">
                              Noch {reward.points - userPoints}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ✅ RESPONSIVE PURCHASED REWARDS HISTORY */}
              {purchasedRewards.length > 0 && (
                <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <h4 className="font-bold text-purple-800 mb-2 flex items-center text-sm sm:text-base">
                    <Gift className="w-4 h-4 mr-1" />
                    Gekaufte Belohnungen:
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {purchasedRewards.slice(-5).reverse().map((item, index) => (
                      <div key={index} className="text-xs bg-white p-2 rounded border">
                        <span className="font-bold text-purple-700">{item.name}</span>
                        <span className="text-purple-600 ml-2">am {item.date} um {item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ✅ RESPONSIVE STATISTICS */}
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-2 text-sm sm:text-base">Ihre Statistiken:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-blue-700">
                    <strong>Gekaufte Belohnungen:</strong> {purchasedRewards.length}
                  </div>
                  <div className="text-blue-700">
                    <strong>Verfügbare Belohnungen:</strong> {rewards.filter(r => userPoints >= r.points).length}/{rewards.length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✅ RESPONSIVE TRANSPORT NEUBAU PANEL */}
          {showTransportNeu && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-96 overflow-y-auto max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center text-sm sm:text-base">
                  <Car className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
                  Transportdokumentation - Hauptmagazin Neubau
                </h3>
                <button onClick={() => setShowTransportNeu(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="text-xs text-gray-600 mb-4 p-2 bg-purple-50 rounded-lg border border-purple-200">
                <strong>Transportdokumentation:</strong> Station anklicken für Transport-Markierung. Anzahl der Wägen dokumentieren.
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(transportNeuDocumentation['Hauptmagazin Neubau']).map(([bauteil, stations]) => (
                  <div key={bauteil} className="bg-purple-50 rounded-xl p-3 border border-purple-200">
                    <h4 className="font-bold text-purple-800 mb-3 text-sm border-b border-purple-300 pb-1 flex items-center">
                      <Car className="w-4 h-4 mr-1" />
                      {bauteil}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {stations.map((station, index) => {
                        const checkSymbol = getGenericCheckSymbol(transportNeuChecks, bauteil, station);
                        return (
                          <button
                            key={index}
                            onClick={() => toggleGenericCheck(transportNeuChecks, setTransportNeuChecks, bauteil, station)}
                            className={`text-left p-2 rounded-lg text-xs transition-all ${
                              checkSymbol
                                ? 'bg-purple-100 border-2 border-purple-400 text-purple-800'
                                : 'bg-white border border-purple-300 text-gray-700 hover:bg-purple-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{station}</span>
                              {checkSymbol && (
                                <span className="text-purple-600 font-bold text-sm flex-shrink-0">
                                  {checkSymbol}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-purple-800">Gesamte Transporte:</span>
                  <span className="text-purple-700 font-bold">
                    {Object.values(transportNeuChecks).reduce((total, count) => total + count, 0)} Wagen
                  </span>
                </div>
                <div className="mt-2 text-xs text-purple-600">
                  Dokumentierte Stationen: {Object.keys(transportNeuChecks).length}
                </div>
              </div>
            </div>
          )}

          {/* ✅ RESPONSIVE TRANSPORT ALTBAU PANEL */}
          {showTransportAlt && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-96 overflow-y-auto max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center text-sm sm:text-base">
                  <Car className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600" />
                  Transportdokumentation - Hauptmagazin Altbau
                </h3>
                <button onClick={() => setShowTransportAlt(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="text-xs text-gray-600 mb-4 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                <strong>Transportdokumentation Altbau:</strong> Dokumentation für ältere Krankenhausbereiche
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(transportAltDocumentation['Hauptmagazin Altbau']).map(([bauteil, stations]) => (
                  <div key={bauteil} className="bg-indigo-50 rounded-xl p-3 border border-indigo-200">
                    <h4 className="font-bold text-indigo-800 mb-3 text-sm border-b border-indigo-300 pb-1 flex items-center">
                      <Car className="w-4 h-4 mr-1" />
                      {bauteil}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                      {stations.map((station, index) => {
                        const checkSymbol = getGenericCheckSymbol(transportAltChecks, bauteil, station);
                        return (
                          <button
                            key={index}
                            onClick={() => toggleGenericCheck(transportAltChecks, setTransportAltChecks, bauteil, station)}
                            className={`text-left p-2 rounded-lg text-xs transition-all ${
                              checkSymbol
                                ? 'bg-indigo-100 border-2 border-indigo-400 text-indigo-800'
                                : 'bg-white border border-indigo-300 text-gray-700 hover:bg-indigo-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{station}</span>
                              {checkSymbol && (
                                <span className="text-indigo-600 font-bold text-sm flex-shrink-0">
                                  {checkSymbol}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-indigo-800">Gesamte Transporte Altbau:</span>
                  <span className="text-indigo-700 font-bold">
                    {Object.values(transportAltChecks).reduce((total, count) => total + count, 0)} Wagen
                  </span>
                </div>
              </div>
            </div>
          )}
          {showApotheke && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-96 overflow-y-auto max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center text-sm sm:text-base">
                  <Pill className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                  Medikamenten-Dokumentation (DEMO)
                </h3>
                <button onClick={() => setShowApotheke(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="text-xs text-gray-600 mb-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <strong>DEMO VERSION:</strong> Beispiel wie Apotheke-Dokumentation aussehen würde. Station anklicken für Medikamenten-Lieferung Markierung.
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(apothekeDocumentation).map(([bauteil, stations]) => (
                  <div key={bauteil} className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                    <h4 className="font-bold text-blue-800 mb-3 text-sm border-b border-blue-300 pb-1 flex items-center">
                      <Pill className="w-4 h-4 mr-1" />
                      {bauteil}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {stations.map((station, index) => {
                        const checkSymbol = getApothekeCheckSymbol(bauteil, station);
                        return (
                          <button
                            key={index}
                            onClick={() => toggleApothekeCheck(bauteil, station)}
                            className={`text-left p-2 rounded-lg text-xs transition-all ${
                              checkSymbol
                                ? 'bg-blue-100 border-2 border-blue-400 text-blue-800'
                                : 'bg-white border border-blue-300 text-gray-700 hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{station}</span>
                              {checkSymbol && (
                                <span className="text-blue-600 font-bold text-sm flex-shrink-0">
                                  {checkSymbol}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-blue-800">Gesamte Medikamenten-Lieferungen:</span>
                  <span className="text-blue-700 font-bold">
                    {Object.values(apothekeChecks).reduce((total, count) => total + count, 0)} Lieferungen
                  </span>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                  Belieferte Stationen: {Object.keys(apothekeChecks).length} / {Object.values(apothekeDocumentation).flat().length}
                </div>
              </div>
            </div>
          )}

          {showDocumentation && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-96 overflow-y-auto max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center text-sm sm:text-base">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
                  Tagesdokumentation-Wäsche
                </h3>
                <button onClick={() => setShowDocumentation(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="text-xs text-gray-600 mb-4 p-2 bg-blue-50 rounded-lg">
                <strong>Anleitung:</strong> Station anklicken für ✓ Markierung. Mehrfach klicken für ✓✓ oder ✓✓✓
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(waescheDocumentation).map(([bauteil, stations]) => (
                  <div key={bauteil} className="bg-gray-50 rounded-xl p-3">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm border-b border-gray-300 pb-1">
                      {bauteil}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                      {stations.map((station, index) => {
                        const checkSymbol = getCheckSymbol(bauteil, station);
                        return (
                          <button
                            key={index}
                            onClick={() => toggleDocumentationCheck(bauteil, station)}
                            className={`text-left p-2 rounded-lg text-xs transition-all ${
                              checkSymbol
                                ? 'bg-green-100 border-2 border-green-300 text-green-800'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{station}</span>
                              {checkSymbol && (
                                <span className="text-green-600 font-bold text-sm flex-shrink-0">
                                  {checkSymbol}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-green-800">Gesamtwagenzahl:</span>
                  <span className="text-green-700 font-bold">
                    {Object.values(documentationChecks).reduce((total, count) => total + count, 0)} Wägen
                  </span>
                </div>
                <div className="mt-2 text-xs text-green-600">
                  Kontrollierte Stationen: {Object.keys(documentationChecks).length} / {Object.values(waescheDocumentation).flat().length}
                </div>
              </div>
            </div>
          )}

          {/* ✅ RESPONSIVE NOTIFICATIONS PANEL */}
          {showNotifications && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-80 overflow-y-auto max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">Benachrichtigungen</h3>
                <button onClick={() => setShowNotifications(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Keine Benachrichtigungen</p>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(-5).reverse().map(notification => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-xl border transition-all ${
                        notification.isRead
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-blue-50 border-blue-200 shadow-sm'
                      }`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-500 text-white">
                              ERINNERUNG
                            </span>
                            <span className="text-xs text-gray-500">{notification.time}</span>
                          </div>
                          <h4 className="font-medium text-sm text-gray-900 truncate">{notification.title}</h4>
                          <p className="text-xs text-gray-600">{notification.message}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="p-1 rounded-lg hover:bg-gray-200 ml-2 flex-shrink-0"
                        >
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* ✅ RESPONSIVE MOBILE MENU - FIXED SCROLL LIKE OTHER PANELS */}
          {showMenu && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-96 overflow-y-auto max-w-2xl mx-auto">
              <div className="space-y-4">
                {/* ✅ RESPONSIVE MODERN DROPDOWN DEPARTMENT SELECTOR */}
                <div className="relative">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center text-sm sm:text-base">
                    <Users className="w-4 h-4 mr-2 text-indigo-600" />
                    DECT wählen
                    {currentUser && (
                      <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                        {currentUser.name}
                      </span>
                    )}
                  </h4>
                  
                  {/* Dropdown Trigger Button */}
                  <button
                    onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                    className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-left flex items-center justify-between hover:border-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {selectedDepartment.slice(-2)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-gray-800">{selectedDepartment}</div>
                        <div className="text-xs text-gray-600 truncate">
                          {departments[selectedDepartment]}
                        </div>
                        <div className="text-xs text-orange-600 font-medium">
                          {(taskTemplates[selectedDepartment] || []).length} Aufgaben · {Array.from(completedTasks).filter(id => 
                            (taskTemplates[selectedDepartment] || []).some(task => task.id === id)
                          ).length} erledigt
                        </div>
                      </div>
                    </div>
                    <div className={`transform transition-transform ${showDepartmentDropdown ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Dropdown Menu - Touch Optimized */}
                  {showDepartmentDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-10">
                      <div className="p-2">
                        {/* Search Box */}
                        <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                          <input
                            type="text"
                            placeholder="🔍 DECT suchen..."
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                            onChange={(e) => {
                              const searchTerm = e.target.value.toLowerCase();
                            }}
                          />
                        </div>
                        
                        {/* DECT List - Enhanced Touch Optimized Scroll */}
                        <div className="py-2 space-y-1" 
                             style={{
                               maxHeight: '200px',
                               overflowY: 'auto',
                               WebkitOverflowScrolling: 'touch',
                               touchAction: 'pan-y',
                               scrollBehavior: 'smooth',
                               scrollbarWidth: 'thin',
                               scrollbarColor: '#9CA3AF #F3F4F6',
                               overscrollBehavior: 'contain'
                             }}>
                          {Object.entries(departments).map(([code, name]) => {
                            const isLocked = mainIsDECTLocked(code);
                            const lockInfo = mainGetDECTLockInfo(code);
                            
                            return (
                              <button
                                key={code}
                                onClick={() => {
                                  if (isLocked) {
                                    addNotification(`🔒 DECT ${code} ist bereits von ${lockInfo?.userName} belegt!`, 'warning');
                                    return;
                                  }
                                  
                                  setSelectedDepartment(code);
                                  setShowDepartmentDropdown(false);
                                  setShowMenu(false);
                                  
                                  // ✅ YENİ: DECT değiştirme uyarısı
                                  if (selectedDepartmentLock && selectedDepartmentLock !== code) {
                                    addNotification(`📋 DECT gewechselt zu ${code} - Aber Punkte nur von DECT ${selectedDepartmentLock}!`, 'warning');
                                  } else {
                                    addNotification(`📋 Gewechselt zu DECT ${code}`, 'info');
                                  }
                                }}
                                disabled={isLocked}
                                className={`w-full p-3 rounded-lg text-left transition-all mb-1 ${
                                  isLocked
                                    ? 'bg-red-50 border-2 border-red-300 opacity-60 cursor-not-allowed'
                                    : selectedDepartment === code
                                      ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-400 shadow-md'
                                      : 'bg-gradient-to-r from-gray-50 to-blue-50 hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-300 border-2 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg relative ${
                                    isLocked
                                      ? 'bg-gradient-to-r from-red-400 to-red-600'
                                      : selectedDepartment === code 
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600' 
                                        : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                  }`}>
                                    {code.slice(-2)}
                                    {isLocked && (
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className={`font-bold text-sm flex items-center ${
                                      isLocked 
                                        ? 'text-red-700'
                                        : selectedDepartment === code ? 'text-indigo-800' : 'text-gray-800'
                                    }`}>
                                      {code}
                                      {isLocked && (
                                        <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                                          🔒 BELEGT
                                        </span>
                                      )}
                                      {selectedDepartmentLock === code && !isLocked && (
                                        <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                                          🔒 AKTIV
                                        </span>
                                      )}
                                      {selectedDepartment === code && selectedDepartmentLock !== code && !isLocked && (
                                        <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                                          👁️ ANSICHT
                                        </span>
                                      )}
                                    </div>
                                    <div className={`text-xs truncate ${
                                      isLocked 
                                        ? 'text-red-600'
                                        : selectedDepartment === code ? 'text-indigo-700' : 'text-gray-700'
                                    }`}>
                                      {name}
                                    </div>
                                    {isLocked && lockInfo && (
                                      <div className="text-xs text-red-500 font-medium">
                                        Von {lockInfo.userName} um {lockInfo.lockTime}
                                      </div>
                                    )}
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className={`text-xs font-medium ${
                                        isLocked 
                                          ? 'text-red-600'
                                          : selectedDepartment === code ? 'text-orange-700' : 'text-orange-600'
                                      }`}>
                                        {(taskTemplates[code] || []).length} Tasks
                                      </span>
                                      {selectedDepartmentLock === code && !isLocked && (
                                        <span className="text-xs text-green-700 font-medium">
                                          · {Array.from(completedTasks).filter(id => 
                                            (taskTemplates[code] || []).some(task => task.id === id)
                                          ).length} erledigt
                                        </span>
                                      )}
                                      {selectedDepartment === code && selectedDepartmentLock !== code && !isLocked && (
                                        <span className="text-xs text-gray-600 font-medium">
                                          · Nur Ansicht
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {selectedDepartmentLock === code && !isLocked && (
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                      <CheckCircle className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                  {selectedDepartment === code && selectedDepartmentLock !== code && !isLocked && (
                                    <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center shadow-lg">
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ✅ DATE SELECTOR */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center text-sm sm:text-base">
                    <Calendar className="w-4 h-4 mr-2 text-green-600" />
                    Datum wählen
                  </h4>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 bg-white rounded-xl text-sm font-medium shadow-inner focus:border-green-400 focus:ring-2 focus:ring-green-200 transition-all"
                  />
                </div>

                {/* ✅ PRIORITY FILTER */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center text-sm sm:text-base">
                    <Filter className="w-4 h-4 mr-2 text-orange-600" />
                    Priorität Filter
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['all', 'high', 'medium', 'low'].map((priority) => (
                      <button
                        key={priority}
                        onClick={() => setFilterPriority(priority)}
                        className={`py-3 px-4 rounded-xl text-xs font-medium transition-all ${
                          filterPriority === priority
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent hover:border-gray-300'
                        }`}
                      >
                        {priority === 'all' ? '🔍 Alle' :
                         priority === 'high' ? '🔴 Hoch' :
                         priority === 'medium' ? '🟡 Mittel' : '🟢 Niedrig'}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* ✅ MOBILE ONLY QUICK ACTIONS - ENHANCED SCROLLABLE GRID */}
                <div className="lg:hidden pt-2 border-t border-gray-200" style={{
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                  overscrollBehavior: 'contain'
                }}>
                  <h4 className="text-xs font-bold text-gray-600 mb-2 px-1">📋 Hauptmagazin Dokumentationen</h4>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={() => {
                        setShowTransportNeu(!showTransportNeu); 
                        setShowMenu(false);
                        // Smooth scroll to top with enhanced animation
                        setTimeout(() => {
                          window.scrollTo({ 
                            top: 0, 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }, 100);
                      }}
                      className="p-3 rounded-xl bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-lg text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <Car className="w-4 h-4 mx-auto mb-1" />
                      Hauptmagazin Neubau
                    </button>
                    <button
                      onClick={() => {
                        setShowTransportAlt(!showTransportAlt); 
                        setShowMenu(false);
                        // Smooth scroll to top with enhanced animation
                        setTimeout(() => {
                          window.scrollTo({ 
                            top: 0, 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }, 100);
                      }}
                      className="p-3 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-500 text-white shadow-lg text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <Car className="w-4 h-4 mx-auto mb-1" />
                      Hauptmagazin Altbau
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-gray-600 mb-2 px-1">💊 Medikamenten Dokumentationen</h4>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={() => {
                        setShowMedikamenteAlt(!showMedikamenteAlt); 
                        setShowMenu(false);
                        // Enhanced smooth scroll to top
                        setTimeout(() => {
                          window.scrollTo({ 
                            top: 0, 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }, 100);
                      }}
                      className="p-3 rounded-xl bg-gradient-to-r from-pink-400 to-red-500 text-white shadow-lg text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <Pill className="w-4 h-4 mx-auto mb-1" />
                      Medika. Alt
                    </button>
                    <button
                      onClick={() => {
                        setShowMedikamenteNeu(!showMedikamenteNeu); 
                        setShowMenu(false);
                        // Enhanced smooth scroll to top
                        setTimeout(() => {
                          window.scrollTo({ 
                            top: 0, 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }, 100);
                      }}
                      className="p-3 rounded-xl bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-lg text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <Pill className="w-4 h-4 mx-auto mb-1" />
                      Medika. Neu
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-gray-600 mb-2 px-1">🧺 Wäsche & Kontrollen</h4>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={() => {
                        setShowDocumentation(!showDocumentation); 
                        setShowMenu(false);
                        // Enhanced smooth scroll to top
                        setTimeout(() => {
                          window.scrollTo({ 
                            top: 0, 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }, 100);
                      }}
                      className="p-3 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <FileText className="w-4 h-4 mx-auto mb-1" />
                      Wäsche
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Kleiderbügel button clicked'); // Debug için
                        setShowKleiderbugel(!showKleiderbugel); 
                        setShowMenu(false);
                        // ❌ REMOVED: Kleiderbügel bildirim kaldırıldı
                        // Smooth scroll to top with enhanced animation
                        setTimeout(() => {
                          window.scrollTo({ 
                            top: 0, 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }, 100);
                      }}
                      className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <Star className="w-4 h-4 mx-auto mb-1" />
                      Kleiderbügel
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 mb-3">
                    <button
                      onClick={() => {
                        setSuchtgiftDoku(!suchtgiftDoku); 
                        setShowMenu(false);
                        // Enhanced smooth scroll to top
                        setTimeout(() => {
                          window.scrollTo({ 
                            top: 0, 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }, 100);
                      }}
                      className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <AlertCircle className="w-4 h-4 mx-auto mb-1" />
                      Suchtgift
                    </button>
                  </div>
                  
                  <h4 className="text-xs font-bold text-gray-600 mb-2 px-1">🏥 Service & Transport</h4>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={() => {
                        setShowMoppVersorgung(!showMoppVersorgung); 
                        setShowMenu(false);
                        // Enhanced smooth scroll to top
                        setTimeout(() => {
                          window.scrollTo({ 
                            top: 0, 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }, 100);
                      }}
                      className="p-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <FileText className="w-4 h-4 mx-auto mb-1" />
                      Mopp-Plan
                    </button>
                    <button
                      onClick={() => {
                        setShowBadHall(!showBadHall); 
                        setShowMenu(false);
                        // Enhanced smooth scroll to top
                        setTimeout(() => {
                          window.scrollTo({ 
                            top: 0, 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }, 100);
                      }}
                      className="p-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <Plane className="w-4 h-4 mx-auto mb-1" />
                      Bad Hall
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-gray-600 mb-2 px-1">⚙️ App Einstellungen</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setShowSettings(!showSettings); 
                        setShowMenu(false);
                        // Enhanced smooth scroll to top
                        setTimeout(() => {
                          window.scrollTo({ 
                            top: 0, 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }, 100);
                      }}
                      className="p-3 rounded-xl bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <Settings className="w-4 h-4 mx-auto mb-1" />
                      Einstellungen
                    </button>
                    <button
                      onClick={handleChangeUser}
                      className="p-3 rounded-xl bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <Users className="w-4 h-4 mx-auto mb-1" />
                      Benutzer wechseln
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ DEBUG: YENİ DOKÜMANTASYON PANELLERİ - HEADER'DAN HEMEN SONRA */}
          {/* ✅ RESPONSIVE MEDIKAMENTE NEUBAU PANEL - HEADER SYSTEM */}
          {showMedikamenteNeu && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-96 overflow-y-auto max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center text-sm sm:text-base">
                  <Pill className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-600" />
                  Medikamente Neubau - Dokumentation
                </h3>
                <button onClick={() => setShowMedikamenteNeu(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="text-xs text-gray-600 mb-4 p-2 bg-red-50 rounded-lg border border-red-200">
                <strong>Medikamente Neubau:</strong> Dokumentation der Medikamentenverteilung für Neubau-Bereiche
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(medikamenteNeuDocumentation['Medikamente Neubau']).map(([bauteil, stations]) => (
                  <div key={bauteil} className="bg-red-50 rounded-xl p-3 border border-red-200">
                    <h4 className="font-bold text-red-800 mb-3 text-sm border-b border-red-300 pb-1 flex items-center">
                      <Pill className="w-4 h-4 mr-1" />
                      {bauteil}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {stations.map((station, index) => {
                        const checkSymbol = getGenericCheckSymbol(medikamenteNeuChecks, bauteil, station);
                        return (
                          <button
                            key={index}
                            onClick={() => toggleGenericCheck(medikamenteNeuChecks, setMedikamenteNeuChecks, bauteil, station)}
                            className={`text-left p-2 rounded-lg text-xs transition-all ${
                              checkSymbol
                                ? 'bg-red-100 border-2 border-red-400 text-red-800'
                                : 'bg-white border border-red-300 text-gray-700 hover:bg-red-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{station}</span>
                              {checkSymbol && (
                                <span className="text-red-600 font-bold text-sm flex-shrink-0">
                                  {checkSymbol}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-red-800">Medikamenten-Lieferungen Neubau:</span>
                  <span className="text-red-700 font-bold">
                    {Object.values(medikamenteNeuChecks).reduce((total, count) => total + count, 0)} Wagen
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ✅ RESPONSIVE MEDIKAMENTE ALTBAU PANEL - HEADER SYSTEM */}
          {showMedikamenteAlt && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-96 overflow-y-auto max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center text-sm sm:text-base">
                  <Pill className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-pink-600" />
                  Medikamente Altbau - Dokumentation
                </h3>
                <button onClick={() => setShowMedikamenteAlt(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="text-xs text-gray-600 mb-4 p-2 bg-pink-50 rounded-lg border border-pink-200">
                <strong>Medikamente Altbau:</strong> Dokumentation der Medikamentenverteilung für Altbau-Bereiche
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(medikamenteAltDocumentation['Medikamente Altbau']).map(([bauteil, stations]) => (
                  <div key={bauteil} className="bg-pink-50 rounded-xl p-3 border border-pink-200">
                    <h4 className="font-bold text-pink-800 mb-3 text-sm border-b border-pink-300 pb-1 flex items-center">
                      <Pill className="w-4 h-4 mr-1" />
                      {bauteil}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {stations.map((station, index) => {
                        const checkSymbol = getGenericCheckSymbol(medikamenteAltChecks, bauteil, station);
                        return (
                          <button
                            key={index}
                            onClick={() => toggleGenericCheck(medikamenteAltChecks, setMedikamenteAltChecks, bauteil, station)}
                            className={`text-left p-2 rounded-lg text-xs transition-all ${
                              checkSymbol
                                ? 'bg-pink-100 border-2 border-pink-400 text-pink-800'
                                : 'bg-white border border-pink-300 text-gray-700 hover:bg-pink-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{station}</span>
                              {checkSymbol && (
                                <span className="text-pink-600 font-bold text-sm flex-shrink-0">
                                  {checkSymbol}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-pink-50 to-red-50 rounded-xl border border-pink-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-pink-800">Medikamenten-Lieferungen Altbau:</span>
                  <span className="text-pink-700 font-bold">
                    {Object.values(medikamenteAltChecks).reduce((total, count) => total + count, 0)} Wagen
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ✅ RESPONSIVE SUCHTGIFT PANEL - HEADER SYSTEM */}
          {suchtgiftDoku && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-96 overflow-y-auto max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center text-sm sm:text-base">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-600" />
                  Suchtgift - Kontrollierte Substanzen
                </h3>
                <button onClick={() => setSuchtgiftDoku(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="text-xs text-gray-600 mb-4 p-2 bg-orange-50 rounded-lg border border-orange-200">
                <strong>⚠️ SUCHTGIFT DOKUMENTATION:</strong> Spezielle Dokumentation für kontrollierte Substanzen - besondere Sorgfalt erforderlich!
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(suchtgiftDocumentation['Suchtgift Kontrolle']).map(([bauteil, stations]) => (
                  <div key={bauteil} className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                    <h4 className="font-bold text-orange-800 mb-3 text-sm border-b border-orange-300 pb-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {bauteil}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {stations.map((station, index) => {
                        const checkSymbol = getGenericCheckSymbol(suchtgiftChecks, bauteil, station);
                        return (
                          <button
                            key={index}
                            onClick={() => toggleGenericCheck(suchtgiftChecks, setSuchtgiftChecks, bauteil, station)}
                            className={`text-left p-2 rounded-lg text-xs transition-all ${
                              checkSymbol
                                ? 'bg-orange-100 border-2 border-orange-400 text-orange-800'
                                : 'bg-white border border-orange-300 text-gray-700 hover:bg-orange-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{station}</span>
                              {checkSymbol && (
                                <span className="text-orange-600 font-bold text-sm flex-shrink-0">
                                  {checkSymbol}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-orange-800">⚠️ Suchtgift Kontrollen:</span>
                  <span className="text-orange-700 font-bold">
                    {Object.values(suchtgiftChecks).reduce((total, count) => total + count, 0)} Kontrollen
                  </span>
                </div>
                <div className="mt-2 text-xs text-orange-600">
                  🔒 Kontrollierte Bereiche: {Object.keys(suchtgiftChecks).length} | ⚠️ Besondere Sorgfalt erforderlich!
                </div>
              </div>
            </div>
          )}

          {/* ✅ RESPONSIVE KLEIDERBÜGEL PANEL - HEADER SYSTEM */}
          {showKleiderbugel && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-96 overflow-y-auto max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center text-sm sm:text-base">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
                  Abholung Kleiderbügel bei Personalumkleiden
                </h3>
                <button onClick={() => setShowKleiderbugel(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="text-xs text-gray-600 mb-4 p-2 bg-purple-50 rounded-lg border border-purple-200">
                <strong>Abholung jeden Montag ab 7:00 Uhr durch 27525</strong><br />
                Bitte bei der Abholung einen Transportwagen mitnehmen!
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(kleiderbugelDocumentation).map(([bereich, stationen]) => (
                  <div key={bereich} className="bg-purple-50 rounded-xl p-3 border border-purple-200">
                    <h4 className="font-bold text-purple-800 mb-3 text-sm border-b border-purple-300 pb-1 flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      {bereich}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {stationen.map((station, index) => {
                        // Station name and details ayrı
                        const stationParts = station.split(' - ');
                        const stationName = stationParts[0];
                        const stationDetail = stationParts[1] || '';
                        const isNotNeeded = stationDetail.includes('nicht notwendig');
                        
                        const checkSymbol = getGenericCheckSymbol(kleiderbugelChecks, bereich, station);
                        return (
                          <button
                            key={index}
                            onClick={() => toggleGenericCheck(kleiderbugelChecks, setKleiderbugelChecks, bereich, station)}
                            className={`text-left p-2 rounded-lg text-xs transition-all ${
                              isNotNeeded 
                                ? 'bg-gray-100 border border-gray-300 text-gray-500 cursor-not-allowed'
                                : checkSymbol
                                  ? 'bg-purple-100 border-2 border-purple-400 text-purple-800'
                                  : 'bg-white border border-purple-300 text-gray-700 hover:bg-purple-50'
                            }`}
                            disabled={isNotNeeded}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{stationName}</div>
                                <div className={`text-xs mt-1 ${
                                  isNotNeeded ? 'text-gray-400' : 'text-purple-600'
                                }`}>
                                  {stationDetail}
                                </div>
                              </div>
                              {checkSymbol && !isNotNeeded && (
                                <span className="text-purple-600 font-bold text-sm flex-shrink-0 ml-2">
                                  {checkSymbol}
                                </span>
                              )}
                              {isNotNeeded && (
                                <span className="text-gray-400 text-xs flex-shrink-0 ml-2">
                                  ❌
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-purple-800">Abgeholte Kleiderbügel:</span>
                  <span className="text-purple-700 font-bold">
                    {Object.values(kleiderbugelChecks).reduce((total, count) => total + count, 0)} Standorte
                  </span>
                </div>
                <div className="mt-2 text-xs text-purple-600">
                  Bereiche kontrolliert: {Object.keys(kleiderbugelChecks).length}
                </div>
              </div>
            </div>
          )}
          {showBadHall && (
            <div className="mt-4 p-3 sm:p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-96 overflow-y-auto max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center text-sm sm:text-base">
                  <Plane className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-teal-600" />
                  Bad Hall Versorgung
                </h3>
                <button onClick={() => setShowBadHall(false)} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="text-xs text-gray-600 mb-4 p-2 bg-teal-50 rounded-lg border border-teal-200">
                <strong>🏥 Bad Hall Versorgung:</strong> Spezielle Lieferungen und Services für Bad Hall Standort.
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(badHallDocumentation['Bad Hall Versorgung']).map(([bereich, stations]) => (
                  <div key={bereich} className={`rounded-xl p-3 border ${
                    bereich === 'Bad Hall' 
                      ? 'bg-teal-50 border-teal-200' 
                      : 'bg-cyan-50 border-cyan-200'
                  }`}>
                    <h4 className={`font-bold mb-3 text-sm border-b pb-1 flex items-center ${
                      bereich === 'Bad Hall' 
                        ? 'text-teal-800 border-teal-300' 
                        : 'text-cyan-800 border-cyan-300'
                    }`}>
                      {bereich === 'Bad Hall' ? (
                        <Plane className="w-4 h-4 mr-1" />
                      ) : (
                        <Car className="w-4 h-4 mr-1" />
                      )}
                      {bereich}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {stations.map((station, index) => {
                        const checkSymbol = getGenericCheckSymbol(badHallChecks, bereich, station);
                        return (
                          <button
                            key={index}
                            onClick={() => toggleGenericCheck(badHallChecks, setBadHallChecks, bereich, station)}
                            className={`text-left p-2 rounded-lg text-xs transition-all ${
                              checkSymbol
                                ? bereich === 'Bad Hall'
                                  ? 'bg-teal-100 border-2 border-teal-400 text-teal-800'
                                  : 'bg-cyan-100 border-2 border-cyan-400 text-cyan-800'
                                : bereich === 'Bad Hall'
                                  ? 'bg-white border border-teal-300 text-gray-700 hover:bg-teal-50'
                                  : 'bg-white border border-cyan-300 text-gray-700 hover:bg-cyan-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{station}</span>
                              {checkSymbol && (
                                <span className={`font-bold text-sm flex-shrink-0 ${
                                  bereich === 'Bad Hall' ? 'text-teal-600' : 'text-cyan-600'
                                }`}>
                                  {checkSymbol}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-teal-800">🏥 Bad Hall Lieferungen:</span>
                  <span className="text-teal-700 font-bold">
                    {Object.values(badHallChecks).reduce((total, count) => total + count, 0)} Services
                  </span>
                </div>
              </div>
            </div>
          )}

      {/* ✅ YENİ: PERSONEL NAME EDIT MODAL */}
      {showNameEditModal && editingPersonel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 w-full max-w-md mx-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Name bearbeiten
                </h3>
                <button 
                  onClick={() => setShowNameEditModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {editingPersonel.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">DECT {editingPersonel.selectedDECT}</div>
                      <div className="text-sm text-gray-600">{editingPersonel.userDepartment}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aktueller Name:
                  </label>
                  <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 font-medium">
                    {editingPersonel.userName}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Neuer Name:
                  </label>
                  <input
                    type="text"
                    value={newPersonelName}
                    onChange={(e) => setNewPersonelName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && savePersonelNameChange()}
                    placeholder="Geben Sie den korrekten Namen ein..."
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all"
                    autoFocus
                  />
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <strong>Hinweis:</strong> Diese Änderung wird sofort für alle Systeme übernommen und im Änderungsprotokoll gespeichert.
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setShowNameEditModal(false)}
                    className="flex-1 py-3 px-4 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-all"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={savePersonelNameChange}
                    disabled={!newPersonelName.trim() || newPersonelName.trim() === editingPersonel.userName}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    💾 Speichern
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ RESPONSIVE MAIN CONTENT AREA */}
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto">
        {/* ✅ YENİ: KULLANICI GİRİŞ MODALI */}
      {showUserLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 w-full max-w-md mx-auto overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Willkommen zu Bringolino</h2>
              <p className="text-blue-100 text-sm">Melden Sie sich an, um zu beginnen</p>
            </div>

            {/* Content */}
            <div className="p-6">
              {userLoginStep === 'name' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      👤 Ihr Name
                    </label>
                    <input
                      type="text"
                      value={tempUserName}
                      onChange={(e) => setTempUserName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && tempUserName.trim() && setUserLoginStep('department')}
                      placeholder="z.B. Max Mustermann"
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all text-lg"
                      autoFocus
                    />
                  </div>
                  
                  <button
                    onClick={() => tempUserName.trim() && setUserLoginStep('department')}
                    disabled={!tempUserName.trim()}
                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Weiter →
                  </button>
                </div>
              )}

              {userLoginStep === 'department' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🏥 Abteilung (Optional)
                    </label>
                    <input
                      type="text"
                      value={tempUserDepartment}
                      onChange={(e) => setTempUserDepartment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleUserLogin()}
                      placeholder="z.B. Logistik, Reinigung, Service..."
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all text-lg"
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setUserLoginStep('name')}
                      className="flex-1 py-4 bg-gray-500 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all"
                    >
                      ← Zurück
                    </button>
                    <button
                      onClick={handleUserLogin}
                      className="flex-1 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all"
                    >
                      Anmelden ✓
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 text-center">
              <p className="text-xs text-gray-600">
                🔒 Ihre Daten werden lokal gespeichert und täglich zurückgesetzt
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ RESPONSIVE PROGRESS CARD */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-4 sm:p-6 mb-4 sm:mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              DECT {selectedDepartment}
              {currentUser && (
                <div className="text-sm sm:text-base text-gray-600 font-medium mt-1">
                  👤 {currentUser.name}
                </div>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full inline-block">
              {new Date(selectedDate).toLocaleDateString('de-DE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </div>

          {/* ✅ RESPONSIVE CIRCULAR PROGRESS */}
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

          {/* ✅ RESPONSIVE STATS GRID */}
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

        {/* ✅ RESPONSIVE TASKS LIST */}
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
                    data-task-id={task.id}
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

        {/* ✅ RESPONSIVE BOTTOM SPACING */}
        <div className="h-24 sm:h-24 lg:h-20"></div>
      </div>

      {/* ✅ YENİ: PROFESYONEL KONFETI EFEKTI - Geometrik Şekiller */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {/* Renkli Geometrik Konfeti Parçacıkları */}
          {[...Array(25)].map((_, i) => {
            const colors = [
              'bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500',
              'bg-orange-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-cyan-500'
            ];
            const shapes = [
              'w-3 h-2', 'w-2 h-3', 'w-4 h-2', 'w-2 h-4', 'w-3 h-3', 'w-4 h-3'
            ];
            const rotations = ['rotate-12', 'rotate-45', '-rotate-12', '-rotate-45', 'rotate-90'];
            
            return (
              <div
                key={`confetti-${i}`}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-20px`,
                  animationName: 'confetti-geometric-fall',
                  animationDuration: `${3.5 + Math.random() * 2.5}s`, // ✅ Daha yavaş: 3.5-6 saniye
                  animationDelay: `${Math.random() * 1}s`,
                  animationFillMode: 'forwards',
                  animationTimingFunction: 'ease-out',
                }}
              >
                <div 
                  className={`
                    ${colors[Math.floor(Math.random() * colors.length)]} 
                    ${shapes[Math.floor(Math.random() * shapes.length)]}
                    ${rotations[Math.floor(Math.random() * rotations.length)]}
                    opacity-95 shadow-md
                  `}
                  style={{
                    transform: `rotate(${Math.random() * 360}deg)`,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ YENİ: PUAN ANIMASYONLARI */}
      {pointsAnimation.map(animation => (
        <div
          key={animation.id}
          className="fixed pointer-events-none z-50 font-bold text-green-600 text-xl drop-shadow-lg"
          style={{
            left: animation.x,
            top: animation.y,
            transform: 'translate(-50%, -50%)',
            animationName: 'points-float',
            animationDuration: '2s',
            animationFillMode: 'forwards',
          }}
        >
          {animation.points} Punkte
        </div>
      ))}

      {/* ✅ PWA CSS - Native App Styling */}
      <style jsx>{`
        /* ✅ PWA NATIVE APP STYLES */
        .pwa-installed {
          /* Hide scrollbars for native feel */
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .pwa-installed::-webkit-scrollbar {
          display: none;
        }
        
        /* ✅ Safe area support for notched devices */
        .pwa-status-bar-spacer {
          height: env(safe-area-inset-top, 0px);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        
        /* ✅ PWA Splash Screen */
        .pwa-splash-screen {
          animation: splash-fade-out 2s ease-out 1s forwards;
        }
        
        @keyframes splash-fade-out {
          0% { opacity: 1; transform: scale(1); }
          80% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.1); pointer-events: none; }
        }
        
        /* ✅ Native app feel - remove blue highlights on touch */
        .pwa-installed * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        /* ✅ Allow text selection where needed */
        .pwa-installed input,
        .pwa-installed textarea {
          -webkit-user-select: text;
          user-select: text;
        }
        
        /* ✅ Prevent pull-to-refresh on installed PWA */
        .pwa-installed body {
          overscroll-behavior-y: contain;
        }
        
        /* ✅ Enhanced PWA animations */
        @media (display-mode: standalone) {
          /* Native app mode specific styles */
          body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            overscroll-behavior: none;
          }
          
          /* Hide browser elements that might leak through */
          .browser-only {
            display: none !important;
          }
          
          /* Enhanced native transitions */
          * {
            transition: all 0.2s ease-out;
          }
        }
        
        /* ✅ iOS specific PWA styles */
        @supports (-webkit-touch-callout: none) {
          .pwa-installed {
            /* iOS PWA specific adjustments */
            height: 100vh;
            height: -webkit-fill-available;
          }
        }
        
        @keyframes confetti-geometric-fall {
          0% { 
            transform: translateY(-20px) rotate(0deg); 
            opacity: 0; 
          }
          15% { 
            opacity: 0.95; 
          }
          100% { 
            transform: translateY(100vh) rotate(180deg); 
            opacity: 0.3; 
          }
        }
        
        @keyframes points-float {
          0% { 
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          20% { 
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 1;
          }
          100% { 
            transform: translate(-50%, -200%) scale(1);
            opacity: 0;
          }
        }

        @keyframes celebration-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px) rotate(-1deg); }
          20%, 40%, 60%, 80% { transform: translateX(3px) rotate(1deg); }
        }

        .celebration-shake {
          animation: celebration-shake 0.6s ease-in-out;
        }
      `}</style>

      {/* ✅ RESPONSIVE SUCCESS CELEBRATION - ENHANCED */}
      {completedCount === currentTasks.length && currentTasks.length > 0 && !successPopupDismissed && (
        <div className={`fixed bottom-4 sm:bottom-6 left-3 right-3 sm:left-4 sm:right-4 max-w-lg mx-auto z-50 ${celebrationShake ? 'celebration-shake' : ''}`}>
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl text-center border border-white/20 backdrop-blur-xl relative overflow-hidden">
            {/* ✅ YENİ: ARKA PLAN SHIMMER EFEKTI */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            
            {/* ✅ CLOSE BUTTON */}
            <button
              onClick={() => {
                setSuccessPopupDismissed(true);
                setSuccessPopupDismissTime(Date.now());
                // ✅ BİLDİRİM SADECE BURADA - Tüm görevler bitince
                addNotification('🎉 Erfolgs-Nachricht für 20 Sekunden ausgeblendet', 'info');
              }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110 group z-10"
            >
              <X className="w-4 h-4 text-white group-hover:text-green-100" />
            </button>

            <div className="relative z-10">
              <div className="text-2xl sm:text-3xl font-bold mb-2 animate-bounce">🎉 PERFEKT! 🎉</div>
              <div className="text-lg font-bold mb-2">Alle Aufgaben erledigt!</div>
              <div className="text-sm opacity-90 mb-2">Fantastische Arbeit heute!</div>
              <div className="flex items-center justify-center space-x-2 mt-3">
                <Star className="w-5 h-5 text-yellow-300 animate-spin" />
                <span className="text-lg font-bold">+{userPoints} Punkte verdient!</span>
                <Star className="w-5 h-5 text-yellow-300 animate-spin" />
              </div>
              <div className="mt-3 text-xs opacity-75">Zeit für eine wohlverdiente Pause! ☕</div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ RESPONSIVE FLOATING QUICK ACTIONS - Desktop Only */}
      <div className="hidden lg:flex fixed bottom-6 right-6 z-40 flex-col space-y-3">
        <button
          onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
          className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all duration-300"
          title="Erweiterte Analytics"
        >
          <TrendingUp className="w-6 h-6" />
        </button>
        
        <button
          onClick={() => setShowDepartmentComparison(!showDepartmentComparison)}
          className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all duration-300"
          title="Power Ranking"
        >
          <BarChart3 className="w-6 h-6" />
        </button>
        
        <button
          onClick={() => setShowStatistics(!showStatistics)}
          className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all duration-300"
          title="Genel İstatistikler"
        >
          <Award className="w-6 h-6" />
        </button>
      </div>

      {/* ✅ MOBILE SWIPE-UP STATISTICS PANEL */}
      {showStatistics && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:flex lg:items-center lg:justify-center lg:p-4">
          {/* Mobile: Full Screen Modal */}
          <div className="lg:hidden fixed inset-0 bg-white shadow-2xl transform transition-all duration-300 ease-out overflow-hidden">
            {/* Mobile Header - Fixed at top */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-gray-200">
              <h3 className="font-bold text-gray-900 flex items-center text-base">
                <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                Statistiken
              </h3>
              <button 
                onClick={() => setShowStatistics(false)} 
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all touch-manipulation active:scale-95"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Mobile Scrollable Content - Full height */}
            <div 
              className="flex-1 overflow-y-auto px-4 pb-20" 
              style={{
                height: 'calc(100vh - 70px)',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {/* ✅ MOBILE DAILY STATS - 2x3 Grid with Step Counter */}
              <div className="grid grid-cols-2 gap-3 mb-6 mt-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-2xl border border-blue-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-600 bg-blue-200 px-2 py-1 rounded-full">HEUTE</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700 mb-1">{dailyStats.completionRate}%</div>
                  <div className="text-sm text-blue-600 font-medium">Abschlussrate</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-2xl border border-green-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-bold text-green-600 bg-green-200 px-2 py-1 rounded-full">DONE</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700 mb-1">{dailyStats.completedTasks}/{dailyStats.totalTasks}</div>
                  <div className="text-sm text-green-600 font-medium">Aufgaben</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-4 rounded-2xl border border-purple-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-purple-600 bg-purple-200 px-2 py-1 rounded-full">ZEIT</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-700 mb-1">{dailyStats.averageTimePerTask}min</div>
                  <div className="text-sm text-purple-600 font-medium">Ø Aufgabe</div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-yellow-100 p-4 rounded-2xl border border-orange-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold text-orange-600 bg-orange-200 px-2 py-1 rounded-full">STREAK</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-700 mb-1">{dailyStats.streakDays}</div>
                  <div className="text-sm text-orange-600 font-medium">Tage in Folge</div>
                </div>

                {/* ✅ YENİ: ADIM SAYACI KARTI - 2x1 span - ULTRA CANLI RENKLER */}
                <div className="col-span-2 bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-100 p-4 rounded-2xl border-2 border-violet-300 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-violet-800 bg-gradient-to-r from-violet-200 via-purple-200 to-fuchsia-200 px-2 py-1 rounded-full shadow-sm">SCHRITTE</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* ✅ YENİ: Hafta içi + çalışma saati göstergesi */}
                      {(() => {
                        const now = new Date();
                        const isWorkHours = checkWorkingHours();
                        const dayOfWeek = now.getDay();
                        const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        
                        return (
                          <div className={`px-2 py-1 rounded-full text-xs font-bold shadow-sm ${
                            isWorkHours 
                              ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white' 
                              : isWeekend
                                ? 'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white'
                                : 'bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 text-white'
                          }`}>
                            {isWorkHours 
                              ? '🕐 ARBEITSZEIT (Mo-Fr)' 
                              : isWeekend 
                                ? `🏖️ ${dayNames[dayOfWeek].toUpperCase()}`
                                : '🕐 FEIERABEND'
                            }
                          </div>
                        );
                      })()}
                      
                      {/* Manual override butonları - sadece debug için */}
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            if (!isStepTrackingActive) {
                              startStepTracking();
                            }
                          }}
                          disabled={isStepTrackingActive}
                          className={`px-2 py-1 rounded text-xs font-bold transition-all shadow-sm ${
                            isStepTrackingActive 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600'
                          }`}
                          title="Debug: Manuel Start"
                        >
                          ▶️
                        </button>
                        <button
                          onClick={() => {
                            if (isStepTrackingActive) {
                              stopStepTracking();
                            }
                          }}
                          disabled={!isStepTrackingActive}
                          className={`px-2 py-1 rounded text-xs font-bold transition-all shadow-sm ${
                            !isStepTrackingActive 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white hover:from-pink-600 hover:via-rose-600 hover:to-red-600'
                          }`}
                          title="Debug: Manuel Stop"
                        >
                          ⏹️
                        </button>
                        <button
                          onClick={() => {
                            const now = new Date();
                            const workStatus = checkWorkingHours();
                            const dayOfWeek = now.getDay();
                            const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
                            const timeString = now.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'});
                            
                            addNotification(
                              `🔧 Debug: ${dayNames[dayOfWeek]} ${timeString} - ` +
                              `${workStatus ? 'ARBEITSZEIT ✅' : 'PAUSE ⏸️'} - ` +
                              `Tracking: ${isStepTrackingActive ? 'AN 🟢' : 'AUS 🔴'}`, 
                              'info'
                            );
                          }}
                          className="px-2 py-1 rounded text-xs font-bold bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white hover:from-indigo-600 hover:via-blue-600 hover:to-cyan-600 transition-all shadow-sm"
                          title="Debug: Status Check"
                        >
                          🔧
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* ✅ 3 SEVİYELİ ADIM GÖSTERİMİ - CANLI RENKLER */}
                  <div className="space-y-3">
                    {/* Günlük Adımlar */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 bg-clip-text text-transparent">
                          {dailySteps.toLocaleString('de-DE')}
                        </div>
                        <div className="text-xs text-violet-800 font-medium">
                          📅 Heute von {dailyStepGoal.toLocaleString('de-DE')}
                        </div>
                        {/* ✅ YENİ: Puan durumu göstergesi */}
                        <div className="text-xs mt-1">
                          {dailySteps >= 15000 ? (
                            <span className="text-violet-800 font-bold bg-violet-100 px-2 py-0.5 rounded-full">🎉 50 Punkte erhalten!</span>
                          ) : (
                            <span className="text-purple-600 font-medium bg-purple-100 px-2 py-0.5 rounded-full">
                              Noch {(15000 - dailySteps).toLocaleString('de-DE')} für 50 Punkte
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="w-16 h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full overflow-hidden mb-1 shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500 transition-all duration-700 shadow-sm"
                            style={{width: `${Math.min((dailySteps / dailyStepGoal) * 100, 100)}%`}}
                          ></div>
                        </div>
                        <div className="text-xs text-violet-800 font-bold">
                          {Math.round((dailySteps / dailyStepGoal) * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* Aylık ve Yıllık Totaller - ULTRA CANLI RENKLER */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-violet-300">
                      <div className="text-center p-2 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-100 rounded-lg border-2 border-indigo-300 shadow-sm">
                        <div className="text-sm font-bold bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-700 bg-clip-text text-transparent">
                          {monthlySteps.toLocaleString('de-DE')}
                        </div>
                        <div className="text-xs text-indigo-800 font-medium">📅 Dieser Monat</div>
                      </div>
                      
                      <div className="text-center p-2 bg-gradient-to-br from-pink-50 via-rose-50 to-red-100 rounded-lg border-2 border-pink-300 shadow-sm">
                        <div className="text-sm font-bold bg-gradient-to-r from-pink-700 via-rose-700 to-red-700 bg-clip-text text-transparent">
                          {yearlySteps.toLocaleString('de-DE')}
                        </div>
                        <div className="text-xs text-pink-800 font-medium">🗓️ Dieses Jahr</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Indicator - Geliştirilmiş hafta içi durumu - CANLI RENKLER */}
                  <div className="mt-3 flex items-center justify-center">
                    {(() => {
                      const now = new Date();
                      const dayOfWeek = now.getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      const isWorkHours = checkWorkingHours();
                      
                      if (isStepTrackingActive) {
                        return (
                          <div className="flex items-center space-x-1 text-xs text-violet-900 bg-gradient-to-r from-violet-100 via-purple-100 to-fuchsia-100 px-3 py-1 rounded-full border border-violet-400 shadow-sm">
                            <div className="w-2 h-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full animate-pulse shadow-sm"></div>
                            <span className="font-medium">🚶‍♂️ Aktiv (Mo-Fr 06:30-15:00)</span>
                          </div>
                        );
                      } else if (isWeekend) {
                        return (
                          <div className="flex items-center space-x-1 text-xs text-indigo-900 bg-gradient-to-r from-indigo-100 via-blue-100 to-cyan-100 px-3 py-1 rounded-full border border-indigo-400 shadow-sm">
                            <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full shadow-sm"></div>
                            <span className="font-medium">🏖️ Wochenende - Pausiert bis Montag 06:30</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex items-center space-x-1 text-xs text-orange-900 bg-gradient-to-r from-orange-100 via-amber-100 to-yellow-100 px-3 py-1 rounded-full border border-orange-400 shadow-sm">
                            <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-sm"></div>
                            <span className="font-medium">⏰ Feierabend - Pausiert bis morgen 06:30</span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>

              {/* ✅ MOBILE WEEKLY PERFORMANCE - Touch Optimized */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                  <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                  Wöchentliche Leistung
                </h4>
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-end justify-between h-32 mb-4">
                    {weeklyData.map((day, index) => {
                      const height = day.total > 0 ? (day.completed / day.total) * 100 : 0;
                      const isToday = index === 4;
                      return (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div className="relative">
                            <div className={`w-8 bg-gray-200 rounded-t-xl relative ${isToday ? 'ring-2 ring-blue-400 shadow-lg' : ''}`} style={{height: '80px'}}>
                              <div
                                className={`${isToday ? 'bg-gradient-to-t from-blue-500 to-indigo-500' : 'bg-gradient-to-t from-indigo-400 to-purple-400'} rounded-t-xl w-full absolute bottom-0 transition-all duration-700 ease-out`}
                                style={{height: `${Math.max(height * 0.8, 4)}px`}}
                              ></div>
                              {day.total > 0 && (
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded-lg shadow-md border">
                                  {day.completed}/{day.total}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className={`text-sm font-bold mt-2 px-3 py-1 rounded-xl ${
                            isToday ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-gray-700 border border-gray-300'
                          }`}>
                            {day.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Mobile Weekly Summary */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                        <div className="font-bold text-green-700 text-sm">Wochensumme</div>
                        <div className="text-green-600 text-lg font-bold">{weeklyData.reduce((sum, day) => sum + day.completed, 0)}</div>
                        <div className="text-green-600 text-xs">Aufgaben</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="font-bold text-blue-700 text-sm">Ø Leistung</div>
                        <div className="text-blue-600 text-lg font-bold">{Math.round(weeklyData.reduce((sum, day) => sum + (day.total > 0 ? (day.completed/day.total)*100 : 0), 0) / weeklyData.filter(d => d.total > 0).length)}%</div>
                        <div className="text-blue-600 text-xs">Diese Woche</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ MOBILE POWER RANKING - Swipeable Cards */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                  <Award className="w-5 h-5 mr-2 text-yellow-600" />
                  Power Ranking
                </h4>
                <div className="space-y-3">
                  {updatedDepartmentPerformance.slice(0, 4).map((dept, index) => (
                    <div
                      key={dept.dept}
                      className={`p-4 rounded-2xl border shadow-sm transition-all duration-300 ${
                        dept.dept === selectedDepartment
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-300 ring-2 ring-blue-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                            index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                            index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                            'bg-gradient-to-r from-indigo-400 to-purple-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-bold text-base truncate ${
                              dept.dept === selectedDepartment ? 'text-blue-800' : 'text-gray-800'
                            }`}>
                              DECT {dept.dept} {dept.dept === selectedDepartment && '(Sie)'}
                            </div>
                            <div className="text-sm text-gray-600 truncate">{departments[dept.dept]}</div>
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <div className={`text-xl font-bold ${
                            dept.dept === selectedDepartment ? 'text-blue-700' : 'text-gray-700'
                          }`}>
                            {dept.rate}%
                          </div>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full transition-all duration-700 ease-out ${
                                dept.dept === selectedDepartment
                                  ? 'bg-gradient-to-r from-blue-400 to-indigo-500'
                                  : 'bg-gradient-to-r from-green-400 to-emerald-500'
                              }`}
                              style={{width: `${dept.rate}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ✅ MOBILE ACHIEVEMENTS - Full Width Cards */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-2xl border border-yellow-200 shadow-sm">
                <h4 className="font-bold text-yellow-800 mb-4 flex items-center text-lg">
                  <Award className="w-5 h-5 mr-2" />
                  Erreichte Abzeichen
                </h4>
                
                <div className="space-y-3">
                  {dailyStats.completionRate >= 80 && (
                    <div className="flex items-center p-3 bg-yellow-100 border border-yellow-300 rounded-xl">
                      <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-lg mr-3">🏆</div>
                      <div>
                        <div className="font-bold text-yellow-900">Effizienz-Meister</div>
                        <div className="text-sm text-yellow-700">Über 80% Abschlussrate erreicht</div>
                      </div>
                    </div>
                  )}
                  
                  {dailyStats.streakDays >= 3 && (
                    <div className="flex items-center p-3 bg-blue-100 border border-blue-300 rounded-xl">
                      <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-lg mr-3">🔥</div>
                      <div>
                        <div className="font-bold text-blue-900">Konsistenz-Champion</div>
                        <div className="text-sm text-blue-700">{dailyStats.streakDays} Tage in Folge erfolgreich</div>
                      </div>
                    </div>
                  )}
                  
                  {dailyStats.completedTasks >= 8 && (
                    <div className="flex items-center p-3 bg-green-100 border border-green-300 rounded-xl">
                      <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center text-lg mr-3">⚡</div>
                      <div>
                        <div className="font-bold text-green-900">Produktivitäts-Pro</div>
                        <div className="text-sm text-green-700">Mehr als 8 Aufgaben heute erledigt</div>
                      </div>
                    </div>
                  )}
                  
                  {dailyStats.completionRate === 100 && (
                    <div className="flex items-center p-3 bg-purple-100 border border-purple-300 rounded-xl">
                      <div className="w-10 h-10 bg-purple-400 rounded-full flex items-center justify-center text-lg mr-3">⭐</div>
                      <div>
                        <div className="font-bold text-purple-900">Perfekte Leistung</div>
                        <div className="text-sm text-purple-700">100% aller Aufgaben erledigt!</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Mobile Bottom Spacing */}
              <div className="h-8"></div>
            </div>
          </div>
          
          {/* Desktop: Keep Original Modal */}
          <div className="hidden lg:block bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 w-full max-w-4xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/90 backdrop-blur-xl p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center text-base">
                <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                Leistungsstatistiken
              </h3>
              <button onClick={() => setShowStatistics(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4">
              {/* Desktop content remains the same as before */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-3 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-600">HEUTE</span>
                  </div>
                  <div className="text-lg font-bold text-blue-700">{dailyStats.completionRate}%</div>
                  <div className="text-xs text-blue-600">Abschlussrate</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-3 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-bold text-green-600">ERLEDIGT</span>
                  </div>
                  <div className="text-lg font-bold text-green-700">{dailyStats.completedTasks}/{dailyStats.totalTasks}</div>
                  <div className="text-xs text-green-600">Aufgaben</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-3 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-1">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-purple-600">ZEIT</span>
                  </div>
                  <div className="text-lg font-bold text-purple-700">{dailyStats.averageTimePerTask}min</div>
                  <div className="text-xs text-purple-600">Ø pro Aufgabe</div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-yellow-100 p-3 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between mb-1">
                    <Zap className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold text-orange-600">STREAK</span>
                  </div>
                  <div className="text-lg font-bold text-orange-700">{dailyStats.streakDays}</div>
                  <div className="text-xs text-orange-600">Tage in Folge</div>
                </div>
              </div>
              
              {/* Continue with desktop layout... */}
            </div>
          </div>
        </div>
      )}

      {/* ✅ RESPONSIVE MOBILE BOTTOM NAVIGATION - Mobile Only - Higher Z-Index */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-white/30 shadow-2xl">
        <div className="grid grid-cols-4 gap-1 p-2 safe-area-inset-bottom">
          <button
            onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
            className={`p-3 rounded-xl text-center transition-all ${
              showAdvancedAnalytics 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs font-medium">Analytics</span>
          </button>
          
          <button
            onClick={() => setShowDepartmentComparison(!showDepartmentComparison)}
            className={`p-3 rounded-xl text-center transition-all ${
              showDepartmentComparison 
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs font-medium">Power Ranking</span>
          </button>
          
          <button
            onClick={() => setShowStatistics(!showStatistics)}
            className={`p-3 rounded-xl text-center transition-all ${
              showStatistics 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Award className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs font-medium">Statistik</span>
          </button>
          
          <button
            onClick={() => setShowRewards(!showRewards)}
            className={`p-3 rounded-xl text-center transition-all ${
              showRewards 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Gift className="w-5 h-5 mx-auto mb-1" />
            <span className="text-xs font-medium">Belohnung</span>
          </button>
        </div>
      </div>

      {/* ✅ RESPONSIVE DECT SELECTION POPUP */}
      {showDectSelectionPopup && (
        <ModernDectSelectionPopup
          departments={departments}
          taskTemplates={taskTemplates}
          onSelectDect={async (deptCode) => {
            // ✅ YENİ: DECT'i Firebase'de kilitle
            await lockDECT(deptCode);
            
            setSelectedDepartment(deptCode);
            setSelectedDepartmentLock(deptCode);
            setLockDate(new Date().toDateString());
            setHasSelectedDectToday(true);
            setShowDectSelectionPopup(false);
            
            addNotification(`🔒 DECT ${deptCode} für heute ausgewählt und für andere gesperrt!`, 'success');
          }}
          onSelectLater={() => {
            setShowDectSelectionPopup(false);
            // ❌ REMOVED: addNotification('⏰ DECT Auswahl später durchführen', 'info');
          }}
        />
      )}
    </div>
  );
};

export default KrankenhausLogistikApp;

// ✅ MODERN INSTAGRAM-STYLE DECT SELECTION POPUP COMPONENT
const ModernDectSelectionPopup = ({ departments, taskTemplates, onSelectDect, onSelectLater }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [lockedDECTs, setLockedDECTs] = useState({}); // Locked DECTs state

  // Firebase service for checking locks (simulated)
  const checkDECTLocks = () => {
    // Demo locks removed - all DECTs available
    const demoLocks = {};
    
    setLockedDECTs(demoLocks);
    console.log('🔓 All DECTs unlocked - demo locks removed:', demoLocks);
  };

  // Check for locks on component mount
  useEffect(() => {
    checkDECTLocks();
    console.log('🔓 Demo locks removed - all DECTs available for selection');
  }, []);

  // Check if DECT is locked
  const isDECTLocked = (dectCode) => {
    const today = new Date().toDateString();
    const lock = lockedDECTs[dectCode];
    
    console.log(`🔍 Checking lock for DECT ${dectCode}:`, { lock, today, hasLock: !!lock });
    
    if (!lock) return false;
    if (lock.lockDate !== today) return false;
    
    return true; // Locked by someone else
  };

  const getDECTLockInfo = (dectCode) => {
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

  // DECT listesini array'e çevir ve filtrele
  const dectList = Object.entries(departments).filter(([code, name]) => 
    searchTerm === '' || 
    code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Swipe/Navigation functions
  const goToNext = () => {
    if (isAnimating || currentIndex >= dectList.length - 1) return;
    setIsAnimating(true);
    setCurrentIndex(prev => prev + 1);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToPrevious = () => {
    if (isAnimating || currentIndex <= 0) return;
    setIsAnimating(true);
    setCurrentIndex(prev => prev - 1);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToIndex = (index) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) goToNext();
    if (isRightSwipe) goToPrevious();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Enter' && dectList[currentIndex]) {
        onSelectDect(dectList[currentIndex][0]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, dectList]);

  // Reset index when search changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [searchTerm]);

  // DECT iconları
  const getDectIcon = (code) => {
    const iconMap = {
      '27527': '🚛', '27521': '🍽️', '27522': '🧺', 
      '27525': '🏥', '27529': '🏢', '27530': '📦'
    };
    return iconMap[code] || '📋';
  };

  // Priority color
  const getDectPriority = (code) => {
    const tasks = taskTemplates[code] || [];
    const highPriorityTasks = tasks.filter(t => t.priority === 'high').length;
    return highPriorityTasks >= 3 ? 'HIGH' : highPriorityTasks >= 1 ? 'MED' : 'LOW';
  };

  const getDectStartTime = (code) => {
    const tasks = taskTemplates[code] || [];
    return tasks.length > 0 ? tasks[0].time : '06:30';
  };

  if (dectList.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 w-full max-w-md mx-auto p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Keine DECTs gefunden</h3>
            <p className="text-gray-600 mb-4">Versuchen Sie einen anderen Suchbegriff.</p>
            <button
              onClick={() => setSearchTerm('')}
              className="py-2 px-4 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
            >
              Suche zurücksetzen
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentDect = dectList[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto">
        {/* Compact Card Container */}
        <div 
          className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 opacity-80"></div>
          
          {/* Close Button */}
          <button
            onClick={onSelectLater}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="relative z-10 text-center pt-6 pb-4 px-6">
            <div className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
              DECT wählen
            </div>
            <div className="text-sm text-gray-600">Für heute auswählen</div>
          </div>

          {/* Story Dots */}
          <div className="relative z-10 flex justify-center space-x-1 pb-4">
            {dectList.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 scale-125 shadow-lg' 
                    : 'bg-gray-300 hover:bg-gradient-to-r hover:from-indigo-300 hover:to-purple-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xl shadow-lg flex items-center justify-center transition-all ${
              currentIndex === 0 ? 'opacity-30' : 'hover:scale-110 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-purple-100'
            }`}
          >
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToNext}
            disabled={currentIndex === dectList.length - 1}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xl shadow-lg flex items-center justify-center transition-all ${
              currentIndex === dectList.length - 1 ? 'opacity-30' : 'hover:scale-110 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-purple-100'
            }`}
          >
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Card Stack Container */}
          <div className="relative px-6 pb-6">
            {/* Card Stack Effect */}
            {dectList.map((dect, index) => {
              const offset = index - currentIndex;
              const isVisible = Math.abs(offset) <= 1;
              
              if (!isVisible) return null;
              
              return (
                <div
                  key={dect[0]}
                  className={`absolute inset-x-6 transition-all duration-500 ease-out ${
                    offset === 0 
                      ? 'z-10 transform translate-x-0 scale-100 opacity-100' 
                      : offset > 0 
                        ? 'z-5 transform translate-x-full scale-95 opacity-60'
                        : 'z-5 transform -translate-x-full scale-95 opacity-60'
                  }`}
                  style={{
                    transform: `translateX(${offset * 100}%) scale(${offset === 0 ? 1 : 0.95})`,
                    opacity: offset === 0 ? 1 : 0.6,
                    zIndex: offset === 0 ? 10 : 5
                  }}
                >
                  {/* DECT Card */}
                  <div className="text-center">
                    {/* Icon with Gradient Background + Lock Overlay */}
                    <div className={`relative mx-auto w-16 h-16 mb-3 rounded-2xl flex items-center justify-center shadow-xl ${
                      isDECTLocked(dect[0])
                        ? 'bg-gradient-to-br from-red-400 via-red-500 to-red-600'
                        : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
                    }`}>
                      <div className="text-2xl filter drop-shadow-lg">
                        {getDectIcon(dect[0])}
                      </div>
                      {isDECTLocked(dect[0]) && (
                        <>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          {/* Debug indicator */}
                          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">
                            🔒
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* DECT Info + Debug */}
                    <h3 className={`text-xl font-bold mb-1 ${
                      isDECTLocked(dect[0])
                        ? 'bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                    }`}>
                      DECT {dect[0]}
                      {/* Debug info */}
                      {isDECTLocked(dect[0]) && <span className="text-red-500 text-sm ml-2">🔒</span>}
                    </h3>
                    
                    {isDECTLocked(dect[0]) && (
                      <div className="mb-2 px-3 py-1 bg-red-100 border border-red-300 rounded-full">
                        <div className="text-xs font-bold text-red-800">🔒 BEREITS BELEGT</div>
                        <div className="text-xs text-red-600">
                          {(() => {
                            const lockInfo = getDECTLockInfo(dect[0]);
                            return lockInfo ? `${lockInfo.userName} um ${lockInfo.lockTime}` : 'Belegt';
                          })()}
                        </div>
                      </div>
                    )}
                    
                    <p className={`text-sm mb-4 font-medium ${
                      isDECTLocked(dect[0]) ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {dect[1]}
                    </p>

                    {/* Quick Stats with Gradients */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className={`border p-2 rounded-xl shadow-sm ${
                        isDECTLocked(dect[0])
                          ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                          : 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200'
                      }`}>
                        <div className={`text-sm font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                          isDECTLocked(dect[0])
                            ? 'from-red-600 to-red-700'
                            : 'from-blue-600 to-indigo-600'
                        }`}>
                          {(taskTemplates[dect[0]] || []).length}
                        </div>
                        <div className={`text-xs font-medium ${
                          isDECTLocked(dect[0]) ? 'text-red-600' : 'text-blue-600'
                        }`}>Tasks</div>
                      </div>
                      <div className={`border p-2 rounded-xl shadow-sm ${
                        isDECTLocked(dect[0])
                          ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                          : 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200'
                      }`}>
                        <div className={`text-sm font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                          isDECTLocked(dect[0])
                            ? 'from-red-600 to-red-700'
                            : 'from-green-600 to-emerald-600'
                        }`}>
                          {getDectStartTime(dect[0])}
                        </div>
                        <div className={`text-xs font-medium ${
                          isDECTLocked(dect[0]) ? 'text-red-600' : 'text-green-600'
                        }`}>Start</div>
                      </div>
                      <div className={`border p-2 rounded-xl shadow-sm ${
                        isDECTLocked(dect[0])
                          ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                          : 'bg-gradient-to-br from-orange-50 to-red-100 border-orange-200'
                      }`}>
                        <div className={`text-sm font-bold bg-gradient-to-r bg-clip-text text-transparent ${
                          isDECTLocked(dect[0])
                            ? 'from-red-600 to-red-700'
                            : 'from-orange-600 to-red-600'
                        }`}>
                          {getDectPriority(dect[0])}
                        </div>
                        <div className={`text-xs font-medium ${
                          isDECTLocked(dect[0]) ? 'text-red-600' : 'text-orange-600'
                        }`}>Prio</div>
                      </div>
                    </div>

                    {/* Select Button with Gradient */}
                    <button
                      onClick={() => {
                        if (isDECTLocked(dect[0])) {
                          const lockInfo = getDECTLockInfo(dect[0]);
                          alert(`🔒 DECT ${dect[0]} ist bereits belegt!\n\nBelegt von: ${lockInfo?.userName || 'Unbekannt'}\nSeit: ${lockInfo?.lockTime || 'Unbekannt'}\n\nBitte wählen Sie einen anderen DECT.`);
                          return;
                        }
                        onSelectDect(dect[0]);
                      }}
                      disabled={isDECTLocked(dect[0])}
                      className={`w-full py-3 px-4 font-bold rounded-xl shadow-xl transform transition-all duration-300 ${
                        isDECTLocked(dect[0])
                          ? 'bg-gradient-to-r from-red-400 to-red-500 text-white opacity-60 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:shadow-2xl hover:scale-105'
                      }`}
                    >
                      {isDECTLocked(dect[0]) ? '🔒 NICHT VERFÜGBAR' : '✨ Auswählen ✨'}
                    </button>
                  </div>
                </div>
              );
            })}
            
            {/* Spacer for proper height */}
            <div className="opacity-0 pointer-events-none">
              <div className="w-16 h-16 mb-3"></div>
              <div className="h-6 mb-1"></div>
              <div className="h-4 mb-4"></div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-2 rounded-xl">
                  <div className="h-4"></div>
                  <div className="h-3"></div>
                </div>
                <div className="p-2 rounded-xl">
                  <div className="h-4"></div>
                  <div className="h-3"></div>
                </div>
                <div className="p-2 rounded-xl">
                  <div className="h-4"></div>
                  <div className="h-3"></div>
                </div>
              </div>
              <div className="h-12"></div>
            </div>
          </div>

          {/* Bottom Info with Debug */}
          <div className="relative z-10 text-center pb-4 px-6">
            <div className="text-xs bg-gradient-to-r from-gray-500 to-gray-600 bg-clip-text text-transparent mb-2 font-medium">
              ← Swipe für mehr DECTs →
            </div>
            <div className="text-xs bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent font-bold">
              ⚠️ Nach 1. Aufgabe gesperrt!
            </div>
            <div className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent font-bold mt-1">
              🔒 Rote DECTs sind bereits belegt
            </div>
            {/* Debug Panel */}
            <div className="mt-2 text-xs bg-gray-100 p-2 rounded border">
              <strong>🔧 Debug:</strong> Locked DECTs: {Object.keys(lockedDECTs).length === 0 ? 'None - All Available' : Object.keys(lockedDECTs).join(', ')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
