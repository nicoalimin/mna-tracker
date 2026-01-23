'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

const Index = () => {
  useEffect(() => {
    // Redirect to dashboard
    window.location.href = '/dashboard';
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">M&A Tracker</h1>
        <p className="text-xl text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    </div>
  );
};

export default Index;
