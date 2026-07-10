/**
 * Test unitario della validazione URL (`src/lib/url-validation.ts`), review
 * Codex #4. Copre il percorso felice e — soprattutto — lo spoofing degli host
 * Google (`google.com.evil.com`, `evilgoogle.com`, ecc.), che è il punto del
 * controllo: si confronta l'hostname vero, non una substring.
 *
 * Uso:  parte di `npm run test:unit`.
 */
import {
  isHttpsUrl,
  isRootRelative,
  isImageRef,
  isGoogleUrl,
} from "../src/lib/url-validation.ts";

let failures = 0;
function ok(cond, label) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${label}`);
  }
}

console.log("\nAssertion su url-validation:");

// isHttpsUrl
ok(isHttpsUrl("https://example.com/x") === true, "https valido accettato");
ok(isHttpsUrl("http://example.com") === false, "http rifiutato");
ok(isHttpsUrl("ftp://example.com") === false, "ftp rifiutato");
ok(isHttpsUrl("javascript:alert(1)") === false, "javascript: rifiutato");
ok(isHttpsUrl("non è un url") === false, "stringa non-URL rifiutata");

// isRootRelative
ok(isRootRelative("/icon.svg") === true, "path root-relative accettato");
ok(isRootRelative("//evil.com") === false, "protocol-relative // rifiutato");
ok(isRootRelative("icon.svg") === false, "relativo senza slash rifiutato");

// isImageRef: https OR path relativo, niente altro
ok(isImageRef("/hero-trastevere.svg") === true, "immagine: path relativo ok");
ok(isImageRef("https://cdn.example.com/a.jpg") === true, "immagine: https ok");
ok(isImageRef("http://cdn.example.com/a.jpg") === false, "immagine: http no");
ok(isImageRef("data:image/png;base64,AAAA") === false, "immagine: data: no");
ok(isImageRef("//evil.com/a.jpg") === false, "immagine: protocol-relative no");

// isGoogleUrl — host Google legittimi
for (const u of [
  "https://g.page/r/abc",
  "https://maps.app.goo.gl/xyz",
  "https://goo.gl/maps/abc",
  "https://www.google.com/maps/place/x",
  "https://search.google.com/local/writereview?placeid=1",
  "https://www.google.it/maps/x",
  "https://maps.google.co.uk/x",
]) {
  ok(isGoogleUrl(u) === true, `google valido: ${u}`);
}

// isGoogleUrl — spoofing e schemi errati: TUTTI rifiutati
for (const u of [
  "https://google.com.evil.com/x", // dominio finale evil.com
  "https://evilgoogle.com/x", // non è .google.com
  "https://google.evil.com/x", // google è sottodominio, non il dominio
  "https://notgoogle.com/x",
  "https://maps.app.goo.gl.evil.com/x", // short host come sottodominio di evil
  "http://www.google.com/x", // non https
  "https://gooogle.com/x", // typo
]) {
  ok(isGoogleUrl(u) === false, `google rifiutato: ${u}`);
}

if (failures > 0) {
  console.error(`\n${failures} assertion url-validation fallite ✗`);
  process.exit(1);
}
console.log("\nTutte le assertion url-validation sono passate ✓");
