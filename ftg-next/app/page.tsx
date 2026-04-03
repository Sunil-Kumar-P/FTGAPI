'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import CustomCursor from '../components/CustomCursor';
import styles from './home.module.css';

// Dynamically import HandTracker as it uses browser APIs
const HandTracker = dynamic(() => import('../components/HandTracker'), {
  ssr: false,
});

export default function Home() {
  const handleHandMove = (x: number, y: number, isClick: boolean) => {
    // Hand tracker handles cursor movement directly via DOM for performance
    if (isClick) {
      const element = document.elementFromPoint(x, y);
      if (element instanceof HTMLElement) {
        element.click();
      }
    }
  };

  return (
    <main className={styles.homePage}>
      <div className={styles.bgGradient} />
      <CustomCursor />
      <HandTracker onMove={handleHandMove} />

      <header className={styles.header}>
        <div className={styles.logo}>FTG <span style={{ color: '#fff' }}>JIMMYRUN</span></div>
        <nav className={styles.nav}>
          <a href="#" className={styles.navLink}>About</a>
          <a href="#" className={styles.navLink}>Community</a>
          <a href="#" className={styles.navLink}>Support</a>
        </nav>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Level Up Your <br />
          Fitness Through Gaming
        </h1>
        <p className={styles.heroSubtitle}>
          Experience the future of workout. Control your character with real-world
          movements using advanced hand and pose tracking technology.
        </p>

        <div className={styles.cardsContainer}>
          <div className={`${styles.card} ${styles.card1}`}>
            <span className={styles.cardSpan}>DIAGNOSTICS</span>
            <h2 className={styles.cardTitle}>CAMERA</h2>
            <p className={styles.cardText}>
              Calibrate your environment and test the real-time pose tracking coordinates before you start the race.
            </p>
            <Link href="/camera">
              <button className={styles.cardButton}>Launch Test</button>
            </Link>
          </div>

          <div className={`${styles.card} ${styles.card2}`}>
            <span className={styles.cardSpan}>THE ARENA</span>
            <h2 className={styles.cardTitle}>GAME</h2>
            <p className={styles.cardText}>
              Step into the virtual world. Run in place to move your character and dodge obstacles with body shifts.
            </p>
            <Link href="/game">
              <button className={styles.cardButton}>Start Running</button>
            </Link>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div>&copy; 2024 Fitness Through Gaming. All rights reserved.</div>
          <div className={styles.footerLinks}>
            <a href="#" className={styles.navLink}>Privacy</a>
            <a href="#" className={styles.navLink}>Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
