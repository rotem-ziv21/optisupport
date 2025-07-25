import React, { useState, useEffect } from 'react';
import { TagIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ticketService } from '../services/ticketService';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  placeholder = "חפש או בחר תגיות...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // שליפת תגיות מהדאטה בייס
  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const tags = await ticketService.getAllTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  // סינון תגיות לפי חיפוש
  const filteredTags = availableTags.filter((tag: string) =>
    tag.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTags.includes(tag)
  );

  // הוספת תגית
  const addTag = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      onTagsChange([...selectedTags, tagName]);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  // הסרת תגית
  const removeTag = (tagName: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagName));
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <TagIcon className="h-5 w-5 text-gray-400" />
        
        {/* תגיות נבחרות */}
        {selectedTags.map((tagName) => (
          <span
            key={tagName}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white bg-blue-500"
          >
            {tagName}
            <button
              onClick={() => removeTag(tagName)}
              className="hover:bg-black/20 rounded-full p-0.5 transition-colors"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </span>
        ))}

        {/* כפתור הוספת תגית */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <PlusIcon className="h-3 w-3" />
            הוסף תגית
          </button>

          {/* רשימת תגיות זמינות */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-2">
                <input
                  type="text"
                  placeholder={placeholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              
              <div className="max-h-48 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    טוען תגיות...
                  </div>
                ) : filteredTags.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {filteredTags.map((tag: string) => (
                      <button
                        key={tag}
                        onClick={() => addTag(tag)}
                        className="w-full text-right px-3 py-2 text-sm rounded-md hover:bg-gray-50 flex items-center justify-end"
                      >
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    {searchTerm ? 'לא נמצאו תגיות' : availableTags.length === 0 ? 'אין תגיות במערכת' : 'כל התגיות כבר נבחרו'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* רקע שקוף לסגירת התפריט */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default TagSelector;
