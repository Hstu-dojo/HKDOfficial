'use client';

import { useState, useEffect } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { 
  PlusIcon, 
  PencilIcon, 
  CalendarDaysIcon,
  UserGroupIcon,
  CurrencyBangladeshiIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import ProgramFormModal from './ProgramFormModal';
import { getAllPrograms } from '@/actions/program-actions';
import { format } from 'date-fns';

// Create a local type matching the schema return
// Or import if available. For now defining interface based on schema.
interface Program {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: string;
  startDate: Date | null;
  endDate: Date | null;
  dateStr: string | null;
  registrationDeadline: Date | null;
  fee: number;
  maxParticipants: number | null;
  currentParticipants: number | null;
  isRegistrationOpen: boolean;
  location: string | null;
  requirements: any | null;
}

export default function ProgramsManagement() {
  const { hasPermission, loading: rbacLoading } = useRBAC();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  const canCreate = hasPermission('PROGRAM', 'CREATE');
  const canUpdate = hasPermission('PROGRAM', 'UPDATE');
  // const canDelete = hasPermission('PROGRAM', 'DELETE');

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const result = await getAllPrograms();
      if (result.success && result.data) {
        // Parse dates because server actions serialization might turn Date object to strings
        // Actually Drizzle returns Dates, but over network boundary they might be JSON strings.
        // However, Next.js Server Actions usually handle Date objects fine if recent version.
        // But safe to assume if it comes as string, we might need new Date().
        // Let's assume they are Dates or strings that format() can handle if passed to new Date()
        setPrograms(result.data as unknown as Program[]);
      } else {
        toast.error('Failed to load programs');
      }
    } catch (error) {
      toast.error('Failed to load programs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!rbacLoading) {
      fetchPrograms();
    }
  }, [rbacLoading]);

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setShowForm(true);
  };

  const handleCloseModal = (refresh: boolean) => {
    setShowForm(false);
    setEditingProgram(null);
    if (refresh) fetchPrograms();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (rbacLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Program Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage belt tests, competitions, and special events.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setEditingProgram(null);
              setShowForm(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Program
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <div key={program.id} className="bg-white rounded-lg border shadow-sm hover:shadow-md transition duration-200">
            <div className="p-5">
              <div className="flex justify-between items-start">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                  ${program.isRegistrationOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {program.isRegistrationOpen ? 'Open' : 'Closed'}
                </span>
                <span className="inline-flex items-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {program.type.replace('_', ' ')}
                </span>
              </div>

              <h3 className="mt-3 text-lg font-semibold text-gray-900 line-clamp-1">{program.title}</h3>
              
              <div className="mt-4 space-y-2">
                
                 {/* Date */}
                 <div className="flex items-center text-sm text-gray-600">
                  <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>
                    {program.startDate ? format(new Date(program.startDate), 'MMM d, yyyy') : 'TBA'}
                  </span>
                </div>

                {/* Participants */}
                <div className="flex items-center text-sm text-gray-600">
                  <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>
                    {program.currentParticipants || 0} 
                    {program.maxParticipants ? ` / ${program.maxParticipants}` : ''} Participants
                  </span>
                </div>

                {/* Fee */}
                <div className="flex items-center text-sm text-gray-600">
                  <CurrencyBangladeshiIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{formatCurrency(program.fee)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
                 {/* Link to view registrations - we will create this page next */}
                 <a 
                   href={`/admin/programs/registrations?programId=${program.id}`}
                   className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                 >
                    Registrations
                 </a>

                {canUpdate && (
                  <button
                    onClick={() => handleEdit(program)}
                    className="inline-flex items-center text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {programs.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No programs</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new program.</p>
            {canCreate && (
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  New Program
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <ProgramFormModal
          isOpen={showForm}
          onClose={() => handleCloseModal(false)}
          onSuccess={() => handleCloseModal(true)}
          initialData={editingProgram}
        />
      )}
    </div>
  );
}
