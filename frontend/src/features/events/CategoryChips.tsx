/** Category chip filter bar — horizontal scrolling category selector. */

import { useCategories } from './hooks';

// Map category icon names to simple emoji fallbacks (Lucide icons loaded lazily)
const ICON_MAP: Record<string, string> = {
    music: '🎵',
    utensils: '🍽️',
    moon: '🌙',
    dumbbell: '💪',
    palette: '🎨',
    cpu: '💻',
    'book-open': '📖',
    mountain: '⛰️',
    laugh: '😂',
    users: '👥',
    'party-popper': '🎉',
    'heart-handshake': '🤝',
};

interface CategoryChipsProps {
    selected: string | undefined;
    onSelect: (slug: string | undefined) => void;
}

export function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
    const { data: response } = useCategories();
    const categories = response?.data || [];

    return (
        <div className="flex gap-2 overflow-x-auto py-3 px-1 scrollbar-hide -mx-1">
            {/* "All" chip */}
            <button
                onClick={() => onSelect(undefined)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all
          ${!selected
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }
        `}
            >
                ✨ All
            </button>
            {categories.map((cat) => (
                <button
                    key={cat.slug}
                    onClick={() => onSelect(selected === cat.slug ? undefined : cat.slug)}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all
            ${selected === cat.slug
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }
          `}
                >
                    <span>{ICON_MAP[cat.icon] || '📌'}</span>
                    {cat.name}
                </button>
            ))}
        </div>
    );
}
