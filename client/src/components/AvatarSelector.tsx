import React from 'react';

const avatars = [
  {
    id: 'avatar1',
    url: '/avatars/boy1.png',
    alt: 'Default avatar with blue background'
  },
  {
    id: 'avatar2',
    url: '/avatars/boy2.png',
    alt: 'Professional avatar with gray background'
  },
  {
    id: 'avatar3',
    url: '/avatars/doctor.png',
    alt: 'Casual avatar with green background'
  },
  {
    id: 'avatar4',
    url: '/avatars/girl.png',
    alt: 'Creative avatar with purple background'
  },
  {
    id: 'avatar5',
    url: '/avatars/man.png',
    alt: 'Modern avatar with orange background'
  },
  {
    id: 'avatar6',
    url: '/avatars/woman.png',
    alt: 'Classic avatar with red background'
  }
];

interface AvatarSelectorProps {
  currentAvatar: string;
  onSelect: (avatarId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  currentAvatar,
  onSelect,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Choose Your Avatar
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {avatars.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => {
                onSelect(avatar.id);
                onClose();
              }}
              className={`relative rounded-lg overflow-hidden transition-transform hover:scale-105 ${
                currentAvatar === avatar.id
                  ? 'ring-4 ring-indigo-600 dark:ring-indigo-400'
                  : 'hover:ring-2 hover:ring-indigo-400'
              }`}
            >
              <img
                src={avatar.url}
                alt={avatar.alt}
                className="w-full h-auto aspect-square object-cover"
              />
              {currentAvatar === avatar.id && (
                <div className="absolute inset-0 bg-indigo-600 bg-opacity-20 flex items-center justify-center">
                  <span className="bg-white dark:bg-gray-800 rounded-full p-1">
                    <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Select an avatar that best represents you
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;
export { avatars }; 