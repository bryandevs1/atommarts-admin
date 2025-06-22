import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import Badge from '../components/ui/badge/Badge';
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import Input from "../components/form/input/InputField";
import Select from '../components/form/Select';

interface PayoutRequest {
  request_id: number;
  vendor_id: number;
  business_name: string;
  vendor_email: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'failed';
  payment_method: string;
  notes: string;
  request_date: string;
  processed_date: string | null;
  processed_by: string | null;
  available_balance: number;
  pending_balance: number;
}

interface PayoutActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: PayoutRequest | null;
    onAction: (action: 'approve' | 'reject', notes: string, transactionReference?: string) => Promise<void>;
  }

  const PayoutActionModal: React.FC<PayoutActionModalProps> = ({ isOpen, onClose, request, onAction }) => {
    const [action, setAction] = useState<'approve' | 'reject'>('approve');
    const [notes, setNotes] = useState('');
    const [transactionReference, setTransactionReference] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsProcessing(true);
      try {
        if (action === 'approve') {
          await onAction(action, notes, transactionReference);
        } else {
          await onAction(action, notes);
        }
        onClose();
      } finally {
        setIsProcessing(false);
      }
    };
  
    useEffect(() => {
      if (!isOpen) {
        setAction('approve');
        setNotes('');
        setTransactionReference('');
      }
    }, [isOpen]);
  
    if (!request) return null;
  
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Process Payout Request #${request.request_id}`}
        className="max-w-[584px] p-5 lg:p-10"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Existing vendor info display */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Vendor</p>
                <p className="text-sm">{request.business_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Amount</p>
                <p className="text-sm">${request.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Method</p>
                <p className="text-sm">{request.payment_method?.replace('_', ' ')}</p>
                {request.payment_method === 'bank_transfer' && (
                  <p className="text-xs text-gray-500 mt-1">Bank details should be on file</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Requested</p>
                <p className="text-sm">
                  {new Date(request.request_date).toLocaleDateString()}
                </p>
              </div>
            </div>
  
            {/* Action selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    checked={action === 'approve'}
                    onChange={() => setAction('approve')}
                  />
                  <span className="ml-2">Approve</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    checked={action === 'reject'}
                    onChange={() => setAction('reject')}
                  />
                  <span className="ml-2">Reject</span>
                </label>
              </div>
            </div>
  
            {/* Transaction reference for approvals */}
            {action === 'approve' && (
              <div>
                <label htmlFor="transactionReference" className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Reference (Required)
                </label>
                <Input
                  type="text"
                  id="transactionReference"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="Enter bank transfer ID or reference"
                  required={action === 'approve'}
                />
              </div>
            )}
  
            {/* Notes field */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes {action === 'reject' && '(Required)'}
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={`Enter ${action === 'approve' ? 'optional ' : ''}notes`}
                required={action === 'reject'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
  
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isProcessing}
                disabled={action === 'approve' && !transactionReference}
              >
                {action === 'approve' ? 'Approve Payout' : 'Reject Request'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    );
  };
  

export default function AdminPayoutsDashboard() {
  const { token } = useAuth();
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'pending',
    vendor_id: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1
  });

  const fetchPayouts = async () => {
    try {
      setLoading(true);
  
      const params = new URLSearchParams();
      params.append("status", filters.status);
      if (filters.vendor_id) params.append("vendor_id", filters.vendor_id);
      params.append("page", filters.page.toString());
      params.append("limit", filters.limit.toString());
  
      const response = await axios.get(`https://nexodus.tech/api/admin/payouts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      // Log raw response for full debugging
      console.log("Full Axios response:", response);
      console.log("Raw response data:", response.data);
  
      // Check if expected structure exists
      if (response.data?.data) {
        setPayouts(response.data.data);
        setPagination({
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
        });
      } else {
        console.warn("Unexpected response structure:", response.data);
        setPayouts([]); // Reset to empty if data missing
      }
    } catch (err) {
      setError("Failed to fetch payout requests");
      console.error("Error fetching payouts:", err);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchPayouts();
  }, [token, filters]);

  const handleProcessPayout = async (requestId: number) => {
    const request = payouts.find(r => r.request_id === requestId);
    if (request) {
      setSelectedRequest(request);
      setIsActionModalOpen(true);
    }
  };

  const handleAction = async (action: 'approve' | 'reject', notes: string, transactionReference?: string) => {
    try {
      const payload: any = {
        request_id: selectedRequest?.request_id,
        action,
        notes
      };
  
      if (action === 'approve' && transactionReference) {
        payload.transaction_reference = transactionReference;
      }
  
      await axios.post(
        'https://nexodus.tech/api/admin/payouts/process',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchPayouts();
    } catch (err) {
      console.error('Error processing payout:', err);
      throw new Error('Failed to process payout');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'rejected':
        return 'error';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading payout requests...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-white/[0.03]">
      <div className="flex flex-col mb-6 space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between dark:bg-white/[0.03]">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Payout Requests</h2>
          <p className="text-sm text-gray-600 mt-1 dark:text-white/90">
            Total: {pagination.total} requests
          </p>
        </div>
        <div className="flex space-x-4">
        <Select
  value={filters.status}
  onChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
  className="min-w-[150px] dark:text-white/90"
>
  <option value="pending">Pending</option>
  <option value="processing">Processing</option>
  <option value="completed">Completed</option>
  <option value="rejected">Rejected</option>
  <option value="all">All Statuses</option>
</Select>
          <Input
            type="text"
            placeholder="Filter by Vendor ID"
            value={filters.vendor_id}
            onChange={(e) => setFilters({ ...filters, vendor_id: e.target.value, page: 1 })}
            className="min-w-[150px]"
          />
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="max-w-full px-5 overflow-x-auto sm:px-6">
          <Table>
            <TableHeader className="border-gray-100 border-y dark:text-white/90">
              <TableRow>
                <TableCell isHeader>Request ID</TableCell>
                <TableCell isHeader>Vendor</TableCell>
                <TableCell isHeader>Amount</TableCell>
                <TableCell isHeader>Method</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Request Date</TableCell>
                <TableCell isHeader>Processed By</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] dark:text-white/90">
              {payouts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="px-4 py-6 text-center text-gray-500">
                    No payout requests found
                  </TableCell>
                </TableRow>
              )}
              {payouts.map((request) => (
                <TableRow className="mb-4" key={request.request_id}>
                  <TableCell className="mb-4">#{request.request_id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{request.business_name}</div>
                    <div className="text-sm text-gray-500">{request.vendor_email}</div>
                  </TableCell>
                  <TableCell>${request.amount.toFixed(2)}</TableCell>
                  <TableCell>{request.payment_method?.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Badge
                      size="sm"
                      color={getStatusBadgeColor(request.status)}
                    >
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(request.request_date)}</TableCell>
                  <TableCell>
                    {request.processed_by || '-'}
                    {request.processed_date && (
                      <div className="text-sm text-gray-500">
                        {formatDate(request.processed_date)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {request.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleProcessPayout(request.request_id)}
                      >
                        Process
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Page {filters.page} of {pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={filters.page === pagination.totalPages}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Action Modal */}
      <PayoutActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        request={selectedRequest}
        onAction={handleAction}
      />
    </div>
  );
}