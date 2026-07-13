// ================================
// FIREBASE & CONFIG
// ================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, addDoc, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD9sPBuJBNHbptkaPuToy9yDmFDVcdrcuM",
  authDomain: "kadamba-driving-school.firebaseapp.com",
  projectId: "kadamba-driving-school",
  storageBucket: "kadamba-driving-school.firebasestorage.app",
  messagingSenderId: "1034623194443",
  appId: "1:1034623194443:web:22a41156fca18997e084ce"
};

const db = getFirestore(initializeApp(firebaseConfig));
const studentId = sessionStorage.getItem("studentId");

const WORKING_HOURS = ["07:30", "08:30", "09:30", "10:30", "14:00"];
let selectedDate = "";
let selectedTime = "";

// ================================
// DATE & SLOT LOGIC
// ================================
function getNextThreeDates() {
    const dates = [];
    for (let i = 0; i < 3; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        let label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        dates.push({ label: label, value: d.toISOString().split('T')[0] });
    }
    return dates;
}
function formatLessonDate(dateString, timeString){

  const lessonDate = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date();

  tomorrow.setDate(today.getDate() + 1);

  const lessonOnly = lessonDate.toDateString();
  const todayOnly = today.toDateString();
  const tomorrowOnly = tomorrow.toDateString();

  let dayText;

  if(lessonOnly === todayOnly){
      dayText = "Today";
  }
  else if(lessonOnly === tomorrowOnly){
      dayText = "Tomorrow";
  }
  else{
      dayText = lessonDate.toLocaleDateString("en-GB",{
          day:"numeric",
          month:"short"
      });
  }

  const [hour,minute] = timeString.split(":");

  const time = new Date();

  time.setHours(hour);
  time.setMinutes(minute);

  const formattedTime =
      time.toLocaleTimeString("en-US",{
          hour:"numeric",
          minute:"2-digit",
          hour12:true
      });

  return `${dayText} at ${formattedTime}`;

}

function highlightButton(containerId, selectedBtn) {
    const container = document.getElementById(containerId);
    Array.from(container.children).forEach(btn => btn.classList.remove('active'));
    selectedBtn.classList.add('active');
}

async function loadAvailableSlots(date, btnElement) {
    highlightButton('dateContainer', btnElement);
    selectedDate = date;
    const container = document.getElementById("slotContainer");
    container.innerHTML = "Loading...";

    try {
        const q = query(collection(db, "lessons"), where("date", "==", date), where("status", "==", "scheduled"));
        const snap = await getDocs(q);
        const bookedTimes = snap.docs.map(d => d.data().time);

        container.innerHTML = "";
        WORKING_HOURS.forEach(slot => {
            if (!bookedTimes.includes(slot)) {
                const btn = document.createElement("button");
                btn.textContent = slot;
                btn.className = "primaryBtn";
                btn.style.margin = "5px";
                btn.onclick = (e) => {
                    highlightButton('slotContainer', e.target);
                    selectTime(slot);
                };
                container.appendChild(btn);
            }
        });
        if (container.innerHTML === "") container.innerHTML = "No slots available.";
    } catch (e) { container.innerHTML = "Error loading slots."; }
}

function selectTime(time) {
    selectedTime = time;
    document.getElementById("confirmArea").innerHTML = `
        <p style="margin: 10px 0; color: #fff;">Selected: ${formatLessonDate(selectedDate, selectedTime)}</p>
        <button id="finalSubmit" class="primaryBtn" style="width:100%">Confirm Request</button>
    `;
    document.getElementById("finalSubmit").onclick = () => submitRequest();
}

async function submitRequest() {
    await addDoc(collection(db, "lessonRequests"), {
        studentId,
        studentName: document.getElementById("studentName").textContent,
        date: selectedDate,
        time: selectedTime,
        status: "pending",
        createdAt: new Date().toISOString()
    });
    alert("Request confirmed!");
    document.getElementById("requestPopup").classList.remove("active");
    await loadRequestStatus();
}

// ================================
// INITIALIZATION & PORTAL LOAD
// ================================
async function loadPortal() {
    if (!studentId) return;

    const snap = await getDoc(doc(db, "bookings", studentId));
    if (!snap.exists()) return;
    const s = snap.data();

    // Profile Data Loading
    document.getElementById("studentName").textContent = s.name;
    document.getElementById("progressFill").style.width = `${((s.lessonsCompleted || 0) / (s.totalLessons || 21)) * 100}%`;
    document.getElementById("progressText").textContent = `${s.lessonsCompleted || 0} / ${s.totalLessons || 21} Lessons Completed`;
    document.getElementById("notesDisplay").textContent = s.notes || "No instructor notes available.";
    document.getElementById("fee").textContent = s.courseFee ? `₹${s.courseFee}` : "—";
    document.getElementById("paid").textContent = s.amountPaid ? `₹${s.amountPaid}` : "—";
    document.getElementById("remaining").textContent = s.courseFee ? `₹${s.courseFee - s.amountPaid}` : "—";
    document.getElementById("payStatus").textContent = s.paymentStatus || "—";

    if (s.instructorPhone) {
        document.getElementById("callBtn").href = `tel:${s.instructorPhone}`;
        document.getElementById("whatsappBtn").href = `https://wa.me/${s.instructorPhone}`;
    }

    loadNextLesson();
    loadRequestStatus();
}

async function loadNextLesson() {
    const q = query(collection(db, "lessons"), where("studentId", "==", studentId), where("status", "==", "scheduled"), orderBy("date", "asc"), limit(1));
    const snap = await getDocs(q);
    if(!snap.empty){

      const lesson = snap.docs[0].data();
  
      document.getElementById("lessonInfo").textContent =
          formatLessonDate(
              lesson.date,
              lesson.time
          );
  
  }
  else{
  
      document.getElementById("lessonInfo").textContent =
          "No lesson scheduled.";
  
  }
}

async function loadRequestStatus() {

  const statusEl = document.getElementById("requestStatus");

  console.log("Student ID:", studentId);

  const q = query(
      collection(db, "lessonRequests"),
      where("studentId", "==", studentId)
  );

  const snap = await getDocs(q);

  console.log("Requests found:", snap.size);

  if (snap.empty) {
      statusEl.textContent = "Status: None";
      return;
  }

  let latest = null;

  snap.forEach(doc => {
      latest = doc.data();
  });

  statusEl.textContent =
      `Status: ${latest.status.charAt(0).toUpperCase()}${latest.status.slice(1)}`;

}

// ================================
// POPUP TRIGGERS
// ================================
document.getElementById("openRequestPopup").onclick = () => {
    document.getElementById("requestPopup").classList.add("active");
    const dateContainer = document.getElementById("dateContainer");
    dateContainer.innerHTML = ""; 
    
    getNextThreeDates().forEach(d => {
        const btn = document.createElement("button");
        btn.textContent = d.label;
        btn.className = "secondaryBtn";
        btn.style.margin = "5px";
        btn.onclick = (e) => loadAvailableSlots(d.value, e.target);
        dateContainer.appendChild(btn);
    });
    
    document.getElementById("slotContainer").innerHTML = "";
    document.getElementById("confirmArea").innerHTML = "";
};

document.getElementById("closeRequest").onclick = () => document.getElementById("requestPopup").classList.remove("active");

loadPortal();
