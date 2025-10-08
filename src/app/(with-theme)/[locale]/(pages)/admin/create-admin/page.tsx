'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield, User, UserPlus, Key } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface User {
  id: string;
  userName: string;
  email: string;
  emailVerified: boolean;
  defaultRole: string;
  createdAt: string;
}

export default function AdminCreationPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Form states
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    password: '',
    userName: '',
    userAvatar: '/default-avatar.png'
  });

  const [roleAssignment, setRoleAssignment] = useState({
    userId: '',
    roleId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [rolesRes, usersRes] = await Promise.all([
        fetch('/api/rbac/roles'),
        fetch('/api/rbac/users')
      ]);

      if (rolesRes.ok && usersRes.ok) {
        const rolesData = await rolesRes.json();
        const usersData = await usersRes.json();
        setRoles(rolesData.roles || []);
        setUsers(usersData.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function createAdminUser() {
    if (!newAdmin.email || !newAdmin.password || !newAdmin.userName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/auth/supabase-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Admin user created successfully! They need to verify their email.');
        setNewAdmin({
          email: '',
          password: '',
          userName: '',
          userAvatar: '/default-avatar.png'
        });
        fetchData(); // Refresh user list
      } else {
        toast.error(result.error || 'Failed to create admin user');
      }
    } catch (error) {
      console.error('Failed to create admin user:', error);
      toast.error('Failed to create admin user');
    } finally {
      setCreating(false);
    }
  }

  async function assignRoleToUser() {
    if (!roleAssignment.userId || !roleAssignment.roleId) {
      toast.error('Please select both user and role');
      return;
    }

    setAssigning(true);
    try {
      const response = await fetch('/api/rbac/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: roleAssignment.userId,
          roleId: roleAssignment.roleId
        })
      });

      if (response.ok) {
        toast.success('Role assigned successfully!');
        setRoleAssignment({ userId: '', roleId: '' });
        fetchData(); // Refresh data
      } else {
        const result = await response.json();
        toast.error(result.error || 'Failed to assign role');
      }
    } catch (error) {
      console.error('Failed to assign role:', error);
      toast.error('Failed to assign role');
    } finally {
      setAssigning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Admin User Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Admin User */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>Create Admin User</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="userName">Username *</Label>
              <Input
                id="userName"
                value={newAdmin.userName}
                onChange={(e) => setNewAdmin({ ...newAdmin, userName: e.target.value })}
                placeholder="admin_user"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                placeholder="Strong password"
              />
            </div>

            <Button 
              onClick={createAdminUser} 
              disabled={creating}
              className="w-full"
            >
              {creating ? 'Creating...' : 'Create Admin User'}
            </Button>
          </CardContent>
        </Card>

        {/* Assign Role to User */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Assign Role to User</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select User</Label>
              <Select 
                value={roleAssignment.userId} 
                onValueChange={(value) => setRoleAssignment({ ...roleAssignment, userId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.userName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Role</Label>
              <Select 
                value={roleAssignment.roleId} 
                onValueChange={(value) => setRoleAssignment({ ...roleAssignment, roleId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={assignRoleToUser} 
              disabled={assigning}
              className="w-full"
            >
              {assigning ? 'Assigning...' : 'Assign Role'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-blue-600">{users.length}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Total Roles</h3>
              <p className="text-3xl font-bold text-green-600">{roles.length}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Admin Roles</h3>
              <p className="text-3xl font-bold text-purple-600">
                {roles.filter(role => role.name.includes('ADMIN')).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <User className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="font-medium">{user.userName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Role: {user.defaultRole}</p>
                  <p className="text-xs text-gray-400">
                    {user.emailVerified ? '✅ Verified' : '❌ Not verified'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}