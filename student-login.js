// ================================
// FIREBASE
// ================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";

import {
    getFirestore,
    collection,
    getDocs
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
// HTML
// ================================
const phoneInput = document.getElementById("phoneNumber");
const passwordInput = document.getElementById("password");
const rememberMe = document.getElementById("rememberMe");
const loginButton = document.getElementById("loginButton");
const errorMessage = document.getElementById("errorMessage");
const forgotPassword = document.getElementById("forgotPassword");

// ================================
// AUTO FILL
// ================================
const savedPhone = localStorage.getItem("kadambaPhone");
const savedPassword = localStorage.getItem("kadambaPassword");

if(savedPhone){
    phoneInput.value = savedPhone;
    rememberMe.checked = true;
}

if(savedPassword){
    passwordInput.value = savedPassword;
}

// ================================
// LOGIN
// ================================
loginButton.addEventListener("click", async ()=>{

    errorMessage.textContent="";

    const phone = phoneInput.value.trim();
    const password = passwordInput.value.trim();

    if(phone==="" || password===""){
        errorMessage.textContent="Please enter phone number and password.";
        return;
    }

    const snapshot = await getDocs(collection(db,"bookings"));

    let found = false;

    snapshot.forEach(document=>{

        if(found) return;

        const student = document.data();

        if(
            student.phone===phone &&
            student.password===password &&
            student.status==="student"
        ){

            found=true;

            sessionStorage.setItem(
                "studentId",
                document.id
            );

            if(rememberMe.checked){

                localStorage.setItem(
                    "kadambaPhone",
                    phone
                );

                localStorage.setItem(
                    "kadambaPassword",
                    password
                );

            }else{

                localStorage.removeItem("kadambaPhone");
                localStorage.removeItem("kadambaPassword");

            }

            window.location.href="portal.html";

        }

    });

    if(!found){
        errorMessage.textContent="Incorrect phone number or password.";
    }

});

// ================================
// FORGOT PASSWORD
// ================================
forgotPassword.addEventListener("click",()=>{

    alert(
`Please contact Kadamba Motor Driving School to reset your password.`
    );

});