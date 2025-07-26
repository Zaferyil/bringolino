import { createClient } from '@supabase/supabase-js'

// Supabase configuration - safe initialization
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Safe Supabase client creation
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})

// Task interface - same as before
export interface BringolinoTask {
  id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
  department: string;
  location: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Department data interface
export interface DepartmentData {
  id?: string;
  department: string;
  date: string;
  completedTasks: string[];
  documentationChecks: Record<string, boolean>;
  apothekeChecks: Record<string, boolean>;
  userPoints: number;
  lastUpdate: number;
  deviceId: string;
  userId: string;
}

// DECT lock interface
export interface DECTLock {
  dectCode: string;
  userId: string;
  userName: string;
  lockTime: number;
  lockDate: string;
}

// Add task to Supabase
export const addBringolinoTask = async (task: Omit<BringolinoTask, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const { data, error } = await supabase
      .from('bringolino_tasks')
      .insert([{
        ...task,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (e) {
    console.error("Error adding task: ", e);
    throw e;
  }
};

// Get all tasks from Supabase
export const getBringolinoTasks = async (): Promise<BringolinoTask[]> => {
  try {
    const { data, error } = await supabase
      .from('bringolino_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      priority: item.priority,
      status: item.status,
      assignedTo: item.assigned_to,
      department: item.department,
      location: item.location,
      dueDate: item.due_date ? new Date(item.due_date) : undefined,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));
  } catch (e) {
    console.error("Error getting tasks: ", e);
    throw e;
  }
};

// Update task in Supabase
export const updateBringolinoTask = async (taskId: string, updates: Partial<BringolinoTask>) => {
  try {
    const { error } = await supabase
      .from('bringolino_tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) throw error;
  } catch (e) {
    console.error("Error updating task: ", e);
    throw e;
  }
};

// Delete task from Supabase
export const deleteBringolinoTask = async (taskId: string) => {
  try {
    const { error } = await supabase
      .from('bringolino_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  } catch (e) {
    console.error("Error deleting task: ", e);
    throw e;
  }
};

// Save department data to Supabase
export const saveDepartmentData = async (departmentData: DepartmentData) => {
  try {
    const { data, error } = await supabase
      .from('department_data')
      .upsert([{
        department: departmentData.department,
        date: departmentData.date,
        completed_tasks: departmentData.completedTasks,
        documentation_checks: departmentData.documentationChecks,
        apotheke_checks: departmentData.apothekeChecks,
        user_points: departmentData.userPoints,
        last_update: departmentData.lastUpdate,
        device_id: departmentData.deviceId,
        user_id: departmentData.userId
      }], {
        onConflict: 'department,date,user_id'
      })
      .select();

    if (error) throw error;
    return data;
  } catch (e) {
    console.error("Error saving department data: ", e);
    throw e;
  }
};

// Get department data from Supabase
export const getDepartmentData = async (department: string, date: string, userId: string): Promise<DepartmentData | null> => {
  try {
    const { data, error } = await supabase
      .from('department_data')
      .select('*')
      .eq('department', department)
      .eq('date', date)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      id: data.id,
      department: data.department,
      date: data.date,
      completedTasks: data.completed_tasks || [],
      documentationChecks: data.documentation_checks || {},
      apothekeChecks: data.apotheke_checks || {},
      userPoints: data.user_points || 0,
      lastUpdate: data.last_update || Date.now(),
      deviceId: data.device_id,
      userId: data.user_id
    };
  } catch (e) {
    console.error("Error getting department data: ", e);
    return null;
  }
};

// Get all department data for Leiter Dashboard
export const getAllDepartmentData = async (): Promise<DepartmentData[]> => {
  try {
    const { data, error } = await supabase
      .from('department_data')
      .select('*')
      .order('last_update', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      department: item.department,
      date: item.date,
      completedTasks: item.completed_tasks || [],
      documentationChecks: item.documentation_checks || {},
      apothekeChecks: item.apotheke_checks || {},
      userPoints: item.user_points || 0,
      lastUpdate: item.last_update || Date.now(),
      deviceId: item.device_id,
      userId: item.user_id
    }));
  } catch (e) {
    console.error("Error getting all department data: ", e);
    return [];
  }
};

// Real-time subscription for department data
export const subscribeToDepartmentData = (callback: (data: DepartmentData[]) => void) => {
  const subscription = supabase
    .channel('department_data_changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'department_data' 
      }, 
      async () => {
        // Fetch updated data when changes occur
        const updatedData = await getAllDepartmentData();
        callback(updatedData);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// DECT Lock Management
export const lockDECT = async (dectCode: string, userId: string, userName: string) => {
  try {
    const today = new Date().toDateString();
    const { error } = await supabase
      .from('dect_locks')
      .upsert([{
        dect_code: dectCode,
        user_id: userId,
        user_name: userName,
        lock_time: Date.now(),
        lock_date: today
      }], {
        onConflict: 'dect_code'
      });

    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error locking DECT: ", e);
    return false;
  }
};

export const unlockDECT = async (dectCode: string) => {
  try {
    const { error } = await supabase
      .from('dect_locks')
      .delete()
      .eq('dect_code', dectCode);

    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error unlocking DECT: ", e);
    return false;
  }
};

export const getDECTLocks = async (): Promise<DECTLock[]> => {
  try {
    const { data, error } = await supabase
      .from('dect_locks')
      .select('*');

    if (error) throw error;

    return data.map(item => ({
      dectCode: item.dect_code,
      userId: item.user_id,
      userName: item.user_name,
      lockTime: item.lock_time,
      lockDate: item.lock_date
    }));
  } catch (e) {
    console.error("Error getting DECT locks: ", e);
    return [];
  }
};

// Real-time subscription for DECT locks
export const subscribeToDECTLocks = (callback: (locks: DECTLock[]) => void) => {
  const subscription = supabase
    .channel('dect_locks_changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'dect_locks' 
      }, 
      async () => {
        const updatedLocks = await getDECTLocks();
        callback(updatedLocks);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Check if Supabase is connected
export const isSupabaseConnected = () => {
  return !!(supabaseUrl && supabaseKey);
};

// Legacy compatibility - keeping same interface as Firebase
export const db = supabase;
export const listenToAllTasks = (callback: (tasks: BringolinoTask[]) => void) => {
  const subscription = supabase
    .channel('tasks_changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'bringolino_tasks' 
      }, 
      async () => {
        const tasks = await getBringolinoTasks();
        callback(tasks);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};