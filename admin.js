// ================================
// FIREBASE
// ================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, deleteDoc, updateDoc, doc, getDoc, addDoc, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD9sPBuJBNHbptkaPuToy9yDmFDVcdrcuM",
  authDomain: "kadamba-driving-school.firebaseapp.com",
  projectId: "kadamba-driving-school",
  storageBucket: "kadamba-driving-school.firebasestorage.app",
  messagingSenderId: "1034623194443",
  appId: "1:1034623194443:web:22a41156fca18997e084ce"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================================
// HTML ELEMENTS & STATE
// ================================
const bookingList = document.getElementById("bookingList");
const bookingCount = document.getElementById("bookingCount");
const menuButton = document.getElementById("menuButton");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const pageTitle = document.getElementById("pageTitle");
const navButtons = document.querySelectorAll(".navButton");
const globalSearch = document.getElementById("globalSearch");

const studentPopup = document.getElementById("studentPopup");
const popupName = document.getElementById("popupName");
const popupPhone = document.getElementById("popupPhone");
const popupPassword = document.getElementById("popupPassword");
const popupVehicle = document.getElementById("popupVehicle");
const popupCourse = document.getElementById("popupCourse");
const popupInstructor = document.getElementById("popupInstructor");
const popupLessons = document.getElementById("popupLessons");
const popupTestDate = document.getElementById("popupTestDate");
const popupFee = document.getElementById("popupFee");
const popupPaid = document.getElementById("popupPaid");
const createStudent = document.getElementById("createStudent");
const cancelStudent = document.getElementById("cancelStudent");

const lessonPopup = document.getElementById("lessonPopup");
const reschedulePopup = document.getElementById("reschedulePopup");
const rescheduleLesson = document.getElementById("rescheduleLesson");
const closeReschedule = document.getElementById("closeReschedule");
const lessonStudent = document.getElementById("lessonStudent");
const lessonCourse = document.getElementById("lessonCourse");
const lessonDate = document.getElementById("lessonDate");
const lessonTime = document.getElementById("lessonTime");
const lessonInstructor = document.getElementById("lessonInstructor");

const closeLesson = document.getElementById("closeLesson");
const cancelLesson = document.getElementById("cancelLesson");

let selectedStudentId = null;
let selectedLessonId = null;
let rescheduleDate = "";
let rescheduleTime = "";

const rescheduleDates = document.getElementById("rescheduleDates");
const rescheduleSlots = document.getElementById("rescheduleSlots");
const saveReschedule = document.getElementById("saveReschedule");

const SCHEDULE_TIMES = [
  "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", 
  "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", 
  "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
];

// ================================
// UTILITY FUNCTIONS
// ================================
function formatLessonDate(dateString, timeString) {
  const lessonDate = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  let dayText;
  if (lessonDate.toDateString() === today.toDateString()) {
    dayText = "Today";
  } else if (lessonDate.toDateString() === tomorrow.toDateString()) {
    dayText = "Tomorrow";
  } else {
    dayText = lessonDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  const [hour, minute] = timeString.split(":");
  const t = new Date();
  t.setHours(Number(hour));
  t.setMinutes(Number(minute));
  
  const formattedTime = t.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${dayText} at ${formattedTime}`;
}

function formatTime(time24) {
  const [h, m] = time24.split(":");
  const d = new Date();
  d.setHours(Number(h));
  d.setMinutes(Number(m));
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

// ================================
// UI & SEARCH LISTENERS
// ================================
if (globalSearch) {
  globalSearch.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll(".bookingCard");
    cards.forEach(card => {
      const searchData = card.getAttribute("data-search") || "";
      card.style.display = searchData.includes(searchTerm) ? "flex" : "none";
    });
  });
}

function openSidebar() { sidebar.classList.add("active"); overlay.classList.add("active"); }
function closeSidebar() { sidebar.classList.remove("active"); overlay.classList.remove("active"); }

menuButton.addEventListener("click", () => {
  sidebar.classList.contains("active") ? closeSidebar() : openSidebar();
});
overlay.addEventListener("click", closeSidebar);

function openPopup() { studentPopup.classList.add("active"); }
function closePopup() {
  studentPopup.classList.remove("active");
  document.querySelector("#studentPopup h2").textContent = "Create Student";
  createStudent.textContent = "Create Student";
  delete createStudent.dataset.mode;
  delete createStudent.dataset.studentId;
}
cancelStudent.addEventListener("click", closePopup);

closeLesson.onclick = () => lessonPopup.classList.remove("active");
closeReschedule.onclick = () => reschedulePopup.classList.remove("active");

// ================================
// NAVIGATION
// ================================
navButtons.forEach(button => {
  button.addEventListener("click", () => {
    navButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    pageTitle.textContent = button.textContent;
    localStorage.setItem("adminPage", button.dataset.page);
    closeSidebar();
    if (globalSearch) globalSearch.value = "";

    switch (button.dataset.page) {
      case "schedule": renderSchedule(); break;
      case "dashboard": bookingList.innerHTML = `<div class="loading">Dashboard coming soon...</div>`; break;
      case "enquiries": renderEnquiries(); break;
      case "students": renderStudents(); break;
      case "requests": renderLessonRequests(); break;
      case "lessons": renderLessons(); break;
      default: bookingList.innerHTML = `<div class="loading">Page under construction...</div>`; break;
    }
  });
});

// ================================
// RENDER VIEWS
// ================================
async function renderEnquiries() {
  bookingList.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "bookings"));
  let enquiryCount = 0;
  
  querySnapshot.forEach(document => {
    const booking = document.data();
    if (booking.status !== "enquiry") return;
    enquiryCount++;
    bookingList.innerHTML += `
      <div class="bookingCard" data-search="${booking.name} ${booking.phone}">
        <div class="bookingInfo"><h3>${booking.name}</h3><p>${booking.phone}</p></div>
        <div class="buttonRow">
          <button class="contactBtn" data-id="${document.id}">Admit</button>
          <button class="deleteBtn" data-id="${document.id}">Delete</button>
        </div>
      </div>`;
  });
  
  bookingCount.textContent = enquiryCount;
  
  document.querySelectorAll(".deleteBtn").forEach(btn => btn.addEventListener("click", async () => {
    await deleteDoc(doc(db, "bookings", btn.dataset.id));
    renderEnquiries();
  }));

  document.querySelectorAll(".contactBtn").forEach(btn => btn.addEventListener("click", async () => {
    selectedStudentId = btn.dataset.id;
    const snap = await getDoc(doc(db, "bookings", selectedStudentId));
    const student = snap.data();
    popupName.value = student.name || "";
    popupPhone.value = student.phone || "";
    popupVehicle.value = student.vehicle || "";
    popupPassword.value = "";
    openPopup();
  }));
}

async function renderStudents() {
  bookingList.innerHTML = "";
  const snap = await getDocs(collection(db, "bookings"));
  let count = 0;
  
  snap.forEach(document => {
    const student = document.data();
    if (student.status !== "student") return;
    count++;
    bookingList.innerHTML += `
      <div class="bookingCard" data-search="${student.name} ${student.phone}">
        <div class="bookingInfo">
          <h3>${student.name}</h3>
          <p>📞 ${student.phone}</p>
        </div>
        <div class="buttonRow">
          <button class="viewProfileBtn" data-id="${document.id}">View Profile</button>
        </div>
      </div>`;
  });
  
  bookingCount.textContent = count;
  
  document.querySelectorAll(".viewProfileBtn").forEach(btn => {
    btn.onclick = () => window.location.href = `student.html?id=${btn.dataset.id}`;
  });
}

async function renderLessonRequests() {
  bookingList.innerHTML = `
    <div style="margin-bottom:22px;">
      <h2>Pending Lesson Requests</h2>
      <p style="color:#94A3B8;margin-top:6px;">Review and approve student lesson requests.</p>
    </div>
  `;
  const snap = await getDocs(collection(db, "lessonRequests"));
  let count = 0;

  snap.forEach(document => {
    const request = document.data();
    if (request.status !== "pending") return;
    count++;
    bookingList.innerHTML += `
      <div class="scheduleRow">
        <div class="bookingInfo">
          <h3>${request.studentName}</h3>
          <p>${formatLessonDate(request.date, request.time)}</p>
        </div>
        <div class="buttonRow">
          <button class="contactBtn" onclick="approveRequest('${document.id}')">Approve</button>
          <button class="deleteBtn" onclick="declineRequest('${document.id}')">Decline</button>
        </div>
      </div>`;
  });

  bookingCount.textContent = count;
  if (count === 0) bookingList.innerHTML += `<p class="loading">No pending lesson requests.</p>`;
}

async function renderLessons() {
  bookingList.innerHTML = "<h2>Scheduled Lessons</h2>";
  const q = query(collection(db, "lessons"), orderBy("date", "asc"));
  const snap = await getDocs(q);
  
  snap.forEach(document => {
    const lesson = document.data();
    bookingList.innerHTML += `
      <div class="bookingCard">
        <div class="bookingInfo">
          <h3>${lesson.studentName}</h3>
          <p>${formatLessonDate(lesson.date, lesson.time)}</p>
        </div>
        <div class="buttonRow">${lesson.status}</div>
      </div>`;
  });
}

async function renderSchedule() {
  bookingList.innerHTML = `<h2 style="margin-bottom:25px;">Today's Schedule</h2>`;
  const today = new Date().toISOString().split("T")[0];
  const snap = await getDocs(collection(db, "lessons"));
  const lessons = {};
  
  snap.forEach(document => {
    const lesson = document.data();
    if (lesson.date === today && lesson.status === "scheduled") {
      lessons[lesson.time] = { id: document.id, ...lesson };
    }
  });

  SCHEDULE_TIMES.forEach(time => {
    const displayTime = formatTime(time);
    if (lessons[time]) {
      bookingList.innerHTML += `
        <div class="scheduleRow">
          <div class="scheduleTime">${displayTime}</div>
          <div class="scheduleStudent">${lessons[time].studentName}</div>
          <button class="viewBtn" onclick="viewLesson('${lessons[time].id}')">View</button>
        </div>`;
    } else {
      bookingList.innerHTML += `
        <div class="scheduleRow">
          <div class="scheduleTime">${displayTime}</div>
          <div class="scheduleStudent vacant">Available</div>
          <button class="assignBtn" onclick="assignLesson('${time}')">Assign</button>
        </div>`;
    }
  });
}

// ================================
// ACTIONS (APPROVE, DECLINE, UPDATE)
// ================================
window.approveRequest = async (id) => {
  const reqSnap = await getDoc(doc(db, "lessonRequests", id));
  const request = reqSnap.data();
  await addDoc(collection(db, "lessons"), { ...request, status: "scheduled" });
  await updateDoc(doc(db, "lessonRequests", id), { status: "approved" });
  renderLessonRequests();
};

window.declineRequest = async (id) => {
  await updateDoc(doc(db, "lessonRequests", id), { status: "declined" });
  renderLessonRequests();
};

createStudent.addEventListener("click", async () => {
  const targetId = selectedStudentId;
  await updateDoc(doc(db, "bookings", targetId), {
    password: popupPassword.value.trim(),
    course: popupCourse.value,
    instructor: popupInstructor.value,
    totalLessons: Number(popupLessons.value),
    testDate: popupTestDate.value,
    courseFee: Number(popupFee.value),
    amountPaid: Number(popupPaid.value),
    paymentStatus: Number(popupPaid.value) >= Number(popupFee.value) ? "Paid" : "Pending",
    status: "student"
  });
  closePopup();
  renderEnquiries();
});

// ================================
// LESSON MANAGEMENT (VIEW, RESCHEDULE, CANCEL)
// ================================
window.viewLesson = async function(id) {
  selectedLessonId = id;
  const lessonSnap = await getDoc(doc(db, "lessons", id));
  if (!lessonSnap.exists()) return;
  const lesson = lessonSnap.data();
  const studentSnap = await getDoc(doc(db, "bookings", lesson.studentId));
  const student = studentSnap.exists() ? studentSnap.data() : {};
  
  lessonStudent.value = lesson.studentName || "";
  lessonCourse.value = student.course || "—";
  lessonDate.value = lesson.date;
  lessonTime.value = formatTime(lesson.time);
  lessonInstructor.value = student.instructor || "—";
  lessonPopup.classList.add("active");
};

rescheduleLesson.onclick = async () => {

  lessonPopup.classList.remove("active");

  setTimeout(async () => {

      reschedulePopup.classList.add("active");

      rescheduleDates.innerHTML = "";
      rescheduleSlots.innerHTML = "";

      const today = new Date();

      for (let i = 0; i < 3; i++) {

          const d = new Date();
          d.setDate(today.getDate() + i);

          const value = d.toISOString().split("T")[0];

          const label =
              i === 0
                  ? "Today"
                  : i === 1
                  ? "Tomorrow"
                  : d.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short"
                    });

          const btn = document.createElement("button");
          btn.className = "rescheduleOption";
          btn.textContent = label;
          btn.onclick = () => loadSlots(value);

          rescheduleDates.appendChild(btn);
      }

  }, 150);

};

async function loadSlots(date) {
  rescheduleDate = date;
  rescheduleSlots.innerHTML = "";
  const q = query(collection(db, "lessons"), where("date", "==", date), where("status", "==", "scheduled"));
  const snap = await getDocs(q);
  const booked = snap.docs.map(d => d.data().time);
  
  SCHEDULE_TIMES.forEach(time => {
    if (booked.includes(time)) return;
    const btn = document.createElement("button");
    btn.className = "rescheduleOption";
    btn.style.margin = "5px";
    btn.textContent = formatTime(time);
    btn.onclick = () => {
      rescheduleTime = time;
      document.querySelectorAll("#rescheduleSlots button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };
    rescheduleSlots.appendChild(btn);
  });
}

saveReschedule.onclick = async () => {
  if (!selectedLessonId) return;
  if (!rescheduleDate || !rescheduleTime) {
    alert("Select a date and time.");
    return;
  }
  await updateDoc(doc(db, "lessons", selectedLessonId), { date: rescheduleDate, time: rescheduleTime });
  reschedulePopup.classList.remove("active");
  renderSchedule();
};

cancelLesson.onclick = async () => {
  if (!selectedLessonId) return;
  if (!confirm("Cancel this lesson?")) return;
  await deleteDoc(doc(db, "lessons", selectedLessonId));
  lessonPopup.classList.remove("active");
  renderSchedule();
};

window.assignLesson = function(time) {
  alert("Assign lesson at " + formatTime(time));
};

// ================================
// START APP
// ================================
const savedPage = localStorage.getItem("adminPage") || "enquiries";
const targetButton = Array.from(navButtons).find(btn => btn.dataset.page === savedPage);
if (targetButton) {
  targetButton.click();
} else {
  renderEnquiries();
}
