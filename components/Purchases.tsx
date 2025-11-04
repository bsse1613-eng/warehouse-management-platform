import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Purchase } from '../types';
import Modal from './Modal';
import { PlusIcon, PrinterIcon } from './icons';

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


const Purchases: React.FC = () => {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<Purchase | null>(null);
    const [newPurchase, setNewPurchase] = useState<Partial<Purchase>>({
        purchase_date: new Date().toISOString().slice(0, 10),
    });
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchPurchases = useCallback(async () => {
        setLoading(true);
        let query = supabase
            .from('purchases')
            .select('*');

        if (debouncedSearchTerm) {
            query = query.ilike('item_name', `%${debouncedSearchTerm}%`);
        }
        
        const { data, error } = await query.order('purchase_date', { ascending: false });

        if (error) {
            console.error('Error fetching purchases:', error);
        } else {
            setPurchases(data as Purchase[]);
        }
        setLoading(false);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        fetchPurchases();
    }, [fetchPurchases]);

    const handleAddPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data, error } = await supabase
            .from('purchases')
            .insert(newPurchase)
            .select()
            .single();

        if (error) {
            alert('Error adding purchase: ' + error.message);
        } else {
            setReceiptData(data as Purchase);
            setIsReceiptModalOpen(true);
            setIsModalOpen(false);
            setNewPurchase({ purchase_date: new Date().toISOString().slice(0, 10) });
            fetchPurchases();
        }
    };
    
    const formatCurrency = (amount: number | undefined) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(amount || 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-white">Extra Purchases</h1>
                 <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition no-print"
                >
                    <PlusIcon className="h-5 w-5" /> New Purchase
                </button>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
                <input
                    type="search"
                    placeholder="Search by item name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3 p-2 bg-gray-700 rounded-md placeholder-gray-400"
                />
            </div>

             {loading ? <p>Loading purchases...</p> : (
                 <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700/50">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Item Name</th>
                                    <th className="p-4">Quantity</th>
                                    <th className="p-4">Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.map(p => (
                                    <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                                        <td className="p-4">{p.purchase_date}</td>
                                        <td className="p-4">{p.item_name}</td>
                                        <td className="p-4">{p.quantity}</td>
                                        <td className="p-4">{formatCurrency(p.cost)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
             )}

             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Purchase">
                <form onSubmit={handleAddPurchase} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Item Name</label>
                        <input type="text" required onChange={e => setNewPurchase({ ...newPurchase, item_name: e.target.value })} className="mt-1 w-full p-2 bg-gray-700 rounded" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300">Quantity</label>
                        <input type="number" required onChange={e => setNewPurchase({ ...newPurchase, quantity: Number(e.target.value) })} className="mt-1 w-full p-2 bg-gray-700 rounded" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300">Total Cost</label>
                        <input type="number" step="0.01" required onChange={e => setNewPurchase({ ...newPurchase, cost: Number(e.target.value) })} className="mt-1 w-full p-2 bg-gray-700 rounded" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300">Purchase Date</label>
                        <input type="date" required value={newPurchase.purchase_date} onChange={e => setNewPurchase({ ...newPurchase, purchase_date: e.target.value })} className="mt-1 w-full p-2 bg-gray-700 rounded" />
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">Save Purchase</button>
                    </div>
                </form>
            </Modal>

            {receiptData && (
                <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title="Purchase Receipt">
                    <div>
                        <div id="printable-area" className="bg-white text-black p-8 space-y-4">
                            <div className="text-center border-b pb-4">
                                <h2 className="text-xl font-bold">Purchase Receipt</h2>
                                <p className="text-sm">Alankar Agro</p>
                            </div>
                             <div className="flex justify-between">
                                <p><span className="font-bold">Receipt #:</span> {receiptData.id}</p>
                                <p><span className="font-bold">Date:</span> {receiptData.purchase_date}</p>
                            </div>
                             <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-2">Item</th>
                                        <th className="p-2 text-right">Quantity</th>
                                        <th className="p-2 text-right">Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="p-2">{receiptData.item_name}</td>
                                        <td className="p-2 text-right">{receiptData.quantity}</td>
                                        <td className="p-2 text-right">{formatCurrency(receiptData.cost)}</td>
                                    </tr>
                                </tbody>
                            </table>
                             <div className="text-right pt-4 border-t">
                                <p className="font-bold text-lg">Total: {formatCurrency(receiptData.cost)}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4 no-print">
                            <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition">
                                <PrinterIcon className="h-5 w-5" /> Print
                            </button>
                             <button onClick={() => setIsReceiptModalOpen(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition">
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Purchases;