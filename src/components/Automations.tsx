import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  BoltIcon,
  PlayIcon,
  PauseIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Automation } from '../types/automation';
import { automationService } from '../services/automationService';
import { toast } from 'react-hot-toast';
import AutomationModal from './AutomationModal';

export function Automations() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAutomation, setCurrentAutomation] = useState<Automation | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const data = await automationService.getAutomations();
      setAutomations(data);
    } catch (error) {
      console.error('Failed to fetch automations:', error);
      toast.error('שגיאה בטעינת האוטומציות');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const handleCreateAutomation = () => {
    setCurrentAutomation(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const handleEditAutomation = (automation: Automation) => {
    setCurrentAutomation(automation);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (automation: Automation) => {
    try {
      const updatedAutomation = await automationService.updateAutomation(
        automation.id,
        { isActive: !automation.isActive }
      );
      
      setAutomations(automations.map(a => 
        a.id === updatedAutomation.id ? updatedAutomation : a
      ));
      
      toast.success(
        updatedAutomation.isActive 
          ? `האוטומציה "${updatedAutomation.name}" הופעלה` 
          : `האוטומציה "${updatedAutomation.name}" הושבתה`
      );
    } catch (error) {
      console.error('Failed to toggle automation:', error);
      toast.error('שגיאה בעדכון האוטומציה');
    }
  };

  const handleDeleteAutomation = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק אוטומציה זו?')) {
      return;
    }
    
    try {
      await automationService.deleteAutomation(id);
      setAutomations(automations.filter(a => a.id !== id));
      toast.success('האוטומציה נמחקה בהצלחה');
    } catch (error) {
      console.error('Failed to delete automation:', error);
      toast.error('שגיאה במחיקת האוטומציה');
    }
  };

  const handleTriggerAutomation = async (id: string) => {
    try {
      const success = await automationService.triggerAutomation(id, {
        event: 'manual_trigger',
        timestamp: new Date().toISOString(),
      });
      
      if (success) {
        toast.success('האוטומציה הופעלה בהצלחה');
      } else {
        toast.error('האוטומציה לא הופעלה - תנאי ההפעלה לא התקיימו');
      }
    } catch (error) {
      console.error('Failed to trigger automation:', error);
      toast.error('שגיאה בהפעלת האוטומציה');
    }
  };

  const handleSaveAutomation = async (automationData: any) => {
    console.log('DEBUG - handleSaveAutomation called with data:', JSON.stringify(automationData));
    try {
      if (isCreating) {
        console.log('DEBUG - Creating new automation');
        // וודא שיש id לטריגר ולפעולות
        if (automationData.trigger && !automationData.trigger.id) {
          automationData.trigger.id = `trigger-${Date.now()}`;
        }
        
        if (automationData.actions) {
          automationData.actions = automationData.actions.map((action: any, index: number) => {
            if (!action.id) {
              return { ...action, id: `action-${Date.now()}-${index}` };
            }
            return action;
          });
        }
        
        const newAutomation = await automationService.createAutomation(automationData);
        console.log('DEBUG - New automation created:', JSON.stringify(newAutomation));
        setAutomations([...automations, newAutomation]);
        toast.success('האוטומציה נוצרה בהצלחה');
      } else if (currentAutomation) {
        console.log('DEBUG - Updating automation with ID:', currentAutomation.id);
        // וודא שיש id לטריגר ולפעולות
        if (automationData.trigger && !automationData.trigger.id) {
          automationData.trigger.id = currentAutomation.trigger?.id || `trigger-${Date.now()}`;
        }
        
        if (automationData.actions) {
          automationData.actions = automationData.actions.map((action: any, index: number) => {
            if (!action.id) {
              // נסה למצוא פעולה מקבילה בנתונים הקיימים
              const existingAction = currentAutomation.actions[index];
              return { ...action, id: existingAction?.id || `action-${Date.now()}-${index}` };
            }
            return action;
          });
        }
        
        const updatedAutomation = await automationService.updateAutomation(
          currentAutomation.id,
          automationData
        );
        console.log('DEBUG - Automation updated:', JSON.stringify(updatedAutomation));
        setAutomations(automations.map(a => 
          a.id === updatedAutomation.id ? updatedAutomation : a
        ));
        toast.success('האוטומציה עודכנה בהצלחה');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('DEBUG - Failed to save automation:', error);
      toast.error(`שגיאה בשמירת האוטומציה: ${error.message || 'אנא נסה שוב'}`); 
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'לא ידוע'; // "לא ידוע" בעברית
    }
    
    try {
      const date = new Date(dateString);
      
      // בדיקה שהתאריך תקין
      if (isNaN(date.getTime())) {
        return 'תאריך לא תקין';
      }
      
      return new Intl.DateTimeFormat('he-IL', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'תאריך לא תקין';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">אוטומציות</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreateAutomation}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
        >
          <PlusIcon className="h-4 w-4 ml-2" />
          אוטומציה חדשה
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {automations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <BoltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">אין אוטומציות</h3>
              <p className="text-gray-500 mb-4">צור אוטומציה חדשה כדי להתחיל לייעל את תהליכי העבודה שלך.</p>
              <button
                onClick={handleCreateAutomation}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <PlusIcon className="h-4 w-4 ml-2" />
                צור אוטומציה ראשונה
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {automations.map((automation) => (
                <motion.div
                  key={automation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-lg shadow-sm border ${
                    automation.isActive ? 'border-blue-200' : 'border-gray-200'
                  } overflow-hidden`}
                >
                  <div className={`px-4 py-3 border-b ${
                    automation.isActive ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  } flex items-center justify-between`}>
                    <div className="flex items-center">
                      <BoltIcon className={`h-5 w-5 ${
                        automation.isActive ? 'text-blue-500' : 'text-gray-400'
                      } mr-2`} />
                      <h3 className="text-sm font-medium truncate max-w-[200px]">
                        {automation.name}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleToggleActive(automation)}
                        className={`p-1 rounded-md ${
                          automation.isActive
                            ? 'text-blue-600 hover:bg-blue-100'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={automation.isActive ? 'השבת' : 'הפעל'}
                      >
                        {automation.isActive ? (
                          <PauseIcon className="h-4 w-4" />
                        ) : (
                          <PlayIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {automation.description}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mb-4">
                      <ClockIcon className="h-3 w-3 ml-1" />
                      <span>עודכן: {formatDate(automation.updatedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEditAutomation(automation)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="ערוך"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAutomation(automation.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="מחק"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleTriggerAutomation(automation.id)}
                        className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        disabled={!automation.isActive}
                      >
                        <ArrowPathIcon className="h-3 w-3 ml-1" />
                        הפעל ידנית
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <AutomationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveAutomation}
          automation={currentAutomation}
          isCreating={isCreating}
        />
      )}
    </div>
  );
}
