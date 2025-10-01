const SUPABASE_URL = "https://xvypmefacfzluuedusmg.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2eXBtZWZhY2Z6bHV1ZWR1c21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjU4ODIsImV4cCI6MjA3MzYwMTg4Mn0.LNbWOfpIqBOH2fOZJn0Fr97fNwu9jJYfg89dYEjk98I";

const POLL_INTERVAL_MS = 10_000;
const TOP_DONORS_LIMIT = 6;
const MAX_AGGREGATE_ROWS = 10_000;

const formatters = {
    usd: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: false
    }),
    tl: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: false
    }),
    plain: new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: false
    })
};

let supabaseClient = null;
let pollTimerId = null;

const params = new URLSearchParams(location.search);
const init = parseFloat(params.get("scale")) || 0;

if (init) {
    document.documentElement.style.setProperty("--ui-scale", String(init));
}

function setScale(v) {
    document.documentElement.style.setProperty("--ui-scale", v.toFixed(2));
}

function getScale() {
    return (
        parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--ui-scale")
        ) || 1
    );
}

document.addEventListener("keydown", (e) => {
    if (e.key === "+") {
        setScale(getScale() + 0.05);
    }
    if (e.key === "-") {
        setScale(Math.max(0.5, getScale() - 0.05));
    }
    if (e.key === "0") {
        setScale(1);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    setupFullscreenToggle();
    initializeSupabasePipeline();
});

function initializeSupabasePipeline() {
    if (!window.supabase) {
        console.error("Supabase client library is not loaded.");
        return;
    }

    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    fetchAndRenderDonationData();
    pollTimerId = window.setInterval(fetchAndRenderDonationData, POLL_INTERVAL_MS);

    window.addEventListener(
        "beforeunload",
        () => {
            stopPolling();
        },
        { once: true }
    );

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopPolling();
        } else if (!pollTimerId) {
            fetchAndRenderDonationData();
            pollTimerId = window.setInterval(fetchAndRenderDonationData, POLL_INTERVAL_MS);
        }
    });
}

function stopPolling() {
    if (pollTimerId) {
        clearInterval(pollTimerId);
        pollTimerId = null;
    }
}

async function fetchAndRenderDonationData() {
    if (!supabaseClient) return;

    try {
        const [
            usdTopRes,
            tlTopRes,
            usdTotalsRes,
            tlTotalsRes,
            latestUsdRes,
            latestTlRes
        ] = await Promise.all([
            supabaseClient
                .from("donations")
                .select("donor_name, amount_usd")
                .order("amount_usd", { ascending: false })
                .order("id", { ascending: false })
                .limit(TOP_DONORS_LIMIT),
            supabaseClient
                .from("donations_tl")
                .select("donor_name, amount_tl")
                .order("amount_tl", { ascending: false })
                .order("id", { ascending: false })
                .limit(TOP_DONORS_LIMIT),
            supabaseClient
                .from("donations")
                .select("amount_usd", { count: "exact" })
                .range(0, MAX_AGGREGATE_ROWS - 1),
            supabaseClient
                .from("donations_tl")
                .select("amount_tl", { count: "exact" })
                .range(0, MAX_AGGREGATE_ROWS - 1),
            supabaseClient
                .from("donations")
                .select("id, donor_name, amount_usd, created_at")
                .order("id", { ascending: false })
                .limit(1),
            supabaseClient
                .from("donations_tl")
                .select("id, donor_name, amount_tl, created_at")
                .order("id", { ascending: false })
                .limit(1)
        ]);

        if (usdTopRes.error) {
            console.warn("فشل جلب قائمة المتبرعين بالدولار", usdTopRes.error.message);
        } else {
            const usdEntries = (usdTopRes.data || []).map((row) => ({
                name: row.donor_name || "—",
                amount: Number(row.amount_usd) || 0
            }));
            renderDonorList(document.getElementById("top-usd"), usdEntries, "usd");
        }

        if (tlTopRes.error) {
            console.warn("فشل جلب قائمة المتبرعين بالليرة التركية", tlTopRes.error.message);
        } else {
            const tlEntries = (tlTopRes.data || []).map((row) => ({
                name: row.donor_name || "—",
                amount: Number(row.amount_tl) || 0
            }));
            renderDonorList(document.getElementById("top-tl"), tlEntries, "tl");
        }

        if (usdTotalsRes.error) {
            console.warn("فشل حساب إجمالي التبرعات بالدولار", usdTotalsRes.error.message);
        }
        if (tlTotalsRes.error) {
            console.warn("فشل حساب إجمالي التبرعات بالليرة التركية", tlTotalsRes.error.message);
        }

        const usdSum = Array.isArray(usdTotalsRes.data)
            ? usdTotalsRes.data.reduce(
                  (acc, row) => acc + Number(row.amount_usd || 0),
                  0
              )
            : 0;
        const usdCount =
            typeof usdTotalsRes.count === "number"
                ? usdTotalsRes.count
                : Array.isArray(usdTotalsRes.data)
                ? usdTotalsRes.data.length
                : 0;
        const tlSum = Array.isArray(tlTotalsRes.data)
            ? tlTotalsRes.data.reduce(
                  (acc, row) => acc + Number(row.amount_tl || 0),
                  0
              )
            : 0;
        const tlCount =
            typeof tlTotalsRes.count === "number"
                ? tlTotalsRes.count
                : Array.isArray(tlTotalsRes.data)
                ? tlTotalsRes.data.length
                : 0;

        if (usdTotalsRes.count && usdTotalsRes.count > MAX_AGGREGATE_ROWS) {
            console.warn(
                `تم جلب ${usdTotalsRes.count} متبرع بالدولار لكن سيتم احتساب أول ${MAX_AGGREGATE_ROWS} فقط في هذه الواجهة.`
            );
        }
        if (tlTotalsRes.count && tlTotalsRes.count > MAX_AGGREGATE_ROWS) {
            console.warn(
                `تم جلب ${tlTotalsRes.count} متبرع بالليرة التركية لكن سيتم احتساب أول ${MAX_AGGREGATE_ROWS} فقط في هذه الواجهة.`
            );
        }

        applyTotals({
            usd: usdSum,
            usdCount,
            tl: tlSum,
            tlCount
        });

        const latestUsd = normalizeLatestDonation(latestUsdRes, "usd", "amount_usd");
        const latestTl = normalizeLatestDonation(latestTlRes, "tl", "amount_tl");
        const latestDonation = pickMostRecentDonation([latestUsd, latestTl]);
        updateLatestDonorDisplay(latestDonation);
    } catch (error) {
        console.error("تعذر تحديث بيانات التبرعات", error);
    }
}

function applyTotals({ usd, usdCount, tl, tlCount }) {
    const totalUsdEl = document.getElementById("total-usd");
    const totalTlEl = document.getElementById("total-tl");
    const donorCountEl = document.getElementById("total-donors");

    if (totalUsdEl) {
        totalUsdEl.textContent = formatCurrency(usd, "usd");
    }
    if (totalTlEl) {
        totalTlEl.textContent = formatCurrency(tl, "tl");
    }
    if (donorCountEl) {
        const totalDonors = (usdCount || 0) + (tlCount || 0);
        donorCountEl.textContent = formatters.plain.format(totalDonors);
    }
}

function renderDonorList(listElement, values, currency) {
    if (!listElement) return;
    listElement.textContent = "";
    const fragment = document.createDocumentFragment();

    const entries = Array.isArray(values) ? values.slice(0, TOP_DONORS_LIMIT) : [];

    if (!entries.length) {
        fragment.appendChild(buildDonorListItem("—", 0, currency));
    } else {
        entries.forEach((item) => {
            fragment.appendChild(
                buildDonorListItem(item.name ?? "—", item.amount ?? 0, currency)
            );
        });
    }

    listElement.appendChild(fragment);
}

function buildDonorListItem(name, amount, currency) {
    const li = document.createElement("li");
    li.className = "donor-item";

    const nameSpan = document.createElement("span");
    nameSpan.className = "donor-name";
    nameSpan.textContent = name || "—";

    const amountSpan = document.createElement("span");
    amountSpan.className = "donor-amount";
    amountSpan.dir = "ltr";
    amountSpan.textContent = formatCurrency(amount, currency);

    li.append(nameSpan, amountSpan);
    return li;
}

function formatCurrency(amount, currency) {
    const numeric = Number(amount) || 0;
    const formatted = formatters[currency].format(numeric).replace(/\s+/g, "");
    if (currency === "tl") {
        return formatted.replace("TRY", "₺").replace("TL", "₺");
    }
    return formatted.replace("USD", "$").replace("US$", "$");
}

function normalizeLatestDonation(result, currency, amountField) {
    if (!result || result.error) {
        if (result?.error) {
            console.warn(`فشل جلب آخر متبرع (${currency})`, result.error.message);
        }
        return null;
    }

    const row = Array.isArray(result.data) && result.data.length ? result.data[0] : null;
    if (!row) {
        return null;
    }

    const createdAt = row.created_at ? new Date(row.created_at) : null;
    const idValue = row.id !== undefined ? Number(row.id) : null;

    return {
        name: row.donor_name || "—",
        amount: Number(row[amountField]) || 0,
        currency,
        createdAt: createdAt instanceof Date && !Number.isNaN(createdAt.valueOf()) ? createdAt : null,
        id: Number.isFinite(idValue) ? idValue : null
    };
}

function pickMostRecentDonation(entries) {
    return entries.filter(Boolean).reduce((latest, candidate) => {
        if (!latest) return candidate;
        const latestScore = deriveRecencyScore(latest);
        const candidateScore = deriveRecencyScore(candidate);
        return candidateScore > latestScore ? candidate : latest;
    }, null);
}

function deriveRecencyScore(entry) {
    if (!entry) return Number.NEGATIVE_INFINITY;
    if (entry.createdAt) {
        return entry.createdAt.getTime();
    }
    if (typeof entry.id === "number") {
        return entry.id;
    }
    return Number.NEGATIVE_INFINITY;
}

function updateLatestDonorDisplay(entry) {
    const nameEl = document.getElementById("latest-donor-name");
    const amountEl = document.getElementById("latest-donor-amount");

    if (!nameEl || !amountEl) {
        return;
    }

    if (!entry) {
        nameEl.textContent = "—";
        amountEl.textContent = "—";
        amountEl.dir = "ltr";
        return;
    }

    nameEl.textContent = entry.name || "—";
    amountEl.textContent = formatCurrency(entry.amount, entry.currency);
    amountEl.dir = "ltr";
}

function setupFullscreenToggle() {
    const toggleBtn = document.getElementById("fullscreen-toggle");
    if (!toggleBtn) return;

    const root = document.documentElement;

    toggleBtn.addEventListener("click", async () => {
        try {
            if (!document.fullscreenElement) {
                await root.requestFullscreen({ navigationUI: "hide" });
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.warn("Fullscreen request failed", error);
        }
    });

    document.addEventListener("fullscreenchange", () => {
        const presenting = Boolean(document.fullscreenElement);
        document.body.classList.toggle("presentation", presenting);
    });
}
