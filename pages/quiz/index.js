// pages/quiz/index.js
import prisma from "../../lib/prisma";
import Link from "next/link";

// --- Helpers ---
function hasPaidAccessFromCookies(req) {
  const cookies = req.headers.cookie || "";
  const loggedIn = cookies.includes("jl_session=1");
  const paid = cookies.includes("jl_paid=1");
  return loggedIn && paid;
}
function toArray(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x.filter(Boolean);
  return [String(x)];
}
function int(v, d = 1) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
}

export async function getServerSideProps(ctx) {
  const { req, query } = ctx;

  // ⛔ ohne Login + Zahlung → redirect auf /login
  if (!hasPaidAccessFromCookies(req)) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // ✅ deine bisherige Logik:
  ...
};

export default function QuizIndex({
  page,
  pageSize,
  total,
  q,
  random,
  selected,
  filters,
  items,
  error,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function qs(ne
  ...
}

const pageMain = {
  maxWidth: 960,
  margin: "0 auto",
  padding: "32px 16px 64px",
};

const filterBar = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 16,
};

const tag = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: 999,
  background: "#f3f4f6",
  fontSize: 13,
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 12,
};

const th = {
  textAlign: "left",
  fontSize: 13,
  padding: "8px 6px",
  borderBottom: "1px solid #e5e7eb",
  color: "#4b5563",
};

const td = {
  fontSize: 14,
  padding: "8px 6px",
  borderBottom: "1px solid #f3f4f6",
};

const pagination = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 16,
  fontSize: 14,
};

const linkMuted = {
  color: "#6b7280",
  textDecoration: "none",
};
const errorBox = {
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#7f1d1d",
  padding: 12,
  borderRadius: 8,
};

// Ende der Datei
