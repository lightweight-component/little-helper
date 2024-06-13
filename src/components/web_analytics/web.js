
!function () {
    setTimeout((function () {
        document.head && (document.head.innerHTML += '<meta property="og:site_counter_author" content="yestool"></meta><meta property="og:site_counter_author_url" content="https://webviso.yestool.org"></meta>');
    }), 500);

    const e = document.currentScript;
    let t = e.getAttribute("data-base-url"), o = e.getAttribute("data-page-pv-id"), n = e.getAttribute("data-page-uv-id");
    const r = { version: "0.0.0" };
    let i = "https://webviso.yestool.org";

    r.page_pv_id = "page_pv",
        r.page_uv_id = "page_uv",
        t && (i = t),
        o && (r.page_pv_id = o),
        n && (r.page_uv_id = n);

    r.init = async function () {
        const e = getLocation(window.location.href),
            t = document.getElementById(r.page_pv_id),
            o = document.getElementById(r.page_uv_id),
            n = { url: e.pathname, hostname: e.hostname, referrer: document.referrer };

        var a, s;
        t && (n.pv = !0), o && (n.uv = !0),
            await (a = `${i}/api/visit`, s = n, new Promise((e => {
                fetch(a, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(s)
                }).then((e => e.json()))
                    .then((function (t) { e(t) }))
                    .catch((e => { console.error(e) }))
            }))).then((e => {
                if ("OK" != e.ret)
                    return void console.error("WebViso.init error", e.message);
                const n = e.data;
                t && (t.innerText = n.pv), o && (o.innerText = n.uv)
            })).catch((e => {
                console.log("WebViso.init fetch error", e)
            }));
    };

    const getLocation = function (e) {
        const t = document.createElement("a");

        return t.href = e, t;
    };

    "undefined" != typeof window && (r.init(), window.WebViso = r);
}();