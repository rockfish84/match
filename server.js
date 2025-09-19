import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const ANSWER_PATH = path.join(__dirname, "data", "answer.txt");
const FALLBACK = [
    ["2", "8", "1", "4"],
    ["6", "7", "11", "13"],
    ["16", "5", "14", "3"],
    ["15", "12", "9", "10"]
];

function loadAnswer() {
    try {
        const raw = fs.readFileSync(ANSWER_PATH, "utf8").trim();
        const rows = raw.split(/\r?\n/).map(l => l.trim().split(/\s+/).map(s => String(parseInt(s, 10))));
        if (rows.length !== 4 || rows.some(r => r.length !== 4)) return FALLBACK;
        return rows;
    } catch {
        return FALLBACK;
    }
}
const ANSWER = loadAnswer();

// 채점 API — 맞으면 FLAG를 바로 반환
app.post("/shape/check", (req, res) => {
    const grid = req.body?.grid;
    if (!Array.isArray(grid) || grid.length !== 4 || grid.some(r => !Array.isArray(r) || r.length !== 4)) {
        return res.status(400).json({ ok: false, message: "형식 오류" });
    }
    const flat = grid.flat();
    if (flat.some(v => v == null || v === "")) return res.json({ ok: false, message: "빈 칸 존재" });
    if (flat.some(v => !/^(?:[1-9]|1[0-6])$/.test(String(v)))) return res.json({ ok: false, message: "잘못된 값" });

    let ok = true;
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (String(grid[i][j]) !== ANSWER[i][j]) { ok = false; break; }
        }
        if (!ok) break;
    }
    if (!ok) return res.json({ ok: false });

    return res.json({ ok: true, flag: process.env.FLAG || "정답입니다!" });
});

app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`서버 실행 중 → http://localhost:${PORT}`);
});
