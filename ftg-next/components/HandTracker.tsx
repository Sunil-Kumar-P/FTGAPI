'use client';

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';
import styles from './HandTracker.module.css';

interface HandTrackerProps {
    onMove: (x: number, y: number, isClick: boolean) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onMove }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const handsRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);

    useEffect(() => {
        let isMounted = true;

        const initializeMediaPipe = async () => {
            if (!videoRef.current || !canvasRef.current || !isMounted) return;

            let attempts = 0;
            while (!(window as any).Hands || !(window as any).Camera) {
                if (!isMounted) return;
                if (attempts > 100) {
                    console.error('MediaPipe scripts failed to load');
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }

            try {
                if (!isMounted) return;

                handsRef.current = new (window as any).Hands({
                    locateFile: (file: string) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                    }
                });

                handsRef.current.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                    selfieMode: true
                });

                handsRef.current.onResults((results: any) => {
                    if (!isMounted || !canvasRef.current || !handsRef.current) return;
                    const canvasCtx = canvasRef.current.getContext('2d');
                    if (!canvasCtx) return;

                    canvasCtx.save();
                    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

                    if (results.multiHandLandmarks) {
                        for (const hand of results.multiHandLandmarks) {
                            const middleFingerTip = hand[9];
                            const middleFingerMCP = hand[12];
                            const mfcp = hand[0];

                            const x = mfcp.x * window.innerWidth;
                            const y = mfcp.y * window.innerHeight;

                            const isClick = middleFingerMCP.y < middleFingerTip.y;

                            const cursor = document.getElementById('custom-cursor');
                            if (cursor) {
                                cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                                const cursorImage = document.getElementById('custom-cursor-image');
                                if (cursorImage) {
                                    cursorImage.style.transform = isClick ? 'scale(0.8)' : 'scale(1)';
                                    cursorImage.style.opacity = isClick ? '0.8' : '1';
                                }
                            }

                            if (onMove) {
                                onMove(x, y, isClick);
                            }
                        }
                    }
                    canvasCtx.restore();
                });

                cameraRef.current = new (window as any).Camera(videoRef.current, {
                    onFrame: async () => {
                        if (isMounted && handsRef.current && handsRef.current.send && videoRef.current && videoRef.current.readyState >= 2) {
                            try {
                                await handsRef.current.send({ image: videoRef.current });
                            } catch (e) {
                                // Only log unexpected errors
                                if (isMounted) console.warn('MediaPipe send error:', e);
                            }
                        }
                    },
                    width: 640,
                    height: 480
                });

                await cameraRef.current.start();
                console.log('MediaPipe Camera started');
            } catch (error) {
                console.error('Error initializing MediaPipe:', error);
            }
        };

        initializeMediaPipe();

        return () => {
            isMounted = false;
            console.log('Cleaning up MediaPipe...');

            const currentCamera = cameraRef.current;
            const currentHands = handsRef.current;

            if (currentCamera) {
                try {
                    currentCamera.stop();
                } catch (e) { console.error('Error stopping camera:', e); }
            }
            if (currentHands) {
                try {
                    currentHands.close();
                } catch (e) {
                    console.error('Error closing MediaPipe hands:', e);
                }
            }

            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }

            cameraRef.current = null;
            handsRef.current = null;
        };
    }, [onMove]);

    return (
        <div className={styles.container}>
            <div className={styles.statusPill}>
                <div className={styles.dot} />
                <span className={styles.statusText}>Live Tracker</span>
            </div>
            <video ref={videoRef} className={styles.hidden} style={{ display: 'none' }} />
            <canvas ref={canvasRef} className={styles.canvas} width={640} height={480} />
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
                strategy="lazyOnload"
            />
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js"
                strategy="lazyOnload"
            />
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
                strategy="lazyOnload"
            />
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
                strategy="lazyOnload"
            />
        </div>
    );
};

export default HandTracker;
