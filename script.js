const track = document.getElementById('track'),
    cv = document.getElementById('cv'),
    ctx = cv.getContext('2d'),
    vd = document.getElementById('vd'),
    bar = document.getElementById('bar');
const steps = [...document.querySelectorAll('.step')];
const pal = [
    [255, 157, 77],
    [120, 170, 255],
    [255, 120, 150],
    [160, 220, 160],
    [255, 210, 110],
    [255, 120, 60]
];
let W, H, target = 0,
    cur = 0,
    useVideo = false;

function size() {
    const d = Math.min(devicePixelRatio || 1, 1.5);
    W = cv.width = innerWidth * d;
    H = cv.height = innerHeight * d
}
addEventListener('resize', () => {
    size();
    lastP = -1
});
size();

function draw(p) {
    ctx.fillStyle = '#0a0705';
    ctx.fillRect(0, 0, W, H);
    const i = Math.min(5, Math.floor(p * 6)),
        c = pal[i],
        cx = W / 2,
        cy = H * .48,
        t = p * 14,
        fr = t % 1;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * .6);
    g.addColorStop(0, `rgba(${c},.35)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (let k = 16; k >= 0; k--) {
        const z = k - fr + .4,
            s = 1 / (z * .55 + .15),
            w = W * .5 * s,
            h = H * .62 * s,
            a = Math.max(0, Math.min(1, 1.2 - z / 14));
        const lit = (Math.floor(t) + k) % 3 === 0;
        ctx.strokeStyle = `rgba(${c},${a*(lit?.9:.35)})`;
        ctx.lineWidth = Math.max(1, 3 * s);
        ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
        if (lit) {
            ctx.fillStyle = `rgba(${c},${a*.08})`;
            ctx.fillRect(cx - w / 2, cy - h / 2, w, h)
        }
    }
}
let frames = [],
    lastP = -1;
async function initVideo() {
    const ld = document.getElementById('ld'),
        lt = document.getElementById('ldt');
    const mobile = innerWidth < 700;
    const names = ['assets/vid-kos.mp4', 'assets/vid-kos.MOV'];
    const waitFor = (ev, ms) => new Promise(r => {
        let d;
        const f = v => {
            if (!d) {
                d = 1;
                r(v)
            }
        };
        vd[ev] = () => f(true);
        vd.onerror = () => f(false);
        setTimeout(() => f(false), ms)
    });
    try {
        let ok = false;
        for (const n of names) {
            vd.src = n;
            vd.load();
            ok = await waitFor('onloadedmetadata', 12000);
            if (ok && vd.videoWidth) break;
            ok = false;
        }
        if (!ok) throw 0;
        const N = mobile ? 100 : 150,
            sc = Math.min(1, (mobile ? 640 : 800) / Math.max(vd.videoWidth, vd.videoHeight)),
            out = [];
        let fails = 0;
        for (let i = 0; i < N; i++) {
            vd.currentTime = Math.max(.01, Math.min(vd.duration - .01, i / (N - 1) * vd.duration));
            if (await waitFor('onseeked', 4000)) {
                try {
                    out.push(await createImageBitmap(vd, {
                        resizeWidth: Math.round(vd.videoWidth * sc),
                        resizeHeight: Math.round(vd.videoHeight * sc)
                    }))
                } catch (e) {
                    fails++
                }
            } else fails++;
            if (fails > 5) throw 0;
            lt.textContent = 'Memuat ' + Math.round((i + 1) / N * 100) + '%';
        }
        if (out.length < 20) throw 0;
        frames = out;
        lastP = -1;
    } catch (e) {}
    ld.classList.add('done');
}

function drawFrame(p) {
    const im = frames[Math.round(p * (frames.length - 1))];
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H); {
        const s = Math.max(W / im.width, H / im.height);
        ctx.drawImage(im, (W - im.width * s) / 2, (H - im.height * s) / 2, im.width * s, im.height * s)
    }
    ctx.globalAlpha = 1;
}

function onScroll() {
    const r = track.getBoundingClientRect(),
        max = track.offsetHeight - innerHeight;
    target = Math.max(0, Math.min(1, -r.top / max));
}
addEventListener('scroll', onScroll, {
    passive: true
});
onScroll();

function loop() {
    cur += (target - cur) * .12;
    if (Math.abs(target - cur) < .0003) cur = target;
    if (cur !== lastP) {
        lastP = cur;
        frames.length ? drawFrame(cur) : draw(cur)
    }
    bar.style.width = cur * 100 + '%';
    document.getElementById('hint').style.opacity = cur < .03 ? 1 : 0;
    steps.forEach((el, n) => {
        const c = n === 0 ? 0.0 : (n - .5) / 5.2 + .02,
            d = Math.abs(cur - c),
            o = n === 0 ? Math.max(0, 1 - cur / .1) : Math.max(0, 1 - d / .075);
        el.style.opacity = o;
        el.style.transform = `translateY(${(1-o)*24}px)`;
    });
    requestAnimationFrame(loop);
}
loop();
initVideo();
const tp = document.getElementById('tp'),
    dr = document.getElementById('dr'),
    tot = document.getElementById('tot');

function calc() {
    const m = +dr.value,
        disc = 1,
        sum = Math.round(+tp.value * m * disc);
    tot.textContent = 'Rp' + sum.toLocaleString('id-ID') + ' / ' + m + ' bulan (±Rp' + Math.round(sum / m).toLocaleString('id-ID') + '/bln)'
}
tp.onchange = dr.onchange = calc;
calc();
const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('on')
}), {
    threshold: .15
});
document.querySelectorAll('.rv').forEach(el => io.observe(el));
