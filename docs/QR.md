# Generating the QR code

The QR code must point at the **real deployed HTTPS URL** (see `DEPLOYMENT.md`). It cannot be generated before the site
is deployed, because there is no real address yet.

## Option 1 — The included generator page (no installs)

1. Open `tools/qr.html` in any browser (double-click it, or open `https://<your-site>/tools/qr.html` after deploying).
2. Paste the deployed URL, e.g. `https://<account>.github.io/uae55-family-story/`.
3. Click **Generate** and then **Download PNG** (1024 × 1024, error correction level M, ink `#111820` on white).

## Option 2 — Inside the experience

On the final screen, **شارك التجربة (رمز QR)** draws a QR code for the address currently open. Once the experience is
deployed, this always encodes the real URL. Visitors can show it to the next person.

## Option 3 — Command line

```bash
npx qrcode -o uae55-qr.png -w 1024 -e M "https://<account>.github.io/uae55-family-story/"
# or (Linux/macOS with qrencode installed)
qrencode -o uae55-qr.png -s 24 -l M "https://<account>.github.io/uae55-family-story/"
```

## Print guidance

* Print the code at least **3 × 3 cm** for scanning from a table, or **8 × 8 cm** on a standing poster.
* Keep a white quiet zone of at least four modules around the code.
* Put an Arabic call to action beside it, for example: «امسح الرمز وافتح باب البيت» (Scan the code and open the door), plus "Android: Chrome · iPhone: Safari".
* Always test-scan the printed code on Android and iPhone before the event.
