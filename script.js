const blurOverlay = document.getElementById("blurOverlay");
const menuButton = document.getElementById("menuButton");
const navMenu = document.getElementById("navMenu");
const navLinks = document.querySelectorAll(".navLinks a");

// ---------- MENU FUNCTIONS ----------

function openMenu() {
    navMenu.classList.add("active");
    blurOverlay.classList.add("active");
    menuButton.innerHTML = "✕";
}

function closeMenu() {
    navMenu.classList.remove("active");
    blurOverlay.classList.remove("active");
    menuButton.innerHTML = "☰";
}

// ---------- MENU BUTTON ----------

menuButton.addEventListener("click", function (e) {

    e.stopPropagation();

    if (navMenu.classList.contains("active")) {
        closeMenu();
    } else {
        openMenu();
    }

});

// ---------- CLOSE WHEN NAV LINK CLICKED ----------

navLinks.forEach(link => {

    link.addEventListener("click", function () {

        closeMenu();

    });

});

// ---------- CLOSE ON SCROLL ----------

window.addEventListener("scroll", function () {

    closeMenu();

});

// ---------- CLICK OUTSIDE TO CLOSE ----------

document.addEventListener("click", function (e) {

    if (
        !navMenu.contains(e.target) &&
        !menuButton.contains(e.target)
    ) {
        closeMenu();
    }

});

// ---------- BOOKING POPUP ----------

const popup = document.getElementById("bookingPopup");

const heroBookButton = document.getElementById("heroBookButton");

heroBookButton.addEventListener("click", function (e) {

    e.preventDefault();
    popup.style.display = "flex";

});

const bookButton = document.getElementById("bookButton");

bookButton.addEventListener("click", function (e) {

    e.preventDefault();
    popup.style.display = "flex";

});

const closePopup = document.getElementById("closePopup");

closePopup.addEventListener("click", function () {

    popup.style.display = "none";

});

// ---------- FIREBASE BOOKING ----------

const submitBooking = document.getElementById("submitBooking");

submitBooking.addEventListener("click", async function () {

    const name = document.getElementById("name");
    const phone = document.getElementById("phone");
    const vehicle = document.getElementById("vehicle");
    const time = document.getElementById("time");

    if (
        name.value.trim() === "" ||
        phone.value.trim() === ""
    ) {

        alert("Please enter your name and phone number.");
        return;

    }

    try {

        const { addDoc, collection } = await import(
            "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js"
        );

        await addDoc(
            collection(window.db, "bookings"),
            {
                name: name.value,
                phone: phone.value,
                vehicle: vehicle.value,
                preferredTime: time.value,
                status: "enquiry",
                submittedAt: new Date()
            }
        );

        popup.style.display = "none";

        alert("✅ Booking submitted successfully!");

    } catch (error) {

        console.error(error);

        alert("❌ Error saving booking.");

    }

});