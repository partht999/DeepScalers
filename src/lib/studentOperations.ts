import { supabase } from './supabase';

// Types
export interface Student {
  id?: string;
  phone_number: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  student_id: string;
  department?: string;
  year_of_study?: '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | 'Graduate';
  current_semester?: string;
  academic_status?: string;
  emergency_contact?: string;
  is_verified?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

// Create a new student
export const createStudent = async (studentData: Student) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .insert([studentData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating student:', error);
    return { data: null, error };
  }
};

// Get a student by ID
export const getStudentById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching student:', error);
    return { data: null, error };
  }
};

// Get a student by phone number
export const getStudentByPhone = async (phoneNumber: string) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching student:', error);
    return { data: null, error };
  }
};

// Update a student
export const updateStudent = async (id: string, updates: Partial<Student>) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating student:', error);
    return { data: null, error };
  }
};

// Delete a student
export const deleteStudent = async (id: string) => {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting student:', error);
    return { error };
  }
};

// List all students with pagination
export const listStudents = async (page = 1, pageSize = 10) => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('students')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, count, error: null };
  } catch (error) {
    console.error('Error listing students:', error);
    return { data: null, count: null, error };
  }
};

// Search students
export const searchStudents = async (query: string) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,student_id.ilike.%${query}%,phone_number.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error searching students:', error);
    return { data: null, error };
  }
};

// Update verification status
export const updateVerificationStatus = async (id: string, isVerified: boolean) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update({ is_verified: isVerified })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating verification status:', error);
    return { data: null, error };
  }
};

// Update active status
export const updateActiveStatus = async (id: string, isActive: boolean) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating active status:', error);
    return { data: null, error };
  }
};

// Update last login
export const updateLastLogin = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update({ last_login: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating last login:', error);
    return { data: null, error };
  }
}; 