'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './game.module.css';

export default function GamePage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const camCanvasRef = useRef<HTMLCanvasElement>(null);
    const unityCanvasRef = useRef<HTMLCanvasElement>(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isUnityLoading, setIsUnityLoading] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const router = useRouter();

    const stateRef = useRef({
        legs: { left: false, right: false },
        legInAir: false,
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

    const unityInstanceRef = useRef<any>(null);
    const initializingRef = useRef(false);
    const lastFetchRef = useRef<number>(0);

    useEffect(() => {
        let pose: any = null;
        let camera: any = null;
        let isMounted = true;

        const initPose = async () => {
            if (typeof window === 'undefined') return;

            // Wait for scripts to be available
            let attempts = 0;
            while (!(window as any).Pose || !(window as any).Camera) {
                if (!isMounted || attempts > 100) return;
                await new Promise(r => setTimeout(r, 500));
                attempts++;
            }

            try {
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
                    if (!isMounted || !camCanvasRef.current || !videoRef.current || !results.image) return;

                    const canvasCtx = camCanvasRef.current.getContext('2d');
                    if (!canvasCtx) return;

                    canvasCtx.save();
                    canvasCtx.clearRect(0, 0, camCanvasRef.current.width, camCanvasRef.current.height);
                    canvasCtx.drawImage(results.image, 0, 0, camCanvasRef.current.width, camCanvasRef.current.height);

                    if (results.poseLandmarks) {
                        const canvasWidth = camCanvasRef.current.width;
                        const canvasHeight = camCanvasRef.current.height;
                        const topHeight = (canvasHeight / 10) * 4;
                        const boxWidth = (canvasWidth / 11) * 4;
                        const boxHeight = canvasHeight / 3;

                        const landmarks = results.poseLandmarks;
                        const centerPoint = {
                            x: (landmarks[11].x + landmarks[12].x + landmarks[23].x + landmarks[24].x) / 4,
                            y: (landmarks[11].y + landmarks[12].y + landmarks[23].y + landmarks[24].y) / 4
                        };

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

                        if (leftLegHeight < fullbody * 0.40 || rightLegHeight < fullbody * 0.40) {
                            stateRef.current.legInAir = true;
                            stateRef.current.gridPosition.moving = true;
                        } else {
                            stateRef.current.legInAir = false;
                        }

                        const rw = landmarks[15].x;
                        const lw = landmarks[16].x;
                        if (rw < lw) newGrid.restart = true;

                        const lwy = landmarks[16].y;
                        if (lwy < nose) router.push('/');

                        stateRef.current.gridPosition = { ...newGrid, moving: stateRef.current.gridPosition.moving };

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
            } catch (err) {
                console.error("Pose Init Error:", err);
            }
        };

        initPose();

        return () => {
            isMounted = false;
            // Reset global lock just in case
            (window as any).__FTG_UNITY_INITIALIZING__ = false;

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

            // Critical Unity Cleanup
            const instance = unityInstanceRef.current || window.unityInstance;
            if (instance && typeof instance.Quit === 'function') {
                console.log("Unity: Requesting Quit...");
                instance.Quit().then(() => {
                    console.log("Unity: Quit successful");
                    unityInstanceRef.current = null;
                    window.unityInstance = null;
                }).catch((e: any) => {
                    console.warn("Unity: Quit failed", e);
                });
            }
        };
    }, [router]);

    const handleUnityLoad = useCallback(async () => {
        if (typeof window === 'undefined' || !window.createUnityInstance || !unityCanvasRef.current) {
            return;
        }

        // GLOBAL LOCK: Persists even if React component remounts
        if ((window as any).__FTG_UNITY_INITIALIZING__) {
            console.log("Unity Global Lock: Initializing already in progress. Aborting.");
            return;
        }

        if (window.unityInstance || unityInstanceRef.current) {
            console.log("Unity Global Lock: Instance already exists. Aborting.");
            return;
        }

        console.log("Unity Global Lock: No instance found. Starting initialization...");
        (window as any).__FTG_UNITY_INITIALIZING__ = true;

        try {
            const buildUrl = "/FTGv2/Build";
            const config = {
                dataUrl: buildUrl + "/FTGv2.data",
                frameworkUrl: buildUrl + "/FTGv2.framework.js",
                codeUrl: buildUrl + "/FTGv2.wasm",
                streamingAssetsUrl: "StreamingAssets",
                companyName: "Fitness Through Gaming",
                productName: "FTG JimmyRun",
                productVersion: "0.1",
                matchWebGLToCanvasSize: false, // Prevent Unity from handling resizing internally
            };

            const instance = await window.createUnityInstance(unityCanvasRef.current, config, (progress: number) => {
                setLoadingProgress(100 * progress);
            });

            console.log("Unity Global Lock: Initialization Successful");
            setIsUnityLoading(false);
            unityInstanceRef.current = instance;
            window.unityInstance = instance;
            initializingRef.current = false;
        } catch (error) {
            console.error("Unity Global Lock: Initialization Failed", error);
        } finally {
            (window as any).__FTG_UNITY_INITIALIZING__ = false;
        }
    }, []);

    return (
        <div className={styles.gamePage}>
            {gameStarted && (
                <Script
                    src="/FTGv2/Build/FTGv2.loader.js"
                    strategy="afterInteractive"
                    onLoad={handleUnityLoad}
                />
            )}

            <header className={styles.header}>
                <h1 className={styles.title}>Fitness Through Gaming</h1>
                <h2 className={styles.subtitle}>FTG JimmyRun</h2>
                <nav className={styles.nav}>
                    <a href="/" className={styles.link}>HOME</a>
                    <Link href="/camera" className={styles.link}>CAMERA</Link>
                </nav>
            </header>

            <main className={styles.main}>
                <section className={styles.gameSection}>
                    <div className={styles.canvasWrapper}>
                        <canvas
                            ref={unityCanvasRef}
                            id="unity-canvas"
                            width={960}
                            height={600}
                            className={styles.unityCanvas}
                            style={{
                                display: 'block',
                                width: '100%',
                                height: '100%',
                                background: '#111827'
                            }}
                        />
                        {gameStarted ? (
                            isUnityLoading && (
                                <div className={styles.loadingOverlay}>
                                    <div className={styles.loadingBox}>
                                        <h3 className={styles.loadingProgress}>LOADING GAME</h3>
                                        <div className={styles.progressBar}>
                                            <div
                                                className={styles.progressFill}
                                                style={{ width: `${loadingProgress}%` }}
                                            />
                                        </div>
                                        <span className={styles.percentText}>{Math.round(loadingProgress)}%</span>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className={styles.startOverlay}>
                                <div className={styles.startBox}>
                                    <h3 className={styles.startTitle}>READY TO RUN?</h3>
                                    <p className={styles.startDesc}>Ensure your camera is visible on the right before starting.</p>
                                    <button
                                        className={styles.startButton}
                                        onClick={() => {
                                            setGameStarted(true);
                                            setIsUnityLoading(true);
                                            // handleUnityLoad will fire via Script onLoad if it's new
                                            // or we can call it manually here to be sure
                                            if (window.createUnityInstance) handleUnityLoad();
                                        }}
                                    >
                                        START GAME
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <aside className={styles.sidebar}>
                    <div className={styles.card}>
                        <h2 className={styles.cardHeader}>TRACKING PREVIEW</h2>
                        <div className={styles.cameraPreview}>
                            <video ref={videoRef} className={styles.hidden} style={{ display: 'none' }} />
                            <canvas ref={camCanvasRef} className={styles.videoFeed} width={1280} height={720} />
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h2 className={styles.cardHeader}>GAME CONTROLS</h2>
                        <ul className={styles.controlList}>
                            <li className={styles.controlItem}>
                                <span className={styles.key}>LIFT LEGS</span>
                                <span className={styles.action}>Running</span>
                            </li>
                            <li className={styles.controlItem}>
                                <span className={styles.key}>SIDE STEP</span>
                                <span className={styles.action}>Lane Shift</span>
                            </li>
                            <li className={styles.controlItem}>
                                <span className={styles.key}>T-POSE</span>
                                <span className={styles.action}>Restart Game</span>
                            </li>
                            <li className={styles.controlItem}>
                                <span className={styles.key}>LEFT HAND UP</span>
                                <span className={styles.action}>Exit to Home</span>
                            </li>
                        </ul>
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

declare global {
    interface Window {
        Pose: any;
        Camera: any;
        createUnityInstance: any;
        unityInstance: any;
        POSE_CONNECTIONS: any;
        drawConnectors: any;
        drawLandmarks: any;
    }
}
