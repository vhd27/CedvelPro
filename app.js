function updateDateTime() {
    const now = new Date();
    const dayNames = ["Bazar", "Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə", "Cümə axşamı", "Cümə", "Şənbə"];
    const day = dayNames[now.getDay()];
    const dateStr = now.toLocaleDateString('az-AZ');
    const timeStr = now.toLocaleTimeString('az-AZ');
    document.getElementById("current-date-time").innerText = `${dateStr} ${day} ${timeStr}`;
}

setInterval(updateDateTime, 1000);
updateDateTime(); // ilk dəfə dərhal göstər

// LocalStorage-a yaz
function saveScheduleToLocalStorage(schedule) {
    localStorage.setItem("schedule", JSON.stringify(schedule));
}

// LocalStorage-dan oxu
function loadScheduleFromLocalStorage() {
    const data = localStorage.getItem("schedule");
    if (!data) return null;
    return JSON.parse(data);
}

// Decimal vaxt → HH:MM format
function decimalToTime(decimal) {
    const hours = Math.floor(decimal * 24);
    const minutes = Math.round((decimal * 24 - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Excel faylını yüklə
function loadSchedule() {
    const file = document.getElementById("file-input").files[0];
    const errorMessage = document.querySelector(".error-message");

    if (!file) {
        errorMessage.innerText = "Zəhmət olmasa Excel faylını seçin!";
        return;
    }

    errorMessage.innerText = "";

    const reader = new FileReader();
    reader.onload = (e) => {
        const workbook = XLSX.read(e.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const headers = raw[0];
        const rows = raw.slice(1);

        // Lazımi sütun adları
        const requiredHeaders = ["Day", "startTime", "endTime", "lessonName", "teacher", "room"];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        // Əgər hər hansı sütun çatışmırsa, xətanı göstər
        if (missingHeaders.length > 0) {
            errorMessage.innerText = `Excel faylı yalnışdır! Zəhmət olmasa düzgün Excel faylı seçin!`;
            return;
        }

        const items = rows.map((r) => {
            let obj = {};
            headers.forEach((h, i) => obj[h] = r[i]);
            return obj;
        });

        const schedule = convertToSchedule(items);
        saveScheduleToLocalStorage(schedule);
        showCurrentAndNextLesson(schedule);
    };

    reader.readAsArrayBuffer(file);
}


// Excel məlumatlarını strukturlaşdır
function convertToSchedule(items) {
    const weeks = Array.from({ length: 7 }, () =>
        Array.from({ length: 5 }, () => [])
    );

    const slotTimes = [
        { start: "09:00", end: "10:30" },
        { start: "11:00", end: "12:30" },
        { start: "13:00", end: "14:30" },
        { start: "15:00", end: "16:30" },
        { start: "17:00", end: "18:30" }
    ];

    items.forEach((row) => {
        const day = Number(row.Day) - 1;
        const startTime = decimalToTime(row.startTime);
        const endTime = decimalToTime(row.endTime);

        const slotIndex = slotTimes.findIndex(slot =>
            isTimeInRange(startTime, slot.start, slot.end)
        );

        if (slotIndex !== -1) {
            weeks[day][slotIndex].push({
                lessonName: row.lessonName,
                teacher: row.teacher,
                room: row.room,
                startTime,
                endTime
            });
        }
    });

    return weeks;
}

function isTimeInRange(time, start, end) {
    const base = "2025-01-01";
    const t = new Date(`${base}T${time}:00`);
    const s = new Date(`${base}T${start}:00`);
    const e = new Date(`${base}T${end}:00`);
    return t >= s && t <= e;
}

function showCurrentAndNextLesson(schedule) {
    const now = new Date();
    const day = now.getDay();
    const timeStr = now.toTimeString().slice(0, 5);

    const current = getCurrentLesson(schedule, day, timeStr);
    const next = getNextLesson(schedule, day, timeStr);

    document.getElementById("current-lesson").innerText = current ? `${current.lessonName} | ${current.teacher} | ${current.room} | ${current.startTime}-${current.endTime}` : "Heç bir dərs yoxdur.";
    document.getElementById("next-lesson").innerText = next ? `${next.lessonName} | ${next.teacher} | ${next.room} | ${next.startTime}-${next.endTime}` : "Heç bir dərs yoxdur.";
}

function getCurrentLesson(schedule, day, time) {
    const todayLessons = schedule[day - 1];
    for (let slot of todayLessons) {
        for (let lesson of slot) {
            if (isTimeInRange(time, lesson.startTime, lesson.endTime)) {
                return lesson;
            }
        }
    }
    return null;
}

function getNextLesson(schedule, day, time) {
    const todayLessons = schedule[day - 1];
    let next = null;

    for (let slot of todayLessons) {
        for (let lesson of slot) {
            if (lesson.startTime > time) {
                if (!next || lesson.startTime < next.startTime) {
                    next = lesson;
                }
            }
        }
    }
    return next;
}

// DOM yüklənəndə cədvəli yüklə
window.addEventListener("DOMContentLoaded", () => {
    const schedule = loadScheduleFromLocalStorage();
    const errorMessage = document.querySelector(".error-message");
    if (!schedule) {
        errorMessage.innerText = "Zəhmət olmasa Excel faylını seçin!";
    } else {
        errorMessage.innerText = "";
        showCurrentAndNextLesson(schedule);
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/assets/service-worker.js')
            .then((registration) => {
                console.log('Service Worker uğurla qeydiyyatdan keçdi:', registration);
            })
            .catch((error) => {
                console.log('Service Worker qeydiyyatdan keçə bilmədi:', error);
            });
    });
}
