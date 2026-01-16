import { BlockItem } from './types';
import { ImageIcon } from 'lucide-react';

export const image: BlockItem = {
    title: 'Image',
    description: 'Full width image',
    searchTerms: ['image', 'photo', 'picture'],
    icon: <ImageIcon className="w-4 h-4" />,
    command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setImage({ src: '' }).run();
    },
};

export const logo: BlockItem = {
    title: 'Logo',
    description: 'Brand logo image',
    searchTerms: ['logo', 'brand', 'image'],
    icon: <ImageIcon className="w-4 h-4" />,
    command: ({ editor, range }) => {
        (editor.chain().focus().deleteRange(range) as any).setLogoImage({ src: '' }).run();
    },
};
