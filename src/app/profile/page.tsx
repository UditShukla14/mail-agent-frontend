'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Shield, 
  Settings, 
  ArrowLeft,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { PiMicrosoftOutlookLogoDuotone } from 'react-icons/pi';
import { SiGmail } from 'react-icons/si';
import { getUserProfile, type UserProfile } from '@/lib/api/categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { IoMdLogOut } from 'react-icons/io';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleAddAccount = () => {
    const appUserId = localStorage.getItem('appUserId')
    if (!appUserId) {
      router.push('/')
      return
    }

    // Open the OAuth window in a popup
    const width = 600
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    // Create the OAuth URL with callback
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const callbackUrl = `${window.location.origin}/auth/callback`
    const authUrl = `${apiUrl}/auth/outlook/login?appUserId=${appUserId}&callbackUrl=${encodeURIComponent(callbackUrl)}`

    // Clear any existing popup poll timer
    if (window.addAccountPollTimer) {
      clearInterval(window.addAccountPollTimer)
    }

    // Open popup and handle messaging
    const popup = window.open(
      authUrl,
      'Add Outlook Account',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    )

    // Check if popup was blocked
    if (!popup) {
      toast.error('Please allow popups to add a new account')
      return
    }

    // Focus the popup
    popup.focus()

    // Poll for popup close
    window.addAccountPollTimer = setInterval(async () => {
      if (popup.closed) {
        clearInterval(window.addAccountPollTimer)
        delete window.addAccountPollTimer
        
        // Refresh profile data to show new account
        try {
          const data = await getUserProfile();
          setProfile(data);
          toast.success('Account added successfully!');
        } catch (error) {
          console.error('Error refreshing profile:', error);
        }
      }
    }, 500)
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProviderIcon = (provider: 'outlook' | 'gmail') => {
    return provider === 'outlook' ? (
      <PiMicrosoftOutlookLogoDuotone className="w-4 h-4" />
    ) : (
      <SiGmail className="w-4 h-4" />
    );
  };

  const getProviderColor = (provider: 'outlook' | 'gmail') => {
    return provider === 'outlook' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
              <p className="text-muted-foreground">{error || 'Something went wrong'}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <FaHome className="h-4 w-4 mr-2" />
              Dashboard
            </Button> */}
            <Button 
              variant='destructive' 
              onClick={() => {
                // Clear all local storage
                localStorage.removeItem('appUserId');
                localStorage.removeItem('accounts');
                localStorage.removeItem('linkedAccounts');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('token');

                // Clear the authentication cookie
                document.cookie = 'appUserId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

                // Show success message
                toast.success('Logged out successfully');

                // Redirect to landing page
                router.push('/');
              }}
            >
              <IoMdLogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-lg font-medium">{profile.user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <p className="text-sm font-mono bg-muted p-2 rounded">{profile.user.appUserId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                <p className="text-sm">{formatDate(profile.user.createdAt)}</p>
              </div>
              <div>
               
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Mail className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="text-2xl font-bold">{profile.accounts.total}</h3>
              <p className="text-sm text-muted-foreground">Total Accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <PiMicrosoftOutlookLogoDuotone className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="text-2xl font-bold">{profile.accounts.outlook}</h3>
              <p className="text-sm text-muted-foreground">Outlook Accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <SiGmail className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <h3 className="text-2xl font-bold">{profile.accounts.gmail}</h3>
              <p className="text-sm text-muted-foreground">Gmail Accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Linked Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Linked Email Accounts
              </div>
              <Button size="sm" onClick={handleAddAccount}>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.accounts.linkedAccounts.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No accounts linked</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your email accounts to get started with Mail Agent.
                </p>
                <Button onClick={handleAddAccount}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Account
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {profile.accounts.linkedAccounts.map((account, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getProviderColor(account.provider)}`}>
                        {getProviderIcon(account.provider)}
                      </div>
                      <div>
                        <p className="font-medium">{account.email}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {account.provider}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Connected {formatDate(account.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {/* <Button variant="ghost" size="sm" onClick={() => window.open(account.email, '_blank')}>
                        <ExternalLink className="h-4 w-4" />
                      </Button> */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Email Categories ({profile.user.categories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {profile.user.categories.map((category, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 border rounded-lg"
                  style={{ borderLeftColor: category.color, borderLeftWidth: '4px' }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 