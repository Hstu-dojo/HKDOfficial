'use client';

import { useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface Schedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
}

interface Course {
  id?: string;
  name: string;
  nameBangla?: string;
  description?: string;
  descriptionBangla?: string;
  duration: number;
  sessionsPerWeek: number;
  sessionDurationMinutes: number;
  minimumBelt?: string;
  targetBelt?: string;
  admissionFee: number;
  monthlyFee: number;
  currency: string;
  maxStudents: number;
  features?: string[];
  thumbnailUrl?: string;
  bannerUrl?: string;
  bkashNumber?: string;
  bkashQrCodeUrl?: string;
  isActive: boolean;
  isEnrollmentOpen: boolean;
  schedules: Schedule[];
  instructorIds?: string[];
}

interface CourseFormModalProps {
  course: Course | null;
  onClose: () => void;
  onSaved: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const BELT_RANKS = [
  { value: 'white', label: 'White Belt' },
  { value: 'yellow', label: 'Yellow Belt' },
  { value: 'orange', label: 'Orange Belt' },
  { value: 'green', label: 'Green Belt' },
  { value: 'blue', label: 'Blue Belt' },
  { value: 'red', label: 'Red Belt' },
  { value: 'brown', label: 'Brown Belt' },
  { value: 'black', label: 'Black Belt' },
];

export default function CourseFormModal({ course, onClose, onSaved }: CourseFormModalProps) {
  const [loading, setSaving] = useState(false);
  const [formData, setFormData] = useState<Course>({
    name: course?.name || '',
    nameBangla: course?.nameBangla || '',
    description: course?.description || '',
    descriptionBangla: course?.descriptionBangla || '',
    duration: course?.duration || 6,
    sessionsPerWeek: course?.sessionsPerWeek || 3,
    sessionDurationMinutes: course?.sessionDurationMinutes || 90,
    minimumBelt: course?.minimumBelt || 'white',
    targetBelt: course?.targetBelt || '',
    admissionFee: course?.admissionFee ? course.admissionFee / 100 : 0,
    monthlyFee: course?.monthlyFee ? course.monthlyFee / 100 : 1500,
    currency: course?.currency || 'BDT',
    maxStudents: course?.maxStudents || 30,
    features: course?.features || [],
    thumbnailUrl: course?.thumbnailUrl || '',
    bannerUrl: course?.bannerUrl || '',
    bkashNumber: course?.bkashNumber || '',
    bkashQrCodeUrl: course?.bkashQrCodeUrl || '',
    isActive: course?.isActive ?? true,
    isEnrollmentOpen: course?.isEnrollmentOpen ?? true,
    schedules: course?.schedules || [],
  });

  const [newFeature, setNewFeature] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Course name is required');
      return;
    }

    if (!formData.monthlyFee) {
      toast.error('Monthly fee is required');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...formData,
        admissionFee: Math.round(formData.admissionFee * 100), // Convert to cents
        monthlyFee: Math.round(formData.monthlyFee * 100), // Convert to cents
      };

      const url = course?.id
        ? `/api/admin/courses/${course.id}`
        : '/api/admin/courses';

      const response = await fetch(url, {
        method: course?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save course');
      }

      toast.success(course?.id ? 'Course updated' : 'Course created');
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const addSchedule = () => {
    setFormData({
      ...formData,
      schedules: [
        ...formData.schedules,
        { dayOfWeek: 0, startTime: '09:00', endTime: '10:30', location: 'Main Dojo' },
      ],
    });
  };

  const removeSchedule = (index: number) => {
    setFormData({
      ...formData,
      schedules: formData.schedules.filter((_, i) => i !== index),
    });
  };

  const updateSchedule = (index: number, field: keyof Schedule, value: string | number) => {
    const newSchedules = [...formData.schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setFormData({ ...formData, schedules: newSchedules });
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: (formData.features || []).filter((_, i) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">
              {course?.id ? 'Edit Course' : 'Create New Course'}
            </h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Name (English) *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Name (Bengali)
                  </label>
                  <input
                    type="text"
                    value={formData.nameBangla}
                    onChange={(e) => setFormData({ ...formData, nameBangla: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (English)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Bengali)
                </label>
                <textarea
                  value={formData.descriptionBangla}
                  onChange={(e) => setFormData({ ...formData, descriptionBangla: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Course Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Course Details</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (months) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    min={1}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sessions/Week
                  </label>
                  <input
                    type="number"
                    value={formData.sessionsPerWeek}
                    onChange={(e) => setFormData({ ...formData, sessionsPerWeek: parseInt(e.target.value) })}
                    min={1}
                    max={7}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Length (min)
                  </label>
                  <input
                    type="number"
                    value={formData.sessionDurationMinutes}
                    onChange={(e) => setFormData({ ...formData, sessionDurationMinutes: parseInt(e.target.value) })}
                    min={30}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Students
                  </label>
                  <input
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                    min={1}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Belt
                  </label>
                  <select
                    value={formData.minimumBelt}
                    onChange={(e) => setFormData({ ...formData, minimumBelt: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {BELT_RANKS.map((belt) => (
                      <option key={belt.value} value={belt.value}>
                        {belt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Belt
                  </label>
                  <select
                    value={formData.targetBelt}
                    onChange={(e) => setFormData({ ...formData, targetBelt: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select target belt</option>
                    {BELT_RANKS.map((belt) => (
                      <option key={belt.value} value={belt.value}>
                        {belt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Pricing</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admission Fee (BDT)
                  </label>
                  <input
                    type="number"
                    value={formData.admissionFee}
                    onChange={(e) => setFormData({ ...formData, admissionFee: parseFloat(e.target.value) })}
                    min={0}
                    step={100}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Fee (BDT) *
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: parseFloat(e.target.value) })}
                    min={0}
                    step={100}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Payment Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    bKash Number
                  </label>
                  <input
                    type="text"
                    value={formData.bkashNumber}
                    onChange={(e) => setFormData({ ...formData, bkashNumber: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    bKash QR Code URL
                  </label>
                  <input
                    type="url"
                    value={formData.bkashQrCodeUrl}
                    onChange={(e) => setFormData({ ...formData, bkashQrCodeUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-semibold text-gray-900">Class Schedule</h3>
                <button
                  type="button"
                  onClick={addSchedule}
                  className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Schedule
                </button>
              </div>

              {formData.schedules.map((schedule, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <select
                    value={schedule.dayOfWeek}
                    onChange={(e) => updateSchedule(index, 'dayOfWeek', parseInt(e.target.value))}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={schedule.location}
                    onChange={(e) => updateSchedule(index, 'location', e.target.value)}
                    placeholder="Location"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeSchedule(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}

              {formData.schedules.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No schedule added. Click &quot;Add Schedule&quot; to add class times.
                </p>
              )}
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Course Features</h3>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="e.g., Uniform included"
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(formData.features || []).map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Status</h3>
              
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Course is active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isEnrollmentOpen}
                    onChange={(e) => setFormData({ ...formData, isEnrollmentOpen: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Open for enrollment</span>
                </label>
              </div>
            </div>

            {/* Media */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Media</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banner URL
                  </label>
                  <input
                    type="url"
                    value={formData.bannerUrl}
                    onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : course?.id ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
