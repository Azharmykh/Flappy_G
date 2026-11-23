// "Light and Deeds": a flappy-style game for kids.
// Dodge sins (blocks), collect good deeds (lanterns) to keep the light on.
(function () {
	var cv = document.getElementById("g-canvas");
	if (!cv) return;
	var ctx = cv.getContext("2d"), W = 480, H = 640, GROUND = 50;
	var $ = function (id) { return document.getElementById(id); };

	// Edit these lists freely. n = label on screen, t = short kid-friendly tip.
	var SINS = [
		{ n: "Lying", t: "Lying breaks trust. Always tell the truth." },
		{ n: "Stealing", t: "Taking what isn't yours hurts others. Ask first." },
		{ n: "Bullying", t: "Hurting others is wrong. Be gentle with everyone." },
		{ n: "Backbiting", t: "Don't say bad things about someone behind their back." },
		{ n: "Cheating", t: "Cheating is unfair. Do your own work honestly." },
		{ n: "Disobeying parents", t: "Our parents care for us. Listen to them politely." },
		{ n: "Wasting food", t: "Food is a blessing. Take only what you can eat." },
		{ n: "Showing off", t: "Do good to please Allah, not to impress people." },
		{ n: "Being greedy", t: "Share what you have. Don't keep it all to yourself." },
		{ n: "Bad temper", t: "Feeling angry? Stop, breathe, and calm down." }
	];
	var DEEDS = [
		{ n: "Bismillah", t: "Say Bismillah before you eat or start something." },
		{ n: "Honesty", t: "Telling the truth is always the best choice." },
		{ n: "Salam", t: "Greet people with Assalamu alaikum." },
		{ n: "Help parents", t: "Helping your parents at home is a good deed." },
		{ n: "Sharing", t: "Sharing with others is sadaqah (charity)." },
		{ n: "Smiling", t: "The Prophet Muhammad \uFDFA taught that a smile is charity." },
		{ n: "Alhamdulillah", t: "Say Alhamdulillah to thank Allah for His gifts." },
		{ n: "Praying", t: "Salah keeps us close to Allah." },
		{ n: "Forgiving", t: "Forgiving others is a beautiful thing to do." },
		{ n: "Kind to animals", t: "Being kind to animals is a good deed." },
		{ n: "Reading Quran", t: "Reading the Quran brings light to our hearts." }
	];

	var G = 1500, FLAP = -430, SPEED = 150, GAP = 175, BW = 92, R = 14;
	var state, bird, pipes, deeds, light, passed, deedCount, best = 0, spawn, n, toast, toastT, overAt = 0, over, clock = 0, last = 0;
	var stars = [];
	for (var i = 0; i < 40; i++) stars.push([Math.random() * W, Math.random() * (H - GROUND - 60), Math.random() * 2 + 1]);

	function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
	function reset() {
		bird = { x: 120, y: H / 2, vy: 0 };
		pipes = []; deeds = []; light = 100; passed = 0; deedCount = 0;
		spawn = 0.6; n = 0; toast = ""; toastT = 0; over = null;
	}
	function end(title, tip) {
		state = "over"; overAt = performance.now(); over = { title: title, tip: tip };
		if (passed > best) best = passed;
		$("g-msg").textContent = title + " " + tip + " Tap to try again.";
	}
	function flap() {
		if (state === "ready") { state = "play"; bird.vy = FLAP; $("g-msg").textContent = ""; }
		else if (state === "play") bird.vy = FLAP;
		else if (state === "over" && performance.now() - overAt > 600) { reset(); state = "ready"; }
	}
	cv.addEventListener("pointerdown", function (e) { e.preventDefault(); cv.focus({ preventScroll: true }); flap(); });
	cv.addEventListener("keydown", function (e) {
		if (e.code === "Space" || e.code === "ArrowUp" || e.key === "Enter") { e.preventDefault(); flap(); }
	});

	// Standalone page: keyboard works right away, even without clicking the canvas
	if (document.body.classList.contains("solo")) {
		window.addEventListener("keydown", function (e) {
			if (e.target === cv) return;
			if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); flap(); }
		});
		cv.focus({ preventScroll: true });
	}

	function hitsRect(rx, ry, rw, rh) {
		var cx = Math.max(rx, Math.min(bird.x, rx + rw)), cy = Math.max(ry, Math.min(bird.y, ry + rh));
		var dx = bird.x - cx, dy = bird.y - cy;
		return dx * dx + dy * dy < R * R;
	}

	function update(dt) {
		clock += dt;
		if (state === "ready") { bird.y = H / 2 + Math.sin(clock * 3) * 10; return; }
		if (state !== "play") return;

		bird.vy += G * dt; bird.y += bird.vy * dt;
		if (bird.y < R) { bird.y = R; bird.vy = 0; }
		if (bird.y + R >= H - GROUND) return end("Oops!", "Keep flapping to stay in the air.");

		light -= 6 * dt;
		if (light <= 0) { light = 0; return end("The light went out!", "Collect good deeds to keep it glowing."); }

		spawn -= dt;
		if (spawn <= 0) {
			spawn = 1.7;
			var gy = 90 + Math.random() * (H - GROUND - GAP - 180), s = pick(SINS);
			pipes.push({ x: W + 10, gy: gy, s: s, done: false });
			if (n % 2 === 0) deeds.push({ x: W + 10 + BW / 2, y: gy + GAP / 2, d: pick(DEEDS), got: false });
			n++;
		}

		for (var i = pipes.length - 1; i >= 0; i--) {
			var p = pipes[i]; p.x -= SPEED * dt;
			if (hitsRect(p.x, 0, BW, p.gy) || hitsRect(p.x, p.gy + GAP, BW, H - GROUND - p.gy - GAP)) {
				return end("Oops, you hit " + p.s.n.toLowerCase() + "!", p.s.t);
			}
			if (!p.done && p.x + BW < bird.x - R) { p.done = true; passed++; }
			if (p.x < -BW) pipes.splice(i, 1);
		}
		for (var j = deeds.length - 1; j >= 0; j--) {
			var d = deeds[j]; d.x -= SPEED * dt;
			var dx = d.x - bird.x, dy = d.y - bird.y;
			if (!d.got && dx * dx + dy * dy < (16 + R) * (16 + R)) {
				d.got = true; deedCount++; light = Math.min(100, light + 24);
				toast = d.d.n + ": " + d.d.t; toastT = 3.2;
				$("g-msg").textContent = toast;
			}
			if (d.got || d.x < -60) deeds.splice(j, 1);
		}
		if (toastT > 0) toastT -= dt;
	}

	function wrap(text, maxW) {
		var words = text.split(" "), lines = [], line = "";
		words.forEach(function (w) {
			var test = line ? line + " " + w : w;
			if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
		});
		lines.push(line); return lines;
	}
	function panel(lines, y) {
		ctx.font = "bold 18px sans-serif";
		var all = [];
		lines.forEach(function (l) { wrap(l.text, W - 100).forEach(function (x) { all.push({ text: x, color: l.color, size: l.size }); }); });
		var h = all.length * 28 + 30;
		ctx.fillStyle = "rgba(20,18,58,.94)"; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 3;
		ctx.fillRect(30, y, W - 60, h); ctx.strokeRect(30, y, W - 60, h);
		ctx.textAlign = "center";
		all.forEach(function (l, i) { ctx.fillStyle = l.color; ctx.font = (l.size || 18) + "px sans-serif"; ctx.fillText(l.text, W / 2, y + 36 + i * 28); });
	}
	function block(x, y, h, label, fromBottom) {
		ctx.fillStyle = "#2ec4b6"; ctx.fillRect(x, y, BW, h);
		ctx.fillStyle = "#1d8f85"; ctx.fillRect(x + BW * 0.72, y, BW * 0.28, h);
		ctx.strokeStyle = "#0d6b63"; ctx.lineWidth = 3; ctx.strokeRect(x, y, BW, h);
		ctx.fillStyle = "#14123a"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
		var lines = wrap(label, BW - 14);
		lines.forEach(function (l, i) {
			var ty = fromBottom ? y + h - 14 - (lines.length - 1 - i) * 17 : y + 24 + i * 17;
			ctx.fillText(l, x + BW / 2 - 6, ty);
		});
	}

	function draw() {
		var g = ctx.createLinearGradient(0, 0, 0, H);
		g.addColorStop(0, "#14123a"); g.addColorStop(1, "#3b3290");
		ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
		ctx.fillStyle = "#f3f0ff";
		stars.forEach(function (s) { ctx.fillRect(s[0], s[1], s[2], s[2]); });

		pipes.forEach(function (p) {
			block(p.x, -3, p.gy + 3, p.s.n, true);
			block(p.x, p.gy + GAP, H - GROUND - p.gy - GAP, p.s.n, false);
		});
		ctx.fillStyle = "#221d57"; ctx.fillRect(0, H - GROUND, W, GROUND);
		ctx.fillStyle = "#2ec4b6"; ctx.fillRect(0, H - GROUND, W, 5);

		// the light: darkness grows as it fades
		var f = light / 100, a = (1 - f) * 0.93, rad = 140 + f * 400;
		var dk = ctx.createRadialGradient(bird.x, bird.y, rad * 0.25, bird.x, bird.y, rad);
		dk.addColorStop(0, "rgba(8,6,30,0)"); dk.addColorStop(1, "rgba(8,6,30," + a + ")");
		ctx.fillStyle = dk; ctx.fillRect(0, 0, W, H);

		deeds.forEach(function (d) {
			ctx.fillStyle = "rgba(255,209,102,.25)"; ctx.beginPath(); ctx.arc(d.x, d.y, 28, 0, 7); ctx.fill();
			ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(d.x, d.y, 16, 0, 7); ctx.fill();
			ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
			ctx.lineWidth = 4; ctx.strokeStyle = "#14123a"; ctx.strokeText(d.d.n, d.x, d.y + 38);
			ctx.fillStyle = "#ffd166"; ctx.fillText(d.d.n, d.x, d.y + 38);
		});

		// bird (pixel art, same design as the website hero)
		ctx.save(); ctx.translate(bird.x, bird.y);
		ctx.rotate(Math.max(-0.5, Math.min(0.9, bird.vy / 800))); ctx.scale(3, 3);
		[[3, 0, 5, 1, "#ffd166"], [2, 1, 7, 6, "#ffd166"], [3, 7, 5, 1, "#ffd166"], [1, 4, 4, 2, "#e8963a"],
		 [7, 2, 2, 2, "#fff"], [8, 3, 1, 1, "#14123a"], [9, 4, 3, 2, "#ff5d5d"]].forEach(function (r) {
			ctx.fillStyle = r[4]; ctx.fillRect(r[0] - 6, r[1] - 4.5, r[2], r[3]);
		});
		ctx.restore();

		if (toastT > 0) panel([{ text: toast, color: "#ffd166", size: 16 }], H - GROUND - 110);
		if (state === "ready") panel([
			{ text: "Dodge the sins. Collect good deeds.", color: "#f3f0ff" },
			{ text: "Tap, click or press Space to start", color: "#ffd166", size: 16 }], 110);
		if (state === "over") panel([
			{ text: over.title, color: "#ffd166" },
			{ text: over.tip, color: "#f3f0ff", size: 16 },
			{ text: "Tap to try again", color: "#2ec4b6", size: 16 }], 110);

		$("g-deeds").textContent = deedCount; $("g-pass").textContent = passed; $("g-best").textContent = best;
		$("g-light").style.width = light + "%";
	}

	function loop(ts) {
		var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
		update(dt); draw(); requestAnimationFrame(loop);
	}
	reset(); state = "ready"; requestAnimationFrame(loop);
})();
