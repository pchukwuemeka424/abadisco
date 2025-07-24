import React from 'react';

interface ErrorAlertProps {
  message: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => (
  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
    <p className="text-sm text-red-600">{message}</p>
  </div>
);

export default ErrorAlert; 