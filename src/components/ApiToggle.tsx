import { useState, useEffect } from 'react';
import { apiConfig } from '../lib/apiConfig';
import { apiAdapter } from '../services/apiAdapter';

/**
 * Component to toggle between direct Supabase and backend API
 */
const ApiToggle: React.FC = () => {
  const [useBackendApi, setUseBackendApi] = useState(apiConfig.useBackendApi());
  const [backendUrl, setBackendUrl] = useState(apiConfig.getBackendUrl());
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Update adapter when config changes
  useEffect(() => {
    apiAdapter.setUseBackendApi(useBackendApi);
  }, [useBackendApi]);

  // Handle toggle change
  const handleToggleChange = () => {
    const newValue = apiConfig.toggleBackendApi();
    setUseBackendApi(newValue);
    setMessage(`Switched to ${newValue ? 'backend API' : 'direct Supabase'}`);
    setTimeout(() => setMessage(''), 3000);
  };

  // Handle URL save
  const handleSaveUrl = () => {
    apiConfig.updateConfig({ backendUrl });
    setIsEditing(false);
    setMessage('Backend URL updated');
    setTimeout(() => setMessage(''), 3000);
  };

  // Test connection to backend
  const testConnection = async () => {
    setStatus('testing');
    setMessage('Testing connection...');
    
    try {
      // Try to fetch stats as a simple test
      await apiAdapter.getDashboardStats();
      setStatus('success');
      setMessage('Connection successful!');
    } catch (error) {
      setStatus('error');
      setMessage('Connection failed. Check console for details.');
      console.error('API connection test failed:', error);
    }
    
    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 3000);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-medium mb-2">API Configuration</h3>
      
      <div className="flex items-center mb-3">
        <label className="inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer"
            checked={useBackendApi}
            onChange={handleToggleChange}
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-900">
            {useBackendApi ? 'Using Backend API' : 'Using Direct Supabase'}
          </span>
        </label>
      </div>
      
      <div className="mb-3">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-2">Backend URL:</span>
          {isEditing ? (
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              className="text-sm border rounded px-2 py-1 flex-grow"
            />
          ) : (
            <span className="text-sm text-gray-500 flex-grow">{backendUrl}</span>
          )}
          
          {isEditing ? (
            <button 
              onClick={handleSaveUrl}
              className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded"
            >
              Save
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
            >
              Edit
            </button>
          )}
        </div>
      </div>
      
      <div className="flex items-center">
        <button 
          onClick={testConnection}
          disabled={status === 'testing'}
          className={`text-sm px-3 py-1 rounded ${
            status === 'testing' ? 'bg-gray-300 cursor-not-allowed' : 
            status === 'success' ? 'bg-green-500 text-white' : 
            status === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
          }`}
        >
          {status === 'testing' ? 'Testing...' : 'Test Connection'}
        </button>
        
        {message && (
          <span className={`ml-3 text-sm ${
            status === 'success' ? 'text-green-600' : 
            status === 'error' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
};

export default ApiToggle;
