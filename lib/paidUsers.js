// lib/paidUsers.js
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'paid-users.json');

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]), 'utf8');
  }
}

export function getPaidUsers() {
  ensureFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addPaidUser(email) {
  if (!email) return;
  const normalized = email.trim().toLowerCase();
  ensureFile();
  const list = getPaidUsers();
  if (!list.includes(normalized)) {
    list.push(normalized);
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
  }
}

export function isPaidUser(email) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const list = getPaidUsers();
  return list.includes(normalized);
}
