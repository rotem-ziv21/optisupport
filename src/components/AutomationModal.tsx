import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Automation, Trigger, Action, TriggerType, ActionType } from '../types/automation';
import { motion } from 'framer-motion';

export interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (automationData: any) => void;
  automation: Automation | null;
  isCreating: boolean;
}

export default function AutomationModal({
  isOpen,
  onClose,
  onSave,
  automation,
  isCreating,
}: AutomationModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [triggerType, setTriggerType] = useState<TriggerType>(TriggerType.TICKET_CREATED);
  const [triggerConditions, setTriggerConditions] = useState<Record<string, any>>({});
  const [actions, setActions] = useState<Partial<Action>[]>([]);

  // אתחול הטופס עם נתוני האוטומציה הקיימת (אם יש)
  useEffect(() => {
    if (automation) {
      setName(automation.name);
      setDescription(automation.description);
      // בדיקה שה-isActive הוא boolean ולא undefined
      setIsActive(automation.isActive === true || automation.is_active === true);
      setTriggerType(automation.trigger.type);
      setTriggerConditions(automation.trigger.conditions || {});
      setActions(automation.actions);
    } else {
      // ערכי ברירת מחדל לאוטומציה חדשה
      setName('');
      setDescription('');
      setIsActive(true);
      setTriggerType(TriggerType.TICKET_CREATED);
      setTriggerConditions({});
      setActions([{
        name: 'פעולה חדשה',
        type: ActionType.SEND_EMAIL,
        description: '',
        parameters: {},
      }]);
    }
  }, [automation]);

  const handleAddAction = () => {
    setActions([
      ...actions,
      {
        name: 'פעולה חדשה',
        type: ActionType.SEND_EMAIL,
        description: '',
        parameters: {},
      },
    ]);
  };

  const handleRemoveAction = (index: number) => {
    const newActions = [...actions];
    newActions.splice(index, 1);
    setActions(newActions);
  };

  const handleActionChange = (index: number, field: string, value: any) => {
    const newActions = [...actions];
    (newActions[index] as any)[field] = value;
    setActions(newActions);
  };

  const handleActionParameterChange = (index: number, paramName: string, value: any) => {
    const newActions = [...actions];
    if (!newActions[index].parameters) {
      newActions[index].parameters = {};
    }
    newActions[index].parameters![paramName] = value;
    setActions(newActions);
  };

  const handleTriggerConditionChange = (conditionName: string, value: any) => {
    setTriggerConditions({
      ...triggerConditions,
      [conditionName]: value,
    });
  };

  const handleSubmit = () => {
    // בניית אובייקט האוטומציה
    const automationData: Partial<Automation> = {
      name,
      description,
      isActive,
      trigger: {
        id: automation?.trigger.id || '',
        name: getTriggerName(triggerType),
        type: triggerType,
        description: getTriggerDescription(triggerType),
        conditions: triggerConditions,
      } as Trigger,
      actions: actions as Action[],
    };

    onSave(automationData);
  };

  // פונקציות עזר לקבלת שם ותיאור הטריגר
  const getTriggerName = (type: TriggerType): string => {
    switch (type) {
      case TriggerType.TICKET_CREATED:
        return 'כרטיס חדש נוצר';
      case TriggerType.TICKET_UPDATED:
        return 'כרטיס עודכן';
      case TriggerType.TICKET_RESOLVED:
        return 'כרטיס נפתר';
      case TriggerType.STATUS_CHANGED:
        return 'סטטוס כרטיס השתנה';
      case TriggerType.MESSAGE_RECEIVED:
        return 'התקבלה הודעה חדשה';
      default:
        return 'טריגר';
    }
  };

  const getTriggerDescription = (type: TriggerType): string => {
    switch (type) {
      case TriggerType.TICKET_CREATED:
        return 'האוטומציה תופעל כאשר נוצר כרטיס חדש';
      case TriggerType.TICKET_UPDATED:
        return 'האוטומציה תופעל כאשר כרטיס מתעדכן';
      case TriggerType.TICKET_RESOLVED:
        return 'האוטומציה תופעל כאשר כרטיס נפתר (סטטוס resolved)';
      case TriggerType.STATUS_CHANGED:
        return 'האוטומציה תופעל כאשר סטטוס הכרטיס משתנה';
      case TriggerType.MESSAGE_RECEIVED:
        return 'האוטומציה תופעל כאשר מתקבלת הודעה חדשה בכרטיס';
      default:
        return '';
    }
  };

  // רינדור שדות תנאי הטריגר בהתאם לסוג הטריגר
  const renderTriggerConditionFields = () => {
    switch (triggerType) {
      case TriggerType.STATUS_CHANGED:
        return (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סטטוס חדש
            </label>
            <select
              value={triggerConditions.status || ''}
              onChange={(e) => handleTriggerConditionChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">כל סטטוס</option>
              <option value="open">פתוח</option>
              <option value="in_progress">בטיפול</option>
              <option value="resolved">נפתר</option>
              <option value="closed">סגור</option>
            </select>
          </div>
        );
      
      case TriggerType.TICKET_CREATED:
        return (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              קטגוריה
            </label>
            <select
              value={triggerConditions.category || ''}
              onChange={(e) => handleTriggerConditionChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">כל הקטגוריות</option>
              <option value="technical">טכני</option>
              <option value="billing">חיוב</option>
              <option value="general">כללי</option>
              <option value="feature_request">בקשת תכונה</option>
            </select>
          </div>
        );
      
      default:
        return null;
    }
  };

  // רינדור שדות פרמטרים של פעולה בהתאם לסוג הפעולה
  const renderActionParameterFields = (action: Partial<Action>, index: number) => {
    switch (action.type) {
      case ActionType.SEND_EMAIL:
        return (
          <>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                כתובת אימייל
              </label>
              <input
                type="email"
                value={action.parameters?.to || ''}
                onChange={(e) => handleActionParameterChange(index, 'to', e.target.value)}
                placeholder="example@example.com או {{customer.email}}"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                נושא
              </label>
              <input
                type="text"
                value={action.parameters?.subject || ''}
                onChange={(e) => handleActionParameterChange(index, 'subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                תבנית
              </label>
              <select
                value={action.parameters?.template || ''}
                onChange={(e) => handleActionParameterChange(index, 'template', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">בחר תבנית</option>
                <option value="ticket_created">כרטיס חדש</option>
                <option value="ticket_updated">עדכון כרטיס</option>
                <option value="ticket_resolved">כרטיס נפתר</option>
                <option value="ticket_closed">כרטיס נסגר</option>
              </select>
            </div>
          </>
        );
      
      case ActionType.UPDATE_TICKET:
        return (
          <>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                סטטוס חדש
              </label>
              <select
                value={action.parameters?.status || ''}
                onChange={(e) => handleActionParameterChange(index, 'status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ללא שינוי</option>
                <option value="open">פתוח</option>
                <option value="in_progress">בטיפול</option>
                <option value="resolved">נפתר</option>
                <option value="closed">סגור</option>
              </select>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                עדיפות חדשה
              </label>
              <select
                value={action.parameters?.priority || ''}
                onChange={(e) => handleActionParameterChange(index, 'priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">ללא שינוי</option>
                <option value="low">נמוכה</option>
                <option value="medium">בינונית</option>
                <option value="high">גבוהה</option>
                <option value="urgent">דחופה</option>
              </select>
            </div>
            <div className="mt-4 flex items-center">
              <input
                type="checkbox"
                id={`addComment-${index}`}
                checked={action.parameters?.addComment || false}
                onChange={(e) => handleActionParameterChange(index, 'addComment', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ml-2"
              />
              <label htmlFor={`addComment-${index}`} className="text-sm font-medium text-gray-700">
                הוסף הערה לכרטיס
              </label>
            </div>
            {action.parameters?.addComment && (
              <div className="mt-2">
                <textarea
                  value={action.parameters?.comment || ''}
                  onChange={(e) => handleActionParameterChange(index, 'comment', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="הערה לכרטיס"
                />
              </div>
            )}
          </>
        );
      
      case ActionType.WEBHOOK:
        return (
          <>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                כתובת Webhook
              </label>
              <input
                type="url"
                value={action.webhook || ''}
                onChange={(e) => handleActionChange(index, 'webhook', e.target.value)}
                placeholder="https://example.com/webhook"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                נתונים לשליחה (JSON)
              </label>
              <textarea
                value={JSON.stringify(action.parameters || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsedJson = JSON.parse(e.target.value);
                    handleActionParameterChange(index, 'data', parsedJson);
                  } catch (error) {
                    // אם ה-JSON לא תקין, לא לעדכן
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                rows={5}
                placeholder='{"key": "value"}'
              />
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-auto z-10 relative"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              {isCreating ? 'יצירת אוטומציה חדשה' : 'עריכת אוטומציה'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם האוטומציה
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="שם האוטומציה"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תיאור
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="תיאור האוטומציה"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ml-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  אוטומציה פעילה
                </label>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-4">טריגר</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    סוג טריגר
                  </label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value as TriggerType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={TriggerType.TICKET_CREATED}>כרטיס חדש נוצר</option>
                    <option value={TriggerType.TICKET_UPDATED}>כרטיס עודכן</option>
                    <option value={TriggerType.TICKET_RESOLVED}>כרטיס נפתר</option>
                    <option value={TriggerType.STATUS_CHANGED}>סטטוס כרטיס השתנה</option>
                    <option value={TriggerType.MESSAGE_RECEIVED}>התקבלה הודעה חדשה</option>
                  </select>
                </div>

                {renderTriggerConditionFields()}
              </div>

              <div className="border-t pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-4">פעולות</h3>
                
                {actions.map((action, index) => (
                  <div 
                    key={index} 
                    className={`mb-6 p-4 border rounded-md ${
                      index > 0 ? 'mt-4' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">פעולה {index + 1}</h4>
                      {actions.length > 1 && (
                        <button
                          onClick={() => handleRemoveAction(index)}
                          className="text-red-600 hover:text-red-800"
                          title="הסר פעולה"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        שם הפעולה
                      </label>
                      <input
                        type="text"
                        value={action.name || ''}
                        onChange={(e) => handleActionChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="שם הפעולה"
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        סוג פעולה
                      </label>
                      <select
                        value={action.type}
                        onChange={(e) => handleActionChange(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={ActionType.SEND_EMAIL}>שליחת אימייל</option>
                        <option value={ActionType.UPDATE_TICKET}>עדכון כרטיס</option>
                        <option value={ActionType.WEBHOOK}>קריאה ל-Webhook</option>
                        <option value={ActionType.SEND_NOTIFICATION}>שליחת התראה</option>
                      </select>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        תיאור
                      </label>
                      <input
                        type="text"
                        value={action.description || ''}
                        onChange={(e) => handleActionChange(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="תיאור הפעולה"
                      />
                    </div>

                    {renderActionParameterFields(action, index)}
                  </div>
                ))}

                <button
                  onClick={handleAddAction}
                  className="mt-2 inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 ml-1" />
                  הוסף פעולה
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md ml-2"
            >
              ביטול
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={!name}
            >
              {isCreating ? 'צור אוטומציה' : 'שמור שינויים'}
            </button>
          </div>
        </motion.div>
      </div>
    </Dialog>
  );
}
