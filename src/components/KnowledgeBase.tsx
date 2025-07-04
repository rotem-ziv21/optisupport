import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpenIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  LinkIcon,
  TableCellsIcon,
  CloudArrowUpIcon,
  TagIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { KnowledgeBaseItem } from '../types';
import { knowledgeBaseService } from '../services/knowledgeBaseService';

const categoryOptions = [
  { value: 'technical', label: 'תמיכה טכנית', color: 'bg-blue-100 text-blue-800' },
  { value: 'billing', label: 'חיוב ותשלומים', color: 'bg-green-100 text-green-800' },
  { value: 'general', label: 'כללי', color: 'bg-gray-100 text-gray-800' },
  { value: 'faq', label: 'שאלות נפוצות', color: 'bg-purple-100 text-purple-800' },
  { value: 'troubleshooting', label: 'פתרון בעיות', color: 'bg-orange-100 text-orange-800' }
];

const priorityOptions = [
  { value: 'low', label: 'נמוך', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'בינוני', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'גבוה', color: 'bg-red-100 text-red-800' }
];

const sourceTypeOptions = [
  { value: 'document', label: 'מסמך', icon: DocumentTextIcon },
  { value: 'faq', label: 'שאלות ותשובות', icon: TableCellsIcon },
  { value: 'manual', label: 'מדריך', icon: BookOpenIcon },
  { value: 'url', label: 'קישור', icon: LinkIcon }
];

const UploadModal = ({ isOpen, onClose, onUpload }: {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'medium',
    source_type: 'document',
    source_url: '',
    tags: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      if (formData.source_type === 'document' && file) {
        await knowledgeBaseService.uploadDocument(file, {
          title: formData.title,
          category: formData.category,
          tags,
          priority: formData.priority as any
        });
      } else {
        await knowledgeBaseService.createKnowledgeBaseItem({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          tags,
          priority: formData.priority as any,
          source_type: formData.source_type as any,
          source_url: formData.source_url || undefined
        });
      }

      onUpload();
      onClose();
      setFormData({
        title: '',
        content: '',
        category: 'general',
        priority: 'medium',
        source_type: 'document',
        source_url: '',
        tags: ''
      });
      setFile(null);
    } catch (error) {
      console.error('Failed to upload:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75"
              onClick={onClose}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <SparklesIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">הוספת תוכן למאגר הידע</h2>
                    <p className="text-sm text-gray-500">העלה מסמכים או הוסף תוכן ידע חדש</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      סוג המקור
                    </label>
                    <select
                      value={formData.source_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, source_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {sourceTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      כותרת
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="כותרת התוכן"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      קטגוריה
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      עדיפות
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תגיות (מופרדות בפסיקים)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="תגית1, תגית2, תגית3"
                  />
                </div>

                {formData.source_type === 'url' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      קישור למקור
                    </label>
                    <input
                      type="url"
                      value={formData.source_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.source_type === 'document' ? 'העלאת קובץ' : 'תוכן'}
                  </label>
                  {formData.source_type === 'document' ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.txt,.csv"
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500">בחר קובץ</span>
                        <span className="text-gray-500"> או גרור לכאן</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-2">PDF, Word, טקסט או CSV</p>
                      {file && <p className="mt-2 text-sm text-gray-600">{file.name}</p>}
                    </div>
                  ) : (
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="הכנס את התוכן כאן..."
                      required
                    />
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <SparklesIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 mb-1">
                        עיבוד בינה מלאכותית
                      </h4>
                      <p className="text-sm text-blue-700">
                        התוכן יעבור עיבוד אוטומטי לחלוקה לקטעים, יצירת embeddings לחיפוש סמנטי,
                        וסיווג אוטומטי לשיפור הנגישות והחיפוש.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 space-x-reverse">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (formData.source_type === 'document' && !file)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'מעלה...' : 'הוסף למאגר'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

const KnowledgeBaseCard = ({ item }: { item: KnowledgeBaseItem }) => {
  const categoryOption = categoryOptions.find(opt => opt.value === item.category);
  const priorityOption = priorityOptions.find(opt => opt.value === item.priority);
  const sourceTypeOption = sourceTypeOptions.find(opt => opt.value === item.source_type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          {sourceTypeOption && (
            <div className="p-2 bg-gray-50 rounded-lg">
              <sourceTypeOption.icon className="h-5 w-5 text-gray-600" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{item.title}</h3>
            <div className="flex items-center space-x-2 space-x-reverse">
              {categoryOption && (
                <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', categoryOption.color)}>
                  {categoryOption.label}
                </span>
              )}
              {priorityOption && (
                <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', priorityOption.color)}>
                  {priorityOption.label}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(item.created_at).toLocaleDateString('he-IL')}
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{item.content}</p>

      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {item.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
            >
              <TagIcon className="h-3 w-3 ml-1" />
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{item.tags.length - 3} נוספים</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
          <span>נצפה {item.metadata?.usage_count || 0} פעמים</span>
        </div>
        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-500 text-sm flex items-center"
          >
            <LinkIcon className="h-4 w-4 ml-1" />
            קישור למקור
          </a>
        )}
      </div>
    </motion.div>
  );
};

export function KnowledgeBase() {
  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    source_type: '',
    search: ''
  });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await knowledgeBaseService.getKnowledgeBaseItems(filters);
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch knowledge base items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filters]);

  const handleUpload = () => {
    fetchItems(); // Refresh the list
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">מאגר הידע</h1>
          <p className="text-gray-500 mt-1">נהל את מסמכי התמיכה והידע הארגוני</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
        >
          <PlusIcon className="h-4 w-4 ml-2" />
          הוסף תוכן
        </motion.button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2 space-x-reverse">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">מסננים:</span>
          </div>
          
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">כל הקטגוריות</option>
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">כל העדיפויות</option>
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={filters.source_type}
            onChange={(e) => setFilters(prev => ({ ...prev, source_type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">כל סוגי המקור</option>
            {sourceTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <div className="flex-1 min-w-0">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש במאגר הידע..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-600">סך הכל פריטים</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-600">מסמכים פעילים</p>
              <p className="text-2xl font-bold text-gray-900">{items.filter(item => item.is_active).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-600">עדיפות גבוהה</p>
              <p className="text-2xl font-bold text-gray-900">{items.filter(item => item.priority === 'high').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <TagIcon className="h-8 w-8 text-purple-600" />
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-600">תגיות ייחודיות</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(items.flatMap(item => item.tags || [])).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((item) => (
            <KnowledgeBaseCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-12">
          <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">מאגר הידע ריק</h3>
          <p className="text-gray-500 mb-4">התחל בהוספת מסמכים ותוכן למאגר הידע</p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 ml-2" />
            הוסף תוכן ראשון
          </button>
        </div>
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}