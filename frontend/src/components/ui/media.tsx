import React, { useState } from 'react';
import { ImageOff, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type BaseMediaProps = {
    fallbackClassName?: string;
};

type ImageMediaProps = BaseMediaProps & {
    type?: 'image';
} & React.ImgHTMLAttributes<HTMLImageElement>;

type VideoMediaProps = BaseMediaProps & {
    type: 'video';
} & React.VideoHTMLAttributes<HTMLVideoElement>;

export type MediaProps = ImageMediaProps | VideoMediaProps;

export function Media({ fallbackClassName, ...props }: MediaProps) {
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
        setHasError(true);
    };

    const className = props.className;

    if (hasError || !props.src) {
        const { type, fallbackClassName: _, ...imgProps } = props as ImageMediaProps;
        imgProps.src = `https://picsum.photos/seed/200/300/200`;

        return (
            <img
                {...imgProps}
            />
        );
    }

    if (props.type === 'video') {
        const { type, fallbackClassName: _, ...videoProps } = props as VideoMediaProps;
        return (
            <video
                {...videoProps}
                onError={handleError}
            />
        );
    }

    const { type, fallbackClassName: _, ...imgProps } = props as ImageMediaProps;
    return (
        <img
            {...imgProps}
            onError={handleError}
        />
    );
}
