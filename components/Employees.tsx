import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile } from '../types';
import Modal from './Modal';
import { PlusIcon } from './icons';

const Employees: React.FC = () => {
    const [employees, setEmployees] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '', role: 'employee' });
    
    // State for form handling
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        // Call the secure RPC function to get users with their emails
        const { data, error } = await supabase.rpc('get_users_with_email');

        if (error) {
            console.error('Error fetching employees:', error);
            setEmployees([]);
        } else {
            // The data from RPC is already filtered by the policy within the function
            setEmployees(data as UserProfile[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setNewEmployee({ name: '', email: '', password: '', role: 'employee' });
        setFormLoading(false);
        setFormError(null);
        setFormSuccess(null);
    };

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);
        setFormSuccess(null);
        
        // Using signUp is the standard client-side method for user creation.
        // Note: This will send a confirmation email to the new user.
        const { data, error } = await supabase.auth.signUp({
            email: newEmployee.email,
            password: newEmployee.password,
            options: {
                data: {
                    name: newEmployee.name,
                }
            }
        });

        if (error) {
            setFormError(error.message);
            setFormLoading(false);
        } else if (data.user) {
             // After signup, manually set the role in the 'users' table.
             // This relies on the 'handle_new_user' function to create the profile,
             // and then we update it.
            const { error: roleError } = await supabase
                .from('users')
                .update({ role: newEmployee.role as 'employee' | 'owner', name: newEmployee.name })
                .eq('id', data.user.id);

            if(roleError) {
                 setFormError('Employee account created, but failed to set role: ' + roleError.message);
                 setFormLoading(false);
            } else {
                setFormSuccess('Employee created successfully! They must confirm their email address to log in.');
                fetchEmployees(); // Refresh the list
                setTimeout(() => {
                    handleCloseModal();
                }, 3000);
            }
        } else {
            setFormError('An unexpected error occurred. Please try again.');
            setFormLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-white">Manage Employees</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition"
                >
                    <PlusIcon className="h-5 w-5" /> New Employee
                </button>
            </div>
             {loading ? <p>Loading employees...</p> : (
                 <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700/50">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map(emp => (
                                    <tr key={emp.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                                        <td className="p-4">{emp.name}</td>
                                        <td className="p-4 text-gray-300">{emp.email}</td>
                                        <td className="p-4 capitalize">{emp.role}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
             )}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Add New Employee">
                <form onSubmit={handleAddEmployee} className="space-y-4">
                    {formError && <p className="bg-red-500/20 text-red-400 p-3 rounded-md text-center">{formError}</p>}
                    {formSuccess && <p className="bg-green-500/20 text-green-400 p-3 rounded-md text-center">{formSuccess}</p>}

                    <fieldset disabled={formLoading || !!formSuccess} className="space-y-4">
                        <input type="text" placeholder="Full Name" required value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} className="w-full p-2 bg-gray-700 rounded disabled:opacity-50" />
                        <input type="email" placeholder="Email" required value={newEmployee.email} onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} className="w-full p-2 bg-gray-700 rounded disabled:opacity-50" />
                        <input type="password" placeholder="Password (min. 6 characters)" required value={newEmployee.password} onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })} className="w-full p-2 bg-gray-700 rounded disabled:opacity-50" />
                        <select value={newEmployee.role} onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })} className="w-full p-2 bg-gray-700 rounded disabled:opacity-50">
                            <option value="employee">Employee</option>
                            <option value="owner">Owner</option>
                        </select>
                    </fieldset>

                    <div className="mt-4 flex justify-end">
                        <button type="submit" disabled={formLoading || !!formSuccess} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition disabled:bg-blue-800 disabled:cursor-not-allowed">
                            {formLoading ? 'Creating...' : 'Create Employee'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Employees;