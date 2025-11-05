// pages/preise.js
import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";
import PayPalButtons from "../components/PayPalButtons"; // ← EINZIGER Import

const cardStyle = {
  background:"#fff",
  border:"1px solid #e6eee6",
  borderRadius:16,
  padding:16,
  boxShadow:"0 6px 16px rgba(17,41,25,0.06)"
};

export default function Preise() {
  return (
    <>
      <Head><title>Preise – Jagdlatein</title></Head>
      <main className={styles.main} style={{padding:"24px 16px"}}>
        <div style={{maxWidth:900, margin:"0 auto"}}>
          <h1 style={{marginBottom:10}}>Preise</h1>
          <p style={{color:"#374151", marginBottom:20}}>
            Wähle dein Modell. Zugang wird nach erfolgreicher Zahlung automatisch freigeschaltet.
          </p>

          <div style={{display:"grid", gap:16, gridTemplateColumns:"1fr 1fr"}}>
            {/* Monat */}
            <div
