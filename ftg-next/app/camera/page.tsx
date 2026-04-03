'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './camera.module.css';

export default function CameraPage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [steps, setSteps] = useState(0);
    const [activeActions, setActiveActions] = useState<string[]>([]);
    const router = useRouter();

    const stateRef = useRef({
        legs: { left: false, right: false },
        legInAir: false,
        steps: 0,
        gridPosition: {
            left: false,
            right: false,
            top: false,
            bottom: false,
            moving: false,
            restart: false,
            center: true
        }
    });
    const lastFetchRef = useRef<number>(0);

    useEffect(() => {
        let pose: any = null;
        let camera: any = null;
        let isMounted = true;

        const initPose = async () => {
            if (typeof window === 'undefined' || !window.Pose || !window.Camera) {
                // Wait for scripts to load if not available
                let attempts = 0;
                while (!(window as any).Pose || !(window as any).Camera) {
                    if (!isMounted || attempts > 100) return;
                    await new Promise(r => setTimeout(r, 500));
                    attempts++;
                }
            }

            pose = new window.Pose({
                locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
            });

            pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
                selfieMode: true
            });

            pose.onResults((results: any) => {
                if (!isMounted || !canvasRef.current || !videoRef.current) return;

                const canvasCtx = canvasRef.current.getContext('2d');
                if (!canvasCtx) return;

                canvasCtx.save();
                canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

                if (results.poseLandmarks) {
                    if (window.drawConnectors && window.POSE_CONNECTIONS) {
                        window.drawConnectors(canvasCtx, results.poseLandmarks, window.POSE_CONNECTIONS, {
                            color: '#00FF00',
                            lineWidth: 5,
                        });
                    }
                    if (window.drawLandmarks) {
                        window.drawLandmarks(canvasCtx, results.poseLandmarks, {
                            color: '#FF0000',
                            lineWidth: 2,
                        });
                    }

                    const canvasWidth = canvasRef.current.width;
                    const canvasHeight = canvasRef.current.height;
                    const topHeight = (canvasHeight / 10) * 4;
                    const boxWidth = (canvasWidth / 11) * 4;
                    const boxHeight = canvasHeight / 3;

                    canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    canvasCtx.lineWidth = 2;
                    canvasCtx.beginPath();
                    canvasCtx.moveTo(boxWidth, 0);
                    canvasCtx.lineTo(boxWidth, canvasHeight);
                    canvasCtx.moveTo(canvasWidth - boxWidth, 0);
                    canvasCtx.lineTo(canvasWidth - boxWidth, canvasHeight);
                    canvasCtx.stroke();
                    canvasCtx.beginPath();
                    canvasCtx.moveTo(0, topHeight);
                    canvasCtx.lineTo(canvasWidth, topHeight);
                    canvasCtx.moveTo(0, boxHeight * 2);
                    canvasCtx.lineTo(canvasWidth, boxHeight * 2);
                    canvasCtx.stroke();

                    const landmarks = results.poseLandmarks;
                    const centerPoint = {
                        x: (landmarks[11].x + landmarks[12].x + landmarks[23].x + landmarks[24].x) / 4,
                        y: (landmarks[11].y + landmarks[12].y + landmarks[23].y + landmarks[24].y) / 4
                    };

                    canvasCtx.fillStyle = '#38bdf8';
                    canvasCtx.beginPath();
                    canvasCtx.arc(centerPoint.x * canvasWidth, centerPoint.y * canvasHeight, 8, 0, 2 * Math.PI);
                    canvasCtx.fill();

                    const xCoord = centerPoint.x * canvasWidth;
                    const yCoord = centerPoint.y * canvasHeight;

                    const newGrid = {
                        left: xCoord < boxWidth,
                        right: xCoord > canvasWidth - boxWidth,
                        top: yCoord < topHeight,
                        bottom: yCoord > boxHeight * 2,
                        moving: false,
                        restart: false,
                        center: false
                    };
                    newGrid.center = !newGrid.left && !newGrid.right;

                    const nose = landmarks[0].y;
                    const yra = landmarks[28].y;
                    const yla = landmarks[27].y;
                    const yrh = landmarks[24].y;
                    const ylh = landmarks[23].y;

                    const fullbody = Math.max(yra - nose, yla - nose);
                    const leftLegHeight = yla - ylh;
                    const rightLegHeight = yra - yrh;

                    if (leftLegHeight < fullbody * 0.40) {
                        stateRef.current.legInAir = true;
                        stateRef.current.legs.left = true;
                    } else if (stateRef.current.legs.left) {
                        stateRef.current.legInAir = false;
                        stateRef.current.legs.left = false;
                        stateRef.current.steps += 1;
                        stateRef.current.gridPosition.moving = true;
                        setSteps(stateRef.current.steps);
                    }

                    if (rightLegHeight < fullbody * 0.40) {
                        stateRef.current.legInAir = true;
                        stateRef.current.legs.right = true;
                    } else if (stateRef.current.legs.right) {
                        stateRef.current.legInAir = false;
                        stateRef.current.legs.right = false;
                        stateRef.current.steps += 1;
                        stateRef.current.gridPosition.moving = true;
                        setSteps(stateRef.current.steps);
                    }

                    const rw = landmarks[15].x;
                    const lw = landmarks[16].x;
                    if (rw < lw) newGrid.restart = true;

                    const rwy = landmarks[15].y;
                    const lwy = landmarks[16].y;
                    if (rwy < nose) router.push('/game');
                    if (lwy < nose) router.push('/');

                    stateRef.current.gridPosition = { ...newGrid, moving: stateRef.current.gridPosition.moving };

                    const actions = [];
                    if (newGrid.left) actions.push('LEFT');
                    if (newGrid.right) actions.push('RIGHT');
                    if (newGrid.top) actions.push('TOP');
                    if (newGrid.bottom) actions.push('BOTTOM');
                    if (newGrid.center) actions.push('CENTER');
                    if (stateRef.current.legs.left) actions.push('Right Leg is Up'); // Matched original script logic (swapped labels)
                    if (stateRef.current.legs.right) actions.push('Left Leg is Up');
                    setActiveActions(actions);

                    const now = Date.now();
                    if (now - lastFetchRef.current >= 100) {
                        lastFetchRef.current = now;
                        fetch('/api/process', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ gridPosition: stateRef.current.gridPosition }),
                        }).catch(err => console.error('API Error:', err));
                    }

                    stateRef.current.gridPosition.moving = false;
                }
                canvasCtx.restore();
            });

            if (videoRef.current) {
                camera = new window.Camera(videoRef.current, {
                    onFrame: async () => {
                        if (pose && isMounted && videoRef.current && videoRef.current.readyState >= 2) {
                            try {
                                await pose.send({ image: videoRef.current });
                            } catch (e) {
                                console.warn('Pose send error:', e);
                            }
                        }
                    },
                    width: 1280,
                    height: 720,
                });
                camera.start();
            }
        };

        initPose();

        return () => {
            isMounted = false;
            if (camera) {
                try { camera.stop(); } catch (e) { }
            }
            if (pose) {
                try { pose.close(); } catch (e) { }
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        };
    }, [router]);

    return (
        <div className={styles.cameraPage}>
            <header className={styles.header}>
                <h1 className={styles.title}>Fitness Through Gaming</h1>
                <h2 className={styles.subtitle}>CAMERA DIAGNOSTICS</h2>
                <nav className={styles.nav}>
                    <a href="/" className={styles.link}>HOME</a>
                    <Link href="/game" className={styles.link}>GAME</Link>
                </nav>
            </header>

            <main className={styles.main}>
                <section className={styles.videoSection}>
                    <video ref={videoRef} className={styles.hidden} style={{ display: 'none' }} />
                    <canvas
                        ref={canvasRef}
                        className={styles.videoFeed}
                        width={1280}
                        height={720}
                    />
                </section>

                <aside className={styles.sidebar}>
                    <div className={styles.card}>
                        <h2 className={styles.cardHeader}>STEPS</h2>
                        <div className={styles.stepsDisplay}>
                            {steps}
                        </div>
                    </div>

                    <div className={`${styles.card} flex-1`}>
                        <h2 className={styles.cardHeader}>CURRENT ACTIONS</h2>
                        <div className={styles.actionsList}>
                            {activeActions.map(action => (
                                <span key={action} className={styles.actionTag}>
                                    {action}
                                </span>
                            ))}
                            {activeActions.length === 0 && (
                                <p className={styles.noActions}>Detecting movement...</p>
                            )}
                        </div>
                    </div>
                </aside>
            </main>
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="afterInteractive" />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js" strategy="afterInteractive" />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" strategy="afterInteractive" />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" strategy="afterInteractive" />
        </div>
    );
}
