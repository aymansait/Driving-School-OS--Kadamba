// ================================
// FIREBASE
// ================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
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
// HTML ELEMENTS
// ================================
const studentName = document.getElementById("studentName");
const studentPhone = document.getElementById("studentPhone");
const studentVehicle = document.getElementById("studentVehicle");
const studentCourse = document.getElementById("studentCourse");
const studentInstructor = document.getElementById("studentInstructor");
const studentTestDate = document.getElementById("studentTestDate");
const totalLessons = document.getElementById("totalLessons");
const backButton = document.getElementById("backButton");
const courseFee = document.getElementById("courseFee");
const amountPaid = document.getElementById("amountPaid");
const amountRemaining = document.getElementById("amountRemaining");
const paymentStatus = document.getElementById("paymentStatus");

const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const nextLesson = document.getElementById("nextLesson");
const courseStatus = document.getElementById("courseStatus");

const completeLesson = document.getElementById("completeLesson");
const completeCourse = document.getElementById("completeCourse");

const notes = document.getElementById("notes");
const saveNotes = document.getElementById("saveNotes");

// Popup Elements (Global)
const studentPopup = document.getElementById("studentPopup");
const popupName = document.getElementById("popupName");
const popupPhone = document.getElementById("popupPhone");
const popupVehicle = document.getElementById("popupVehicle");
const popupCourse = document.getElementById("popupCourse");
const popupInstructor = document.getElementById("popupInstructor");
const popupLessons = document.getElementById("popupLessons");
const popupTestDate = document.getElementById("popupTestDate");
const popupFee = document.getElementById("popupFee");
const popupPaid = document.getElementById("popupPaid");
const createStudentBtn = document.getElementById("createStudent");

// ================================
// INITIALIZATION
// ================================
const params = new URLSearchParams(window.location.search);
const studentId = params.get("id");

function valueOrDash(value) {
  return (value === undefined || value === null || value === "") ? "—" : value;
}

// ================================
// LOAD STUDENT
// ================================
async function loadStudent() {
  if (!studentId) return;
  const snapshot = await getDoc(doc(db, "bookings", studentId));
  if (!snapshot.exists()) return;

  const student = snapshot.data();

  studentName.textContent = valueOrDash(student.name);
  studentPhone.textContent = valueOrDash(student.phone);
  studentVehicle.textContent = valueOrDash(student.vehicle);
  studentCourse.textContent = valueOrDash(student.course);
  studentInstructor.textContent = valueOrDash(student.instructor);
  studentTestDate.textContent = valueOrDash(student.testDate);
  
  const total = student.totalLessons || 21;
  const completed = student.lessonsCompleted || 0;
  totalLessons.textContent = total;

  progressFill.style.width = `${(completed / total) * 100}%`;
  progressText.textContent = `${completed} / ${total} Lessons Completed`;

  if (completed >= total) {
    nextLesson.textContent = "—";
    courseStatus.textContent = "Course Completed";
    completeLesson.style.display = "none";
    completeCourse.style.display = "block";
  } else {
    nextLesson.textContent = `Lesson ${completed + 1}`;
    courseStatus.textContent = "In Progress";
    completeLesson.style.display = "block";
    completeCourse.style.display = "none";
  }

  notes.value = student.notes || "";
  const fee = student.courseFee || 0;
  const paid = student.amountPaid || 0;
  const remaining = Math.max(fee - paid, 0);

  courseFee.textContent = fee ? `₹${fee}` : "—";
  amountPaid.textContent = fee ? `₹${paid}` : "—";
  amountRemaining.textContent = fee ? `₹${remaining}` : "—";
  paymentStatus.textContent = !fee ? "—" : (remaining === 0 ? "Paid" : (paid === 0 ? "Not Paid" : "Pending"));
}

// ================================
// ACTIONS
// ================================
saveNotes.addEventListener("click", async () => {
  await updateDoc(doc(db, "bookings", studentId), { notes: notes.value });
  alert("Notes Saved");
});

completeLesson.addEventListener("click", async () => {
  const snapshot = await getDoc(doc(db, "bookings", studentId));
  const student = snapshot.data();
  if ((student.lessonsCompleted || 0) < (student.totalLessons || 21)) {
    await updateDoc(doc(db, "bookings", studentId), { lessonsCompleted: (student.lessonsCompleted || 0) + 1 });
    loadStudent();
  }
});

// ================================
// EDIT STUDENT
// ================================
document.getElementById("editStudent").addEventListener("click", async () => {
  const snapshot = await getDoc(doc(db, "bookings", studentId));
  const data = snapshot.data();

  // Populate popup fields
  popupName.value = data.name || "";
  popupPhone.value = data.phone || "";
  popupVehicle.value = data.vehicle || "";
  popupCourse.value = data.course || "LMV";
  popupInstructor.value = data.instructor || "";
  popupLessons.value = data.totalLessons || 21;
  popupTestDate.value = data.testDate || "";
  popupFee.value = data.courseFee || 0;
  popupPaid.value = data.amountPaid || 0;

  // Set popup to Edit Mode and attach the Student ID
  document.querySelector("#studentPopup h2").textContent = "Edit Student";
  createStudentBtn.textContent = "Save Changes";
  createStudentBtn.dataset.mode = "edit";
  createStudentBtn.dataset.studentId = studentId; 
  
  studentPopup.classList.add("active");
});

// ================================
// BACK BUTTON
// ================================
backButton.addEventListener("click", () => {
  const from = params.get("from");
  if (from === "students") {
    window.location.href = "admin.html?page=students";
  } else {
    history.back();
  }
});
// ================================
// POPUP FUNCTIONALITY (Fixes Cancel & Save)
// ================================

// 1. Cancel Button
const cancelStudentBtn = document.getElementById("cancelStudent");
cancelStudentBtn.addEventListener("click", () => {
    studentPopup.classList.remove("active");
});

// 2. Save Changes / Create Student Button
createStudentBtn.addEventListener("click", async () => {
    // Only proceed if we are in Edit Mode
    if (createStudentBtn.dataset.mode === "edit") {
        try {
            // Read values from popup
            const updatedData = {
                name: popupName.value,
                phone: popupPhone.value,
                vehicle: popupVehicle.value,
                course: popupCourse.value,
                instructor: popupInstructor.value,
                totalLessons: Number(popupLessons.value),
                testDate: popupTestDate.value,
                courseFee: Number(popupFee.value),
                amountPaid: Number(popupPaid.value)
            };

            // Update Firestore
            await updateDoc(doc(db, "bookings", studentId), updatedData);
            
            // Close and Refresh
            studentPopup.classList.remove("active");
            alert("Student updated successfully!");
            location.reload(); // Refresh to show updated data
            
        } catch (error) {
            console.error("Error updating document:", error);
            alert("Failed to save changes.");
        }
    }
});

loadStudent();
