'use client';

import React from 'react';
import Image from 'next/image';

const CustomCursor: React.FC = () => {
    return (
        <div
            id="custom-cursor"
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                transform: 'translate3d(0, 0, 0)',
                pointerEvents: 'none',
                zIndex: 9999,
                willChange: 'transform',
            }}
        >
            <Image
                id="custom-cursor-image"
                src="/cursor.png"
                alt="cursor"
                width={30}
                height={40}
                className="opacity-100"
            />
        </div>
    );
};

export default CustomCursor;
