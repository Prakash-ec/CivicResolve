import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { BrandLogo } from '../../components/brand/BrandLogo.js';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <Link to="/" className="mb-4 group">
        <BrandLogo variant="full" size="lg" className="h-12 sm:h-14 w-auto mx-auto group-hover:scale-105 transition-transform" />
      </Link>
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-4 p-3">
        <BrandLogo variant="icon" size="md" className="w-full h-full object-contain" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F2854] tracking-tight">
        Page Not Found
      </h1>
      <p className="text-civic-muted mt-2 max-w-md text-sm sm:text-base">
        The municipal portal page or complaint record you are looking for does not exist or has been relocated.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link to="/">
          <Button variant="primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <Link to="/track">
          <Button variant="outline">Track an Issue</Button>
        </Link>
      </div>
    </div>
  );
};
