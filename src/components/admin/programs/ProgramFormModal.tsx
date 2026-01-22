'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createProgram, updateProgram } from '@/actions/program-actions';
import { toast } from 'sonner';

// Define the shape of our form data
interface ProgramFormData {
  title: string;
  slug: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  fee: number;
  maxParticipants: number;
  isRegistrationOpen: boolean;
  location: string;
}

interface ProgramFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any; // Using any for simplicity as it matches Program interface but with Date objects
}

const PROGRAM_TYPES = [
  { value: 'BELT_TEST', label: 'Belt Test' },
  { value: 'COMPETITION', label: 'Competition' },
  { value: 'SEMINAR', label: 'Seminar' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'SPECIAL_TRAINING', label: 'Special Training' },
  { value: 'OTHER', label: 'Other' },
];

export default function ProgramFormModal({ isOpen, onClose, onSuccess, initialData }: ProgramFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProgramFormData>({
    title: '',
    slug: '',
    description: '',
    type: 'BELT_TEST',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    fee: 0,
    maxParticipants: 0,
    isRegistrationOpen: true,
    location: '',
  });

  useEffect(() => {
    if (initialData) {
      // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
      const formatDate = (date: any) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().slice(0, 16);
      };

      setFormData({
        title: initialData.title || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        type: initialData.type || 'BELT_TEST',
        startDate: formatDate(initialData.startDate),
        endDate: formatDate(initialData.endDate),
        registrationDeadline: formatDate(initialData.registrationDeadline),
        fee: initialData.fee || 0,
        maxParticipants: initialData.maxParticipants || 0,
        isRegistrationOpen: initialData.isRegistrationOpen ?? true,
        location: initialData.location || '',
      });
    }
  }, [initialData]);

  // Auto-generate slug from title if creating new
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (!initialData) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, title, slug }));
    } else {
      setFormData(prev => ({ ...prev, title }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        registrationDeadline: formData.registrationDeadline ? new Date(formData.registrationDeadline) : null,
        // Ensure numbers
        fee: Number(formData.fee),
        maxParticipants: Number(formData.maxParticipants) || null,
      };

      let result;
      if (initialData) {
        result = await updateProgram(initialData.id, payload);
      } else {
        result = await createProgram(payload);
      }

      if (result.success) {
        toast.success(initialData ? 'Program updated' : 'Program created');
        onSuccess();
      } else {
        toast.error(result.error || 'Operation failed');
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {initialData ? 'Edit Program' : 'Create New Program'}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleTitleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  >
                    {PROGRAM_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Slug</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-gray-50"
                  />
                </div>

                <div className="col-span-2">
                   <label className="block text-sm font-medium text-gray-700">Description</label>
                   <textarea
                     rows={3}
                     value={formData.description}
                     onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                   />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  />
                </div>
                
                 <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Registration Deadline</label>
                  <input
                    type="datetime-local"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, registrationDeadline: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  />
                </div>

                 <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Fee (BDT)</label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">৳</span>
                    </div>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, fee: parseFloat(e.target.value) }))}
                      className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    />
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700">Max Participants</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for unlimited"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Set to 0 for no limit</p>
                </div>
                
                 <div className="col-span-full border-t pt-4">
                  <div className="flex items-center">
                    <input
                      id="isRegistrationOpen"
                      type="checkbox"
                      checked={formData.isRegistrationOpen}
                      onChange={(e) => setFormData(prev => ({ ...prev, isRegistrationOpen: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isRegistrationOpen" className="ml-2 block text-sm text-gray-900">
                      Open for Registration
                    </label>
                  </div>
                   <p className="text-xs text-gray-500 mt-1 ml-6">
                    If unchecked, users will not see the &quot;Register&quot; button.
                   </p>
                </div>

              </div>

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (initialData ? 'Update Program' : 'Create Program')}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
