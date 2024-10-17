document.addEventListener("DOMContentLoaded", () => {
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    const isDarkMode = localStorage.getItem("darkMode") === "enabled";


    if (isDarkMode) {
        document.body.classList.add("dark-mode");
    }

    // Event listener for dark mode toggle
    darkModeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        if (document.body.classList.contains("dark-mode")) {
            localStorage.setItem("darkMode", "enabled");
        } else {
            localStorage.removeItem("darkMode");
        }
    });

    // Fetch Random Hadith
    fetchRandomHadith();

    // Show/Hide Hadith functionality
    const hadithElement = document.getElementById("random-hadith");
    const showHadithButton = document.getElementById("show-hadith-btn");
    const prayerTimesElement = document.getElementById("prayer-times");
    const nextPrayerElement = document.querySelector('.countdown');

    showHadithButton.addEventListener("click", () => {
        if (hadithElement.classList.contains("collapsed-hadith")) {
            hadithElement.classList.remove("collapsed-hadith");
            hadithElement.classList.add("expanded-hadith");
            prayerTimesElement.style.display = 'none';
            nextPrayerElement.style.display = 'none';
            showHadithButton.innerText = "Hide Hadith";
        } else {
            hadithElement.classList.remove("expanded-hadith");
            hadithElement.classList.add("collapsed-hadith");
            prayerTimesElement.style.display = 'block';
            nextPrayerElement.style.display = 'block';
            showHadithButton.innerText = "Show Hadith";
        }
    });

    // Geolocation and fetching prayer times
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchPrayerTimes(latitude, longitude);
                fetchHijriDate();
            },
            () => {
                document.getElementById("location").innerText =
                    "Unable to retrieve location.";
            }
        );
    } else {
        document.getElementById("location").innerText =
            "Geolocation is not supported by this browser.";
    }

    fetchPrayerTimes();
});

function fetchRandomHadith() {
    const apiUrl = "https://random-hadith-generator.vercel.app/bukhari/";

    fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            document.getElementById("random-hadith").innerHTML = `
                <h3>Random Hadith of the Day</h3>
                <p>${data.data.book}</p>
                <p>${data.data.bookName}</p>
                <p>${data.data.chapterName}</p>
                <p>${data.data.hadith_english}</p>
                <p>${data.data.header}</p>
                <p>${data.data.refno}</p>
            `;
        })
        .catch(() => {
            document.getElementById("random-hadith").innerText =
                "Unable to retrieve Hadith.";
        });
}

function fetchPrayerTimes(lat, long) {
    const apiUrl = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${long}&method=2`;

    fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            const timings = data.data.timings;
            const location = data.data.meta.timezone;
            document.getElementById("location").innerText = `Location: ${location}`;

            const prayerTimesList = document.getElementById("prayer-times");
            prayerTimesList.innerHTML = `
                <li>Fajr: ${timings.Fajr}</li>
                <li>Dhuhr: ${timings.Dhuhr}</li>
                <li>Asr: ${timings.Asr}</li>
                <li>Maghrib: ${timings.Maghrib}</li>
                <li>Isha: ${timings.Isha}</li>
            `;

            updateNextPrayer(timings);
        })
        .catch(() => {
            document.getElementById("location").innerText =
                "Unable to retrieve prayer times.";
        });
}

function fetchHijriDate() {
    const today = new Date();
    const date = today.toISOString().split("T")[0];
    const formattedDate = date.split("-").reverse().join("-");
    const apiUrl = "https://api.aladhan.com/v1/gToH/" + formattedDate;

    fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            const hijriDate = data.data.hijri.date;
            document.getElementById(
                "hijri-date"
            ).innerText = `Hijri Date: ${hijriDate}`;
        })
        .catch(() => {
            document.getElementById("hijri-date").innerText =
                "Unable to retrieve Hijri date.";
        });
}

function updateNextPrayer(timings) {
    const prayerTimes = Object.keys(timings).map((prayer) => ({
        name: prayer,
        time: timings[prayer],
    }));

    const now = new Date();
    let nextPrayer = null;

    for (let i = 0; i < prayerTimes.length; i++) {
        const prayerTime = new Date();
        const [hour, minute] = prayerTimes[i].time.split(":");
        prayerTime.setHours(hour, minute, 0);

        if (prayerTime > now) {
            nextPrayer = prayerTimes[i];
            break;
        }
    }

    if (nextPrayer) {
        document.getElementById("next-prayer").innerText = nextPrayer.name;
        startCountdown(nextPrayer.time);
    }
}

function startCountdown(nextPrayerTime) {
    const [nextHour, nextMinute] = nextPrayerTime.split(":");
    const nextPrayerDate = new Date();
    nextPrayerDate.setHours(nextHour, nextMinute, 0);

    const interval = setInterval(() => {
        const now = new Date();
        const diff = nextPrayerDate - now;

        if (diff <= 0) {
            clearInterval(interval);
            document.getElementById("countdown-timer").innerText = "Time for prayer!";
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById(
            "countdown-timer"
        ).innerText = `${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}
