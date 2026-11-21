import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from './AuthContext.js';
import { AuthLoading } from '../../components/shared/AuthLoading.js';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';

export const AdminRoute: React.FC = () => {
  const { currentUser, isAdmin, loading, reloadUserClaims } = useAuth();
  const location = useLocation();
  const [rechecking, setRechecking] = React.useState(false);

  if (loading) {
    return <AuthLoading />;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleRefreshClaims = async () => {
    setRechecking(true);
    await reloadUserClaims();
    setRechecking(false);
  };

  // If authenticated but lacks admin custom claim
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-civic-critical flex items-center justify-center mb-6 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-civic-dark tracking-tight">
          Admin Privileges Required
        </h2>
        <p className="text-sm text-civic-muted mt-2 leading-relaxed">
          The signed-in account (<span className="font-semibold text-civic-dark">{currentUser.email}</span>) does not carry an administrative custom claim (<code className="bg-surface-muted px-1.5 py-0.5 rounded text-xs text-brand-700">token.admin == true</code>).
        </p>
        <div className="mt-4 p-3 bg-brand-50 border border-brand-200 rounded-xl text-left text-xs text-brand-900 w-full space-y-1">
          <span className="font-bold block">To grant admin access via CLI:</span>
          <code className="block font-mono bg-white p-2 rounded border border-brand-200 select-all">
            npm run make-admin -- {currentUser.email}
          </code>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshClaims}
            isLoading={rechecking}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Check Claim Again
          </Button>
          <Link to="/dashboard">
            <Button variant="primary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Go to Citizen Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
