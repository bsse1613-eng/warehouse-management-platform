import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Delivery } from '../types';
import { PrinterIcon } from './icons';

type ReportType = 'daily' | 'monthly';

const ReportTable: React.FC<{ deliveries: Delivery[] }> = ({ deliveries }) => {
    const formatCurrency = (amount: number | undefined) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

    return (
        <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-4">Delivery ID</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Driver</th>
                            <th className="p-4">Sacks</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deliveries.map(d => (
                            <tr key={d.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                                <td className="p-4">{d.id}</td>
                                <td className="p-4">{d.delivery_date}</td>
                                <td className="p-4">{d.trucks?.driver_name}</td>
                                <td className="p-4">{d.sacks_delivered}</td>
                                <td className="p-4">{formatCurrency(d.total_amount)}</td>
                                <td className="p-4">
                                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        d.status === 'paid' ? 'bg-green-500/20 text-green-400' : 
                                        d.status === 'due' ? 'bg-red-500/20 text-red-400' : 
                                        'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                        {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const Reports: React.FC = () => {
    const [reportType, setReportType] = useState<ReportType>('daily');
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(false);
    
    const fetchReportData = useCallback(async () => {
        setLoading(true);
        let query = supabase.from('deliveries').select('*, trucks(*)');

        if (reportType === 'daily') {
            const today = new Date().toISOString().slice(0, 10);
            query = query.eq('delivery_date', today);
        } else { // monthly
            const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
            const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);
            query = query.gte('delivery_date', firstDayOfMonth).lte('delivery_date', lastDayOfMonth);
        }
        
        const { data, error } = await query.order('delivery_date', { ascending: false });

        if (error) {
            console.error(`Error fetching ${reportType} report:`, error);
        } else {
            setDeliveries(data as Delivery[]);
        }
        setLoading(false);
    }, [reportType]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
                <h1 className="text-4xl font-bold text-white">Reports</h1>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition"
                >
                    <PrinterIcon className="h-5 w-5" /> Print Report
                </button>
            </div>
            
            <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg w-min no-print">
                <button 
                    onClick={() => setReportType('daily')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition ${reportType === 'daily' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                    Daily
                </button>
                <button 
                    onClick={() => setReportType('monthly')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition ${reportType === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                    Monthly
                </button>
            </div>
            
            {loading ? <p className="no-print">Loading report...</p> : (
                <div id="printable-area">
                    <div className="print-header mb-4">
                        <h1 className="text-2xl font-bold">{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h1>
                        <p className="text-sm">Generated on: {new Date().toLocaleDateString()}</p>
                    </div>
                    <ReportTable deliveries={deliveries} />
                </div>
            )}
        </div>
    );
};

export default Reports;