'use client';

import { useState, useEffect } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import CourseFormModal from './CourseFormModal';

interface Course {
  id: string;
  name: string;
  nameBangla?: string;
  description?: string;
  descriptionBangla?: string;
  duration: number;
  sessionsPerWeek: number;
  sessionDurationMinutes: number;
  admissionFee: number;
  monthlyFee: number;
  currency: string;
  maxStudents: number;
  currentStudents: number;
  minimumBelt?: string;
  targetBelt?: string;
  isActive: boolean;
  isEnrollmentOpen: boolean;
  bkashNumber?: string;
  bkashQrCodeUrl?: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  features?: string[];
  schedules: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location: string;
  }>;
  instructors: Array<{
    instructorId: string;
    isPrimary: boolean;
  }>;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const BELT_COLORS: Record<string, string> = {
  white: 'bg-white border border-gray-300',
  yellow: 'bg-yellow-400',
  orange: 'bg-orange-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  brown: 'bg-amber-700',
  black: 'bg-black',
};

export default function CoursesManagement() {
  const { hasPermission, loading: rbacLoading } = useRBAC();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);

  const canCreate = hasPermission('COURSE', 'CREATE');
  const canUpdate = hasPermission('COURSE', 'UPDATE');
  const canDelete = hasPermission('COURSE', 'DELETE');

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      toast.error('Failed to load courses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!rbacLoading) {
      fetchCourses();
    }
  }, [rbacLoading]);

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete course');

      const result = await response.json();
      toast.success(result.softDeleted ? 'Course deactivated' : 'Course deleted');
      fetchCourses();
    } catch (error) {
      toast.error('Failed to delete course');
      console.error(error);
    }
  };

  const toggleEnrollment = async (courseId: string, isOpen: boolean) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnrollmentOpen: !isOpen }),
      });

      if (!response.ok) throw new Error('Failed to update course');

      toast.success(isOpen ? 'Enrollment closed' : 'Enrollment opened');
      fetchCourses();
    } catch (error) {
      toast.error('Failed to update enrollment status');
      console.error(error);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100); // Convert from cents
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
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage karate courses
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setEditingCourse(null);
              setShowForm(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Course
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Total Courses</p>
          <p className="text-2xl font-semibold">{courses.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Active Courses</p>
          <p className="text-2xl font-semibold text-green-600">
            {courses.filter(c => c.isActive).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Open for Enrollment</p>
          <p className="text-2xl font-semibold text-blue-600">
            {courses.filter(c => c.isEnrollmentOpen).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-2xl font-semibold text-purple-600">
            {courses.reduce((sum, c) => sum + (c.currentStudents || 0), 0)}
          </p>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
              !course.isActive ? 'opacity-60' : ''
            }`}
          >
            {/* Course Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {course.name}
                  </h3>
                  {course.nameBangla && (
                    <p className="text-sm text-gray-500">{course.nameBangla}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {course.isActive ? (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Course Body */}
            <div className="p-4 space-y-3">
              {/* Belt Range */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Belt Level:</span>
                <div className="flex items-center gap-1">
                  <span className={`w-4 h-4 rounded ${BELT_COLORS[course.minimumBelt || 'white']}`}></span>
                  {course.targetBelt && (
                    <>
                      <span className="text-gray-400">→</span>
                      <span className={`w-4 h-4 rounded ${BELT_COLORS[course.targetBelt]}`}></span>
                    </>
                  )}
                </div>
              </div>

              {/* Duration & Sessions */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                  <span>{course.duration} months</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{course.sessionsPerWeek}x/week</span>
                </div>
              </div>

              {/* Schedule */}
              {course.schedules?.length > 0 && (
                <div className="text-sm text-gray-500">
                  {course.schedules.map((s, i) => (
                    <div key={i}>
                      {DAYS_OF_WEEK[s.dayOfWeek]}: {s.startTime} - {s.endTime}
                    </div>
                  ))}
                </div>
              )}

              {/* Capacity */}
              <div className="flex items-center gap-2 text-sm">
                <UserGroupIcon className="h-4 w-4 text-gray-400" />
                <span>
                  {course.currentStudents || 0} / {course.maxStudents} students
                </span>
                {course.currentStudents >= course.maxStudents && (
                  <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                    Full
                  </span>
                )}
              </div>

              {/* Pricing */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                  <span>Admission: {formatCurrency(course.admissionFee, course.currency)}</span>
                </div>
                <div>
                  Monthly: {formatCurrency(course.monthlyFee, course.currency)}
                </div>
              </div>

              {/* Enrollment Status */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-gray-500">Enrollment:</span>
                <button
                  onClick={() => toggleEnrollment(course.id, course.isEnrollmentOpen)}
                  disabled={!canUpdate}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                    course.isEnrollmentOpen
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {course.isEnrollmentOpen ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4" />
                      Open
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-4 w-4" />
                      Closed
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Course Actions */}
            <div className="px-4 py-3 bg-gray-50 border-t flex justify-end gap-2">
              <button
                onClick={() => setViewingCourse(course)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                title="View Details"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              {canUpdate && (
                <button
                  onClick={() => {
                    setEditingCourse(course);
                    setShowForm(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => handleDelete(course.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {courses.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border">
            <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new course.
            </p>
            {canCreate && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Course
              </button>
            )}
          </div>
        )}
      </div>

      {/* Course Form Modal */}
      {showForm && (
        <CourseFormModal
          course={editingCourse}
          onClose={() => {
            setShowForm(false);
            setEditingCourse(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingCourse(null);
            fetchCourses();
          }}
        />
      )}

      {/* View Course Modal */}
      {viewingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{viewingCourse.name}</h2>
                  {viewingCourse.nameBangla && (
                    <p className="text-gray-500">{viewingCourse.nameBangla}</p>
                  )}
                </div>
                <button
                  onClick={() => setViewingCourse(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {viewingCourse.description && (
                  <div>
                    <h4 className="font-medium text-gray-700">Description</h4>
                    <p className="text-gray-600">{viewingCourse.description}</p>
                  </div>
                )}

                {viewingCourse.features && viewingCourse.features.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700">Features</h4>
                    <ul className="list-disc list-inside text-gray-600">
                      {viewingCourse.features.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {viewingCourse.bkashNumber && (
                  <div>
                    <h4 className="font-medium text-gray-700">Payment Details</h4>
                    <p className="text-gray-600">bKash Number: {viewingCourse.bkashNumber}</p>
                    {viewingCourse.bkashQrCodeUrl && (
                      <img
                        src={viewingCourse.bkashQrCodeUrl}
                        alt="bKash QR Code"
                        className="mt-2 w-32 h-32 object-contain"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
